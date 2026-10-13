"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, Sparkles, Terminal, X } from "lucide-react";
import { toast } from "sonner";
import AuthCard from "@/components/auth/AuthCard";
import AuthButton from "@/components/auth/AuthButton";
import { githubApi } from "@/lib/api/github";
import { useAuth } from "@/contexts/AuthContext";

const POLL_INTERVAL_MS = 2000;
// After the popup closes without success, give the backend one more poll
// before assuming the user cancelled.
const CANCEL_GRACE_MS = 3000;

export const GitHubIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

type GithubLinkCardProps = {
  onLinked?: () => void;
  onDismiss?: () => void;
  mode?: "connect" | "change";
  previousLogin?: string;
  previousLinkedAt?: string;
};

export default function GithubLinkCard({
  onLinked,
  onDismiss,
  mode = "connect",
  previousLogin,
  previousLinkedAt,
}: GithubLinkCardProps) {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [linking, setLinking] = useState(false);
  const [navigatingToSandbox, setNavigatingToSandbox] = useState(false);
  const popupRef = useRef<Window | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopPolling();
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }
    };
  }, []);

  const handleConnect = async () => {
    if (linking) return;
    setLinking(true);

    let url: string;
    try {
      ({ url } = await githubApi.oauthStart());
    } catch (err) {
      const status = (err as { status?: number }).status;
      toast.error(
        status === 401
          ? "Session expired — please log in again"
          : "Could not start GitHub sign-in — please try again",
      );
      setLinking(false);
      return;
    }

    const popup = window.open(
      url,
      "gh-oauth",
      "width=720,height=820,popup=yes",
    );
    if (!popup) {
      toast.error("Popup blocked — please allow popups and try again");
      setLinking(false);
      return;
    }
    popupRef.current = popup;
    toast.info("Redirecting to GitHub…");

    // Poll the backend for link status. Cross-Origin-Opener-Policy on
    // github.com severs window.opener, so postMessage from the OAuth
    // callback is unreliable — polling is the source of truth.
    let resolved = false;
    let popupClosedAt: number | null = null;

    intervalRef.current = setInterval(async () => {
      if (resolved) return;

      try {
        if (popup.closed && popupClosedAt === null) {
          popupClosedAt = Date.now();
        }
      } catch {
        /* cross-origin read may throw — assume still open */
      }

      try {
        const status = await githubApi.getStatus();
        const changedAccount =
          mode === "connect" ||
          status.gh_login !== previousLogin ||
          (!!status.linked_at && status.linked_at !== previousLinkedAt);

        if (status.linked && status.gh_login && changedAccount) {
          resolved = true;
          stopPolling();
          toast.success(
            mode === "change"
              ? `GitHub account changed to @${status.gh_login}`
              : `GitHub linked successfully as @${status.gh_login}`,
          );
          try {
            await refreshUser();
          } catch {
            /* non-fatal — page reload will reconcile */
          }
          setLinking(false);
          onLinked?.();
          return;
        }
      } catch {
        /* network blip — keep polling */
      }

      if (
        popupClosedAt !== null &&
        Date.now() - popupClosedAt > CANCEL_GRACE_MS
      ) {
        resolved = true;
        stopPolling();
        setLinking(false);
        if (mode === "change") onDismiss?.();
      }
    }, POLL_INTERVAL_MS);
  };

  const handlePracticeInSandbox = () => {
    stopPolling();
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
    }
    setLinking(false);
    setNavigatingToSandbox(true);
    onDismiss?.();
    router.push("/knowledge-assist/sandbox?source=github-dialog");
  };

  if (navigatingToSandbox) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/70 p-4 animate-fade-in">
      <AuthCard className="max-w-lg">
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-2 relative">
            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="absolute right-0 top-0 p-2 rounded-full text-subtle-foreground hover:text-foreground hover:bg-surface-3 transition-colors"
                aria-label="Close GitHub account dialog"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 dark:text-teal-400 bg-teal-400/10 border border-teal-400/20 rounded-full px-3 py-1">
              <Sparkles className="w-3 h-3" />
              {mode === "change" ? "Account management" : "One last step"}
            </span>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
              {mode === "change" ? "Change GitHub account" : "Connect your GitHub"}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {mode === "change"
                ? "Choose a different GitHub account in the popup. If GitHub opens the current account automatically, switch accounts inside GitHub before approving."
                : "Mentora analyzes your public repository activity to personalize your learning path. We never push to your repos and you can disconnect anytime from settings."}
            </p>
          </div>

          {/* Permissions list */}
          <div className="rounded-2xl border border-border bg-muted p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal-500/15 border border-teal-500/30 flex items-center justify-center shrink-0">
                <GitHubIcon className="w-4 h-4 text-teal-700 dark:text-teal-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Read your repository metadata
                </p>
                <p className="text-xs text-muted-foreground">
                  Repo names, languages, and commit history — read-only.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4 text-amber-700 dark:text-amber-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Encrypted at rest
                </p>
                <p className="text-xs text-muted-foreground">
                  Your access token is AES-256-GCM encrypted and never exposed
                  to the browser.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <AuthButton
            onClick={handleConnect}
            loading={linking}
            type="button"
          >
            <span className="flex items-center justify-center gap-2">
              <GitHubIcon className="w-4 h-4" />
              {mode === "change" ? "Choose GitHub account" : "Connect GitHub"}
            </span>
          </AuthButton>

          {mode === "connect" && (
            <button
              type="button"
              onClick={handlePracticeInSandbox}
              className="w-full rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-3 text-left transition-all hover:border-cyan-300/40 hover:bg-cyan-400/15"
            >
              <span className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-400/10 text-cyan-800 dark:text-cyan-200">
                    <Terminal className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-cyan-800 dark:text-cyan-100">
                      Don&apos;t have a GitHub account?
                    </span>
                    <span className="mt-0.5 block text-xs text-subtle-foreground">
                      Practice Java questions in the sandbox instead.
                    </span>
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-cyan-800 dark:text-cyan-200" />
              </span>
            </button>
          )}

          <p className="text-center text-[11px] text-subtle-foreground leading-relaxed">
            By connecting, you authorize Mentora to read your GitHub profile
            and repositories.
          </p>
        </div>
      </AuthCard>
    </div>
  );
}
