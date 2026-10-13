'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { peerLearningApi, type CodingTask, type TaskProgressItem, type ChatWsMessage, type ChatSupportResponse, type DiagnosticSessionTaskResponse, type DiagnosticSessionCompleteResponse, type CodeEvaluation, type SummaryResponse, type ContentRecommendation } from '@/lib/api/peerLearning';
import ParticipantDetails from '@/components/peer-learning/ParticipantDetails';
import CodeEditor from '@/components/peer-learning/CodeEditor';
import ChatTab from '@/components/peer-learning/ChatTab';
import EvaluateTab from '@/components/peer-learning/EvaluateTab';
import SummaryTab from '@/components/peer-learning/SummaryTab';
import LearnTab from '@/components/peer-learning/LearnTab';
import EndSessionScreen from '@/components/peer-learning/EndSessionScreen';
import CollaborativeOverlay, { type DrawTool, type RemoteCursor, type WhiteboardElement } from '@/components/peer-learning/CollaborativeOverlay';
import { MessageSquare, Code2, FileText, Lightbulb, StopCircle, ChevronDown, ChevronRight, Wifi, WifiOff, Loader2, CheckCircle2 } from 'lucide-react';

type TabId = 'chat' | 'evaluate' | 'summary' | 'learn';

const tabs: { id: TabId; label: string; icon: typeof MessageSquare }[] = [
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'evaluate', label: 'Evaluate', icon: Code2 },
  { id: 'summary', label: 'Summary', icon: FileText },
  { id: 'learn', label: 'Learn', icon: Lightbulb },
];

function toRecordList(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'));
  if (value && typeof value === 'object') return Object.values(value).filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'));
  return [];
}

