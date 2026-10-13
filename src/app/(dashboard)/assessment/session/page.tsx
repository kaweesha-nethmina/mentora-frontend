"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Clock,
  Circle,
  Lightbulb,
  Send,
  Copy,
  AlertTriangle,
  Target,
  Code,
  Zap,
  Trophy,
  TrendingUp,
  BarChart3,
  Play,
  Terminal
} from "lucide-react";
import FeedbackPanel from "../components/FeedbackPanel";
import SandboxCodeEditor from "../components/SandboxCodeEditor";
import { assessmentApi } from "@/lib/api/assessment";
import type { SandboxResult } from "@/lib/api/assessment";

interface StoredQA {
  id: string;
  number: number;
  question: string;
  type: "mcq" | "code_completion" | "code_tracing" | "debugging" | "coding_challenge";
  code_snippet?: string;
  options?: string[] | Option[];
  learner_answer: string;
  correct_answer: string;
  is_correct: boolean;
  explanation: string;
  topic: string;
  difficulty: "Easy" | "Medium" | "Hard";
  time_spent: number;
  timestamp: number;
}

const saveQA = (qa: StoredQA) => {
  const stored = localStorage.getItem("assessment_qa");
  const qaList: StoredQA[] = stored ? JSON.parse(stored) : [];
  qaList.push(qa);
  localStorage.setItem("assessment_qa", JSON.stringify(qaList));
};

interface Topic {
  name: string;
  mastery: number;
  status: "mastered" | "current" | "pending";
  gap_type: "FUNDAMENTAL_GAP" | "PARTIAL_GAP";
}

interface Option {
  letter: string;
  text: string;
}

interface Question {
  id: string;
  number: number;
  text: string;
  type: "mcq" | "code_completion" | "code_tracing" | "debugging" | "coding_challenge";
  code_snippet?: string;
  options?: Option[];
  requires_sandbox?: boolean;
  difficulty: "Easy" | "Medium" | "Hard";
  topic: string;
  hints: string[];
}

const SANDBOX_QUESTION_TYPES = ["code_completion", "code_tracing", "debugging", "coding_challenge"];

const questionRequiresSandbox = (type: string, flag?: boolean) =>
  flag ?? SANDBOX_QUESTION_TYPES.includes(type);

interface SessionData {
  sessionId: string;
  learnerId: string;
  currentTopic: Topic;
  allTopics: Topic[];
  currentQuestion: Question;
  stats: {
    questionsAsked: number;
    correctAnswers: number;
    accuracy: number;
    streak: number;
  };
  remediationMode: boolean;
}

