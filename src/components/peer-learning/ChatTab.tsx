'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Loader2 } from 'lucide-react';
import type { ChatWsMessage } from '@/lib/api/peerLearning';

interface ChatTabProps {
  roomId: string;
  studentId: string;
  studentName: string;
  peerId: string;
  peerName: string;
  role: 'learner' | 'peer_teacher';
  messages: ChatWsMessage[];
  onSend: (text: string) => void;
  aiLoading?: boolean;
}

export default function ChatTab({
  studentId,
  studentName,
  peerId,
  peerName,
  role,
  messages,
  onSend,
  aiLoading,
}: ChatTabProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getSenderInfo = (sender: string) => {
    if (sender === studentId) return { name: studentName, isSelf: true, role: role === 'learner' ? 'Learner' : 'Peer Teacher', color: 'text-amber-700 dark:text-amber-400' };
    if (sender === peerId) return { name: peerName, isSelf: false, role: role === 'learner' ? 'Peer Teacher' : 'Learner', color: 'text-teal-700 dark:text-teal-400' };
    if (sender === 'AI Moderator Agent') return { name: 'AI Moderator', isSelf: false, role: 'System', color: 'text-violet-700 dark:text-violet-400' };
    if (sender === 'System') return { name: 'System', isSelf: false, role: '', color: 'text-subtle-foreground' };
    return { name: sender, isSelf: false, role: '', color: 'text-muted-foreground' };
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <MessageSquare className="w-8 h-8 text-subtle-foreground/70 mb-2" />
            <p className="text-xs text-subtle-foreground">No messages yet. Start the conversation!</p>
          </div>
        )}
        {messages.map((msg, i) => {
          const info = getSenderInfo(msg.sender);
          const isSystem = msg.sender === 'System' || msg.sender === 'AI Moderator Agent';

          if (isSystem) {
            return (
              <div key={`${msg.sender}-${i}`} className="flex justify-center">
                <div className="px-3 py-1.5 rounded-full bg-muted border border-border max-w-[80%]">
                  <p className="text-[10px] text-subtle-foreground text-center">{msg.content}</p>
                </div>
              </div>
            );
          }

          return (
            <div key={`${msg.sender}-${i}`} className={`flex flex-col ${info.isSelf ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`text-[10px] font-bold ${info.color}`}>{info.name}</span>
                {info.role && (
                  <span className="text-[9px] text-subtle-foreground px-1 py-0.5 rounded bg-muted">{info.role}</span>
                )}
              </div>
              <div
                className={`px-3 py-2 rounded-xl text-xs leading-relaxed max-w-[85%] ${
                  info.isSelf
                    ? 'bg-teal-600/20 border border-teal-500/20 text-foreground'
                    : 'bg-muted border border-border text-foreground/80'
                }`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
        {aiLoading && (
          <div className="flex items-start gap-2">
            <div className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
              <Loader2 className="w-3 h-3 text-amber-700 dark:text-amber-400 animate-spin" />
              <span className="text-xs text-amber-700 dark:text-amber-300/80">AI Teacher is thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-subtle-foreground focus:outline-none focus:border-teal-500/50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-30 rounded-lg transition-colors"
          >
            <Send className="w-3.5 h-3.5 text-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}