export default function PairSessionPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const roomIdParam = searchParams.get('roomId');
  const [defaultRoomId] = useState(() => `room_${user?.student_id || 'unknown'}_default_${Date.now()}`);
  const roomId = roomIdParam || defaultRoomId;
  const peerId = searchParams.get('peerId') || 'unknown';
  const topic = searchParams.get('topic') || 'General Programming';
  const knowledgeGapParam = searchParams.get('knowledgeGap') || topic;
  const isAiSession = searchParams.get('ai') === '1';

  const studentId = user?.student_id || user?._id || 'unknown';
  const studentName = user?.name || 'Student';
  const peerNameParam = searchParams.get('peerName') || (isAiSession ? 'AI Assistant Teacher' : 'Peer Teacher');

  const [activeTab, setActiveTab] = useState<TabId>('chat');
  const [code, setCode] = useState('');
  const [connected, setConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState(1);
  const [codingTask, setCodingTask] = useState<CodingTask | null>(null);
  const [hintsRevealed, setHintsRevealed] = useState(false);
  const [taskProgress, setTaskProgress] = useState<TaskProgressItem[]>([]);
  const [currentTask, setCurrentTask] = useState(1);
  const [totalTasks, setTotalTasks] = useState(0);
  const [sequenceComplete, setSequenceComplete] = useState(false);
  const [drawMode, setDrawMode] = useState<DrawTool>('cursor');
  const [remoteCursors, setRemoteCursors] = useState<RemoteCursor[]>([]);
  const [whiteboardElements, setWhiteboardElements] = useState<WhiteboardElement[]>([]);

  const [sessionEnded, setSessionEnded] = useState(false);
  const [evaluation] = useState<CodeEvaluation | null>(null);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [recommendations, setRecommendations] = useState<ContentRecommendation[]>([]);
  const [messages, setMessages] = useState<ChatWsMessage[]>([]);
  const [aiLoading, setAiLoading] = useState(isAiSession);
  const [aiSessionComplete, setAiSessionComplete] = useState(false);
  const [aiSessionSummary, setAiSessionSummary] = useState<DiagnosticSessionCompleteResponse['session_summary'] | null>(null);

  const collabWsRef = useRef<WebSocket | null>(null);
  const chatWsRef = useRef<WebSocket | null>(null);
  const codeLoadedRef = useRef(false);
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const messageIdsRef = useRef<Set<string>>(new Set());

  const sendCollabMessage = useCallback((message: Record<string, unknown>) => {
    if (collabWsRef.current?.readyState === WebSocket.OPEN) {
      collabWsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const normalizeCursor = useCallback((value: Record<string, unknown>): RemoteCursor | null => {
    const id = String(value.student_id || value.participant_id || value.id || '');
    if (!id || id === studentId) return null;
    const position = (value.position as Record<string, unknown> | undefined) || value;
    return {
      id,
      name: String(value.student_name || value.name || value.user_name || 'Student'),
      role: String(value.role || (id === peerId ? 'Peer Teacher' : 'Learner')),
      color: String(value.color || '#38bdf8'),
      x: Number(position.x || 0),
      y: Number(position.y || 0),
    };
  }, [peerId, studentId]);

  const normalizeElement = useCallback((value: Record<string, unknown>): WhiteboardElement | null => {
    const id = String(value.id || value.element_id || `${Date.now()}-${Math.random()}`);
    const type = String(value.type || value.tool || '') as WhiteboardElement['type'];
    if (!['pen', 'line', 'arrow', 'rectangle', 'circle', 'text'].includes(type)) return null;
    return { ...value, id, type, color: String(value.color || '#38bdf8') } as WhiteboardElement;
  }, []);

  // Connect to collab WebSocket — read coding_task from INIT_STATE (peer sessions only)
  useEffect(() => {
    if (isAiSession) return;

    const ws = peerLearningApi.connectCollabWebSocket(
      roomId,
      (msg) => {
        if (msg.type === 'INIT_STATE') {
          setConnected(true);
          setActiveUsers(msg.active_users_count || 1);

          // Read task from INIT_STATE (backend sends 'task', not 'coding_task')
          if (msg.task) {
            setCodingTask(msg.task);
          }
          if (msg.task_progress) setTaskProgress(msg.task_progress);
          if (msg.current_task) setCurrentTask(msg.current_task);
          if (msg.total_tasks) setTotalTasks(msg.total_tasks);
          if (msg.sequence_complete !== undefined) setSequenceComplete(msg.sequence_complete);

          const initialCursors = toRecordList(msg.cursors).map(normalizeCursor).filter(Boolean) as RemoteCursor[];
          setRemoteCursors(initialCursors);
          const initialBoard = toRecordList(msg.whiteboard || msg.whiteboard_state).map(normalizeElement).filter(Boolean) as WhiteboardElement[];
          setWhiteboardElements(initialBoard);

          // Load starter_code only when room is initially empty (first INIT_STATE only)
          if (!codeLoadedRef.current) {
            codeLoadedRef.current = true;
            const serverCode = msg.code || '';
            if (serverCode.trim()) {
              setCode(serverCode);
            } else if (msg.task?.starter_code) {
              setCode(msg.task.starter_code);
            }
          }
        } else if (msg.type === 'TASK_PROGRESS') {
          // Backend broadcasts this after a task is graded and advanced
          if (msg.task) setCodingTask(msg.task);
          if (msg.task_progress) setTaskProgress(msg.task_progress);
          if (msg.current_task) setCurrentTask(msg.current_task);
          if (msg.total_tasks) setTotalTasks(msg.total_tasks);
          if (msg.sequence_complete !== undefined) setSequenceComplete(msg.sequence_complete);
          if (msg.status) {
            // Load the next task's starter_code into the editor
            if (msg.task?.starter_code) {
              setCode(msg.task.starter_code);
              codeLoadedRef.current = true;
            }
          }
          setHintsRevealed(false);
        } else if (msg.type === 'CODE_CHANGE' && msg.code !== undefined) {
          setCode(msg.code);
        } else if (msg.type === 'CURSOR_MOVE') {
          const cursor = normalizeCursor((msg.cursor || msg) as Record<string, unknown>);
          if (cursor) setRemoteCursors((previous) => [...previous.filter((item) => item.id !== cursor.id), cursor]);
        } else if (msg.type === 'PRESENCE_JOINED') {
          const cursor = normalizeCursor((msg.cursor || msg) as Record<string, unknown>);
          if (cursor) setRemoteCursors((previous) => [...previous.filter((item) => item.id !== cursor.id), cursor]);
        } else if (msg.type === 'PRESENCE_LEFT' || msg.type === 'USER_DISCONNECTED') {
          const id = String(msg.student_id || msg.participant_id || msg.id || '');
          if (id) setRemoteCursors((previous) => previous.filter((item) => item.id !== id));
          if (msg.type === 'USER_DISCONNECTED') setActiveUsers(msg.active_users_count || 0);
        } else if (msg.type === 'WHITEBOARD_DRAW') {
          const element = normalizeElement((msg.element || msg) as Record<string, unknown>);
          if (element) setWhiteboardElements((previous) => [...previous.filter((item) => item.id !== element.id), element]);
        } else if (msg.type === 'WHITEBOARD_ERASE') {
          const id = String(msg.element_id || (msg.element as Record<string, unknown> | undefined)?.id || msg.id || '');
          if (id) setWhiteboardElements((previous) => previous.filter((item) => item.id !== id));
        } else if (msg.type === 'WHITEBOARD_CLEAR') {
          setWhiteboardElements([]);
        } else if (msg.active_users_count !== undefined) {
          setActiveUsers(msg.active_users_count);
        }
      },
      () => setConnected(true),
      () => setConnected(false),
    );

    collabWsRef.current = ws;
    return () => ws.close();
  }, [isAiSession, normalizeCursor, normalizeElement, roomId]);

  // AI Session: reset any stale session, then call onboardAndDiagnose to get Task 1
  useEffect(() => {
    if (!isAiSession) return;

    let cancelled = false;

    const startAiSession = async () => {
      try {
        // Reset any previous session so we always start from Task 1
        await peerLearningApi.resetDiagnosticSession();
      } catch {
        // Ignore reset errors (session may not exist yet)
      }
      if (cancelled) return;

      const res = await peerLearningApi.onboardAndDiagnose();
      if (cancelled) return;

      if (!res.success || !res.data) {
        setAiLoading(false);
        return;
      }

      const data = res.data as unknown as Record<string, unknown>;
      if (data.status === 'session_complete') {
        setAiLoading(false);
        setAiSessionComplete(true);
        setAiSessionSummary((res.data as DiagnosticSessionCompleteResponse).session_summary);
        setSequenceComplete(true);
        return;
      }

      const taskResp = res.data as DiagnosticSessionTaskResponse;
      if (taskResp.task) {
        setAiLoading(false);
        setCodingTask(taskResp.task);
        setCurrentTask(taskResp.current_task_number);
        setTotalTasks(taskResp.total_tasks);
        setCode(taskResp.task.starter_code);
        codeLoadedRef.current = true;
      }
    };

    startAiSession();

    return () => { cancelled = true; };
  }, [isAiSession]);

  const handleCodeChange = useCallback(
    (value: string) => {
      setCode(value);
      if (collabWsRef.current?.readyState === WebSocket.OPEN) {
        collabWsRef.current.send(JSON.stringify({ type: 'CODE_CHANGE', code: value }));
      }
    },
    [],
  );

  // Chat WebSocket — single connection for the whole session, survives tab switches (peer sessions only)
  useEffect(() => {
    if (isAiSession) return;

    const ws = peerLearningApi.connectChatWebSocket(
      roomId,
      studentId,
      (msg) => {
        // CHAT_HISTORY is sent on connect with all stored messages
        const raw = msg as unknown as Record<string, unknown>;
        if (raw.type === 'CHAT_HISTORY') {
          const history = raw.messages as ChatWsMessage[] | undefined;
          if (Array.isArray(history)) {
            setMessages((prev) => {
              const existing = new Set(
                prev.map((m) => `${m.sender}::${m.content}`),
              );
              const merged = [...prev];
              for (const m of history) {
                const key = `${m.sender}::${m.content}`;
                if (!existing.has(key)) {
                  merged.push(m);
                  existing.add(key);
                }
              }
              return merged;
            });
          }
          return;
        }
        // Regular chat message — deduplicate
        const key = `${msg.sender}::${msg.content}`;
        if (messageIdsRef.current.has(key)) return;
        messageIdsRef.current.add(key);
        setMessages((prev) => [...prev, msg]);
      },
      () => setConnected(true),
      () => setConnected(false),
    );
    chatWsRef.current = ws;
    return () => ws.close();
  }, [isAiSession, roomId, studentId]);

  const sendChatMessage = useCallback(
    (text: string) => {
      if (isAiSession) {
        // AI session: use /api/chat/support HTTP endpoint
        const userMsg: ChatWsMessage = { sender: studentId, content: text };
        setMessages((prev) => [...prev, userMsg]);
        setAiLoading(true);
        peerLearningApi.chatSupport(text).then((res) => {
          setAiLoading(false);
          if (res.success && res.data) {
            const reply = (res.data as ChatSupportResponse).reply || 'I could not process that request.';
            setMessages((prev) => [...prev, { sender: 'Java AI Assistant Teacher', content: reply }]);
          } else {
            setMessages((prev) => [...prev, { sender: 'Java AI Assistant Teacher', content: 'Sorry, I encountered an error. Please try again.' }]);
          }
        });
        return;
      }
      // Peer session: use chat WebSocket
      if (chatWsRef.current?.readyState === WebSocket.OPEN) {
        chatWsRef.current.send(text);
      }
    },
    [isAiSession, studentId],
  );

  // AI session: advance to next task only after evaluation passes
  const handleAiTaskAdvance = useCallback(async (passed: boolean) => {
    if (!isAiSession || !passed) return;
    setAiLoading(true);
    const res = await peerLearningApi.onboardAndDiagnose();
    setAiLoading(false);
    if (!res.success || !res.data) return;

    const data = res.data as unknown as Record<string, unknown>;
    if (data.status === 'session_complete') {
      setAiSessionComplete(true);
      setAiSessionSummary((res.data as DiagnosticSessionCompleteResponse).session_summary);
      setSequenceComplete(true);
      return;
    }

    const taskResp = res.data as DiagnosticSessionTaskResponse;
    if (taskResp.task) {
      setCodingTask(taskResp.task);
      setCurrentTask(taskResp.current_task_number);
      setTotalTasks(taskResp.total_tasks);
      setCode(taskResp.task.starter_code);
      codeLoadedRef.current = true;
      setHintsRevealed(false);
    }
  }, [isAiSession]);

  const handleCursorMove = useCallback((point: { x: number; y: number }) => {
    sendCollabMessage({ type: 'CURSOR_MOVE', student_id: studentId, student_name: studentName, role: 'Learner', x: point.x, y: point.y });
  }, [sendCollabMessage, studentId, studentName]);

  const handleWorkspaceMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const bounds = workspaceRef.current?.getBoundingClientRect();
    if (!bounds) return;
    handleCursorMove({
      x: Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width)),
      y: Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height)),
    });
  }, [handleCursorMove]);

  const handleDraw = useCallback((element: WhiteboardElement) => {
    setWhiteboardElements((previous) => [...previous, element]);
    sendCollabMessage({ type: 'WHITEBOARD_DRAW', element });
  }, [sendCollabMessage]);

  const handleErase = useCallback((elementId: string) => {
    setWhiteboardElements((previous) => previous.filter((element) => element.id !== elementId));
    sendCollabMessage({ type: 'WHITEBOARD_ERASE', element_id: elementId });
  }, [sendCollabMessage]);

  const handleClearBoard = useCallback(() => {
    setWhiteboardElements([]);
    sendCollabMessage({ type: 'WHITEBOARD_CLEAR' });
  }, [sendCollabMessage]);

  const handleEndSession = async () => {
    const [summaryRes, recommendationsRes] = await Promise.allSettled([
      peerLearningApi.summarizeSession(roomId),
      peerLearningApi.recommendContent({ topic }),
    ]);

    if (summaryRes.status === 'fulfilled' && summaryRes.value.success) {
      setSummary(summaryRes.value.data || null);
    }
    if (recommendationsRes.status === 'fulfilled' && recommendationsRes.value.success) {
      setRecommendations(recommendationsRes.value.data?.recommendations || []);
    }

    setSessionEnded(true);
  };

  if (sessionEnded) {
    return (
      <EndSessionScreen
        studentName={studentName}
        studentId={studentId}
        peerName={peerNameParam}
        peerId={peerId}
        isAiSession={isAiSession}
        topic={topic}
        gapTopic={topic}
        evaluation={evaluation}
        summary={summary}
        recommendations={recommendations}
        onReturnHome={() => router.push('/peer-learning')}
      />
    );
  }

  return (
    <div className="space-y-3 animate-slide-up">
      {/* ═══ Session Header Bar ═══ */}
      <div className="rounded-2xl border border-border bg-card/55 px-5 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-subtle-foreground uppercase tracking-wider font-bold">Session</span>
              <span className="text-xs text-muted-foreground font-mono">{roomId}</span>
            </div>
            <div className="w-px h-4 bg-surface-3" />
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-subtle-foreground uppercase tracking-wider font-bold">Learner</span>
              <span className="text-xs text-teal-700 dark:text-teal-400 font-semibold">{studentId}</span>
              <span className="text-[10px] text-subtle-foreground">({studentName})</span>
            </div>
            <div className="w-px h-4 bg-surface-3" />
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-subtle-foreground uppercase tracking-wider font-bold">{isAiSession ? 'AI Teacher' : 'Peer Teacher'}</span>
              <span className="text-xs text-amber-700 dark:text-amber-400 font-semibold">{peerId}</span>
              <span className="text-[10px] text-subtle-foreground">({peerNameParam})</span>
            </div>
            <div className="w-px h-4 bg-surface-3" />
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-subtle-foreground uppercase tracking-wider font-bold">Topic</span>
              <span className="text-xs text-teal-700 dark:text-teal-400 font-semibold">{topic}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[10px]">
              {(connected || (isAiSession && codingTask)) ? (
                <>
                  <Wifi className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
                  <span className="text-emerald-700 dark:text-emerald-400">Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-subtle-foreground" />
                  <span className="text-subtle-foreground">Connecting...</span>
                </>
              )}
            </div>
            <button
              onClick={handleEndSession}
              className="px-4 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/20 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <StopCircle className="w-3.5 h-3.5" />
              End Session
            </button>
          </div>
        </div>
      </div>

      {/* ═══ Coding Task Panel ═══ */}
      {codingTask && (
        <div className="rounded-2xl border border-teal-500/20 bg-teal-500/5 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 bg-teal-500/20 border border-teal-500/30 rounded-lg">
                <span className="text-xs font-bold text-teal-700 dark:text-teal-400 uppercase">{codingTask.task_type.replace(/_/g, ' ')}</span>
              </div>
              <h3 className="text-base font-extrabold text-foreground">Java Coding Task</h3>
              {totalTasks > 0 && (
                <span className="text-[10px] text-subtle-foreground font-mono">
                  Task {currentTask} of {totalTasks}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {sequenceComplete ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                  Complete
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400">
                  In Progress
                </span>
              )}
            </div>
          </div>

          <p className="text-sm text-foreground/80 leading-relaxed mb-3">{codingTask.task_description}</p>

          {codingTask.requirements.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] font-bold text-subtle-foreground uppercase tracking-wider mb-1.5">Requirements</p>
              <ul className="space-y-1">
                {codingTask.requirements.map((req, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="text-teal-700 dark:text-teal-400 mt-0.5">{i + 1}.</span>
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {codingTask.hints.length > 0 && (
            <div>
              {!hintsRevealed ? (
                <button
                  onClick={() => setHintsRevealed(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg text-xs font-semibold text-amber-700 dark:text-amber-400 transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                  Show Hint ({codingTask.hints.length})
                </button>
              ) : (
                <div className="space-y-1.5">
                  <button
                    onClick={() => setHintsRevealed(false)}
                    className="flex items-center gap-2 text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider"
                  >
                    <ChevronDown className="w-3 h-3" />
                    Hints
                  </button>
                  {codingTask.hints.map((hint, i) => (
                    <div key={i} className="px-3 py-2 bg-amber-500/5 border border-amber-500/10 rounded-lg">
                      <p className="text-xs text-amber-700 dark:text-amber-300/80">{hint}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══ AI Session Loading ═══ */}
      {isAiSession && aiLoading && !codingTask && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8 flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-amber-700 dark:text-amber-400 animate-spin" />
          <p className="text-sm text-amber-700 dark:text-amber-300 font-semibold">Generating your first diagnostic task...</p>
          <p className="text-xs text-subtle-foreground">The AI teacher is preparing a personalized coding challenge.</p>
        </div>
      )}

      {/* ═══ AI Session Complete ═══ */}
      {isAiSession && aiSessionComplete && aiSessionSummary && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            <h3 className="text-base font-extrabold text-foreground">Diagnostic Session Complete</h3>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="rounded-xl bg-background border border-border p-3 text-center">
              <p className="text-[10px] text-subtle-foreground uppercase mb-1">Tasks Completed</p>
              <p className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400">{aiSessionSummary.tasks_passed}/{aiSessionSummary.total_tasks}</p>
            </div>
            <div className="rounded-xl bg-background border border-border p-3 text-center">
              <p className="text-[10px] text-subtle-foreground uppercase mb-1">Mastery Score</p>
              <p className="text-lg font-extrabold text-amber-700 dark:text-amber-400">{aiSessionSummary.mastery_score}%</p>
            </div>
            <div className="rounded-xl bg-background border border-border p-3 text-center">
              <p className="text-[10px] text-subtle-foreground uppercase mb-1">Status</p>
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Passed</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">You can continue chatting with the AI teacher or end the session.</p>
        </div>
      )}

      {/* ═══ Main Workspace: Editor + Tabs ═══ */}
      <div className="grid lg:grid-cols-[minmax(0,1fr)_380px] gap-3" style={{ minHeight: 'calc(100vh - 320px)' }}>
        {/* Left: Shared Java Editor */}
        <div ref={workspaceRef} onMouseMove={handleWorkspaceMouseMove} className="relative min-h-[400px] lg:min-h-0">
          <CodeEditor
            value={code}
            onChange={handleCodeChange}
            connected={connected}
            activeUsers={activeUsers}
            questionText={codingTask?.task_description}
          />
          <CollaborativeOverlay
            drawMode={drawMode}
            onToolChange={setDrawMode}
            onClear={handleClearBoard}
            cursors={remoteCursors}
            elements={whiteboardElements}
            onDraw={handleDraw}
            onErase={handleErase}
            onCursorMove={handleCursorMove}
          />
        </div>

        {/* Right: Collaboration Panel */}
        <div className="flex flex-col rounded-xl border border-border bg-card/55 overflow-hidden min-h-[400px] lg:min-h-0">
          {/* Tab bar */}
          <div className="flex border-b border-border">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors ${
                    isActive
                      ? 'text-teal-700 dark:text-teal-400 border-b-2 border-teal-400 bg-teal-500/5'
                      : 'text-subtle-foreground hover:text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {activeTab === 'chat' && (
              <ChatTab
                roomId={roomId}
                studentId={studentId}
                studentName={studentName}
                peerId={peerId}
                peerName={peerNameParam}
                role="learner"
                messages={messages}
                onSend={sendChatMessage}
                aiLoading={isAiSession && aiLoading}
              />
            )}
            {activeTab === 'evaluate' && (
              <EvaluateTab
                getCode={() => code}
                codingTask={codingTask}
                onEvaluateSuccess={isAiSession ? handleAiTaskAdvance : undefined}
              />
            )}
            {activeTab === 'summary' && (
              <SummaryTab
                roomId={roomId}
                studentName={studentName}
                peerName={peerNameParam}
                topic={topic}
              />
            )}
            {activeTab === 'learn' && (
              <LearnTab gapTopic={topic} />
            )}
          </div>

          {/* Participant Details - always visible */}
          <div className="border-t border-border p-3">
            <ParticipantDetails
              learner={{
                id: studentId,
                name: studentName,
                role: 'Learner',
                topic: topic,
              }}
              peerTeacher={{
                id: peerId,
                name: peerNameParam,
                role: isAiSession ? 'AI Teacher' : 'Peer Teacher',
                topic: topic,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
