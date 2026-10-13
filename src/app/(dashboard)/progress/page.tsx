"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  learningGeneratorApi,
  type LearningMaterial,
  type StudentProgress,
  type ProgressStats,
  type ConceptCoverage,
} from "@/lib/api/learningGenerator";
import {
  Activity, Award, BarChart3, BookOpen, CheckCircle2, ChevronRight,
  Clock, Flag, Layers, Loader2, Sparkles, Star, Target, TrendingUp,
} from "lucide-react";

const GAP_STYLES: Record<string, string> = {
  FUNDAMENTAL_GAP: "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300 font-medium",
  PARTIAL_GAP: "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300 font-medium",
  SURFACE_GAP: "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300 font-medium",
  default: "bg-muted border-border text-foreground/80",
};

function masteryLevel(score: number): string {
  if (score >= 90) return "Level 5";
  if (score >= 75) return "Level 4";
  if (score >= 60) return "Level 3";
  if (score >= 40) return "Level 2";
  return "Level 1";
}

function formatDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

interface UnitRow {
  material: LearningMaterial;
  total: number;
  completed: number;
  pct: number;
  status: "completed" | "in_progress" | "not_started";
  quiz: number | null;
}

export default function ProgressAnalyticsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [progressList, setProgressList] = useState<StudentProgress[]>([]);
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [history, setHistory] = useState<Array<{
    id?: string;
    overall_mastery_score?: number;
    gaps_count?: number;
    submitted_at: string;
  }>>([]);
  const [coverage, setCoverage] = useState<ConceptCoverage | null>(null);

  const fetchData = useCallback(async () => {
    if (!user?.student_id) return;
    try {
      await Promise.all([
        learningGeneratorApi.getProfile(user.student_id).then((res) => {
          if (res.success && res.data) setProfile(res.data);
        }).catch(() => {}),
        learningGeneratorApi.getMaterials(user.student_id, { limit: 100 }).then((res) => {
          const data = res.data as any;
          if (res.success && data) setMaterials(data.items || []);
        }).catch(() => {}),
        learningGeneratorApi.getProgressByStudent(user.student_id).then((res) => {
          if (res.success && res.data) setProgressList(res.data as StudentProgress[]);
        }).catch(() => {}),
        learningGeneratorApi.getProgressStats(user.student_id).then((res) => {
          if (res.success && res.data) setStats(res.data as ProgressStats);
        }).catch(() => {}),
        learningGeneratorApi.getProfileHistory(user.student_id, 1, 10).then((res) => {
          const data = res.data as any;
          if (res.success && data?.items) setHistory(data.items);
        }).catch(() => {}),
        learningGeneratorApi.getConceptCoverage(user.student_id).then((res) => {
          const data = res.data as any;
          if (res.success && data && typeof data.totalNodes === "number") setCoverage(data);
        }).catch(() => {}),
      ]);
    } finally {
      setLoading(false);
    }
  }, [user?.student_id]);

  useEffect(() => {
    if (user?.student_id) fetchData();
  }, [user?.student_id, fetchData]);

  const progressMap = new Map<string, StudentProgress>();
  progressList.forEach((p) => progressMap.set(p.material_id, p));

  const unitRows: UnitRow[] = materials.map((mat) => {
    const prog = progressMap.get(mat._id);
    const totalSteps =
      prog?.total_steps ??
      mat.structured_material.lesson?.step_by_step_guide?.steps?.length ??
      0;
    const completedSteps = prog?.completed_steps?.length ?? 0;
    const status: UnitRow["status"] = prog
      ? prog.completed_at
        ? "completed"
        : prog.completed_steps.length > 0
        ? "in_progress"
        : "not_started"
      : "not_started";
    return {
      material: mat,
      total: totalSteps,
      completed: completedSteps,
      pct: totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0,
      status,
      quiz: prog?.quiz_score ?? null,
    };
  });

  const completedCount = unitRows.filter((r) => r.status === "completed").length;
  const inProgressCount = unitRows.filter((r) => r.status === "in_progress").length;
  const notStartedCount = unitRows.filter((r) => r.status === "not_started").length;

  const totalSteps = stats?.total_steps ?? unitRows.reduce((sum, r) => sum + r.total, 0);
  const completedSteps = stats?.completed_steps ?? unitRows.reduce((sum, r) => sum + r.completed, 0);
  const overallPct =
    totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const quizScores = progressList
    .map((p) => p.quiz_score)
    .filter((s): s is number => s !== null && s !== undefined);
  const avgQuiz =
    quizScores.length > 0
      ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length)
      : null;

  const masteryScore = profile?.overall_mastery_score ?? user?.stats?.overall_mastery_score ?? null;
  const gaps = profile?.knowledge_gaps ?? [];
  const strengths = profile?.strengths ?? [];
  const generalAdvice = profile?.recommendations?.general_advice ?? null;
  const submittedAt = profile?.submitted_at ?? null;

  const completedWidth = Math.min(100, overallPct);
  const inProgressWidth = Math.min(
    100 - completedWidth,
    unitRows.length > 0 ? Math.round((inProgressCount / unitRows.length) * 100) : 0
  );

  const chronologicalHistory = [...history].reverse();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-live="polite">
        <div className="text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-brand" />
          <p className="text-sm text-muted-foreground">Loading your progress analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-slide-up">
      {/* ── PAGE HEADER ─────────────────────────────────────────────── */}
      <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <span>Progress Analytics</span>
          </nav>
          <h1 className="text-3xl font-bold tracking-tight text-heading md:text-[2.1rem]">
            Your learning progress
          </h1>
          <p className="mt-2 leading-relaxed text-muted-foreground">
            A live view of your curriculum: unit mastery, step completion, quiz performance
            and how your knowledge profile has grown over time.
          </p>
        </div>
      </header>

      {/* ── HERO OVERVIEW BAND ─────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-2xl bg-forest px-6 py-7 text-white shadow-raised md:px-8 md:py-8">
        <svg aria-hidden className="pointer-events-none absolute -right-10 -top-16 h-72 w-72 text-white/[0.06]" viewBox="0 0 200 200" fill="none">
          <path d="M100 10c40 30 70 70 60 120-10 40-50 60-60 60s-50-20-60-60C30 80 60 40 100 10Z" fill="currentColor" />
          <path d="M100 30v160" stroke="currentColor" strokeWidth="3" />
        </svg>
        <div className="relative grid gap-6 md:grid-cols-4">
          <div>
            <p className="text-sm font-medium text-white/70">Overall progress</p>
            <p className="mt-1 text-4xl font-black leading-none">{overallPct}%</p>
            <p className="mt-2 text-xs text-white/70">
              {completedSteps} of {totalSteps} steps completed
            </p>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-sm font-medium text-white/70">
              <Award className="h-3.5 w-3.5" aria-hidden /> Mastery
            </p>
            <p className="mt-1 text-4xl font-black leading-none">
              {masteryScore !== null ? `${Math.round(masteryScore)}%` : "—"}
            </p>
            <p className="mt-2 text-xs text-white/70">
              {masteryScore !== null ? masteryLevel(masteryScore) : "Run a knowledge analysis"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-white/70">Average quiz score</p>
            <p className="mt-1 text-4xl font-black leading-none">
              {avgQuiz !== null ? `${avgQuiz}%` : "—"}
            </p>
            <p className="mt-2 text-xs text-white/70">
              {quizScores.length > 0 ? `Across ${quizScores.length} graded quiz${quizScores.length === 1 ? "" : "zes"}` : "No quizzes attempted yet"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-white/70">Knowledge gaps</p>
            <p className="mt-1 text-4xl font-black leading-none">{gaps.length}</p>
            <p className="mt-2 text-xs text-white/70">
              {submittedAt ? `Last analysed ${formatDate(submittedAt)}` : "No profile submitted yet"}
            </p>
          </div>
        </div>
      </section>

      {/* ── STAT CARDS ─────────────────────────────────────────────── */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-card border border-border shadow-xs rounded-2xl p-5 flex flex-col justify-between hover:border-border-strong transition-all">
          <div>
            <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">
              TOTAL MODULES
            </p>
            <div className="flex items-center justify-between mt-2.5">
              <span className="text-3xl font-black text-foreground tracking-tight">{unitRows.length}</span>
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3 font-medium">
            Learning units generated for you
          </p>
        </div>

        <div className="bg-card border border-border shadow-xs rounded-2xl p-5 flex flex-col justify-between hover:border-border-strong transition-all">
          <div>
            <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">
              COMPLETED
            </p>
            <div className="flex items-center justify-between mt-2.5">
              <span className="text-3xl font-black text-foreground tracking-tight">{completedCount}</span>
              <div className="w-11 h-11 rounded-2xl bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3 font-medium">
            All steps finished and validated
          </p>
        </div>

        <div className="bg-card border border-border shadow-xs rounded-2xl p-5 flex flex-col justify-between hover:border-border-strong transition-all">
          <div>
            <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">
              IN ACTIVE STUDY
            </p>
            <div className="flex items-center justify-between mt-2.5">
              <span className="text-3xl font-black text-foreground tracking-tight">{inProgressCount}</span>
              <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Activity className="w-5 h-5" />
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3 font-medium">
            Started but not yet finished
          </p>
        </div>

        <div className="bg-card border border-border shadow-xs rounded-2xl p-5 flex flex-col justify-between hover:border-border-strong transition-all">
          <div>
            <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">
              NOT STARTED
            </p>
            <div className="flex items-center justify-between mt-2.5">
              <span className="text-3xl font-black text-foreground tracking-tight">{notStartedCount}</span>
              <div className="w-11 h-11 rounded-2xl bg-slate-50 dark:bg-slate-500/10 text-slate-500 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3 font-medium">
            Waiting to be opened
          </p>
        </div>
      </section>

      {unitRows.length > 0 && (
        <>
          {/* ── CURRICULUM MILESTONE TRAJECTORY ─────────────────────── */}
          <section className="bg-card border border-border shadow-xs rounded-2xl p-5 sm:p-6 transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Flag className="w-4 h-4 text-brand" aria-hidden /> Curriculum Milestone Trajectory
              </h2>
              <span className="text-xs font-bold text-foreground">
                {completedSteps} / {totalSteps} steps completed ({overallPct}%)
              </span>
            </div>
            <div className="h-2.5 bg-slate-100 dark:bg-muted rounded-full overflow-hidden flex my-3.5">
              <div
                className="h-full bg-emerald-500 transition-all duration-700"
                style={{ width: `${completedWidth}%` }}
                title={`Completed: ${completedCount} modules`}
              />
              <div
                className="h-full bg-amber-500 transition-all duration-700"
                style={{ width: `${inProgressWidth}%` }}
                title={`In progress: ${inProgressCount} modules`}
              />
            </div>
            <div className="flex flex-wrap items-center gap-5 sm:gap-8 pt-1 text-xs text-muted-foreground font-medium">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span>{completedCount} Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <span>{inProgressCount} In progress</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
                <span>{notStartedCount} Not started</span>
              </div>
            </div>
          </section>

          {/* ── PER-MODULE BREAKDOWN ────────────────────────────────── */}
          <section className="bg-card border border-border shadow-xs rounded-2xl overflow-hidden transition-all">
            <div className="flex items-center justify-between px-5 sm:px-6 pt-5 pb-1">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand" aria-hidden /> Module breakdown
              </h2>
              <span className="text-xs font-medium text-muted-foreground">{unitRows.length} units</span>
            </div>
            <div className="divide-y divide-border">
              {unitRows.map((row) => {
                const sm = row.material.structured_material;
                const statusPill =
                  row.status === "completed" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="w-3 h-3" /> Completed
                    </span>
                  ) : row.status === "in_progress" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300">
                      <Activity className="w-3 h-3" /> In progress
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-500/20 text-slate-600 dark:text-slate-300">
                      <Clock className="w-3 h-3" /> Not started
                    </span>
                  );
                return (
                  <Link
                    key={row.material._id}
                    href={`/learning-generator/materials/${row.material._id}`}
                    className="group flex items-center gap-4 px-5 sm:px-6 py-4 transition-colors hover:bg-muted/40"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <p className="text-sm font-bold text-foreground truncate">{sm.topic}</p>
                        {statusPill}
                        {row.quiz !== null && (
                          <span className="text-[10px] font-bold text-purple-700 dark:text-purple-400">
                            Quiz: {row.quiz}%
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-2.5">
                        <div className="h-1.5 min-w-0 flex-1 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              row.status === "completed"
                                ? "bg-emerald-500"
                                : row.status === "in_progress"
                                ? "bg-amber-500"
                                : "bg-slate-300 dark:bg-slate-600"
                            }`}
                            style={{ width: `${row.pct}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-muted-foreground font-semibold tabular-nums shrink-0">
                          {row.completed}/{row.total} steps · {row.pct}%
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </Link>
                );
              })}
            </div>
          </section>
        </>
      )}

      {unitRows.length === 0 && (
        <section className="bg-card border border-border shadow-xs rounded-2xl px-6 py-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary-soft-foreground">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1.5">No learning units yet</h3>
          <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
            Generate material for your knowledge gaps and your per-module progress will appear here.
          </p>
          <Link
            href="/learning-generator"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-semibold rounded-lg transition-colors"
          >
            <Sparkles className="w-4 h-4" /> Open material generator
          </Link>
        </section>
      )}

      {/* ── MASTERY GROWTH + PROFILE ──────────────────────────────── */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* Mastery score history */}
        <div className="bg-card border border-border shadow-xs rounded-2xl p-5 sm:p-6 flex flex-col">
          <div className="flex items-center justify-between gap-2 mb-5">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand" aria-hidden /> Mastery score history
            </h2>
            <span className="text-xs font-medium text-muted-foreground">
              {history.length > 0 ? `${history.length} assessment${history.length === 1 ? "" : "s"}` : "No data"}
            </span>
          </div>

          {chronologicalHistory.length > 0 ? (
            <>
              <div className="flex flex-1 items-end gap-3 sm:gap-4 min-h-[160px]">
                {chronologicalHistory.map((entry, i) => {
                  const score = entry.overall_mastery_score ?? 0;
                  const isLast = i === chronologicalHistory.length - 1;
                  return (
                    <div key={i} className="group flex flex-1 flex-col items-center gap-1.5" title={`${score}% mastery · ${formatDate(entry.submitted_at)}`}>
                      <span className={`text-xs font-bold tabular-nums ${isLast ? "text-brand" : "text-muted-foreground"}`}>
                        {score}%
                      </span>
                      <div
                        className={`w-full max-w-[42px] rounded-t-lg transition-colors ${
                          isLast
                            ? "bg-brand"
                            : score >= 60
                            ? "bg-emerald-400"
                            : score >= 40
                            ? "bg-amber-400"
                            : "bg-red-400"
                        }`}
                        style={{ height: `${Math.max(score, 6)}px` }}
                      />
                      <div className="h-3">
                        <span className="text-[9px] text-muted-foreground font-semibold whitespace-nowrap">
                          {formatDate(entry.submitted_at)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted-foreground mt-4 font-medium">
                {history.length >= 2
                  ? `Change of ${(chronologicalHistory[chronologicalHistory.length - 1].overall_mastery_score ?? 0) - (chronologicalHistory[0].overall_mastery_score ?? 0)} points since your earliest assessment`
                  : "Each bar is a saved knowledge analysis — run more to track growth."}
              </p>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
              <BarChart3 className="w-10 h-10 text-muted-foreground/40 mb-3" aria-hidden />
              <p className="text-sm font-semibold text-foreground">No mastery history yet</p>
              <p className="text-xs text-muted-foreground max-w-xs mt-1">
                Run a knowledge analysis in Knowledge Assist and your overall mastery score will be tracked here over time.
              </p>
              <Link
                href="/knowledge-assist/assessment"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover transition-colors"
              >
                Start assessment <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Gaps + strengths */}
        <div className="space-y-6">
          <div className="bg-card border border-border shadow-xs rounded-2xl p-5 sm:p-6">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Target className="w-4 h-4 text-brand" aria-hidden /> Knowledge gaps
              </h2>
              <Link href="/learning-generator/knowledge-gaps" className="text-xs font-semibold text-primary hover:text-primary-hover inline-flex items-center gap-1">
                Manage <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            {gaps.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {gaps.map((g: any) => (
                  <span
                    key={g.topic_id || g.topic}
                    className={`px-3 py-1.5 rounded-lg text-sm border ${GAP_STYLES[g.gap_type] || GAP_STYLES.default}`}
                  >
                    {g.topic}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No weak concepts detected yet. Run a knowledge analysis to see what to work on next.
              </p>
            )}
            {generalAdvice && (
              <p className="mt-4 rounded-xl bg-muted px-4 py-3 text-sm leading-relaxed text-foreground/80">
                {generalAdvice}
              </p>
            )}
          </div>

          <div className="bg-card border border-border shadow-xs rounded-2xl p-5 sm:p-6">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Star className="w-4 h-4 text-brand" aria-hidden /> Strengths
              </h2>
              <span className="text-xs font-medium text-muted-foreground">
                {strengths.length > 0 ? `${strengths.length} recognised` : "Not analysed"}
              </span>
            </div>
            {strengths.length > 0 ? (
              <div className="space-y-2">
                {strengths.map((s: any, i: number) => (
                  <div key={i} className="p-3 bg-green-500/5 border border-green-500/15 rounded-lg">
                    <p className="text-sm font-bold text-foreground">
                      {typeof s === "string" ? s : s.topic}
                    </p>
                    {typeof s !== "string" && s.confidence != null && (
                      <p className="text-[10px] text-green-700 dark:text-green-400 mt-0.5 font-bold">
                        {Math.round(s.confidence * 100)}% confidence · {s.mastery_level || "proficient"}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Your strongest topics will be listed here after a knowledge analysis.
              </p>
            )}
          </div>

          {coverage && coverage.totalNodes > 0 && (
            <div className="bg-card border border-border shadow-xs rounded-2xl p-5 sm:p-6">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Layers className="w-4 h-4 text-brand" aria-hidden /> Concept coverage
                </h2>
                <Link href="/learning-generator/coverage" className="text-xs font-semibold text-primary hover:text-primary-hover inline-flex items-center gap-1">
                  Details <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">
                  {coverage.coveredNodes} of {coverage.totalNodes} concepts mastered
                </span>
                <span className="text-2xl font-extrabold text-foreground">{coverage.coveragePct}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    coverage.coveragePct >= 60 ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                  style={{ width: `${Math.min(100, coverage.coveragePct)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}