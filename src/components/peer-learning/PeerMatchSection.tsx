'use client';

import { useState } from 'react';
import { Search, Users, UserCheck, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { peerLearningApi, type StudentAnalysisDocument, type PeerMatchResponse } from '@/lib/api/peerLearning';

interface PeerMatchSectionProps {
  analysis: StudentAnalysisDocument;
  onStartSession: (data: PeerSessionData) => void;
}

export interface PeerSessionData {
  roomId: string;
  peerId: string;
  peerName: string;
  topic: string;
  knowledgeGap: string;
  weakSubskill: string;
  matchScore: number;
  isAiSession: boolean;
}

function parseMatchMessage(message: string) {
  const match = message.match(/Matched with (.+?) \((.+?)\) for '(.+?)' as a (\w+) partner/);
  if (match) {
    return { name: match[1], id: match[2], topic: match[3], role: match[4] };
  }
  return null;
}

export default function PeerMatchSection({ analysis, onStartSession }: PeerMatchSectionProps) {
  const [searching, setSearching] = useState(false);
  const [matchResult, setMatchResult] = useState<PeerMatchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const firstGap = analysis.mastery_profile.knowledge_gaps[0];
  const gapTopic = firstGap?.topic || 'General Programming';
  const weakSubskill = firstGap?.weak_subskills[0]?.subskill || 'N/A';

  const handleFindPeer = async () => {
    setSearching(true);
    setError(null);
    setMatchResult(null);

    try {
      const result = await peerLearningApi.matchPeer();
      if (result.success) {
        setMatchResult((result.data || result) as PeerMatchResponse);
      } else {
        setError(result.message || 'Failed to search for peers.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleStartPeerSession = () => {
    if (!matchResult?.matched_peer_id) return;
    const peerInfo = parseMatchMessage(matchResult.message);
    const roomId = matchResult.room_id || `room_${analysis.student_id}_${matchResult.matched_peer_id}_${Date.now()}`;
    onStartSession({
      roomId,
      peerId: matchResult.matched_peer_id,
      peerName: peerInfo?.name || 'Unknown',
      topic: peerInfo?.topic || gapTopic,
      knowledgeGap: gapTopic,
      weakSubskill,
      matchScore: matchResult.match_score,
      isAiSession: false,
    });
  };

  const handleStartAiSession = () => {
    const roomId = `room_${analysis.student_id}_ai_${Date.now()}`;
    onStartSession({
      roomId,
      peerId: 'ai_teacher',
      peerName: 'AI Assistant Teacher',
      topic: gapTopic,
      knowledgeGap: gapTopic,
      weakSubskill,
      matchScore: 0,
      isAiSession: true,
    });
  };

  const peerInfo = matchResult ? parseMatchMessage(matchResult.message) : null;
  const isMatch = matchResult?.status === 'success' && matchResult.matched_peer_id;

  return (
    <div className="space-y-4">
      {!matchResult && (
        <div className="rounded-2xl border border-border bg-card/55 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
              <Search className="w-5 h-5 text-teal-700 dark:text-teal-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Find Suitable Peer</h3>
              <p className="text-xs text-muted-foreground">
                The system will search for a peer who is strong in{' '}
                <span className="text-amber-700 dark:text-amber-400 font-semibold">{gapTopic}</span> where you currently need help.
              </p>
            </div>
          </div>

          <button
            onClick={handleFindPeer}
            disabled={searching}
            className="w-full mt-3 py-3 bg-primary hover:bg-primary-hover disabled:opacity-50 text-primary-foreground font-bold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {searching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Searching for the best peer based on your knowledge gap...
              </>
            ) : (
              <>
                <Users className="w-4 h-4" />
                Find Suitable Peer
              </>
            )}
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-700 dark:text-red-400 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {matchResult && isMatch && peerInfo && (
        <div className="rounded-2xl border border-teal-500/20 bg-teal-500/5 p-6">
          <div className="flex items-center gap-2 mb-4">
            <UserCheck className="w-5 h-5 text-teal-700 dark:text-teal-400" />
            <h3 className="text-lg font-bold text-foreground">Matched Peer Found</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            <div className="rounded-xl bg-background border border-border p-3">
              <p className="text-[10px] font-bold tracking-wider text-subtle-foreground uppercase mb-1">Peer Student ID</p>
              <p className="text-foreground font-semibold text-sm">{peerInfo.id}</p>
            </div>
            <div className="rounded-xl bg-background border border-border p-3">
              <p className="text-[10px] font-bold tracking-wider text-subtle-foreground uppercase mb-1">Matched Topic</p>
              <p className="text-teal-700 dark:text-teal-400 font-semibold text-sm">{peerInfo.topic}</p>
            </div>
            <div className="rounded-xl bg-background border border-border p-3">
              <p className="text-[10px] font-bold tracking-wider text-subtle-foreground uppercase mb-1">Role</p>
              <p className="text-teal-700 dark:text-teal-400 text-sm font-bold">Peer Teacher</p>
            </div>
          </div>

          <button
            onClick={handleStartPeerSession}
            className="w-full py-3 bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            Continue to Question Generation
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {matchResult && !isMatch && (
        <div className="rounded-2xl border border-amber-500/20 bg-card/55 p-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            <h3 className="text-lg font-bold text-foreground">No Suitable Peer Available</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            The system could not find an available student who satisfies the required knowledge criteria
            for <span className="text-amber-700 dark:text-amber-400 font-semibold">{gapTopic}</span>. You can still continue
            learning with the AI Assistant Teacher.
          </p>

          <div className="space-y-2">
            <button
              onClick={handleFindPeer}
              className="w-full py-2.5 bg-muted hover:bg-surface-3 text-foreground/80 font-semibold rounded-xl transition-colors border border-border text-sm"
            >
              Try Searching Again
            </button>
            <button
              onClick={handleStartAiSession}
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              Connect with AI Assistant Teacher
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
