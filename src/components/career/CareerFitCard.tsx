"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Award,
  Briefcase,
  CircleDashed,
  Compass,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { careerApi, CareerPrediction, CompetencyGap } from "@/lib/api/career";

const pct = (v?: number | null) =>
  v === undefined || v === null || Number.isNaN(v) ? "0%" : `${Math.round(v * 100)}%`;

export default function CareerFitCard({ studentId }: { studentId: string }) {
  const [prediction, setPrediction] = useState<CareerPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [goal, setGoal] = useState("");

  const run = useCallback(
    async (targetRole?: string) => {
      if (!studentId.trim()) return;
      setLoading(true);
      setError(null);
      try {
        setPrediction(await careerApi.predict(studentId.trim(), targetRole));
      } catch (err) {
        setPrediction(null);
        setError(err instanceof Error ? err.message : "Could not load the career prediction.");
      } finally {
        setLoading(false);
      }
    },
    [studentId],
  );

  useEffect(() => {
    void run();
  }, [run]);

  const submitGoal = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void run(goal.trim() || undefined);
  };

  return (
    <section className="rounded-2xl border border-violet-500/30 dark:border-violet-400/20 bg-gradient-to-br from-violet-50/70 via-slate-50 to-indigo-50/60 dark:from-[#1e1b4b]/60 dark:to-[#1e293b]/55 p-5 shadow-xs">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-xl border border-violet-500/30 dark:border-violet-400/25 bg-violet-500/10 p-2 text-violet-700 dark:text-violet-200">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-violet-700 dark:text-violet-300">
              Career Fit
            </p>
            <h2 className="text-xl font-extrabold text-foreground">Where your skills point</h2>
          </div>
        </div>
        <span className="rounded-lg border border-border bg-muted px-2 py-1 text-[11px] font-semibold text-muted-foreground">
          {prediction?.model_version ? `model ${prediction.model_version}` : "hand-made model"}
        </span>
      </div>

      {loading && (
        <div className="mt-5 flex items-center gap-3 text-muted-foreground">
          <CircleDashed className="h-5 w-5 animate-spin text-violet-600 dark:text-violet-300" />
          Predicting your best-fit role...
        </div>
      )}

      {!loading && error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-100">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-300" />
          <span>{error}</span>
        </div>
      )}

      {!loading && prediction && !prediction.best_fit_role && (
        <p className="mt-4 rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">
          {prediction.note || "Not enough signal yet — complete a quiz or analysis first."}
        </p>
      )}

      {!loading && prediction && prediction.best_fit_role && (
        <div className="mt-4 space-y-4">
          {/* headline + best fit */}
          <div className="rounded-xl border border-violet-500/25 dark:border-violet-400/20 bg-background p-4 shadow-xs">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <Briefcase className="h-6 w-6 text-violet-600 dark:text-violet-300" />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Best-fit role
                  </p>
                  <p className="text-lg font-extrabold text-foreground">{prediction.best_fit_role}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-lg border border-violet-500/30 dark:border-violet-400/25 bg-violet-500/10 px-3 py-1.5 text-sm font-extrabold text-violet-800 dark:text-violet-100">
                  {pct(prediction.ranked_roles[0]?.fit_score)} fit
                </span>
                {prediction.readiness_level && (
                  <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 dark:border-emerald-400/25 bg-emerald-500/10 px-3 py-1.5 text-sm font-bold text-emerald-700 dark:text-emerald-200">
                    <Award className="h-3.5 w-3.5" />
                    {prediction.readiness_level}
                  </span>
                )}
              </div>
            </div>
            {prediction.narrative?.headline && (
              <p className="mt-3 text-sm leading-6 text-foreground/80">{prediction.narrative.headline}</p>
            )}
            {!prediction.evidence_sufficient && prediction.note && (
              <p className="mt-2 text-xs text-amber-700 dark:text-amber-200/80">{prediction.note}</p>
            )}
          </div>

          {/* ranked roles */}
          <div className="rounded-xl border border-border bg-background p-4 shadow-xs">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Top role matches</p>
            <div className="mt-3 space-y-2">
              {prediction.ranked_roles.map((r, i) => (
                <div key={r.role} className="flex items-center gap-3">
                  <span className="w-44 shrink-0 truncate text-sm text-foreground">{r.role}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-3">
                    <div
                      className={`h-full rounded-full ${i === 0 ? "bg-violet-600 dark:bg-violet-400" : "bg-violet-400/60 dark:bg-violet-400/40"}`}
                      style={{ width: pct(r.fit_score) }}
                    />
                  </div>
                  <span className="w-12 shrink-0 text-right text-xs font-bold text-muted-foreground">
                    {pct(r.fit_score)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* why + gaps */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-emerald-500/25 dark:border-emerald-400/20 bg-background p-4 shadow-xs">
              <p className="flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-200">
                <Sparkles className="h-4 w-4" /> Why you fit
              </p>
              {prediction.matched_competencies.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {prediction.matched_competencies.map((c) => (
                    <span
                      key={c}
                      className="rounded-md border border-emerald-500/30 dark:border-emerald-400/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:text-emerald-100"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              )}
              <ul className="mt-3 space-y-1.5 text-xs leading-5 text-foreground/80">
                {(prediction.narrative?.why_fit || []).map((w, i) => (
                  <li key={i}>• {w}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-amber-500/25 dark:border-amber-400/20 bg-background p-4 shadow-xs">
              <p className="flex items-center gap-2 text-sm font-bold text-amber-700 dark:text-amber-200">
                <TrendingUp className="h-4 w-4" /> Close these gaps
              </p>
              <div className="mt-2 space-y-2">
                {prediction.missing_competencies.length ? (
                  prediction.missing_competencies.map((g) => <GapBar key={g.axis} gap={g} />)
                ) : (
                  <p className="text-xs text-muted-foreground">No significant gaps for this role — nice.</p>
                )}
              </div>
              {(prediction.narrative?.gap_plan || []).length > 0 && (
                <ul className="mt-3 space-y-1.5 border-t border-border pt-3 text-xs leading-5 text-foreground/80">
                  {prediction.narrative!.gap_plan.map((p, i) => (
                    <li key={i}>→ {p}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* aspiration */}
          <form
            onSubmit={submitGoal}
            className="rounded-xl border border-border bg-background p-4 shadow-xs"
          >
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <Target className="h-4 w-4 text-cyan-600 dark:text-cyan-300" /> Have a goal role?
            </p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. Backend Engineer"
                className="h-9 flex-1 rounded-lg border border-border bg-muted px-3 text-sm text-foreground placeholder:text-subtle-foreground outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                className="inline-flex h-9 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 text-sm font-bold text-cyan-800 dark:text-cyan-100 transition hover:bg-cyan-500/20"
              >
                Check fit
              </button>
            </div>

            {prediction.aspiration_alignment && (
              <div className="mt-3 rounded-lg border border-cyan-500/20 dark:border-cyan-400/15 bg-cyan-50 dark:bg-cyan-400/5 p-3">
                <p className="text-sm text-foreground/80">
                  Toward{" "}
                  <span className="font-bold text-cyan-800 dark:text-cyan-200">
                    {prediction.aspiration_alignment.stated_role}
                  </span>
                  : you&apos;re at{" "}
                  <span className="font-bold text-foreground">
                    {pct(prediction.aspiration_alignment.fit_to_stated)}
                  </span>
                  {prediction.aspiration_alignment.est_hours_to_ready > 0 && (
                    <>
                      {" "}
                      · ~{prediction.aspiration_alignment.est_hours_to_ready}h of focused practice to
                      get competitive
                    </>
                  )}
                  .
                </p>
                {prediction.aspiration_alignment.gap_to_stated.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {prediction.aspiration_alignment.gap_to_stated.slice(0, 4).map((g) => (
                      <GapBar key={g.axis} gap={g} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </form>

          <p className="text-[11px] leading-4 text-muted-foreground">
            A hand-made model decides this from your measured competencies; the explanation is
            AI-written. Suitability + a roadmap — never a hard gate.
          </p>
        </div>
      )}
    </section>
  );
}

function GapBar({ gap }: { gap: CompetencyGap }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-40 shrink-0 truncate text-xs text-foreground/80">{gap.axis_name}</span>
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-surface-3">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-amber-500 dark:bg-amber-400/70"
          style={{ width: pct(gap.your_score) }}
        />
        <div
          className="absolute inset-y-0 w-0.5 bg-slate-900 dark:bg-white/60"
          style={{ left: pct(gap.required_score) }}
          title="required"
        />
      </div>
      <span className="w-10 shrink-0 text-right text-[11px] font-bold text-amber-700 dark:text-amber-200">
        {pct(gap.your_score)}
      </span>
    </div>
  );
}
