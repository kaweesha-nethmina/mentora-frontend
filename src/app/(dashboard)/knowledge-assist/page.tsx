"use client";

import { type ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Brain,
  CircleDashed,
  Code2,
  GitBranch,
  RefreshCw,
  Sparkles,
  Target,
  TerminalSquare,
  Trophy,
} from "lucide-react";
import {
  KnowledgeProfile,
  QuizResultSummary,
  SandboxAttempt,
  knowledgeProfileApi,
} from "@/lib/api/knowledgeProfile";
import { ReviewJob, ReviewRepoResult } from "@/lib/api/review";

const statusTone = {
  running: "border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-200",
  done: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200",
  partial: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-200",
  failed: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-200",
  queued: "border-border bg-muted text-muted-foreground",
  error: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-200",
} as const;

const difficultyTone: Record<string, string> = {
  easy: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200",
  medium: "border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-200",
  hard: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-200",
};

const pct01 = (value: number) => `${Math.round((value ?? 0) * 100)}%`;
const pct100 = (value: number) => `${Math.round(value ?? 0)}%`;

function toneFor(pct: number) {
  if (pct >= 70) return { text: "text-emerald-700 dark:text-emerald-300", bar: "from-emerald-500 to-teal-400" };
  if (pct >= 40) return { text: "text-amber-700 dark:text-amber-300", bar: "from-amber-500 to-amber-400" };
  return { text: "text-rose-700 dark:text-rose-300", bar: "from-rose-500 to-rose-400" };
}

