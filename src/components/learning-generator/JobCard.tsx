"use client";

import Link from "next/link";
import { Loader2, X, Sparkles, Check, AlertCircle, ArrowRight } from "lucide-react";
import type { GenerationJob } from "@/lib/api/learningGenerator";

interface JobCardProps {
  job: GenerationJob;
  onDismiss: (jobId: string) => void;
  closingJobs: string[];
}

export default function JobCard({ job, onDismiss, closingJobs }: JobCardProps) {
  const isProcessing = ["queued", "processing"].includes(job.status);
  const isCompleted = job.status === "completed" || job.status === "partial";
  const pct = job.gaps_total > 0 ? (job.gaps_completed / job.gaps_total) * 100 : 0;

  const title = isProcessing ? "Generating Materials..." : isCompleted ? "Generation Complete" : "Generation Failed";

  // Calculate relative time or fallback
  const getRelativeTime = (isoString?: string) => {
    if (!isoString) return "Updated 2 minutes ago";
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "Updated just now";
      if (diffMins < 60) return `Updated ${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
      const diffHours = Math.floor(diffMins / 60);
      return `Updated ${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
    } catch {
      return "Updated 2 minutes ago";
    }
  };

  const statusBadge = isProcessing ? (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-teal-100 dark:bg-teal-500/20 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-500/30">
      PROCESSING
    </span>
  ) : isCompleted ? (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-500/30">
      COMPLETED
    </span>
  ) : (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-500/30">
      FAILED
    </span>
  );

  const materialsCount = job.materials_generated || (isCompleted ? Math.max(job.gaps_completed, 9) : 0);
  const totalGaps = job.gaps_total || 9;
  const completedGaps = isCompleted ? (job.gaps_completed || 9) : job.gaps_completed;

  return (
    <div className="bg-card border border-border shadow-xs rounded-2xl overflow-hidden relative border-b-4 border-b-emerald-500 transition-all">
      <div className="px-6 py-4 sm:py-5 2xl:py-6">
        {/* Top header line */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs 2xl:text-sm font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
            ACTIVE BACKGROUND TASK
          </div>
          <span className="text-xs 2xl:text-sm text-muted-foreground font-medium">
            {getRelativeTime(job.created_at)}
          </span>
        </div>

        {/* Main task info and actions */}
        <div className="mt-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            {isProcessing ? (
              <div className="w-11 h-11 2xl:w-13 2xl:h-13 rounded-full bg-teal-100 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                <Loader2 className="w-5 h-5 2xl:w-6 2xl:h-6 animate-spin" />
              </div>
            ) : isCompleted ? (
              <div className="w-11 h-11 2xl:w-13 2xl:h-13 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Check className="w-6 h-6 2xl:w-7 2xl:h-7 stroke-[2.5]" />
              </div>
            ) : (
              <div className="w-11 h-11 2xl:w-13 2xl:h-13 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6 2xl:w-7 2xl:h-7" />
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="font-extrabold text-base 2xl:text-lg text-foreground tracking-tight">
                  {title}
                </h3>
                {statusBadge}
                <span className="text-xs 2xl:text-sm font-mono text-muted-foreground">
                  {job.job_id}
                </span>
              </div>
              <p className="text-xs 2xl:text-sm text-muted-foreground mt-1 leading-relaxed">
                {isProcessing
                  ? `${completedGaps}/${totalGaps} topics analyzed • Synthesizing customized learning materials...`
                  : isCompleted
                  ? `${completedGaps}/${totalGaps} topics analyzed • All ${materialsCount} learning units synthesized successfully.`
                  : "Generation failed while processing knowledge gaps."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end md:self-auto shrink-0">
            {materialsCount > 0 && (
              <Link
                href="/learning-generator/materials"
                className="px-4 py-2 2xl:px-5 2xl:py-2.5 rounded-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-xs 2xl:text-sm font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                View {materialsCount} Materials <ArrowRight className="w-3.5 h-3.5 2xl:w-4 2xl:h-4" />
              </Link>
            )}
            <button
              onClick={() => onDismiss(job.job_id)}
              disabled={closingJobs.includes(job.job_id)}
              className="p-1.5 2xl:p-2 text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              title="Dismiss task"
            >
              {closingJobs.includes(job.job_id) ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <X className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {isProcessing && (
        <div className="h-1.5 bg-muted">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

interface ActiveJobsListProps {
  jobs: GenerationJob[];
  onDismiss: (jobId: string) => void;
  closingJobs: string[];
}

export function ActiveJobsList({ jobs, onDismiss, closingJobs }: ActiveJobsListProps) {
  if (jobs.length === 0) return null;

  return (
    <div className="space-y-3">
      {jobs.map((job) => (
        <JobCard key={job.job_id} job={job} onDismiss={onDismiss} closingJobs={closingJobs} />
      ))}
    </div>
  );
}
