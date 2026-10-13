'use client';

import { Users, Brain, User } from 'lucide-react';

interface Participant {
  id: string;
  name: string;
  role: 'Learner' | 'Peer Teacher' | 'AI Teacher';
  topic?: string;
}

interface ParticipantDetailsProps {
  learner: Participant;
  peerTeacher: Participant;
}

export default function ParticipantDetails({ learner, peerTeacher }: ParticipantDetailsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Users className="w-4 h-4 text-muted-foreground" />
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Participants</p>
      </div>

      <div className="rounded-xl bg-background border border-border p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-foreground text-xs font-semibold">{learner.name}</p>
            <p className="text-amber-700 dark:text-amber-400 text-[10px] font-bold">{learner.role}</p>
          </div>
        </div>
        <div className="space-y-1 text-[10px] text-subtle-foreground">
          <p><span className="text-subtle-foreground">ID:</span> {learner.id}</p>
          {learner.topic && <p><span className="text-subtle-foreground">Gap:</span> <span className="text-amber-700 dark:text-amber-400/70">{learner.topic}</span></p>}
        </div>
      </div>

      <div className="rounded-xl bg-background border border-border p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-7 h-7 rounded-lg ${peerTeacher.role === 'AI Teacher' ? 'bg-violet-500/10 border border-violet-500/20' : 'bg-teal-500/10 border border-teal-500/20'} flex items-center justify-center`}>
            {peerTeacher.role === 'AI Teacher' ? (
              <Brain className="w-3.5 h-3.5 text-violet-700 dark:text-violet-400" />
            ) : (
              <User className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
            )}
          </div>
          <div>
            <p className="text-foreground text-xs font-semibold">{peerTeacher.name}</p>
            <p className={`text-xs font-bold ${peerTeacher.role === 'AI Teacher' ? 'text-violet-700 dark:text-violet-400' : 'text-teal-700 dark:text-teal-400'}`}>
              {peerTeacher.role}
            </p>
          </div>
        </div>
        <div className="space-y-1 text-[10px] text-subtle-foreground">
          <p><span className="text-subtle-foreground">ID:</span> {peerTeacher.id}</p>
          {peerTeacher.topic && <p><span className="text-subtle-foreground">Strong in:</span> <span className="text-teal-700 dark:text-teal-400/70">{peerTeacher.topic}</span></p>}
        </div>
      </div>
    </div>
  );
}
