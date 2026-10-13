"use client";

import { TestTube, Loader2, X, Copy } from "lucide-react";

interface TestsPanelProps {
  show: boolean;
  testCode: string | null;
  testExplanation: string | null;
  isGenerating: boolean;
  onClose: () => void;
  onGenerate: () => void;
  onCopy: () => void;
}

export default function TestsPanel({
  show, testCode, testExplanation, isGenerating,
  onClose, onGenerate, onCopy,
}: TestsPanelProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-112.5 h-full bg-card border-l border-border animate-slide-up flex flex-col transition-colors duration-200 shadow-overlay">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <TestTube className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <h2 className="text-sm font-bold text-foreground">JUnit Test Generator</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground/80 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
          {isGenerating ? (
            <div className="flex items-center gap-2 text-sm text-teal-600 dark:text-teal-400/60 justify-center py-12"><Loader2 className="w-4 h-4 animate-spin" /> Generating tests...</div>
          ) : testCode ? (
            <div className="space-y-3">
              {testExplanation && <p className="text-xs text-muted-foreground">{testExplanation}</p>}
              <div className="relative">
                <pre className="text-xs font-mono text-slate-900 dark:text-teal-200 bg-sunken p-4 rounded-xl border border-border whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">{testCode}</pre>
                <button
                  onClick={onCopy}
                  className="absolute top-2 right-2 p-1.5 bg-card hover:bg-surface-3 border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors shadow-xs"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <TestTube className="w-8 h-8 text-subtle-foreground/70 mx-auto mb-3" />
              <button onClick={onGenerate} className="px-4 py-2 bg-teal-600/20 border border-teal-500/30 text-teal-700 dark:text-teal-400 text-xs font-bold rounded-lg hover:bg-teal-600/30">
                Generate JUnit Tests
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
