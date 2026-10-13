'use client';

import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import robotAvatar from './avatar image/Robot says hello.svg';
import type { StudentAnalysisDocument } from '@/lib/api/peerLearning';
import type { PeerSessionData } from '@/components/peer-learning/PeerMatchSection';
import type { User as AuthUser } from '@/lib/api/auth';

interface AiAssistantSectionProps {
  analysis: StudentAnalysisDocument | null;
  user?: AuthUser | null;
  onStartSession: (data: PeerSessionData) => void;
}

function RobotAvatar() {
  return (
    <div className="relative w-72 max-w-full aspect-[500/394] shrink-0">
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        <Image
          src={robotAvatar}
          alt="AI assistant avatar"
          fill
          sizes="288px"
          className="object-fill"
        />
      </div>
      {/* Pulse dot */}
      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-border">
        <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-40" />
      </div>
    </div>
  );
}

export default function AiAssistantSection({ analysis, user, onStartSession }: AiAssistantSectionProps) {
  const firstGap = analysis?.mastery_profile.knowledge_gaps[0];
  const gapTopic = firstGap?.topic || 'Java Programming';
  const weakSubskill = firstGap?.weak_subskills[0]?.subskill || 'General Concepts';

  const handleConnect = () => {
    const studentId = user?.student_id || user?._id || 'unknown';
    const roomId = `room_${studentId}_ai_${Date.now()}`;
    onStartSession({
      roomId,
      peerId: 'ai_teacher',
      peerName: 'Java AI Assistant Teacher',
      topic: gapTopic,
      knowledgeGap: gapTopic,
      weakSubskill,
      matchScore: 0,
      isAiSession: true,
    });
  };

  return (
    <div className="rounded-2xl border border-amber-500/15 bg-gradient-to-br from-card/80 to-amber-500/[0.03] p-5">
      <div className="flex flex-col items-center text-center gap-3">
        {/* Robot Avatar */}
        <RobotAvatar />

        {/* Content */}
        <div className="w-full min-w-0">
          <div className="flex items-center justify-center gap-2 mb-2">
            <h3 className="text-xl font-extrabold text-foreground">Java AI Assistant Teacher</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto mb-4">
            When no suitable peer is available, the AI teacher can help you understand your Java knowledge gap with guided explanations and practice.
          </p>

          {/* CTA Button */}
          <button
            onClick={handleConnect}
            className="w-full max-w-xl py-3.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-base"
          >
            Connect with AI Assistant Teacher
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
