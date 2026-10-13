"use client";

import { Terminal, Sparkles, Eye, Zap, CheckCircle2, XCircle, Loader2, Brain, Wand2, Check, Layers } from "lucide-react";
import type { CodeReviewResult } from "@/lib/api/aiEngine";

type TabId = "output" | "feedback" | "review" | "fix";

interface WorkspaceTabsProps {
  activeTab: TabId;
  output: string | null;
  executionError: string | null;
  isExecuting: boolean;
  isCompilationError: boolean;
  aiFeedback: string | null;
  isAiLoading: boolean;
  reviewMode: boolean;
  reviewData: CodeReviewResult | null;
  isReviewing: boolean;
  fixSuggestion: { suggested_fix: string; fixed_code: string; explanation: string } | null;
  isFixing: boolean;
  structuredOutput: object | null;
  onTabChange: (tab: TabId) => void;
  onStartReview: () => void;
  onRetryReview: () => void;
  onFixError: () => void;
  onApplyFix: () => void;
}

export default function WorkspaceTabs({
  activeTab, output, executionError, isExecuting, isCompilationError,
  aiFeedback, isAiLoading, reviewMode, reviewData, isReviewing,
  fixSuggestion, isFixing, structuredOutput,
  onTabChange, onStartReview, onRetryReview, onFixError, onApplyFix,
}: WorkspaceTabsProps) {
  const tabs: Array<{ id: TabId; icon: React.ComponentType<{ className?: string }>; label: string; hasIndicator: boolean }> = [
    { id: "output", icon: Terminal, label: "Output", hasIndicator: !!executionError },
    { id: "feedback", icon: Sparkles, label: "AI", hasIndicator: !!aiFeedback },
    { id: "review", icon: Eye, label: "Review", hasIndicator: !!reviewData?.annotations?.length },
    { id: "fix", icon: Zap, label: "Fix", hasIndicator: !!executionError },
  ];

  return (
    <div className="w-[40%] flex flex-col bg-background border-l border-border transition-colors duration-200">
      <div className="flex bg-popover border-b border-border shrink-0">
        {tabs.map(({ id, icon: Icon, label, hasIndicator }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex-1 px-2 py-2.5 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              activeTab === id
                ? "border-teal-600 text-teal-700 dark:border-teal-400 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-500/10"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-3.5 h-3.5" /> {label}
            {hasIndicator && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
          </button>
        ))}
      </div>

      <div className="flex-1 p-3 overflow-y-auto custom-scrollbar">
        {activeTab === "output" && (
          <div className="space-y-2">
            {isExecuting && !output && !executionError && (
              <div className="flex items-center gap-2 text-muted-foreground text-xs"><Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" /> Compiling...</div>
            )}
            {!isExecuting && !output && !executionError && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Terminal className="w-8 h-8 text-subtle-foreground/70 mb-2" />
                <p className="text-xs text-muted-foreground">Hit Run to see output.</p>
              </div>
            )}
            {output && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                  <span className="text-[10px] text-green-700 dark:text-green-400 font-bold">Exit 0</span>
                </div>
                {structuredOutput ? (
                  <div className="bg-sunken border border-border rounded-xl p-3 shadow-xs">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Layers className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">Structured View</span>
                    </div>
                    <pre className="text-xs font-mono text-amber-800 dark:text-amber-200/90 whitespace-pre-wrap leading-relaxed">
                      {JSON.stringify(structuredOutput, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <pre className="text-xs font-mono text-slate-900 dark:text-teal-300 bg-sunken p-3 rounded-xl border border-border whitespace-pre-wrap leading-relaxed shadow-xs">{output}</pre>
                )}
              </div>
            )}
            {executionError && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <XCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                  <span className="text-[10px] font-bold text-red-600 dark:text-red-400">{isCompilationError ? "Compile Error" : "Runtime Error"}</span>
                </div>
                <pre className="text-xs font-mono text-red-700 dark:text-red-200 bg-red-50 dark:bg-red-950/40 p-3 rounded-xl border border-red-200 dark:border-red-500/20 whitespace-pre-wrap leading-relaxed">{executionError}</pre>
              </div>
            )}
          </div>
        )}

        {activeTab === "feedback" && (
          <div className="space-y-2">
            {isAiLoading && (
              <div className="flex items-center gap-2 text-xs text-teal-700 dark:text-teal-400/80"><Loader2 className="w-3.5 h-3.5 animate-spin" /> AI thinking...</div>
            )}
            {!isAiLoading && !aiFeedback && (
              <p className="text-xs text-muted-foreground text-center py-8">Run code to get AI feedback.</p>
            )}
            {aiFeedback && (
              <div className="flex gap-2.5 p-3.5 bg-card rounded-xl border border-border shadow-xs">
                <Brain className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] text-teal-700 dark:text-teal-400 font-bold uppercase mb-1.5">Mentora AI</p>
                  <p className="text-xs text-slate-800 dark:text-teal-50 leading-relaxed whitespace-pre-wrap">{aiFeedback}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "review" && (
          <div className="space-y-3">
            {isReviewing && (
              <div className="flex items-center gap-2 text-xs text-purple-700 dark:text-purple-400/80"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing code...</div>
            )}
            {!isReviewing && !reviewData && (
              <div className="text-center py-8">
                <Eye className="w-8 h-8 text-subtle-foreground/70 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground mb-3">Click Review in the toolbar to analyze your code.</p>
                <button onClick={onStartReview} className="px-3.5 py-1.5 bg-purple-500/20 border border-purple-500/30 text-purple-700 dark:text-purple-400 text-xs font-bold rounded-lg hover:bg-purple-500/30 shadow-xs">
                  Start Review
                </button>
              </div>
            )}
            {reviewData && (
              <div className="space-y-3">
                {reviewData.is_error ? (
                  <div className="text-center py-6">
                    <XCircle className="w-6 h-6 text-red-500/60 mx-auto mb-2" />
                    <p className="text-xs text-red-600 dark:text-red-400 mb-3">{reviewData.summary}</p>
                    <button onClick={onRetryReview} className="px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 text-purple-700 dark:text-purple-400 text-xs font-bold rounded-lg hover:bg-purple-500/30 flex items-center gap-1.5 mx-auto">
                      <Loader2 className="w-3 h-3" /> Retry Review
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-purple-700 dark:text-purple-400 font-bold uppercase">Score: {reviewData.overall_score}/10</span>
                      <div className="w-20 h-1.5 bg-surface-3 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${reviewData.overall_score * 10}%` }} />
                      </div>
                    </div>
                    <p className="text-xs text-foreground/80">{reviewData.summary}</p>
                    {reviewData.annotations.map((ann, i) => (
                      <div key={i} className={`p-2.5 rounded-xl border shadow-xs ${
                        ann.severity === "high" ? "bg-red-50/80 dark:bg-red-500/10 border-red-200 dark:border-red-500/20" : ann.severity === "medium" ? "bg-amber-50/80 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20" : "bg-blue-50/80 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20"
                      }`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[9px] font-bold text-muted-foreground">L{ann.line_start}{ann.line_end !== ann.line_start ? `-L${ann.line_end}` : ""}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            ann.severity === "high" ? "bg-red-100 text-red-800 dark:bg-red-500/30 dark:text-red-300" : ann.severity === "medium" ? "bg-amber-100 text-amber-800 dark:bg-amber-500/30 dark:text-amber-300" : "bg-blue-100 text-blue-800 dark:bg-blue-500/30 dark:text-blue-300"
                          }`}>{ann.severity}</span>
                          <span className="text-[9px] text-muted-foreground">{ann.category}</span>
                        </div>
                        <p className="text-xs text-foreground">{ann.message}</p>
                        <p className="text-[10px] text-teal-700 dark:text-teal-400 font-semibold mt-1">{ann.suggestion}</p>
                      </div>
                    ))}
                    {reviewData.annotations.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No issues found. Great code!</p>}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "fix" && (
          <div className="space-y-2">
            {executionError ? (
              <>
                {!isFixing && !fixSuggestion && (
                  <button onClick={onFixError} className="w-full py-2 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold rounded-lg hover:bg-red-500/20 flex items-center justify-center gap-1.5 shadow-xs">
                    <Wand2 className="w-3.5 h-3.5" /> AI Fix This Error
                  </button>
                )}
                {isFixing && (
                  <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400/80"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing error...</div>
                )}
                {fixSuggestion && (
                  <div className="space-y-2">
                    <div className="p-2.5 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl shadow-xs">
                      <p className="text-[10px] text-green-700 dark:text-green-400 font-bold mb-1">Suggested Fix</p>
                      <p className="text-xs text-foreground">{fixSuggestion.suggested_fix}</p>
                    </div>
                    <div className="relative">
                      <div className="bg-sunken p-3 rounded-xl border border-teal-500/30 max-h-48 overflow-y-auto shadow-xs">
                        {fixSuggestion.fixed_code.split("\n").map((line, i) => {
                          const isFix = line.includes("// FIX:");
                          const [codePart, comment] = isFix ? line.split("// FIX:") : [line, null];
                          return (
                            <div key={i} className={`flex ${isFix ? "bg-amber-50 dark:bg-amber-500/10 -mx-3 px-3 py-0.5 border-l-2 border-amber-500" : ""}`}>
                              <span className="text-[9px] text-subtle-foreground w-6 text-right mr-3 shrink-0 select-none">{i + 1}</span>
                              <code className="text-xs font-mono text-slate-900 dark:text-teal-200 whitespace-pre-wrap leading-relaxed">
                                {codePart}
                                {comment && <span className="text-amber-700 dark:text-amber-400 font-bold">// FIX:{comment}</span>}
                              </code>
                            </div>
                          );
                        })}
                      </div>
                      <button onClick={onApplyFix} className="absolute top-2 right-2 px-3 py-1.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-lg hover:bg-primary-hover flex items-center gap-1.5 shadow-card">
                        <Check className="w-3 h-3" /> Apply Fix
                      </button>
                    </div>
                    <div className="p-3 bg-card border border-border rounded-xl shadow-xs">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">How it works</p>
                      <p className="text-xs text-foreground/80 leading-relaxed">{fixSuggestion.explanation}</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-8">No errors to fix.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