const formatDateTime = (value?: string) => {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function KnowledgeAssistPage() {
  const [profile, setProfile] = useState<KnowledgeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = async (mode: "initial" | "refresh" = "initial") => {
    if (mode === "initial") setLoading(true);
    if (mode === "refresh") setRefreshing(true);
    setError(null);
    try {
      const next = await knowledgeProfileApi.getMine();
      setProfile(next);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load the knowledge profile evidence.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[460px] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/55 px-5 py-4 text-foreground/80 shadow-xs">
          <CircleDashed className="h-5 w-5 animate-spin text-teal-600 dark:text-cyan-300" />
          Loading knowledge profile...
        </div>
      </div>
    );
  }

  const review = profile?.review_summary;
  const sandbox = profile?.sandbox_summary;
  const quiz = profile?.quiz_summary;
  const quizResults = profile?.latest_quiz_results ?? [];
  const hasAnyEvidence =
    !!profile &&
    ((review?.jobs ?? 0) > 0 ||
      (sandbox?.total_attempts ?? 0) > 0 ||
      (quiz?.total_quizzes ?? 0) > 0);

  return (
    <div className="space-y-5 pb-8">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-linear-to-br from-teal-50/70 via-muted to-background dark:from-[#10241f] p-6 shadow-xs">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-teal-700 dark:text-teal-200">
              <Sparkles className="h-3.5 w-3.5" />
              Knowledge Profile
            </span>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
              Your learning evidence
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Quiz performance, GitHub reviews, and Sandbox attempts — synthesised into one
              profile your AI tutor reads to explain progress, weaknesses, and what to practice next.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadProfile("refresh")}
            disabled={refreshing}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-teal-500/30 bg-teal-500/10 dark:bg-gradient-to-r dark:from-teal-500/20 dark:to-cyan-500/20 px-4 py-2.5 text-sm font-bold text-teal-800 dark:text-teal-50 hover:bg-teal-500/20 transition-all disabled:cursor-wait disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </section>

      {error && (
        <section className="rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-100">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-300" />
            <span>{error}</span>
          </div>
        </section>
      )}

      {/* ── KPI BAND: score ring + stat cards ── */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <ScoreHeroCard quiz={quiz} />
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            icon={<Brain className="h-4 w-4" />}
            label="Quizzes taken"
            value={String(quiz?.total_quizzes ?? 0)}
            helper={`${quiz?.questions_correct ?? 0}/${quiz?.questions_answered ?? 0} answers correct`}
            tone="text-teal-600 dark:text-teal-300 font-bold"
          />
          <StatCard
            icon={<GitBranch className="h-4 w-4" />}
            label="Reviewed repos"
            value={String(review?.reviewed ?? 0)}
            helper={`${review?.failed ?? 0} failed`}
            tone="text-emerald-700 dark:text-emerald-300 font-bold"
          />
          <StatCard
            icon={<AlertCircle className="h-4 w-4" />}
            label="Review findings"
            value={String(review?.findings ?? 0)}
            helper={`${review?.high_risk ?? 0} high risk`}
            tone="text-amber-700 dark:text-amber-300 font-bold"
          />
          <StatCard
            icon={<TerminalSquare className="h-4 w-4" />}
            label="Sandbox pass rate"
            value={pct01(sandbox?.recent_pass_rate ?? 0)}
            helper={`${sandbox?.total_attempts ?? 0} attempts`}
            tone="text-teal-700 dark:text-cyan-300 font-bold"
          />
        </div>
      </section>

      {review?.latest_java_level && (
        <section className="flex items-start gap-3 rounded-2xl border border-teal-500/25 bg-teal-50/60 dark:bg-gradient-to-r dark:from-teal-500/10 dark:to-transparent p-4">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-teal-600 dark:text-teal-200" />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-200">
              Latest Java signal
            </p>
            <p className="mt-0.5 text-lg font-extrabold text-foreground">{review.latest_java_level}</p>
            {review.latest_evidence && (
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{review.latest_evidence}</p>
            )}
          </div>
        </section>
      )}

      {!hasAnyEvidence ? (
        <EmptyProfileState />
      ) : (
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
          {/* LEFT */}
          <div className="space-y-5">
            <Panel icon={<Brain className="h-4 w-4 text-teal-700 dark:text-teal-300" />} title="Quiz performance"
              badge={quiz?.total_quizzes ? `${quiz.total_quizzes} completed` : undefined}>
              {quizResults.length === 0 ? (
                <InlineEmpty
                  text="No completed quizzes yet — finish a Skill Check to see your MCQ results here."
                  href="/knowledge-assist/sandbox?source=profile-quiz"
                  cta="Start a Skill Check"
                />
              ) : (
                <div className="space-y-3">
                  {quizResults.map((result) => (
                    <QuizResultCard key={result.result_id} result={result} />
                  ))}
                </div>
              )}
            </Panel>

            <Panel icon={<GitBranch className="h-4 w-4 text-cyan-700 dark:text-cyan-300" />} title="Repository review evidence">
              {(profile?.latest_reviews.length ?? 0) === 0 ? (
                <InlineEmpty text="No GitHub reviews are saved yet." />
              ) : (
                <div className="space-y-3">
                  {profile!.latest_reviews.map((job) => (
                    <ReviewEvidence key={job.job_id} job={job} />
                  ))}
                </div>
              )}
            </Panel>

            <Panel icon={<Code2 className="h-4 w-4 text-cyan-700 dark:text-cyan-300" />} title="Sandbox code evidence">
              {(profile?.latest_sandbox_attempts.length ?? 0) === 0 ? (
                <InlineEmpty text="No Sandbox attempts are saved yet." />
              ) : (
                <div className="space-y-3">
                  {profile!.latest_sandbox_attempts.map((attempt) => (
                    <SandboxEvidence key={attempt.attempt_id} attempt={attempt} />
                  ))}
                </div>
              )}
            </Panel>
          </div>

          {/* RIGHT */}
          <aside className="space-y-5">
            <Panel icon={<Target className="h-4 w-4 text-teal-700 dark:text-teal-300" />} title="Topic mastery">
              <TopicMastery quiz={quiz} sandbox={sandbox} />
            </Panel>

            <Panel icon={<Activity className="h-4 w-4 text-cyan-700 dark:text-cyan-300" />} title="Evidence timeline">
              {(profile?.timeline.length ?? 0) === 0 ? (
                <InlineEmpty text="No evidence events yet." />
              ) : (
                <Timeline events={profile!.timeline} />
              )}
            </Panel>
          </aside>
        </section>
      )}
    </div>
  );
}

/* ───────────────────────── components ───────────────────────── */

function ScoreRing({ value, size = 132, stroke = 12 }: { value: number; size?: number; stroke?: number }) {
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, value));
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" className="text-subtle-foreground/70" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#scoreRingGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
        <defs>
          <linearGradient id="scoreRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0f8f55" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-extrabold leading-none text-foreground">
          {Math.round(pct)}
          <span className="text-lg text-subtle-foreground">%</span>
        </span>
        <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">avg score</span>
      </div>
    </div>
  );
}

