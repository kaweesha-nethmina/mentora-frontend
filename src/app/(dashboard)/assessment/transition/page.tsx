"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Target,
  BarChart3,
  BrainCircuit,
  Layers,
  TrendingUp,
  Sparkles,
  Star,
} from "lucide-react";

interface TransitionData {
  completedTopic: {
    name: string;
    finalMastery: number;
    mastered: boolean;
    questionsAnswered: number;
    accuracy: number;
    bloomLevels: number[];
  };
  nextTopic: {
    name: string;
    gap_type: "FUNDAMENTAL_GAP" | "PARTIAL_GAP";
    startingDifficulty: "Easy" | "Medium" | "Hard";
  };
  sessionId: string;
  learnerId: string;
}

const DEFAULT_DATA: TransitionData = {
  completedTopic: {
    name: "Completed Topic",
    finalMastery: 0,
    mastered: true,
    questionsAnswered: 0,
    accuracy: 0,
    bloomLevels: [1],
  },
  nextTopic: {
    name: "Next Topic",
    gap_type: "PARTIAL_GAP",
    startingDifficulty: "Easy",
  },
  sessionId: "",
  learnerId: "",
};

const getMasteryMeta = (mastery: number) => {
  if (mastery >= 85) return { ring: "stroke-emerald-400", text: "text-emerald-700 dark:text-emerald-400", label: "Mastered", bar: "bg-emerald-500" };
  if (mastery >= 60) return { ring: "stroke-blue-400", text: "text-blue-700 dark:text-blue-400", label: "Proficient", bar: "bg-blue-500" };
  if (mastery >= 40) return { ring: "stroke-amber-400", text: "text-amber-700 dark:text-amber-400", label: "Developing", bar: "bg-amber-500" };
  return { ring: "stroke-red-400", text: "text-red-700 dark:text-red-400", label: "Needs Work", bar: "bg-red-500" };
};

