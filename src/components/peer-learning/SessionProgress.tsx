'use client';

const stages = [
  'Peer Matched',
  'Question Generated',
  'Collaboration',
  'Evaluation',
  'Summary',
  'Recommendation',
];

interface SessionProgressProps {
  currentStage: number;
}

export default function SessionProgress({ currentStage }: SessionProgressProps) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {stages.map((stage, i) => {
        const isCompleted = i < currentStage;
        const isCurrent = i === currentStage;

        return (
          <div key={i} className="flex items-center gap-1 shrink-0">
            <div className="flex items-center gap-1.5">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                  isCompleted
                    ? 'bg-teal-500/20 text-teal-700 dark:text-teal-400 border border-teal-500/30'
                    : isCurrent
                      ? 'bg-primary text-primary-foreground border border-teal-400'
                      : 'bg-muted text-subtle-foreground border border-border'
                }`}
              >
                {isCompleted ? '✓' : i + 1}
              </div>
              <span
                className={`text-[11px] font-medium whitespace-nowrap ${
                  isCurrent ? 'text-foreground' : isCompleted ? 'text-teal-700 dark:text-teal-400/80' : 'text-subtle-foreground'
                }`}
              >
                {stage}
              </span>
            </div>
            {i < stages.length - 1 && (
              <div
                className={`w-6 h-px mx-1 ${
                  isCompleted ? 'bg-teal-500/40' : 'bg-surface-3'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
