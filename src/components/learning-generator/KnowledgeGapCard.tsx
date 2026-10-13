"use client";

import Link from "next/link";
import { Brain, Clock, CheckCircle2, ArrowRight } from "lucide-react";
import type { KnowledgeGap, LearningMaterial, StudentProgress } from "@/lib/api/learningGenerator";

interface KnowledgeGapCardProps {
  gap: KnowledgeGap;
  index: number;
  material?: LearningMaterial;
  progress?: StudentProgress | null;
}

const gapColorMap: Record<string, { badge: string; border: string }> = {
  FUNDAMENTAL_GAP: {
    badge: "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 font-bold",
    border: "border-red-200/90 dark:border-red-500/30",
  },
  PARTIAL_GAP: {
    badge: "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 font-bold",
    border: "border-amber-200/70 dark:border-amber-500/20",
  },
  SURFACE_GAP: {
    badge: "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 font-bold",
    border: "border-border",
  },
  default: {
    badge: "bg-muted border-border text-muted-foreground font-bold",
    border: "border-border",
  },
};

export default function KnowledgeGapCard({ gap, index, material, progress }: KnowledgeGapCardProps) {
  const colors = gapColorMap[gap.gap_type] || gapColorMap.default;
  const isFundamental = gap.gap_type === "FUNDAMENTAL_GAP";

  return (
    <div
      className={`bg-card ${colors.border} hover:border-foreground/30 shadow-xs hover:shadow-card transition-all rounded-2xl overflow-hidden relative group border`}
    >
      <div className="p-6 2xl:p-7">
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <div>
            <h3 className="font-bold text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors text-base 2xl:text-lg tracking-tight">
              {gap.topic}
            </h3>
            <p className="text-xs 2xl:text-sm text-muted-foreground mt-0.5 font-mono">
              {gap.topic_id}
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shrink-0 ${colors.badge}`}
          >
            {gap.gap_type.replace("_", " ")}
          </span>
        </div>

        {gap.evidence_summary && (
          <p className="text-sm 2xl:text-base text-foreground/85 mb-4 leading-relaxed">
            {gap.evidence_summary}
          </p>
        )}

        {gap.misconceptions && gap.misconceptions.length > 0 && (
          <div className="mb-4">
            <p className="text-xs 2xl:text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 2xl:w-4 2xl:h-4 text-emerald-600 dark:text-emerald-400" />
              Observed Misconceptions
            </p>
            <div className="flex flex-wrap gap-2">
              {gap.misconceptions.slice(0, 3).map((m, mi) => (
                <span
                  key={mi}
                  className="px-2.5 py-1 2xl:px-3 2xl:py-1.5 bg-amber-50/80 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300 rounded-lg text-xs 2xl:text-sm font-medium"
                >
                  {m}
                </span>
              ))}
              {gap.misconceptions.length > 3 && (
                <span className="px-2.5 py-1 2xl:px-3 2xl:py-1.5 bg-muted border border-border rounded-lg text-xs 2xl:text-sm text-muted-foreground font-medium">
                  +{gap.misconceptions.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {material && progress && (
          <div className="mb-4 pt-2">
            <div className="flex justify-between text-xs 2xl:text-sm text-muted-foreground mb-1.5 font-medium">
              <span>{progress.completed_steps.length} / {progress.total_steps} steps</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                {Math.round((progress.completed_steps.length / progress.total_steps) * 100)}%
              </span>
            </div>
            <div className="w-full h-1.5 2xl:h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                style={{
                  width: `${(progress.completed_steps.length / progress.total_steps) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-border mt-2">
          <div className="flex items-center gap-4 text-xs 2xl:text-sm text-muted-foreground">
            {gap.confidence && (
              <span className="flex items-center gap-1.5 font-medium">
                <Brain className="w-3.5 h-3.5 2xl:w-4 2xl:h-4 text-emerald-600 dark:text-emerald-400" />
                {Math.round(gap.confidence * 100)}% confidence
              </span>
            )}
            {progress?.completed_at && (
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 2xl:w-4 2xl:h-4" /> Completed
              </span>
            )}
          </div>
          {material ? (
            <Link
              href={`/learning-generator/materials/${material._id}`}
              className="px-3.5 py-1.5 2xl:px-4 2xl:py-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300/80 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs 2xl:text-sm font-bold rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
            >
              {progress?.completed_at ? "Review" : "Continue"} <ArrowRight className="w-3 h-3 2xl:w-3.5 2xl:h-3.5" />
            </Link>
          ) : (
            <span className="text-xs 2xl:text-sm text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 2xl:w-4 2xl:h-4" /> Pending generation
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
