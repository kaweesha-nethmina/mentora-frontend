"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { learningGeneratorApi, type LearningMaterial } from "@/lib/api/learningGenerator";
import { BookOpen, ChevronLeft, Loader2, Trash2 } from "lucide-react";
import MaterialCard from "@/components/learning-generator/MaterialCard";
import SearchFilterBar from "@/components/learning-generator/SearchFilterBar";
import ConfirmDialog from "@/components/learning-generator/ConfirmDialog";

type DeleteTarget =
  | { mode: "all" }
  | { mode: "single"; material: LearningMaterial }
  | null;

export default function MaterialsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGap, setFilterGap] = useState<string>("ALL");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user?.student_id) return;
    try {
      const res = await learningGeneratorApi.getMaterials(user.student_id);
      if (res.success && res.data) {
        const matData = res.data as any;
        setMaterials(matData.items || []);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.student_id]);

  useEffect(() => {
    if (user?.student_id) fetchData();
  }, [user?.student_id, fetchData]);

  const startSingleDelete = (material: LearningMaterial) => {
    setDeleteError(null);
    setDeleteTarget({ mode: "single", material });
  };

  const startDeleteAll = () => {
    setDeleteError(null);
    setDeleteTarget({ mode: "all" });
  };

  const performDelete = async () => {
    if (!deleteTarget || deleting || !user?.student_id) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      if (deleteTarget.mode === "single") {
        const res = await learningGeneratorApi.deleteMaterial(deleteTarget.material._id);
        if (!res.success) {
          throw new Error(res.message || res.error || "Delete failed");
        }
      } else {
        const results = await Promise.all(
          materials.map((m) => learningGeneratorApi.deleteMaterial(m._id)),
        );
        if (results.some((r) => !r.success)) {
          throw new Error("One or more materials could not be deleted");
        }
      }
      setDeleteTarget(null);
      setDeleting(false);
      await fetchData();
    } catch {
      setDeleteError(
        deleteTarget.mode === "all"
          ? "Failed to delete all materials. Please try again."
          : "Failed to delete this material. Please try again.",
      );
      setDeleting(false);
    }
  };

  const cancelDelete = () => {
    if (deleting) return;
    setDeleteTarget(null);
    setDeleteError(null);
  };

  const filteredMaterials = materials.filter((m) => {
    const matchesSearch =
      !searchQuery ||
      m.structured_material.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.structured_material.topic_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGap = filterGap === "ALL" || m.structured_material.gap_type === filterGap;
    return matchesSearch && matchesGap;
  });

  const gapTypes = ["ALL", ...Array.from(new Set(materials.map((m) => m.structured_material.gap_type)))];

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
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[var(--lmg-text-primary)]">Learning Materials</h1>
              <p className="text-sm text-[var(--lmg-text-muted)]">All AI-generated personalized learning content.</p>
            </div>
          </div>
          {materials.length > 0 && (
            <button
              type="button"
              onClick={startDeleteAll}
              disabled={deleting}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm font-bold hover:bg-red-500/20 transition-colors disabled:opacity-60"
            >
              <Trash2 className="w-4 h-4" />
              Delete All
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-[var(--lmg-bg-surface)] border border-[var(--lmg-border)] rounded-2xl shadow-sm">
          <p className="text-3xl font-extrabold text-[var(--lmg-text-primary)]">{materials.length}</p>
          <p className="text-xs text-[var(--lmg-text-muted)] mt-1">Total Materials</p>
        </div>
        <div className="p-5 bg-red-500/5 border border-red-500/10 rounded-2xl">
          <p className="text-3xl font-extrabold text-red-600 dark:text-red-400">
            {materials.filter((m) => m.structured_material.gap_type === "FUNDAMENTAL_GAP").length}
          </p>
          <p className="text-xs text-red-600/70 dark:text-red-400/60 mt-1">Fundamental</p>
        </div>
        <div className="p-5 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
          <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">
            {materials.filter((m) => m.structured_material.gap_type === "PARTIAL_GAP").length}
          </p>
          <p className="text-xs text-amber-600/70 dark:text-amber-400/60 mt-1">Partial</p>
        </div>
        <div className="p-5 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
          <p className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">
            {materials.filter((m) => m.structured_material.gap_type === "SURFACE_GAP").length}
          </p>
          <p className="text-xs text-blue-600/70 dark:text-blue-400/60 mt-1">Surface</p>
        </div>
      </div>

      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterGap={filterGap}
        onFilterChange={setFilterGap}
        gapTypes={gapTypes}
      />

      {filteredMaterials.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMaterials.map((material) => (
            <MaterialCard key={material._id} material={material} onDelete={startSingleDelete} />
          ))}
        </div>
      ) : (
        <div className="p-12 bg-[var(--lmg-bg-surface)] border border-[var(--lmg-border)] rounded-2xl text-center shadow-sm">
          <BookOpen className="w-12 h-12 text-[var(--lmg-text-muted)]/30 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-[var(--lmg-text-primary)] mb-2">
            {materials.length === 0 ? "No materials yet" : "No materials match your filters"}
          </h3>
          <p className="text-sm text-[var(--lmg-text-muted)]">
            {materials.length === 0
              ? "Submit a learning profile to generate personalized materials."
              : "Try adjusting your search or filter criteria."}
          </p>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title={deleteTarget?.mode === "all" ? "Delete all materials?" : "Delete this material?"}
        message={
          deleteTarget?.mode === "all"
            ? `This will permanently delete all ${materials.length} of your learning materials. This action cannot be undone.`
            : `Are you sure you want to delete "${deleteTarget && deleteTarget.mode === "single" ? deleteTarget.material.structured_material.topic : ""}"? This action cannot be undone.`
        }
        confirmLabel={deleteTarget?.mode === "all" ? "Delete All" : "Delete"}
        isDeleting={deleting}
        error={deleteError}
        onConfirm={performDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
}
