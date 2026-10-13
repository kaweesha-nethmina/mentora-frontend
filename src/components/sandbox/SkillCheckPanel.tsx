"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Brain,
  CheckCircle2,
  CircleDashed,
  RotateCcw,
  Sparkles,
  Trophy,
  XCircle,
} from "lucide-react";
import {
  AnswerResult,
  ClientQuestion,
  OptionId,
  QuizDifficulty,
  QuizMode,
  QuizResults,
  QuizSource,
  StartSessionResponse,
  quizApi,
} from "@/lib/api/quiz";

const difficultyStyle: Record<QuizDifficulty, string> = {
  easy: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200",
  medium: "border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-200",
  hard: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-200",
};

type Phase = "idle" | "starting" | "question" | "answered" | "completed";

type SkillCheckPanelProps = {
  mode?: QuizMode;
  jobId?: string;
  topics?: string[];
  maxQuestions?: number;
  title?: string;
  subtitle?: string;
  onGenerated?: () => void;
  className?: string;
  /** Optional custom starter (e.g. retaking a saved set) that replaces the default session start. */
  customStart?: () => Promise<StartSessionResponse>;
  /** Automatically invoke the starter on mount (used by one-click retakes). */
  autoStart?: boolean;
};

const getMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unexpected error";

export default function SkillCheckPanel({
  mode = "sandbox",
  jobId,
  topics,
  maxQuestions,
  title = "Do this quiz while your code is being reviewed",
  subtitle = "Adaptive questions that start simple and get harder as you answer correctly.",
  onGenerated,
  className = "",
  customStart,
  autoStart = false,
}: SkillCheckPanelProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [question, setQuestion] = useState<ClientQuestion | null>(null);
  const [pendingNext, setPendingNext] = useState<ClientQuestion | null>(null);
  const [selected, setSelected] = useState<OptionId | null>(null);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [results, setResults] = useState<QuizResults | null>(null);
  const [difficulty, setDifficulty] = useState<QuizDifficulty>("easy");
  const [answered, setAnswered] = useState(0);
  const [totalPlanned, setTotalPlanned] = useState(0);
  const [source, setSource] = useState<QuizSource>("generated");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questionStartedAt, setQuestionStartedAt] = useState(0);

  const start = useCallback(async () => {
    setPhase("starting");
    setError(null);
    setResult(null);
    setResults(null);
    setSelected(null);
    try {
      const session = customStart
        ? await customStart()
        : await quizApi.startSession({
            mode,
            job_id: jobId,
            topics,
            max_questions: maxQuestions,
          });
      setSessionId(session.session_id);
      setSource(session.source);
      setTotalPlanned(session.total_planned);
      setAnswered(0);
      setDifficulty(session.difficulty);
      if (!session.question) {
        throw new Error("No questions were returned for this skill check.");
      }
      setQuestion(session.question);
      setQuestionStartedAt(Date.now());
      setPhase("question");
      onGenerated?.();
    } catch (err) {
      setError(getMessage(err));
      setPhase("idle");
    }
  }, [mode, jobId, topics, maxQuestions, onGenerated, customStart]);

  const submittedRef = useRef(false);
  const startRef = useRef(start);
  startRef.current = start;
  useEffect(() => {
    if (autoStart && !submittedRef.current) {
      submittedRef.current = true;
      startRef.current();
    }
  }, [autoStart]);

  const submit = useCallback(async () => {
    if (!sessionId || !question || !selected || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const elapsed = (Date.now() - questionStartedAt) / 1000;
      const response = await quizApi.submitAnswer(sessionId, question.qid, selected, elapsed);
      setResult(response.result);
      setAnswered(response.answered);
      setTotalPlanned(response.total_planned);
      setDifficulty(response.difficulty);
      setPendingNext(response.next_question);
      setResults(response.results);
      setPhase("answered");
      if (response.completed) {
        // Fire-and-forget: build mastery profile from stored quiz + sandbox data
        quizApi.analyzeAuto().catch(() => undefined);
      }
    } catch (err) {
      setError(getMessage(err));
    } finally {
      setSubmitting(false);
    }
  }, [sessionId, question, selected, submitting, questionStartedAt]);

  const advance = useCallback(() => {
    if (pendingNext) {
      setQuestion(pendingNext);
      setPendingNext(null);
      setSelected(null);
      setResult(null);
      setQuestionStartedAt(Date.now());
      setPhase("question");
    } else {
      setPhase("completed");
    }
  }, [pendingNext]);

  return (
    <section
      className={`rounded-2xl border border-border bg-card/55 p-4 shadow-xs ${className}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-200">
            <Brain className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-300">
              Java Skill Check
            </p>
            <h2 className="mt-1 text-lg font-extrabold text-foreground">{title}</h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        {phase !== "idle" && (
          <div className="flex items-center gap-2">
            <span
              className={`rounded-lg border px-2.5 py-1 text-xs font-semibold uppercase ${difficultyStyle[difficulty]}`}
            >
              {difficulty}
            </span>
            <span className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground">
              {Math.min(answered + (phase === "question" ? 1 : 0), totalPlanned)} / {totalPlanned}
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-500/25 bg-red-50 dark:bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-100">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-300" />
          <span>{error}</span>
        </div>
      )}

      {/* ── IDLE ── */}
      {phase === "idle" && (
        <button
          type="button"
          onClick={start}
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-bold px-4 py-3 text-sm transition-all shadow-sm hover:brightness-110"
        >
          <Sparkles className="h-4 w-4" />
          Start skill check
        </button>
      )}

      {/* ── STARTING ── */}
      {phase === "starting" && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">
          <CircleDashed className="h-4 w-4 animate-spin text-teal-600 dark:text-teal-300" />
          Generating your Java questions...
        </div>
      )}

      {/* ── QUESTION / ANSWERED ── */}
      {(phase === "question" || phase === "answered") && question && (
        <div className="mt-4 space-y-4">
          <div className="rounded-xl border border-border bg-background p-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {question.topic}
                {question.type === "predict_output" ? " · predict the output" : ""}
              </p>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {source === "seed" ? "Offline practice set" : (
                  <>
                    <Sparkles className="h-3 w-3 text-teal-600 dark:text-teal-300" />
                    Mentora AI
                  </>
                )}
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold leading-6 text-foreground">
              {question.question}
            </p>
            {question.code_snippet && (
              <pre className="mt-3 overflow-x-auto rounded-lg border border-border bg-card p-3 font-mono text-xs leading-5 text-slate-900 dark:text-cyan-50">
                {question.code_snippet}
              </pre>
            )}
          </div>

          <div className="space-y-2">
            {question.options.map((option) => {
              const isSelected = selected === option.id;
              const showAnswers = phase === "answered" && result;
              const isCorrect = showAnswers && result.correct_option_id === option.id;
              const isChosenWrong =
                showAnswers && isSelected && !result.correct;

              let optionClass =
                "border-border bg-background text-foreground hover:border-border-strong hover:bg-muted";
              if (showAnswers) {
                if (isCorrect) {
                  optionClass = "border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-100";
                } else if (isChosenWrong) {
                  optionClass = "border-red-500/40 bg-red-50 dark:bg-red-500/10 text-red-800 dark:text-red-100";
                } else {
                  optionClass = "border-border bg-background text-subtle-foreground";
                }
              } else if (isSelected) {
                optionClass =
                  "border-teal-500 bg-teal-50 dark:bg-teal-500/10 text-teal-900 dark:text-teal-50 shadow-xs";
              }

              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={isSelected}
                  disabled={phase === "answered"}
                  onClick={() => phase === "question" && setSelected(option.id)}
                  className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left text-sm transition-all disabled:cursor-default ${optionClass}`}
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-current text-[11px] font-bold">
                    {option.id}
                  </span>
                  <span className="min-w-0 flex-1 break-words font-mono">{option.text}</span>
                  {showAnswers && isCorrect && (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300" />
                  )}
                  {isChosenWrong && (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-300" />
                  )}
                </button>
              );
            })}
          </div>

          {phase === "answered" && result && (
            <div
              className={`rounded-xl border p-3 text-sm ${
                result.correct
                  ? "border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-900 dark:text-emerald-100"
                  : "border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-900 dark:text-amber-100"
              }`}
            >
              <p className="flex items-center gap-2 font-semibold">
                {result.correct ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-300" />
                )}
                {result.correct ? "Correct" : "Not quite"}
              </p>
              <p className="mt-1 leading-6 text-foreground/80">{result.explanation}</p>
            </div>
          )}

          <div className="flex justify-end">
            {phase === "question" ? (
              <button
                type="button"
                onClick={submit}
                disabled={!selected || submitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-bold px-5 py-2.5 text-sm transition-all shadow-xs disabled:cursor-not-allowed disabled:bg-surface-3 disabled:text-subtle-foreground"
              >
                {submitting ? (
                  <CircleDashed className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Submit answer
              </button>
            ) : (
              <button
                type="button"
                onClick={advance}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-2.5 text-sm font-bold text-cyan-800 dark:text-cyan-100 transition-colors hover:bg-cyan-500/20 shadow-xs"
              >
                {pendingNext ? "Next question" : "See results"}
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── COMPLETED ── */}
      {phase === "completed" && results && (
        <div className="mt-4 space-y-4">
          <div className="flex flex-col items-center gap-2 rounded-xl border border-teal-500/30 bg-teal-50/70 dark:bg-teal-500/10 p-5 text-center">
            <Trophy className="h-7 w-7 text-amber-500 dark:text-amber-300" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-300">
              Skill check complete
            </p>
            <p className="text-4xl font-extrabold text-foreground">{results.score_percent}%</p>
            <p className="text-sm text-muted-foreground">
              {results.correct} of {results.total} correct
            </p>
          </div>

          {results.quiz_performance.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                By topic
              </p>
              {results.quiz_performance.map((perf) => {
                const pct = perf.total
                  ? Math.round((perf.correct / perf.total) * 100)
                  : 0;
                return (
                  <div
                    key={perf.topic}
                    className="rounded-xl border border-border bg-background p-3"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-foreground">{perf.topic}</span>
                      <span className="text-muted-foreground">
                        {perf.correct}/{perf.total}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-400"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button
            type="button"
            onClick={start}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-muted px-4 py-3 text-sm font-semibold text-foreground/80 transition-colors hover:bg-surface-3 hover:text-foreground"
          >
            <RotateCcw className="h-4 w-4" />
            New skill check
          </button>
        </div>
      )}
    </section>
  );
}
