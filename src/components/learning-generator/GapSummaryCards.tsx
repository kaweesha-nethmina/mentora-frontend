"use client";

import type { KnowledgeGap } from "@/lib/api/learningGenerator";

interface GapSummaryCardsProps {
  profile: any;
}

export default function GapSummaryCards({ profile }: GapSummaryCardsProps) {
  if (!profile) return null;

  const gapCounts = {
    ALL: profile.knowledge_gaps?.length || 0,
    FUNDAMENTAL_GAP: profile.knowledge_gaps?.filter((g: KnowledgeGap) => g.gap_type === "FUNDAMENTAL_GAP").length || 0,
    PARTIAL_GAP: profile.knowledge_gaps?.filter((g: KnowledgeGap) => g.gap_type === "PARTIAL_GAP").length || 0,
    SURFACE_GAP: profile.knowledge_gaps?.filter((g: KnowledgeGap) => g.gap_type === "SURFACE_GAP").length || 0,
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="p-5 bg-[var(--lmg-bg-surface)] border border-[var(--lmg-border)] rounded-2xl shadow-xs dark:shadow-card transition-colors">
        <p className="text-3xl font-extrabold text-[var(--lmg-text-primary)]">{gapCounts.ALL}</p>
        <p className="text-xs text-[var(--lmg-text-muted)] mt-1 font-medium">Total Gaps</p>
      </div>
      <div className="p-5 bg-red-500/5 border border-red-500/15 rounded-2xl shadow-xs dark:shadow-card transition-colors">
        <p className="text-3xl font-extrabold text-red-600 dark:text-red-400">{gapCounts.FUNDAMENTAL_GAP}</p>
        <p className="text-xs text-red-600/70 dark:text-red-400/60 mt-1 font-medium">Fundamental</p>
      </div>
      <div className="p-5 bg-amber-500/5 border border-amber-500/15 rounded-2xl shadow-xs dark:shadow-card transition-colors">
        <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">{gapCounts.PARTIAL_GAP}</p>
        <p className="text-xs text-amber-600/70 dark:text-amber-400/60 mt-1 font-medium">Partial</p>
      </div>
      <div className="p-5 bg-blue-500/5 border border-blue-500/15 rounded-2xl shadow-xs dark:shadow-card transition-colors">
        <p className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{gapCounts.SURFACE_GAP}</p>
        <p className="text-xs text-blue-600/70 dark:text-blue-400/60 mt-1 font-medium">Surface</p>
      </div>
    </div>
  );
}
