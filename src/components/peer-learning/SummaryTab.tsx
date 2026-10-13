'use client';

import { useState } from 'react';
import { FileText, Loader2, AlertTriangle } from 'lucide-react';
import { peerLearningApi, type SummaryResponse } from '@/lib/api/peerLearning';

interface SummaryTabProps {
  roomId: string;
  studentName: string;
  peerName: string;
  topic: string;
}

export default function SummaryTab({ roomId, studentName, peerName, topic }: SummaryTabProps) {
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<SummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    setResult(null);

    try {
      const res = await peerLearningApi.summarizeSession(roomId);
      if (res.success && res.data) {
        setResult(res.data);
      } else {
        setError(res.message || 'Failed to generate summary.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border">
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-primary-foreground font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4" />
              Generate Collaboration Summary
            </>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3 min-h-0">
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-700 dark:text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {result && (
          <div className="space-y-3">
            <div className="rounded-xl bg-background border border-border p-3">
              <p className="text-[10px] text-subtle-foreground uppercase mb-0.5">Session Topic</p>
              <p className="text-teal-700 dark:text-teal-400 text-sm font-semibold">{topic}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-background border border-border px-3 py-2">
                <p className="text-[10px] text-subtle-foreground uppercase mb-0.5">Learner</p>
                <p className="text-foreground text-xs font-semibold">{studentName}</p>
              </div>
              <div className="rounded-lg bg-background border border-border px-3 py-2">
                <p className="text-[10px] text-subtle-foreground uppercase mb-0.5">Peer Teacher</p>
                <p className="text-foreground text-xs font-semibold">{peerName}</p>
              </div>
            </div>

            <div className="rounded-xl bg-background border border-border p-3">
              <p className="text-[10px] text-subtle-foreground uppercase mb-1">Summary</p>
              <p className="text-xs text-foreground/80 leading-relaxed">{result.summary}</p>
            </div>

            <div className="rounded-xl bg-background border border-border p-3">
              <p className="text-[10px] text-subtle-foreground uppercase mb-2">Key Learning Points</p>
              <div className="space-y-1">
                {result.key_learning_points.map((point, i) => (
                  <p key={i} className="text-xs text-teal-700 dark:text-teal-400/80 leading-relaxed">• {point}</p>
                ))}
              </div>
            </div>

            <div className="rounded-lg bg-background border border-border px-3 py-2">
              <p className="text-[10px] text-subtle-foreground uppercase mb-0.5">Total Messages</p>
              <p className="text-foreground text-xs font-semibold">{result.total_messages}</p>
            </div>
          </div>
        )}

        {!result && !error && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <FileText className="w-8 h-8 text-subtle-foreground/70 mb-2" />
            <p className="text-xs text-subtle-foreground">Generate a summary of your collaboration session</p>
          </div>
        )}
      </div>
    </div>
  );
}
