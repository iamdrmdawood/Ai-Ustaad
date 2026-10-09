import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { generateAdaptiveQuiz } from '../services/api';
import { QuizQuestion, QuizSession } from '../types';
import confetti from 'canvas-confetti';
import {
  HelpCircle,
  Sparkles,
  Award,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Clock,
  Layers,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export const QuizStudioView: React.FC = () => {
  const {
    books,
    activeBookId,
    activeBook,
    quizzes,
    activeQuiz,
    setActiveQuiz,
    saveQuizSession,
    recordQuizResult,
    language,
    setActiveTab,
  } = useApp();

  // Generator state
  const [selectedBookId, setSelectedBookId] = useState<string>(activeBookId || books[0]?.id || '');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active Runner State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  const targetBook = books.find((b) => b.id === selectedBookId) || activeBook || books[0];

  const handleGenerateQuiz = async () => {
    if (!targetBook || !targetBook.chunks || targetBook.chunks.length === 0) {
      setErrorMsg('Selected book has no text chunks. Please scan a page first.');
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const combinedText = targetBook.chunks.map((c) => c.text).join('\n\n');
      const result = await generateAdaptiveQuiz(
        combinedText,
        targetBook.subject,
        difficulty,
        questionCount,
        language
      );

      const newSession: QuizSession = {
        id: `quiz-${Date.now()}`,
        title: (result as any).quizTitle || result.title || `Adaptive Assessment: ${targetBook.title}`,
        subject: targetBook.subject,
        difficulty: result.difficulty || difficulty,
        questions: (result.questions || []).map((q, i) => ({
          ...q,
          id: `q-${i + 1}`,
          type: q.type || 'multiple-choice',
          options: q.options || [],
          correctAnswer: q.correctAnswer || 'A',
          explanation: q.explanation || 'Detailed pedagogical explanation of principles.',
          difficulty,
        })),
        userAnswers: {},
      };

      saveQuizSession(newSession);
      setActiveQuiz(newSession);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setShowExplanation(false);
      setQuizFinished(false);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to generate quiz. Please retry.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectOption = (optionLetter: string) => {
    if (showExplanation) return; // already revealed
    const currentQ = activeQuiz?.questions[currentQuestionIndex];
    if (!currentQ) return;

    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optionLetter,
    }));
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    if (!activeQuiz) return;
    if (currentQuestionIndex < activeQuiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setShowExplanation(false);
    } else {
      // Calculate final score
      let correctCount = 0;
      const missed: string[] = [];

      activeQuiz.questions.forEach((q) => {
        const userAnswer = selectedAnswers[q.id];
        // Normalize answer checking (handles "A", "A)", "Option A")
        const isCorrect =
          userAnswer && q.correctAnswer && userAnswer.trim()[0] === q.correctAnswer.trim()[0];
        if (isCorrect) {
          correctCount++;
        } else {
          missed.push(q.conceptTested || q.question);
        }
      });

      setFinalScore(correctCount);
      setQuizFinished(true);

      // Record in progress tracking
      recordQuizResult(
        activeQuiz.id,
        correctCount,
        activeQuiz.questions.length,
        selectedAnswers,
        missed
      );

      // Trigger Confetti if passed >= 80%
      if (correctCount / activeQuiz.questions.length >= 0.8) {
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {}
      }
    }
  };

  const currentQuestion: QuizQuestion | undefined =
    activeQuiz?.questions[currentQuestionIndex];

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-white">Automated Quiz Studio</h1>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold border border-emerald-500/30">
              Active Recall Assessment
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Generate high-yield psychometric quizzes from your book chapters to test mastery and log weak spots.
          </p>
        </div>

        {activeQuiz && (
          <button
            onClick={() => setActiveQuiz(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Quiz Config</span>
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {errorMsg}
        </div>
      )}

      {/* Quiz Generator Configuration Card (when no active quiz running or user resets) */}
      {!activeQuiz || quizFinished ? (
        <div className="space-y-6">
          {quizFinished ? (
            /* Quiz Completed Score Card */
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-5 max-w-lg mx-auto shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/25">
                <Award className="w-8 h-8 text-white" />
              </div>

              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Assessment Complete
                </span>
                <h2 className="text-2xl font-black text-white mt-1">
                  {finalScore} / {activeQuiz?.questions.length} Correct
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Mastery Score:{' '}
                  <strong className="text-white">
                    {Math.round((finalScore / (activeQuiz?.questions.length || 1)) * 100)}%
                  </strong>
                </p>
              </div>

              <div className="flex gap-3 justify-center pt-2">
                <button
                  onClick={() => {
                    setCurrentQuestionIndex(0);
                    setSelectedAnswers({});
                    setShowExplanation(false);
                    setQuizFinished(false);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Retake Quiz</span>
                </button>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition"
                >
                  <span>View in Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Configure New Quiz Generator */
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6 max-w-2xl">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Configure Personalized Quiz
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Book Source */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold">Source Textbook Material:</label>
                  <select
                    value={selectedBookId}
                    onChange={(e) => setSelectedBookId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                  >
                    {books.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.title} ({b.chunks.length} chunks)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Difficulty */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold">Assessment Difficulty:</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                  >
                    <option value="Easy">Easy (Fundamental Definitions)</option>
                    <option value="Medium">Medium (Application & Inferences)</option>
                    <option value="Hard">Hard (Exam & Proof Standard)</option>
                  </select>
                </div>

                {/* Number of questions */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold">Question Count:</label>
                  <select
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                  >
                    <option value={3}>3 Rapid Questions</option>
                    <option value={5}>5 Standard Questions</option>
                    <option value={8}>8 Comprehensive Questions</option>
                  </select>
                </div>

                {/* Target language */}
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold">Question Language:</label>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-300 capitalize font-medium">
                    {language} (Auto-syncs with global language)
                  </div>
                </div>
              </div>

              <button
                onClick={handleGenerateQuiz}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {isGenerating ? 'Synthesizing Psychometric Quiz...' : 'Generate Practice Quiz'}
                </span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Active Quiz Runner */
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Progress bar & question counter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-indigo-400">
                Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}
              </span>
              <span className="text-slate-400 font-mono text-[11px]">
                {activeQuiz.title}
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                style={{
                  width: `${((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Question Card */}
          {currentQuestion && (
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold">
                    {currentQuestion.difficulty}
                  </span>
                  {currentQuestion.conceptTested && (
                    <span className="text-[11px] text-slate-400 font-medium">
                      Concept: {currentQuestion.conceptTested}
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-white leading-relaxed">
                  {currentQuestion.question}
                </h3>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {currentQuestion.options.map((opt, optIdx) => {
                  const letter = String.fromCharCode(65 + optIdx); // A, B, C, D
                  const isSelected = selectedAnswers[currentQuestion.id] === letter;
                  const isCorrect =
                    currentQuestion.correctAnswer &&
                    currentQuestion.correctAnswer.trim()[0] === letter;

                  let optionStyle =
                    'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300';

                  if (showExplanation) {
                    if (isCorrect) {
                      optionStyle = 'bg-emerald-950/40 border-emerald-500 text-emerald-200';
                    } else if (isSelected && !isCorrect) {
                      optionStyle = 'bg-rose-950/40 border-rose-500 text-rose-200';
                    }
                  } else if (isSelected) {
                    optionStyle = 'bg-indigo-950/60 border-indigo-500 text-white';
                  }

                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelectOption(letter)}
                      className={`w-full p-4 rounded-2xl border text-left text-xs transition flex items-center justify-between gap-3 ${optionStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-200 font-bold font-mono text-[11px] flex items-center justify-center shrink-0">
                          {letter}
                        </span>
                        <span className="leading-relaxed">{opt}</span>
                      </div>

                      {showExplanation && (
                        <div>
                          {isCorrect && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          )}
                          {isSelected && !isCorrect && (
                            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* In-depth Pedagogical Explanation */}
              {showExplanation && (
                <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-2 animate-fade-in">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Academic Explanation:</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {currentQuestion.explanation}
                  </p>
                </div>
              )}

              {/* Next Button */}
              {showExplanation && (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleNextQuestion}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition"
                  >
                    <span>
                      {currentQuestionIndex < activeQuiz.questions.length - 1
                        ? 'Next Question'
                        : 'View Results'}
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
