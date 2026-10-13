'use client';

import { useState } from 'react';
import { Code2, CheckCircle2, XCircle, AlertTriangle, Lightbulb, Loader2, Target } from 'lucide-react';
import { peerLearningApi, type CodeEvaluation, type CodingTask, type CodeEvaluationResponse } from '@/lib/api/peerLearning';

interface EvaluateTabProps {
  getCode: () => string;
  codingTask?: CodingTask | null;
  onEvaluateSuccess?: (passed: boolean) => void;
}

export default function EvaluateTab({ getCode, codingTask, onEvaluateSuccess }: EvaluateTabProps) {
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState<CodeEvaluation | null>(null);
  const [taskPassed, setTaskPassed] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleEvaluate = async () => {
    const code = getCode();
    if (!code.trim()) {
      setError('Write some Java code first before evaluating.');
      return;
    }

    setEvaluating(true);
    setError(null);
    setResult(null);
    setTaskPassed(null);

    try {
      const res = await peerLearningApi.evaluateCode(code);
      const payload = (res.data || res) as Record<string, unknown>;
      const evaluationRaw = (payload.evaluation || payload) as Record<string, unknown>;
      if (res.success && evaluationRaw) {
        const evalData = res.data as CodeEvaluationResponse | undefined;
        const taskEval = evalData?.task_evaluation;
        setResult({
          is_valid: (evaluationRaw.is_valid ?? evaluationRaw.is_correct ?? false) as boolean,
          feedback: (taskEval?.feedback || evaluationRaw.feedback || 'The diagnostic response was evaluated.') as string,
          complexity: (evaluationRaw.complexity || 'Not provided') as string,
          passed_tests: (evaluationRaw.passed_tests ?? evaluationRaw.is_correct ?? false) as boolean,
          errors: (evaluationRaw.errors || []) as string[],
          suggestions: (evaluationRaw.suggestions || (taskEval?.sample_approach ? [String(taskEval.sample_approach)] : [])) as string[],
        });
        const passed = evalData?.passed ?? (evaluationRaw as Record<string, unknown>).passed === true;
        setTaskPassed(passed);
        onEvaluateSuccess?.(passed);
      } else {
        setError(res.message || 'Evaluation failed. Please try again.');
      }
    } catch {
      setError('Network error during evaluation.');
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Task context */}
      {codingTask && (
        <div className="px-3 py-2 border-b border-border bg-teal-500/5">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-3 h-3 text-teal-700 dark:text-teal-400" />
            <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider">Evaluating Against Task</span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{codingTask.task_description}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[9px] text-subtle-foreground uppercase">{codingTask.task_type.replace(/_/g, ' ')}</span>
            {codingTask.evaluation_criteria && (
              <>
                <span className="text-[9px] text-subtle-foreground/70">|</span>
                <span className="text-[9px] text-subtle-foreground line-clamp-1">{codingTask.evaluation_criteria}</span>
              </>
            )}
          </div>
        </div>
      )}

      <div className="p-3 border-b border-border">
        <button
          onClick={handleEvaluate}
          disabled={evaluating}
          className="w-full py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-primary-foreground font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
        >
          {evaluating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Evaluating...
            </>
          ) : (
            <>
              <Code2 className="w-4 h-4" />
              Run &amp; Evaluate
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
            <div className={`rounded-xl p-3 border ${
              result.is_valid
                ? 'bg-emerald-500/5 border-emerald-500/20'
                : 'bg-red-500/5 border-red-500/20'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                {result.is_valid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-700 dark:text-red-400" />
                )}
                <p className={`text-sm font-bold ${result.is_valid ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                  {result.is_valid ? 'Validation Passed' : 'Validation Failed'}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">{result.feedback}</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-background border border-border px-3 py-2">
                <p className="text-[10px] text-subtle-foreground uppercase mb-0.5">Task Grade</p>
                <p className={`text-xs font-bold ${taskPassed ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                  {taskPassed ? 'Passed' : 'Failed'}
                </p>
              </div>
              <div className="rounded-lg bg-background border border-border px-3 py-2">
                <p className="text-[10px] text-subtle-foreground uppercase mb-0.5">Test Result</p>
                <p className={`text-xs font-bold ${result.passed_tests ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                  {result.passed_tests ? 'Passed' : 'Failed'}
                </p>
              </div>
              <div className="rounded-lg bg-background border border-border px-3 py-2">
                <p className="text-[10px] text-subtle-foreground uppercase mb-0.5">Complexity</p>
                <p className="text-xs font-bold text-foreground">{result.complexity}</p>
              </div>
            </div>

            {taskPassed === false && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                <p className="text-xs text-amber-700 dark:text-amber-300">Your answer did not pass the task grading. Fix the issues above and try again.</p>
              </div>
            )}

            {taskPassed === true && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                <p className="text-xs text-emerald-700 dark:text-emerald-300">Task passed! Loading the next question...</p>
              </div>
            )}

            {result.errors.length > 0 && (
              <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-3">
                <p className="text-[10px] font-bold text-red-700 dark:text-red-400 uppercase tracking-wider mb-2">Errors</p>
                <div className="space-y-1">
                  {result.errors.map((err, i) => (
                    <p key={i} className="text-xs text-red-700 dark:text-red-300/80 leading-relaxed">• {err}</p>
                  ))}
                </div>
              </div>
            )}

            {result.suggestions.length > 0 && (
              <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                  <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Suggestions</p>
                </div>
                <div className="space-y-1">
                  {result.suggestions.map((s, i) => (
                    <p key={i} className="text-xs text-amber-700 dark:text-amber-300/80 leading-relaxed">• {s}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!result && !error && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <Code2 className="w-8 h-8 text-subtle-foreground/70 mb-2" />
            <p className="text-xs text-subtle-foreground">Click &quot;Run &amp; Evaluate&quot; to assess your Java code{codingTask ? ' against the task' : ''}</p>
          </div>
        )}
      </div>
    </div>
  );
}
