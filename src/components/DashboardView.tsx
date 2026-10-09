import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Flame,
  Award,
  BookOpen,
  Database,
  ArrowRight,
  ScanText,
  Search,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Play,
  Clock,
  Layers,
  GraduationCap,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    t,
    progress,
    books,
    allChunks,
    studyNotes,
    schedule,
    toggleScheduleTask,
    setActiveTab,
    setActiveBookId,
    setActiveQuiz,
  } = useApp();

  const [quickSearchQuery, setQuickSearchQuery] = useState('');

  // Find today's tasks
  const todayPlan = schedule?.days?.[0];
  const pendingSessions = todayPlan?.sessions?.filter((s) => !s.completed) || [];

  const handleQuickSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickSearchQuery.trim()) {
      setActiveTab('vector');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Top Welcome & Quick Search Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900/60 via-slate-900 to-slate-900 border border-indigo-500/20 p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
            <span>Intellisnc Study Hub & Vector Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Accelerate your learning with Intellisnc Ai.
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Extract textbook pages with OCR, search book chapters using high-dimensional vector embeddings, master concepts with adaptive quizzes, and clarify difficult problems with your 24/7 multilingual AI tutor.
          </p>

          {/* Quick Semantic Search Bar */}
          <form onSubmit={handleQuickSearchSubmit} className="pt-2 flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={quickSearchQuery}
                onChange={(e) => setQuickSearchQuery(e.target.value)}
                placeholder="Ask or search across all indexed book chunks (e.g., 'What is ATP synthase?')..."
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition shadow-inner"
              />
            </div>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition shrink-0"
            >
              <span>Vector Search</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Streak */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6 text-amber-400 fill-amber-400 animate-pulse" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white font-mono">
              {progress.studyStreakDays} <span className="text-xs text-slate-400 font-sans">days</span>
            </div>
            <div className="text-xs text-slate-400 font-medium">Study Streak</div>
          </div>
        </div>

        {/* Academic Mastery */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white font-mono">
              {progress.averageQuizScore}%
            </div>
            <div className="text-xs text-slate-400 font-medium">Quiz Mastery</div>
          </div>
        </div>

        {/* Indexed Books */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white font-mono">
              {books.length} <span className="text-xs text-slate-400 font-sans">books</span>
            </div>
            <div className="text-xs text-slate-400 font-medium">Indexed Library</div>
          </div>
        </div>

        {/* Vector Embeddings */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
            <Database className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white font-mono">
              {allChunks.length} <span className="text-xs text-slate-400 font-sans">chunks</span>
            </div>
            <div className="text-xs text-slate-400 font-medium">Vector Database</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Today's Schedule & Weak Topic Remediation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's High-Yield Study Schedule */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Today's Spaced Repetition Plan ({todayPlan?.dayName || 'Today'})
              </h2>
            </div>
            <button
              onClick={() => setActiveTab('schedule')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition"
            >
              <span>Full Schedule</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {todayPlan?.sessions?.map((sess) => (
              <div
                key={sess.id}
                onClick={() => toggleScheduleTask(todayPlan.dayNumber, sess.id)}
                className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-4 ${
                  sess.completed
                    ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-6 h-6 rounded-lg border flex items-center justify-center transition shrink-0 ${
                      sess.completed
                        ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                        : 'border-slate-600 hover:border-indigo-400'
                    }`}
                  >
                    {sess.completed && <CheckCircle2 className="w-4 h-4 fill-current" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold ${
                          sess.completed ? 'line-through text-slate-400' : 'text-white'
                        }`}
                      >
                        {sess.topic}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-medium">
                        {sess.technique}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {sess.timeSlot} • {sess.activity}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] font-mono font-medium text-slate-400">
                    {sess.durationMinutes || 60}m
                  </span>
                </div>
              </div>
            ))}

            {(!todayPlan || todayPlan.sessions.length === 0) && (
              <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-400">
                No tasks scheduled for today. Click "Full Schedule" to generate an adaptive study roadmap.
              </div>
            )}
          </div>

          {/* Quick Action Cards */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setActiveTab('ocr')}
              className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900/90 transition text-left group flex items-start gap-3"
            >
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition shrink-0">
                <ScanText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-indigo-300 transition">
                  Scan New Textbook Page
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  OCR camera photo or image scan into Cornell notes & vector store.
                </p>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('quizzes')}
              className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900/90 transition text-left group flex items-start gap-3"
            >
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition">
                  Take Rapid Mastery Quiz
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  AI generates 5 targeted questions directly from your source material.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Right Col: Weak Topic Alerts & Subject Breakdown */}
        <div className="space-y-6">
          {/* Weak Topics to Review */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Needs Review (Weak Spots)
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {progress.weakTopics.length} detected
              </span>
            </div>

            <div className="space-y-2.5">
              {progress.weakTopics.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-xs font-semibold text-slate-200">
                      {item.topic}
                    </div>
                    <span className="text-[10px] text-amber-400/90 font-medium">
                      {item.subject} • {item.errorCount} quiz misses
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab('tutor');
                    }}
                    className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs transition"
                    title="Ask AI Tutor to clarify this topic"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {progress.weakTopics.length === 0 && (
                <div className="text-center py-4 text-xs text-slate-400">
                  🎉 No weak spots logged yet! Keep taking quizzes to identify concepts to reinforce.
                </div>
              )}
            </div>
          </div>

          {/* Subject Mastery Rings */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Subject Mastery
              </h3>
              <span className="text-[10px] text-indigo-400 font-mono">Cumulative</span>
            </div>

            <div className="space-y-3">
              {Object.entries(progress.subjectMastery).map(([subj, score]) => (
                <div key={subj} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">{subj}</span>
                    <span className="font-mono font-bold text-indigo-400">{score}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-sky-400 rounded-full transition-all duration-700"
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
