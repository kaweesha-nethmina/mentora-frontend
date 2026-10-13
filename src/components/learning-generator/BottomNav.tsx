"use client";

import { Loader2, ChevronRight } from "lucide-react";

interface BottomNavProps {
  activeStep: number;
  steps: Array<{ id: string; title: string; type: string }>;
  savingProgress: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

export default function BottomNav({
  activeStep,
  steps,
  savingProgress,
  onPrevious,
  onNext,
}: BottomNavProps) {
  return (
    <div className="h-20 bg-[var(--lmg-bg-surface)] border-t border-[var(--lmg-border)] flex items-center justify-between px-6 lg:px-10 shrink-0 z-20 transition-colors duration-200">
      <button
        onClick={onPrevious}
        disabled={activeStep === 0}
        className="px-5 py-2.5 text-[var(--lmg-text-muted)] font-semibold hover:text-[var(--lmg-text-primary)] disabled:opacity-30 transition-colors"
      >
        Previous
      </button>

      {activeStep < steps.length - 1 && (
        <button
          onClick={onNext}
          disabled={savingProgress}
          className="px-8 py-3 bg-primary hover:bg-primary-hover disabled:bg-teal-800 disabled:opacity-50 text-primary-foreground font-bold rounded-xl transition-all flex items-center gap-2 group"
        >
          {savingProgress ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Next Concept <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      )}
    </div>
  );
}
