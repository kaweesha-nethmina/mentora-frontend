'use client';

import { Brain, Search, ClipboardList, MessageSquare, Code2, Lightbulb } from 'lucide-react';

const stages = [
  {
    title: 'Student Analysis',
    description: 'Analyze learning data to identify knowledge gaps and weak subskills.',
    icon: Brain,
    color: 'text-teal-700 dark:text-teal-400',
    bg: 'bg-teal-500/10',
    border: 'border-teal-500/20',
    iconBg: 'bg-teal-500/15',
  },
  {
    title: 'Peer Matching',
    description: 'Find the most suitable peer based on the learner\'s knowledge gap and weak subskills.',
    icon: Search,
    color: 'text-cyan-700 dark:text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    iconBg: 'bg-cyan-500/15',
  },
  {
    title: 'Question Generation',
    description: 'Generate targeted questions that address the learner\'s specific gaps.',
    icon: ClipboardList,
    color: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    iconBg: 'bg-amber-500/15',
  },
  {
    title: 'Collaborative Workspace',
    description: 'Collaborate in real-time to discuss, solve, and learn together.',
    icon: MessageSquare,
    color: 'text-violet-700 dark:text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    iconBg: 'bg-violet-500/15',
  },
  {
    title: 'Code Evaluation',
    description: 'Evaluate submitted code and provide constructive feedback.',
    icon: Code2,
    color: 'text-emerald-700 dark:text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    iconBg: 'bg-emerald-500/15',
  },
  {
    title: 'Learning Recommendation',
    description: 'Recommend personalized learning content to improve remaining weak areas.',
    icon: Lightbulb,
    color: 'text-orange-700 dark:text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    iconBg: 'bg-orange-500/15',
  },
];

interface AgentWorkflowProps {
  currentStage: number;
}

export default function AgentWorkflow({ currentStage: _currentStage }: AgentWorkflowProps) {
  const row1 = stages.slice(0, 3);
  const row2 = stages.slice(3, 6);

  const renderCard = (stage: typeof stages[0], i: number) => {
    const Icon = stage.icon;
    return (
      <div
        key={i}
        className={`relative flex-1 min-w-0 rounded-2xl border ${stage.border} ${stage.bg} p-5 transition-all hover:shadow-raised`}
      >
        {/* Step number */}
        <div className={`absolute top-4 left-4 w-7 h-7 rounded-lg ${stage.iconBg} flex items-center justify-center`}>
          <span className={`text-xs font-extrabold ${stage.color}`}>{i + 1}</span>
        </div>

        {/* Icon */}
        <div className="flex justify-center mt-4 mb-3">
          <div className={`w-14 h-14 rounded-2xl ${stage.iconBg} border ${stage.border} flex items-center justify-center`}>
            <Icon className={`w-7 h-7 ${stage.color}`} />
          </div>
        </div>

        {/* Title */}
        <p className={`text-sm font-bold text-foreground text-center mb-1.5`}>{stage.title}</p>

        {/* Description */}
        <p className="text-xs text-muted-foreground text-center leading-relaxed">{stage.description}</p>
      </div>
    );
  };

  const renderVerticalConnector = () => (
    <div className="hidden md:flex h-10 items-center justify-center">
      <div className="h-full w-px border-l-2 border-dashed border-border" />
    </div>
  );

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="mb-5">
        <h3 className="text-xl font-extrabold text-foreground mb-1">Peer Learning Workflow</h3>
        <p className="text-sm text-subtle-foreground leading-relaxed">
          A structured journey that turns peer interaction into meaningful learning outcomes.
        </p>
      </div>

      {/* Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_32px_minmax(0,1fr)_32px_minmax(0,1fr)] gap-y-4 items-stretch">
        {row1.map((stage, i) => (
          <div key={i} className={i < 2 ? 'contents' : 'contents'}>
            {renderCard(stage, i)}
            {i < 2 && (
              <div className="hidden md:flex items-center justify-center">
                <div className="w-full h-px border-t-2 border-dashed border-border" />
                <div className="w-0 h-0 border-t-[5px] border-b-[5px] border-l-[7px] border-t-transparent border-b-transparent border-l-border shrink-0" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Connector from row 1 to row 2 */}
      {renderVerticalConnector()}

      {/* Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_32px_minmax(0,1fr)_32px_minmax(0,1fr)] gap-y-4 items-stretch">
        {row2.map((stage, i) => (
          <div key={i + 3} className="contents">
            {renderCard(stage, i + 3)}
            {i < 2 && (
              <div className="hidden md:flex items-center justify-center">
                <div className="w-full h-px border-t-2 border-dashed border-border" />
                <div className="w-0 h-0 border-t-[5px] border-b-[5px] border-l-[7px] border-t-transparent border-b-transparent border-l-border shrink-0" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
