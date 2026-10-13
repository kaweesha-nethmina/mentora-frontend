"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, X, Target, TrendingUp, Award, Clock, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { assessmentApi } from "@/lib/api/assessment";

interface TopicSummary {
  name: string;
  finalMastery: number;
  questionsAnswered: number;
  accuracy: number;
  status: "mastered" | "needs_work";
}

interface QASummary {
  number: number;
  topic: string;
  difficulty: string;
  questionText: string;
  learnerAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

interface SummaryData {
  overallMastery: number;
  overallAccuracy: number;
  totalQuestions: number;
  sessionDuration: number; // in minutes
  overallGrade: string;
  topics: TopicSummary[];
  qaReview: QASummary[];
  sessionId: string;
  learnerId: string;
}

export default function SummaryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');

  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQAReview, setShowQAReview] = useState(true);

  useEffect(() => {
    const computeGrade = (mastery: number) => {
      if (mastery >= 85) return 'Excellent';
      if (mastery >= 70) return 'Good';
      if (mastery >= 55) return 'Satisfactory';
      return 'Needs Improvement';
    };

    const buildFromSessionSummary = (ss: any, learnerId: string, qaReview: any[]) => {
      const topics = (ss.topics_covered || []).map((t: any) => ({
        name: t.topic || 'Unknown',
        finalMastery: t.mastery_score || 0,
        questionsAnswered: t.questions_asked || 0,
        accuracy: t.accuracy || 0,
        status: t.is_mastered ? 'mastered' as const : 'needs_work' as const,
      }));

      setData({
        overallMastery: ss.overall_mastery || 0,
        overallAccuracy: ss.overall_accuracy || 0,
        totalQuestions: ss.total_questions || 0,
        sessionDuration: ss.session_duration_minutes || 0,
        overallGrade: computeGrade(ss.overall_mastery || 0),
        topics,
        qaReview: (qaReview || []).map((q: any) => ({
          number: q.question_number || 0,
          topic: q.topic || '',
          difficulty: q.difficulty || 'Medium',
          questionText: q.question_text || q.question || '',
          learnerAnswer: q.learner_answer || q.submitted_answer || '',
          correctAnswer: q.correct_answer || '',
          isCorrect: q.is_correct ?? false,
        })),
        sessionId: ss.session_id || 'Unknown',
        learnerId,
      });
      setLoading(false);
    };

    const loadData = async () => {
      try {
        const sid = sessionId || JSON.parse(localStorage.getItem('assessment_session') || '{}').session_id;

        // 1) Try localStorage session_summary (saved during submit-answer)
        const storedSummary = localStorage.getItem('assessment_session_summary');
        if (storedSummary) {
          const ss = JSON.parse(storedSummary);
          const learnerId = JSON.parse(localStorage.getItem('user') || '{}').student_id || 'Unknown';
          const storedQaReview = localStorage.getItem('assessment_qa_review');
          const qa = storedQaReview ? JSON.parse(storedQaReview) : [];
          buildFromSessionSummary(ss, learnerId, qa);
          return;
        }

        // 2) Try feedback report API
        if (sid) {
          const fbRes = await assessmentApi.getFeedbackReport(sid);
          if (fbRes.success && fbRes.data) {
            const ss = fbRes.data.session_summary || {};
            const learnerId = fbRes.data.learner_id || 'Unknown';
            const qa = fbRes.data.full_qa_review || [];
            buildFromSessionSummary(ss, learnerId, qa);
            return;
          }
        }

        // 3) Try getSession API
        if (sid) {
          const res = await assessmentApi.getSession(sid);
          if (res.success && res.data) {
            const session = res.data.updated_session || res.data;
            const feedbackReport = res.data.feedback_report || session.feedback_report;
            const topics = session.all_topics || session.topics || [];
            const qaReview = feedbackReport?.full_qa_review || session.session_history || [];

            setData({
              overallMastery: feedbackReport?.overall_mastery_percentage ?? session.current_topic_mastery ?? 0,
              overallAccuracy: feedbackReport?.overall_accuracy_percentage ?? session.accuracy_percentage ?? 0,
              totalQuestions: feedbackReport?.total_questions ?? session.total_questions_asked ?? qaReview.length ?? 0,
              sessionDuration: feedbackReport?.session_duration_minutes ?? session.duration_minutes ?? 0,
              overallGrade: feedbackReport?.overall_grade ?? 'Completed',
              topics: topics.map((t: any) => ({
                name: t.name || t.topic_name || t.topic || 'Unknown',
                finalMastery: t.mastery || t.mastery_percentage || 0,
                questionsAnswered: t.questions_asked || 0,
                accuracy: t.accuracy_percentage || 0,
                status: (t.mastery || 0) >= 85 ? 'mastered' : 'needs_work',
              })),
              qaReview: qaReview.map((q: any) => ({
                number: q.question_number || 0,
                topic: q.topic || '',
                difficulty: q.difficulty || 'Medium',
                questionText: q.question_text || q.question || '',
                learnerAnswer: q.learner_answer || q.submitted_answer || '',
                correctAnswer: q.correct_answer || '',
                isCorrect: q.is_correct ?? false,
              })),
              sessionId: sid,
              learnerId: session.learner_id || res.data.learner_id || 'Unknown',
            });
            setLoading(false);
            return;
          }
        }
      } catch {}

      // 4) Final fallback — localStorage assessment_qa
      const qaItems = JSON.parse(localStorage.getItem('assessment_qa') || '[]');
      if (qaItems.length > 0) {
        const correct = qaItems.filter((q: any) => q.is_correct).length;
        const topicNames = [...new Set(qaItems.map((q: any) => q.topic))] as string[];
        const topics = topicNames.map((t: string) => {
          const items = qaItems.filter((q: any) => q.topic === t);
          const correctCount = items.filter((q: any) => q.is_correct).length;
          return {
            name: t,
            finalMastery: Math.round((correctCount / items.length) * 100),
            questionsAnswered: items.length,
            accuracy: Math.round((correctCount / items.length) * 100),
            status: (correctCount / items.length) >= 0.85 ? 'mastered' as const : 'needs_work' as const,
          };
        });

        setData({
          overallMastery: Math.round((correct / qaItems.length) * 100),
          overallAccuracy: Math.round((correct / qaItems.length) * 100),
          totalQuestions: qaItems.length,
          sessionDuration: 0,
          overallGrade: (correct / qaItems.length) >= 0.85 ? 'Excellent' : (correct / qaItems.length) >= 0.7 ? 'Good' : 'Satisfactory',
          topics,
          qaReview: qaItems.map((q: any) => ({
            number: q.number,
            topic: q.topic,
            difficulty: q.difficulty,
            questionText: q.question,
            learnerAnswer: q.learner_answer,
            correctAnswer: q.correct_answer,
            isCorrect: q.is_correct,
          })),
          sessionId: 'local',
          learnerId: JSON.parse(localStorage.getItem('user') || '{}').student_id || 'Unknown',
        });
      }
      setLoading(false);
    };

    loadData();
  }, [sessionId]);

  const onViewReport = () => {
    const sid = sessionId || JSON.parse(localStorage.getItem('assessment_session') || '{}').session_id;
    router.push(`/assessment/report${sid ? `?sessionId=${sid}` : ''}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-card via-muted to-card flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-teal-700 dark:text-teal-400 animate-spin mx-auto mb-4" />
          <p className="text-foreground/80 font-semibold">Loading summary...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-card via-muted to-card flex items-center justify-center">
        <div className="text-center max-w-md">
          <Loader2 className="w-12 h-12 text-teal-700 dark:text-teal-400 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">No Summary Available</h2>
          <p className="text-muted-foreground mb-6">Complete an assessment session to see your summary.</p>
          <Button onClick={() => router.push('/assessment')} className="bg-primary hover:bg-primary-hover text-primary-foreground">
            Go to Assessment
          </Button>
        </div>
      </div>
    );
  }

  const gradeBanner = (() => {
    if (data.overallMastery >= 85) {
      return {
        title: "Outstanding Performance",
        color: "text-green-700 dark:text-green-400",
        bgColor: "bg-green-500/10 border-green-500/30"
      };
    } else if (data.overallMastery >= 70) {
      return {
        title: "Good Performance",
        color: "text-blue-700 dark:text-blue-400",
        bgColor: "bg-blue-500/10 border-blue-500/30"
      };
    } else if (data.overallMastery >= 55) {
      return {
        title: "Satisfactory Performance",
        color: "text-yellow-700 dark:text-yellow-400",
        bgColor: "bg-yellow-500/10 border-yellow-500/30"
      };
    } else {
      return {
        title: "Needs Further Practice",
        color: "text-red-700 dark:text-red-400",
        bgColor: "bg-red-500/10 border-red-500/30"
      };
    }
  })();

  const masteredTopics = data.topics.filter(t => t.status === "mastered");
  const needsWorkTopics = data.topics.filter(t => t.status === "needs_work");

  return (
    <div className="min-h-screen bg-gradient-to-br from-card via-muted to-card p-6">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-foreground">Session Complete</h1>
          <p className="text-muted-foreground">Session {data.sessionId} • Learner {data.learnerId}</p>
        </div>

        {/* Hero Result Banner */}
        <Card className={gradeBanner.bgColor}>
          <CardContent className="p-8 text-center">
            <h2 className={`text-4xl font-bold mb-2 ${gradeBanner.color}`}>{gradeBanner.title}</h2>
            <p className="text-muted-foreground text-lg">Overall Grade: {data.overallGrade}</p>
          </CardContent>
        </Card>

        {/* Four Key Statistics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-muted/50 border-border">
            <CardContent className="p-6 text-center">
              <Target className="w-8 h-8 text-teal-700 dark:text-teal-400 mx-auto mb-2" />
              <p className="text-3xl font-bold text-foreground">{data.overallMastery}%</p>
              <p className="text-muted-foreground text-sm">Overall Mastery</p>
            </CardContent>
          </Card>

          <Card className="bg-muted/50 border-border">
            <CardContent className="p-6 text-center">
              <TrendingUp className="w-8 h-8 text-teal-700 dark:text-teal-400 mx-auto mb-2" />
              <p className="text-3xl font-bold text-foreground">{data.overallAccuracy}%</p>
              <p className="text-muted-foreground text-sm">Overall Accuracy</p>
            </CardContent>
          </Card>

          <Card className="bg-muted/50 border-border">
            <CardContent className="p-6 text-center">
              <Award className="w-8 h-8 text-teal-700 dark:text-teal-400 mx-auto mb-2" />
              <p className="text-3xl font-bold text-foreground">{data.totalQuestions}</p>
              <p className="text-muted-foreground text-sm">Total Questions</p>
            </CardContent>
          </Card>

          <Card className="bg-muted/50 border-border">
            <CardContent className="p-6 text-center">
              <Clock className="w-8 h-8 text-teal-700 dark:text-teal-400 mx-auto mb-2" />
              <p className="text-3xl font-bold text-foreground">{data.sessionDuration}</p>
              <p className="text-muted-foreground text-sm">Minutes</p>
            </CardContent>
          </Card>
        </div>

        {/* Topic-by-topic Performance Table */}
        <Card className="bg-muted/50 border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Topic Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topics.map((topic, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-surface-3/30 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-foreground font-semibold">{topic.name}</h4>
                      <Badge className={topic.status === "mastered" ? "bg-green-500" : "bg-red-500"}>
                        {topic.status === "mastered" ? "Mastered ✓" : "Needs Work"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{topic.questionsAnswered} questions</span>
                      <span>{topic.accuracy}% accuracy</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="w-24 bg-slate-600 rounded-full h-2 mb-1">
                      <div
                        className={`h-2 rounded-full ${topic.finalMastery >= 85 ? 'bg-green-500' : topic.finalMastery >= 60 ? 'bg-blue-500' : topic.finalMastery >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${topic.finalMastery}%` }}
                      />
                    </div>
                    <p className="text-foreground font-bold">{topic.finalMastery}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Mastered vs Needs Work */}
        <div className="grid md:grid-cols-2 gap-6">

          <Card className="bg-green-500/10 border-green-500/30">
            <CardHeader>
              <CardTitle className="text-green-700 dark:text-green-300 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Topics Mastered
              </CardTitle>
            </CardHeader>
            <CardContent>
              {masteredTopics.length > 0 ? (
                <ul className="space-y-2">
                  {masteredTopics.map((topic, index) => (
                    <li key={index} className="text-green-800 dark:text-green-200 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      {topic.name}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-green-800 dark:text-green-200/70">No topics mastered yet</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-red-500/10 border-red-500/30">
            <CardHeader>
              <CardTitle className="text-red-700 dark:text-red-300 flex items-center gap-2">
                <X className="w-5 h-5" />
                Topics for Further Study
              </CardTitle>
            </CardHeader>
            <CardContent>
              {needsWorkTopics.length > 0 ? (
                <ul className="space-y-2">
                  {needsWorkTopics.map((topic, index) => (
                    <li key={index} className="text-red-800 dark:text-red-200 flex items-center gap-2">
                      <X className="w-4 h-4" />
                      {topic.name}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-red-800 dark:text-red-200/70">All topics mastered!</p>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Q&A Review Table */}
        <Card className="bg-muted/50 border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center justify-between">
              <span>Q&A Review</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowQAReview(!showQAReview)}
                className="text-muted-foreground hover:text-foreground"
              >
                {showQAReview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CardTitle>
          </CardHeader>
          {showQAReview && (
            <CardContent>
              <div className="space-y-4">
                {data.qaReview.map((qa, index) => (
                  <div key={index} className="border border-border-strong rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground font-mono">#{qa.number}</span>
                        <Badge variant="outline" className="border-slate-500 text-muted-foreground">
                          {qa.topic}
                        </Badge>
                        <Badge className={`${
                          qa.difficulty === "Easy" ? "bg-green-500" :
                          qa.difficulty === "Medium" ? "bg-yellow-500" : "bg-red-500"
                        } text-foreground`}>
                          {qa.difficulty}
                        </Badge>
                        {qa.isCorrect ? (
                          <CheckCircle className="w-4 h-4 text-green-700 dark:text-green-400" />
                        ) : (
                          <X className="w-4 h-4 text-red-700 dark:text-red-400" />
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-foreground font-medium">{qa.questionText}</p>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Your answer:</p>
                          <p className={`font-mono p-2 rounded ${qa.isCorrect ? 'bg-green-500/10 text-green-800 dark:text-green-200' : 'bg-red-500/10 text-red-800 dark:text-red-200'}`}>
                            {qa.learnerAnswer}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Correct answer:</p>
                          <p className="font-mono p-2 rounded bg-surface-3/50 text-foreground/90">
                            {qa.correctAnswer}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>

        {/* AI Feedback Report */}
        <Card className="bg-muted/50 border-border">
          <CardContent className="p-8 text-center">
            <h3 className="text-foreground font-semibold text-lg mb-4">AI Feedback Report</h3>
            <p className="text-muted-foreground mt-2 mb-6">
              View your personalized AI-generated feedback report with detailed topic analysis.
            </p>
            <Button
              onClick={onViewReport}
              className="bg-primary hover:bg-primary-hover text-primary-foreground px-6 py-3 font-semibold rounded-lg"
            >
              View My Assessment Report →
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}