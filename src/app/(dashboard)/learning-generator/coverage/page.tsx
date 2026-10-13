"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { learningGeneratorApi, type ConceptCoverage as ConceptCoverageData } from "@/lib/api/learningGenerator";
import { AlertTriangle, CheckCircle2, ChevronLeft, Layers, Loader2, GitBranch, HelpCircle } from "lucide-react";

const getPctColor = (pct: number) => {
  if (pct >= 80) return "text-green-700 dark:text-green-400";
  if (pct >= 60) return "text-amber-700 dark:text-amber-400";
  if (pct >= 40) return "text-orange-700 dark:text-orange-400";
  return "text-red-700 dark:text-red-400";
};

export default function ConceptCoveragePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coverage, setCoverage] = useState<ConceptCoverageData | null>(null);

  const fetchData = useCallback(async () => {
    if (!user?.student_id) return;
    try {
      const res = await learningGeneratorApi.getConceptCoverage(user.student_id);
      if (res.success && res.data) {
        setCoverage(res.data);
      } else {
        setError(res.message || res.error || "Failed to load concept coverage");
      }
    } catch {
      setError("Network error. Check LMG service.");
    } finally {
      setLoading(false);
    }
  }, [user?.student_id]);

  useEffect(() => {
    if (user?.student_id) fetchData();
  }, [user?.student_id, fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-teal-700 dark:text-teal-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="p-12 bg-[var(--lmg-bg-surface)] border border-[var(--lmg-border)] rounded-2xl text-center shadow-sm">
          <AlertTriangle className="w-12 h-12 text-amber-500/70 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-[var(--lmg-text-primary)] mb-2">Could not load coverage</h3>
          <p className="text-sm text-[var(--lmg-text-muted)] mb-6">{error}</p>
          <button
            onClick={fetchData}
            className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-xl transition-all "
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const covered = coverage?.covered || [];
  const implicitGaps = coverage?.implicitGaps || [];
  const unresolved = coverage?.unresolved || [];
  const coveragePct = coverage?.coveragePct ?? 0;
  const totalNodes = coverage?.totalNodes ?? 0;
  const coveredNodes = coverage?.coveredNodes ?? 0;

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <Link href="/learning-generator" className="inline-flex items-center gap-2 text-teal-600 dark:text-teal-400 hover:text-teal-500 text-sm font-bold mb-4 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Overview
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center">
            <Layers className="w-6 h-6 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[var(--lmg-text-primary)]">Concept Coverage</h1>
            <p className="text-sm text-[var(--lmg-text-muted)]">
              Mastery breakdown across the concept graph, including prerequisite gaps injected by the graph.
            </p>
          </div>
        </div>
      </div>

      {/* ── SUMMARY TILES ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 bg-[var(--lmg-bg-surface)] border border-[var(--lmg-border)] rounded-xl shadow-sm">
          <p className="text-sm font-bold text-[var(--lmg-text-primary)] mb-1">Mastered concepts</p>
          <p className={`text-3xl font-extrabold ${getPctColor(coveragePct)}`}>{coveragePct}%</p>
        </div>
        <div className="p-4 bg-[var(--lmg-bg-surface)] border border-[var(--lmg-border)] rounded-xl shadow-sm">
          <p className="text-sm font-bold text-[var(--lmg-text-primary)] mb-1">Covered nodes</p>
          <p className="text-3xl font-extrabold text-[var(--lmg-text-primary)]">
            {coveredNodes}
            <span className="text-base font-bold text-[var(--lmg-text-muted)]"> / {totalNodes}</span>
          </p>
        </div>
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <p className="text-sm font-bold text-blue-600 dark:text-blue-300 mb-1">Prerequisite gaps</p>
          <p className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{coverage?.implicitGapsCount ?? 0}</p>
        </div>
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <p className="text-sm font-bold text-amber-600 dark:text-amber-300 mb-1">Unresolved</p>
          <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">{coverage?.unverifiedCount ?? 0}</p>
        </div>
      </div>

      <div className="h-2 bg-[var(--lmg-bg-subtle)] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${coveragePct >= 60 ? "bg-linear-to-r from-green-600 to-green-400" : "bg-linear-to-r from-teal-600 to-teal-400"}`}
          style={{ width: `${Math.min(100, coveragePct)}%` }}
        />
      </div>

      {/* ── MASTERED CONCEPTS ── */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-[var(--lmg-text-primary)] flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-500 dark:text-green-400" /> Mastered Concepts
        </h2>
        {covered.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-2">
            {covered.map((n) => (
              <div key={n.concept_id} className="p-3 bg-green-500/5 border border-green-500/10 rounded-lg">
                <p className="text-sm font-bold text-[var(--lmg-text-primary)]">{n.name}</p>
                <p className="text-[10px] text-[var(--lmg-text-muted)] mt-0.5">
                  {n.category ? `${n.category}` : ""}
                  {n.bloom_level ? ` • ${n.bloom_level}` : ""}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 bg-[var(--lmg-bg-surface)] border border-[var(--lmg-border)] rounded-2xl text-center">
            <p className="text-sm text-[var(--lmg-text-muted)]">No mastered concepts yet. Generate materials to start building coverage.</p>
          </div>
        )}
      </div>

      {/* ── PREREQUISITE GAPS ── */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-[var(--lmg-text-primary)] flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-blue-500 dark:text-blue-400" /> Prerequisite Gaps
        </h2>
        {implicitGaps.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-2">
            {implicitGaps.map((g) => (
              <div key={g.concept_id} className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                <p className="text-sm font-bold text-[var(--lmg-text-primary)]">{g.name || g.concept_id}</p>
                {g.reason && (
                  <p className="text-[10px] text-blue-600 dark:text-blue-300/60 mt-0.5 break-all">blocks: {g.reason.replace(/^prerequisite_of:/, "")}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 bg-[var(--lmg-bg-surface)] border border-[var(--lmg-border)] rounded-2xl text-center">
            <p className="text-sm text-[var(--lmg-text-muted)]">No prerequisite gaps. The concept graph found nothing blocking your mastery path.</p>
          </div>
        )}
      </div>

      {/* ── UNRESOLVED CONCEPTS ── */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-[var(--lmg-text-primary)] flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-amber-500 dark:text-amber-400" /> Unresolved Concepts
        </h2>
        {unresolved.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-2">
            {unresolved.map((u) => (
              <div key={u.concept_id} className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg">
                <p className="text-sm font-bold text-[var(--lmg-text-primary)]">{u.name || u.concept_id}</p>
                {u.blocks && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-300/60 mt-0.5 break-all">blocks: {u.blocks}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 bg-[var(--lmg-bg-surface)] border border-[var(--lmg-border)] rounded-2xl text-center">
            <p className="text-sm text-[var(--lmg-text-muted)]">No unresolved concepts. Every prerequisite was matched to a graph node.</p>
          </div>
        )}
      </div>
    </div>
  );
}
