import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SUPPORTED_LANGUAGES } from '../data/defaultBooks';
import {
  BookOpen,
  Flame,
  Globe,
  Clock,
  Code2,
  Sparkles,
  RotateCcw,
  Menu,
  X,
  Info,
} from 'lucide-react';

interface NavbarProps {
  onOpenMobileMenu: () => void;
  mobileMenuOpen: boolean;
  onOpenPomodoro: () => void;
  onOpenPythonEngine: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenMobileMenu,
  mobileMenuOpen,
  onOpenPomodoro,
  onOpenPythonEngine,
}) => {
  const {
    language,
    setLanguage,
    t,
    progress,
    books,
    activeBookId,
    setActiveBookId,
    allChunks,
    resetAllData,
    setActiveTab,
  } = useApp();

  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const activeLangObj =
    SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 focus:outline-none"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-white font-mono">
                  intellisnc <span className="text-indigo-400">- Ai Ustaad</span>
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded">
                  AI + OCR
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Vector DB & Spaced Study Hub
              </p>
            </div>
          </div>
        </div>

        {/* Center: Active Book Quick Selector */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-1.5">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            Book:
          </span>
          <select
            value={activeBookId}
            onChange={(e) => setActiveBookId(e.target.value)}
            className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none max-w-[200px] truncate cursor-pointer"
          >
            {books.map((b) => (
              <option key={b.id} value={b.id} className="bg-slate-900 text-slate-200">
                {b.title} ({b.chunks.length} chunks)
              </option>
            ))}
          </select>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-mono">
            {allChunks.length} vectors
          </span>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Study Streak Badge */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-semibold"
            title={`${progress.studyStreakDays} Day Streak!`}
          >
            <Flame className="w-4 h-4 text-amber-400 animate-pulse fill-amber-400" />
            <span>{progress.studyStreakDays}d</span>
          </div>

          {/* Pomodoro Quick Button */}
          <button
            onClick={onOpenPomodoro}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700/60 transition"
            title="Open Focus Timer"
          >
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Focus</span>
          </button>

          {/* Python Engine Inspector Button */}
          <button
            onClick={onOpenPythonEngine}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-950/70 hover:bg-indigo-900/80 text-indigo-300 hover:text-white text-xs font-medium border border-indigo-700/50 transition"
            title="View Python Vector & OCR Architecture"
          >
            <Code2 className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Python AI</span>
          </button>

          {/* About & Founder Button */}
          <button
            onClick={() => setActiveTab('about')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700/60 transition"
            title="About intellisnc & Founder Dr Muhammad Dawood"
          >
            <Info className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">About</span>
          </button>

          {/* Multi-language Selector */}
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700/60 transition"
              aria-label="Change language"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>{activeLangObj.flag}</span>
              <span className="hidden sm:inline">{activeLangObj.code.toUpperCase()}</span>
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl py-2 z-50">
                <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 border-b border-slate-800">
                  Select Educational Language
                </div>
                <div className="max-h-60 overflow-y-auto py-1">
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setLangMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition ${
                        language === lang.code
                          ? 'bg-indigo-600/20 text-indigo-300 font-semibold'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {lang.nativeName}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