export default function SessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');

  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [codeAnswer, setCodeAnswer] = useState<string>("");
  const [showHint, setShowHint] = useState<number>(0);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [feedbackData, setFeedbackData] = useState<any>(null);
  const [timeElapsed, setTimeElapsed] = useState<number>(0);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<SandboxResult | null>(null);
  const [traceRunCode, setTraceRunCode] = useState<string>("");
  const [questionNumber, setQuestionNumber] = useState(1);

  useEffect(() => {
    const buildSessionState = (data: any) => {
      const session = data.updated_session || data;
      const question = session.current_question || data.question || (session.questions && session.questions[0]) || null;

      if (!question) {
        return false;
      }

      const options = question.options
        ? (Array.isArray(question.options)
            ? (typeof question.options[0] === 'string'
                ? (question.options as string[]).map((text, i) => ({ letter: String.fromCharCode(65 + i), text }))
                : question.options)
            : Object.entries(question.options).map(([letter, text]) => ({ letter, text: text as string })))
        : undefined;

      const allTopics = session.all_topics || session.topics || [
        { name: question.topic || 'Topic', mastery: session.current_topic_mastery || 0, status: 'current', gap_type: 'FUNDAMENTAL_GAP' }
      ];

      const sessInfo = data.session_info || session;

      setSessionData({
        sessionId: session.session_id || sessInfo.session_id || sessionId || 'unknown',
        learnerId: session.learner_id || data.learner_id || 'unknown',
        currentTopic: {
          name: question.topic || session.topic || sessInfo.topic || 'Topic',
          mastery: session.current_topic_mastery || sessInfo.mastery_score || 0,
          status: 'current',
          gap_type: question.gap_type || 'FUNDAMENTAL_GAP',
        },
        allTopics: allTopics.map((t: any) => {
          const topicName = typeof t === 'string' ? t : (t.name || t.topic_name || t.topic);
          return {
            name: topicName,
            mastery: t.mastery || t.mastery_percentage || 0,
            status: topicName === (session.selected_topic || question.topic) ? 'current' : (t.mastery >= 85 ? 'mastered' : 'pending'),
            gap_type: t.gap_type || 'PARTIAL_GAP',
          };
        }),
        currentQuestion: {
          id: question.question_id || question.id || `q-${Date.now()}`,
          number: questionNumber,
          text: question.question_text || question.text || '',
          type: question.question_type || question.type || 'mcq',
          code_snippet: question.code_snippet,
          options: options,
          requires_sandbox: questionRequiresSandbox(question.question_type || question.type || 'mcq', question.requires_sandbox),
          difficulty: question.difficulty || 'Medium',
          topic: question.topic || 'General',
          hints: question.hints || [],
        },
        stats: {
          questionsAsked: session.total_questions_asked || session.questions_asked || sessInfo.question_number || 0,
          correctAnswers: session.correct_answers || 0,
          accuracy: session.accuracy_percentage || session.accuracy || 0,
          streak: session.current_streak || session.streak || 0,
        },
        remediationMode: session.remediation_mode || data.remediation_mode || false,
      });
      return true;
    };

    const fetchSession = async () => {
      // Try API first if we have a sessionId
      if (sessionId) {
        try {
          const res = await assessmentApi.getSession(sessionId);
          if (res.success && res.data) {
            if (buildSessionState(res.data)) {
              setLoading(false);
              return;
            }
          }
        } catch {}
      }

      // Fallback to localStorage (start-session response)
      const stored = localStorage.getItem('assessment_session');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (buildSessionState(parsed)) {
            setLoading(false);
            return;
          }
        } catch {}
      }

      // Fallback to saved next_question (after topic transition)
      const nextQ = localStorage.getItem('assessment_next_question');
      if (nextQ) {
        try {
          const question = JSON.parse(nextQ);
          const sessStored = localStorage.getItem('assessment_session');
          const sess = sessStored ? JSON.parse(sessStored) : {};
          const options = question.options
            ? (Array.isArray(question.options)
                ? (typeof question.options[0] === 'string'
                    ? (question.options as string[]).map((text, i) => ({ letter: String.fromCharCode(65 + i), text }))
                    : question.options)
                : Object.entries(question.options).map(([letter, text]) => ({ letter, text: text as string })))
            : undefined;
          const allTopics = (sess.all_topics || []).map((t: any) => ({
            name: typeof t === 'string' ? t : (t.name || t.topic_name || t.topic),
            mastery: t.mastery || t.mastery_percentage || 0,
            status: (typeof t === 'string' ? t : (t.name || t.topic_name || t.topic)) === (sess.selected_topic || question.topic) ? 'current' : (t.mastery >= 85 ? 'mastered' : 'pending'),
            gap_type: t.gap_type || 'PARTIAL_GAP',
          }));
          setSessionData({
            sessionId: sess.session_id || sessionId || 'unknown',
            learnerId: sess.learner_id || 'unknown',
            currentTopic: {
              name: question.topic || sess.selected_topic || 'Topic',
              mastery: sess.mastery_score || 0,
              status: 'current',
              gap_type: 'PARTIAL_GAP',
            },
            allTopics,
            currentQuestion: {
              id: question.question_id || question.id || `q-${Date.now()}`,
              number: (sess.total_questions_asked || 0) + 1,
              text: question.question_text || question.text || question.question || '',
              type: question.question_type || question.type || 'mcq',
              code_snippet: question.code_snippet,
              options,
              requires_sandbox: questionRequiresSandbox(question.question_type || question.type || 'mcq', question.requires_sandbox),
              difficulty: question.difficulty || 'Medium',
              topic: question.topic || 'General',
              hints: question.hints || [],
            },
            stats: {
              questionsAsked: sess.total_questions_asked || 0,
              correctAnswers: sess.correct_answers || 0,
              accuracy: sess.accuracy_percentage || 0,
              streak: sess.consecutive_correct || 0,
            },
            remediationMode: sess.remediation_mode || false,
          });
          setLoading(false);
          return;
        } catch {}
      }

      setError('No questions available in this session');
      setLoading(false);
    };

    fetchSession();
  }, [sessionId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (sessionData) {
      setQuestionNumber(sessionData.stats.questionsAsked + 1);
    }
  }, [sessionData]);

  const lastQuestionIdRef = useRef<string | null>(null);
  useEffect(() => {
    const qId = sessionData?.currentQuestion.id ?? null;
    if (qId !== lastQuestionIdRef.current) {
      lastQuestionIdRef.current = qId;
      setTraceRunCode(sessionData?.currentQuestion.code_snippet ?? "");
      setRunResult(null);
    }
  }, [sessionData]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getMasteryColor = (mastery: number) => {
    if (mastery >= 85) return { text: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-500", ring: "stroke-emerald-400" };
    if (mastery >= 60) return { text: "text-blue-700 dark:text-blue-400", bg: "bg-blue-500", ring: "stroke-blue-400" };
    if (mastery >= 40) return { text: "text-amber-700 dark:text-amber-400", bg: "bg-amber-500", ring: "stroke-amber-400" };
    return { text: "text-red-700 dark:text-red-400", bg: "bg-red-500", ring: "stroke-red-400" };
  };

  const getTopicIcon = (status: string) => {
    switch (status) {
      case "mastered": return <CheckCircle className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />;
      case "current": return <Clock className="w-4 h-4 text-blue-700 dark:text-blue-400" />;
      default: return <Circle className="w-4 h-4 text-subtle-foreground" />;
    }
  };

  const getDifficultyConfig = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return { color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30", dot: "bg-emerald-400" };
      case "Medium": return { color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30", dot: "bg-amber-400" };
      case "Hard": return { color: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30", dot: "bg-red-400" };
      default: return { color: "bg-slate-500/10 text-muted-foreground border-slate-500/30", dot: "bg-slate-400" };
    }
  };

  const getTypeConfig = (type: string) => {
    switch (type) {
      case "mcq": return { label: "Multiple Choice", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30" };
      case "code_completion": return { label: "Code Completion", color: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30" };
      case "code_tracing": return { label: "Code Tracing", color: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/30" };
      case "debugging": return { label: "Debugging", color: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30" };
      case "coding_challenge": return { label: "Coding Challenge", color: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30" };
      default: return { label: type, color: "bg-slate-500/10 text-muted-foreground border-slate-500/30" };
    }
  };

  const handleSubmit = async () => {
    const answer = sessionData!.currentQuestion.type === "mcq" ? selectedAnswer : codeAnswer;
    setIsEvaluating(true);

    try {
      const storedSession = JSON.parse(localStorage.getItem('assessment_session') || '{}');
      const sid = sessionId || storedSession.session_id || storedSession.sessionId || sessionData!.sessionId;

      const result = await assessmentApi.submitAnswer({
        session_id: sid,
        question_id: sessionData!.currentQuestion.id,
        answer,
      });

      const data = result.data || result;
      if (result.success && data) {
        const fb = data.feedback || data.evaluation || data;

        const is_correct = data.evaluation?.is_correct ?? fb.is_correct ?? false;
        const partial_credit = data.evaluation?.partial_credit ?? fb.partial_credit ?? false;

        const feedback = {
          is_correct,
          partial_credit,
          correctness_score: data.evaluation?.correctness_score ?? (is_correct ? 100 : 0),
          evaluation_summary: data.evaluation?.evaluation_summary || fb.evaluation_summary || fb.summary || '',
          immediate_feedback: fb.immediate_feedback || fb.feedback || '',
          concept_explanation: fb.concept_explanation || '',
          what_is_correct: fb.what_is_correct || data.evaluation?.what_is_correct,
          mistake_analysis: fb.mistake_analysis || data.evaluation?.what_is_wrong,
          correct_explanation: fb.correct_explanation || '',
          improvement_tip: fb.improvement_tip || '',
          hint_for_retry: fb.hint_for_retry,
          deeper_insight: fb.deeper_insight,
          remediation_note: data.mastery_update?.remediation_note || fb.remediation_note,
          encouragement: fb.encouragement || '',
          suggested_resources: fb.suggested_resources || [],
          mastery_update: data.mastery_update ? {
            topic: data.mastery_update.topic,
            before_mastery: data.mastery_update.previous_mastery,
            after_mastery: data.mastery_update.current_mastery,
            target: data.mastery_update.mastery_threshold,
          } : {
            topic: sessionData!.currentTopic.name,
            before_mastery: sessionData!.currentTopic.mastery,
            after_mastery: sessionData!.currentTopic.mastery,
            target: 85,
          },
          remediation_status: data.mastery_update?.remediation_mode ? { entered: data.mastery_update.remediation_entered, exited: data.mastery_update.remediation_exited, message: '' } : undefined,
          difficulty_change: undefined,
          next_action: (data.session_progress?.session_complete || data.mastery_update?.session_complete) ? 'complete' : 'continue',
          next_topic_name: data.next_question?.topic,
          question_text: sessionData!.currentQuestion.text,
          learner_answer: answer,
          sandbox_execution: data.sandbox_execution || data.sandbox_result || null,
        };

        const correctAnswer = data.evaluation?.correct_answer || data.next_question?.correct_answer || '';
        const qaItem: StoredQA = {
          id: sessionData!.currentQuestion.id,
          number: questionNumber,
          question: sessionData!.currentQuestion.text,
          type: sessionData!.currentQuestion.type,
          code_snippet: sessionData!.currentQuestion.code_snippet,
          options: sessionData!.currentQuestion.options,
          learner_answer: answer,
          correct_answer: correctAnswer,
          is_correct,
          explanation: feedback.correct_explanation,
          topic: sessionData!.currentQuestion.topic,
          difficulty: sessionData!.currentQuestion.difficulty,
          time_spent: timeElapsed,
          timestamp: Date.now()
        };
        saveQA(qaItem);
        localStorage.setItem('assessment_qa_learner', sessionData!.learnerId);

        if (data.next_question || data.session_progress) {
          const sessionState = data.session_progress?.session_state || data;
          localStorage.setItem('assessment_session', JSON.stringify(sessionState));
        }

        if (data.next_question) {
          localStorage.setItem('assessment_next_question', JSON.stringify(data.next_question));
        }

        if (data.feedback_report) {
          localStorage.setItem('assessment_feedback_report', JSON.stringify(data.feedback_report));
        }
        if (data.qa_review) {
          localStorage.setItem('assessment_qa_review', JSON.stringify(data.qa_review));
        }
        if (data.session_summary) {
          localStorage.setItem('assessment_session_summary', JSON.stringify(data.session_summary));
        }

        const state = data.session_progress?.session_state;
        if (data.session_progress || data.mastery_update) {
          setSessionData(prev => prev ? {
            ...prev,
            currentTopic: {
              name: state?.selected_topic || data.mastery_update?.topic || prev.currentTopic.name,
              mastery: data.mastery_update?.current_mastery ?? prev.currentTopic.mastery,
              status: 'current',
              gap_type: prev.currentTopic.gap_type,
            },
            allTopics: state?.all_topics
              ? state.all_topics.map((t: any) => {
                  const topicName = typeof t === 'string' ? t : (t.name || t.topic_name || t.topic);
                  return {
                    name: topicName,
                    mastery: t.mastery || t.mastery_percentage || 0,
                    status: topicName === (state.selected_topic || data.mastery_update?.topic) ? 'current' : (t.mastery >= 85 ? 'mastered' : 'pending'),
                    gap_type: t.gap_type || 'PARTIAL_GAP',
                  };
                })
              : prev.allTopics,
            stats: {
              questionsAsked: state?.total_questions_asked ?? data.session_progress?.question_number ?? prev.stats.questionsAsked,
              correctAnswers: state?.correct_answers ?? prev.stats.correctAnswers,
              accuracy: data.session_progress?.overall_accuracy ?? prev.stats.accuracy,
              streak: state?.consecutive_correct ?? prev.stats.streak,
            },
            remediationMode: state?.remediation_mode ?? prev.remediationMode,
          } : prev);
        }

        if (data.session_progress?.session_complete || data.mastery_update?.session_complete || feedback.next_action === 'complete') {
          router.push('/assessment/summary');
          return;
        }

        if (data.mastery_update?.topic_mastered) {
          const ss = data.session_progress?.session_state;
          const completedName = data.mastery_update.topic;
          // n8n has already switched current_topic to the next topic
          const nextTopicName = data.session_progress?.current_topic
            || ss?.selected_topic
            || (ss?.remaining_topics?.length > 0
              ? (typeof ss.remaining_topics[0] === 'string' ? ss.remaining_topics[0] : (ss.remaining_topics[0].name || ss.remaining_topics[0].topic_name || ss.remaining_topics[0].topic))
              : '')
            || data.next_question?.topic
            || '';
          const topicHistory = (ss?.session_history || []).filter((h: any) => h.topic === completedName || h.selected_topic === completedName);
          const bloomLevels = [...new Set(topicHistory.map((h: any) => h.blooms_level || h.difficulty_level || 1))];
          const nextGapType = ss?.mastery_profile?.knowledge_gaps?.find(
            (g: any) => (g.topic || g.topic_name) === nextTopicName
          )?.gap_type || 'PARTIAL_GAP';

          localStorage.setItem('assessment_transition', JSON.stringify({
            completedTopic: {
              name: completedName,
              finalMastery: data.mastery_update.current_mastery,
              mastered: true,
              questionsAnswered: topicHistory.length || ss?.total_questions_asked || 0,
              accuracy: data.session_progress?.overall_accuracy || 0,
              bloomLevels: bloomLevels.length > 0 ? bloomLevels : [1],
            },
            nextTopic: {
              name: nextTopicName,
              gap_type: nextGapType,
              startingDifficulty: data.next_question?.difficulty === 'easy' ? 'Easy' : data.next_question?.difficulty === 'medium' ? 'Medium' : 'Easy',
            },
            sessionId: data.session_id || sessionId || 'unknown',
            learnerId: ss?.learner_id || 'unknown',
          }));

          router.push('/assessment/transition');
          return;
        }

        setFeedbackData(feedback);
        setShowFeedback(true);
      } else {
        throw new Error(result.message || 'Failed to submit answer');
      }
    } catch (err: any) {
      console.error('Submit error:', err);
      const fallbackFeedback = {
        is_correct: false,
        partial_credit: false,
        correctness_score: 0,
        evaluation_summary: 'Error submitting answer. Please try again.',
        immediate_feedback: 'There was an error processing your answer.',
        concept_explanation: '',
        correct_explanation: '',
        improvement_tip: '',
        encouragement: 'Keep going!',
        suggested_resources: [],
        mastery_update: {
          topic: sessionData!.currentTopic.name,
          before_mastery: sessionData!.currentTopic.mastery,
          after_mastery: sessionData!.currentTopic.mastery,
          target: 85
        },
        next_action: 'continue' as const,
        question_text: sessionData!.currentQuestion.text,
        learner_answer: answer
      };
      setFeedbackData(fallbackFeedback);
      setShowFeedback(true);
    }
    setIsEvaluating(false);
  };

  const handleRunCode = async () => {
    const question = sessionData!.currentQuestion;
    const isTraceRunner = question.type === "code_tracing";
    const source = isTraceRunner ? traceRunCode : codeAnswer;
    if (!source.trim() || isRunning) return;
    setIsRunning(true);
    setRunResult(null);

    try {
      const storedSession = JSON.parse(localStorage.getItem('assessment_session') || '{}');
      const sid = sessionId || storedSession.session_id || storedSession.sessionId || sessionData!.sessionId;

      const result = await assessmentApi.runCode({
        session_id: sid,
        question_id: question.id,
        code: source,
      });

      const data: any = result.data || result;
      if (result.success !== false && data) {
        setRunResult(data.run_result || null);
      } else {
        throw new Error(result.message || 'Failed to run code');
      }
    } catch (err: any) {
      console.error('Run code error:', err);
      setRunResult({
        attempted: true,
        compiled: false,
        executed_successfully: false,
        status: 'sandbox_unavailable',
        stderr: err?.message || 'Could not reach the code execution service.',
      });
    }
    setIsRunning(false);
  };

  const handleContinue = async () => {
    setShowFeedback(false);
    setSelectedAnswer("");
    setCodeAnswer("");
    setShowHint(0);
    setTimeElapsed(0);
    setRunResult(null);

    const parseOptions = (opts: any): Option[] | undefined => {
      if (!opts) return undefined;
      if (Array.isArray(opts)) {
        if (typeof opts[0] === 'string') {
          return (opts as string[]).map((text, i) => ({ letter: String.fromCharCode(65 + i), text }));
        }
        return opts as Option[];
      }
      return Object.entries(opts).map(([letter, text]) => ({ letter, text: text as string }));
    };

    const applyNextQuestion = (question: any) => {
      const options = parseOptions(question.options);
      const qType = question.question_type || question.type || 'mcq';
      setSessionData(prev => prev ? {
        ...prev,
        currentQuestion: {
          id: question.question_id || question.id || `q-${Date.now()}`,
          number: prev.stats.questionsAsked + 2,
          text: question.question_text || question.text || '',
          type: qType,
          code_snippet: question.code_snippet,
          options,
          requires_sandbox: questionRequiresSandbox(qType, question.requires_sandbox),
          difficulty: question.difficulty || 'Medium',
          topic: question.topic || prev.currentQuestion.topic,
          hints: question.hints || [],
        },
      } : prev);
    };

    const nextQ = localStorage.getItem('assessment_next_question');
    if (nextQ) {
      localStorage.removeItem('assessment_next_question');
      try {
        const question = JSON.parse(nextQ);
        applyNextQuestion(question);
        return;
      } catch {}
    }

    const tryUpdateFromApi = async (sid: string) => {
      try {
        const res = await assessmentApi.getSession(sid);
        if (res.success && res.data) {
          const session = res.data.updated_session || res.data;
          const question = session.current_question || res.data.question;
          if (question) {
            const options = parseOptions(question.options);
            const qType = question.question_type || question.type || 'mcq';

            setSessionData(prev => prev ? {
              ...prev,
              currentTopic: {
                name: question.topic || prev.currentTopic.name,
                mastery: session.current_topic_mastery || prev.currentTopic.mastery,
                status: 'current',
                gap_type: question.gap_type || prev.currentTopic.gap_type,
              },
              currentQuestion: {
                id: question.question_id || question.id || `q-${Date.now()}`,
                number: prev.stats.questionsAsked + 2,
                text: question.question_text || question.text || '',
                type: qType,
                code_snippet: question.code_snippet,
                options,
                requires_sandbox: questionRequiresSandbox(qType, question.requires_sandbox),
                difficulty: question.difficulty || 'Medium',
                topic: question.topic || prev.currentQuestion.topic,
                hints: question.hints || [],
              },
              stats: {
                questionsAsked: session.total_questions_asked || prev.stats.questionsAsked + 1,
                correctAnswers: session.correct_answers || prev.stats.correctAnswers,
                accuracy: session.accuracy_percentage || prev.stats.accuracy,
                streak: session.current_streak || prev.stats.streak,
              },
              remediationMode: session.remediation_mode || false,
            } : prev);
          }
        }
      } catch {}
    };

    if (sessionId) {
      await tryUpdateFromApi(sessionId);
    } else {
      const stored = localStorage.getItem('assessment_session');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const question = parsed.question || parsed.current_question;
          if (question) {
            const options = parseOptions(question.options);
            applyNextQuestion(question);
          }
        } catch {}
      }
    }
  };

  const copyCode = () => {
    if (sessionData?.currentQuestion.code_snippet) {
      navigator.clipboard.writeText(sessionData.currentQuestion.code_snippet);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-foreground/80 font-semibold">Loading assessment session...</p>
        </div>
      </div>
    );
  }

  if (error || !sessionData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-amber-700 dark:text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Session Error</h2>
          <p className="text-muted-foreground mb-6">{error || 'Failed to load session data'}</p>
          <Button onClick={() => router.push('/assessment')} className="bg-primary hover:bg-primary-hover text-primary-foreground">
            Back to Assessment
          </Button>
        </div>
      </div>
    );
  }

  const masteryColors = getMasteryColor(sessionData.currentTopic.mastery);
  const difficultyConfig = getDifficultyConfig(sessionData.currentQuestion.difficulty);
  const typeConfig = getTypeConfig(sessionData.currentQuestion.type);
  const requiresSandbox = questionRequiresSandbox(
    sessionData.currentQuestion.type,
    sessionData.currentQuestion.requires_sandbox
  );
  const isCodeAnswerType =
    sessionData.currentQuestion.type === "code_completion" ||
    sessionData.currentQuestion.type === "debugging" ||
    sessionData.currentQuestion.type === "coding_challenge";
  const isTraceQuestion = sessionData.currentQuestion.type === "code_tracing";
  const runSource = isTraceQuestion ? traceRunCode : codeAnswer;

  const runCodeButton = (
    <Button
      onClick={handleRunCode}
      disabled={isRunning || isEvaluating || !runSource.trim()}
      variant="outline"
      className="border-teal-500/40 text-teal-700 dark:text-teal-300 hover:bg-teal-500/10 px-5 py-2 font-semibold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
    >
      {isRunning ? (
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 border-2 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" />
          <span className="text-sm">Running...</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Play className="w-3.5 h-3.5" />
          <span className="text-sm">Run Code</span>
        </div>
      )}
    </Button>
  );

  const consoleOutput = (isRunning || runResult) && (
    <div className="rounded-xl border border-border bg-background overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-muted border-b border-border">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-teal-700 dark:text-teal-400" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Console Output
          </span>
        </div>
        {runResult?.status && (
          <Badge
            variant="outline"
            className={
              runResult.executed_successfully
                ? "border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                : "border-red-500/30 text-red-700 dark:text-red-400"
            }
          >
            {runResult.status}
          </Badge>
        )}
      </div>
      <div className="p-4 max-h-64 overflow-y-auto font-mono text-sm space-y-3">
        {isRunning && (
          <p className="text-subtle-foreground flex items-center gap-2">
            <span className="w-3 h-3 border-2 border-teal-400/30 border-t-teal-400 rounded-full animate-spin inline-block" />
            Compiling &amp; executing your code...
          </p>
        )}
        {!isRunning && runResult && (
          <>
            {runResult.compile_output && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1">Compile Output</p>
                <pre className="whitespace-pre-wrap break-words text-amber-700 dark:text-amber-300 leading-relaxed">{runResult.compile_output}</pre>
              </div>
            )}
            {runResult.stdout && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1">stdout</p>
                <pre className="whitespace-pre-wrap break-words text-foreground leading-relaxed">{runResult.stdout}</pre>
              </div>
            )}
            {runResult.stderr && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-red-700 dark:text-red-400 mb-1">stderr</p>
                <pre className="whitespace-pre-wrap break-words text-red-700 dark:text-red-300 leading-relaxed">{runResult.stderr}</pre>
              </div>
            )}
            {!runResult.stdout && !runResult.stderr && !runResult.compile_output && (
              <p className="text-subtle-foreground italic">No output produced.</p>
            )}
            {(runResult.time_seconds || runResult.memory_kb) && (
              <p className="text-subtle-foreground/70 text-xs pt-1 border-t border-border">
                {runResult.time_seconds ? `Time: ${runResult.time_seconds}s` : ''}
                {runResult.time_seconds && runResult.memory_kb ? ' · ' : ''}
                {runResult.memory_kb ? `Memory: ${runResult.memory_kb} KB` : ''}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      <div className="w-72 bg-card/95 backdrop-blur-xl border-r border-border p-5 overflow-y-auto flex flex-col">
        {/* Session Info Card */}
        <div className="mb-6 bg-background rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-teal-500/10">
              <Target className="w-4 h-4 text-teal-700 dark:text-teal-400" />
            </div>
            <span className="text-xs font-bold text-subtle-foreground uppercase tracking-wider">Assessment Session</span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-subtle-foreground uppercase tracking-wider">Learner</span>
                <button
                  onClick={() => navigator.clipboard.writeText(sessionData.learnerId)}
                  className="p-0.5 hover:bg-muted rounded transition-colors"
                  title="Copy Learner ID"
                >
                  <Copy className="w-3 h-3 text-subtle-foreground hover:text-muted-foreground" />
                </button>
              </div>
              <p className="text-xs text-foreground/80 font-mono bg-muted rounded px-2 py-1.5 truncate">
                {sessionData.learnerId}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-subtle-foreground uppercase tracking-wider">Session ID</span>
                <button
                  onClick={() => navigator.clipboard.writeText(sessionData.sessionId)}
                  className="p-0.5 hover:bg-muted rounded transition-colors"
                  title="Copy Session ID"
                >
                  <Copy className="w-3 h-3 text-subtle-foreground hover:text-muted-foreground" />
                </button>
              </div>
              <p className="text-xs text-foreground/80 font-mono bg-muted rounded px-2 py-1.5 truncate">
                {sessionData.sessionId}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8 text-center">
          <div className="relative w-24 h-24 mx-auto mb-4">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831a15.9155 15.9155 0 0 1 0-31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-subtle-foreground/70"
              />
              <path
                d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831a15.9155 15.9155 0 0 1 0-31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray={`${sessionData.currentTopic.mastery}, 100`}
                className={masteryColors.ring}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-2xl font-extrabold ${masteryColors.text}`}>{sessionData.currentTopic.mastery}%</span>
              <span className="text-[10px] text-subtle-foreground">Mastery</span>
            </div>
          </div>
          <h4 className="text-foreground font-bold text-sm mb-1">{sessionData.currentTopic.name}</h4>
          <div className="flex items-center justify-center gap-2">
            <div className={`w-2 h-2 rounded-full ${masteryColors.bg}`} />
            <span className="text-xs text-muted-foreground">Target: 85%</span>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-subtle-foreground uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5" />
              Topic Progress
            </h4>
          </div>
          <div className="space-y-1.5">
            {sessionData.allTopics.map((topic, index) => {
              const isCurrent = topic.status === "current";
              const isMastered = topic.status === "mastered";
              const colors = getMasteryColor(topic.mastery);
              return (
                <div
                  key={index}
                  className={`rounded-xl transition-all ${
                    isCurrent
                      ? "bg-blue-500/8 border border-blue-500/15"
                      : "border border-transparent"
                  }`}
                >
                  <div className="p-2.5">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      {getTopicIcon(topic.status)}
                      <p className={`text-xs font-semibold truncate ${
                        isCurrent ? "text-foreground" :
                        isMastered ? "text-emerald-700 dark:text-emerald-400" : "text-subtle-foreground"
                      }`}>
                        {topic.name}
                      </p>
                      {isCurrent && (
                        <span className="ml-auto px-1.5 py-0.5 bg-blue-500/15 text-blue-700 dark:text-blue-300 text-[9px] font-bold uppercase tracking-wider rounded">Current</span>
                      )}
                      {isMastered && (
                        <span className="ml-auto px-1.5 py-0.5 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-[9px] font-bold uppercase tracking-wider rounded">Done</span>
                      )}
                      {topic.status === "pending" && (
                        <span className="ml-auto text-[9px] text-subtle-foreground font-medium">Pending</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 pl-7">
                      <div className="flex-1 h-1.5 bg-background rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isMastered ? "bg-emerald-500" : isCurrent ? colors.bg : "bg-surface-3"
                          }`}
                          style={{ width: `${topic.mastery}%` }}
                        />
                      </div>
                      <span className={`text-[10px] font-bold ${
                        topic.mastery >= 85 ? "text-emerald-700 dark:text-emerald-400" :
                        topic.mastery > 0 ? "text-muted-foreground" : "text-subtle-foreground/70"
                      }`}>
                        {topic.mastery}%
                      </span>
                    </div>
                    {isCurrent && topic.mastery < 85 && (
                      <p className="text-[9px] text-subtle-foreground/70 pl-7 mt-1">
                        {85 - topic.mastery}% to target
                      </p>
                    )}
                    {isCurrent && topic.mastery >= 85 && (
                      <p className="text-[9px] text-emerald-700 dark:text-emerald-400/60 pl-7 mt-1 font-medium">
                        Target reached!
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-auto space-y-4">
          <div className="bg-background rounded-xl p-4 border border-border">
            <h4 className="text-xs font-bold text-subtle-foreground uppercase tracking-wider mb-3">Session Stats</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <p className="text-xl font-extrabold text-foreground">{sessionData.stats.questionsAsked}</p>
                <p className="text-[10px] text-subtle-foreground uppercase">Asked</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400">{sessionData.stats.correctAnswers}</p>
                <p className="text-[10px] text-subtle-foreground uppercase">Correct</p>
              </div>
              <div className="text-center">
                <p className={`text-xl font-extrabold ${
                  sessionData.stats.accuracy >= 70 ? "text-emerald-700 dark:text-emerald-400" :
                  sessionData.stats.accuracy >= 40 ? "text-amber-700 dark:text-amber-400" : "text-red-700 dark:text-red-400"
                }`}>{sessionData.stats.accuracy}%</p>
                <p className="text-[10px] text-subtle-foreground uppercase">Accuracy</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-extrabold text-blue-700 dark:text-blue-400">{sessionData.stats.streak}</p>
                <p className="text-[10px] text-subtle-foreground uppercase">Streak</p>
              </div>
            </div>
          </div>

          <div className="bg-background rounded-xl p-4 border border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-subtle-foreground" />
              <span className="text-xs text-subtle-foreground uppercase">Time</span>
            </div>
            <span className="text-lg font-mono font-bold text-teal-700 dark:text-teal-400">{formatTime(timeElapsed)}</span>
          </div>
        </div>

        {sessionData.remediationMode && (
          <div className="mt-4 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              <p className="text-amber-700 dark:text-amber-300 font-semibold text-xs">Remediation Active</p>
            </div>
            <p className="text-amber-800 dark:text-amber-200/70 text-[11px]">Extra support enabled</p>
          </div>
        )}
      </div>

      <div className="flex-1 p-8 overflow-y-auto">
        {showFeedback && feedbackData ? (
          <div className="max-w-4xl mx-auto">
            <FeedbackPanel data={feedbackData} onNext={handleContinue} />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6 flex-wrap">
                <Badge className={difficultyConfig.color}>
                  <div className={`w-1.5 h-1.5 rounded-full ${difficultyConfig.dot} mr-1.5`} />
                  {sessionData.currentQuestion.difficulty}
                </Badge>
                <Badge className={typeConfig.color}>
                  {typeConfig.label}
                </Badge>
                <Badge variant="outline" className="border-teal-500/30 text-teal-700 dark:text-teal-300">
                  {sessionData.currentQuestion.topic}
                </Badge>
                <span className="text-sm text-subtle-foreground ml-auto">
                  Question {sessionData.currentQuestion.number}
                </span>
              </div>

              <Card className="bg-card/90 backdrop-blur-xl border-border shadow-raised">
                <CardContent className="p-8">
                  <div className="mb-8">
                      <h2 className="text-base font-medium text-foreground leading-relaxed">
                        {sessionData.currentQuestion.text}
                      </h2>
                  </div>

                  {sessionData.currentQuestion.code_snippet && (
                    <div className="mb-8 bg-background rounded-xl border border-border overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-2 bg-muted border-b border-border">
                        <div className="flex items-center gap-2">
                          <Code className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Code</span>
                        </div>
                        <button
                          onClick={copyCode}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-muted hover:bg-surface-3 text-muted-foreground hover:text-foreground transition-all text-xs"
                        >
                          <Copy className="w-3 h-3" />
                          Copy
                        </button>
                      </div>
                      <pre className="p-4 text-emerald-700 dark:text-emerald-400 text-sm overflow-x-auto font-mono whitespace-pre-wrap break-words leading-relaxed">
                        <code>{sessionData.currentQuestion.code_snippet}</code>
                      </pre>
                    </div>
                  )}

                  <div className="mb-8">
                    {sessionData.currentQuestion.type === "mcq" && sessionData.currentQuestion.options && (
                      <div className="space-y-3">
                        {sessionData.currentQuestion.options.map((option) => (
                          <button
                            key={option.letter}
                            onClick={() => setSelectedAnswer(option.letter)}
                            className={`w-full p-5 rounded-xl border-2 text-left transition-all ${
                              selectedAnswer === option.letter
                                ? "border-teal-500 bg-teal-500/10 text-foreground "
                                : "border-border bg-muted text-foreground/80 hover:border-teal-500/30 hover:bg-teal-500/5"
                            }`}
                            disabled={isEvaluating}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all ${
                                selectedAnswer === option.letter
                                  ? "border-teal-500 bg-primary text-primary-foreground"
                                  : "border-border-strong text-subtle-foreground"
                              }`}>
                                {option.letter}
                              </div>
                              <span className="font-medium">{option.text}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {isCodeAnswerType && (
                      <div>
                        {requiresSandbox ? (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between gap-4 flex-wrap">
                              <p className="text-foreground/80 text-sm">
                                Write your solution in the editor and test it before submitting:
                              </p>
                              {runCodeButton}
                            </div>

                            <SandboxCodeEditor
                              value={codeAnswer}
                              onChange={setCodeAnswer}
                              readOnly={isEvaluating || isRunning}
                            />

                            {consoleOutput}

                            <p className="text-subtle-foreground text-xs">
                              Running your code executes it in a secure sandbox — it does not submit or grade your answer.
                            </p>
                          </div>
                        ) : (
                          <textarea
                            value={codeAnswer}
                            onChange={(e) => setCodeAnswer(e.target.value)}
                            placeholder={
                              sessionData.currentQuestion.type === "code_completion"
                                ? "// Complete the missing code here..."
                                : sessionData.currentQuestion.type === "debugging"
                                ? "// Fix the bugs in the code above..."
                                : "// Write your complete solution here..."
                            }
                            className="w-full h-52 bg-background border border-border rounded-xl p-5 text-emerald-700 dark:text-emerald-400 font-mono text-sm resize-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 focus:outline-none transition-all"
                            disabled={isEvaluating}
                          />
                        )}
                      </div>
                    )}

                    {isTraceQuestion && (
                      <div className="space-y-5">
                        <div>
                          <p className="text-foreground/80 text-sm mb-3">Trace through the code and write the expected output:</p>
                          <textarea
                            value={codeAnswer}
                            onChange={(e) => setCodeAnswer(e.target.value)}
                            placeholder="Enter expected output..."
                            className="w-full h-32 bg-background border border-border rounded-xl p-5 text-foreground font-mono text-sm resize-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 focus:outline-none transition-all"
                            disabled={isEvaluating}
                          />
                        </div>

                        {sessionData.currentQuestion.code_snippet && (
                          <div className="space-y-4 pt-5 border-t border-border">
                            <div className="flex items-center justify-between gap-4 flex-wrap">
                              <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                                <Terminal className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
                                Sandbox — run the provided snippet to verify your trace
                              </p>
                              {runCodeButton}
                            </div>

                            <SandboxCodeEditor
                              value={traceRunCode}
                              onChange={setTraceRunCode}
                              readOnly={isEvaluating || isRunning}
                            />

                            {consoleOutput}

                            <p className="text-subtle-foreground text-xs">
                              Runs the provided snippet in a secure sandbox — only your traced output above is submitted for grading.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mb-8">
                    <button
                      onClick={() => setShowHint(prev => prev < sessionData.currentQuestion.hints.length ? prev + 1 : prev)}
                      className="flex items-center gap-2 text-teal-700 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors group"
                      disabled={isEvaluating}
                    >
                      <div className="p-2 rounded-lg bg-teal-500/10 group-hover:bg-teal-500/20 transition-colors">
                        <Lightbulb className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium">
                        {showHint === 0 ? "Need a hint?" :
                         showHint < sessionData.currentQuestion.hints.length ? `Hint ${showHint} of ${sessionData.currentQuestion.hints.length}` :
                         "All hints revealed"}
                      </span>
                    </button>

                    {showHint > 0 && (
                      <div className="mt-4 space-y-3">
                        {sessionData.currentQuestion.hints.slice(0, showHint).map((hint, index) => (
                          <div key={index} className="flex items-start gap-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                            <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                              <span className="text-amber-700 dark:text-amber-400 text-xs font-bold">{index + 1}</span>
                            </div>
                            <p className="text-amber-800 dark:text-amber-200/90 text-sm">{hint}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-border">
                    <div className="flex items-center gap-2 text-xs text-subtle-foreground">
                      <Zap className="w-3.5 h-3.5" />
                      <span>AI-powered evaluation</span>
                    </div>
                    <Button
                      onClick={handleSubmit}
                      disabled={
                        isEvaluating ||
                        (sessionData.currentQuestion.type === "mcq" && !selectedAnswer) ||
                        (sessionData.currentQuestion.type !== "mcq" && !codeAnswer.trim())
                      }
                      className="bg-primary hover:bg-primary-hover text-primary-foreground px-8 py-3 font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-raised "
                    >
                      {isEvaluating ? (
                        <div className="flex items-center gap-2.5">
                          <div className="w-4 h-4 border-2 border-border-strong border-t-white rounded-full animate-spin" />
                          <span className="text-sm">
                            {sessionData.currentQuestion.type === "mcq"
                              ? "Checking answer..."
                              : "Evaluating code... (30-90s)"}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2.5">
                          <Send className="w-4 h-4" />
                          <span className="text-sm">Submit Answer</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
