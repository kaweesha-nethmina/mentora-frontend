"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Brain, FileText, Target, Users, ChevronRight, Sparkles,
  Activity, Award, Loader2, BookOpen
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { knowledgeProfileApi } from "@/lib/api/knowledgeProfile";
import {
  learningGeneratorApi,
  type LearningMaterial,
  type ProgressStats,
} from "@/lib/api/learningGenerator";

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

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
  return new Date(iso).toLocaleDateString();
}

function materialIntro(m: LearningMaterial): string {
  const sm = m.structured_material;
  return (
    sm.lesson?.introduction?.what_is_it ||
    sm.lesson?.concept_explained?.core_definition ||
    sm.lesson?.concept_explained?.analogy ||
    `AI-generated material about ${sm.topic}.`
  );
}

export default function DashboardHome() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [overallMastery, setOverallMastery] = useState<number | null>(null);
  const [gaps, setGaps] = useState<Array<{ topic: string; gap_type: string; mastery_score: number }>>([]);
  const [generalAdvice, setGeneralAdvice] = useState<string | null>(null);
  const [priorityTopic, setPriorityTopic] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressStats | null>(null);
  const [recentMaterials, setRecentMaterials] = useState<LearningMaterial[]>([]);

  const loadDashboard = useCallback(async () => {
    if (!user?.student_id) {
      setLoading(false);
      return;
    }
    const sid = user.student_id;
    try {
      await Promise.all([
        knowledgeProfileApi.getLatestMasteryProfile(sid).then((p) => {
          setOverallMastery(p.overall_mastery_score ?? null);
          setGaps(
            (p.knowledge_gaps || []).map((g) => ({
              topic: g.topic,
              gap_type: g.gap_type,
              mastery_score: g.mastery_score,
            })),
          );
          setGeneralAdvice(p.recommendations?.general_advice ?? null);
          setPriorityTopic(p.recommendations?.priority_order?.[0] ?? p.knowledge_gaps?.[0]?.topic ?? null);
        }).catch(() => {}),
        learningGeneratorApi.getProgressStats(sid).then((res) => {
          if (res.success && res.data) setProgress(res.data as ProgressStats);
        }).catch(() => {}),
        learningGeneratorApi.getMaterials(sid, { limit: 3 }).then((res) => {
          const data = res.data as any;
          const items: LearningMaterial[] = data?.items || [];
          setRecentMaterials(items);
        }).catch(() => {}),
      ]);
    } finally {
      setLoading(false);
    }
  }, [user?.student_id]);

  useEffect(() => {
    setMounted(true);
    loadDashboard();
  }, [loadDashboard]);

  const masteryScore = overallMastery ?? user?.stats?.overall_mastery_score ?? null;
  const visibleGaps = gaps.slice(0, 3);
  const extraGaps = gaps.length - visibleGaps.length;
  const goal = priorityTopic || gaps[0]?.topic || null;

  const totalMaterials = progress?.total_materials ?? 0;
  const completedMaterials = progress?.completed_materials ?? 0;
  const materialsPct = totalMaterials > 0 ? Math.round((completedMaterials / totalMaterials) * 100) : 0;
  const overallPct = progress?.progress_percentage ?? null;

  const bars = [
    {
      label: "Overall Progress",
      value: overallPct,
    },
    {
      label: `Materials Completed (${completedMaterials}/${totalMaterials})`,
      value: materialsPct,
    },
    {
      label: "Avg Quiz Score",
      value: progress?.avg_quiz_score ?? null,
    },
  ];

  const modules = [
    { tag: "Knowledge Assist", href: "/knowledge-assist", icon: Brain, desc: "Analyse your GitHub work and see where your understanding stands.", cta: "Open knowledge profile", tone: "bg-primary-soft text-primary-soft-foreground" },
    { tag: "Material Generator", href: "/learning-generator", icon: FileText, desc: "Lessons, quizzes and flashcards written for your gaps.", cta: "Generate learning plan", tone: "bg-info-soft text-info" },
    { tag: "Assessment & Mastery", href: "/assessment", icon: Target, desc: "Adaptive questions that measure what you have mastered.", cta: "Start an assessment", tone: "bg-warning-soft text-warning" },
    { tag: "Peer Learning", href: "/peer-learning", icon: Users, desc: "Pair up with a classmate and solve problems together.", cta: "Find a study partner", tone: "bg-violet-500/10 text-violet-700 dark:text-violet-300" },
  ];

  return (
    <div className="space-y-8 animate-slide-up">

      {/* ── WELCOME BAND ── */}
      <section className="relative overflow-hidden rounded-2xl bg-forest text-white px-6 py-7 md:px-8 md:py-8 shadow-raised">
        <svg aria-hidden className="pointer-events-none absolute -right-10 -top-16 h-72 w-72 text-white/[0.06]" viewBox="0 0 200 200" fill="none">
          <path d="M100 10c40 30 70 70 60 120-10 40-50 60-60 60s-50-20-60-60C30 80 60 40 100 10Z" fill="currentColor" />
          <path d="M100 30v160" stroke="currentColor" strokeWidth="3" />
        </svg>
        <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-white/70">Your learning space</p>
            <h1 className="mt-1 text-3xl md:text-4xl font-bold tracking-tight">
              Welcome back, {mounted ? (user?.name?.split(' ')[0] || "User") : "..."}
            </h1>
            <p className="mt-2 text-white/80">
              {loading
                ? "Loading your latest learning insights..."
                : goal
                ? <>Today&apos;s focus is <span className="font-semibold text-white">{goal}</span>. Your tutor has prepared material and practice for it.</>
                : "Your AI tutor has generated new insights based on your learning activity."}
            </p>
          </div>
          <div className="flex items-center gap-4 rounded-xl bg-white/10 px-5 py-4 ring-1 ring-white/15 backdrop-blur-sm">
            <Award className="h-8 w-8 text-[#9be7c1]" />
            <div>
              <p className="text-xs text-white/70">Mastery</p>
              <p className="text-2xl font-bold leading-tight">
                {masteryScore !== null ? `${Math.round(masteryScore)}%` : "Not measured"}
              </p>
              <p className="text-xs text-white/70">{masteryScore !== null ? masteryLevel(masteryScore) : "Take an assessment"}</p>
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex items-center justify-center py-24" role="status">
          <Loader2 className="w-8 h-8 text-brand animate-spin" />
        </div>
      ) : (
        <>
      <div className="grid lg:grid-cols-3 gap-6">

        {/* ── LEARNER INSIGHT CARD ── */}
        <div className="lg:col-span-2 surface-card p-6 lg:p-7 flex flex-col">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-soft text-primary-soft-foreground text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5" /> AI insight
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-heading">
                {goal || "No goal detected yet"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">Current learning goal</p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-lg bg-warning-soft text-warning text-sm font-semibold">
              <Award className="w-4 h-4" /> {masteryScore !== null ? masteryLevel(masteryScore) : "Level N/A"}
            </span>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Concepts to strengthen</h3>
            {gaps.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {visibleGaps.map((g) => (
                  <span
                    key={g.topic}
                    className={`px-3 py-1.5 rounded-lg text-sm border ${GAP_STYLES[g.gap_type] || GAP_STYLES.default}`}
                  >
                    {g.topic}
                  </span>
                ))}
                {extraGaps > 0 && (
                  <span className="px-3 py-1.5 bg-muted border border-border text-muted-foreground rounded-lg text-sm font-medium">
                    +{extraGaps} more
                  </span>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No weak concepts detected yet. Run a knowledge analysis to see what to work on next.
              </p>
            )}
          </div>

          <div className="mt-auto pt-6">
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl bg-muted px-4 py-3.5">
              <p className="text-sm text-foreground/80">
                {generalAdvice || "Submit a learning profile to get personalised recommendations."}
              </p>
              {goal && (
                <Link
                  href="/learning-generator"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary-hover transition-colors shrink-0"
                >
                  Start now <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ── PROGRESS OVERVIEW ── */}
        <div className="surface-card p-6 flex flex-col">
          <h3 className="text-base font-semibold text-foreground mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-brand" /> Course progress
          </h3>

          <div className="space-y-5">
            {bars.map((bar) => (
              <div key={bar.label}>
                <div className="flex justify-between gap-3 text-sm mb-1.5">
                  <span className="text-muted-foreground">{bar.label}</span>
                  <span className="text-foreground font-semibold tabular-nums">{bar.value !== null ? `${bar.value}%` : "—"}</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden ring-1 ring-inset ring-border">
                  <div
                    className="h-full bg-action rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(Math.max(bar.value ?? 0, 0), 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/assessment"
            className="mt-auto pt-6"
          >
            <span className="flex w-full items-center justify-center gap-1.5 py-2.5 bg-card hover:bg-muted text-foreground text-sm font-semibold rounded-lg transition-colors border border-border-strong">
              View analytics <ChevronRight className="w-4 h-4" />
            </span>
          </Link>
        </div>
      </div>

      {/* ── MODULES ── */}
      <section>
        <h2 className="text-lg font-bold text-heading mb-4">Your tutoring agents</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {modules.map((mod) => (
            <Link
              key={mod.href} href={mod.href}
              className="group surface-card p-5 flex flex-col h-full transition-[border-color,box-shadow] duration-200 hover:border-border-strong hover:shadow-raised"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${mod.tone}`}>
                <mod.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-foreground mb-1.5">{mod.tag}</h3>
              <p className="text-sm text-muted-foreground mb-5 flex-1 leading-relaxed">{mod.desc}</p>
              <span className="inline-flex items-center text-primary text-sm font-semibold mt-auto">
                {mod.cta} <ChevronRight className="w-4 h-4 ml-0.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── AI GENERATED CONTENT PREVIEW ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-heading">Just for you</h2>
          <span className="text-xs text-muted-foreground">
            {recentMaterials.length > 0
              ? `Generated ${timeAgo(recentMaterials[0].structured_material.generated_at)}`
              : "No materials yet"}
          </span>
        </div>

        {recentMaterials.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-4">
            {recentMaterials.map((m) => {
              const sm = m.structured_material;
              return (
                <div key={m._id} className="surface-card p-5 flex flex-col">
                  <div className="inline-flex w-fit items-center gap-1.5 mb-3 px-2 py-0.5 rounded-md bg-primary-soft text-primary-soft-foreground text-xs font-medium">
                    <Sparkles className="w-3 h-3" /> AI generated
                  </div>
                  <h3 className="font-semibold text-foreground text-sm mb-2 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-subtle-foreground shrink-0" />
                    <span className="truncate" title={sm.topic}>{sm.topic}</span>
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">{materialIntro(m)}</p>
                  <Link
                    href={`/learning-generator/materials/${m._id}`}
                    className="mt-auto block w-full py-2 bg-primary-soft hover:bg-primary-soft/70 text-primary-soft-foreground text-sm font-semibold rounded-lg transition-colors text-center"
                  >
                    Read concept
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="surface-card px-6 py-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary-soft-foreground">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1.5">No learning material yet</h3>
            <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
              Submit a learning profile and Mentora will write tutorials and exercises for the concepts you need most.
            </p>
            <Link
              href="/learning-generator"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-semibold rounded-lg transition-colors"
            >
              <FileText className="w-4 h-4" /> Generate learning plan
            </Link>
          </div>
        )}
      </section>
        </>
      )}

    </div>
  );
}
