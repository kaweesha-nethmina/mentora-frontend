"use client";
import { useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  X,
  Minus,
  BookOpen,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  Pencil,
  ArrowRight,
  ArrowLeft,
  Trophy,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  AlertTriangle,
  Target,
  Terminal
} from "lucide-react";

interface FeedbackData {
  is_correct: boolean;
  partial_credit: boolean;
  correctness_score?: number;
  evaluation_summary: string;
  immediate_feedback: string;
  concept_explanation: string;
  what_is_correct?: string;
  mistake_analysis?: string;
  correct_explanation: string;
  improvement_tip: string;
  hint_for_retry?: string;
  deeper_insight?: string;
  remediation_note?: string;
  encouragement: string;
  suggested_resources: string[];
  mastery_update: {
    topic: string;
    before_mastery: number;
    after_mastery: number;
    target: number;
  };
  remediation_status?: {
    entered: boolean;
    exited: boolean;
    message: string;
  };
  difficulty_change?: {
    next_difficulty: "Harder" | "Simpler";
    bloom_level_change: string;
  };
  next_action: "continue" | "next_topic" | "complete";
  next_topic_name?: string;
  question_text?: string;
  learner_answer?: string;
  sandbox_execution?: {
    attempted?: boolean;
    compiled?: boolean | null;
    executed_successfully?: boolean | null;
    status?: string;
    stdout?: string | null;
    stderr?: string | null;
    compile_output?: string | null;
    time_seconds?: number | string | null;
    memory_kb?: number | string | null;
    source_code_run?: string;
    reason?: string;
    sandbox_mode?: "learner_code" | "reference_snippet";
  } | null;
}

interface FeedbackPanelProps {
  data?: FeedbackData;
  onNext?: () => void;
}

