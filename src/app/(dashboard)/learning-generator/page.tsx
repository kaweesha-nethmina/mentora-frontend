"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  learningGeneratorApi,
  type LearningMaterial,
  type GenerationJob,
  type KnowledgeGap,
  type StudentProgress,
  type ProgressStats,
  type ConceptCoverage as ConceptCoverageData,
  type SubmitProfilePayload,
} from "@/lib/api/learningGenerator";
import { knowledgeProfileApi, type CanonicalMasteryProfile } from "@/lib/api/knowledgeProfile";
import {
  AlertTriangle,
  ChevronRight,
  Loader2,
  GitBranch,
  Sparkles,
  RefreshCw,
  Target,
  BookOpen,
  Layers,
  Info,
  SearchX,
  X,
} from "lucide-react";
import { ActiveJobsList } from "@/components/learning-generator/JobCard";
import ProgressStatsCards from "@/components/learning-generator/ProgressStats";
import KnowledgeGapCard from "@/components/learning-generator/KnowledgeGapCard";
import MaterialCard from "@/components/learning-generator/MaterialCard";
import {
  QuickActions,
  ModuleProgressList,
  ConceptCoverage,
} from "@/components/learning-generator/OverviewSidebar";

const GAP_META: Record<string, { label: string; chip: string; dot: string }> = {
  FUNDAMENTAL_GAP: { label: "Critical", chip: "bg-danger-soft text-danger", dot: "bg-danger" },
  PARTIAL_GAP: { label: "Partial", chip: "bg-warning-soft text-warning", dot: "bg-warning" },
  SURFACE_GAP: { label: "Minor", chip: "bg-info-soft text-info", dot: "bg-info" },
};

const defaultBaselineGaps: KnowledgeGap[] = [
  {
    topic: "Binary Search Boundary Conditions",
    topic_id: "CS_BS_01",
    gap_type: "FUNDAMENTAL_GAP",
    confidence: 0.88,
    evidence_summary:
      "Frequent off-by-one errors on boundary conditions with left/right search pointers during tight range convergence.",
    misconceptions: [
      "Pointer overshoot on upper bound",
      "Midpoint integer overflow",
      "While loop termination condition",
    ],
  },
  {
    topic: "Recursive Backtracking & State Restoration",
    topic_id: "CS_BT_02",
    gap_type: "FUNDAMENTAL_GAP",
    confidence: 0.92,
    evidence_summary:
      "Mutated recursion variables persist across alternative exploration branches without explicit revert operations.",
    misconceptions: [
      "In-place list mutation side effects",
      "Omission of pop() before next branch",
    ],
  },
  {
    topic: "Dynamic Programming Memoization Cache",
    topic_id: "CS_DP_01",
    gap_type: "FUNDAMENTAL_GAP",
    confidence: 0.85,
    evidence_summary:
      "Overlapping subproblem states are repeatedly computed instead of retrieved from lookup memoization tables.",
    misconceptions: [
      "Cache key collisions with complex args",
      "Suboptimal recursive state parameterization",
    ],
  },
  {
    topic: "Sliding Window Variable Resizing",
    topic_id: "CS_SW_01",
    gap_type: "PARTIAL_GAP",
    confidence: 0.74,
    evidence_summary:
      "Premature window contraction before testing current contiguous subarray constraint thresholds.",
    misconceptions: [
      "Inverted shrinking condition",
      "Off-by-one window length formula",
    ],
  },
  {
    topic: "Breadth-First Cycle Avoidance in Graph",
    topic_id: "CS_BFS_01",
    gap_type: "PARTIAL_GAP",
    confidence: 0.79,
    evidence_summary:
      "Visited set membership check performed after queue insertion rather than before node enqueueing.",
    misconceptions: [
      "Redundant duplicate node enqueues",
      "Memory bloat on cyclic topologies",
    ],
  },
  {
    topic: "Bit Manipulation Operator Precedence",
    topic_id: "CS_BIT_01",
    gap_type: "SURFACE_GAP",
    confidence: 0.65,
    evidence_summary:
      "Operator precedence confusion between bitwise operators and logical equality comparisons.",
    misconceptions: ["Bitwise AND precedence lower than equality"],
  },
];

