import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { X, Play, Pause, RotateCcw, Bell, Sparkles } from 'lucide-react';

interface PomodoroModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PomodoroModal: React.FC<PomodoroModalProps> = ({ isOpen, onClose }) => {
  const { incrementStudyMinutes } = useApp();
  const [mode, setMode] = useState<'focus' | 'shortBreak' | 'longBreak'>('focus');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (mode === 'focus') setTimeLeft(25 * 60);
    else if (mode === 'shortBreak') setTimeLeft(5 * 60);
    else setTimeLeft(15 * 60);
    setIsRunning(false);
  }, [mode]);

  useEffect(() => {
    let timer: any = null;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      if (mode === 'focus') {
        incrementStudyMinutes(25);
      }
      setIsRunning(false);
      try {
        const audio = new Audio(
          'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcHCek3fTDciIfH6ff8s18LR8gp9/x03otHyKn3/LTei0fIqff8tN6LR8ip9/y03otHyKn3/LTei0fIqff8tN6LR8i'
        );
        audio.play().catch(() => {});
      } catch {}
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft, mode, incrementStudyMinutes]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const totalDuration = mode === 'focus' ? 25 * 60 : mode === 'shortBreak' ? 5 * 60 : 15 * 60;
  const progressPercent = ((totalDuration - timeLeft) / totalDuration) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-1 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Spaced Focus Clock</span>
          </div>
          <h3 className="text-lg font-bold text-white">Active Recall Session</h3>
        </div>

        {/* Mode switches */}
        <div className="flex bg-slate-950 p-1 rounded-xl mb-6 border border-slate-800">
          {(['focus', 'shortBreak', 'longBreak'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition capitalize ${
                mode === m
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {m === 'focus' ? 'Focus (25m)' : m === 'shortBreak' ? 'Short (5m)' : 'Long (15m)'}
            </button>
          ))}
        </div>

        {/* Circular Display */}
        <div className="relative w-44 h-44 mx-auto mb-6 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="88"
              cy="88"
              r="76"
              className="text-slate-800"
              strokeWidth="8"
              stroke="currentColor"
              fill="transparent"
            />
            <circle
              cx="88"
              cy="88"
              r="76"
              className="text-indigo-500 transition-all duration-1000 ease-linear"
              strokeWidth="8"
              strokeDasharray={477}
              strokeDashoffset={477 - (477 * progressPercent) / 100}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-4xl font-extrabold font-mono text-white tracking-wider">
              {formatted}
            </span>
            <span className="text-xs text-slate-400 capitalize mt-1">{mode}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition"
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 fill-white" /> Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" /> Start Focus
              </>
            )}
          </button>
          <button
            onClick={() => {
              setIsRunning(false);
              setTimeLeft(mode === 'focus' ? 25 * 60 : mode === 'shortBreak' ? 5 * 60 : 15 * 60);
            }}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
