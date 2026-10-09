/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { DashboardView } from './components/DashboardView';
import { OcrBookScanner } from './components/OcrBookScanner';
import { VectorDbView } from './components/VectorDbView';
import { NotesStudioView } from './components/NotesStudioView';
import { QuizStudioView } from './components/QuizStudioView';
import { ScheduleView } from './components/ScheduleView';
import { ChatTutorView } from './components/ChatTutorView';
import { PomodoroModal } from './components/PomodoroModal';
import { PythonEngineModal } from './components/PythonEngineModal';
import { X, Code2, ScanText, LayoutDashboard, Database, FileText, HelpCircle, CalendarDays, MessageSquareQuote } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { activeTab, setActiveTab, t } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pomodoroOpen, setPomodoroOpen] = useState(false);
  const [pythonEngineOpen, setPythonEngineOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        onOpenMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        mobileMenuOpen={mobileMenuOpen}
        onOpenPomodoro={() => setPomodoroOpen(true)}
        onOpenPythonEngine={() => setPythonEngineOpen(true)}
      />

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col p-6 animate-fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <span className="font-extrabold text-base text-white font-mono">
              Omni<span className="text-indigo-400">Scholar</span> Menu
            </span>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="py-6 space-y-2 flex-1 overflow-y-auto text-sm">
            {[
              { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
              { id: 'ocr', label: t('booksOcr'), icon: ScanText },
              { id: 'vector', label: t('vectorDb'), icon: Database },
              { id: 'notes', label: t('notes'), icon: FileText },
              { id: 'quizzes', label: t('quizzes'), icon: HelpCircle },
              { id: 'schedule', label: t('schedule'), icon: CalendarDays },
              { id: 'tutor', label: t('aiTutor'), icon: MessageSquareQuote },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                    isActive
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}

            <button
              onClick={() => {
                setPythonEngineOpen(true);
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sky-400 bg-sky-950/30 border border-sky-500/20 mt-4"
            >
              <Code2 className="w-5 h-5" />
              <span>Python Vector Architecture</span>
            </button>
          </nav>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar */}
        <Sidebar onOpenPythonEngine={() => setPythonEngineOpen(true)} />

        {/* Dynamic Main Workspace Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'ocr' && <OcrBookScanner />}
          {activeTab === 'vector' && <VectorDbView />}
          {activeTab === 'notes' && <NotesStudioView />}
          {activeTab === 'quizzes' && <QuizStudioView />}
          {activeTab === 'schedule' && <ScheduleView onOpenPomodoro={() => setPomodoroOpen(true)} />}
          {activeTab === 'tutor' && <ChatTutorView />}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />

      {/* Interactive Modals */}
      <PomodoroModal isOpen={pomodoroOpen} onClose={() => setPomodoroOpen(false)} />
      <PythonEngineModal isOpen={pythonEngineOpen} onClose={() => setPythonEngineOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
