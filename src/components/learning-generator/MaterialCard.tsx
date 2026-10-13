"use client";

import Link from "next/link";
import { FileText, Calendar, Sparkles, Eye, Trash2 } from "lucide-react";
import type { LearningMaterial } from "@/lib/api/learningGenerator";

interface MaterialCardProps {
  material: LearningMaterial;
  onDelete?: (material: LearningMaterial) => void;
}

const gapColorMap: Record<string, { bg: string; border: string; text: string }> = {
  FUNDAMENTAL_GAP: { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-700 dark:text-red-400 font-bold" },
  PARTIAL_GAP: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-800 dark:text-amber-400 font-bold" },
  SURFACE_GAP: { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-700 dark:text-blue-400 font-bold" },
  default: { bg: "bg-[var(--lmg-bg-subtle)]", border: "border-[var(--lmg-border)]", text: "text-[var(--lmg-text-muted)]" },
};

const difficultyColorMap: Record<string, string> = {
  beginner: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 font-bold",
  intermediate: "bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-500/20 font-bold",
  advanced: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20 font-bold",
  default: "bg-[var(--lmg-bg-subtle)] text-[var(--lmg-text-muted)] border-[var(--lmg-border)]",
};

export default function MaterialCard({ material, onDelete }: MaterialCardProps) {
  const sm = material.structured_material;
  const colors = gapColorMap[sm.gap_type] || gapColorMap.default;
  const diffColor = difficultyColorMap[sm.difficulty_level] || difficultyColorMap.default;

  return (
    <div className="group p-5 bg-[var(--lmg-bg-surface)] border border-[var(--lmg-border)] rounded-2xl hover:border-teal-500/40 shadow-xs hover:shadow-card transition-all ">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`whitespace-nowrap px-2 py-0.5 rounded text-[10px] uppercase tracking-wider border ${diffColor}`}>
            {sm.difficulty_level}
          </span>
          {sm.generation_source === "implicit_prerequisite" && (
            <span className="whitespace-nowrap px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20">
              Prerequisite
            </span>
          )}
          <span className={`whitespace-nowrap px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${colors.bg} ${colors.border} ${colors.text}`}>
            {sm.gap_type.replace("_", " ")}
          </span>
        </div>
        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(material);
            }}
            className="mt-0.5 shrink-0 p-1.5 rounded-lg text-[var(--lmg-text-muted)] hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors cursor-pointer"
            aria-label={`Delete ${sm.topic}`}
            title="Delete material"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <h3 className="text-base font-bold text-[var(--lmg-text-primary)] group-hover:text-teal-600 dark:group-hover:text-teal-300 transition-colors mb-1 truncate" title={sm.topic}>
        {sm.topic}
      </h3>
      <p className="text-xs text-[var(--lmg-text-muted)] mb-4 font-mono truncate" title={sm.topic_id}>
        {sm.topic_id}
      </p>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2.5 text-xs text-[var(--lmg-text-secondary)]">
          <FileText className="w-3.5 h-3.5 shrink-0 text-teal-600 dark:text-teal-400" />
          <span className="truncate">
            {[sm.lesson?.concept_explained && "Concepts", sm.lesson?.examples && "Examples", sm.assessment?.quiz && "Quiz"]
              .filter(Boolean)
              .join(" + ")}
          </span>
        </div>
        <div className="flex items-center gap-2.5 text-xs text-[var(--lmg-text-secondary)]">
          <Calendar className="w-3.5 h-3.5 shrink-0" />
          <span>{new Date(sm.generated_at).toLocaleDateString()}</span>
        </div>
        {sm.generation_models && (
          <div className="flex items-center gap-2.5 text-xs text-[var(--lmg-text-secondary)]">
            <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-500 dark:text-amber-400" />
            <span className="truncate">{sm.generation_models.llm || "N/A"}</span>
          </div>
        )}
      </div>

      <Link
        href={`/learning-generator/materials/${material._id}`}
        className="w-full py-2.5 bg-teal-500/15 border border-teal-500/30 text-teal-700 dark:text-teal-400 text-xs font-bold rounded-xl hover:bg-teal-500/25 transition-colors flex items-center justify-center gap-2"
      >
        <Eye className="w-3.5 h-3.5" /> Open Workspace
      </Link>
    </div>
  );
}
