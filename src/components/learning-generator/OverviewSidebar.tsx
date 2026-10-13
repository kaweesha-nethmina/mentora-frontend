"use client";

import Link from "next/link";
import { Zap, Sparkles, BookOpen, Target, BarChart3, CheckCircle2, Layers, ChevronRight, Wand2, Loader2 } from "lucide-react";
import type { ConceptCoverage as ConceptCoverageData } from "@/lib/api/learningGenerator";

interface QuickActionsProps {
  onMasteryGenerateClick: () => void;
  masteryGenerating?: boolean;
}

export function QuickActions({ onMasteryGenerateClick, masteryGenerating }: QuickActionsProps) {
  return (
    <div className="space-y-3 2xl:space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base 2xl:text-lg font-bold text-foreground flex items-center gap-2">
          <Zap className="w-4 h-4 2xl:w-5 2xl:h-5 text-emerald-600 dark:text-emerald-400" /> Quick Actions
        </h2>
        <span className="text-xs 2xl:text-sm font-bold text-muted-foreground uppercase tracking-wider">
          AI TOOLS
        </span>
      </div>
      <button
        onClick={onMasteryGenerateClick}
        disabled={masteryGenerating}
        className="w-full p-4 2xl:p-5 bg-card border border-border hover:border-emerald-500/40 rounded-2xl transition-all text-left flex items-start gap-3.5 2xl:gap-4 disabled:cursor-wait disabled:opacity-60 cursor-pointer shadow-xs group"
      >
        <div className="w-10 h-10 2xl:w-12 2xl:h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
          {masteryGenerating ? (
            <Loader2 className="w-5 h-5 2xl:w-6 2xl:h-6 animate-spin" />
          ) : (
            <Sparkles className="w-5 h-5 2xl:w-6 2xl:h-6" />
          )}
        </div>
        <div>
          <h3 className="text-sm 2xl:text-base font-bold text-foreground mb-0.5 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
            Generate Materials
          </h3>
          <p className="text-xs 2xl:text-sm text-muted-foreground leading-relaxed">
            {masteryGenerating ? "Reading saved mastery gaps..." : "Generate from Knowledge Assist saved gaps"}
          </p>
        </div>
      </button>
      <Link
        href="/learning-generator/materials"
        className="w-full p-4 2xl:p-5 bg-card border border-border hover:border-emerald-500/40 rounded-2xl transition-all flex items-start gap-3.5 2xl:gap-4 shadow-xs group"
      >
        <div className="w-10 h-10 2xl:w-12 2xl:h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <BookOpen className="w-5 h-5 2xl:w-6 2xl:h-6" />
        </div>
        <div>
          <h3 className="text-sm 2xl:text-base font-bold text-foreground mb-0.5 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
            Browse Materials
          </h3>
          <p className="text-xs 2xl:text-sm text-muted-foreground leading-relaxed">View all synthesized units</p>
        </div>
      </Link>
    </div>
  );
}

interface ModuleProgressListProps {
  progress: Array<{
    material_id: string;
    topic: string;
    total_steps: number;
    completed_steps: number[];
    quiz_score: number | null;
    completed_at: string | null;
  }>;
}