function ScoreHeroCard({ quiz }: { quiz?: KnowledgeProfile["quiz_summary"] }) {
  const hasQuiz = (quiz?.total_quizzes ?? 0) > 0;
  return (
    <article className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-teal-400/20 bg-card/55 p-5 shadow-xs">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-teal-500/10 blur-3xl" />
      <div className="relative flex items-center gap-5">
        <ScoreRing value={hasQuiz ? quiz!.avg_score : 0} />
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-300">Quiz mastery</p>
          {hasQuiz ? (
            <>
              <p className="mt-1 text-sm text-muted-foreground">
                {quiz!.questions_correct}/{quiz!.questions_answered} answered correctly
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-200">
                  <Trophy className="h-3 w-3" /> Best {pct100(quiz!.best_score)}
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-2 py-1 text-xs font-bold text-cyan-800 dark:text-cyan-200">
                  Latest {pct100(quiz!.latest_score)}
                </span>
              </div>
            </>
          ) : (
            <p className="mt-1 max-w-[16rem] text-sm leading-6 text-muted-foreground">
              Complete a Skill Check and your quiz mastery score appears here.
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

function StatCard({
  icon,
  label,
  value,
  helper,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  helper: string;
  tone: string;
}) {
  return (
    <article className="rounded-2xl border border-border bg-card/55 p-4 transition-colors hover:border-teal-500/40 dark:hover:border-white/20 shadow-xs">
      <div className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider ${tone}`}>
        {icon}
        {label}
      </div>
      <p className="mt-3 text-3xl font-extrabold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
    </article>
  );
}

function Panel({
  icon,
  title,
  badge,
  children,
}: {
  icon: ReactNode;
  title: string;
  badge?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card/55 p-4 shadow-xs">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
          {icon}
          {title}
        </h2>
        {badge && (
          <span className="rounded-lg border border-border bg-muted px-2 py-1 text-[11px] font-semibold text-muted-foreground">
            {badge}
          </span>
        )}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function QuizResultCard({ result }: { result: QuizResultSummary }) {
  const tone = toneFor(result.score_percent);
  return (
    <article className="rounded-xl border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-extrabold ${tone.text}`}>{pct100(result.score_percent)}</span>
          <span className="text-sm text-muted-foreground">{result.correct}/{result.total} correct</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase ${
              difficultyTone[result.difficulty_reached] ?? difficultyTone.easy
            }`}
          >
            {result.difficulty_reached}
          </span>
          <span className="text-[11px] text-subtle-foreground">{formatDateTime(result.completed_at)}</span>
        </div>
      </div>

      {/* per-question result strip */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {result.questions.map((q, i) => (
          <span
            key={q.qid ?? i}
            title={`Q${i + 1} · ${q.topic} (${q.difficulty}) — ${q.correct ? "correct" : "wrong"}`}
            className={`h-2.5 w-2.5 rounded-full ${
              q.correct ? "bg-emerald-500 dark:bg-emerald-400" : "bg-rose-500/80"
            }`}
          />
        ))}
      </div>

      {/* topic chips */}
      {result.topic_performance.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {result.topic_performance.map((tp) => {
            const acc = tp.total ? (tp.correct / tp.total) * 100 : 0;
            return (
              <span
                key={tp.topic}
                className={`rounded-md border border-border bg-muted px-2 py-0.5 text-[11px] ${toneFor(acc).text}`}
              >
                {tp.topic} {tp.correct}/{tp.total}
              </span>
            );
          })}
        </div>
      )}
    </article>
  );
}

function TopicMastery({
  quiz,
  sandbox,
}: {
  quiz?: KnowledgeProfile["quiz_summary"];
  sandbox?: KnowledgeProfile["sandbox_summary"];
}) {
  const quizTopics = quiz?.topic_mastery ?? [];
  if (quizTopics.length > 0) {
    return (
      <div className="space-y-3">
        {quizTopics.map((t) => (
          <MasteryBar key={t.topic} label={t.topic} correct={t.correct} total={t.total} pct={t.accuracy_percent} />
        ))}
      </div>
    );
  }

  const sandboxTopics = sandbox?.topics ?? [];
  if (sandboxTopics.length > 0) {
    return (
      <div className="space-y-3">
        {sandboxTopics.map((t) => {
          const pct = t.attempts ? (t.passed / t.attempts) * 100 : 0;
          return (
            <MasteryBar
              key={`${t.topic}-${t.challenge_id ?? "x"}`}
              label={t.topic}
              correct={t.passed}
              total={t.attempts}
              pct={pct}
            />
          );
        })}
      </div>
    );
  }

  return <InlineEmpty text="Topic mastery appears after you complete a quiz or Sandbox attempt." />;
}

function MasteryBar({
  label,
  correct,
  total,
  pct,
}: {
  label: string;
  correct: number;
  total: number;
  pct: number;
}) {
  const tone = toneFor(pct);
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="truncate font-semibold text-foreground">{label}</span>
        <span className="shrink-0 text-muted-foreground">
          {correct}/{total} · <span className={tone.text}>{Math.round(pct)}%</span>
        </span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${tone.bar}`}
          style={{ width: `${Math.max(4, Math.min(100, pct))}%` }}
        />
      </div>
    </div>
  );
}

function ReviewEvidence({ job }: { job: ReviewJob }) {
  return (
    <article className="rounded-xl border border-border bg-background p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {job.gh_login ? `@${job.gh_login}` : "GitHub review"}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {formatDateTime(job.updated_at ?? job.created_at)}
          </p>
        </div>
        <span className={`shrink-0 rounded-lg border px-2 py-1 text-[11px] font-bold uppercase ${statusTone[job.status]}`}>
          {job.status}
        </span>
      </div>
      <div className="mt-3 space-y-2">
        {job.repos.map((repo) => (
          <RepoLine key={repo.full_name} repo={repo} />
        ))}
      </div>
    </article>
  );
}

function RepoLine({ repo }: { repo: ReviewRepoResult }) {
  const findings = repo.review?.errors.length ?? 0;
  return (
    <div className="rounded-lg border border-border bg-muted p-3">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-semibold text-foreground">{repo.full_name}</p>
        <span className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase ${statusTone[repo.status]}`}>
          {repo.status} · {findings}
        </span>
      </div>
      {repo.review?.summary && (
        <p className="mt-1.5 line-clamp-3 text-sm leading-6 text-muted-foreground">{repo.review.summary}</p>
      )}
      {repo.error && <p className="mt-1.5 text-sm text-red-600 dark:text-red-200">{repo.error}</p>}
    </div>
  );
}

function SandboxEvidence({ attempt }: { attempt: SandboxAttempt }) {
  return (
    <article className="rounded-xl border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{attempt.title}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {attempt.topic} · attempt {attempt.attempt_number} · {formatDateTime(attempt.created_at)}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-lg border px-2 py-1 text-[11px] font-bold uppercase ${
            attempt.passed
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
              : "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200"
          }`}
        >
          {attempt.passed ? "passed" : "needs fix"}
        </span>
      </div>
      <pre className="mt-3 max-h-32 overflow-auto rounded-lg border border-border bg-card p-3 font-mono text-[11px] leading-5 text-slate-900 dark:text-cyan-50/90">
        {attempt.code?.trim() || "No code captured."}
      </pre>
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-muted p-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Output</p>
          <pre className="mt-1 max-h-20 overflow-auto whitespace-pre-wrap font-mono text-[11px] text-foreground/80">
            {attempt.output?.trim() || "—"}
          </pre>
        </div>
        <div className="rounded-lg border border-border bg-muted p-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Error</p>
          <pre className="mt-1 max-h-20 overflow-auto whitespace-pre-wrap font-mono text-[11px] text-rose-600 dark:text-rose-200/80">
            {attempt.error?.trim() || "—"}
          </pre>
        </div>
      </div>
    </article>
  );
}

const timelineConfig: Record<string, { icon: ReactNode; dot: string; tone: string }> = {
  quiz: { icon: <Brain className="h-3.5 w-3.5" />, dot: "bg-teal-500", tone: "text-teal-700 dark:text-teal-300" },
  github_review: { icon: <GitBranch className="h-3.5 w-3.5" />, dot: "bg-cyan-500", tone: "text-cyan-700 dark:text-cyan-300" },
  sandbox_attempt: { icon: <Code2 className="h-3.5 w-3.5" />, dot: "bg-amber-500", tone: "text-amber-700 dark:text-amber-300" },
};

function Timeline({ events }: { events: KnowledgeProfile["timeline"] }) {
  return (
    <div className="relative space-y-3 pl-5">
      <span className="absolute left-[5px] top-1 bottom-1 w-px bg-surface-3" aria-hidden />
      {events.map((event) => {
        const cfg = timelineConfig[event.type] ?? timelineConfig.sandbox_attempt;
        return (
          <div key={`${event.type}-${event.id}`} className="relative">
            <span className={`absolute -left-5 top-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-border-strong ${cfg.dot}`} />
            <div className="rounded-xl border border-border bg-background p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">{event.label}</p>
                <span className="shrink-0 text-[11px] text-muted-foreground">{formatDateTime(event.time)}</span>
              </div>
              <p className={`mt-1 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider ${cfg.tone}`}>
                {cfg.icon}
                {event.type.replace("_", " ")}
                {event.status ? ` · ${event.status}` : ""}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function InlineEmpty({ text, href, cta }: { text: string; href?: string; cta?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border-strong bg-background p-5 text-center">
      <p className="text-sm text-muted-foreground">{text}</p>
      {href && cta && (
        <Link
          href={href}
          className="mt-3 inline-flex items-center justify-center gap-2 rounded-lg border border-teal-500/30 bg-teal-500/10 px-3 py-2 text-xs font-bold text-teal-800 dark:text-teal-100 transition-colors hover:bg-teal-500/15"
        >
          {cta}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

function EmptyProfileState() {
  return (
    <section className="rounded-2xl border border-border bg-card/55 p-8 text-center shadow-xs">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-teal-500/25 bg-teal-500/10 text-teal-700 dark:text-teal-200">
        <Sparkles className="h-6 w-6" />
      </span>
      <h2 className="mt-4 text-xl font-extrabold text-foreground">No saved evidence yet</h2>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
        Take a Java Skill Check, run a GitHub review, or complete Sandbox attempts. As soon as
        those finish, this profile fills with your scores, code, topic mastery, and timeline.
      </p>
      <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href="/knowledge-assist/sandbox?source=profile-empty"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-action px-4 py-3 text-sm font-bold text-white transition-all hover:brightness-110 shadow-sm"
        >
          Start a Skill Check
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/knowledge-assist/forensics"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm font-bold text-cyan-800 dark:text-cyan-100 transition-colors hover:bg-cyan-500/20"
        >
          Open Forensics
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
