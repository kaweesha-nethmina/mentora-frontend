"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Target,
  TrendingUp,
  Award,
  Clock,
  BookOpen,
  Lightbulb,
  CheckCircle,
  X,
  Code,
  ExternalLink,
  Download,
  RotateCcw,
  Heart,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { assessmentApi } from "@/lib/api/assessment";

interface TopicReport {
  topic_name: string;
  mastery_percentage: number;
  questions_asked: number;
  correct_answers: number;
  accuracy_percentage: number;
  strengths: string[];
  weaknesses: string[];
  misconceptions_found: string[];
  improvement_plan: string;
  recommended_exercises: string[];
  estimated_study_hours: number;
}

interface QAExplanation {
  question_number: number;
  question_text: string;
  learner_answer: string;
  correct_answer: string;
  type: string;
  concept_explanation: string;
  why_correct_answer: string;
  common_mistake: string;
  learning_tip: string;
}

interface LearningPath {
  immediate_focus: string;
  week_1_goals: string[];
  week_2_4_goals: string[];
  long_term_goals: string[];
}

interface Resource {
  topic: string;
  name: string;
  type: string;
  url_hint: string;
}

interface ReportData {
  report_title: string;
  learner_id: string;
  session_id: string;
  generated_at: string;
  overall_grade: string;
  overall_assessment: string;
  overall_mastery_percentage: number;
  overall_accuracy_percentage: number;
  total_questions: number;
  session_duration_minutes: number;
  topic_reports: TopicReport[];
  qa_with_explanations: QAExplanation[];
  key_strengths: string[];
  key_weaknesses: string[];
  misconceptions_to_address: string[];
  learning_path: LearningPath;
  recommended_resources: Resource[];
  practice_project_suggestion: string;
  next_assessment_recommendation: string;
  motivational_message: string;
}