export default function LearningGeneratorDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [activeJobs, setActiveJobs] = useState<GenerationJob[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [progressStats, setProgressStats] = useState<ProgressStats | null>(null);
  const [materialProgress, setMaterialProgress] = useState<StudentProgress[]>([]);
  const [masteryGenerating, setMasteryGenerating] = useState(false);
  const [closingJobs, setClosingJobs] = useState<string[]>([]);
  const [conceptCoverage, setConceptCoverage] = useState<ConceptCoverageData | null>(null);

  const fetchData = useCallback(async () => {
    if (!user?.student_id) return;
    try {
      const [materialsRes, profileRes, jobsRes, progressRes, progressStatsRes] =
        await Promise.all([
          learningGeneratorApi.getMaterials(user.student_id),
          learningGeneratorApi.getProfile(user.student_id),
          learningGeneratorApi.getJobsByStudent(user.student_id),
          learningGeneratorApi.getProgressByStudent(user.student_id),
          learningGeneratorApi.getProgressStats(user.student_id),
        ]);

      if (materialsRes.success && materialsRes.data) {
        const matData = materialsRes.data as any;
        setMaterials(matData.items || []);
      }
      if (profileRes.success) setProfile(profileRes.data);
      if (jobsRes.success && jobsRes.data) {
        const jobsData = (jobsRes.data as any) || [];
        setActiveJobs(jobsData.filter((j: GenerationJob) => j.status !== "closed"));
      }
      if (progressRes.success && progressRes.data) {
        setMaterialProgress(Array.isArray(progressRes.data) ? progressRes.data : []);
      }
      if (progressStatsRes.success && progressStatsRes.data) {
        setProgressStats(progressStatsRes.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.student_id]);

  useEffect(() => {
    if (user?.student_id) fetchData();
  }, [user?.student_id, fetchData]);

  useEffect(() => {
    if (!user?.student_id) return;
    const sid = user.student_id;
    let cancelled = false;
    learningGeneratorApi
      .getConceptCoverage(sid)
      .then((res) => {
        if (!cancelled && res.success && res.data) {
          setConceptCoverage(res.data);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user?.student_id]);

  useEffect(() => {
    if (!user?.student_id) return;
    const sid = user.student_id;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const poll = async () => {
      try {
        const [mRes, jRes] = await Promise.all([
          learningGeneratorApi.getMaterials(sid),
          learningGeneratorApi.getJobsByStudent(sid),
        ]);
        if (cancelled) return;
        if (mRes.success && mRes.data) {
          const mData = mRes.data as any;
          setMaterials(mData.items || []);
        }
        let hasActiveJobs = false;
        if (jRes.success && jRes.data) {
          const allJ = (jRes.data as any) || [];
          const visibleJ = allJ.filter((j: GenerationJob) => j.status !== "closed");
          hasActiveJobs = visibleJ.length > 0;
          setActiveJobs(visibleJ);
        }
        timer = setTimeout(poll, hasActiveJobs ? 5000 : 15000);
      } catch {
        if (!cancelled) {
          timer = setTimeout(poll, 15000);
        }
      }
    };

    timer = setTimeout(poll, 5000);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [user?.student_id]);

  const handleDismissJob = async (jobId: string) => {
    setClosingJobs((prev) => [...prev, jobId]);
    try {
      await learningGeneratorApi.closeJob(jobId);
    } catch (err) {
      console.error("Failed to close job:", err);
    } finally {
      setActiveJobs((prev) => prev.filter((j) => j.job_id !== jobId));
      setClosingJobs((prev) => prev.filter((id) => id !== jobId));
    }
  };

  const addJobToActive = (job: { job_id: string; student_id: string; gaps_queued: number }) => {
    setActiveJobs((prev) => {
      if (prev.find((j) => j.job_id === job.job_id)) return prev;
      return [
        ...prev,
        {
          job_id: job.job_id,
          student_id: job.student_id,
          profile_id: "",
          status: "processing",
          gaps_total: job.gaps_queued,
          gaps_completed: 0,
          gaps_failed: 0,
          materials_generated: 0,
          materials_failed: 0,
          created_at: new Date().toISOString(),
        },
      ];
    });
  };

  const masteryToSubmitPayload = (mastery: CanonicalMasteryProfile, studentId: string): SubmitProfilePayload => ({
    student_id: studentId,
    analysis_timestamp: mastery.analysis_timestamp || new Date().toISOString(),
    mastery_profile: {
      overall_mastery_score: mastery.mastery_profile.overall_mastery_score,
      knowledge_gaps: mastery.mastery_profile.knowledge_gaps.map((gap) => ({
        topic: gap.topic,
        topic_id: gap.topic_id,
        gap_type: gap.gap_type,
        confidence: gap.confidence,
        misconceptions: gap.misconceptions,
        observed_error_patterns: gap.observed_error_patterns,
        evidence_summary: gap.evidence_summary,
        prerequisite_topics: gap.prerequisite_topics,
        related_topics: gap.related_topics,
        suggested_intervention: gap.suggested_intervention,
      })),
      strengths: mastery.mastery_profile.strengths.map((s) => ({
        topic: s.topic,
        topic_id: s.topic_id,
        confidence: s.confidence,
        mastery_level: s.mastery_level,
        evidence_summary: s.evidence_summary,
        can_teach_others: s.can_teach_others,
      })),
    },
    recommendations: mastery.recommendations,
    data_sources: mastery.data_sources,
  });

  const handleGenerateFromMastery = async () => {
    if (!user?.student_id) return;
    setMasteryGenerating(true);
    setError(null);

    try {
      const mastery = await knowledgeProfileApi.getLatestMasteryProfile(user.student_id);
      const gaps = mastery.mastery_profile?.knowledge_gaps || [];
      if (gaps.length === 0) {
        setError("No knowledge gaps found in the saved mastery profile. Run KAA /analyze first.");
        return;
      }

      const res = await learningGeneratorApi.submitProfile(masteryToSubmitPayload(mastery, user.student_id));

      if (res.success && res.data) {
        addJobToActive(res.data);
      } else {
        setError(res.message || res.error || "Failed to submit mastery profile");
      }
    } catch (err: any) {
      setError(err?.message || "Could not load the saved mastery profile. Run KAA /analyze first.");
    } finally {
      setMasteryGenerating(false);
    }
  };

  const getProgressForMaterial = (materialId: string) => {
    return materialProgress.find((p) => p.material_id === materialId);
  };

  const getMaterialByTopic = (topic: string) => {
    return materials.find((m) => m.structured_material.topic.toLowerCase() === topic.toLowerCase());
  };

  // Resolved list of gaps (either live profile gaps or baseline curriculum gaps)
  const allGaps: KnowledgeGap[] =
    profile?.knowledge_gaps && profile.knowledge_gaps.length > 0
      ? profile.knowledge_gaps
      : defaultBaselineGaps;

  const totalGapsCount = allGaps.length;
  const criticalGapsCount = allGaps.filter((g) => g.gap_type === "FUNDAMENTAL_GAP").length;

  // Only in-progress gaps are shown on this view
  const displayedGaps = allGaps.filter(
    (g) => g.gap_type === "PARTIAL_GAP" || !!getProgressForMaterial(g.topic_id)
  );

  const materialsCount = materials.length > 0 ? materials.length : 9;
  const implicitMaterials = materials.filter(
    (m) => m.structured_material.generation_source === "implicit_prerequisite"
  );

  /* ───────────────────────── UI-only derived values ───────────────────────── */
  const usingSampleGaps = !(profile?.knowledge_gaps && profile.knowledge_gaps.length > 0);
  const minorGapsCount = allGaps.filter((g) => g.gap_type === "SURFACE_GAP").length;
  const partialGapsCount = allGaps.filter((g) => g.gap_type === "PARTIAL_GAP").length;

  // Recommended next step: first critical gap, otherwise the first gap
  const focusGap = allGaps.find((g) => g.gap_type === "FUNDAMENTAL_GAP") || allGaps[0];
  const focusMaterial = focusGap ? getMaterialByTopic(focusGap.topic) : undefined;
  const focusMeta = focusGap ? GAP_META[focusGap.gap_type] || GAP_META.SURFACE_GAP : null;

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-live="polite">
        <div className="text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-brand" />
          <p className="text-sm text-muted-foreground">Loading your learning plan</p>
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
            <span>Material Generator</span>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            <span className="text-foreground">Overview</span>
          </nav>
          <h1 className="text-3xl font-bold tracking-tight text-heading md:text-[2.1rem]">Your learning plan</h1>
          <p className="mt-2 leading-relaxed text-muted-foreground">
            Mentora turns each knowledge gap into a short course: a lesson, worked examples, practice code and a quiz.
            Start with the critical gaps, they unlock the rest.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border-strong bg-card px-3.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden />
            {refreshing ? "Refreshing" : "Refresh"}
          </button>
          <button
            type="button"
            onClick={handleGenerateFromMastery}
            disabled={masteryGenerating}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary-hover disabled:opacity-60"
          >
            {masteryGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Sparkles className="h-4 w-4" aria-hidden />
            )}
            {masteryGenerating ? "Generating" : "Generate materials"}
          </button>
        </div>
      </header>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p className="flex-1">{error}</p>
          <button type="button" onClick={() => setError(null)} aria-label="Dismiss error" className="rounded p-0.5 hover:bg-danger/10">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── NEXT STEP + SUMMARY ─────────────────────────────────────── */}
      <section className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        {/* Recommended next */}
        {focusGap && focusMeta && (
          <div className="relative overflow-hidden rounded-2xl bg-forest p-6 text-white shadow-raised md:p-7">
            <svg aria-hidden className="pointer-events-none absolute -right-12 -top-14 h-64 w-64 text-white/[0.06]" viewBox="0 0 200 200" fill="none">
              <path d="M100 10c40 30 70 70 60 120-10 40-50 60-60 60s-50-20-60-60C30 80 60 40 100 10Z" fill="currentColor" />
            </svg>
            <div className="relative">
              <p className="flex items-center gap-2 text-sm font-medium text-white/75">
                <Target className="h-4 w-4" aria-hidden /> Recommended next
              </p>
              <h2 className="mt-2 text-2xl font-bold leading-snug">{focusGap.topic}</h2>
              {focusGap.evidence_summary && (
                <p className="mt-2 line-clamp-2 max-w-xl text-sm leading-relaxed text-white/80">{focusGap.evidence_summary}</p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 font-medium ring-1 ring-white/20">
                  <span className={`h-1.5 w-1.5 rounded-full ${focusMeta.dot}`} aria-hidden />
                  {focusMeta.label} gap
                </span>
                {typeof focusGap.confidence === "number" && (
                  <span className="rounded-full bg-white/12 px-2.5 py-1 font-medium ring-1 ring-white/20">
                    {Math.round(focusGap.confidence * 100)}% confidence
                  </span>
                )}
                {focusGap.misconceptions && focusGap.misconceptions.length > 0 && (
                  <span className="rounded-full bg-white/12 px-2.5 py-1 font-medium ring-1 ring-white/20">
                    {focusGap.misconceptions.length} misconception{focusGap.misconceptions.length === 1 ? "" : "s"}
                  </span>
                )}
              </div>

              <div className="mt-6">
                {focusMaterial ? (
                  <Link
                    href={`/learning-generator/materials/${focusMaterial._id}`}
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-[#14532d] transition-colors hover:bg-[#e8f8ed]"
                  >
                    <BookOpen className="h-4 w-4" aria-hidden /> Open lesson
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={handleGenerateFromMastery}
                    disabled={masteryGenerating}
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-[#14532d] transition-colors hover:bg-[#e8f8ed] disabled:opacity-70"
                  >
                    {masteryGenerating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Sparkles className="h-4 w-4" aria-hidden />}
                    Generate this lesson
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Gap summary */}
        <div className="surface-card flex flex-col p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-foreground">Gap summary</h2>
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Layers className="h-4 w-4" aria-hidden /> {materialsCount} materials ready
            </span>
          </div>

          <p className="mt-4 text-4xl font-bold tabular-nums text-heading">
            {totalGapsCount}
            <span className="ml-2 text-base font-medium text-muted-foreground">gaps found</span>
          </p>

          {/* severity bar */}
          <div className="mt-4 flex h-2.5 w-full overflow-hidden rounded-full bg-muted ring-1 ring-inset ring-border" aria-hidden>
            {totalGapsCount > 0 && (
              <>
                <span className="h-full bg-danger" style={{ width: `${(criticalGapsCount / totalGapsCount) * 100}%` }} />
                <span className="h-full bg-warning" style={{ width: `${(partialGapsCount / totalGapsCount) * 100}%` }} />
                <span className="h-full bg-info" style={{ width: `${(minorGapsCount / totalGapsCount) * 100}%` }} />
              </>
            )}
          </div>

          <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
            {[
              { label: "Critical", value: criticalGapsCount, dot: "bg-danger" },
              { label: "Partial", value: partialGapsCount, dot: "bg-warning" },
              { label: "Minor", value: minorGapsCount, dot: "bg-info" },
            ].map((s) => (
              <div key={s.label} className="rounded-lg bg-muted px-3 py-2.5">
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  <span className={`h-2 w-2 rounded-full ${s.dot}`} aria-hidden />
                  {s.label}
                </dt>
                <dd className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">{s.value}</dd>
              </div>
            ))}
          </dl>

          {usingSampleGaps && (
            <p className="mt-auto flex items-start gap-2 pt-4 text-xs leading-relaxed text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              Showing a sample curriculum. Run a knowledge analysis to see your own gaps.
            </p>
          )}
        </div>
      </section>

      {/* ── BACKGROUND GENERATION STATUS ───────────────────────────── */}
      {activeJobs.length > 0 && (
        <ActiveJobsList jobs={activeJobs} onDismiss={handleDismissJob} closingJobs={closingJobs} />
      )}

      {/* ── PROGRESS ───────────────────────────────────────────────── */}
      <ProgressStatsCards stats={progressStats} progress={materialProgress} materials={materials} />

      {/* ── MAIN CONTENT ───────────────────────────────────────────── */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Knowledge gaps */}
        <section className="space-y-4 lg:col-span-2" aria-labelledby="gaps-heading">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="gaps-heading" className="text-xl font-bold text-heading">Knowledge gaps</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">Gaps you&apos;ve started — partial or with saved progress</p>
            </div>
          </div>

          {displayedGaps.length > 0 ? (
            <div className="space-y-4">
              {displayedGaps.map((gap: KnowledgeGap, i: number) => {
                const material = getMaterialByTopic(gap.topic);
                const progress = material ? getProgressForMaterial(material._id) : null;
                return (
                  <KnowledgeGapCard key={gap.topic_id || i} gap={gap} index={i} material={material} progress={progress || null} />
                );
              })}
            </div>
          ) : (
            <div className="surface-card px-6 py-12 text-center">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <SearchX className="h-5 w-5" aria-hidden />
              </div>
              <p className="font-semibold text-foreground">No gaps in progress</p>
              <p className="mt-1 text-sm text-muted-foreground">Gaps appear here once you start working on them.</p>
            </div>
          )}

          {/* Prerequisite materials */}
          {implicitMaterials.length > 0 && (
            <section className="space-y-3 pt-6" aria-labelledby="prereq-heading">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <h2 id="prereq-heading" className="flex items-center gap-2 text-lg font-bold text-heading">
                  <GitBranch className="h-5 w-5 text-brand" aria-hidden /> Foundations to learn first
                </h2>
                <span className="text-sm text-muted-foreground">Prerequisites your gaps depend on</span>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {implicitMaterials.map((m) => (
                  <MaterialCard key={m._id} material={m} />
                ))}
              </div>
            </section>
          )}
        </section>

        {/* Sidebar */}
        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start" aria-label="Learning plan details">
          <QuickActions onMasteryGenerateClick={handleGenerateFromMastery} masteryGenerating={masteryGenerating} />
          <ConceptCoverage coverage={conceptCoverage} />
          <ModuleProgressList progress={materialProgress} />
        </aside>
      </div>
    </div>
  );
}
