"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  Cpu,
  GitBranch,
  Lock,
  RefreshCw,
  Search,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Terminal,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  LlmChoice,
  LlmOptions,
  ReviewJob,
  ReviewRepo,
  ReviewRepoResult,
  reviewApi,
} from "@/lib/api/review";
import { ActiveReviewState, useActiveReview } from "@/contexts/ActiveReviewContext";

const MAX_SELECTED_REPOS = 5;

type SandboxRedirect = {
  href: string;
  jobId: string;
};

const statusStyle = {
  queued: "border-border bg-muted text-muted-foreground",
  running: "border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-200",
  done: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200",
  error: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-200",
  partial: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-200",
  failed: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-200",
} as const;

const severityStyle = {
  low: "border-cyan-500/25 bg-cyan-500/10 text-cyan-700 dark:text-cyan-200",
  medium: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-200",
  high: "border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-200",
} as const;

const getMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unexpected error";

function formatRepoMeta(repo: ReviewRepo) {
  const bits = [
    repo.language || "Mixed",
    repo.private ? "Private" : "Public",
    `${repo.size} KB`,
  ];
  return bits.join(" / ");
}

function mergeSingleRepoResult(current: ReviewJob | null, next: ReviewJob): ReviewJob {
  const replacement = next.repos[0];
  if (!current || !replacement) return next;

  return {
    ...current,
    updated_at: next.updated_at,
    repos: current.repos.map((repo) =>
      repo.full_name === replacement.full_name ? replacement : repo,
    ),
  };
}

export default function KnowledgeAssistForensicsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reviewJobId = searchParams.get("reviewJobId");
  const { user, isLoading } = useAuth();
  const { activeReview, sandboxHref, trackReviewJob } = useActiveReview();
  const githubLinked = user?.github?.linked === true;
  const githubLogin = user?.github?.gh_login;
  const activeReviewIsRunning = activeReview?.status === "running";

  const [repos, setRepos] = useState<ReviewRepo[]>([]);
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [runningReview, setRunningReview] = useState(false);
  const [rerunningRepo, setRerunningRepo] = useState<string | null>(null);
  const [job, setJob] = useState<ReviewJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [repoSearch, setRepoSearch] = useState("");
  const [sandboxRedirect, setSandboxRedirect] = useState<SandboxRedirect | null>(null);
  const [selectedLlm, setSelectedLlm] = useState<LlmChoice>("gemini");
  const [llmOptions, setLlmOptions] = useState<LlmOptions | null>(null);

  const selectedCount = selectedRepos.length;
  const ollamaAvailable = llmOptions?.ollama_available ?? false;
  const ollamaStatusMessage =
    llmOptions === null
      ? "Checking local model status..."
      : ollamaAvailable
        ? "Local model is ready for offline / no-cost reviews."
        : "Local model is still downloading. Ollama will enable automatically when it is ready.";

  const reportStats = useMemo(() => {
    const reports = job?.repos ?? [];
    const completed = reports.filter((repo) => repo.status === "done").length;
    const failed = reports.filter((repo) => repo.status === "error").length;
    const defects = reports.reduce(
      (sum, repo) => sum + (repo.review?.errors.length ?? 0),
      0,
    );
    const high = reports.reduce(
      (sum, repo) =>
        sum + (repo.review?.errors.filter((item) => item.severity === "high").length ?? 0),
      0,
    );
    return { completed, failed, defects, high };
  }, [job]);

  const filteredAndOrderedRepos = useMemo(() => {
    const query = repoSearch.toLowerCase().trim();
    const filtered = query
      ? repos.filter(
          (r) =>
            r.full_name.toLowerCase().includes(query) ||
            (r.language ?? "").toLowerCase().includes(query),
        )
      : repos;

    return [...filtered].sort((a, b) => {
      const aSelected = selectedRepos.includes(a.full_name) ? 0 : 1;
      const bSelected = selectedRepos.includes(b.full_name) ? 0 : 1;
      if (aSelected !== bSelected) return aSelected - bSelected;
      if (a.language === "Java" && b.language !== "Java") return -1;
      if (a.language !== "Java" && b.language === "Java") return 1;
      return a.full_name.localeCompare(b.full_name);
    });
  }, [repos, selectedRepos, repoSearch]);

  useEffect(() => {
    if (!githubLinked || isLoading) return;

    const loadRepos = async () => {
      setLoadingRepos(true);
      setError(null);
      try {
        const selection = await reviewApi.selectRepos();
        setRepos(selection.repos);
        setSelectedRepos(selection.selected.map((repo) => repo.full_name));
      } catch (err) {
        setError(getMessage(err));
      } finally {
        setLoadingRepos(false);
      }
    };

    loadRepos();
  }, [githubLinked, isLoading]);

  useEffect(() => {
    if (!githubLinked || isLoading) return;

    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const loadLlmOptions = async () => {
      try {
        const options = await reviewApi.getLlmOptions();
        if (cancelled) return;
        setLlmOptions(options);
        // Follow the backend's recommended default. The backend hands out
        // "ollama" when Gemini is not configured and Ollama is available.
        if (options.ollama_available) {
          setSelectedLlm(options.default === "ollama" ? "ollama" : "gemini");
        } else {
          setSelectedLlm("gemini");
        }
        if (!options.ollama_available) {
          retryTimer = setTimeout(loadLlmOptions, 10000);
        }
      } catch {
        if (cancelled) return;
        setLlmOptions({ providers: ["gemini"], default: "gemini", ollama_available: false });
        setSelectedLlm("gemini");
        retryTimer = setTimeout(loadLlmOptions, 10000);
      }
    };

    loadLlmOptions();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [githubLinked, isLoading]);

  useEffect(() => {
    const targetJobId =
      activeReview?.status === "running"
        ? activeReview.jobId
        : reviewJobId ?? (githubLinked ? activeReview?.jobId : undefined);
    if (!targetJobId || isLoading || !githubLinked) return;

    let cancelled = false;

    const loadReviewJob = async () => {
      setError(null);
      try {
        const nextJob = await reviewApi.getStatus(targetJobId);
        if (cancelled) return;
        setJob(nextJob);
        trackReviewJob(nextJob);
      } catch (err) {
        if (!cancelled) setError(getMessage(err));
      }
    };

    loadReviewJob();

    return () => {
      cancelled = true;
    };
  }, [
    activeReview?.jobId,
    activeReview?.status,
    githubLinked,
    isLoading,
    reviewJobId,
    trackReviewJob,
  ]);

  useEffect(() => {
    if (!activeReview) return;

    setJob((current) => {
      if (!current || current.job_id !== activeReview.jobId) return current;

      return {
        ...current,
        status: activeReview.status,
        repos: activeReview.repos,
        error: activeReview.lastError ?? current.error,
        updated_at: activeReview.completedAt ?? current.updated_at,
      };
    });
  }, [activeReview]);

  const toggleRepo = (repoFullName: string) => {
    setError(null);
    setSelectedRepos((current) => {
      if (current.includes(repoFullName)) {
        return current.filter((name) => name !== repoFullName);
      }
      if (current.length >= MAX_SELECTED_REPOS) {
        setError(`Select at most ${MAX_SELECTED_REPOS} repositories.`);
        return current;
      }
      return [...current, repoFullName];
    });
  };

  const runReview = async () => {
    if (selectedRepos.length === 0 || runningReview || sandboxRedirect || activeReviewIsRunning) {
      return;
    }

    setRunningReview(true);
    setError(null);
    setSandboxRedirect(null);
    try {
      const nextJob = await reviewApi.reviewTopFive(selectedRepos, selectedLlm);
      const nextForensicsHref = `/knowledge-assist/forensics?reviewJobId=${encodeURIComponent(
        nextJob.job_id,
      )}`;
      setJob(nextJob);
      trackReviewJob(nextJob);
      router.replace(nextForensicsHref, { scroll: false });
      setSandboxRedirect({
        href: sandboxHref(nextJob.job_id, "forensics-review"),
        jobId: nextJob.job_id,
      });
    } catch (err) {
      setError(getMessage(err));
    } finally {
      setRunningReview(false);
    }
  };

  const rerunRepo = async (repoFullName: string) => {
    if (rerunningRepo) return;

    setRerunningRepo(repoFullName);
    setError(null);
    try {
      const nextJob = await reviewApi.reReview(repoFullName, selectedLlm);
      setJob((current) => mergeSingleRepoResult(current, nextJob));
    } catch (err) {
      setError(getMessage(err));
    } finally {
      setRerunningRepo(null);
    }
  };

  if (!isLoading && !githubLinked) {
    return (
      <div className="space-y-4 pb-4">
        <section className="rounded-2xl border border-amber-500/30 bg-amber-50/70 dark:bg-amber-500/10 p-5 shadow-xs">
          <div className="flex items-start gap-3">
            <Lock className="mt-1 h-5 w-5 text-amber-600 dark:text-amber-300" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300 font-bold">
                GitHub required
              </p>
              <h1 className="mt-1 text-2xl md:text-3xl font-extrabold text-foreground">
                Connect GitHub to review repositories
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-foreground/80">
                Use the GitHub status control at the bottom of the sidebar. After it is connected,
                this page will load your eligible repositories without needing a manual refresh.
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/knowledge-assist/sandbox?source=github-required"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-teal-500/30 bg-teal-500/10 dark:bg-teal-400/15 px-4 py-2.5 text-sm font-semibold text-teal-800 dark:text-teal-100 transition-all hover:bg-teal-500/20 hover:text-teal-900 dark:hover:text-white"
                >
                  <Terminal className="h-4 w-4" />
                  Don&apos;t have a GitHub account?
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <span className="text-xs text-muted-foreground">
                  Continue with sandbox coding questions and retry practice.
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      {/* ── HEADER ── */}
      <section className="rounded-2xl border border-border bg-card/55 p-4 shadow-xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-teal-700 dark:text-cyan-300 font-bold">
              Repository Forensics
            </p>
            <h1 className="mt-1 text-2xl md:text-3xl font-extrabold text-foreground">
              Mentora Code Review Pipeline
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Select up to five linked GitHub repositories. Mentora bundles source files server-side,
              reviews them through the Mentora AI expert review engine, and stores the report for recovery.
            </p>
          </div>

          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              GitHub connected
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {githubLogin ? `@${githubLogin}` : "Linked account"}
            </p>
          </div>
        </div>
      </section>

      {activeReview && (
        <ForensicsActiveReviewBanner
          review={activeReview}
          sandboxUrl={sandboxHref(activeReview.jobId, "forensics-status")}
        />
      )}

      {error && (
        <section className="rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-100">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-300" />
            <span>{error}</span>
          </div>
        </section>
      )}

      {/* ── MAIN GRID ── */}
      <section className="grid grid-cols-1 xl:grid-cols-[390px_minmax(0,1fr)] gap-4">
        {/* ── REPO SELECTION PANEL ── */}
        <article className="rounded-2xl border border-border bg-card/55 p-4 flex flex-col shadow-xs">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <GitBranch className="h-4 w-4 text-teal-600 dark:text-cyan-300" />
              Repository Selection
            </h2>
            <span className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-muted-foreground">
              {selectedCount} / {MAX_SELECTED_REPOS}
            </span>
          </div>

          {/* Search bar */}
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-subtle-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search repositories..."
              value={repoSearch}
              onChange={(e) => setRepoSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-subtle-foreground outline-none focus:border-teal-500/50 transition-all"
            />
          </div>

          {/* Scrollable repo list */}
          <div className="mt-3 flex-1 min-h-0 max-h-[340px] overflow-y-auto space-y-2 custom-scrollbar pr-1">
            {loadingRepos && (
              <div className="rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">
                Loading GitHub repositories...
              </div>
            )}

            {!loadingRepos && repos.length === 0 && (
              <div className="rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">
                No eligible repositories were found for this GitHub account.
              </div>
            )}

            {!loadingRepos && repos.length > 0 && filteredAndOrderedRepos.length === 0 && (
              <div className="rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">
                No repositories match &ldquo;{repoSearch}&rdquo;
              </div>
            )}

            {filteredAndOrderedRepos.map((repo) => {
              const checked = selectedRepos.includes(repo.full_name);
              return (
                <button
                  key={repo.full_name}
                  type="button"
                  onClick={() => toggleRepo(repo.full_name)}
                  className={`w-full rounded-xl border p-3 text-left transition-all duration-200 ${
                    checked
                      ? "border-teal-500/50 bg-teal-50/70 dark:bg-teal-500/10 shadow-xs"
                      : "border-border bg-background hover:border-border-strong hover:bg-muted"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        checked
                          ? "border-teal-600 bg-primary dark:border-teal-400 dark:bg-teal-400 text-primary-foreground dark:text-[#0F172A]"
                          : "border-border-strong"
                      }`}
                    >
                      {checked && <CheckCircle2 className="h-3 w-3" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-foreground">
                        {repo.full_name}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {formatRepoMeta(repo)}
                      </span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Choose LLM engine */}
          <div className="mt-4">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Choose LLM
            </p>
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-muted p-1">
              <button
                type="button"
                onClick={() => setSelectedLlm("gemini")}
                disabled={runningReview || activeReviewIsRunning}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all disabled:cursor-not-allowed ${
                  selectedLlm === "gemini"
                    ? "bg-primary dark:bg-gradient-to-r dark:from-teal-500 dark:to-teal-400 text-primary-foreground dark:text-[#061016] shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sparkles className="h-4 w-4" />
                Gemini
              </button>
              <button
                type="button"
                onClick={() => ollamaAvailable && setSelectedLlm("ollama")}
                disabled={!ollamaAvailable || runningReview || activeReviewIsRunning}
                title={
                  ollamaAvailable
                    ? "Run the review on the local Ollama model"
                    : "Ollama is connected, but the local model is not ready yet."
                }
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
                  selectedLlm === "ollama"
                    ? "bg-primary dark:bg-gradient-to-r dark:from-teal-500 dark:to-teal-400 text-primary-foreground dark:text-[#061016] shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Cpu className="h-4 w-4" />
                Ollama
              </button>
            </div>
            {selectedLlm === "ollama" || !ollamaAvailable ? (
              <p className="mt-2 text-[11px] leading-relaxed text-amber-700 dark:text-amber-300/80">
                {ollamaStatusMessage}
              </p>
            ) : null}
          </div>

          {/* Run review button */}
          <button
            type="button"
            onClick={runReview}
            disabled={
              selectedCount === 0 ||
              runningReview ||
              !!sandboxRedirect ||
              activeReviewIsRunning
            }
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-bold px-4 py-3 text-sm transition-all shadow-sm hover:brightness-110 disabled:cursor-not-allowed disabled:bg-surface-3 disabled:text-subtle-foreground disabled:shadow-none"
          >
            {runningReview || activeReviewIsRunning ? (
              <CircleDashed className="h-4 w-4 animate-spin" />
            ) : (
              <ScanSearch className="h-4 w-4" />
            )}
            {runningReview
              ? "Starting Mentora review..."
              : sandboxRedirect
                ? "Review started"
                : activeReviewIsRunning
                  ? "Mentora review running..."
                  : "Run Mentora Expert Review"}
          </button>
        </article>

        {/* ── RIGHT PANEL: METRICS + RESULTS ── */}
        <div className="space-y-4">
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard label="Reviewed" value={reportStats.completed} tone="text-emerald-700 dark:text-emerald-300" />
            <MetricCard label="Failed" value={reportStats.failed} tone="text-red-700 dark:text-red-300" />
            <MetricCard label="Findings" value={reportStats.defects} tone="text-cyan-700 dark:text-cyan-300" />
            <MetricCard label="High Risk" value={reportStats.high} tone="text-amber-700 dark:text-amber-300" />
          </section>

          <section className="rounded-2xl border border-border bg-card/55 p-4 shadow-xs">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <Sparkles className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />
                Review Results
              </h2>
              {job && (
                <span
                  className={`w-fit rounded-lg border px-2 py-1 text-xs font-semibold uppercase ${
                    statusStyle[job.status]
                  }`}
                >
                  {job.status}
                </span>
              )}
            </div>

            {!job && (
              <div className="mt-4 rounded-xl border border-border bg-background p-5 text-sm text-muted-foreground">
                Run a review to see repository summaries, defects, skill-level signals, and fix hints.
              </div>
            )}

            {job && (
              <div className="mt-4 space-y-4">
                {job.java_level_inferred && (
                  <div className="rounded-xl border border-teal-500/30 bg-teal-50/70 dark:bg-teal-500/10 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-300">
                      Inferred Java level
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {job.java_level_inferred}
                      {job.signals_evidence ? ` - ${job.signals_evidence}` : ""}
                    </p>
                  </div>
                )}

                {job.repos.map((repo) => (
                  <RepoReport
                    key={repo.full_name}
                    repo={repo}
                    rerunning={rerunningRepo === repo.full_name}
                    onRerun={() => rerunRepo(repo.full_name)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </section>

      {sandboxRedirect && (
        <ReviewStartedDialog
          jobId={sandboxRedirect.jobId}
          onConfirm={() => {
            const target = sandboxRedirect.href;
            setSandboxRedirect(null);
            router.push(target, { scroll: false });
          }}
        />
      )}
    </div>
  );
}

function ForensicsActiveReviewBanner({
  review,
  sandboxUrl,
}: {
  review: ActiveReviewState;
  sandboxUrl: string;
}) {
  const reviewed = review.repos.filter((repo) => repo.status === "done").length;
  const failed = review.repos.filter((repo) => repo.status === "error").length;
  const total = review.repos.length;
  const running = review.status === "running";
  const failedStatus = review.status === "failed";
  const partialStatus = review.status === "partial";
  const completed = review.status === "done";
  const llmChoice =
    review.llmChoice ?? review.repos.find((repo) => repo.llm_choice)?.llm_choice;
  const llmName = llmChoice === "ollama" ? "Ollama local" : "Gemini";
  const LlmIcon = llmChoice === "ollama" ? Cpu : Sparkles;
  const llmTone =
    llmChoice === "ollama"
      ? "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-100"
      : "border-cyan-500/30 bg-cyan-500/10 text-cyan-800 dark:text-cyan-100";

  const title = running
    ? "Mentora expert review is working"
    : completed
      ? "Mentora review completed"
      : partialStatus
        ? "Mentora review finished with repository issues"
        : "Mentora review needs attention";

  const description = running
    ? "Reviewing your selected GitHub repositories now. You can keep this tab open or practice Java in Sandbox while the background job finishes."
    : completed
      ? "The latest repository forensics report is ready below."
      : "Some repositories could not be reviewed. Check the report below for details.";

  const borderTone = failedStatus
    ? "border-red-500/30 bg-red-50/70 dark:bg-red-500/10 shadow-xs"
    : partialStatus
      ? "border-amber-500/30 bg-amber-50/70 dark:bg-amber-500/10 shadow-xs"
      : "border-cyan-500/30 bg-cyan-50/70 dark:bg-[#101c2b] shadow-xs";

  return (
    <section className={`rounded-2xl border p-4 ${borderTone}`}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-cyan-500/35 bg-background/70 text-cyan-700 dark:text-cyan-200">
            {running ? (
              <CircleDashed className="h-5 w-5 animate-spin" />
            ) : failedStatus ? (
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-200" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-200" />
            )}
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-700 dark:text-cyan-200">
              Repository Forensics
            </p>
            <h2 className="mt-1 text-xl font-extrabold text-foreground">{title}</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
              {description}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-bold ${llmTone}`}
              >
                <LlmIcon className="h-3.5 w-3.5" />
                Using {llmName}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                Job {review.jobId}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <ReviewCountPill label="Reviewed" value={reviewed} />
          <ReviewCountPill label="Failed" value={failed} />
          <ReviewCountPill label="Total" value={total} />
          <Link
            href={sandboxUrl}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm font-bold text-cyan-800 dark:text-cyan-50 transition-all hover:bg-cyan-500/20 hover:text-cyan-900 dark:hover:text-white shadow-xs"
          >
            Open Sandbox practice
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function ReviewCountPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-20 rounded-xl border border-border bg-background/70 px-3 py-2 text-center shadow-xs">
      <p className="text-lg font-extrabold text-foreground">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function ReviewStartedDialog({
  jobId,
  onConfirm,
}: {
  jobId: string;
  onConfirm: () => void;
}) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex min-h-dvh items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-started-title"
        aria-describedby="review-started-description"
        className="my-auto w-full max-w-lg rounded-2xl border border-cyan-500/30 bg-popover p-6 shadow-overlay"
      >
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-200">
            <CircleDashed className="h-5 w-5 animate-spin" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">
              Review queued
            </p>
            <h2 id="review-started-title" className="mt-1 text-2xl font-extrabold text-foreground">
              Continue in Sandbox
            </h2>
            <p id="review-started-description" className="mt-3 text-sm leading-6 text-muted-foreground">
              Your repository review is running in the background. Open Sandbox to keep
              practicing while the analysis completes.
            </p>
            <p className="mt-3 rounded-lg border border-border bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
              Job ID: {jobId}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 text-sm font-extrabold text-[#061016] transition-all hover:bg-cyan-200 "
          >
            OK, open Sandbox
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <article className="rounded-xl border border-border bg-card/55 p-3 shadow-xs">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-extrabold ${tone}`}>{value}</p>
    </article>
  );
}

function RepoReport({
  repo,
  rerunning,
  onRerun,
}: {
  repo: ReviewRepoResult;
  rerunning: boolean;
  onRerun: () => void;
}) {
  return (
    <article className="rounded-xl border border-border bg-background p-4 shadow-xs">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-foreground">{repo.full_name}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-lg border px-2 py-1 text-xs font-semibold uppercase ${
                statusStyle[repo.status]
              }`}
            >
              {repo.status}
            </span>
            {repo.llm_choice && (
              <span
                className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-semibold uppercase ${
                  repo.llm_choice === "ollama"
                    ? "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-200"
                    : "border-border bg-muted text-muted-foreground"
                }`}
              >
                {repo.llm_choice === "ollama" ? (
                  <Cpu className="h-3 w-3" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                {repo.llm_choice === "ollama" ? "Ollama · local" : "Gemini"}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onRerun}
          disabled={rerunning}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-slate-50 dark:bg-transparent px-3 py-2 text-xs font-semibold text-cyan-700 dark:text-cyan-200 transition-colors hover:bg-slate-100 dark:hover:bg-cyan-500/10 disabled:cursor-not-allowed disabled:text-subtle-foreground"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${rerunning ? "animate-spin" : ""}`} />
          Re-review
        </button>
      </div>

      {repo.error && (
        <div className="mt-3 rounded-lg border border-red-500/20 bg-red-50 dark:bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-100">
          {repo.error}
        </div>
      )}

      {repo.review && (
        <div className="mt-4 space-y-4">
          <div className="rounded-lg border border-border bg-muted p-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
              Summary
            </p>
            <p className="mt-2 text-sm leading-6 text-foreground/80">{repo.review.summary}</p>
          </div>

          {repo.review.errors.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-border">
              <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-3 bg-popover px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <span>Severity</span>
                <span>Review details</span>
              </div>
              <div className="divide-y divide-border">
                {repo.review.errors.map((item, index) => (
                  <div key={`${item.file}-${item.line ?? "line"}-${index}`} className="p-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                      <div className="shrink-0 sm:w-20">
                        <span
                          className={`rounded-md border px-2 py-1 text-xs font-semibold uppercase ${
                            severityStyle[item.severity]
                          }`}
                        >
                          {item.severity}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Location
                        </p>
                        <p className="mt-1 break-all font-mono text-xs leading-5 text-foreground">
                          {item.file}
                          {item.line ? `:${item.line}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-3 lg:grid-cols-2">
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Finding
                        </p>
                        <p className="mt-1 break-words text-sm leading-6 text-foreground">
                          {item.why}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Fix hint
                        </p>
                        <p className="mt-1 break-words text-sm leading-6 text-cyan-800 dark:text-cyan-100/80">
                          {item.fix_hint}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {repo.review.suggestions.length > 0 && (
            <div className="rounded-lg border border-cyan-500/20 bg-cyan-50/70 dark:bg-cyan-500/10 p-3">
              <p className="text-sm font-semibold text-cyan-900 dark:text-cyan-100">Suggestions</p>
              <ul className="mt-2 space-y-2 text-sm text-cyan-800 dark:text-cyan-100/75">
                {repo.review.suggestions.map((suggestion) => (
                  <li key={suggestion} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600 dark:text-cyan-300" />
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
