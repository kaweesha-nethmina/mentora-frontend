"use client";

import { Clock } from "lucide-react";

interface ExecutionTimelineProps {
  timeline: Array<{ method: string; duration: string }>;
}

export default function ExecutionTimeline({ timeline }: ExecutionTimelineProps) {
  if (timeline.length === 0) return null;

  return (
    <div className="border-t border-border p-2 shrink-0 bg-slate-50 dark:bg-transparent">
      <div className="flex items-center gap-1.5 mb-2">
        <Clock className="w-3 h-3 text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground font-bold uppercase">Execution Timeline</span>
      </div>
      <div className="flex gap-0.5">
        {timeline.map((item, i) => (
          <div key={i} className="flex-1 h-6 bg-teal-500/20 rounded-sm flex items-center justify-center" title={`${item.method} — ${item.duration}`}>
            <span className="text-[8px] text-teal-800 dark:text-teal-300 font-medium truncate px-0.5">{item.method}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
