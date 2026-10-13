'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Sparkles, ListChecks, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { peerLearningApi, type StudentAnalysisDocument } from '@/lib/api/peerLearning';
import type { PeerSessionData } from '@/components/peer-learning/PeerMatchSection';
import StudentProfileCard from '@/components/peer-learning/StudentProfileCard';
import AgentWorkflow from '@/components/peer-learning/AgentWorkflow';
import PeerMatchSection from '@/components/peer-learning/PeerMatchSection';
import AiAssistantSection from '@/components/peer-learning/AiAssistantSection';

export default function PeerLearningHome() {
  const { user } = useAuth();
  const router = useRouter();
  const [analysis, setAnalysis] = useState<StudentAnalysisDocument | null>(null);
  const [loading, setLoading] = useState(true);

  const studentId = user?.student_id || user?._id || '';

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }

    const fetchAnalysis = async () => {
      try {
        const res = await peerLearningApi.getStudentAnalysis(studentId);
        if (res.success && res.data?.analysis) {
          setAnalysis(res.data.analysis);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [studentId]);

  const handleStartSession = useCallback(
    (data: PeerSessionData) => {
      const params = new URLSearchParams({
        roomId: data.roomId,
        peerId: data.peerId,
        peerName: data.peerName,
        topic: data.topic,
        knowledgeGap: data.knowledgeGap,
        weakSubskill: data.weakSubskill,
        ai: data.isAiSession ? '1' : '0',
      });
      router.push(`/peer-learning/pair-session?${params.toString()}`);
    },
    [router],
  );

  const currentStage = analysis ? (analysis.mastery_profile.knowledge_gaps.length > 0 ? 1 : 0) : 0;

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-teal-700 dark:text-teal-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground flex items-center gap-2">
              Collaborative Peer Learning
              <Sparkles className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            </h1>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
          Our system analyzes your learning profile and finds the most suitable peer who can help with
          your current knowledge gap. Learn together through collaborative coding and guided discussions.
        </p>
      </div>

      {/* Student Profile */}
      <StudentProfileCard analysis={analysis} loading={loading} user={user} />

      {/* Two-column layout: Workflow + Peer Matching */}
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(320px,400px)] gap-6">
        {/* Agent Workflow */}
        <div className="rounded-2xl border border-border bg-card/55 p-6">
          <AgentWorkflow currentStage={currentStage} />
        </div>

        {/* Right column: Peer Matching + AI Assistant */}
        <div className="space-y-4">
          {/* Peer Matching */}
          {analysis ? (
            <PeerMatchSection analysis={analysis} onStartSession={handleStartSession} />
          ) : !loading ? (
            <PeerMatchSection
              analysis={{
                _id: '',
                schema_version: '',
                student_id: studentId,
                analysis_timestamp: '',
                data_sources: { github: 'unavailable', sandbox: 'unavailable', quizzes: 'unavailable' },
                mastery_profile: {
                  overall_mastery_score: 0,
                  knowledge_gaps: [],
                  strengths: [],
                },
                recommendations: { priority_order: [] },
                overall_mastery_score: 0,
                knowledge_gaps: [],
                strengths: [],
                gap_topic_ids: [],
                created_at: '',
                updated_at: '',
                saved_at: '',
              }}
              onStartSession={handleStartSession}
            />
          ) : null}

          {/* AI Assistant Teacher */}
          <AiAssistantSection analysis={analysis} user={user} onStartSession={handleStartSession} />
        </div>
      </div>

      {/* Individual Verification Quiz */}
      <button
        onClick={() => router.push('/peer-learning/quiz')}
        className="w-full group rounded-2xl border border-teal-500/20 bg-gradient-to-br from-card/80 to-teal-500/[0.04] p-6 flex items-center justify-between gap-4 transition-all hover:border-teal-500/40 "
      >
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
            <ListChecks className="w-5 h-5 text-teal-700 dark:text-teal-400" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-extrabold text-foreground">Verify Your Mastery</h3>
            <p className="text-sm text-muted-foreground">
              Take a 7-question code-based quiz targeting your knowledge gap, receive instant feedback, and get your mastery score.
            </p>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-teal-700 dark:text-teal-400 group-hover:translate-x-1 transition-transform shrink-0" />
      </button>
    </div>
  );
}
