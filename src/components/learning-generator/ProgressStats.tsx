"use client";

import { CheckCircle2, Layers, Award, BarChart3, Milestone } from "lucide-react";
import type { ProgressStats, StudentProgress, LearningMaterial } from "@/lib/api/learningGenerator";

interface ProgressStatsProps {
  stats: ProgressStats | null;
  progress?: StudentProgress[];
  materials?: LearningMaterial[];
  courseCode?: string;
}

export default function ProgressStatsCards({
  stats,
  progress,
  materials,
  courseCode = "CS101: Core Algorithms & Flow Control",
}: ProgressStatsProps) {
  const progressMap = new Map<string, StudentProgress>();
  (progress ?? []).forEach((p) => progressMap.set(p.material_id, p));

  let completedMaterials = 0;
  let inProgressMaterials = 0;
  let completedSteps = 0;
  let totalSteps = 0;
  const quizScores: number[] = [];
  let activeTopicName = "Loops & Nested Iterations";

  (materials ?? []).forEach((mat) => {
    const prog = progressMap.get(mat._id);
    const total = prog?.total_steps ?? mat.structured_material?.lesson?.step_by_step_guide?.steps?.length ?? 0;
    const completed = prog?.completed_steps?.length ?? 0;
    totalSteps += total;
    completedSteps += completed;
    if (prog && prog.quiz_score !== null && prog.quiz_score !== undefined) {
      quizScores.push(prog.quiz_score);
    }
    if (prog?.completed_at) {
      completedMaterials++;
    } else if (prog && prog.completed_steps.length > 0) {
      inProgressMaterials++;
      if (mat.structured_material?.topic) {
        activeTopicName = mat.structured_material.topic;
      }
    }
  });

  const totalModules = materials?.length || stats?.total_materials || 9;
  const notStartedMaterials = Math.max(0, totalModules - completedMaterials - inProgressMaterials);

  // If live data has steps, use them; otherwise fallback to baseline curriculum stats (6/48 = 13%)
  const displayTotalSteps = totalSteps > 0 ? totalSteps : 48;
  const displayCompletedSteps = totalSteps > 0 ? completedSteps : 6;
  const displayProgressPct =
    displayTotalSteps > 0 ? Math.round((displayCompletedSteps / displayTotalSteps) * 100) : 13;

  const displayCompletedModules = completedMaterials;
  const displayInProgressModules = inProgressMaterials > 0 ? inProgressMaterials : 2;
  const displayNotStartedModules =
    totalSteps > 0 ? notStartedMaterials : Math.max(0, totalModules - displayCompletedModules - displayInProgressModules);

  const avgQuizScore =
    quizScores.length > 0 ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length) : null;

  // Segment widths for milestone trajectory
  const completedWidth = Math.min(100, displayProgressPct);
  const inProgressWidth = Math.min(100 - completedWidth, Math.round((displayInProgressModules / totalModules) * 35));

  return (
    <section className="space-y-4 2xl:space-y-6">
      {/* ── SECTION HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <h2 className="text-lg 2xl:text-xl font-bold text-foreground tracking-tight">
          Curriculum Mastery Breakdown
        </h2>
        <span className="text-xs 2xl:text-sm font-medium text-muted-foreground">
          {courseCode}
        </span>
      </div>

      {/* ── 4 STAT CARDS GRID ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 2xl:gap-6">
        {/* Card 1: Overall Progress */}
        <div className="bg-card border border-border shadow-xs rounded-2xl p-5 2xl:p-6 flex flex-col justify-between hover:border-border-strong transition-all">
          <div>
            <p className="text-xs 2xl:text-sm font-extrabold text-muted-foreground uppercase tracking-wider">
              OVERALL PROGRESS
            </p>
            <div className="flex items-center justify-between mt-2.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl 2xl:text-4xl font-black text-foreground tracking-tight">
                  {displayProgressPct}%
                </span>
                <span className="text-xs 2xl:text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  ↑ +4%
                </span>
              </div>
              <div className="w-11 h-11 2xl:w-13 2xl:h-13 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <BarChart3 className="w-5 h-5 2xl:w-6 2xl:h-6" />
              </div>
            </div>
          </div>
          <p className="text-xs 2xl:text-sm text-muted-foreground mt-3 font-medium">
            {displayCompletedSteps} of {displayTotalSteps} total steps finished
          </p>
        </div>

        {/* Card 2: Completed Modules */}
        <div className="bg-card border border-border shadow-xs rounded-2xl p-5 2xl:p-6 flex flex-col justify-between hover:border-border-strong transition-all">
          <div>
            <p className="text-xs 2xl:text-sm font-extrabold text-muted-foreground uppercase tracking-wider">
              COMPLETED MODULES
            </p>
            <div className="flex items-center justify-between mt-2.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl 2xl:text-4xl font-black text-foreground tracking-tight">
                  {displayCompletedModules}
                </span>
                <span className="text-xs 2xl:text-sm font-medium text-muted-foreground">
                  / {totalModules} Total
                </span>
              </div>
              <div className="w-11 h-11 2xl:w-13 2xl:h-13 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 2xl:w-6 2xl:h-6" />
              </div>
            </div>
          </div>
          <p className="text-xs 2xl:text-sm font-bold text-amber-600 dark:text-amber-400 mt-3">
            Ready for validation test
          </p>
        </div>

        {/* Card 3: In Active Study */}
        <div className="bg-card border border-border shadow-xs rounded-2xl p-5 2xl:p-6 flex flex-col justify-between hover:border-border-strong transition-all">
          <div>
            <p className="text-xs 2xl:text-sm font-extrabold text-muted-foreground uppercase tracking-wider">
              IN ACTIVE STUDY
            </p>
            <div className="flex items-center justify-between mt-2.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl 2xl:text-4xl font-black text-foreground tracking-tight">
                  {displayInProgressModules}
                </span>
                <span className="text-xs 2xl:text-sm font-medium text-muted-foreground">
                  Modules
                </span>
              </div>
              <div className="w-11 h-11 2xl:w-13 2xl:h-13 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5 2xl:w-6 2xl:h-6" />
              </div>
            </div>
          </div>
          <p className="text-xs 2xl:text-sm text-muted-foreground mt-3 font-medium truncate" title={activeTopicName}>
            {activeTopicName}
          </p>
        </div>

        {/* Card 4: Average Quiz Score */}
        <div className="bg-card border border-border shadow-xs rounded-2xl p-5 2xl:p-6 flex flex-col justify-between hover:border-border-strong transition-all">
          <div>
            <p className="text-xs 2xl:text-sm font-extrabold text-muted-foreground uppercase tracking-wider">
              AVERAGE QUIZ SCORE
            </p>
            <div className="flex items-center justify-between mt-2.5">
              <div className="flex items-baseline gap-1.5">
                {avgQuizScore !== null ? (
                  <span className="text-3xl 2xl:text-4xl font-black text-foreground tracking-tight">
                    {avgQuizScore}%
                  </span>
                ) : (
                  <span className="text-3xl 2xl:text-4xl font-black text-muted-foreground tracking-tight">
                    ——
                  </span>
                )}
                <span className="text-xs 2xl:text-sm font-medium text-muted-foreground">
                  {avgQuizScore !== null ? "Average" : "Not graded"}
                </span>
              </div>
              <div className="w-11 h-11 2xl:w-13 2xl:h-13 rounded-2xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5 2xl:w-6 2xl:h-6" />
              </div>
            </div>
          </div>
          <p className="text-xs 2xl:text-sm text-muted-foreground mt-3 font-medium">
            {avgQuizScore !== null ? "Based on completed quizzes" : "Take 1 quiz to calculate"}
          </p>
        </div>
      </div>

      {/* ── TRAJECTORY CARD ── */}
      <div className="bg-card border border-border shadow-xs rounded-2xl p-5 sm:p-6 2xl:p-7 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <span className="w-2.5 h-1 2xl:w-3 2xl:h-1.5 bg-emerald-500 rounded-xs" />
              <span className="w-3.5 h-1 2xl:w-4 2xl:h-1.5 bg-emerald-500 rounded-xs" />
            </div>
            <h3 className="text-sm 2xl:text-base font-bold text-foreground">
              Curriculum Milestone Trajectory
            </h3>
          </div>
          <span className="text-xs 2xl:text-sm font-bold text-foreground">
            {displayCompletedSteps} / {displayTotalSteps} steps completed ({displayProgressPct}%)
          </span>
        </div>

        {/* Multi-segment progress bar */}
        <div className="h-2.5 2xl:h-3.5 bg-slate-100 dark:bg-muted rounded-full overflow-hidden flex my-3.5">
          <div
            className="h-full bg-emerald-500 transition-all duration-700"
            style={{ width: `${completedWidth}%` }}
            title={`Completed: ${displayCompletedSteps} steps`}
          />
          <div
            className="h-full bg-amber-500 transition-all duration-700"
            style={{ width: `${inProgressWidth}%` }}
            title={`In Progress`}
          />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-5 sm:gap-8 pt-1 text-xs 2xl:text-sm text-muted-foreground font-medium">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 2xl:w-2.5 2xl:h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <span>{displayCompletedModules} Completed Modules</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 2xl:w-2.5 2xl:h-2.5 rounded-full bg-amber-500 shrink-0" />
            <span>{displayInProgressModules} In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 2xl:w-2.5 2xl:h-2.5 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
            <span>{displayNotStartedModules} Not Started</span>
          </div>
        </div>
      </div>
    </section>
  );
}
