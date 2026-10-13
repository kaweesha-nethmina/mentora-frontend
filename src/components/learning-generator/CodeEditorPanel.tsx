"use client";

import { useState } from "react";
import { Code2, ChevronRight, RotateCcw, Play, Loader2, Terminal, Sparkles, CheckCircle2, XCircle, Brain } from "lucide-react";
import type { LearningMaterial } from "@/lib/api/learningGenerator";

interface CodeEditorPanelProps {
  code: string;
  output: string | null;
  executionError: string | null;
  isExecuting: boolean;
  isCompilationError: boolean;
  aiFeedback: string | null;
  isAiLoading: boolean;
  activeTab: "output" | "feedback";
  currentStepId: string | undefined;
  onCodeChange: (code: string) => void;
  onRunCode: () => void;
  onResetCode: () => void;
  onTabChange: (tab: "output" | "feedback") => void;
  onClose: () => void;
}

export default function CodeEditorPanel({
  code,
  output,
  executionError,
  isExecuting,
  isCompilationError,
  aiFeedback,
  isAiLoading,
  activeTab,
  currentStepId,
  onCodeChange,
  onRunCode,
  onResetCode,
  onTabChange,
  onClose,
}: CodeEditorPanelProps) {
  return (
    <div className="flex-[1.2] flex flex-col bg-sunken border-l border-border transition-colors duration-200">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-background border-b border-border">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span className="text-xs font-mono font-semibold text-foreground/80">Main.java</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors text-xs font-medium"
            title="Close Code Editor"
          >
            <ChevronRight className="w-3.5 h-3.5" /> Close
          </button>
          <button
            onClick={onResetCode}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            title="Reset Code"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onRunCode}
            disabled={!code.trim() || isExecuting}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-primary hover:bg-primary-hover disabled:bg-teal-800 disabled:cursor-wait text-primary-foreground text-xs font-bold rounded-lg transition-colors shadow-sm"
          >
            {isExecuting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-current" />}
            {isExecuting ? "Compiling..." : "Run Code"}
          </button>
        </div>
      </div>

      {/* Editor Workspace */}
      <div className="flex-1 relative">
        <textarea
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          spellCheck="false"
          placeholder={currentStepId === "practice" ? "// Write your solution here..." : currentStepId === "debug" ? "// Fix the bug in this code..." : "// Type or paste code to run..."}
          className="absolute inset-0 w-full h-full p-6 bg-transparent text-slate-900 dark:text-teal-300 font-mono text-sm leading-relaxed resize-none outline-none focus:ring-0 custom-scrollbar whitespace-pre placeholder:text-subtle-foreground caret-teal-600 dark:caret-teal-400"
          style={{ tabSize: 4 }}
        />
      </div>

      {/* Tabbed Output & AI Feedback Panel */}
      <div className="h-64 flex flex-col bg-background border-t border-border relative z-10 shadow-raised">
        {/* Tab Headers */}
        <div className="flex border-b border-border bg-popover">
          <button
            onClick={() => onTabChange("output")}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === "output"
                ? "border-teal-600 text-teal-700 bg-white dark:bg-transparent dark:border-teal-400 dark:text-teal-400 font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Terminal className="w-3 h-3" /> Output {executionError && <span className="w-2 h-2 rounded-full bg-red-500" />}
          </button>
          <button
            onClick={() => onTabChange("feedback")}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === "feedback"
                ? "border-teal-600 text-teal-700 bg-white dark:bg-transparent dark:border-teal-400 dark:text-teal-400 font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="w-3 h-3" /> AI Feedback {isAiLoading && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />} {!isAiLoading && aiFeedback && <span className="w-2 h-2 rounded-full bg-green-500" />}
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
          {activeTab === "output" && (
            <div className="space-y-3">
              {isExecuting && !output && !executionError && (
                <div className="flex items-center gap-3 text-muted-foreground text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Compiling and running...
                </div>
              )}

              {!isExecuting && !output && !executionError && (
                <p className="text-sm text-subtle-foreground italic">Hit Run Code to see output here.</p>
              )}

              {output && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                    <span className="text-xs text-green-700 dark:text-green-400 font-bold">Exit code: 0</span>
                  </div>
                  <pre className="font-mono text-xs text-slate-900 dark:text-teal-200 bg-sunken p-3 rounded-lg border border-border whitespace-pre-wrap wrap-break-word leading-relaxed">
                    {output}
                  </pre>
                </div>
              )}

              {executionError && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
                    <span className={`text-xs font-bold ${isCompilationError ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
                      {isCompilationError ? "Compilation Error" : "Runtime Error"}
                    </span>
                  </div>
                  <pre className="font-mono text-xs text-red-700 dark:text-red-200 bg-red-50 dark:bg-red-950/40 p-3 rounded-lg border border-red-200 dark:border-red-500/20 whitespace-pre-wrap wrap-break-word leading-relaxed">
                    {executionError}
                  </pre>
                </div>
              )}
            </div>
          )}

          {activeTab === "feedback" && (
            <div className="space-y-3">
              {isAiLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal-500/10 dark:bg-teal-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Brain className="w-4 h-4 text-teal-600 dark:text-teal-400 animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-teal-700 dark:text-teal-400 uppercase tracking-wider font-bold mb-2">Mentora AI is Thinking</p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-teal-600 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-teal-600 rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-teal-600 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}

              {!isExecuting && !aiFeedback && !isAiLoading && (
                <p className="text-sm text-subtle-foreground italic">Run your code to get AI feedback.</p>
              )}

              {aiFeedback && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal-500/10 dark:bg-teal-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Brain className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-teal-700 dark:text-teal-400 uppercase tracking-wider font-bold mb-1">Mentora AI</p>
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{aiFeedback}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
