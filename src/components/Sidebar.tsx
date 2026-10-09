import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  ScanText,
  Database,
  FileText,
  HelpCircle,
  CalendarDays,
  MessageSquareQuote,
  Code2,
  Sparkles,
  BookMarked,
} from 'lucide-react';

interface SidebarProps {
  onOpenPythonEngine: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenPythonEngine }) => {
  const { activeTab, setActiveTab, t, books, allChunks, studyNotes, quizzes, progress } = useApp();

  const navItems = [
    {
      id: 'dashboard',
      label: t('dashboard'),
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'ocr',
      label: t('booksOcr'),
      icon: ScanText,
      badge: `${books.length}`,
    },
    {
      id: 'vector',
      label: t('vectorDb'),
      icon: Database,
      badge: `${allChunks.length}`,
    },
    {
      id: 'notes',
      label: t('notes'),
      icon: FileText,
      badge: `${studyNotes.length}`,
    },
    {
      id: 'quizzes',
      label: t('quizzes'),
      icon: HelpCircle,
      badge: quizzes.length > 0 ? `${quizzes.length}` : 'New',
    },
    {
      id: 'schedule',
      label: t('schedule'),
      icon: CalendarDays,
      badge: null,
    },
    {
      id: 'tutor',
      label: t('aiTutor'),
      icon: MessageSquareQuote,
      badge: 'Live',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-900/60 border-r border-slate-800 p-4 shrink-0 justify-between">
      <div className="space-y-6">
        {/* Quick OCR Scan Button */}
        <button
          onClick={() => setActiveTab('ocr')}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-medium text-xs shadow-lg shadow-indigo-600/20 transition group"
        >
          <ScanText className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span>{t('startOcrScan')}</span>
        </button>

        {/* Navigation list */}
        <nav className="space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Study Workspace
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition group ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive
                        ? 'text-indigo-400'
                        : 'text-slate-400 group-hover:text-slate-300'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
                      item.badgeColor ||
                      (isActive
                        ? 'bg-indigo-500/20 text-indigo-300'
                        : 'bg-slate-800 text-slate-400')
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / Student Mastery Card */}
      <div className="space-y-3 pt-4 border-t border-slate-800">
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Study Score
            </span>
            <span className="text-xs font-mono font-bold text-indigo-400">
              {progress.averageQuizScore}%
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-sky-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, progress.averageQuizScore)}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-2 text-[10px] text-slate-400">
            <span>{progress.quizzesTaken} quizzes taken</span>
            <span>{Math.round(progress.totalStudyMinutes / 60)}h studied</span>
          </div>
        </div>

        {/* Python AI engine modal launcher */}
        <button
          onClick={onOpenPythonEngine}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-white text-xs border border-slate-700/60 transition"
        >
          <Code2 className="w-3.5 h-3.5 text-sky-400" />
          <span>Python Vector Architecture</span>
        </button>
      </div>
    </aside>
  );
};
