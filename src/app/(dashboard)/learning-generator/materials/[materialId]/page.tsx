"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { learningGeneratorApi, type LearningMaterial } from "@/lib/api/learningGenerator";
import { aiEngineApi } from "@/lib/api/aiEngine";
import { Loader2, XCircle, Info } from "lucide-react";
import LearningPathSidebar from "@/components/learning-generator/LearningPathSidebar";
import ContentRenderer from "@/components/learning-generator/ContentRenderer";
import QuizSection from "@/components/learning-generator/QuizSection";
import CodeEditorPanel from "@/components/learning-generator/CodeEditorPanel";
import BottomNav from "@/components/learning-generator/BottomNav";

export default function MaterialWorkspace() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const materialId = params.materialId as string;

  const [material, setMaterial] = useState<LearningMaterial | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [steps, setSteps] = useState<Array<{ id: string; title: string; type: string }>>([]);
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [code, setCode] = useState("");
  const [output, setOutput] = useState<string | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isCompilationError, setIsCompilationError] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"output" | "feedback">("output");
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [insightType, setInsightType] = useState<"simpler" | "analogy" | null>(null);
  const [insightActiveTab, setInsightActiveTab] = useState<"simpler" | "analogy" | null>(null);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [savingProgress, setSavingProgress] = useState(false);

  const buildSteps = useCallback((mat: LearningMaterial) => {
    const s = mat.structured_material;
    const result: Array<{ id: string; title: string; type: string }> = [];

    if (s.lesson.introduction) result.push({ id: "intro", title: "Introduction", type: "read" });
    if (s.lesson.concept_explained) result.push({ id: "concepts", title: "Concepts & Syntax", type: "read" });
    if (s.lesson.step_by_step_guide) result.push({ id: "guide", title: "Step-by-Step Guide", type: "read" });
    if (s.lesson.examples?.example_1) result.push({ id: "example", title: "Code Examples", type: "code" });
    if (s.lesson.common_mistakes && s.lesson.common_mistakes.length > 0) result.push({ id: "mistakes", title: "Common Mistakes", type: "read" });
    if (s.assessment.practice_challenge) result.push({ id: "practice", title: "Practice Challenge", type: "code" });
    if (s.lesson.debugging_exercise) result.push({ id: "debug", title: "Debugging", type: "code" });
    if (s.assessment.quiz && s.assessment.quiz.length > 0) result.push({ id: "quiz", title: "Mastery Quiz", type: "quiz" });

    return result;
  }, []);

  const storageKey = (key: string) => `mentora_${materialId}_${activeStep}_${key}`;

  const saveInsightToStorage = (type: string, text: string) => {
    try {
      sessionStorage.setItem(storageKey(type), text);
    } catch {}
  };

  const loadInsightFromStorage = (type: string): string | null => {
    try {
      return sessionStorage.getItem(storageKey(type));
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const loadMaterial = async () => {
      if (!materialId) return;
      try {
        setLoading(true);
        const [materialRes, progressRes] = await Promise.all([
          learningGeneratorApi.getMaterial(materialId),
          learningGeneratorApi.getProgressByMaterial(materialId),
        ]);

        if (materialRes.success && materialRes.data) {
          setMaterial(materialRes.data);
          const builtSteps = buildSteps(materialRes.data);
          setSteps(builtSteps);

          if (progressRes.success && progressRes.data) {
            setCompletedSteps(progressRes.data.completed_steps);
            setActiveStep(progressRes.data.last_active_step || 0);
            if (progressRes.data.quiz_score !== null && progressRes.data.quiz_score !== undefined) {
              setQuizScore(progressRes.data.quiz_score);
            }
          }
        } else {
          setError(materialRes.message || "Material not found");
        }
      } catch {
        setError("Failed to load material. Check LMG service.");
      } finally {
        setLoading(false);
      }
    };
    loadMaterial();
  }, [materialId, buildSteps]);

  useEffect(() => {
    if (!material) return;
    const currentStepId = steps[activeStep]?.id;

    if (currentStepId === "practice" && material.structured_material.assessment.practice_challenge) {
      setCode(material.structured_material.assessment.practice_challenge.starter_code);
    } else if (currentStepId === "debug" && material.structured_material.lesson.debugging_exercise) {
      setCode(material.structured_material.lesson.debugging_exercise.broken_code);
    } else {
      setCode("");
    }
    setOutput(null);
    setExecutionError(null);
    setAiFeedback(null);
    setIsCompilationError(false);
    setActiveTab("output");
    setShowCodeEditor(false);

    const storedSimpler = loadInsightFromStorage("simpler");
    const storedAnalogy = loadInsightFromStorage("analogy");
    const storedFeedback = loadInsightFromStorage("code_feedback");

    if (storedSimpler) {
      setAiInsight(storedSimpler);
      setInsightActiveTab("simpler");
    } else if (storedAnalogy) {
      setAiInsight(storedAnalogy);
      setInsightActiveTab("analogy");
    } else {
      setAiInsight(null);
      setInsightActiveTab(null);
    }

    if (storedFeedback) {
      setAiFeedback(storedFeedback);
    } else {
      setAiFeedback(null);
    }
  }, [activeStep, material, steps]);

  const saveProgress = useCallback(async (stepIndex: number, isComplete?: boolean) => {
    if (!materialId) return;
    try {
      const payload: any = {
        total_steps: steps.length,
        active_step: stepIndex,
      };
      if (isComplete && !completedSteps.includes(stepIndex)) {
        payload.completed_step = stepIndex;
      }
      setSavingProgress(true);
      await learningGeneratorApi.updateProgress(materialId, payload);
    } catch {
    } finally {
      setSavingProgress(false);
    }
  }, [materialId, steps.length, completedSteps]);

  const handleRunCode = async () => {
    if (!code.trim()) return;
    setIsExecuting(true);
    setOutput(null);
    setExecutionError(null);
    setAiFeedback(null);
    setActiveTab("output");

    const currentStepId = steps[activeStep]?.id;

    try {
      const res = await aiEngineApi.executeCode(code, currentStepId);
      if (res.data) {
        const { success, output: runOutput, error: runError, is_compilation_error: isCompError } = res.data;

        setIsCompilationError(isCompError);

        if (runError) {
          setExecutionError(runError);
        } else {
          setOutput(runOutput);
        }

        if (success && currentStepId === "practice") {
          if (!completedSteps.includes(activeStep)) {
            setCompletedSteps(prev => [...prev, activeStep]);
            saveProgress(activeStep, true);
          }
        }

        try {
          setIsAiLoading(true);
          const fbRes = await aiEngineApi.getFeedback(code, runOutput || undefined, runError || undefined, currentStepId);
          if (fbRes.data) {
            setAiFeedback(fbRes.data.feedback);
            saveInsightToStorage("code_feedback", fbRes.data.feedback);
          }
        } catch {
          setAiFeedback("AI feedback unavailable right now.");
        } finally {
          setIsAiLoading(false);
        }
      }
    } catch {
      setExecutionError("Execution service unavailable. Please try again.");
    } finally {
      setIsExecuting(false);
    }
  };

  const handleResetCode = () => {
    if (!material) return;
    const currentStepId = steps[activeStep]?.id;
    if (currentStepId === "practice" && material.structured_material.assessment.practice_challenge) {
      setCode(material.structured_material.assessment.practice_challenge.starter_code);
    } else if (currentStepId === "debug" && material.structured_material.lesson.debugging_exercise) {
      setCode(material.structured_material.lesson.debugging_exercise.broken_code);
    } else {
      setCode("");
    }
    setOutput(null);
    setExecutionError(null);
    setAiFeedback(null);
    setActiveTab("output");
    saveInsightToStorage("code_feedback", "");
  };

  const handleExplainSimpler = async () => {
    const lesson = material?.structured_material.lesson;
    const stepId = steps[activeStep]?.id;
    let contextText = "";

    if (stepId === "example" && lesson?.examples?.example_1) {
      contextText = lesson.examples.example_1.code;
    } else if (stepId === "intro" && lesson?.introduction) {
      contextText = `${lesson.introduction.what_is_it}\nWhy learn this: ${lesson.introduction.why_learn_it}`;
    } else if (stepId === "concepts" && lesson?.concept_explained) {
      contextText = `${lesson.concept_explained.core_definition}\n${lesson.concept_explained.how_java_handles_it || ""}\n${lesson.concept_explained.misconceptions_corrected || ""}`;
    } else if (stepId === "guide" && lesson?.step_by_step_guide) {
      contextText = lesson.step_by_step_guide.steps.map((s: any) => `Step ${s.step_number}: ${s.instruction}`).join("\n");
    } else if (stepId === "mistakes" && lesson?.common_mistakes && lesson.common_mistakes.length > 0) {
      contextText = lesson.common_mistakes.map((m: any) => `Mistake: ${m.title}\n${m.description}\nBad: ${m.bad_code}\nGood: ${m.good_code}`).join("\n");
    } else if (stepId === "practice" && material?.structured_material.assessment.practice_challenge) {
      contextText = `${material.structured_material.assessment.practice_challenge.problem_statement}\nStarter code:\n${material.structured_material.assessment.practice_challenge.starter_code}`;
    } else if (stepId === "debug" && lesson?.debugging_exercise) {
      contextText = `Scenario: ${lesson.debugging_exercise.scenario}\nBroken code:\n${lesson.debugging_exercise.broken_code}`;
    } else {
      contextText = code;
    }

    if (!contextText) return;
    setInsightType("simpler");
    setInsightActiveTab("simpler");
    setAiInsight(null);
    try {
      const sm = material?.structured_material;
      const res = await aiEngineApi.explainSimpler(contextText, sm?.topic, stepId);
      if (res.data) {
        setAiInsight(res.data.insight);
        saveInsightToStorage("simpler", res.data.insight);
        saveInsightToStorage("analogy", "");
      }
    } catch {
      setAiInsight("Unable to generate explanation. Try again.");
    } finally {
      setInsightType(null);
    }
  };

  const handleRealLifeAnalogy = async () => {
    const lesson = material?.structured_material.lesson;
    const stepId = steps[activeStep]?.id;
    let contextText = "";

    if (stepId === "example" && lesson?.examples?.example_1) {
      contextText = lesson.examples.example_1.code;
    } else if (stepId === "intro" && lesson?.introduction) {
      contextText = `${lesson.introduction.what_is_it}\nWhy learn this: ${lesson.introduction.why_learn_it}`;
    } else if (stepId === "concepts" && lesson?.concept_explained) {
      contextText = `${lesson.concept_explained.core_definition}\n${lesson.concept_explained.how_java_handles_it || ""}\n${lesson.concept_explained.misconceptions_corrected || ""}`;
    } else if (stepId === "guide" && lesson?.step_by_step_guide) {
      contextText = lesson.step_by_step_guide.steps.map((s: any) => `Step ${s.step_number}: ${s.instruction}`).join("\n");
    } else if (stepId === "mistakes" && lesson?.common_mistakes && lesson.common_mistakes.length > 0) {
      contextText = lesson.common_mistakes.map((m: any) => `Mistake: ${m.title}\n${m.description}\nBad: ${m.bad_code}\nGood: ${m.good_code}`).join("\n");
    } else if (stepId === "practice" && material?.structured_material.assessment.practice_challenge) {
      contextText = `${material.structured_material.assessment.practice_challenge.problem_statement}\nStarter code:\n${material.structured_material.assessment.practice_challenge.starter_code}`;
    } else if (stepId === "debug" && lesson?.debugging_exercise) {
      contextText = `Scenario: ${lesson.debugging_exercise.scenario}\nBroken code:\n${lesson.debugging_exercise.broken_code}`;
    } else {
      contextText = code;
    }

    if (!contextText) return;
    setInsightType("analogy");
    setInsightActiveTab("analogy");
    setAiInsight(null);
    try {
      const sm = material?.structured_material;
      const res = await aiEngineApi.getAnalogy(contextText, sm?.topic, stepId);
      if (res.data) {
        setAiInsight(res.data.insight);
        saveInsightToStorage("analogy", res.data.insight);
        saveInsightToStorage("simpler", "");
      }
    } catch {
      setAiInsight("Unable to generate analogy. Try again.");
    } finally {
      setInsightType(null);
    }
  };

  const handleNextStep = async () => {
    if (!completedSteps.includes(activeStep)) {
      setCompletedSteps(prev => [...prev, activeStep]);
    }
    await saveProgress(activeStep, true);
    if (activeStep < steps.length - 1) {
      const nextStep = activeStep + 1;
      setActiveStep(nextStep);
      await saveProgress(nextStep);
    }
  };

  const handleQuizSubmit = async () => {
    if (!material) return;
    const assessment = material.structured_material.assessment;
    let correct = 0;
    assessment.quiz.forEach((q: any) => {
      if (answers[q.question_number] === q.correct) correct++;
    });
    const score = Math.round((correct / assessment.quiz.length) * 100);
    setQuizScore(score);

    if (!completedSteps.includes(activeStep)) {
      setCompletedSteps(prev => [...prev, activeStep]);
    }
    await learningGeneratorApi.updateProgress(materialId, {
      total_steps: steps.length,
      quiz_score: score,
      completed_all: true,
    });
  };

  const handleCopyCode = () => {
    if (material?.structured_material.lesson.examples) {
      navigator.clipboard.writeText(material.structured_material.lesson.examples.example_1.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCloseInsight = () => {
    if (insightActiveTab) saveInsightToStorage(insightActiveTab, "");
    setAiInsight(null);
    setInsightActiveTab(null);
  };

  const handleAnswerChange = (questionNumber: number, letter: string) => {
    setAnswers({ ...answers, [questionNumber]: letter });
  };

  const currentStepId = steps[activeStep]?.id;
  const sm = material?.structured_material;
  const lesson = sm?.lesson;
  const assessment = sm?.assessment;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-teal-500 animate-spin mx-auto mb-4" />
          <p className="text-[var(--lmg-text-muted)] text-sm">Loading material...</p>
        </div>
      </div>
    );
  }

  if (error || !material) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[var(--lmg-text-primary)] mb-2">{error || "Material not found"}</h2>
          <a
            href="/learning-generator"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary-hover transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg> Back to Generator
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[var(--lmg-bg-page)] text-[var(--lmg-text-primary)] overflow-hidden font-sans transition-colors duration-200">
      <div className="flex flex-1 min-h-0">
        <LearningPathSidebar
          material={material}
          steps={steps}
          activeStep={activeStep}
          completedSteps={completedSteps}
          onStepSelect={setActiveStep}
          saveProgress={saveProgress}
        />

        <div className="flex-1 flex flex-col min-w-0 bg-[var(--lmg-bg-page)] relative min-h-0">
          {sm?.generation_source === "implicit_prerequisite" && (
            <div className="px-6 py-2.5 bg-blue-500/10 border-b border-blue-500/20 flex items-start gap-2 text-xs text-blue-700 dark:text-blue-200/90 shrink-0">
              <Info className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />
              <p>
                Auto-added from your prerequisite gap{sm.personalisation?.concept_context?.name ? ` on ${sm.personalisation.concept_context.name}` : ""} —{" "}
                {sm.personalisation?.prerequisite_reason || "this concept is required before you can master the topics you're missing."}
              </p>
            </div>
          )}
          {currentStepId === "quiz" ? (
            <div className={`flex-1 overflow-y-auto p-8 lg:p-12 animate-fade-in flex justify-center ${quizScore === null ? 'items-start' : 'items-center'}`}>
              <QuizSection
                material={material}
                quizScore={quizScore}
                answers={answers}
                onAnswerChange={handleAnswerChange}
                onSubmit={handleQuizSubmit}
                savingProgress={savingProgress}
              />
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row min-h-0">
              <ContentRenderer
                material={material}
                currentStepId={currentStepId}
                lesson={lesson}
                assessment={assessment}
                code={code}
                showCodeEditor={showCodeEditor}
                copiedCode={copiedCode}
                onCopyCode={handleCopyCode}
                onOpenEditor={() => setShowCodeEditor(true)}
                onExplainSimpler={handleExplainSimpler}
                onRealLifeAnalogy={handleRealLifeAnalogy}
                insightType={insightType}
                insightActiveTab={insightActiveTab}
                aiInsight={aiInsight}
                onCloseInsight={handleCloseInsight}
                title={steps[activeStep]?.title}
              />

              {(currentStepId === "example" || currentStepId === "practice" || currentStepId === "debug") && showCodeEditor && (
                <CodeEditorPanel
                  code={code}
                  output={output}
                  executionError={executionError}
                  isExecuting={isExecuting}
                  isCompilationError={isCompilationError}
                  aiFeedback={aiFeedback}
                  isAiLoading={isAiLoading}
                  activeTab={activeTab}
                  currentStepId={currentStepId}
                  onCodeChange={setCode}
                  onRunCode={handleRunCode}
                  onResetCode={handleResetCode}
                  onTabChange={setActiveTab}
                  onClose={() => setShowCodeEditor(false)}
                />
              )}
            </div>
          )}

          <BottomNav
            activeStep={activeStep}
            steps={steps}
            savingProgress={savingProgress}
            onPrevious={async () => {
              const prev = Math.max(0, activeStep - 1);
              setActiveStep(prev);
              await saveProgress(prev);
            }}
            onNext={handleNextStep}
          />
        </div>
      </div>
    </div>
  );
}
