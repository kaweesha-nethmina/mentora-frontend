"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Code,
  Lightbulb,
  Clock,
  HelpCircle,
  Trash2,
  BarChart3,
  BookOpen,
  TrendingUp,
  Sparkles,
  Layers,
  Target,
  Zap,
} from "lucide-react";
import { assessmentApi } from "@/lib/api/assessment";

interface QAItem {
  id: string;
  number: number;
  question: string;
  type: "mcq" | "code_completion" | "code_tracing" | "debugging" | "coding_challenge";
  code_snippet?: string;
  options?: string[];
  learner_answer: string;
  correct_answer: string;
  is_correct: boolean;
  explanation: string | string[];
  topic: string;
  difficulty: "Easy" | "Medium" | "Hard";
  bloom_level: number | string;
  time_spent: number;
  timestamp?: number;
}

const getDifficultyMeta = (difficulty: string) => {
  switch (difficulty) {
    case "Easy": return { dot: "bg-emerald-400", badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" };
    case "Medium": return { dot: "bg-amber-400", badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30" };
    case "Hard": return { dot: "bg-red-400", badge: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30" };
    default: return { dot: "bg-white/30", badge: "bg-muted text-muted-foreground border-border" };
  }
};

const getTypeMeta = (type: string) => {
  switch (type) {
    case "mcq": return { label: "MCQ", badge: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30" };
    case "code_completion": return { label: "Completion", badge: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30" };
    case "code_tracing": return { label: "Tracing", badge: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/30" };
    case "debugging": return { label: "Debugging", badge: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30" };
    case "coding_challenge": return { label: "Challenge", badge: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30" };
    default: return { label: type, badge: "bg-muted text-muted-foreground border-border" };
  }
};

export default function QuestionsAnswersPage() {
  const [qaData, setQaData] = useState<QAItem[]>([]);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<"all" | "correct" | "incorrect">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const result = await assessmentApi.getQuestions();
        if (result.success && result.data?.length > 0) {
          setQaData(result.data.sort((a: QAItem, b: QAItem) => (a.timestamp || 0) - (b.timestamp || 0)));
          setLoading(false);
          return;
        }
      } catch {}

      const currentLearnerId = JSON.parse(localStorage.getItem('user') || '{}').student_id;
      const storedLearnerId = localStorage.getItem('assessment_qa_learner');
      const belongsToCurrentUser = !currentLearnerId || !storedLearnerId || storedLearnerId === currentLearnerId;

      if (!belongsToCurrentUser) {
        localStorage.removeItem('assessment_qa');
        localStorage.removeItem('assessment_qa_learner');
      } else {
        const local = localStorage.getItem("assessment_qa");
        if (local) {
          try {
            setQaData(JSON.parse(local));
          } catch {}
        }
      }
      setLoading(false);
    };
    fetchQuestions();
  }, []);

  const clearAll = () => {
    localStorage.removeItem("assessment_qa");
    setQaData([]);
  };

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredData = qaData.filter(item => {
    if (filter === "correct") return item.is_correct;
    if (filter === "incorrect") return !item.is_correct;
    return true;
  });

  const groupedByTopic = filteredData.reduce((acc, item) => {
    const topic = item.topic || "Uncategorized";
    if (!acc[topic]) acc[topic] = [];
    acc[topic].push(item);
    return acc;
  }, {} as Record<string, QAItem[]>);

  const topicKeys = Object.keys(groupedByTopic);
  const correctCount = qaData.filter(q => q.is_correct).length;
  const totalCount = qaData.length;
  const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6 animate-slide-up">

      {/* ── HEADER ── */}
      <div className="bg-card/90 backdrop-blur-xl border border-border rounded-2xl p-6 lg:p-8 relative overflow-hidden">
        <div className="absolute inset-[-50%] bg-gradient-to-r from-teal-500/0 via-teal-500/[0.03] to-teal-500/0 animate-pulse" />
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 rounded-lg bg-teal-500/10">
                  <BookOpen className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                </div>
                <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider">Review</span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-extrabold text-foreground">Questions & Answers</h1>
              <p className="text-muted-foreground text-sm mt-1">Review every question with detailed explanations</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-background rounded-xl border border-border px-4 py-2.5 text-center min-w-[90px]">
                <p className="text-[10px] text-subtle-foreground uppercase tracking-wider font-semibold">Accuracy</p>
                <p className={`text-xl font-extrabold ${accuracy >= 70 ? "text-emerald-700 dark:text-emerald-400" : accuracy >= 40 ? "text-amber-700 dark:text-amber-400" : "text-red-700 dark:text-red-400"}`}>
                  {totalCount > 0 ? `${accuracy}%` : "—"}
                </p>
              </div>
              <div className="bg-background rounded-xl border border-border px-4 py-2.5 text-center min-w-[90px]">
                <p className="text-[10px] text-subtle-foreground uppercase tracking-wider font-semibold">Questions</p>
                <p className="text-xl font-extrabold text-foreground">{totalCount}</p>
              </div>
              {totalCount > 0 && (
                <button
                  onClick={clearAll}
                  className="px-3 py-2.5 bg-red-500/5 border border-red-500/20 text-red-700 dark:text-red-400 rounded-xl text-sm font-semibold hover:bg-red-500/15 transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {[
              { key: "all", label: "All Questions", count: totalCount },
              { key: "correct", label: "Correct", count: correctCount },
              { key: "incorrect", label: "Incorrect", count: totalCount - correctCount },
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key as typeof filter)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${
                  filter === key
                    ? "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/30 shadow-sm"
                    : "bg-background/50 text-subtle-foreground border-border hover:text-foreground/80 hover:border-border"
                }`}
              >
                {label} <span className="text-xs opacity-70">({count})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── LOADING ── */}
      {loading ? (
        <div className="bg-card/90 backdrop-blur-xl border border-border rounded-2xl p-16 text-center">
          <div className="w-12 h-12 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-1">Loading Questions...</h3>
          <p className="text-subtle-foreground text-sm">Fetching your assessment data</p>
        </div>
      ) : totalCount === 0 ? (
        <div className="bg-card/90 backdrop-blur-xl border border-border rounded-2xl p-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-background border border-border flex items-center justify-center">
            <HelpCircle className="w-8 h-8 text-subtle-foreground/70" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">No Questions Yet</h3>
          <p className="text-subtle-foreground text-sm mb-6 max-w-md mx-auto">
            Complete an assessment to see your questions and answers reviewed here.
          </p>
          <a
            href="/assessment"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl font-semibold transition-all shadow-raised "
          >
            Start Assessment
            <Zap className="w-4 h-4" />
          </a>
        </div>
      ) : (
        <>
          {/* ── QUESTIONS BY TOPIC ── */}
          <div className="space-y-5">
            {topicKeys.map((topic) => {
              const topicQuestions = groupedByTopic[topic];
              const topicCorrect = topicQuestions.filter(q => q.is_correct).length;
              const topicTotal = topicQuestions.length;
              const topicAccuracy = Math.round((topicCorrect / topicTotal) * 100);
              const accuracyColor = topicAccuracy >= 70 ? "text-emerald-700 dark:text-emerald-400" : topicAccuracy >= 40 ? "text-amber-700 dark:text-amber-400" : "text-red-700 dark:text-red-400";
              const barColor = topicAccuracy >= 70 ? "bg-emerald-500" : topicAccuracy >= 40 ? "bg-amber-500" : "bg-red-500";

              return (
                <div key={topic} className="bg-card/90 backdrop-blur-xl border border-border rounded-2xl overflow-hidden">

                  {/* Topic Header */}
                  <div className="p-5 border-b border-border bg-background/30">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-blue-500/10">
                          <Layers className="w-5 h-5 text-blue-700 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-foreground">{topic}</h3>
                          <p className="text-xs text-subtle-foreground">{topicTotal} question{topicTotal !== 1 ? 's' : ''}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className={`text-lg font-extrabold ${accuracyColor}`}>{topicAccuracy}%</p>
                            <p className="text-[9px] text-subtle-foreground uppercase tracking-wider">Accuracy</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-extrabold text-foreground">{topicCorrect}<span className="text-sm text-subtle-foreground">/{topicTotal}</span></p>
                            <p className="text-[9px] text-subtle-foreground uppercase tracking-wider">Correct</p>
                          </div>
                        </div>
                        <div className="w-24 h-1.5 bg-background rounded-full overflow-hidden hidden sm:block">
                          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${topicAccuracy}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Question Rows */}
                  <div className="divide-y divide-border">
                    {topicQuestions.map((item) => {
                      const isExpanded = expandedItems[item.id];
                      const diffMeta = getDifficultyMeta(item.difficulty);
                      const typeMeta = getTypeMeta(item.type);

                      return (
                        <div key={item.id}>
                          <div
                            className="p-4 lg:p-5 cursor-pointer hover:bg-muted transition-colors"
                            onClick={() => toggleExpand(item.id)}
                          >
                            <div className="flex items-start gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                                item.is_correct
                                  ? "bg-emerald-500/10 border-emerald-500/20"
                                  : "bg-red-500/10 border-red-500/20"
                              }`}>
                                {item.is_correct
                                  ? <CheckCircle className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                                  : <XCircle className="w-5 h-5 text-red-700 dark:text-red-400" />
                                }
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                  <span className="text-xs font-bold text-subtle-foreground">Q{item.number}</span>
                                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${diffMeta.badge}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${diffMeta.dot}`} />
                                    {item.difficulty}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${typeMeta.badge}`}>
                                    {typeMeta.label}
                                  </span>
                                </div>

                                <h4 className="text-foreground font-semibold text-sm leading-relaxed line-clamp-2">{item.question}</h4>

                                <div className="flex items-center gap-3 mt-2">
                                  <span className="flex items-center gap-1 text-[11px] text-subtle-foreground">
                                    <Clock className="w-3 h-3" />
                                    {Math.floor(item.time_spent / 60)}m {item.time_spent % 60}s
                                  </span>
                                  <span className={`flex items-center gap-1 text-[11px] font-semibold ${
                                    item.is_correct ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"
                                  }`}>
                                    {item.is_correct
                                      ? <><CheckCircle className="w-3 h-3" /> Correct</>
                                      : <><XCircle className="w-3 h-3" /> Incorrect</>
                                    }
                                  </span>
                                </div>
                              </div>

                              <button className="shrink-0 p-1 rounded-lg hover:bg-muted transition-colors">
                                {isExpanded
                                  ? <ChevronUp className="w-4 h-4 text-subtle-foreground" />
                                  : <ChevronDown className="w-4 h-4 text-subtle-foreground" />
                                }
                              </button>
                            </div>
                          </div>

                          {/* Expanded Details */}
                          {isExpanded && (
                            <div className="px-5 pb-5 lg:pl-[72px] lg:pr-5">
                              <div className="border-l-2 border-teal-500/30 pl-5 space-y-4">

                                {item.code_snippet && (
                                  <div className="bg-background rounded-xl border border-border overflow-hidden">
                                    <div className="flex items-center gap-1.5 px-4 py-2 bg-muted border-b border-border">
                                      <Code className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
                                      <span className="text-[10px] font-semibold text-subtle-foreground uppercase tracking-wider">Code</span>
                                    </div>
                                    <pre className="p-4 text-emerald-700 dark:text-emerald-400/90 text-sm overflow-x-auto font-mono leading-relaxed"><code>{item.code_snippet}</code></pre>
                                  </div>
                                )}

                                {item.options && (
                                  <div>
                                    <p className="text-[10px] font-semibold text-subtle-foreground uppercase tracking-wider mb-2">Options</p>
                                    <div className="space-y-1.5">
                                      {item.options.map((option, idx) => {
                                        const isLearnerAnswer = option === item.learner_answer;
                                        const isCorrectAnswer = option === item.correct_answer;
                                        let rowStyle = "bg-background border-border text-muted-foreground";
                                        let indicator = null;
                                        if (isCorrectAnswer) {
                                          rowStyle = "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300";
                                          indicator = <CheckCircle className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 ml-auto shrink-0" />;
                                        } else if (isLearnerAnswer) {
                                          rowStyle = "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300";
                                          indicator = <XCircle className="w-3.5 h-3.5 text-red-700 dark:text-red-400 ml-auto shrink-0" />;
                                        }
                                        return (
                                          <div key={idx} className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-sm ${rowStyle}`}>
                                            <span className="font-bold text-xs w-5 text-center">{String.fromCharCode(65 + idx)}.</span>
                                            <span>{option}</span>
                                            {indicator}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                <div className="bg-background rounded-xl border border-border p-4">
                                  <div className="flex items-center gap-2 mb-2">
                                    {item.is_correct
                                      ? <CheckCircle className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                                      : <XCircle className="w-4 h-4 text-red-700 dark:text-red-400" />
                                    }
                                    <span className="text-[10px] font-semibold text-subtle-foreground uppercase tracking-wider">Your Answer</span>
                                  </div>
                                  {item.type === 'coding_challenge' || item.type === 'code_completion' || item.type === 'code_tracing' || item.type === 'debugging' ? (
                                    <pre className={`text-xs font-mono whitespace-pre-wrap break-words leading-relaxed max-h-64 overflow-y-auto ${item.is_correct ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>{item.learner_answer || "Not answered"}</pre>
                                  ) : (
                                    <p className={`text-sm ${item.is_correct ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>{item.learner_answer || "Not answered"}</p>
                                  )}
                                </div>

                                {!item.is_correct && (
                                  <div className="bg-emerald-500/5 rounded-xl border border-emerald-500/20 p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                      <CheckCircle className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                                      <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Correct Answer</span>
                                    </div>
                                    {item.type === 'coding_challenge' || item.type === 'code_completion' || item.type === 'code_tracing' || item.type === 'debugging' ? (
                                      <pre className="text-xs font-mono whitespace-pre-wrap break-words leading-relaxed max-h-64 overflow-y-auto text-emerald-700 dark:text-emerald-300">{item.correct_answer}</pre>
                                    ) : (
                                      <p className="text-sm text-emerald-700 dark:text-emerald-300">{item.correct_answer}</p>
                                    )}
                                  </div>
                                )}

                                <div className="bg-amber-500/5 rounded-xl border border-amber-500/20 p-4">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Lightbulb className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                                    <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Explanation</span>
                                  </div>
                                  {Array.isArray(item.explanation) ? (
                                    <ul className="space-y-1">
                                      {item.explanation.map((point, idx) => (
                                        <li key={idx} className="text-sm text-amber-800 dark:text-amber-200/80 leading-relaxed flex items-start gap-2">
                                          <span className="text-amber-400 mt-1.5 w-1 h-1 rounded-full bg-amber-400 shrink-0" />
                                          {point}
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="text-sm text-amber-800 dark:text-amber-200/80 leading-relaxed">{item.explanation}</p>
                                  )}
                                </div>

                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── SUMMARY FOOTER ── */}
          <div className="bg-card/90 backdrop-blur-xl border border-border rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-teal-500/10">
                  <BarChart3 className="w-5 h-5 text-teal-700 dark:text-teal-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Assessment Summary</h3>
                  <p className="text-xs text-subtle-foreground">
                    {correctCount} of {totalCount} correct &middot; {accuracy}% accuracy
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{correctCount} Correct</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 rounded-lg border border-red-500/20">
                  <XCircle className="w-3.5 h-3.5 text-red-700 dark:text-red-400" />
                  <span className="text-xs font-bold text-red-700 dark:text-red-400">{totalCount - correctCount} Incorrect</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