export default function ReportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');

  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReport = async () => {
      try {
        let storedReport = localStorage.getItem('assessment_feedback_report');
        let storedQaReview = localStorage.getItem('assessment_qa_review');

        if (storedReport) {
          const report = JSON.parse(storedReport);
          const currentLearnerId = JSON.parse(localStorage.getItem('user') || '{}').student_id;
          const belongsToCurrentUser = !currentLearnerId || !report.learner_id || report.learner_id === currentLearnerId;

          if (!belongsToCurrentUser) {
            localStorage.removeItem('assessment_feedback_report');
            localStorage.removeItem('assessment_qa_review');
            localStorage.removeItem('assessment_session_summary');
            storedReport = null;
            storedQaReview = null;
          }
        }

        if (storedReport) {
          const report = JSON.parse(storedReport);
          const qaReview = storedQaReview ? JSON.parse(storedQaReview) : [];

          const topicNames = [...new Set(qaReview.map((q: any) => q.topic).filter(Boolean))] as string[];
          const rawTopics = report.topic_reports || [];
          const topicReports = topicNames.map((name: string) => {
            const items = qaReview.filter((q: any) => q.topic === name);
            const correct = items.filter((q: any) => q.is_correct).length;
            const extra = rawTopics.find((t: any) =>
              (t.topic_name || t.topic || t.name || '').toLowerCase() === name.toLowerCase()
            ) || {};
            return {
              topic_name: name,
              mastery_percentage: extra.mastery_percentage ?? extra.mastery ?? (items.length > 0 ? Math.round((correct / items.length) * 100) : 0),
              questions_asked: extra.questions_asked ?? extra.questions ?? extra.total_questions ?? items.length,
              correct_answers: extra.correct_answers ?? extra.correct ?? extra.total_correct ?? correct,
              accuracy_percentage: extra.accuracy_percentage ?? extra.accuracy ?? (items.length > 0 ? Math.round((correct / items.length) * 100) : 0),
              strengths: Array.isArray(extra.strengths) ? extra.strengths : (Array.isArray(extra.topic_strengths) ? extra.topic_strengths : []),
              weaknesses: Array.isArray(extra.weaknesses) ? extra.weaknesses : (Array.isArray(extra.topic_weaknesses) ? extra.topic_weaknesses : []),
              misconceptions_found: Array.isArray(extra.misconceptions_found) ? extra.misconceptions_found : (Array.isArray(extra.misconceptions) ? extra.misconceptions : []),
              improvement_plan: extra.improvement_plan || extra.improvement_roadmap || '',
              recommended_exercises: Array.isArray(extra.recommended_exercises) ? extra.recommended_exercises : (Array.isArray(extra.exercises) ? extra.exercises : []),
              estimated_study_hours: extra.estimated_study_hours ?? extra.study_hours ?? 0,
            };
          });

          setData({
            report_title: report.report_title || "Java Programming Assessment — Personalized Feedback Report",
            learner_id: report.learner_id || 'Unknown',
            session_id: report.session_id || 'Unknown',
            generated_at: report.generated_at || new Date().toISOString(),
            overall_grade: report.overall_grade || 'Completed',
            overall_assessment: report.overall_assessment || 'Assessment completed successfully.',
            overall_mastery_percentage: report.overall_mastery_percentage ?? 0,
            overall_accuracy_percentage: report.overall_accuracy_percentage ?? 0,
            total_questions: report.total_questions ?? qaReview.length ?? 0,
            session_duration_minutes: report.session_duration_minutes ?? 0,
            topic_reports: topicReports,
            qa_with_explanations: (qaReview || []).map((q: any) => ({
              question_number: q.question_number || 0,
              question_text: q.question_text || '',
              learner_answer: q.learner_answer || '',
              correct_answer: q.correct_answer || '',
              type: q.question_type || q.type || '',
              concept_explanation: '',
              why_correct_answer: '',
              common_mistake: '',
              learning_tip: '',
            })),
            key_strengths: report.key_strengths || [],
            key_weaknesses: report.key_weaknesses || [],
            misconceptions_to_address: report.misconceptions_to_address || [],
            learning_path: {
              immediate_focus: report.learning_path?.immediate_focus || 'Review topics needing improvement',
              week_1_goals: report.learning_path?.week_1_goals || [],
              week_2_4_goals: report.learning_path?.week_2_4_goals || [],
              long_term_goals: typeof report.learning_path?.long_term_goals === 'string'
                ? [report.learning_path.long_term_goals]
                : (report.learning_path?.long_term_goals || []),
            },
            recommended_resources: report.recommended_resources || [],
            practice_project_suggestion: report.practice_project_suggestion || '',
            next_assessment_recommendation: report.next_assessment_recommendation || '',
            motivational_message: report.motivational_message || 'Great effort! Keep learning.',
          });
          setLoading(false);
          return;
        }

        let sid = sessionId || JSON.parse(localStorage.getItem('assessment_session') || '{}').session_id;

        if (!sid && !storedReport) {
          try {
            const sessionsRes = await assessmentApi.getSessions();
            if (sessionsRes.success && sessionsRes.data?.length > 0) {
              sid = sessionsRes.data[0].session_id;
            }
          } catch {}
        }

        if (sid && !storedReport) {
          const fbRes = await assessmentApi.getFeedbackReport(sid);
          if (fbRes.success && fbRes.data) {
            const report = fbRes.data.feedback_report || {};
            const qaReview = fbRes.data.full_qa_review || [];

            const topicNames = [...new Set(qaReview.map((q: any) => q.topic).filter(Boolean))] as string[];
            const rawTopics = report.topic_reports || [];
            const topicReports = topicNames.map((name: string) => {
              const items = qaReview.filter((q: any) => q.topic === name);
              const correct = items.filter((q: any) => q.is_correct).length;
              const extra = rawTopics.find((t: any) =>
                (t.topic_name || t.topic || t.name || '').toLowerCase() === name.toLowerCase()
              ) || {};
              return {
                topic_name: name,
                mastery_percentage: extra.mastery_percentage ?? extra.mastery ?? (items.length > 0 ? Math.round((correct / items.length) * 100) : 0),
                questions_asked: extra.questions_asked ?? extra.questions ?? extra.total_questions ?? items.length,
                correct_answers: extra.correct_answers ?? extra.correct ?? extra.total_correct ?? correct,
                accuracy_percentage: extra.accuracy_percentage ?? extra.accuracy ?? (items.length > 0 ? Math.round((correct / items.length) * 100) : 0),
                strengths: Array.isArray(extra.strengths) ? extra.strengths : (Array.isArray(extra.topic_strengths) ? extra.topic_strengths : []),
                weaknesses: Array.isArray(extra.weaknesses) ? extra.weaknesses : (Array.isArray(extra.topic_weaknesses) ? extra.topic_weaknesses : []),
                misconceptions_found: Array.isArray(extra.misconceptions_found) ? extra.misconceptions_found : (Array.isArray(extra.misconceptions) ? extra.misconceptions : []),
                improvement_plan: extra.improvement_plan || extra.improvement_roadmap || '',
                recommended_exercises: Array.isArray(extra.recommended_exercises) ? extra.recommended_exercises : (Array.isArray(extra.exercises) ? extra.exercises : []),
                estimated_study_hours: extra.estimated_study_hours ?? extra.study_hours ?? 0,
              };
            });

            setData({
              report_title: report.report_title || "Java Programming Assessment — Personalized Feedback Report",
              learner_id: report.learner_id || 'Unknown',
              session_id: fbRes.data.session_id || sid,
              generated_at: report.generated_at || new Date().toISOString(),
              overall_grade: report.overall_grade || 'Completed',
              overall_assessment: report.overall_assessment || 'Assessment completed successfully.',
              overall_mastery_percentage: report.overall_mastery_percentage ?? 0,
              overall_accuracy_percentage: report.overall_accuracy_percentage ?? 0,
              total_questions: report.total_questions ?? qaReview.length ?? 0,
              session_duration_minutes: report.session_duration_minutes ?? 0,
              topic_reports: topicReports,
              qa_with_explanations: (qaReview || []).map((q: any) => ({
                question_number: q.question_number || 0,
                question_text: q.question_text || '',
                learner_answer: q.learner_answer || '',
                correct_answer: q.correct_answer || '',
                type: q.question_type || q.type || '',
                concept_explanation: '',
                why_correct_answer: '',
                common_mistake: '',
                learning_tip: '',
              })),
              key_strengths: report.key_strengths || [],
              key_weaknesses: report.key_weaknesses || [],
              misconceptions_to_address: report.misconceptions_to_address || [],
              learning_path: {
                immediate_focus: report.learning_path?.immediate_focus || 'Review topics needing improvement',
                week_1_goals: report.learning_path?.week_1_goals || [],
                week_2_4_goals: report.learning_path?.week_2_4_goals || [],
                long_term_goals: typeof report.learning_path?.long_term_goals === 'string'
                  ? [report.learning_path.long_term_goals]
                  : (report.learning_path?.long_term_goals || []),
              },
              recommended_resources: report.recommended_resources || [],
              practice_project_suggestion: report.practice_project_suggestion || '',
              next_assessment_recommendation: report.next_assessment_recommendation || '',
              motivational_message: report.motivational_message || 'Great effort! Keep learning.',
            });
            setLoading(false);
            return;
          }
        }

        if (sid) {
          const res = await assessmentApi.getSession(sid);
          if (res.success && res.data) {
            const session = res.data.updated_session || res.data;
            const report = res.data.feedback_report || session.feedback_report || {};
            const qaItems = JSON.parse(localStorage.getItem('assessment_qa') || '[]');
            const topics = session.all_topics || session.topics || [];

            setData({
              report_title: "Java Programming Assessment — Personalized Feedback Report",
              learner_id: session.learner_id || res.data.learner_id || 'Unknown',
              session_id: sid,
              generated_at: report.generated_at || new Date().toISOString(),
              overall_grade: report.overall_grade || 'Completed',
              overall_assessment: report.overall_assessment || 'Assessment completed successfully.',
              overall_mastery_percentage: report.overall_mastery_percentage ?? session.current_topic_mastery ?? 0,
              overall_accuracy_percentage: report.overall_accuracy_percentage ?? session.accuracy_percentage ?? 0,
              total_questions: report.total_questions ?? qaItems.length ?? 0,
              session_duration_minutes: report.session_duration_minutes ?? session.duration_minutes ?? 0,
              topic_reports: topics.map((t: any) => ({
                topic_name: t.name || t.topic_name || t.topic || 'Unknown',
                mastery_percentage: t.mastery || t.mastery_percentage || 0,
                questions_asked: t.questions_asked || 0,
                correct_answers: t.correct_answers || 0,
                accuracy_percentage: t.accuracy_percentage || 0,
                strengths: Array.isArray(t.strengths) ? t.strengths : [],
                weaknesses: Array.isArray(t.weaknesses) ? t.weaknesses : [],
                misconceptions_found: Array.isArray(t.misconceptions_found) ? t.misconceptions_found : [],
                improvement_plan: t.improvement_plan || '',
                recommended_exercises: Array.isArray(t.recommended_exercises) ? t.recommended_exercises : [],
                estimated_study_hours: t.estimated_study_hours || 0,
              })),
              qa_with_explanations: qaItems.map((q: any) => ({
                question_number: q.number,
                question_text: q.question,
                learner_answer: q.learner_answer,
                correct_answer: q.correct_answer,
                type: q.type || q.question_type || '',
                concept_explanation: q.explanation || '',
                why_correct_answer: '',
                common_mistake: '',
                learning_tip: '',
              })),
              key_strengths: report.key_strengths || [],
              key_weaknesses: report.key_weaknesses || [],
              misconceptions_to_address: report.misconceptions_to_address || [],
              learning_path: {
                immediate_focus: report.learning_path?.immediate_focus || 'Review topics needing improvement',
                week_1_goals: report.learning_path?.week_1_goals || [],
                week_2_4_goals: report.learning_path?.week_2_4_goals || [],
                long_term_goals: typeof report.learning_path?.long_term_goals === 'string'
                  ? [report.learning_path.long_term_goals]
                  : (report.learning_path?.long_term_goals || []),
              },
              recommended_resources: report.recommended_resources || [],
              practice_project_suggestion: report.practice_project_suggestion || '',
              next_assessment_recommendation: report.next_assessment_recommendation || '',
              motivational_message: report.motivational_message || 'Great effort! Keep learning.',
            });
            setLoading(false);
            return;
          }
        }
      } catch {}

      const qaItems = JSON.parse(localStorage.getItem('assessment_qa') || '[]');
      if (qaItems.length > 0) {
        const correct = qaItems.filter((q: any) => q.is_correct).length;
        const topicNames = [...new Set(qaItems.map((q: any) => q.topic))] as string[];
        const topics = topicNames.map((t: string) => {
          const items = qaItems.filter((q: any) => q.topic === t);
          const correctCount = items.filter((q: any) => q.is_correct).length;
          return {
            topic_name: t,
            mastery_percentage: Math.round((correctCount / items.length) * 100),
            questions_asked: items.length,
            correct_answers: correctCount,
            accuracy_percentage: Math.round((correctCount / items.length) * 100),
            strengths: [],
            weaknesses: [],
            misconceptions_found: [],
            improvement_plan: '',
            recommended_exercises: [],
            estimated_study_hours: 0,
          };
        });

        setData({
          report_title: "Java Programming Assessment — Personalized Feedback Report",
          learner_id: JSON.parse(localStorage.getItem('user') || '{}').student_id || 'Unknown',
          session_id: 'local',
          generated_at: new Date().toISOString(),
          overall_grade: (correct / qaItems.length) >= 0.85 ? 'Excellent' : (correct / qaItems.length) >= 0.7 ? 'Good' : 'Satisfactory',
          overall_assessment: `You answered ${correct} out of ${qaItems.length} questions correctly (${Math.round((correct / qaItems.length) * 100)}%).`,
          overall_mastery_percentage: Math.round((correct / qaItems.length) * 100),
          overall_accuracy_percentage: Math.round((correct / qaItems.length) * 100),
          total_questions: qaItems.length,
          session_duration_minutes: 0,
          topic_reports: topics,
          qa_with_explanations: qaItems.map((q: any) => ({
            question_number: q.number,
            question_text: q.question,
            learner_answer: q.learner_answer,
            correct_answer: q.correct_answer,
            type: q.type || q.question_type || '',
            concept_explanation: q.explanation || '',
            why_correct_answer: '',
            common_mistake: '',
            learning_tip: '',
          })),
          key_strengths: [],
          key_weaknesses: [],
          misconceptions_to_address: [],
          learning_path: {
            immediate_focus: 'Review topics needing improvement',
            week_1_goals: [],
            week_2_4_goals: [],
            long_term_goals: [],
          },
          recommended_resources: [],
          practice_project_suggestion: '',
          next_assessment_recommendation: '',
          motivational_message: 'Great effort! Keep learning.',
        });
      }
      setLoading(false);
    };

    loadReport();
  }, [sessionId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const onDownload = () => {
    if (!data) return;
    const t = data;

    const topicRows = t.topic_reports.map((topic, i) => `
      <tr>
        <td style="padding:12px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#1e293b">${topic.topic_name}</td>
        <td style="padding:12px;border-bottom:1px solid #e2e8f0;text-align:center">${topic.mastery_percentage}%</td>
        <td style="padding:12px;border-bottom:1px solid #e2e8f0;text-align:center">${topic.accuracy_percentage}%</td>
        <td style="padding:12px;border-bottom:1px solid #e2e8f0;text-align:center">${topic.correct_answers}/${topic.questions_asked}</td>
        <td style="padding:12px;border-bottom:1px solid #e2e8f0">${Array.isArray(topic.strengths) ? topic.strengths.slice(0, 2).join('; ') : ''}</td>
        <td style="padding:12px;border-bottom:1px solid #e2e8f0">${Array.isArray(topic.weaknesses) ? topic.weaknesses.slice(0, 2).join('; ') : ''}</td>
      </tr>
    `).join('');

    const isCodeType = (t: string) => ['coding_challenge', 'code_completion', 'code_tracing', 'debugging'].includes(t);
    const qaRows = t.qa_with_explanations.map((qa) => `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:center;vertical-align:top">${qa.question_number}</td>
        <td style="padding:10px;border-bottom:1px solid #e2e8f0">${qa.question_text}</td>
        <td style="padding:10px;border-bottom:1px solid #e2e8f0;color:#dc2626;vertical-align:top">${
          isCodeType(qa.type)
            ? `<pre style="margin:0;font-size:11px;white-space:pre-wrap;word-break:break-word;max-height:200px;overflow-y:auto;background:#fef2f2;padding:8px;border-radius:4px">${qa.learner_answer}</pre>`
            : qa.learner_answer
        }</td>
        <td style="padding:10px;border-bottom:1px solid #e2e8f0;color:#16a34a;vertical-align:top">${
          isCodeType(qa.type)
            ? `<pre style="margin:0;font-size:11px;white-space:pre-wrap;word-break:break-word;max-height:200px;overflow-y:auto;background:#f0fdf4;padding:8px;border-radius:4px">${qa.correct_answer}</pre>`
            : qa.correct_answer
        }</td>
      </tr>
    `).join('');

    const strengthItems = t.key_strengths.map(s => `<li style="margin-bottom:6px">${s}</li>`).join('');
    const weaknessItems = t.key_weaknesses.map(w => `<li style="margin-bottom:6px">${w}</li>`).join('');
    const misconceptionItems = t.misconceptions_to_address.map(m => `<li style="margin-bottom:6px">${m}</li>`).join('');

    const week1Goals = (t.learning_path.week_1_goals || []).map(g => `<li>${g}</li>`).join('');
    const week24Goals = (t.learning_path.week_2_4_goals || []).map(g => `<li>${g}</li>`).join('');
    const longTermGoals = (t.learning_path.long_term_goals || []).map(g => `<li>${g}</li>`).join('');

    const resourceItems = (t.recommended_resources || []).map(r => `
      <div style="margin-bottom:10px;padding:10px;background:#f8fafc;border-radius:6px;border:1px solid #e2e8f0">
        <strong style="color:#0f172a">${r.name}</strong>
        <span style="display:inline-block;margin-left:8px;padding:2px 8px;background:#e2e8f0;border-radius:4px;font-size:11px;color:#475569">${r.type}</span>
        <div style="font-size:12px;color:#64748b;margin-top:4px">Topic: ${r.topic} &mdash; ${r.url_hint}</div>
      </div>
    `).join('');

    const masteryColor = t.overall_mastery_percentage >= 70 ? '#16a34a' : t.overall_mastery_percentage >= 40 ? '#d97706' : '#dc2626';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${t.report_title}</title>
<style>
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #1e293b; margin: 0; padding: 40px; background: #f1f5f9; }
  .page { max-width: 1000px; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden; }
  .header { background: linear-gradient(135deg, #0f172a, #1e293b); color: #fff; padding: 48px 56px; text-align: center; }
  .header h1 { margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.3px; }
  .header .meta { margin-top: 16px; font-size: 14px; color: #94a3b8; }
  .header .grade-badge { display: inline-block; margin-top: 16px; padding: 8px 28px; border-radius: 24px; font-size: 16px; font-weight: 700; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2); }
  .section { padding: 32px 56px; border-bottom: 1px solid #e2e8f0; }
  .section:last-child { border-bottom: none; }
  .section h2 { font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 16px; text-transform: uppercase; letter-spacing: 0.5px; }
  .overall { font-size: 15px; line-height: 1.7; color: #475569; }
  .stats { display: flex; gap: 16px; margin-top: 20px; }
  .stat-card { flex: 1; padding: 20px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center; }
  .stat-card .value { font-size: 28px; font-weight: 800; color: #0f172a; }
  .stat-card .label { font-size: 12px; color: #64748b; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.3px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: #f1f5f9; padding: 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.3px; color: #64748b; border-bottom: 2px solid #e2e8f0; }
  .qa-table th { text-align: center; }
  .qa-table th:first-child, .qa-table td:first-child { text-align: center; }
  ul { margin: 0; padding-left: 20px; font-size: 14px; color: #475569; line-height: 1.6; }
  .footer { background: #f8fafc; padding: 32px 56px; text-align: center; font-size: 13px; color: #94a3b8; }
  .motivation { text-align: center; padding: 32px 56px; background: linear-gradient(135deg, #f0fdf4, #ecfdf5); }
  .motivation p { font-size: 18px; color: #166534; font-style: italic; line-height: 1.6; }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <h1>${t.report_title}</h1>
    <div class="meta">
      Learner: ${t.learner_id} &nbsp;|&nbsp; Session: ${t.session_id} &nbsp;|&nbsp; Generated: ${formatDate(t.generated_at)}
    </div>
    <div class="grade-badge">Overall Grade: ${t.overall_grade}</div>
  </div>

  <div class="section">
    <h2>Overall Assessment</h2>
    <p class="overall">${t.overall_assessment}</p>
    <div class="stats">
      <div class="stat-card">
        <div class="value" style="color:${masteryColor}">${t.overall_mastery_percentage}%</div>
        <div class="label">Overall Mastery</div>
      </div>
      <div class="stat-card">
        <div class="value" style="color:#0891b2">${t.overall_accuracy_percentage}%</div>
        <div class="label">Overall Accuracy</div>
      </div>
      <div class="stat-card">
        <div class="value">${t.total_questions}</div>
        <div class="label">Total Questions</div>
      </div>
      <div class="stat-card">
        <div class="value">${t.session_duration_minutes}</div>
        <div class="label">Duration (min)</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>Topic Analysis</h2>
    <table>
      <thead>
        <tr>
          <th>Topic</th>
          <th style="text-align:center">Mastery</th>
          <th style="text-align:center">Accuracy</th>
          <th style="text-align:center">Correct</th>
          <th>Strengths</th>
          <th>Weaknesses</th>
        </tr>
      </thead>
      <tbody>${topicRows}</tbody>
    </table>
  </div>

  <div class="section">
    <h2>Question &amp; Answer Review</h2>
    <table class="qa-table">
      <thead>
        <tr>
          <th style="width:60px">#</th>
          <th>Question</th>
          <th style="width:25%">Your Answer</th>
          <th style="width:25%">Correct Answer</th>
        </tr>
      </thead>
      <tbody>${qaRows}</tbody>
    </table>
  </div>

  ${strengthItems ? `<div class="section"><h2>Key Strengths</h2><ul>${strengthItems}</ul></div>` : ''}
  ${weaknessItems ? `<div class="section"><h2>Key Weaknesses</h2><ul>${weaknessItems}</ul></div>` : ''}
  ${misconceptionItems ? `<div class="section"><h2>Misconceptions to Address</h2><ul>${misconceptionItems}</ul></div>` : ''}

  <div class="section">
    <h2>Personalized Learning Path</h2>
    ${t.learning_path.immediate_focus ? `<p style="font-size:14px;color:#475569;line-height:1.6"><strong>Immediate Focus:</strong> ${t.learning_path.immediate_focus}</p>` : ''}
    ${week1Goals ? `<div style="margin-top:12px"><strong style="font-size:13px;color:#0f172a">Week 1 Goals</strong><ul style="margin-top:6px">${week1Goals}</ul></div>` : ''}
    ${week24Goals ? `<div style="margin-top:12px"><strong style="font-size:13px;color:#0f172a">Weeks 2-4 Goals</strong><ul style="margin-top:6px">${week24Goals}</ul></div>` : ''}
    ${longTermGoals ? `<div style="margin-top:12px"><strong style="font-size:13px;color:#0f172a">Long-term Goals</strong><ul style="margin-top:6px">${longTermGoals}</ul></div>` : ''}
  </div>

  ${resourceItems ? `<div class="section"><h2>Recommended Resources</h2>${resourceItems}</div>` : ''}
  ${t.practice_project_suggestion ? `<div class="section"><h2>Practice Project Suggestion</h2><p style="font-size:14px;color:#475569;line-height:1.6">${t.practice_project_suggestion}</p></div>` : ''}
  ${t.next_assessment_recommendation ? `<div class="section"><h2>Next Assessment Recommendation</h2><p style="font-size:14px;color:#475569;line-height:1.6">${t.next_assessment_recommendation}</p></div>` : ''}

  ${t.motivational_message ? `<div class="motivation"><p>&ldquo;${t.motivational_message}&rdquo;</p></div>` : ''}

  <div class="footer">
    Generated by Mentora AI Assessment Engine &mdash; ${formatDate(t.generated_at)}
  </div>
</div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assessment-report-${t.session_id}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onStartNew = () => {
    localStorage.removeItem('assessment_qa');
    localStorage.removeItem('assessment_session');
    router.push('/assessment');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-card via-muted to-card flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-teal-700 dark:text-teal-400 animate-spin mx-auto mb-4" />
          <p className="text-foreground/80 font-semibold">Loading report...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-card via-muted to-card flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-amber-700 dark:text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">No Report Available</h2>
          <p className="text-muted-foreground mb-6">Complete an assessment session first to view your personalized feedback report.</p>
          <Button onClick={() => router.push('/assessment')} className="bg-primary hover:bg-primary-hover text-primary-foreground">
            Go to Assessment
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-card via-muted to-card p-6">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Report Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-foreground">{data.report_title}</h1>
          <div className="text-muted-foreground space-y-1">
            <p>Learner ID: {data.learner_id}</p>
            <p>Session ID: {data.session_id}</p>
            <p>Generated: {formatDate(data.generated_at)}</p>
            <Badge className="bg-primary text-primary-foreground text-lg px-4 py-1 mt-2">
              Overall Grade: {data.overall_grade}
            </Badge>
          </div>
        </div>

        {/* Overall Assessment */}
        <Card className="bg-muted/50 border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Overall Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground/90 text-lg leading-relaxed">{data.overall_assessment}</p>
          </CardContent>
        </Card>

        {/* Performance Overview Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-muted/50 border-border">
            <CardContent className="p-6 text-center">
              <Target className="w-8 h-8 text-teal-700 dark:text-teal-400 mx-auto mb-2" />
              <p className="text-3xl font-bold text-foreground">{data.overall_mastery_percentage}%</p>
              <p className="text-muted-foreground text-sm">Overall Mastery</p>
            </CardContent>
          </Card>

          <Card className="bg-muted/50 border-border">
            <CardContent className="p-6 text-center">
              <TrendingUp className="w-8 h-8 text-teal-700 dark:text-teal-400 mx-auto mb-2" />
              <p className="text-3xl font-bold text-foreground">{data.overall_accuracy_percentage}%</p>
              <p className="text-muted-foreground text-sm">Overall Accuracy</p>
            </CardContent>
          </Card>

          <Card className="bg-muted/50 border-border">
            <CardContent className="p-6 text-center">
              <Award className="w-8 h-8 text-teal-700 dark:text-teal-400 mx-auto mb-2" />
              <p className="text-3xl font-bold text-foreground">{data.total_questions}</p>
              <p className="text-muted-foreground text-sm">Total Questions</p>
            </CardContent>
          </Card>

          <Card className="bg-muted/50 border-border">
            <CardContent className="p-6 text-center">
              <Clock className="w-8 h-8 text-teal-700 dark:text-teal-400 mx-auto mb-2" />
              <p className="text-3xl font-bold text-foreground">{data.session_duration_minutes}</p>
              <p className="text-muted-foreground text-sm">Minutes</p>
            </CardContent>
          </Card>
        </div>

        {/* Per-topic Deep Analysis */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Topic Analysis</h2>
          {data.topic_reports.map((topic, index) => (
            <Card key={index} className="bg-muted/50 border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center justify-between">
                  <span>{topic.topic_name}</span>
                  <div className="flex items-center gap-4">
                    <Badge className={topic.mastery_percentage >= 85 ? "bg-green-500" : topic.mastery_percentage >= 60 ? "bg-blue-500" : "bg-yellow-500"}>
                      {topic.mastery_percentage}% Mastery
                    </Badge>
                    <span className="text-muted-foreground text-sm">
                      {topic.correct_answers}/{topic.questions_asked} correct
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">

                {/* Performance Summary */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-surface-3/30 rounded-lg">
                    <p className="text-2xl font-bold text-foreground">{topic.questions_asked}</p>
                    <p className="text-muted-foreground text-sm">Questions Asked</p>
                  </div>
                  <div className="text-center p-4 bg-surface-3/30 rounded-lg">
                    <p className="text-2xl font-bold text-foreground">{topic.correct_answers}</p>
                    <p className="text-muted-foreground text-sm">Correct Answers</p>
                  </div>
                  <div className="text-center p-4 bg-surface-3/30 rounded-lg">
                    <p className="text-2xl font-bold text-foreground">{topic.accuracy_percentage}%</p>
                    <p className="text-muted-foreground text-sm">Accuracy</p>
                  </div>
                </div>

                {/* Strengths */}
                {Array.isArray(topic.strengths) && topic.strengths.length > 0 && (
                  <div>
                    <h4 className="text-green-700 dark:text-green-300 font-semibold mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Strengths
                    </h4>
                    <ul className="list-disc list-inside text-green-800 dark:text-green-200 space-y-1">
                      {topic.strengths.map((strength, idx) => (
                        <li key={idx}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Weaknesses */}
                {Array.isArray(topic.weaknesses) && topic.weaknesses.length > 0 && (
                  <div>
                    <h4 className="text-red-700 dark:text-red-300 font-semibold mb-2 flex items-center gap-2">
                      <X className="w-4 h-4" />
                      Weaknesses
                    </h4>
                    <ul className="list-disc list-inside text-red-800 dark:text-red-200 space-y-1">
                      {topic.weaknesses.map((weakness, idx) => (
                        <li key={idx}>{weakness}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Misconceptions Found */}
                {Array.isArray(topic.misconceptions_found) && topic.misconceptions_found.length > 0 && (
                  <div>
                    <h4 className="text-orange-700 dark:text-orange-300 font-semibold mb-2">Misconceptions Found</h4>
                    <ul className="list-disc list-inside text-orange-800 dark:text-orange-200 space-y-1">
                      {topic.misconceptions_found.map((misconception, idx) => (
                        <li key={idx}>{misconception}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Improvement Plan */}
                <div>
                  <h4 className="text-blue-700 dark:text-blue-300 font-semibold mb-2">Improvement Plan</h4>
                  <p className="text-blue-800 dark:text-blue-200">{topic.improvement_plan}</p>
                </div>

                {/* Recommended Exercises */}
                {Array.isArray(topic.recommended_exercises) && topic.recommended_exercises.length > 0 && (
                  <div>
                    <h4 className="text-purple-700 dark:text-purple-300 font-semibold mb-2">Recommended Exercises</h4>
                    <ul className="list-disc list-inside text-purple-800 dark:text-purple-200 space-y-1">
                      {topic.recommended_exercises.map((exercise, idx) => (
                        <li key={idx}>{exercise}</li>
                      ))}
                    </ul>
                    <p className="text-purple-700 dark:text-purple-400 text-sm mt-2">
                      Estimated study time: {topic.estimated_study_hours} hours
                    </p>
                  </div>
                )}

              </CardContent>
            </Card>
          ))}
        </div>

        {/* Q&A with AI Explanations */}
        <Card className="bg-muted/50 border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Question Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {data.qa_with_explanations.map((qa, index) => (
              <div key={index} className="border border-border-strong rounded-lg p-6">
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="border-slate-500 text-muted-foreground">
                      Question {qa.question_number}
                    </Badge>
                  </div>
                  <p className="text-foreground font-medium text-lg">{qa.question_text}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded overflow-hidden">
                    <p className="text-red-700 dark:text-red-300 text-sm font-medium mb-2">Your Answer:</p>
                    {qa.type === 'coding_challenge' || qa.type === 'code_completion' || qa.type === 'code_tracing' || qa.type === 'debugging' ? (
                      <pre className="text-red-800 dark:text-red-200 text-xs font-mono whitespace-pre-wrap break-words leading-relaxed max-h-64 overflow-y-auto">{qa.learner_answer}</pre>
                    ) : (
                      <p className="text-red-800 dark:text-red-200 font-mono text-sm">{qa.learner_answer}</p>
                    )}
                  </div>
                  <div className="p-3 bg-green-500/10 border border-green-500/30 rounded overflow-hidden">
                    <p className="text-green-700 dark:text-green-300 text-sm font-medium mb-2">Correct Answer:</p>
                    {qa.type === 'coding_challenge' || qa.type === 'code_completion' || qa.type === 'code_tracing' || qa.type === 'debugging' ? (
                      <pre className="text-green-800 dark:text-green-200 text-xs font-mono whitespace-pre-wrap break-words leading-relaxed max-h-64 overflow-y-auto">{qa.correct_answer}</pre>
                    ) : (
                      <p className="text-green-800 dark:text-green-200 font-mono text-sm">{qa.correct_answer}</p>
                    )}
                  </div>
                </div>

                {qa.concept_explanation && (
                  <div className="space-y-4">
                    <div>
                      <h5 className="text-blue-700 dark:text-blue-300 font-semibold flex items-center gap-2 mb-2">
                        <BookOpen className="w-4 h-4" />
                        Concept Explanation
                      </h5>
                      <p className="text-blue-800 dark:text-blue-200">{qa.concept_explanation}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Key Strengths and Weaknesses */}
        <div className="grid md:grid-cols-2 gap-6">

          <Card className="bg-green-500/10 border-green-500/30">
            <CardHeader>
              <CardTitle className="text-green-700 dark:text-green-300 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Key Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {data.key_strengths.map((strength, index) => (
                  <li key={index} className="text-green-800 dark:text-green-200 flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {strength}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-red-500/10 border-red-500/30">
            <CardHeader>
              <CardTitle className="text-red-700 dark:text-red-300 flex items-center gap-2">
                <X className="w-5 h-5" />
                Key Weaknesses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {data.key_weaknesses.map((weakness, index) => (
                  <li key={index} className="text-red-800 dark:text-red-200 flex items-start gap-2">
                    <X className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {weakness}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

        </div>

        {/* Misconceptions to Address */}
        {data.misconceptions_to_address.length > 0 && (
          <Card className="bg-orange-500/10 border-orange-500/30">
            <CardHeader>
              <CardTitle className="text-orange-700 dark:text-orange-300">Misconceptions to Address</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {data.misconceptions_to_address.map((misconception, index) => (
                  <li key={index} className="text-orange-800 dark:text-orange-200 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {misconception}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Personalized Learning Path */}
        <Card className="bg-muted/50 border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Personalized Learning Path</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">

            {data.learning_path.immediate_focus && (
              <div>
                <h4 className="text-teal-700 dark:text-teal-300 font-semibold mb-2">Immediate Focus</h4>
                <p className="text-teal-800 dark:text-teal-200">{data.learning_path.immediate_focus}</p>
              </div>
            )}

            {data.learning_path.week_1_goals.length > 0 && (
              <div>
                <h4 className="text-blue-700 dark:text-blue-300 font-semibold mb-2">Week 1 Goals</h4>
                <ul className="list-disc list-inside text-blue-800 dark:text-blue-200 space-y-1">
                  {data.learning_path.week_1_goals.map((goal, index) => (
                    <li key={index}>{goal}</li>
                  ))}
                </ul>
              </div>
            )}

            {data.learning_path.week_2_4_goals.length > 0 && (
              <div>
                <h4 className="text-purple-700 dark:text-purple-300 font-semibold mb-2">Weeks 2-4 Goals</h4>
                <ul className="list-disc list-inside text-purple-800 dark:text-purple-200 space-y-1">
                  {data.learning_path.week_2_4_goals.map((goal, index) => (
                    <li key={index}>{goal}</li>
                  ))}
                </ul>
              </div>
            )}

            {data.learning_path.long_term_goals.length > 0 && (
              <div>
                <h4 className="text-indigo-700 dark:text-indigo-300 font-semibold mb-2">Long-term Goals</h4>
                {typeof data.learning_path.long_term_goals === 'string' ? (
                  <p className="text-indigo-800 dark:text-indigo-200">{data.learning_path.long_term_goals}</p>
                ) : (
                  <ul className="list-disc list-inside text-indigo-800 dark:text-indigo-200 space-y-1">
                    {data.learning_path.long_term_goals.map((goal, index) => (
                      <li key={index}>{goal}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

          </CardContent>
        </Card>

        {data.recommended_resources.length > 0 && (
          <Card className="bg-muted/50 border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Recommended Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {data.recommended_resources.map((resource, index) => (
                  <div key={index} className="p-4 bg-surface-3/30 rounded-lg border border-border-strong">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="border-slate-500 text-muted-foreground">
                        {resource.topic}
                      </Badge>
                      <Badge className="bg-slate-600 text-foreground/90">
                        {resource.type}
                      </Badge>
                    </div>
                    <h5 className="text-foreground font-medium mb-1">{resource.name}</h5>
                    <p className="text-muted-foreground text-sm">{resource.url_hint}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {data.practice_project_suggestion && (
          <Card className="bg-teal-500/10 border-teal-500/30">
            <CardHeader>
              <CardTitle className="text-teal-700 dark:text-teal-300 flex items-center gap-2">
                <Code className="w-5 h-5" />
                Practice Project Suggestion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-teal-800 dark:text-teal-200 leading-relaxed">{data.practice_project_suggestion}</p>
            </CardContent>
          </Card>
        )}

        {/* Next Assessment Recommendation */}
        <Card className="bg-muted/50 border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Next Assessment Recommendation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground/90">{data.next_assessment_recommendation}</p>
          </CardContent>
        </Card>

        {/* Motivational Closing */}
        <Card className="bg-gradient-to-r from-teal-500/10 to-blue-500/10 border-teal-500/30">
          <CardContent className="p-8 text-center">
            <Heart className="w-8 h-8 text-red-700 dark:text-red-400 mx-auto mb-4" />
            <p className="text-foreground text-lg italic leading-relaxed">{data.motivational_message}</p>
          </CardContent>
        </Card>

        {/* Report Actions */}
        <div className="flex justify-center gap-4">
          <Button
            onClick={onDownload}
            variant="outline"
            className="border-border-strong text-muted-foreground hover:bg-surface-3 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download Report
          </Button>
          <Button
            onClick={onStartNew}
            className="bg-primary hover:bg-primary-hover text-primary-foreground px-6 py-3 font-semibold rounded-lg"
          >
            Start New Session →
          </Button>
        </div>

      </div>
    </div>
  );
}