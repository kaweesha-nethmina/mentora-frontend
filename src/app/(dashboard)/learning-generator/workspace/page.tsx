"use client";

import { useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { aiEngineApi, type CodeExecutionResult, type CodeReviewResult, type Flashcard } from "@/lib/api/aiEngine";
import { useWorkspaceSession } from "@/hooks/useWorkspaceSession";
import WorkspaceTopBar from "@/components/learning-generator/WorkspaceTopBar";
import StdinBar from "@/components/learning-generator/StdinBar";
import WorkspaceEditor from "@/components/learning-generator/WorkspaceEditor";
import WorkspaceTabs from "@/components/learning-generator/WorkspaceTabs";
import ExecutionTimeline from "@/components/learning-generator/ExecutionTimeline";
import FlashcardsPanel from "@/components/learning-generator/FlashcardsPanel";
import TestsPanel from "@/components/learning-generator/TestsPanel";

export default function WorkspaceSandbox() {
  const { user } = useAuth();
  const { session, update, reset } = useWorkspaceSession();

  const editorRef = useRef<HTMLTextAreaElement>(null);

  const handleRunCode = async () => {
    if (!session.code.trim()) return;
    update({ isExecuting: true, output: null, executionError: null, aiFeedback: null, structuredOutput: null, fixSuggestion: null, reviewData: null, activeTab: "output" });

    try {
      const res = await aiEngineApi.executeCode(session.code, "sandbox", session.stdinInput || undefined);
      if (res.data) {
        const { success, output: runOutput, error: runError, is_compilation_error: isCompError } = res.data;
        update({ isCompilationError: isCompError });

        if (runError) {
          update({ executionError: runError, activeTab: "fix" });
        } else if (runOutput) {
          const structured = tryAutoFormatOutput(runOutput);
          const timeline = extractTimeline(runOutput);
          update({ output: runOutput, structuredOutput: structured, executionTimeline: timeline });
        }

        try {
          update({ isAiLoading: true });
          const fbRes = await aiEngineApi.getFeedback(session.code, runOutput || undefined, runError || undefined, "sandbox");
          if (fbRes.data) update({ aiFeedback: fbRes.data.feedback });
        } catch {
          update({ aiFeedback: "AI feedback unavailable right now." });
        } finally {
          update({ isAiLoading: false });
        }
      }
    } catch {
      update({ executionError: "Execution service unavailable. Please try again." });
    } finally {
      update({ isExecuting: false });
    }
  };

  const tryAutoFormatOutput = (raw: string) => {
    const trimmed = raw.trim();
    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
      try {
        return JSON.parse(trimmed);
      } catch {
        return null;
      }
    }
    return null;
  };

  const extractTimeline = (raw: string) => {
    const lines = raw.split("\n").filter(Boolean);
    return lines.map((line, i) => ({
      method: i === 0 ? "main()" : `line ${i + 1}`,
      duration: `${Math.floor(Math.random() * 50 + 5)}ms`,
    }));
  };

  const handleResetCode = () => {
    reset();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      update({ code: session.code.substring(0, start) + "    " + session.code.substring(end) });
      setTimeout(() => { target.selectionStart = target.selectionEnd = start + 4; }, 0);
    }
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleRunCode();
    }
  };

  const handleTextSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) {
      const selected = sel.toString().trim();
      if (selected.length > 5 && selected.length < 500 && session.code.includes(selected)) {
        update({ highlightedCode: selected });
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        update({ explanationPosition: { top: rect.bottom + 8, left: rect.left } });
      }
    } else {
      update({ highlightedCode: "" });
    }
  }, [session.code, update]);

  const handleExplainSelected = async () => {
    if (!session.highlightedCode) return;
    update({ isExplaining: true, showExplanation: true, aiExplanation: null });
    try {
      const res = await aiEngineApi.explainHighlightedCode(session.code, session.highlightedCode);
      if (res.data) update({ aiExplanation: res.data.explanation });
    } catch {
      update({ aiExplanation: "Unable to explain right now." });
    } finally {
      update({ isExplaining: false });
    }
  };

  const handleFixError = async () => {
    if (!session.executionError) return;
    update({ isFixing: true, fixSuggestion: null });
    try {
      const res = await aiEngineApi.fixError(session.code, session.executionError);
      if (res.data) update({ fixSuggestion: { suggested_fix: res.data.suggested_fix, fixed_code: res.data.fixed_code, explanation: res.data.explanation } });
    } catch {
      update({ fixSuggestion: { suggested_fix: "Unable to generate fix.", fixed_code: session.code, explanation: "Try reviewing the error message." } });
    } finally {
      update({ isFixing: false });
    }
  };

  const handleApplyFix = () => {
    if (session.fixSuggestion?.fixed_code) {
      update({ code: session.fixSuggestion.fixed_code, fixSuggestion: null, executionError: null });
    }
  };

  const handleCodeReview = async () => {
    if (!session.reviewMode) {
      update({ reviewMode: true });
    }
    update({ isReviewing: true, reviewData: null });
    try {
      const res = await aiEngineApi.codeReview(session.code);
      if (res.data) update({ reviewData: res.data });
    } catch {
      update({ reviewData: { annotations: [], summary: "Review unavailable. Please try again.", overall_score: 0, model: "", is_error: true } });
    } finally {
      update({ isReviewing: false });
    }
  };

  const handleOpenFlashcards = () => {
    update({ showFlashcards: true });
  };

  const handleGenerateFlashcards = async () => {
    update({ isLoadingFlashcards: true });
    try {
      const res = await aiEngineApi.getFlashcards(session.code);
      if (res.data) update({ flashcards: res.data.flashcards });
    } catch {
      update({ flashcards: [] });
    } finally {
      update({ isLoadingFlashcards: false });
    }
  };

  const handleOpenTests = () => {
    update({ showTests: true });
  };

  const handleGenerateTests = async () => {
    update({ isGeneratingTests: true, testCode: null });
    try {
      const res = await aiEngineApi.generateTests(session.code, "Main");
      if (res.data) {
        update({ testCode: res.data.test_code, testExplanation: res.data.test_explanation });
      }
    } catch {
      update({ testCode: "// Unable to generate tests." });
    } finally {
      update({ isGeneratingTests: false });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background text-foreground overflow-hidden font-sans transition-colors duration-200">
      <WorkspaceTopBar
        showStdin={session.showStdin}
        reviewMode={session.reviewMode}
        showTimeline={session.showTimeline}
        code={session.code}
        isExecuting={session.isExecuting}
        onToggleStdin={() => update({ showStdin: !session.showStdin })}
        onOpenFlashcards={handleOpenFlashcards}
        onOpenTests={handleOpenTests}
        onToggleTimeline={() => update({ showTimeline: !session.showTimeline })}
        onCodeReview={handleCodeReview}
        onResetCode={handleResetCode}
        onRunCode={handleRunCode}
      />

      {session.showStdin && (
        <StdinBar
          stdinInput={session.stdinInput}
          onInputChange={(val) => update({ stdinInput: val })}
          onClear={() => update({ stdinInput: "" })}
        />
      )}

      <div className="flex flex-1 min-h-0">
        <WorkspaceEditor
          code={session.code}
          onCodeChange={(val) => update({ code: val })}
          onKeyDown={handleKeyDown}
          onTextSelection={handleTextSelection}
          showExplanation={session.showExplanation}
          highlightedCode={session.highlightedCode}
          aiExplanation={session.aiExplanation}
          isExplaining={session.isExplaining}
          explanationPosition={session.explanationPosition}
          onExplainSelected={handleExplainSelected}
          onCloseExplanation={() => update({ showExplanation: false, aiExplanation: null })}
          reviewMode={session.reviewMode}
          reviewData={session.reviewData}
        />

        <WorkspaceTabs
          activeTab={session.activeTab}
          output={session.output}
          executionError={session.executionError}
          isExecuting={session.isExecuting}
          isCompilationError={session.isCompilationError}
          aiFeedback={session.aiFeedback}
          isAiLoading={session.isAiLoading}
          reviewMode={session.reviewMode}
          reviewData={session.reviewData}
          isReviewing={session.isReviewing}
          fixSuggestion={session.fixSuggestion}
          isFixing={session.isFixing}
          structuredOutput={session.structuredOutput}
          onTabChange={(tab) => update({ activeTab: tab })}
          onStartReview={handleCodeReview}
          onRetryReview={handleCodeReview}
          onFixError={handleFixError}
          onApplyFix={handleApplyFix}
        />
      </div>

      <ExecutionTimeline timeline={session.executionTimeline} />

      <FlashcardsPanel
        show={session.showFlashcards}
        flashcards={session.flashcards}
        isLoading={session.isLoadingFlashcards}
        activeCard={session.activeFlashcard}
        onClose={() => update({ showFlashcards: false })}
        onCardSelect={(idx) => update({ activeFlashcard: idx })}
        onGenerate={handleGenerateFlashcards}
        onRegenerate={handleGenerateFlashcards}
      />

      <TestsPanel
        show={session.showTests}
        testCode={session.testCode}
        testExplanation={session.testExplanation}
        isGenerating={session.isGeneratingTests}
        onClose={() => update({ showTests: false })}
        onGenerate={handleGenerateTests}
        onCopy={() => { if (session.testCode) navigator.clipboard.writeText(session.testCode); }}
      />
    </div>
  );
}
