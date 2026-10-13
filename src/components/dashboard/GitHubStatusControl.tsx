"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import GithubLinkCard, { GitHubIcon } from "@/components/onboarding/GithubLinkCard";
import { useAuth } from "@/contexts/AuthContext";
import { githubApi } from "@/lib/api/github";

interface GitHubStatusControlProps {
  sidebarOpen: boolean;
}

export default function GitHubStatusControl({ sidebarOpen }: GitHubStatusControlProps) {
  const { user, refreshUser } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const [promptMode, setPromptMode] = useState<"connect" | "change">("connect");
  const [checking, setChecking] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  if (!user) return null;

  const githubLinked = user.github?.linked === true;
  const githubLogin = user.github?.gh_login;

  const closeMenu = () => setMenuOpen(false);

  const openConnectPrompt = () => {
    closeMenu();
    setPromptMode("connect");
    setPromptOpen(true);
  };

  const openChangePrompt = () => {
    closeMenu();
    setPromptMode("change");
    setPromptOpen(true);
  };

  const handleStatusClick = () => {
    if (!githubLinked) {
      openConnectPrompt();
      return;
    }

    setMenuOpen((open) => !open);
  };

  const handleRefreshStatus = async () => {
    setChecking(true);
    closeMenu();

    try {
      const status = await githubApi.getStatus();
      await refreshUser();
      toast.success(
        status.linked
          ? `GitHub connected${status.gh_login ? ` as @${status.gh_login}` : ""}`
          : "GitHub is not connected",
      );
    } catch {
      toast.error("Could not refresh GitHub status");
    } finally {
      setChecking(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    closeMenu();

    try {
      await githubApi.unlink();
      await refreshUser();
      toast.success("GitHub disconnected");
    } catch {
      toast.error("Could not disconnect GitHub");
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="relative">
      {menuOpen && githubLinked && (
        <>
          <button
            type="button"
            aria-label="Close GitHub account menu"
            className="fixed inset-0 z-30 cursor-default"
            onClick={closeMenu}
          />
          <div
            className={`absolute z-40 rounded-xl border border-border bg-popover p-1.5 shadow-overlay ${
              sidebarOpen
                ? "bottom-full left-0 right-0 mb-2"
                : "bottom-0 left-full ml-2 w-64"
            }`}
          >
            <div className="px-3 py-2 border-b border-border">
              <p className="text-xs font-semibold text-foreground">GitHub account</p>
              <p className="truncate text-xs text-primary-soft-foreground font-medium">
                {githubLogin ? `@${githubLogin}` : "Connected"}
              </p>
            </div>
            <button
              type="button"
              onClick={openChangePrompt}
              className="mt-2 w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-foreground/80 transition-colors hover:bg-primary-soft hover:text-primary-soft-foreground"
            >
              Change account
            </button>
            <button
              type="button"
              onClick={handleRefreshStatus}
              disabled={checking}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-wait disabled:opacity-60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${checking ? "animate-spin" : ""}`} />
              Check status
            </button>
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-danger transition-colors hover:bg-danger-soft disabled:cursor-wait disabled:opacity-60"
            >
              {disconnecting ? "Disconnecting..." : "Disconnect account"}
            </button>
          </div>
        </>
      )}

      <button
        type="button"
        onClick={handleStatusClick}
        className={`relative flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors group ${
          githubLinked
            ? "border-border bg-card text-foreground hover:bg-muted"
            : "border-warning/40 bg-warning-soft text-foreground hover:bg-warning-soft/70"
        }`}
        title={
          githubLinked
            ? `GitHub connected${githubLogin ? ` as @${githubLogin}` : ""}`
            : "Connect GitHub"
        }
        aria-label={
          githubLinked
            ? `GitHub connected${githubLogin ? ` as ${githubLogin}` : ""}. Open account options.`
            : "GitHub not connected. Connect GitHub."
        }
      >
        <GitHubIcon className="h-5 w-5 shrink-0 text-foreground/80" />
        <span className={`min-w-0 flex-1 text-left ${!sidebarOpen && "lg:hidden"}`}>
          <span className="block text-[13px] font-semibold leading-tight text-foreground">
            {githubLinked ? "GitHub connected" : "Connect GitHub"}
          </span>
          <span className="block truncate pt-0.5 text-xs text-muted-foreground">
            {githubLinked
              ? githubLogin
                ? `@${githubLogin}`
                : "Linked"
              : "Not linked"}
          </span>
        </span>
        {githubLinked ? (
          <CheckCircle2 className={`h-4 w-4 text-brand ${!sidebarOpen && "lg:hidden"}`} />
        ) : (
          <AlertCircle className={`h-4 w-4 text-warning ${!sidebarOpen && "lg:hidden"}`} />
        )}
        <span
          className={`absolute right-2 top-2 h-2 w-2 rounded-full ${sidebarOpen ? "hidden" : "block"} ${
            githubLinked ? "bg-brand" : "bg-warning"
          }`}
        />
      </button>

      {promptOpen && typeof document !== "undefined" && createPortal(
        <GithubLinkCard
          mode={promptMode}
          previousLogin={githubLogin}
          previousLinkedAt={user.github?.linked_at}
          onDismiss={() => setPromptOpen(false)}
          onLinked={() => setPromptOpen(false)}
        />,
        document.body,
      )}
    </div>
  );
}
