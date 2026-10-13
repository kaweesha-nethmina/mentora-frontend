"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  CircleDashed,
  Database,
  FileJson,
  RefreshCw,
  Search,
  ShieldCheck,
  Target,
} from "lucide-react";
import {
  CanonicalMasteryProfile,
  KnowledgeGap,
  Strength,
  knowledgeProfileApi,
} from "@/lib/api/knowledgeProfile";
import { useAuth } from "@/contexts/AuthContext";
import CareerFitCard from "@/components/career/CareerFitCard";

const formatPercent = (value?: number) => {
  if (value === undefined || value === null || Number.isNaN(value)) return "0%";
  return `${Math.round(value)}%`;
};

const formatConfidence = (value?: number) => {
  if (value === undefined || value === null || Number.isNaN(value)) return "0.00";
  return value.toFixed(2);
};

const formatDateTime = (value?: string) => {
  if (!value) return "Not saved";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function KnowledgeAssistMasteryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryStudentId = searchParams.get("studentId") || "";
  const defaultStudentId = queryStudentId || user?.student_id || user?._id || "";
  const [studentIdInput, setStudentIdInput] = useState(defaultStudentId);
  const [profile, setProfile] = useState<CanonicalMasteryProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayStudentId = useMemo(
    () => queryStudentId || user?.student_id || user?._id || "",
    [queryStudentId, user?._id, user?.student_id],
  );

  const loadProfile = async (studentId: string) => {
    if (!studentId.trim()) {
      setError("No student ID is available for lookup.");
      setProfile(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const next = await knowledgeProfileApi.getLatestMasteryProfile(studentId.trim());
      setProfile(next);
    } catch (err) {
      setProfile(null);
      setError(
        err instanceof Error
          ? err.message
          : "Could not load the saved mastery profile.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setStudentIdInput(defaultStudentId);
  }, [defaultStudentId]);

  useEffect(() => {
    if (displayStudentId) {
      void loadProfile(displayStudentId);
    }
  }, [displayStudentId]);

  const submitLookup = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextStudentId = studentIdInput.trim();
    if (!nextStudentId) return;
    router.push(`/knowledge-assist/mastery?studentId=${encodeURIComponent(nextStudentId)}`);
  };

  return (
    <div className="space-y-4 pb-4">
      <section className="rounded-2xl border border-border bg-card/55 p-5 shadow-xs">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-700 dark:text-cyan-300">
              MongoDB Mastery Profile
            </p>
            <h1 className="mt-1 text-2xl font-extrabold text-foreground md:text-3xl">
              Saved KAA output
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              This view reads the canonical profile saved in `knowledge_analysis.mastery_profiles`.
            </p>
          </div>

          <form onSubmit={submitLookup} className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[420px] sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle-foreground" />
              <input
                value={studentIdInput}
                onChange={(event) => setStudentIdInput(event.target.value)}
                placeholder="Student ID"
                className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-subtle-foreground outline-none transition focus:border-cyan-500"
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 text-sm font-bold text-cyan-800 dark:text-cyan-100 transition hover:bg-cyan-500/20"
            >
              <Database className="h-4 w-4" />
              Load
            </button>
            <button
              type="button"
              onClick={() => displayStudentId && void loadProfile(displayStudentId)}
              disabled={loading || !displayStudentId}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-muted px-4 text-sm font-bold text-foreground/80 transition hover:bg-surface-3 hover:text-foreground disabled:cursor-wait disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </form>
        </div>
      </section>

      {loading && (
        <section className="flex min-h-[260px] items-center justify-center rounded-2xl border border-border bg-card/55 shadow-xs">
          <div className="flex items-center gap-3 text-muted-foreground">
            <CircleDashed className="h-5 w-5 animate-spin text-cyan-600 dark:text-cyan-300" />
            Loading saved profile...
          </div>
        </section>
      )}

      {!loading && error && (
        <section className="rounded-2xl border border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-100">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-300" />
            <div>
              <p className="font-semibold">No saved mastery profile found.</p>
              <p className="mt-1 text-amber-800/80 dark:text-amber-100/75">
                Run KAA `/analyze` first, or load the demo record with `STU-2026-DEMO`.
              </p>
              <p className="mt-2 text-xs text-amber-700/70 dark:text-amber-100/55">{error}</p>
            </div>
          </div>
        </section>
      )}

      {!loading && profile && (
        <>
          <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <MetricCard
              icon={<Database className="h-4 w-4" />}
              label="Schema"
              value={profile.schema_version}
              helper={profile.profile_id ? `ID ${profile.profile_id}` : "Saved profile"}
              tone="text-cyan-700 dark:text-cyan-300"
            />
            <MetricCard
              icon={<Target className="h-4 w-4" />}
              label="Overall mastery"
              value={formatPercent(profile.mastery_profile.overall_mastery_score)}
              helper={profile.student_id}
              tone="text-teal-700 dark:text-teal-300"
            />
            <MetricCard
              icon={<AlertCircle className="h-4 w-4" />}
              label="Knowledge gaps"
              value={String(profile.mastery_profile.knowledge_gaps.length)}
              helper={profile.gap_topic_ids.join(", ") || "No gap topics"}
              tone="text-amber-700 dark:text-amber-300"
            />
            <MetricCard
              icon={<ShieldCheck className="h-4 w-4" />}
              label="Strengths"
              value={String(profile.mastery_profile.strengths.length)}
              helper={`Saved ${formatDateTime(profile.created_at)}`}
              tone="text-emerald-700 dark:text-emerald-300"
            />
          </section>

          <CareerFitCard studentId={displayStudentId} />

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
            <div className="space-y-4">
              <section className="rounded-2xl border border-border bg-card/55 p-4 shadow-xs">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-bold text-foreground">Generated knowledge gaps</h2>
                  <span className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-xs font-bold text-cyan-800 dark:text-cyan-200">
                    {profile.data_sources.github === "available" ? "GitHub included" : "No GitHub"}
                  </span>
                </div>
                <div className="mt-3 space-y-3">
                  {profile.mastery_profile.knowledge_gaps.length ? (
                    profile.mastery_profile.knowledge_gaps.map((gap, index) => (
                      <GapCard key={`${gap.topic_id}-${index}`} gap={gap} />
                    ))
                  ) : (
                    <p className="rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">
                      No current knowledge gaps were saved for this profile.
                    </p>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-border bg-card/55 p-4 shadow-xs">
                <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
                  <FileJson className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />
                  DB JSON preview
                </h2>
                <pre className="mt-3 max-h-[420px] overflow-auto rounded-xl border border-border bg-muted p-4 text-xs leading-5 text-slate-800 dark:text-cyan-50/80">
                  {JSON.stringify(
                    {
                      profile_id: profile.profile_id,
                      student_id: profile.student_id,
                      schema_version: profile.schema_version,
                      gap_topic_ids: profile.gap_topic_ids,
                      mastery_profile: profile.mastery_profile,
                    },
                    null,
                    2,
                  )}
                </pre>
              </section>
            </div>

            <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
              <section className="rounded-2xl border border-border bg-card/55 p-4 shadow-xs">
                <h2 className="text-lg font-bold text-foreground">Strengths</h2>
                <div className="mt-3 space-y-2">
                  {profile.mastery_profile.strengths.length ? (
                    profile.mastery_profile.strengths.map((strength, index) => (
                      <StrengthCard key={`${strength.topic_id}-${index}`} strength={strength} />
                    ))
                  ) : (
                    <p className="rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">
                      No strengths were saved in this profile.
                    </p>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-border bg-card/55 p-4 shadow-xs">
                <h2 className="text-lg font-bold text-foreground">Recommendations</h2>
                <div className="mt-3 rounded-xl border border-border bg-background p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Priority order
                  </p>
                  <p className="mt-1 text-sm font-semibold text-cyan-700 dark:text-cyan-200">
                    {profile.recommendations.priority_order?.join(" -> ") || "No priority order"}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-foreground/80">
                    {profile.recommendations.general_advice || "No general advice saved."}
                  </p>
                  <p className="mt-3 border-t border-border pt-3 text-xs leading-5 text-muted-foreground">
                    {profile.recommendations.for_instructor || "No instructor recommendation saved."}
                  </p>
                </div>
              </section>
            </aside>
          </section>
        </>
      )}
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  helper,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  helper: string;
  tone: string;
}) {
  return (
    <article className="rounded-2xl border border-border bg-card/55 p-4 shadow-xs">
      <div className={`mb-3 inline-flex rounded-lg border border-border bg-muted p-2 ${tone}`}>
        {icon}
      </div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1 truncate text-xl font-extrabold ${tone}`}>{value}</p>
      <p className="mt-1 truncate text-xs text-muted-foreground">{helper}</p>
    </article>
  );
}

function GapCard({ gap }: { gap: KnowledgeGap }) {
  return (
    <article className="rounded-xl border border-amber-500/30 dark:border-amber-400/20 bg-background p-4 shadow-xs">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-extrabold text-foreground">{gap.topic}</h3>
            <span className="rounded-md border border-border bg-muted px-2 py-1 text-[11px] font-bold text-muted-foreground">
              {gap.topic_id}
            </span>
            <span className="rounded-md border border-amber-500/30 dark:border-amber-400/25 bg-amber-500/10 px-2 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-200">
              {gap.gap_type}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-foreground/80">{gap.evidence_summary}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <ScorePill label="Mastery" value={formatPercent(gap.mastery_score)} />
          <ScorePill label="Confidence" value={formatConfidence(gap.confidence)} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        {gap.weak_subskills.map((item) => (
          <div key={item.subskill_id} className="rounded-lg border border-red-500/25 dark:border-red-400/20 bg-red-50 dark:bg-red-400/10 p-3">
            <p className="text-sm font-bold text-red-900 dark:text-red-100">{item.subskill}</p>
            <p className="mt-1 text-[11px] font-mono text-red-700 dark:text-red-100/45">{item.subskill_id}</p>
            <p className="mt-2 text-xs leading-5 text-red-800/80 dark:text-red-50/65">{item.evidence}</p>
            {item.recommended_content_focus && (
              <p className="mt-2 text-xs leading-5 text-foreground/80">
                {item.recommended_content_focus}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-border bg-muted p-3">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Suggested intervention
        </p>
        <p className="mt-1 text-sm font-semibold text-cyan-700 dark:text-cyan-200">
          {gap.suggested_intervention.primary} · {gap.suggested_intervention.difficulty_level} ·{" "}
          {gap.suggested_intervention.estimated_time_minutes} min
        </p>
        <ul className="mt-2 space-y-1 text-xs leading-5 text-muted-foreground">
          {gap.suggested_intervention.learning_objectives.map((objective) => (
            <li key={objective} className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-600 dark:text-teal-300" />
              <span>{objective}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

function StrengthCard({ strength }: { strength: Strength }) {
  return (
    <article className="rounded-xl border border-emerald-500/25 dark:border-emerald-400/20 bg-background p-3 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-foreground">{strength.topic}</p>
          <p className="mt-0.5 text-[11px] font-mono text-muted-foreground">{strength.topic_id}</p>
        </div>
        <span className="rounded-lg border border-emerald-500/30 dark:border-emerald-400/25 bg-emerald-500/10 px-2 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-200">
          {formatPercent(strength.mastery_score)}
        </span>
      </div>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{strength.evidence_summary}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        Can teach others: {strength.can_teach_others ? "Yes" : "No"}
      </p>
    </article>
  );
}

function ScorePill({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[96px] rounded-lg border border-border bg-card px-3 py-2 text-center shadow-xs">
      <p className="whitespace-nowrap text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-base font-extrabold text-foreground">{value}</p>
    </div>
  );
}