export function ModuleProgressList({ progress }: ModuleProgressListProps) {
  if (progress.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-[var(--lmg-text-primary)] flex items-center gap-2">
        <Target className="w-5 h-5 text-teal-600 dark:text-teal-400" /> Your Modules
      </h2>
      <div className="space-y-2">
        {progress.map((p, i) => {
          const pct = p.total_steps > 0 ? Math.round((p.completed_steps.length / p.total_steps) * 100) : 0;
          const isComplete = !!p.completed_at;
          return (
            <Link key={i} href={`/learning-generator/materials/${p.material_id}`} className="block p-3 bg-[var(--lmg-bg-surface)] backdrop-blur-xl border border-[var(--lmg-border)] rounded-lg hover:border-teal-500/40 transition-all shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-[var(--lmg-text-primary)]">{p.topic}</p>
                {isComplete && <CheckCircle2 className="w-4 h-4 text-green-500 dark:text-green-400 shrink-0" />}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-surface-3 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isComplete ? "bg-linear-to-r from-green-600 to-green-400" : "bg-linear-to-r from-teal-600 to-teal-400"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground font-bold">{pct}%</span>
              </div>
              {p.quiz_score !== null && (
                <p className="text-[10px] text-purple-700 dark:text-purple-400 mt-1 font-bold">Quiz: {p.quiz_score}%</p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

interface ScoreHistoryProps {
  history: Array<{
    id?: string;
    overall_mastery_score?: number;
    overall_score?: number;
    gaps_count?: number;
    submitted_at: string;
  }>;
}

interface ConceptCoverageProps {
  coverage: ConceptCoverageData | null;
}

export function ConceptCoverage({ coverage }: ConceptCoverageProps) {
  if (!coverage || typeof coverage.totalNodes !== "number") return null;

  const { totalNodes, coveredNodes, coveragePct, implicitGapsCount, unverifiedCount } = coverage;

  const getCoverageColor = (pct: number) => {
    if (pct >= 80) return "text-green-600 dark:text-green-400";
    if (pct >= 60) return "text-amber-600 dark:text-amber-400";
    if (pct >= 40) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-[var(--lmg-text-primary)] flex items-center gap-2">
        <Layers className="w-5 h-5 text-teal-600 dark:text-teal-400" /> Concept Coverage
      </h2>
      <Link href="/learning-generator/coverage" className="block p-4 bg-[var(--lmg-bg-surface)] backdrop-blur-xl border border-[var(--lmg-border)] rounded-xl hover:border-teal-500/40 transition-all shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-[var(--lmg-text-primary)]">Mastered concepts</span>
          <span className={`text-2xl font-extrabold ${getCoverageColor(coveragePct)}`}>{coveragePct}%</span>
        </div>
        <div className="h-2 bg-surface-3 rounded-full overflow-hidden mb-3">
          <div
            className={`h-full rounded-full transition-all ${coveragePct >= 60 ? "bg-linear-to-r from-green-600 to-green-400" : "bg-linear-to-r from-teal-600 to-teal-400"}`}
            style={{ width: `${Math.min(100, coveragePct)}%` }}
          />
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 bg-slate-50 dark:bg-[var(--lmg-bg-subtle)] border border-slate-200 dark:border-[var(--lmg-border)] rounded-lg">
            <p className="font-bold text-[var(--lmg-text-primary)]">{coveredNodes}</p>
            <p className="text-muted-foreground font-medium">of {totalNodes} nodes</p>
          </div>
          {implicitGapsCount > 0 && (
            <div className="p-2 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg">
              <p className="font-bold text-blue-700 dark:text-blue-400">{implicitGapsCount}</p>
              <p className="text-blue-700 dark:text-blue-300 font-semibold">prerequisite gaps</p>
            </div>
          )}
        </div>
        {unverifiedCount > 0 && (
          <p className="text-[10px] text-amber-600 dark:text-amber-400/80 mt-3 font-medium">
            {unverifiedCount} unresolved concept{unverifiedCount === 1 ? "" : "s"} — generated as generic materials.
          </p>
        )}
        <p className="text-[10px] text-teal-600 dark:text-teal-400/80 mt-3 flex items-center gap-1 font-semibold">
          View details <ChevronRight className="w-3 h-3" />
        </p>
      </Link>
    </div>
  );
}

export function ScoreHistory({ history }: ScoreHistoryProps) {
  if (history.length === 0) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-amber-600 dark:text-amber-400";
    if (score >= 40) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-[var(--lmg-text-primary)] flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-teal-600 dark:text-teal-400" /> Score History
      </h2>
      <div className="space-y-2">
        {history.map((entry, i) => {
          const score = entry.overall_mastery_score || entry.overall_score || 0;
          const content = (
            <>
              <div>
                <p className={`text-sm font-bold ${getScoreColor(score)}`}>
                  {entry.overall_mastery_score || entry.overall_score || "—"}%
                </p>
                <p className="text-[10px] text-muted-foreground font-semibold">{entry.gaps_count || 0} gaps</p>
              </div>
              <p className="text-[10px] text-muted-foreground font-semibold">
                {new Date(entry.submitted_at).toLocaleDateString()}
              </p>
            </>
          );
          const cardClasses = "p-3 bg-[var(--lmg-bg-surface)] backdrop-blur-xl border border-[var(--lmg-border)] rounded-lg flex items-center justify-between transition-all shadow-xs";
          return entry.id ? (
            <Link
              key={i}
              href={`/learning-generator/knowledge-gaps?id=${entry.id}`}
              className={`${cardClasses} hover:border-teal-500/40`}
            >
              {content}
            </Link>
          ) : (
            <div key={i} className={cardClasses}>
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface StrengthsListProps {
  strengths: Array<string | { topic: string; confidence?: number; mastery_level?: string }>;
}

export function StrengthsList({ strengths }: StrengthsListProps) {
  if (strengths.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-[var(--lmg-text-primary)] flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" /> Strengths
      </h2>
      <div className="space-y-2">
        {strengths.map((s, i) => (
          <div key={i} className="p-3 bg-green-500/5 border border-green-500/15 rounded-lg transition-all shadow-xs">
            <p className="text-sm font-bold text-[var(--lmg-text-primary)]">
              {typeof s === "string" ? s : s.topic}
            </p>
            {typeof s !== "string" && s.confidence && (
              <p className="text-[10px] text-green-700 dark:text-green-400 mt-0.5 font-bold">
                {Math.round(s.confidence * 100)}% confidence • {s.mastery_level || "proficient"}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
