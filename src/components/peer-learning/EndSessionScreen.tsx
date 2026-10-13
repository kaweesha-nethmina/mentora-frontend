'use client';

import { CheckCircle2, ArrowLeft, User, Brain, BookOpen } from 'lucide-react';
import type { CodeEvaluation } from '@/lib/api/peerLearning';
import type { SummaryResponse } from '@/lib/api/peerLearning';
import type { ContentRecommendation } from '@/lib/api/peerLearning';

interface EndSessionScreenProps {
  studentName: string;
  studentId: string;
  peerName: string;
  peerId: string;
  isAiSession: boolean;
  topic: string;
  gapTopic: string;
  evaluation: CodeEvaluation | null;
  summary: SummaryResponse | null;
  recommendations: ContentRecommendation[];
  onReturnHome: () => void;
}

export default function EndSessionScreen({
  studentName,
  studentId,
  peerName,
  peerId,
  isAiSession,
  topic,
  gapTopic,
  evaluation,
  summary,
  recommendations,
  onReturnHome,
}: EndSessionScreenProps) {
  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6 animate-slide-up">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-teal-700 dark:text-teal-400" />
        </div>
        <h1 className="text-2xl font-extrabold text-foreground">Session Completed</h1>
        <p className="text-sm text-muted-foreground">Here is a summary of your learning session.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card/55 p-6 space-y-4">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Session Details</h3>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-background border border-border p-3">
            <p className="text-[10px] text-subtle-foreground uppercase mb-0.5">Learner</p>
            <div className="flex items-center gap-1.5">
              <User className="w-3 h-3 text-amber-700 dark:text-amber-400" />
              <p className="text-foreground text-xs font-semibold">{studentName}</p>
            </div>
            <p className="text-[10px] text-subtle-foreground mt-0.5">{studentId}</p>
          </div>
          <div className="rounded-xl bg-background border border-border p-3">
            <p className="text-[10px] text-subtle-foreground uppercase mb-0.5">{isAiSession ? 'AI Teacher' : 'Peer Teacher'}</p>
            <div className="flex items-center gap-1.5">
              {isAiSession ? <Brain className="w-3 h-3 text-violet-700 dark:text-violet-400" /> : <User className="w-3 h-3 text-teal-700 dark:text-teal-400" />}
              <p className="text-foreground text-xs font-semibold">{peerName}</p>
            </div>
            <p className="text-[10px] text-subtle-foreground mt-0.5">{peerId}</p>
          </div>
        </div>

        <div className="rounded-xl bg-background border border-border p-3">
          <p className="text-[10px] text-subtle-foreground uppercase mb-0.5">Topic</p>
          <p className="text-teal-700 dark:text-teal-400 text-sm font-semibold">{topic}</p>
        </div>

        <div className="rounded-xl bg-background border border-border p-3">
          <p className="text-[10px] text-subtle-foreground uppercase mb-0.5">Original Knowledge Gap</p>
          <p className="text-amber-700 dark:text-amber-400 text-sm font-semibold">{gapTopic}</p>
        </div>

        {evaluation && (
          <div className="rounded-xl bg-background border border-border p-3">
            <p className="text-[10px] text-subtle-foreground uppercase mb-1">Evaluation Result</p>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-bold ${evaluation.is_valid ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                {evaluation.is_valid ? 'Passed' : 'Needs Improvement'}
              </span>
              <span className="text-[10px] text-subtle-foreground">| Complexity: {evaluation.complexity}</span>
            </div>
            <p className="text-xs text-muted-foreground">{evaluation.feedback}</p>
          </div>
        )}

        {summary && (
          <div className="rounded-xl bg-background border border-border p-3">
            <p className="text-[10px] text-subtle-foreground uppercase mb-1">Learning Outcome</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{summary.summary}</p>
          </div>
        )}

        {recommendations.length > 0 && (
          <div className="rounded-xl bg-background border border-border p-3">
            <p className="text-[10px] text-subtle-foreground uppercase mb-1">Recommended Next Topic</p>
            <div className="space-y-1">
              {recommendations.slice(0, 2).map((rec, i) => (
                <p key={i} className="text-xs text-teal-700 dark:text-teal-400/80 flex items-center gap-1.5">
                  <BookOpen className="w-3 h-3 shrink-0" />
                  {rec.title}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={onReturnHome}
        className="w-full py-3 bg-muted hover:bg-surface-3 text-foreground/80 font-bold rounded-xl transition-colors border border-border flex items-center justify-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Peer Learning Home
      </button>
    </div>
  );
}