export default function FeedbackPanel({
  data = {
    is_correct: true,
    partial_credit: false,
    evaluation_summary: "Correct answer selected.",
    immediate_feedback: "Great job! You correctly identified the time complexity of BST insertion.",
    concept_explanation: "Binary Search Trees maintain their efficiency through balancing algorithms that ensure the tree height remains logarithmic relative to the number of nodes.",
    what_is_correct: "You correctly recognized that BST operations depend on tree height.",
    correct_explanation: "The correct answer is O(log n) because balanced BSTs guarantee that search, insertion, and deletion operations take time proportional to the height of the tree, which is O(log n) for n nodes.",
    improvement_tip: "Remember that BST performance depends entirely on tree balance - always consider the height factor.",
    deeper_insight: "Advanced BST implementations like AVL trees and Red-Black trees use rotation operations to maintain balance automatically.",
    encouragement: "Excellent analytical thinking! You're developing a strong intuition for algorithmic complexity.",
    suggested_resources: ["Java TreeMap Documentation", "GeeksforGeeks BST Tutorial"],
    mastery_update: {
      topic: "Binary Search Trees",
      before_mastery: 65,
      after_mastery: 78,
      target: 85
    },
    difficulty_change: {
      next_difficulty: "Harder",
      bloom_level_change: "Moving to Analyzing (L4)"
    },
    next_action: "continue",
    next_topic_name: "Java Collections Framework"
  },
  onNext = () => {}
}: FeedbackPanelProps) {
  const [showQuestion, setShowQuestion] = useState(false);

  const getResultBanner = () => {
    if (data.is_correct) {
      return {
        icon: <CheckCircle className="w-8 h-8 text-green-700 dark:text-green-400" />,
        title: "Correct!",
        bgColor: "bg-green-500/10 border-green-500/30",
        textColor: "text-green-800 dark:text-green-200"
      };
    } else if (data.partial_credit) {
      return {
        icon: <Minus className="w-8 h-8 text-yellow-700 dark:text-yellow-400" />,
        title: `Partially Correct (${data.correctness_score}%)`,
        bgColor: "bg-yellow-500/10 border-yellow-500/30",
        textColor: "text-yellow-800 dark:text-yellow-200"
      };
    } else {
      return {
        icon: <X className="w-8 h-8 text-red-700 dark:text-red-400" />,
        title: "Incorrect",
        bgColor: "bg-red-500/10 border-red-500/30",
        textColor: "text-red-800 dark:text-red-200"
      };
    }
  };

  const result = getResultBanner();

  const hasSandboxOutput = (sb: NonNullable<FeedbackData["sandbox_execution"]>) =>
    sb && (sb.stdout || sb.stderr || sb.compile_output || sb.reason);

  if (showQuestion) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-foreground">Review Question</h3>
        </div>

        <Card className="bg-muted/50 border-border">
          <CardContent className="p-6">
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-wider mb-2">The Question</h4>
                <p className="text-base text-foreground leading-relaxed">
                  {data.question_text || "Question text not available."}
                </p>
              </div>

              <div className="p-4 bg-background rounded-xl border border-border">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Your Answer</h4>
                <p className="text-foreground font-medium">
                  {data.learner_answer || "No answer recorded."}
                </p>
              </div>

              <div className={`p-4 rounded-xl border ${data.is_correct ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                <h4 className={`text-sm font-semibold uppercase tracking-wider mb-2 ${data.is_correct ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                  Result
                </h4>
                <p className={data.is_correct ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}>
                  {data.is_correct ? "You answered correctly!" : "This answer was incorrect."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center pt-4">
          <Button
            onClick={() => setShowQuestion(false)}
            className="bg-primary hover:bg-primary-hover text-primary-foreground px-8 py-3 font-semibold rounded-lg"
          >
            Return to Feedback Panel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Result Banner */}
      <Card className={`${result.bgColor} border`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            {result.icon}
            <div>
              <h3 className="text-xl font-bold text-foreground">{result.title}</h3>
              <p className={result.textColor}>{data.evaluation_summary}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sandbox Execution Output (code questions) */}
      {data.sandbox_execution && data.sandbox_execution.attempted !== false && (
        <Card className="bg-background border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Code Execution Result
                </h4>
              </div>
              <div className="flex items-center gap-2">
                {typeof data.sandbox_execution.compiled === "boolean" && (
                  <Badge
                    variant="outline"
                    className={
                      data.sandbox_execution.compiled
                        ? "border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                        : "border-red-500/30 text-red-700 dark:text-red-400"
                    }
                  >
                    {data.sandbox_execution.compiled ? "Compiled" : "Compile Error"}
                  </Badge>
                )}
                {data.sandbox_execution.status && (
                  <Badge
                    variant="outline"
                    className={
                      data.sandbox_execution.executed_successfully
                        ? "border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                        : data.sandbox_execution.status === "sandbox_unavailable"
                        ? "border-amber-500/30 text-amber-700 dark:text-amber-400"
                        : "border-red-500/30 text-red-700 dark:text-red-400"
                    }
                  >
                    {data.sandbox_execution.status}
                  </Badge>
                )}
              </div>
            </div>

            <div className="font-mono text-sm space-y-3 max-h-72 overflow-y-auto">
              {data.sandbox_execution.compile_output && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1">Compile Output</p>
                  <pre className="whitespace-pre-wrap break-words text-amber-700 dark:text-amber-300 leading-relaxed">{data.sandbox_execution.compile_output}</pre>
                </div>
              )}
              {data.sandbox_execution.stdout && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1">stdout</p>
                  <pre className="whitespace-pre-wrap break-words text-foreground leading-relaxed">{data.sandbox_execution.stdout}</pre>
                </div>
              )}
              {data.sandbox_execution.stderr && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-red-700 dark:text-red-400 mb-1">stderr</p>
                  <pre className="whitespace-pre-wrap break-words text-red-700 dark:text-red-300 leading-relaxed">{data.sandbox_execution.stderr}</pre>
                </div>
              )}
              {!hasSandboxOutput(data.sandbox_execution) && (
                <p className="text-subtle-foreground italic">No output produced.</p>
              )}
              {(data.sandbox_execution.time_seconds || data.sandbox_execution.memory_kb) && (
                <p className="text-subtle-foreground text-xs pt-2 border-t border-border">
                  {data.sandbox_execution.time_seconds ? `Time: ${data.sandbox_execution.time_seconds}s` : ""}
                  {data.sandbox_execution.time_seconds && data.sandbox_execution.memory_kb ? " · " : ""}
                  {data.sandbox_execution.memory_kb ? `Memory: ${data.sandbox_execution.memory_kb} KB` : ""}
                </p>
              )}
            </div>

            <p className="mt-3 text-xs text-subtle-foreground">
              {data.sandbox_execution.sandbox_mode === "reference_snippet"
                ? "The question's reference snippet was executed in a secure sandbox — this is the program's actual output, used by the evaluator to grade your traced answer."
                : "Your submitted code was compiled and executed in a secure sandbox. The evaluator used this real output when grading."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Feedback Sections */}
      <div className="space-y-4">

        {/* Immediate Feedback */}
        <Card className="bg-muted/30 border-border">
          <CardContent className="p-4">
            <p className="text-foreground">{data.immediate_feedback}</p>
          </CardContent>
        </Card>

        {/* Concept Explanation */}
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-blue-700 dark:text-blue-400" />
              <h4 className="text-blue-700 dark:text-blue-300 font-semibold">Concept Explanation</h4>
            </div>
            <p className="text-blue-800 dark:text-blue-200">{data.concept_explanation}</p>
          </CardContent>
        </Card>

        {/* What You Got Right */}
        {data.what_is_correct && (
          <Card className="bg-green-500/10 border-green-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <ThumbsUp className="w-4 h-4 text-green-700 dark:text-green-400" />
                <h4 className="text-green-700 dark:text-green-300 font-semibold">What You Got Right</h4>
              </div>
              <p className="text-green-800 dark:text-green-200">{data.what_is_correct}</p>
            </CardContent>
          </Card>
        )}

        {/* What Was Wrong */}
        {data.mistake_analysis && (
          <Card className="bg-red-500/10 border-red-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <ThumbsDown className="w-4 h-4 text-red-700 dark:text-red-400" />
                <h4 className="text-red-700 dark:text-red-300 font-semibold">What Was Wrong</h4>
              </div>
              <p className="text-red-800 dark:text-red-200">{data.mistake_analysis}</p>
            </CardContent>
          </Card>
        )}

        {/* The Correct Answer */}
        <Card className="bg-muted/30 border-border">
          <CardContent className="p-4">
            <h4 className="text-foreground font-semibold mb-2">The Correct Answer</h4>
            <p className="text-foreground/90">{data.correct_explanation}</p>
          </CardContent>
        </Card>

        {/* Improvement Tip */}
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Pencil className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              <h4 className="text-amber-700 dark:text-amber-300 font-semibold">Improvement Tip</h4>
            </div>
            <p className="text-amber-800 dark:text-amber-200">{data.improvement_tip}</p>
          </CardContent>
        </Card>

        {/* Hint for Next Attempt */}
        {data.hint_for_retry && (
          <Card className="bg-surface-3/50 border-border-strong">
            <CardContent className="p-4">
              <h4 className="text-muted-foreground font-semibold mb-2">Hint for Next Attempt</h4>
              <p className="text-muted-foreground">{data.hint_for_retry}</p>
            </CardContent>
          </Card>
        )}

        {/* Deeper Insight */}
        {data.deeper_insight && (
          <Card className="bg-indigo-500/10 border-indigo-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-indigo-700 dark:text-indigo-400" />
                <h4 className="text-indigo-700 dark:text-indigo-300 font-semibold">Deeper Insight</h4>
              </div>
              <p className="text-indigo-800 dark:text-indigo-200">{data.deeper_insight}</p>
            </CardContent>
          </Card>
        )}

        {/* Remediation Note */}
        {data.remediation_note && (
          <Card className="bg-amber-500/10 border-amber-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                <h4 className="text-amber-700 dark:text-amber-300 font-semibold">Remediation Update</h4>
              </div>
              <p className="text-amber-800 dark:text-amber-200">{data.remediation_note}</p>
            </CardContent>
          </Card>
        )}

        {/* Encouragement */}
        <Card className="bg-teal-500/10 border-teal-500/30">
          <CardContent className="p-4">
            <p className="text-teal-800 dark:text-teal-200 italic">{data.encouragement}</p>
          </CardContent>
        </Card>

        {/* Suggested Resources */}
        {data.suggested_resources.length > 0 && (
          <Card className="bg-muted/30 border-border">
            <CardContent className="p-4">
              <h4 className="text-foreground font-semibold mb-3">Suggested Resources</h4>
              <div className="flex flex-wrap gap-2">
                {data.suggested_resources.map((resource, index) => (
                  <Badge key={index} variant="outline" className="border-slate-500 text-muted-foreground cursor-pointer hover:border-teal-500 hover:text-teal-700 dark:hover:text-teal-300">
                    <ExternalLink className="w-3 h-3 mr-1" />
                    {resource}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      </div>

      {/* Mastery Progress Update */}
      <Card className="bg-card/90 backdrop-blur-xl border border-border overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-2 rounded-xl ${
              data.mastery_update.after_mastery >= data.mastery_update.target
                ? "bg-emerald-500/10"
                : "bg-teal-500/10"
            }`}>
              <Target className={`w-5 h-5 ${
                data.mastery_update.after_mastery >= data.mastery_update.target
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-teal-700 dark:text-teal-400"
              }`} />
            </div>
            <div>
              <h4 className="text-foreground font-bold">Mastery Progress</h4>
              <p className="text-subtle-foreground text-xs">{data.mastery_update.topic}</p>
            </div>
            {data.mastery_update.after_mastery >= data.mastery_update.target && (
              <div className="ml-auto px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
                <p className="text-emerald-700 dark:text-emerald-400 text-xs font-bold">MASTERED</p>
              </div>
            )}
          </div>

          {/* Progress Visualization */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="text-center">
                <p className="text-subtle-foreground text-[10px] uppercase tracking-wider">Before</p>
                <p className="text-2xl font-extrabold text-muted-foreground">{data.mastery_update.before_mastery}%</p>
              </div>

              <div className="flex-1 mx-6 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <ArrowRight className="w-5 h-5 text-teal-700 dark:text-teal-400" />
                </div>
              </div>

              <div className="text-center">
                <p className="text-subtle-foreground text-[10px] uppercase tracking-wider">After</p>
                <p className={`text-2xl font-extrabold ${
                  data.mastery_update.after_mastery >= data.mastery_update.target
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-teal-700 dark:text-teal-400"
                }`}>{data.mastery_update.after_mastery}%</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="relative mt-4">
              <div className="w-full h-3 bg-background rounded-full overflow-visible">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    data.mastery_update.after_mastery >= data.mastery_update.target
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                      : "bg-gradient-to-r from-teal-500 to-teal-400"
                  }`}
                  style={{ width: `${Math.min(data.mastery_update.after_mastery, 100)}%` }}
                />
              </div>

              {/* Target Marker */}
              <div
                className="absolute top-1/2 -translate-y-1/2 -mt-0.5"
                style={{ left: `${data.mastery_update.target}%` }}
              >
                <div className="relative -translate-x-1/2">
                  <div className="w-0.5 h-5 bg-amber-400 rounded-full" />
                  <p className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-amber-700 dark:text-amber-400 font-bold whitespace-nowrap">
                    TARGET {data.mastery_update.target}%
                  </p>
                </div>
              </div>

              {/* Current Position Marker */}
              <div
                className="absolute top-1/2 -translate-y-1/2 -mt-0.5"
                style={{ left: `${Math.min(data.mastery_update.after_mastery, 100)}%` }}
              >
                <div className="relative -translate-x-1/2">
                  <div className={`w-3 h-3 rounded-full border-2 border-background ${
                    data.mastery_update.after_mastery >= data.mastery_update.target
                      ? "bg-emerald-400"
                      : "bg-teal-400"
                  } shadow-raised`} />
                </div>
              </div>
            </div>

            {/* Status Message */}
            <p className={`text-center text-sm font-medium mt-8 ${
              data.mastery_update.after_mastery >= data.mastery_update.target
                ? "text-emerald-700 dark:text-emerald-400"
                : "text-muted-foreground"
            }`}>
              {data.mastery_update.after_mastery >= data.mastery_update.target
                ? "🎉 Congratulations! You've mastered this topic!"
                : `Keep going! Just ${data.mastery_update.target - data.mastery_update.after_mastery}% more to reach your target.`}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Remediation Status Notifications */}
      {data.remediation_status && (
        <Card className={`${data.remediation_status.entered ? 'bg-amber-500/10 border-amber-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              {data.remediation_status.entered ? (
                <AlertTriangle className="w-5 h-5 text-amber-700 dark:text-amber-400" />
              ) : (
                <Trophy className="w-5 h-5 text-green-700 dark:text-green-400" />
              )}
              <p className={`font-semibold ${data.remediation_status.entered ? 'text-amber-700 dark:text-amber-300' : 'text-green-700 dark:text-green-300'}`}>
                {data.remediation_status.entered ? "Entered Remediation Mode" : "Exited Remediation Mode"}
              </p>
            </div>
            <p className={`mt-2 ${data.remediation_status.entered ? 'text-amber-800 dark:text-amber-200' : 'text-green-800 dark:text-green-200'}`}>
              {data.remediation_status.message}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Difficulty Change Notification */}
      {data.difficulty_change && (
        <div className={`p-3 rounded-lg border text-center ${
          data.difficulty_change.next_difficulty === "Harder"
            ? "bg-green-500/10 border-green-500/30"
            : "bg-amber-500/10 border-amber-500/30"
        }`}>
          <p className={`text-sm font-medium ${
            data.difficulty_change.next_difficulty === "Harder" ? "text-green-700 dark:text-green-300" : "text-amber-700 dark:text-amber-300"
          }`}>
            Next question: {data.difficulty_change.next_difficulty} ({data.difficulty_change.bloom_level_change})
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Button
          onClick={() => setShowQuestion(true)}
          variant="outline"
          className="border-teal-500/30 text-teal-700 dark:text-teal-400 hover:bg-teal-500/10 px-6 py-3 font-semibold rounded-lg order-2 sm:order-1"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Review Question
        </Button>
        <Button
          onClick={onNext}
          className="bg-primary hover:bg-primary-hover text-primary-foreground px-6 py-3 font-semibold rounded-lg order-1 sm:order-2"
        >
          {data.next_action === "continue" && "Next Question →"}
          {data.next_action === "next_topic" && `Next Topic: ${data.next_topic_name} →`}
          {data.next_action === "complete" && "View My Assessment Report →"}
        </Button>
      </div>

    </div>
  );
}