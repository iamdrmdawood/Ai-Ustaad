import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { translateContent, generateAdaptiveQuiz } from '../services/api';
import {
  FileText,
  RotateCw,
  Sparkles,
  Download,
  Globe,
  BookOpen,
  Award,
  Lightbulb,
  AlertTriangle,
  HelpCircle,
  CheckCircle2,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';

export const NotesStudioView: React.FC = () => {
  const {
    studyNotes,
    activeNoteId,
    setActiveNoteId,
    activeNote,
    updateFlashcardMastery,
    saveQuizSession,
    setActiveQuiz,
    setActiveTab,
    language,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'cornell' | 'flashcards' | 'formulas' | 'mnemonics'>('cornell');
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [targetTranslateLang, setTargetTranslateLang] = useState('Spanish');

  // Flashcard carousel state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  if (!activeNote) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-3">
        <FileText className="w-12 h-12 mx-auto text-slate-600" />
        <h3 className="text-base font-bold text-white">No Study Notes Generated Yet</h3>
        <p className="text-xs">Scan a book page in the OCR tab or pick a sample to synthesize smart Cornell notes.</p>
        <button
          onClick={() => setActiveTab('ocr')}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
        >
          Go to OCR Scanner
        </button>
      </div>
    );
  }

  const toggleFlip = (cardId: string) => {
    setFlippedCards((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  };

  const handleExportMarkdown = () => {
    const md = `# ${activeNote.title}
Subject: ${activeNote.subject} | Language: ${activeNote.language}

## Overview
${activeNote.overview}

## Cornell Notes
### Recall Cues & Questions:
${activeNote.cornellNotes.cuesAndQuestions.map((q) => `- ${q}`).join('\n')}

### Detailed Notes:
${activeNote.cornellNotes.detailedNotes
  .map((sec) => `#### ${sec.heading}\n${sec.points.map((p) => `- ${p}`).join('\n')}`)
  .join('\n\n')}

### Summary:
${activeNote.cornellNotes.summary}

## Key Formulas & Laws:
${activeNote.keyFormulasOrLaws
  .map((f) => `- **${f.name}**: \`${f.formula}\`\n  ${f.explanation}`)
  .join('\n')}

## Common Exam Pitfalls:
${activeNote.commonExamPitfalls.map((p) => `- ⚠️ ${p}`).join('\n')}
`;

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeNote.title.replace(/\s+/g, '_')}_Notes.md`;
    a.click();
  };

  const handleCreateQuizFromNotes = async () => {
    setIsGeneratingQuiz(true);
    try {
      const sourceText = `${activeNote.overview}\n\n${activeNote.cornellNotes.summary}\n\n${activeNote.cornellNotes.detailedNotes.map((d) => d.points.join(' ')).join(' ')}`;
      const quizData = await generateAdaptiveQuiz(
        sourceText,
        activeNote.subject,
        'Medium',
        5,
        language
      );

      const session = {
        id: `quiz-${Date.now()}`,
        title: (quizData as any).quizTitle || quizData.title || `Mastery Quiz: ${activeNote.title}`,
        subject: activeNote.subject,
        difficulty: quizData.difficulty || 'Medium',
        questions: (quizData.questions || []).map((q, i) => ({
          ...q,
          id: `q-${i + 1}`,
          type: q.type || 'multiple-choice',
          options: q.options || [],
          correctAnswer: q.correctAnswer || 'A',
          explanation: q.explanation || 'Pedagogical explanation',
          difficulty: 'Medium' as const,
        })),
        userAnswers: {},
      };

      saveQuizSession(session);
      setActiveQuiz(session);
      setActiveTab('quizzes');
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const flashcards = activeNote.flashcards || [];
  const currentCard = flashcards[currentCardIndex];

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Top Header & Note Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-white">Smart Study Notes Studio</h1>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold border border-indigo-500/30">
              Cornell System
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Auto-synthesized high-yield notes, active recall cue questions, flashcards, and exam pitfall guides.
          </p>
        </div>

        {/* Note selector & export */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={activeNoteId}
            onChange={(e) => setActiveNoteId(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
          >
            {studyNotes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.title} ({n.subject})
              </option>
            ))}
          </select>

          <button
            onClick={handleExportMarkdown}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            title="Download Notes as Markdown (.md)"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export .md</span>
          </button>

          <button
            onClick={handleCreateQuizFromNotes}
            disabled={isGeneratingQuiz}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isGeneratingQuiz ? 'Creating Quiz...' : 'Generate Quiz'}</span>
          </button>
        </div>
      </div>

      {/* Note Sub-tabs */}
      <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800 max-w-md">
        <button
          onClick={() => setActiveSubTab('cornell')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition ${
            activeSubTab === 'cornell'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Cornell Notes
        </button>
        <button
          onClick={() => setActiveSubTab('flashcards')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeSubTab === 'flashcards'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Flashcards</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px]">
            {flashcards.length}
          </span>
        </button>
        <button
          onClick={() => setActiveSubTab('formulas')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition ${
            activeSubTab === 'formulas'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Formulas & Laws
        </button>
        <button
          onClick={() => setActiveSubTab('mnemonics')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition ${
            activeSubTab === 'mnemonics'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Mnemonics
        </button>
      </div>

      {/* Cornell Notes Tab Content */}
      {activeSubTab === 'cornell' && (
        <div className="space-y-6">
          {/* Executive Overview */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
              <Lightbulb className="w-4 h-4 text-indigo-400" />
              <span>Executive Overview</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{activeNote.overview}</p>
          </div>

          {/* Cornell Split Column Format */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-12 min-h-[440px]">
              {/* Left Column (35%): Cues & Active Recall Questions */}
              <div className="md:col-span-4 p-5 bg-slate-950/60 border-b md:border-b-0 md:border-r border-slate-800 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-xs font-bold text-sky-400 uppercase tracking-wider">
                  <Bookmark className="w-4 h-4 text-sky-400" />
                  <span>Recall Cues & Questions</span>
                </div>
                <div className="space-y-3">
                  {activeNote.cornellNotes.cuesAndQuestions.map((cue, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 text-xs text-slate-200 font-medium hover:border-indigo-500/40 transition"
                    >
                      <span className="text-[10px] text-sky-400 font-mono font-bold block mb-1">
                        Prompt #{idx + 1}
                      </span>
                      {cue}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column (65%): Detailed Formatted Notes */}
              <div className="md:col-span-8 p-6 space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span>Detailed Structured Insights</span>
                </div>

                <div className="space-y-6">
                  {activeNote.cornellNotes.detailedNotes.map((section, idx) => (
                    <div key={idx} className="space-y-2">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        {section.heading}
                      </h4>
                      <ul className="space-y-2 pl-4">
                        {section.points.map((point, pIdx) => (
                          <li
                            key={pIdx}
                            className="text-xs text-slate-300 leading-relaxed list-disc marker:text-indigo-500"
                          >
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Section: Cornell Synthesis Summary */}
            <div className="p-5 bg-slate-950 border-t border-slate-800 space-y-2">
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                Bottom Synthesis (Takeaway for Exams):
              </span>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {activeNote.cornellNotes.summary}
              </p>
            </div>
          </div>

          {/* Common Exam Pitfalls */}
          {activeNote.commonExamPitfalls.length > 0 && (
            <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Common Exam Pitfalls & Misconceptions</span>
              </div>
              <ul className="space-y-2">
                {activeNote.commonExamPitfalls.map((pitfall, idx) => (
                  <li key={idx} className="text-xs text-amber-200/90 flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{pitfall}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Flashcards Tab Content */}
      {activeSubTab === 'flashcards' && (
        <div className="space-y-6">
          {flashcards.length > 0 ? (
            <div className="max-w-xl mx-auto space-y-6">
              {/* Carousel Indicator */}
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  Card {currentCardIndex + 1} of {flashcards.length}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono capitalize bg-indigo-500/20 text-indigo-300">
                  Status: {currentCard.masteryLevel}
                </span>
              </div>

              {/* 3D Flip Flashcard */}
              <div
                onClick={() => toggleFlip(currentCard.id)}
                className="relative h-64 w-full rounded-2xl bg-slate-900 border border-slate-700 p-6 flex flex-col justify-between cursor-pointer hover:border-indigo-500 transition shadow-2xl group select-none"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-semibold text-indigo-400">
                    {flippedCards[currentCard.id] ? 'RECALL ANSWER' : 'PROMPT / QUESTION'}
                  </span>
                  <span className="flex items-center gap-1 text-slate-500 group-hover:text-slate-300">
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Click to Flip</span>
                  </span>
                </div>

                <div className="text-center px-4 my-auto">
                  <p className="text-base font-semibold text-white leading-relaxed">
                    {flippedCards[currentCard.id] ? currentCard.back : currentCard.front}
                  </p>
                </div>

                <div className="text-center text-[10px] text-slate-500">
                  {flippedCards[currentCard.id]
                    ? 'Rate your recall accuracy below'
                    : 'Try to recall before flipping'}
                </div>
              </div>

              {/* Mastery rating buttons */}
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() =>
                    updateFlashcardMastery(activeNote.id, currentCard.id, 'learning')
                  }
                  className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold border border-amber-500/40 transition"
                >
                  Still Learning
                </button>
                <button
                  onClick={() =>
                    updateFlashcardMastery(activeNote.id, currentCard.id, 'mastered')
                  }
                  className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold border border-emerald-500/40 transition"
                >
                  Mastered (Recall 100%)
                </button>
              </div>

              {/* Carousel Navigation */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setCurrentCardIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentCardIndex === 0}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 disabled:opacity-40 text-slate-200 text-xs font-medium"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentCardIndex((prev) => Math.min(flashcards.length - 1, prev + 1))
                  }
                  disabled={currentCardIndex === flashcards.length - 1}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 disabled:opacity-40 text-slate-200 text-xs font-medium"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              No flashcards in this note.
            </div>
          )}
        </div>
      )}

      {/* Formulas & Laws Tab */}
      {activeSubTab === 'formulas' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeNote.keyFormulasOrLaws.map((item, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white">{item.name}</h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                    Equation #{idx + 1}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 font-mono text-sm text-sky-300 text-center border border-slate-800/80">
                  {item.formula}
                </div>
                <p className="text-xs text-slate-400">{item.explanation}</p>
              </div>
            ))}
          </div>

          {activeNote.keyFormulasOrLaws.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400">
              No specific formulas identified on this page.
            </div>
          )}
        </div>
      )}

      {/* Mnemonics Tab */}
      {activeSubTab === 'mnemonics' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeNote.mnemonics.map((mnem, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                  <Lightbulb className="w-4 h-4" />
                  <span>Topic: {mnem.topic}</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200 font-medium">
                  {mnem.trick}
                </div>
              </div>
            ))}
          </div>

          {activeNote.mnemonics.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400">
              No memory mnemonics generated for this note yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
