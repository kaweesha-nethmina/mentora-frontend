"use client";

import { XCircle, Sparkles, Lightbulb, Brain } from "lucide-react";
import { formatInsightText } from "./formatInsightText";

interface InsightPanelProps {
  aiInsight: string | null;
  insightType: "simpler" | "analogy" | null;
  insightActiveTab: "simpler" | "analogy" | null;
  onClose: () => void;
}

export default function InsightPanel({
  aiInsight,
  insightType,
  insightActiveTab,
  onClose,
}: InsightPanelProps) {
  if (!aiInsight && !insightType) return null;
  if (!insightActiveTab) return null;

  return (
    <div className="mt-6 bg-[var(--lmg-bg-surface)] border border-[var(--lmg-border)] rounded-2xl overflow-hidden animate-slide-up shadow-sm">
      {/* Insight Type Header */}
      <div className={`px-6 py-3 border-b ${insightActiveTab === "simpler" ? "bg-teal-500/10 border-teal-500/20" : "bg-amber-500/10 border-amber-500/20"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${insightActiveTab === "simpler" ? "bg-teal-500/20" : "bg-amber-500/20"}`}>
              {insightActiveTab === "simpler" ? <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" /> : <Lightbulb className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
            </div>
            <p className={`text-xs font-bold uppercase tracking-wider ${insightActiveTab === "simpler" ? "text-teal-600 dark:text-teal-400" : "text-amber-600 dark:text-amber-400"}`}>
              {insightActiveTab === "simpler" ? "Simplified Explanation" : "Real-life Analogy"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--lmg-text-muted)] hover:text-[var(--lmg-text-primary)] transition-colors"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {insightType && !aiInsight ? (
          <div className="flex items-center gap-3 py-2">
            <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center shrink-0">
              <Brain className="w-4 h-4 text-teal-700 dark:text-teal-400 animate-pulse" />
            </div>
            <div>
              <p className="text-xs text-teal-700 dark:text-teal-400/60 font-bold">Mentora AI is Thinking</p>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce delay-100" />
                <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {formatInsightText(aiInsight || "")}
          </div>
        )}
      </div>
    </div>
  );
}
