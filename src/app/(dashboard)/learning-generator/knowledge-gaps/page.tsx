"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { learningGeneratorApi, type LearningMaterial } from "@/lib/api/learningGenerator";
import { AlertTriangle, Brain, ChevronLeft, Loader2, GitBranch } from "lucide-react";
import GapSummaryCards from "@/components/learning-generator/GapSummaryCards";
import GapFilters, { getGapCounts, getFilteredGaps } from "@/components/learning-generator/GapFilters";
import ExpandableGapCard from "@/components/learning-generator/ExpandableGapCard";
import MaterialCard from "@/components/learning-generator/MaterialCard";

export default function KnowledgeGapsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [filter, setFilter] = useState<string>("ALL");
  const [expandedGap, setExpandedGap] = useState<number | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSelectedProfileId(params.get("id"));
  }, []);

  const fetchData = useCallback(async () => {
    if (!user?.student_id) return;
    try {
      const [profileRes, materialsRes] = await Promise.all([
        selectedProfileId
          ? learningGeneratorApi.getProfileById(selectedProfileId)
          : learningGeneratorApi.getProfile(user.student_id),
        learningGeneratorApi.getMaterials(user.student_id),
      ]);
      if (profileRes.success) setProfile(profileRes.data);
      if (materialsRes.success && materialsRes.data) {
        const matData = materialsRes.data as any;
        setMaterials(matData.items || []);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.student_id, selectedProfileId]);

  useEffect(() => {
    if (user?.student_id) fetchData();
  }, [user?.student_id, fetchData]);

  const filteredGaps = getFilteredGaps(profile, filter);
  const gapCounts = getGapCounts(profile);
  const implicitMaterials = materials.filter(
    (m) => m.structured_material.generation_source === "implicit_prerequisite"
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-teal-700 dark:text-teal-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <Link href="/learning-generator" className="inline-flex items-center gap-2 text-teal-600 dark:text-teal-400 hover:text-teal-500 text-sm font-bold mb-4 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Overview
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-amber-500 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[var(--lmg-text-primary)]">Knowledge Gaps</h1>
            <p className="text-sm text-[var(--lmg-text-muted)]">Detailed analysis of areas that need improvement.</p>
            {selectedProfileId && profile?.submitted_at && (
              <Link
                href="/learning-generator/knowledge-gaps"
                className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-300 text-[10px] font-bold hover:bg-teal-500/20 transition-colors"
              >
                Viewing submission from {new Date(profile.submitted_at).toLocaleString()} — clear filter
              </Link>
            )}
          </div>
        </div>
      </div>

      <GapSummaryCards profile={profile} />

      <GapFilters filter={filter} onFilterChange={setFilter} gapCounts={gapCounts} />

      {filteredGaps.length > 0 ? (
        <div className="space-y-4">
          {filteredGaps.map((gap, i) => (
            <ExpandableGapCard
              key={i}
              gap={gap}
              index={i}
              isExpanded={expandedGap === i}
              onToggle={() => setExpandedGap(expandedGap === i ? null : i)}
            />
          ))}
        </div>
      ) : (
        <div className="p-12 bg-[var(--lmg-bg-surface)] border border-[var(--lmg-border)] rounded-2xl text-center shadow-sm">
          <Brain className="w-12 h-12 text-[var(--lmg-text-muted)]/30 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-[var(--lmg-text-primary)] mb-2">No gaps found</h3>
          <p className="text-sm text-[var(--lmg-text-muted)]">
            {filter !== "ALL" ? "No gaps match this filter." : "Submit a learning profile to identify knowledge gaps."}
          </p>
        </div>
      )}

      {/* ── PREREQUISITE MATERIALS (concept-graph injected) ── */}
      {implicitMaterials.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--lmg-text-primary)] flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-blue-500 dark:text-blue-400" /> Prerequisite Materials
            </h2>
            <span className="text-xs text-blue-600/70 dark:text-blue-400/70">essential foundations you&apos;re missing — master these first</span>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {implicitMaterials.map((m) => (
              <MaterialCard key={m._id} material={m} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
