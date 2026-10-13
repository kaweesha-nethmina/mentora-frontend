"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  Code,
  Star,
  Terminal,
  Zap,
  Target,
  BookOpen,
  AlertCircle,
  BrainCircuit,
  Save,
  Layers,
  RefreshCw,
  Loader2,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { assessmentApi } from "@/lib/api/assessment";

export default function LaunchScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({});
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [noProfile, setNoProfile] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadProfile = async () => {
      try {
        const res = await assessmentApi.getSessions();
        const sessions = Array.isArray(res?.data) ? res.data : [];
        const latest = sessions.find(
          (s: any) => s && s.mastery_profile && Array.isArray(s.mastery_profile.knowledge_gaps) && s.mastery_profile.knowledge_gaps.length > 0
        );
        if (!latest) {
          if (mounted) setNoProfile(true);
          return;
        }
        const mp = latest.mastery_profile;
        const hasObserved = (key: string) =>
          mp.knowledge_gaps.some((gap: any) => Array.isArray(gap?.observed_error_patterns?.[key]) && gap.observed_error_patterns[key].length > 0);
        if (mounted) {
          setProfile({
            learner_id: latest.learner_id,
            data_sources: {
              github: hasObserved('github') ? 'available' : null,
              sandbox: hasObserved('sandbox') ? 'available' : null,
              quizzes: hasObserved('quizzes') ? 'available' : null,
            },
            mastery_profile: mp,
            recommendations: {
              priority_order: mp.knowledge_gaps.map((gap: any) => gap.topic),
              general_advice:
                mp.overall_mastery_score >= 70
                  ? "You're in a strong position — sharpen the identified gaps to reach full mastery."
                  : (mp.overall_mastery_score ?? 0) >= 45
                    ? "You have a partial grasp — close the prioritized gaps below to build a solid foundation."
                    : "Foundational gaps detected — the assessment will scaffold concepts step by step.",
            },
          });
        }
      } catch (error) {
        console.error('Failed to load knowledge profile:', error);
        if (mounted) setNoProfile(true);
      } finally {
        if (mounted) setIsProfileLoading(false);
      }
    };
    loadProfile();
    return () => { mounted = false; };
  }, []);

  const toggleCard = (index: number) => {
    setExpandedCards(prev => ({...prev, [index]: !prev[index]}));
  };

  const getGap = (topicName: string) =>
    profile.mastery_profile.knowledge_gaps.find((g: any) => g.topic === topicName);

  const handleStart = async () => {
    setIsStarting(true);
    try {
      const knowledge_gaps = profile.mastery_profile.knowledge_gaps.map((gap: any) => ({
        topic: gap.topic,
        topic_id: gap.topic_id,
        gap_type: gap.gap_type,
        confidence: gap.confidence,
        evidence_summary: gap.evidence_summary,
        misconceptions: gap.misconceptions,
        prerequisite_topics: gap.prerequisite_topics,
        related_topics: gap.related_topics,
        observed_error_patterns: gap.observed_error_patterns,
        suggested_intervention: gap.suggested_intervention,
      }));

      const strengths = profile.mastery_profile.strengths.map((s: any) => ({
        topic: s.topic,
        topic_id: s.topic_id,
        mastery_level: s.mastery_level,
        confidence: s.confidence,
        evidence_summary: s.evidence_summary,
        can_teach_others: s.can_teach_others,
      }));

      const response = await assessmentApi.startSession({
        mastery_profile: {
          overall_mastery_score: profile.mastery_profile.overall_mastery_score,
          knowledge_gaps,
          strengths,
        },
      });

      const sessionData = response.data || response;
      if (response.success && sessionData) {
        const sessionId = sessionData.session_id || sessionData.sessionId;
        if (sessionId) {
          localStorage.setItem('assessment_session', JSON.stringify(sessionData));
          router.push(`/assessment/session?sessionId=${sessionId}`);
          return;
        }
      }
    } catch (error) {
      console.error('Failed to start session:', error);
    }
    router.push("/assessment/session");
  };

  if (isProfileLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center animate-pulse text-teal-700 dark:text-teal-400">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="font-semibold text-foreground/80">Loading your profile insights...</p>
      </div>
    );
  }

  if (!profile || noProfile) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
        <div className="w-20 h-20 rounded-3xl bg-card/90 border border-border flex items-center justify-center mb-6">
          <BrainCircuit className="w-10 h-10 text-teal-700 dark:text-teal-400" />
        </div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-foreground mb-3">No Knowledge Profile Found Yet</h1>
        <p className="text-muted-foreground max-w-md mb-2">
          Your personalized assessment profile hasn&apos;t been generated for this learner yet.
        </p>
        <p className="text-subtle-foreground text-sm max-w-md">
          Submit a knowledge analysis profile to the{" "}
          <code className="text-teal-700 dark:text-teal-400 font-semibold">/api/ame/start-session</code> endpoint with
          this learner&apos;s token — the mastery profile and knowledge gaps will appear here.
        </p>
      </div>
    );
  }

  const totalTime = profile.mastery_profile.knowledge_gaps.reduce((acc: number, gap: any) => acc + (gap.suggested_intervention?.estimated_time_minutes || 0), 0);
  const hours = Math.floor(totalTime / 60);
  const minutes = totalTime % 60;
  const prerequisites = Array.from(new Set(profile.mastery_profile.knowledge_gaps.flatMap((gap: any) => gap.prerequisite_topics || []))) as string[];

  return (
    <div className={`space-y-8 animate-slide-up transition-all duration-1000 ${isStarting ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
      
      {/* ── WELCOME HERO (Zone 1 & 2 logic adapted) ── */}
      <div className="bg-card/90 backdrop-blur-xl border border-border rounded-3xl p-6 lg:p-10 relative overflow-hidden group">
        <div className="absolute inset-[-50%] bg-gradient-to-r from-teal-500/0 via-teal-500/5 to-teal-500/0 group-hover:rotate-180 transition-transform duration-1000 ease-linear animate-pulse" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="flex-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-700 dark:text-teal-400 text-[10px] font-bold tracking-wider uppercase mb-4">
              <Zap className="w-3 h-3" /> System Ready
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-foreground mb-3">Your Personalized Java Assessment is Ready.</h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Based on your recent learning activity, this assessment has been tailored specifically to the areas where you need the most support.
            </p>
          </div>
          
          <div className="bg-background border border-border rounded-2xl p-5 flex items-center gap-6 shrink-0">
            <div className="flex flex-col items-center">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    className="text-subtle-foreground/70"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    className={profile.mastery_profile.overall_mastery_score >= 70 ? "text-teal-700 dark:text-teal-400" : profile.mastery_profile.overall_mastery_score >= 40 ? "text-amber-700 dark:text-amber-400" : "text-red-700 dark:text-red-400"}
                    strokeWidth="3"
                    strokeDasharray={`${profile.mastery_profile.overall_mastery_score}, 100`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-2xl font-extrabold ${profile.mastery_profile.overall_mastery_score >= 70 ? "text-teal-700 dark:text-teal-400" : profile.mastery_profile.overall_mastery_score >= 40 ? "text-amber-700 dark:text-amber-400" : "text-red-700 dark:text-red-400"}`}>
                    {profile.mastery_profile.overall_mastery_score}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-foreground mb-1 uppercase tracking-wider">Current Mastery</p>
              <p className="text-xs text-muted-foreground mb-3">Before this assessment</p>
              <div className="flex gap-2">
                <div className="px-2 py-1 bg-muted rounded text-[10px] text-foreground/80 border border-border flex items-center gap-1" title="GitHub Code">
                  <Code className="w-3 h-3 text-muted-foreground" /> {profile.data_sources.github === "available" && <CheckCircle className="w-3 h-3 text-teal-700 dark:text-teal-400" />}
                </div>
                <div className="px-2 py-1 bg-muted rounded text-[10px] text-foreground/80 border border-border flex items-center gap-1" title="Coding Sandbox">
                  <Terminal className="w-3 h-3 text-muted-foreground" /> {profile.data_sources.sandbox === "available" && <CheckCircle className="w-3 h-3 text-teal-700 dark:text-teal-400" />}
                </div>
                <div className="px-2 py-1 bg-muted rounded text-[10px] text-foreground/80 border border-border flex items-center gap-1" title="Quiz Results">
                  <FileText className="w-3 h-3 text-muted-foreground" /> {profile.data_sources.quizzes === "available" && <CheckCircle className="w-3 h-3 text-teal-700 dark:text-teal-400" />}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* ── PRIMARY COLUMN (Left) ── */}
        <div className="col-span-1 lg:col-span-2 space-y-8">
          
          {/* Section A: Assessment Summary */}
          <div className="bg-surface-3/30 border border-border rounded-2xl p-6">
            <h2 className="text-xl font-bold text-foreground mb-5 flex items-center gap-2">
              <Target className="w-5 h-5 text-teal-700 dark:text-teal-400" /> What This Assessment Covers
            </h2>
            <div className="flex flex-wrap gap-3 mb-6">
              <span className="px-4 py-2 bg-muted border border-border rounded-xl text-sm font-semibold text-foreground/80">
                {profile.recommendations.priority_order.length} Topics to Master
              </span>
              <span className="px-4 py-2 bg-muted border border-border rounded-xl text-sm font-semibold text-foreground/80">
                Approx. {hours} hr {minutes} min
              </span>
              <span className="px-4 py-2 bg-[#B45309]/10 border border-[#B45309]/30 rounded-xl text-sm font-semibold text-[#B45309]">
                85% per topic target
              </span>
            </div>
            <div className="border-l-2 border-teal-500 pl-4 py-1">
              <p className="text-foreground/80 italic text-lg leading-relaxed">
                "{profile.recommendations.general_advice}"
              </p>
            </div>
          </div>
          
          {/* Section B: Topics to be Assessed */}
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">Topics You Will Be Assessed On</h2>
              <p className="text-muted-foreground text-sm">These topics were identified through your coding activity, quiz results, and submission analysis.</p>
            </div>
            
            <div className="space-y-6">
              {profile.recommendations.priority_order.map((topicName: string, index: number) => {
                const gap = getGap(topicName);
                if (!gap) return null;
                const isFundamental = gap.gap_type === 'FUNDAMENTAL_GAP';
                const confidenceColorClass = gap.confidence > 0.85 ? 'text-teal-700 dark:text-teal-400' : gap.confidence >= 0.60 ? 'text-amber-700 dark:text-amber-400' : 'text-red-700 dark:text-red-400';
                const confidenceBgClass = gap.confidence > 0.85 ? 'bg-teal-400' : gap.confidence >= 0.60 ? 'bg-amber-400' : 'bg-red-400';
                
                return (
                  <div key={index} className="bg-card/90 backdrop-blur-xl border border-border hover:border-border transition-colors rounded-2xl overflow-hidden flex flex-col relative group">
                    <div className={`absolute top-0 left-0 w-full h-1 ${isFundamental ? 'bg-red-500/50' : 'bg-amber-500/50'}`}></div>
                    
                    <div className="p-6 lg:p-8">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-lg ${isFundamental ? 'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'}`}>
                            {index + 1}
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-foreground">{topicName}</h3>
                            <div className="flex items-center gap-3 mt-1.5">
                              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${isFundamental ? 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400'}`}>
                                {isFundamental ? 'Fundamental Gap' : 'Partial Gap'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Evidence & Confidence */}
                      <p className="text-foreground/80 text-sm mb-6 leading-relaxed">
                        {gap.evidence_summary}
                      </p>
                      
                      <div className="flex items-center gap-4 mb-8">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Analysis Confidence</span>
                        <div className="flex-1 h-1.5 bg-background rounded-full overflow-hidden">
                          <div className={`h-full ${confidenceBgClass} rounded-full`} style={{ width: `${gap.confidence * 100}%` }}></div>
                        </div>
                        <span className={`text-sm font-bold ${confidenceColorClass}`}>{Math.round(gap.confidence * 100)}%</span>
                      </div>
                      
                      {/* Misconceptions */}
                      {gap.misconceptions.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-xs font-bold text-subtle-foreground uppercase tracking-wider mb-3">Identified Misconceptions</h4>
                          <div className="flex flex-wrap gap-2">
                            {gap.misconceptions.map((misc: string, i: number) => (
                              <span key={i} className="px-2.5 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-medium">
                                {misc}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Objectives */}
                      <div className="mb-6">
                        <h4 className="text-xs font-bold text-subtle-foreground uppercase tracking-wider mb-3">Learning Objectives</h4>
                        <ul className="space-y-2">
                          {gap.suggested_intervention.learning_objectives.map((obj: string, i: number) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-foreground/80">
                              <span className="text-teal-700 dark:text-teal-400 mt-0.5">•</span>
                              {obj}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Expandable Details */}
                      <div className="pt-4 border-t border-border">
                        <button 
                          onClick={() => toggleCard(index)}
                          className="flex items-center gap-1.5 text-xs font-bold text-subtle-foreground hover:text-foreground/80 transition-colors"
                        >
                          Show detailed evidence {expandedCards[index] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                        
                        {expandedCards[index] && (
                          <div className="mt-4 space-y-4 p-4 bg-background/50 rounded-xl border border-border text-sm">
                            {gap.observed_error_patterns.sandbox?.length > 0 && (
                              <div>
                                <p className="font-semibold text-foreground/80 mb-2 flex items-center gap-2"><Terminal className="w-3.5 h-3.5" /> Sandbox Observations</p>
                                <ul className="list-disc pl-5 text-muted-foreground space-y-1 text-xs">
                                  {gap.observed_error_patterns.sandbox.map((err: string, i: number) => <li key={i}>{err}</li>)}
                                </ul>
                              </div>
                            )}
                            {gap.observed_error_patterns.quizzes?.length > 0 && (
                              <div>
                                <p className="font-semibold text-foreground/80 mb-2 flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> Quiz Observations</p>
                                <ul className="list-disc pl-5 text-muted-foreground space-y-1 text-xs">
                                  {gap.observed_error_patterns.quizzes.map((err: string, i: number) => <li key={i}>{err}</li>)}
                                </ul>
                              </div>
                            )}
                            {gap.observed_error_patterns.github?.length > 0 && profile.data_sources.github === "available" && (
                              <div>
                                <p className="font-semibold text-foreground/80 mb-2 flex items-center gap-2"><Code className="w-3.5 h-3.5" /> GitHub Observations</p>
                                <ul className="list-disc pl-5 text-muted-foreground space-y-1 text-xs">
                                  {gap.observed_error_patterns.github.map((err: string, i: number) => <li key={i}>{err}</li>)}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Footer Strip */}
                    <div className="bg-background/80 border-t border-border px-6 lg:px-8 py-3 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-subtle-foreground uppercase tracking-wider mt-auto">
                      <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> L{isFundamental ? '1 (Remembering)' : '3 (Applying)'}</span>
                      <span className="flex items-center gap-1.5"><BrainCircuit className="w-3.5 h-3.5" /> {gap.suggested_intervention.primary}</span>
                      <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {gap.suggested_intervention.estimated_time_minutes} min</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Section C: Strengths */}
          {profile.mastery_profile.strengths.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4">Your Strengths</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.mastery_profile.strengths.map((strength: any, i: number) => (
                  <div key={i} className="bg-surface-3/30 border border-border rounded-2xl p-5 flex flex-col relative overflow-hidden group hover:bg-surface-3 transition-colors">
                    <div className="absolute top-0 left-0 w-1 h-full bg-teal-500"></div>
                    <div className="flex justify-between items-start mb-3 pl-2">
                      <h4 className="text-foreground font-bold">{strength.topic || strength.topic_name}</h4>
                      <span className="px-2 py-1 bg-teal-500/10 border border-teal-500/30 text-teal-700 dark:text-teal-400 text-[10px] font-bold rounded uppercase tracking-wider">
                        {strength.mastery_level}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground italic mb-4 pl-2 line-clamp-2">"{strength.evidence_summary}"</p>
                    <div className="flex items-center gap-3 mt-auto pl-2">
                      <div className="flex-1 h-1 bg-background rounded-full overflow-hidden">
                        <div className="h-full bg-teal-500 rounded-full" style={{ width: `${strength.confidence * 100}%` }}></div>
                      </div>
                      {strength.can_teach_others && (
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-400" /> Mentor
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* ── SECONDARY COLUMN (Right) ── */}
        <div className="col-span-1 space-y-6">
          
          {/* Section D: Assessment Roadmap */}
          <div className="bg-surface-3/30 border border-border rounded-2xl p-6 hover:bg-surface-3 transition-colors">
            <h3 className="text-lg font-bold text-foreground mb-6">Assessment Roadmap</h3>
            
            <div className="relative border-l border-border ml-3 space-y-6 pb-2">
              {profile.recommendations.priority_order.map((topicName: string, i: number) => {
                const gap = getGap(topicName);
                if (!gap) return null;
                const isFirst = i === 0;
                return (
                  <div key={i} className="relative pl-6">
                    <div className={`absolute -left-[9px] top-0.5 w-4 h-4 rounded-full border-2 border-border ${isFirst ? 'bg-teal-400 ' : 'bg-border-strong'}`}></div>
                    <div className={isFirst ? "opacity-100" : "opacity-50"}>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-bold text-sm ${isFirst ? 'text-teal-700 dark:text-teal-400' : 'text-foreground'}`}>{topicName}</h4>
                        {isFirst && <span className="px-1.5 py-0.5 bg-teal-500/10 text-teal-700 dark:text-teal-400 text-[8px] font-bold uppercase rounded border border-teal-500/20">Start</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <p>{gap.gap_type === 'FUNDAMENTAL_GAP' ? 'Starts L1' : 'Starts L3'} • ~{gap.suggested_intervention.estimated_time_minutes}m</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Section E: How It Works */}
          <div className="bg-card/90 backdrop-blur-xl border border-border rounded-2xl p-6">
            <h3 className="text-lg font-bold text-foreground mb-5 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-700 dark:text-teal-400" /> How It Works
            </h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3 text-foreground/80">
                <BrainCircuit className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0 mt-0.5" />
                <span>Questions adapt dynamically. Answer correctly to reach higher Bloom's levels.</span>
              </li>
              <li className="flex items-start gap-3 text-foreground/80">
                <Target className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0 mt-0.5" />
                <span>Score 85% per topic to advance. Max 10 questions per topic.</span>
              </li>
              <li className="flex items-start gap-3 text-foreground/80">
                <RefreshCw className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
                <span>Struggling? The system auto-activates scaffolded support mode.</span>
              </li>
            </ul>
          </div>

          {/* Section F: Prerequisite Topics */}
          <div className="bg-surface-3/20 border border-border rounded-2xl p-6">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4" /> Prerequisites
            </h3>
            <div className="flex flex-wrap gap-2">
              {prerequisites.map((prereq: string, i: number) => (
                <span key={i} className="px-2.5 py-1 bg-background/50 border border-border text-muted-foreground text-xs font-medium rounded-lg">
                  {prereq}
                </span>
              ))}
            </div>
          </div>
          
        </div>
      </div>
      
      {/* ── ZONE 5: LAUNCH FOOTER ── */}
      <div className="bg-card/90 backdrop-blur-xl border border-teal-500/20 rounded-3xl p-6 lg:p-10 flex flex-col md:flex-row items-center justify-between gap-8 mt-8 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-900/20 to-transparent pointer-events-none" />
        
        <div className="w-full md:w-1/2 space-y-3 relative z-10">
          <h3 className="text-xl font-bold text-foreground mb-4">Pre-flight Checklist</h3>
          <div className="flex items-center gap-3 text-sm text-foreground/80">
            <CheckCircle className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0" />
            <span>Profile loaded completely</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-foreground/80">
            <CheckCircle className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0" />
            <span>Questions personalized to {profile.mastery_profile.knowledge_gaps.flatMap((g: any) => g.misconceptions || []).length} specific misconceptions</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-foreground/80">
            <CheckCircle className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0" />
            <span>GitHub, Sandbox, and Quiz parameters synced</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-foreground/80">
            <CheckCircle className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0" />
            <span>Session saves automatically after every answer</span>
          </div>
        </div>
        
        <div className="w-full md:w-1/2 flex justify-end relative z-10">
          {isStarting ? (
            <div className="bg-background border border-teal-500/30 rounded-2xl p-6 w-full text-center">
              <Loader2 className="w-8 h-8 text-teal-700 dark:text-teal-400 animate-spin mx-auto mb-3" />
              <h3 className="text-lg font-bold text-foreground mb-1">Generating first question...</h3>
              <p className="text-xs text-muted-foreground">Calling AI workflows, please wait.</p>
            </div>
          ) : (
            <button 
              onClick={handleStart}
              className="w-full bg-primary hover:bg-primary-hover text-primary-foreground rounded-2xl p-6 lg:p-8 text-left transition-all group/btn relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-surface-3 to-transparent -translate-x-[100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000" />
              <h2 className="text-2xl lg:text-3xl font-extrabold mb-2 flex items-center justify-between relative z-10">
                Begin Assessment
                <ArrowRight className="w-6 h-6 opacity-80 group-hover/btn:opacity-100 group-hover/btn:translate-x-2 transition-all" />
              </h2>
              <p className="text-foreground/80 text-sm font-semibold relative z-10">
                Start: {profile.recommendations.priority_order[0]}
              </p>
            </button>
          )}
        </div>
      </div>
      
    </div>
  );
}