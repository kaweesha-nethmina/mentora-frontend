'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, AlertTriangle, Brain, Zap, Code } from 'lucide-react';
import type { StudentAnalysisDocument } from '@/lib/api/peerLearning';
import type { User as AuthUser } from '@/lib/api/auth';

interface StudentProfileCardProps {
  analysis: StudentAnalysisDocument | null;
  loading: boolean;
  user?: AuthUser | null;
}

function CircularScore({ value, label, color }: { value: number; label: string; color: string }) {
  const radius = 36;
  const stroke = 5;
  const normalizedRadius = radius - stroke;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-[72px] h-[72px]">
        <svg height={radius * 2} width={radius * 2} className="-rotate-90">
          <circle
            stroke="rgba(255,255,255,0.06)"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke={color}
            fill="transparent"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.6s ease' }}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-extrabold text-foreground">{value}%</span>
        </div>
      </div>
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
    </div>
  );
}

export default function StudentProfileCard({ analysis, loading, user }: StudentProfileCardProps) {
  if (loading) {
    return (
      <Card className="bg-card/60 border-border">
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-3">
            <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-muted-foreground text-sm">Loading your learning profile...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card className="bg-card/60 border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
              <User className="w-5 h-5 text-teal-700 dark:text-teal-400" />
            </div>
            <div>
              <CardTitle className="text-foreground text-lg">Student Learning Profile</CardTitle>
              <p className="text-subtle-foreground text-xs mt-0.5">Your logged-in account information</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="rounded-xl bg-background border border-border p-3">
              <p className="text-[10px] font-bold tracking-wider text-subtle-foreground uppercase mb-1">Student Name</p>
              <p className="text-foreground font-semibold text-sm">{user?.name || 'N/A'}</p>
            </div>
            <div className="rounded-xl bg-background border border-border p-3">
              <p className="text-[10px] font-bold tracking-wider text-subtle-foreground uppercase mb-1">Student ID</p>
              <p className="text-foreground font-semibold text-sm">{user?.student_id || user?._id || 'N/A'}</p>
            </div>
            <div className="rounded-xl bg-background border border-border p-3">
              <p className="text-[10px] font-bold tracking-wider text-subtle-foreground uppercase mb-1">Email</p>
              <p className="text-foreground font-semibold text-sm truncate">{user?.email || 'N/A'}</p>
            </div>
            <div className="rounded-xl bg-background border border-border p-3">
              <p className="text-[10px] font-bold tracking-wider text-subtle-foreground uppercase mb-1">Status</p>
              <p className="text-amber-700 dark:text-amber-400 font-semibold text-sm">Awaiting Analysis</p>
            </div>
          </div>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-center gap-3">
            <Brain className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">No Learning Analysis Found</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Complete a diagnostic quiz or import your learning data to get started with peer matching.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const mastery = analysis.mastery_profile;
  const knowledgeGaps = mastery.knowledge_gaps;

  return (
    <Card className="bg-card/60 border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
              <User className="w-7 h-7 text-teal-700 dark:text-teal-400" />
            </div>
            <div>
              <CardTitle className="text-foreground text-2xl font-extrabold">Student Learning Profile</CardTitle>
              <p className="text-subtle-foreground text-sm mt-1">Your knowledge gaps and weak subskills</p>
            </div>
          </div>
          <Badge className="bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20 text-sm px-3 py-1.5">
            {analysis.student_id}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-4">
        {knowledgeGaps.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-700 dark:text-amber-400" />
              <p className="text-sm font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                Knowledge Gaps ({knowledgeGaps.length})
              </p>
            </div>

            <div className="space-y-4">
              {knowledgeGaps.map((gap, gapIdx) => (
                <div
                  key={gapIdx}
                  className="rounded-2xl border border-border bg-background/70 overflow-hidden"
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Left side — Topic info, weak subskills, misconceptions */}
                    <div className="flex-1 p-7 space-y-5">
                      {/* Topic header */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                          <Code className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                        </div>
                        <p className="text-foreground font-bold text-base">{gap.topic}</p>
                      </div>

                      {/* Weak subskills + Misconceptions side by side */}
                      <div className="flex flex-col sm:flex-row gap-6">
                        {/* Weak Subskills */}
                        {gap.weak_subskills.length > 0 && (
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider mb-3">
                              Weak Subskills
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {gap.weak_subskills.map((ws, wsIdx) => (
                                <span
                                  key={wsIdx}
                                  className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300 rounded-lg text-sm font-medium"
                                >
                                  {ws.subskill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Separator */}
                        {gap.weak_subskills.length > 0 && gap.misconceptions.length > 0 && (
                          <div className="hidden sm:block w-px bg-surface-3 shrink-0" />
                        )}

                        {/* Misconceptions */}
                        {gap.misconceptions.length > 0 && (
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-3">
                              Misconceptions
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {gap.misconceptions.map((m, mIdx) => (
                                <span
                                  key={mIdx}
                                  className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/15 text-amber-700 dark:text-amber-300/80 rounded-lg text-sm font-medium"
                                >
                                  {m}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Vertical separator */}
                    <div className="hidden md:block w-px bg-surface-3 my-6" />

                    {/* Horizontal separator on mobile */}
                    <div className="md:hidden mx-7 h-px bg-surface-3" />

                    {/* Right side — Performance metrics */}
                    <div className="flex items-center justify-center gap-10 px-8 py-6 md:w-[260px] shrink-0">
                      <CircularScore
                        value={gap.mastery_score}
                        label="Mastery"
                        color="#f59e0b"
                      />
                      <CircularScore
                        value={Math.round(gap.confidence * 100)}
                        label="Confidence"
                        color="#34c98a"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-muted p-6">
            <p className="text-base text-subtle-foreground">No knowledge gaps detected. Great job!</p>
          </div>
        )}

        {mastery.strengths.length > 0 && (
          <div className="rounded-2xl border border-border bg-muted p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <Zap className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Strengths</p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {mastery.strengths.map((s, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-lg text-sm font-medium"
                >
                  {s.topic} ({s.mastery_score}%)
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
