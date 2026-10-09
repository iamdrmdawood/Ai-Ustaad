import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { generateStudySchedule } from '../services/api';
import {
  CalendarDays,
  Sparkles,
  Clock,
  CheckCircle2,
  RotateCw,
  Layers,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Play,
} from 'lucide-react';

interface ScheduleViewProps {
  onOpenPomodoro: () => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({ onOpenPomodoro }) => {
  const { schedule, setSchedule, toggleScheduleTask, progress, books, language } = useApp();

  const [examDate, setExamDate] = useState('2026-10-24');
  const [dailyHours, setDailyHours] = useState(2.5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGenerateSchedule = async () => {
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const subjectList = Array.from(new Set(books.map((b) => b.subject)));
      const weakList = progress.weakTopics.map((w) => w.topic);

      const newPlan = await generateStudySchedule(
        examDate,
        dailyHours,
        subjectList,
        weakList,
        language
      );

      setSchedule(newPlan);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to generate schedule');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-white">Personalized Study Schedule</h1>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold border border-indigo-500/30">
              Ebbinghaus Spaced Model
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Scientifically optimized review intervals designed to maximize long-term retention and target exam readiness.
          </p>
        </div>

        <button
          onClick={onOpenPomodoro}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition shrink-0"
        >
          <Clock className="w-4 h-4" />
          <span>Launch Focus Clock</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {errorMsg}
        </div>
      )}

      {/* Spaced Repetition Milestones Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-indigo-500/20 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Spaced Repetition Decay Offsets
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Memory Retention: 92%</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {schedule.spacedRepetitionMilestones.map((ms, i) => (
            <div
              key={i}
              className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-1"
            >
              <span className="font-mono font-bold text-indigo-400 text-[11px] block">
                {ms.interval}
              </span>
              <p className="text-[11px] text-slate-300 line-clamp-2">{ms.action}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Schedule Customizer Inputs */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="space-y-1">
            <label className="text-slate-400 font-medium">Target Exam Date:</label>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-400 font-medium">Daily Available Hours:</label>
            <select
              value={dailyHours}
              onChange={(e) => setDailyHours(Number(e.target.value))}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value={1.5}>1.5 Hours/day</option>
              <option value={2.5}>2.5 Hours/day (Recommended)</option>
              <option value={4}>4.0 Hours/day (Intensive)</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleGenerateSchedule}
          disabled={isGenerating}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow transition"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isGenerating ? 'Computing Optimized Intervals...' : 'Recalculate Schedule'}</span>
        </button>
      </div>

      {/* Day by Day Plan List */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
          Study Days & Active Sessions
        </h3>

        <div className="grid grid-cols-1 gap-4">
          {schedule.days.map((day) => {
            const completedCount = day.sessions.filter((s) => s.completed).length;
            const progressPct =
              day.sessions.length > 0 ? (completedCount / day.sessions.length) * 100 : 0;

            return (
              <div
                key={day.dayNumber}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4"
              >
                {/* Day Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 font-mono font-bold text-xs flex items-center justify-center">
                      D{day.dayNumber}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{day.dayName}</h4>
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300 font-medium">
                          {day.focusSubject}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{day.theme}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-400 font-mono">
                      {completedCount} / {day.sessions.length} sessions done
                    </span>
                    <div className="w-20 bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Day Goal */}
                <div className="text-[11px] text-indigo-300 bg-indigo-950/30 px-3 py-1.5 rounded-lg border border-indigo-500/20">
                  🎯 <strong>Daily Goal:</strong> {day.dailyGoal}
                </div>

                {/* Sessions List */}
                <div className="space-y-2">
                  {day.sessions.map((sess) => (
                    <div
                      key={sess.id}
                      onClick={() => toggleScheduleTask(day.dayNumber, sess.id)}
                      className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition ${
                        sess.completed
                          ? 'bg-slate-950/50 border-slate-800/80 opacity-60'
                          : 'bg-slate-950 border-slate-800 hover:border-indigo-500/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                            sess.completed
                              ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                              : 'border-slate-600'
                          }`}
                        >
                          {sess.completed && <CheckCircle2 className="w-3.5 h-3.5 fill-current" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-semibold ${
                                sess.completed ? 'line-through text-slate-400' : 'text-slate-200'
                              }`}
                            >
                              {sess.topic}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                              {sess.technique}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {sess.timeSlot} • {sess.activity}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenPomodoro();
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                        title="Start timer for this task"
                      >
                        <Play className="w-3 h-3 fill-current" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
