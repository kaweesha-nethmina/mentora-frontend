"use client";

import { Layers, Loader2, X } from "lucide-react";
import type { Flashcard } from "@/lib/api/aiEngine";

interface FlashcardsPanelProps {
  show: boolean;
  flashcards: Flashcard[];
  isLoading: boolean;
  activeCard: number;
  onClose: () => void;
  onCardSelect: (index: number) => void;
  onGenerate: () => void;
  onRegenerate: () => void;
}

export default function FlashcardsPanel({
  show, flashcards, isLoading, activeCard,
  onClose, onCardSelect, onGenerate, onRegenerate,
}: FlashcardsPanelProps) {
  if (!show) return null;

  const hasData = flashcards.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-96 h-full bg-card border-l border-border animate-slide-up flex flex-col transition-colors duration-200 shadow-overlay">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <h2 className="text-sm font-bold text-foreground">Concept Flashcards</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground/80 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-teal-600 dark:text-teal-400/60 justify-center py-12"><Loader2 className="w-4 h-4 animate-spin" /> Generating flashcards...</div>
          ) : hasData ? (
            <div className="space-y-3">
              {flashcards.map((card, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    i === activeCard
                      ? "bg-teal-500/10 border-teal-500/30"
                      : "bg-muted/40 border-border hover:border-teal-500/30"
                  }`}
                  onClick={() => onCardSelect(i)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-foreground">{card.concept}</h3>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      card.difficulty === "beginner" ? "bg-green-500/20 text-green-600 dark:text-green-400" : card.difficulty === "intermediate" ? "bg-amber-500/20 text-amber-600 dark:text-amber-400" : "bg-red-500/20 text-red-600 dark:text-red-400"
                    }`}>{card.difficulty}</span>
                  </div>
                  {i === activeCard && (
                    <div className="space-y-2 animate-fade-in">
                      <p className="text-xs text-muted-foreground">{card.definition}</p>
                      <pre className="text-[10px] font-mono text-slate-900 dark:text-teal-200 bg-sunken p-2 rounded-lg whitespace-pre-wrap border border-border">{card.example}</pre>
                    </div>
                  )}
                </div>
              ))}
              <button onClick={onRegenerate} className="w-full py-2 bg-teal-600/20 border border-teal-500/30 text-teal-700 dark:text-teal-400 text-xs font-bold rounded-lg hover:bg-teal-600/30 transition-colors flex items-center justify-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> Regenerate Flashcards
              </button>
            </div>
          ) : (
            <div className="text-center py-12">
              <Layers className="w-8 h-8 text-subtle-foreground/70 mx-auto mb-3" />
              <p className="text-sm text-foreground/80 mb-1">AI-generated concept flashcards</p>
              <p className="text-xs text-muted-foreground mb-4">Key concepts extracted from your code</p>
              <button onClick={onGenerate} className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold rounded-xl transition-all shadow-raised ">
                Generate Flashcards
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
