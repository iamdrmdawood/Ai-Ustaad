import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  ScanText,
  Database,
  FileText,
  HelpCircle,
  MessageSquareQuote,
  CalendarDays,
  Info,
} from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { activeTab, setActiveTab, t } = useApp();

  const items = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'ocr', label: 'OCR', icon: ScanText },
    { id: 'vector', label: 'Vector', icon: Database },
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'quizzes', label: 'Quiz', icon: HelpCircle },
    { id: 'tutor', label: 'Tutor', icon: MessageSquareQuote },
    { id: 'about', label: 'About', icon: Info },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-2 py-1.5 flex items-center justify-around">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] transition ${
              isActive ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