const getDifficultyBadge = (d: string) => {
  switch (d) {
    case "Easy": return { color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30", dot: "bg-emerald-400" };
    case "Medium": return { color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30", dot: "bg-amber-400" };
    case "Hard": return { color: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30", dot: "bg-red-400" };
    default: return { color: "bg-muted text-muted-foreground border-border", dot: "bg-white/30" };
  }
};

export default function TransitionPage() {
  const router = useRouter();
  const [data, setData] = useState<TransitionData | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("assessment_transition");
    if (stored) {
      try {
        setData(JSON.parse(stored));
        return;
      } catch {}
    }
    setData(DEFAULT_DATA);
  }, []);

  const handleContinue = () => {
    setStarting(true);
    const stored = localStorage.getItem("assessment_transition");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.sessionId) {
          router.push(`/assessment/session?sessionId=${parsed.sessionId}`);
          return;
        }
      } catch {}
    }
    router.push("/assessment/session");
  };

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-teal-700 dark:text-teal-400 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">Preparing transition...</p>
        </div>
      </div>
    );
  }

  const masteryMeta = getMasteryMeta(data.completedTopic.finalMastery);
  const diffMeta = getDifficultyBadge(data.nextTopic.startingDifficulty);

  return (
    <div className="min-h-screen bg-background">
      {/* Subtle gradient header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-teal-500/[0.04] to-transparent pointer-events-none" />

        <div className="max-w-3xl mx-auto px-6 pt-12 pb-6">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-700 dark:text-teal-400 text-[10px] font-bold tracking-wider uppercase mb-1">
              <Sparkles className="w-3 h-3" /> Topic Complete
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-foreground">Great Progress!</h1>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-background border border-border rounded-lg">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                <span className="text-[10px] font-semibold text-subtle-foreground uppercase">Student</span>
                <span className="text-xs font-mono text-foreground/80 font-bold">{data.learnerId}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-background border border-border rounded-lg">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span className="text-[10px] font-semibold text-subtle-foreground uppercase">Session</span>
                <span className="text-xs font-mono text-foreground/80 font-bold">{data.sessionId}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 pb-12 space-y-6">

        {/* ── COMPLETED TOPIC CARD ── */}
        <div className="bg-card/90 backdrop-blur-xl border border-border rounded-2xl overflow-hidden">
          {/* Accent bar */}
          <div className={`h-1 w-full ${data.completedTopic.mastered ? "bg-emerald-500/50" : "bg-teal-500/50"}`} />

          <div className="p-6 lg:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2 rounded-xl ${data.completedTopic.mastered ? "bg-emerald-500/10" : "bg-teal-500/10"}`}>
                <CheckCircle2 className={`w-5 h-5 ${data.completedTopic.mastered ? "text-emerald-700 dark:text-emerald-400" : "text-teal-700 dark:text-teal-400"}`} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">{data.completedTopic.name}</h2>
                <p className="text-xs text-subtle-foreground">Completed Topic</p>
              </div>
              <span className={`ml-auto px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                data.completedTopic.mastered
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                  : "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/30"
              }`}>
                {data.completedTopic.mastered ? "Mastered" : "Complete"}
              </span>
            </div>

            {/* Mastery Ring + Stats */}
            <div className="flex flex-col sm:flex-row items-center gap-8 mb-6">
              <div className="relative w-28 h-28 shrink-0">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="currentColor" strokeWidth="3"
                    className="text-subtle-foreground/70"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="currentColor" strokeWidth="3.5"
                    strokeDasharray={`${data.completedTopic.finalMastery}, 100`}
                    className={masteryMeta.ring}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-2xl font-extrabold ${masteryMeta.text}`}>{data.completedTopic.finalMastery}</span>
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${masteryMeta.text}`}>{masteryMeta.label}</span>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-2 gap-4 w-full">
                <div className="bg-background rounded-xl p-4 border border-border text-center">
                  <BarChart3 className="w-4 h-4 text-subtle-foreground mx-auto mb-1.5" />
                  <p className="text-xl font-extrabold text-foreground">{data.completedTopic.questionsAnswered}</p>
                  <p className="text-[9px] text-subtle-foreground uppercase tracking-wider font-semibold">Questions</p>
                </div>
                <div className="bg-background rounded-xl p-4 border border-border text-center">
                  <Target className="w-4 h-4 text-subtle-foreground mx-auto mb-1.5" />
                  <p className={`text-xl font-extrabold ${masteryMeta.text}`}>{data.completedTopic.accuracy}%</p>
                  <p className="text-[9px] text-subtle-foreground uppercase tracking-wider font-semibold">Accuracy</p>
                </div>
              </div>
            </div>

            {/* Bloom's Levels */}
            <div className="bg-background rounded-xl p-4 border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-indigo-700 dark:text-indigo-400" />
                  <span className="text-xs font-semibold text-subtle-foreground">Bloom&apos;s Levels Covered</span>
                </div>
                <div className="flex gap-1.5">
                  {data.completedTopic.bloomLevels.map((l) => (
                    <span key={l} className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded text-[10px] font-bold">
                      L{l}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── ACHIEVEMENT BANNER ── */}
        {data.completedTopic.mastered && (
          <div className="bg-gradient-to-r from-emerald-500/[0.06] to-transparent border border-emerald-500/20 rounded-2xl p-6 flex items-center gap-4">
            <div className="p-2 rounded-full bg-emerald-500/10">
              <Trophy className="w-6 h-6 text-emerald-700 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-foreground font-bold text-base">Topic Mastered!</h3>
              <p className="text-emerald-800 dark:text-emerald-200/70 text-sm">
                You demonstrated strong understanding of {data.completedTopic.name}.
              </p>
            </div>
          </div>
        )}

        {/* ── NEXT TOPIC CARD ── */}
        <div className="bg-card/90 backdrop-blur-xl border border-border rounded-2xl overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-teal-500/50 to-blue-500/50" />

          <div className="p-6 lg:p-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-xl bg-teal-500/10">
                <ArrowRight className="w-5 h-5 text-teal-700 dark:text-teal-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Next Topic</h2>
                <p className="text-xs text-subtle-foreground">Ready to begin</p>
              </div>
            </div>

            <div className="bg-background rounded-xl p-5 border border-border mb-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-teal-500/10">
                    <Star className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">{data.nextTopic.name}</h3>
                </div>
                <div className="flex gap-2">
                  <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-semibold ${
                    data.nextTopic.gap_type === "FUNDAMENTAL_GAP"
                      ? "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30"
                      : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
                  }`}>
                    {data.nextTopic.gap_type === "FUNDAMENTAL_GAP" ? "Fundamental Gap" : "Partial Gap"}
                  </span>
                  <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-semibold ${diffMeta.color}`}>
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${diffMeta.dot} mr-1`} />
                    {data.nextTopic.startingDifficulty}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-subtle-foreground">
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span>
                Questions will adapt based on your responses, starting at {data.nextTopic.startingDifficulty} difficulty.
              </span>
            </div>
          </div>
        </div>

        {/* ── PROGRESS OVERVIEW ── */}
        <div className="bg-card/90 backdrop-blur-xl border border-border rounded-2xl p-6 lg:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-blue-500/10">
              <TrendingUp className="w-5 h-5 text-blue-700 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Session Progress</h2>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Questions Answered", value: data.completedTopic.questionsAnswered, color: "text-foreground" },
              { label: "Overall Accuracy", value: `${data.completedTopic.accuracy}%`, color: masteryMeta.text },
              { label: "Topics Completed", value: "1 of 2", color: "text-foreground" },
            ].map((stat) => (
              <div key={stat.label} className="bg-background rounded-xl p-4 border border-border text-center">
                <p className={`text-xl lg:text-2xl font-extrabold ${stat.color}`}>{stat.value}</p>
                <p className="text-[9px] text-subtle-foreground uppercase tracking-wider font-semibold mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── ACTION BUTTON ── */}
        <div className="text-center pt-2">
          <Button
            onClick={handleContinue}
            disabled={starting}
            className="bg-primary hover:bg-primary-hover text-primary-foreground h-14 px-12 text-base font-bold rounded-xl disabled:opacity-50 shadow-raised hover:shadow-raised transition-all"
          >
            {starting ? (
              <div className="flex items-center gap-2.5">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading next topic...</span>
              </div>
            ) : (
              <span className="flex items-center gap-2.5">
                Continue to {data.nextTopic.name}
                <ArrowRight className="w-5 h-5" />
              </span>
            )}
          </Button>
        </div>

      </div>
    </div>
  );
}
