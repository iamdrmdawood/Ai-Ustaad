import React, { useState } from 'react';
import { Artifact } from '../types';
import { useApp } from '../context/AppContext';
import {
  X,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Download,
  BookMarked,
  Code2,
  FileText,
  HelpCircle,
  Sparkles,
  Layers,
  RotateCw,
  Play,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface ArtifactCanvasPanelProps {
  artifact: Artifact;
  onClose: () => void;
  onSendFollowUp: (prompt: string) => void;
}

export const ArtifactCanvasPanel: React.FC<ArtifactCanvasPanelProps> = ({
  artifact,
  onClose,
  onSendFollowUp,
}) => {
  const { addStudyNotes, setActiveTab, setActiveNoteId } = useApp();
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeFlashcardIndex, setActiveFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [savedToNotesToast, setSavedToNotesToast] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(artifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const extension =
      artifact.type === 'code' ? 'py' : artifact.type === 'quiz' ? 'json' : 'md';
    const blob = new Blob([artifact.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${artifact.title.replace(/\s+/g, '_')}.${extension}`;
    a.click();
  };

  const handleSaveToNotesStudio = () => {
    const newNote = {
      id: `notes-${Date.now()}`,
      bookId: 'custom-artifact',
      title: artifact.title,
      subject: 'Academic Artifact',
      language: 'English',
      overview: artifact.content.slice(0, 300) + '...',
      cornellNotes: {
        cuesAndQuestions: ['What is the core takeaway?', 'Key problem to solve?'],
        detailedNotes: [
          {
            heading: 'Synthesized Artifact Content',
            points: artifact.content.split('\n').filter((l) => l.trim().length > 0).slice(0, 8),
          },
        ],
        summary: `Synthesized from Intellisnc Canvas: ${artifact.title}`,
      },
      keyFormulasOrLaws: [],
      flashcards: [
        {
          id: `fc-${Date.now()}`,
          front: `Concept: ${artifact.title}`,
          back: artifact.content.slice(0, 200),
          masteryLevel: 'new' as const,
        },
      ],
      mnemonics: [],
      commonExamPitfalls: [],
      createdAt: new Date().toISOString(),
    };

    addStudyNotes(newNote);
    setActiveNoteId(newNote.id);
    setSavedToNotesToast(true);
    setTimeout(() => setSavedToNotesToast(false), 3000);
  };

  // Parse flashcards if type is flashcards
  const flashcardPairs = React.useMemo(() => {
    if (artifact.type !== 'flashcards') return [];
    return artifact.content
      .split('\n')
      .map((line) => {
        const parts = line.split(/[:|-]/);
        if (parts.length >= 2) {
          return {
            front: parts[0].replace(/^[\d+.*-]\s*/, '').trim(),
            back: parts.slice(1).join(':').trim(),
          };
        }
        return null;
      })
      .filter(Boolean) as Array<{ front: string; back: string }>;
  }, [artifact]);

  const getIcon = () => {
    switch (artifact.type) {
      case 'code':
        return <Code2 className="w-4 h-4 text-sky-400" />;
      case 'quiz':
        return <HelpCircle className="w-4 h-4 text-emerald-400" />;
      case 'flashcards':
        return <Layers className="w-4 h-4 text-amber-400" />;
      default:
        return <FileText className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div
      className={`bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-4 z-50'
          : 'w-full lg:w-[480px] xl:w-[540px] shrink-0 h-full'
      }`}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 shrink-0">
            {getIcon()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white truncate max-w-[220px]">
                {artifact.title}
              </h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {artifact.type}
              </span>
            </div>
            <span className="text-[10px] text-slate-400">Intellisnc Canvas Artifact</span>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleSaveToNotesStudio}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            title="Export into Cornell Notes Studio"
          >
            <BookMarked className="w-4 h-4 text-indigo-400" />
          </button>
          <button
            onClick={handleCopy}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            title="Copy content"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            title="Download file"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            title="Close Canvas"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Toast Notification when saved */}
      {savedToNotesToast && (
        <div className="bg-emerald-500/20 border-b border-emerald-500/30 px-4 py-2 text-xs text-emerald-300 flex items-center justify-between">
          <span>✓ Saved to Smart Notes Studio!</span>
          <button
            onClick={() => setActiveTab('notes')}
            className="underline font-semibold flex items-center gap-1"
          >
            Open Notes <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Main Body */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs font-sans">
        {/* Code Artifact View */}
        {artifact.type === 'code' && (
          <div className="space-y-3 font-mono">
            <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              <span>Python / Academic Execution</span>
              <button
                onClick={() => onSendFollowUp(`Explain how this code executes: ${artifact.title}`)}
                className="text-indigo-400 hover:text-indigo-300 font-sans font-semibold flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Explain Code</span>
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 overflow-x-auto text-xs leading-relaxed">
              <code>{artifact.content}</code>
            </pre>
          </div>
        )}

        {/* Flashcards Artifact View */}
        {artifact.type === 'flashcards' && flashcardPairs.length > 0 && (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>
                Card {activeFlashcardIndex + 1} of {flashcardPairs.length}
              </span>
              <span>Click card to flip</span>
            </div>

            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="h-52 w-full rounded-2xl bg-slate-950 border border-slate-800 p-6 flex flex-col justify-between cursor-pointer hover:border-indigo-500/60 transition shadow-lg select-none text-center"
            >
              <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase">
                {isFlipped ? 'RECALL ANSWER' : 'PROMPT CONCEPT'}
              </span>
              <p className="text-sm font-semibold text-white my-auto leading-relaxed">
                {isFlipped
                  ? flashcardPairs[activeFlashcardIndex]?.back
                  : flashcardPairs[activeFlashcardIndex]?.front}
              </p>
              <span className="text-[10px] text-slate-500">Tap to rotate</span>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  setActiveFlashcardIndex((prev) => Math.max(0, prev - 1));
                  setIsFlipped(false);
                }}
                disabled={activeFlashcardIndex === 0}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => {
                  setActiveFlashcardIndex((prev) =>
                    Math.min(flashcardPairs.length - 1, prev + 1)
                  );
                  setIsFlipped(false);
                }}
                disabled={activeFlashcardIndex === flashcardPairs.length - 1}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Document / Markdown / Quiz Artifact View */}
        {(artifact.type === 'document' ||
          artifact.type === 'markdown' ||
          artifact.type === 'quiz' ||
          (artifact.type === 'flashcards' && flashcardPairs.length === 0)) && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 leading-relaxed whitespace-pre-wrap font-sans text-xs">
            {artifact.content}
          </div>
        )}
      </div>

      {/* Quick Follow-up Pills in Canvas */}
      <div className="px-4 py-2.5 bg-slate-950/80 border-t border-slate-800 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none text-[11px]">
        <span className="text-slate-400 font-medium shrink-0">Iterate:</span>
        <button
          onClick={() => onSendFollowUp(`Make this artifact more comprehensive with extra examples.`)}
          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 whitespace-nowrap transition"
        >
          Add Examples
        </button>
        <button
          onClick={() => onSendFollowUp(`Generate 3 quiz practice questions based directly on this artifact.`)}
          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 whitespace-nowrap transition"
        >
          Quiz from this
        </button>
        <button
          onClick={() => onSendFollowUp(`Summarize this artifact in 3 bullet points with a mnemonic.`)}
          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 whitespace-nowrap transition"
        >
          Add Mnemonic
        </button>
      </div>
    </div>
  );
};
