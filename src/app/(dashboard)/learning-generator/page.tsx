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
import { AlertTriangle, ChevronRight, Loader2, GitBranch } from "lucide-react";
import JobCard, { ActiveJobsList } from "@/components/learning-generator/JobCard";
import ProgressStatsCards from "@/components/learning-generator/ProgressStats";
import KnowledgeGapCard from "@/components/learning-generator/KnowledgeGapCard";
import MaterialCard from "@/components/learning-generator/MaterialCard";
import {
  QuickActions,
  ModuleProgressList,
  ScoreHistory,
  StrengthsList,
  ConceptCoverage,
} from "@/components/learning-generator/OverviewSidebar";

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
  const [profileHistory, setProfileHistory] = useState<any[]>([]);
  const [activeJobs, setActiveJobs] = useState<GenerationJob[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [progressStats, setProgressStats] = useState<ProgressStats | null>(null);
  const [materialProgress, setMaterialProgress] = useState<StudentProgress[]>([]);
  const [masteryGenerating, setMasteryGenerating] = useState(false);
  const [closingJobs, setClosingJobs] = useState<string[]>([]);
  const [conceptCoverage, setConceptCoverage] = useState<ConceptCoverageData | null>(null);

  // Filter tabs for Knowledge Gaps: ALL | CRITICAL | IN_PROGRESS
  const [gapFilter, setGapFilter] = useState<"ALL" | "CRITICAL" | "IN_PROGRESS">("ALL");
  const [sampleJobDismissed, setSampleJobDismissed] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user?.student_id) return;
    try {
      const [materialsRes, profileRes, historyRes, jobsRes, progressRes, progressStatsRes, coverageRes] =
        await Promise.all([
          learningGeneratorApi.getMaterials(user.student_id),
          learningGeneratorApi.getProfile(user.student_id),
          learningGeneratorApi.getProfileHistory(user.student_id, 1, 5),
          learningGeneratorApi.getJobsByStudent(user.student_id),
          learningGeneratorApi.getProgressByStudent(user.student_id),
          learningGeneratorApi.getProgressStats(user.student_id),
          learningGeneratorApi.getConceptCoverage(user.student_id),
        ]);

      if (materialsRes.success && materialsRes.data) {
        const matData = materialsRes.data as any;
        setMaterials(matData.items || []);
      }
      if (profileRes.success) setProfile(profileRes.data);
      if (historyRes.success && historyRes.data) {
        const histData = historyRes.data as any;
        setProfileHistory(histData.items || []);
      }
      if (jobsRes.success && jobsRes.data) {
        const jobsData = (jobsRes.data as any) || [];
        const visible = jobsData.filter((j: GenerationJob) => j.status !== "closed");
        setActiveJobs(visible);

        if (!pollingInterval) {
          const sid = user!.student_id!;
          const interval = setInterval(async () => {
            const [mRes, jRes] = await Promise.all([
              learningGeneratorApi.getMaterials(sid),
              learningGeneratorApi.getJobsByStudent(sid),
            ]);
            if (mRes.success && mRes.data) {
              const mData = mRes.data as any;
              setMaterials(mData.items || []);
            }
            if (jRes.success && jRes.data) {
              const allJ = (jRes.data as any) || [];
              const visibleJ = allJ.filter((j: GenerationJob) => j.status !== "closed");
              setActiveJobs(visibleJ);
            }
          }, 5000);
          setPollingInterval(interval);
        }
      }
      if (progressRes.success && progressRes.data) {
        setMaterialProgress(Array.isArray(progressRes.data) ? progressRes.data : []);
      }
      if (progressStatsRes.success && progressStatsRes.data) {
        setProgressStats(progressStatsRes.data);
      }
      if (coverageRes.success && coverageRes.data) {
        setConceptCoverage(coverageRes.data);
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
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [user?.student_id, fetchData]);

  const handleDismissJob = async (jobId: string) => {
    if (jobId === "JOB_1788208482233") {
      setSampleJobDismissed(true);
      return;
    }
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
  const inProgressGapsCount = allGaps.filter(
    (g) => g.gap_type === "PARTIAL_GAP" || !!getProgressForMaterial(g.topic_id)
  ).length;

  // Filtered knowledge gaps based on the selected tab
  const displayedGaps = allGaps.filter((g) => {
    if (gapFilter === "CRITICAL") return g.gap_type === "FUNDAMENTAL_GAP";
    if (gapFilter === "IN_PROGRESS")
      return g.gap_type === "PARTIAL_GAP" || !!getProgressForMaterial(g.topic_id);
    return true;
  });

  const materialsCount = materials.length > 0 ? materials.length : 9;
  const implicitMaterials = materials.filter(
    (m) => m.structured_material.generation_source === "implicit_prerequisite"
  );

  // Sample completed background job if none currently active
  const fallbackSampleJob: GenerationJob = {
    job_id: "JOB_1788208482233",
    student_id: user?.student_id || "kaweesha",
    profile_id: "profile_adaptive_01",
    status: "completed",
    gaps_total: 9,
    gaps_completed: 9,
    gaps_failed: 0,
    materials_generated: 9,
    materials_failed: 0,
    created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-sm font-medium">Loading Material Generator...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-slide-up pb-12">
      {/* ── HERO CARD ── */}
      <div className="bg-card border border-border shadow-xs rounded-3xl p-6 sm:p-8 2xl:p-10 transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 2xl:gap-8">
          <div className="flex-1 max-w-2xl 2xl:max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 2xl:px-4 2xl:py-1.5 rounded-full bg-emerald-50/80 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs 2xl:text-sm font-bold tracking-wider uppercase mb-3 2xl:mb-4 shadow-xs">
              AI-POWERED ADAPTIVE LEARNING
            </div>
            <h1 className="text-3xl lg:text-4xl 2xl:text-5xl font-black text-foreground tracking-tight mb-2 2xl:mb-3">
              Material Generator
            </h1>
            <p className="text-muted-foreground text-sm sm:text-[15px] 2xl:text-lg leading-relaxed">
              Personalized tutorials, real-world code exercises, and targeted assessments synthesized specifically from
              your unique knowledge gaps and code execution patterns.
            </p>
          </div>

          <div className="flex items-center gap-3 sm:gap-3.5 2xl:gap-4 shrink-0">
            {/* Stat 1: Gaps Found */}
            <div className="bg-card border border-border shadow-xs rounded-2xl p-4 sm:p-5 2xl:p-6 text-center min-w-[105px] 2xl:min-w-[130px] transition-colors">
              <p className="text-3xl lg:text-4xl 2xl:text-5xl font-black text-foreground">{totalGapsCount}</p>
              <p className="text-xs 2xl:text-sm text-muted-foreground font-extrabold uppercase tracking-wider mt-1.5">
                Gaps Found
              </p>
            </div>

            {/* Stat 2: Critical */}
            <div className="bg-red-50/50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 shadow-xs rounded-2xl p-4 sm:p-5 2xl:p-6 text-center min-w-[105px] 2xl:min-w-[130px] transition-colors">
              <p className="text-3xl lg:text-4xl 2xl:text-5xl font-black text-red-600 dark:text-red-400">
                {criticalGapsCount}
              </p>
              <p className="text-xs 2xl:text-sm text-red-600 dark:text-red-400 font-extrabold uppercase tracking-wider mt-1.5">
                Critical
              </p>
            </div>

            {/* Stat 3: Materials */}
            <div className="bg-emerald-50/50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 shadow-xs rounded-2xl p-4 sm:p-5 2xl:p-6 text-center min-w-[105px] 2xl:min-w-[130px] transition-colors">
              <p className="text-3xl lg:text-4xl 2xl:text-5xl font-black text-emerald-600 dark:text-emerald-400">
                {materialsCount}
              </p>
              <p className="text-xs 2xl:text-sm text-emerald-700 dark:text-emerald-400 font-extrabold uppercase tracking-wider mt-1.5">
                Materials
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── ACTIVE BACKGROUND TASK BANNER ── */}
      {activeJobs.length > 0 ? (
        <ActiveJobsList jobs={activeJobs} onDismiss={handleDismissJob} closingJobs={closingJobs} />
      ) : !sampleJobDismissed ? (
        <JobCard job={fallbackSampleJob} onDismiss={handleDismissJob} closingJobs={[]} />
      ) : null}

      {/* ── CURRICULUM MASTERY BREAKDOWN ── */}
      <ProgressStatsCards stats={progressStats} progress={materialProgress} materials={materials} />

      {/* ── MAIN CONTENT (GAPS + SIDEBAR) ── */}
      <div className="grid lg:grid-cols-3 gap-6 sm:gap-8 2xl:gap-10">
        {/* ── LEFT: Identified Knowledge Gaps ── */}
        <div className="lg:col-span-2 space-y-4 2xl:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
            <div>
              <h2 className="text-lg 2xl:text-2xl font-bold text-foreground flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 2xl:w-6 2xl:h-6 text-amber-500 shrink-0" />
                Identified Knowledge Gaps
              </h2>
              <p className="text-xs 2xl:text-sm text-muted-foreground mt-0.5">
                Prioritized by severity and dependency hierarchy
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 2xl:gap-2 p-1 2xl:p-1.5 bg-muted/60 dark:bg-muted/40 rounded-full border border-border self-start sm:self-auto">
              <button
                onClick={() => setGapFilter("ALL")}
                className={`px-3.5 py-1 2xl:px-4 2xl:py-1.5 rounded-full text-xs 2xl:text-sm font-bold transition-all cursor-pointer ${
                  gapFilter === "ALL"
                    ? "bg-card text-foreground shadow-xs border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All ({totalGapsCount})
              </button>
              <button
                onClick={() => setGapFilter("CRITICAL")}
                className={`px-3.5 py-1 2xl:px-4 2xl:py-1.5 rounded-full text-xs 2xl:text-sm font-bold transition-all cursor-pointer ${
                  gapFilter === "CRITICAL"
                    ? "bg-card text-foreground shadow-xs border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Critical ({criticalGapsCount})
              </button>
              <button
                onClick={() => setGapFilter("IN_PROGRESS")}
                className={`px-3.5 py-1 2xl:px-4 2xl:py-1.5 rounded-full text-xs 2xl:text-sm font-bold transition-all cursor-pointer ${
                  gapFilter === "IN_PROGRESS"
                    ? "bg-card text-foreground shadow-xs border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                In Progress ({inProgressGapsCount})
              </button>
            </div>
          </div>

          {/* Gaps List */}
          <div className="space-y-4">
            {displayedGaps.map((gap: KnowledgeGap, i: number) => {
              const material = getMaterialByTopic(gap.topic);
              const progress = material ? getProgressForMaterial(material._id) : null;
              return (
                <div
                  key={gap.topic_id || i}
                  className="animate-slide-up"
                  style={{ animationDelay: `${i * 60}ms`, animationFillMode: "backwards" }}
                >
                  <KnowledgeGapCard gap={gap} index={i} material={material} progress={progress || null} />
                </div>
              );
            })}
          </div>

          {/* ── PREREQUISITE MATERIALS (if any) ── */}
          {implicitMaterials.length > 0 && (
            <div className="space-y-3 pt-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> Prerequisite Materials
                </h2>
                <span className="text-xs text-muted-foreground font-medium">
                  essential foundations you&apos;re missing — master these first
                </span>
              </div>
              <div className="grid md:grid-cols-2 gap-3.5">
                {implicitMaterials.map((m) => (
                  <MaterialCard key={m._id} material={m} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Sidebar ── */}
        <div className="space-y-6">
          {error && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}
          <QuickActions
            onMasteryGenerateClick={handleGenerateFromMastery}
            masteryGenerating={masteryGenerating}
          />
          <ConceptCoverage coverage={conceptCoverage} />
          <ModuleProgressList progress={materialProgress} />
          <ScoreHistory history={profileHistory} />
          <StrengthsList strengths={profile?.strengths || []} />
        </div>
      </div>
    </div>
  );
}
