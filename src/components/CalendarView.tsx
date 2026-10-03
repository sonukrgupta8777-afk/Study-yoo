import React, { useState, useEffect } from 'react';
import { StudySession, TaskItem, Subject } from '../types/index.js';
import { api, formatSecondsToHuman, formatSecondsToDigital } from '../utils/api.js';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  CheckCircle2,
  CalendarCheck
} from 'lucide-react';

interface CalendarViewProps {
  subjects: Subject[];
}

export const CalendarView: React.FC<CalendarViewProps> = ({ subjects }) => {
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPlanModal, setShowAddPlanModal] = useState(false);
  const [planSubjectId, setPlanSubjectId] = useState(subjects[0]?.id || '');
  const [planMinutes, setPlanMinutes] = useState(60);
  const [planNotes, setPlanNotes] = useState('');

  const loadData = async () => {
    try {
      const [sessRes, taskRes] = await Promise.all([
        api.getSessions(),
        api.getTasks(),
      ]);
      setSessions(sessRes.sessions);
      setTasks(taskRes.tasks);
    } catch (e) {
      console.error('Failed to load calendar data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    const sub = subjects.find(s => s.id === planSubjectId);
    try {
      await api.addTask({
        title: `Plan: ${sub?.name || 'Study'} (${planMinutes}m)`,
        subjectId: planSubjectId,
        subjectName: sub?.name,
        dueDate: selectedDate,
        priority: 'medium',
        estimatedMinutes: planMinutes,
        notes: planNotes,
      });
      setShowAddPlanModal(false);
      setPlanNotes('');
      loadData();
    } catch (e) {
      alert('Failed to save planned study');
    }
  };

  // Group study sessions by date
  const sessionsByDate: Record<string, StudySession[]> = {};
  sessions.forEach(s => {
    if (!sessionsByDate[s.date]) sessionsByDate[s.date] = [];
    sessionsByDate[s.date].push(s);
  });

  const selectedDateSessions = sessionsByDate[selectedDate] || [];
  const selectedDateTasks = tasks.filter(t => t.dueDate === selectedDate);
  const selectedDateTotalSeconds = selectedDateSessions.reduce((acc, s) => acc + s.durationSeconds, 0);

  // Month navigation
  const currentDateObj = new Date(selectedDate);
  const year = currentDateObj.getFullYear();
  const month = currentDateObj.getMonth();

  const handlePrevMonth = () => {
    const prev = new Date(year, month - 1, 1);
    setSelectedDate(prev.toISOString().split('T')[0]);
  };

  const handleNextMonth = () => {
    const next = new Date(year, month + 1, 1);
    setSelectedDate(next.toISOString().split('T')[0]);
  };

  // Generate days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const calendarDays = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push(dStr);
  }

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <span className="text-xs font-semibold text-indigo-400 tracking-wider uppercase">
            STUDY TIMELINE & ARCHIVE
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-0.5">
            Study Calendar
          </h1>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Mode toggle */}
          <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/5 text-xs">
            {(['month', 'week', 'day'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded-lg capitalize transition-colors ${
                  viewMode === mode ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAddPlanModal(true)}
            className="min-h-[40px] px-4 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-500/25 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Plan</span>
          </button>
        </div>
      </div>

      {/* Month Navigator Header */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/60 border border-white/5">
        <button
          onClick={handlePrevMonth}
          className="min-h-[38px] min-w-[38px] rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-base font-bold text-white">
          {currentDateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>

        <button
          onClick={handleNextMonth}
          className="min-h-[38px] min-w-[38px] rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Month Grid */}
      {viewMode === 'month' && (
        <div className="p-4 sm:p-6 rounded-3xl bg-slate-900/80 border border-white/10 shadow-xl backdrop-blur-xl">
          {/* Day of week headers */}
          <div className="grid grid-cols-7 gap-2 mb-3 text-center text-xs font-semibold text-slate-400">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((dStr, idx) => {
              if (!dStr) {
                return <div key={`empty_${idx}`} className="h-16 sm:h-20 rounded-2xl bg-transparent" />;
              }

              const dayNum = parseInt(dStr.split('-')[2], 10);
              const isSelected = selectedDate === dStr;
              const isToday = dStr === new Date().toISOString().split('T')[0];
              const daySessions = sessionsByDate[dStr] || [];
              const totalSec = daySessions.reduce((a, b) => a + b.durationSeconds, 0);

              return (
                <div
                  key={dStr}
                  onClick={() => setSelectedDate(dStr)}
                  className={`h-16 sm:h-20 p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500 shadow-md'
                      : isToday
                      ? 'bg-white/5 border-white/20'
                      : 'bg-slate-950/40 hover:bg-white/[0.04] border-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        isSelected ? 'text-indigo-300' : isToday ? 'text-white' : 'text-slate-400'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {totalSec > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                    )}
                  </div>

                  {totalSec > 0 ? (
                    <div className="text-[10px] font-mono font-semibold text-emerald-400 truncate">
                      {formatSecondsToHuman(totalSec)}
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-600 font-mono">—</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Day Details Panel */}
      <div className="space-y-4 p-5 sm:p-6 rounded-3xl bg-slate-900/80 border border-white/10 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div>
            <div className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">
              ACTIVITY DETAILS
            </div>
            <h3 className="text-lg font-bold text-white">
              {new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </h3>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-400">Total Studied</div>
            <div className="text-base font-bold font-mono text-emerald-400">
              {formatSecondsToHuman(selectedDateTotalSeconds)}
            </div>
          </div>
        </div>

        {/* Sessions recorded for this day */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Completed Sessions ({selectedDateSessions.length})
          </div>

          {selectedDateSessions.length === 0 ? (
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-slate-500 text-center">
              No study sessions recorded for this day.
            </div>
          ) : (
            selectedDateSessions.map(session => (
              <div
                key={session.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/60 border border-white/5"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
                    style={{ backgroundColor: `${session.subjectColor}20`, color: session.subjectColor }}
                  >
                    {session.subjectIcon}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{session.subjectName}</div>
                    <div className="text-xs text-slate-500">
                      {new Date(session.startTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {' – '}
                      {new Date(session.endTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                <div className="text-sm font-mono font-bold text-indigo-300">
                  {formatSecondsToHuman(session.durationSeconds)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Planned Tasks / Deadlines for this day */}
        <div className="space-y-2 pt-2">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Scheduled Tasks & Deadlines ({selectedDateTasks.length})
          </div>

          {selectedDateTasks.length === 0 ? (
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-slate-500 text-center">
              No tasks scheduled for this day.
            </div>
          ) : (
            selectedDateTasks.map(t => (
              <div
                key={t.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-white/5 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className={t.isCompleted ? 'text-emerald-400' : 'text-slate-400'}>
                    {t.isCompleted ? '☑' : '☐'}
                  </span>
                  <span className={t.isCompleted ? 'line-through text-slate-500' : 'text-white'}>
                    {t.title}
                  </span>
                </div>
                <span className="text-slate-400 font-mono">~{t.estimatedMinutes}m</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Plan Modal */}
      {showAddPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Add Planned Study Session</h3>
              <button onClick={() => setShowAddPlanModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddPlan} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Target Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Subject</label>
                  <select
                    value={planSubjectId}
                    onChange={e => setPlanSubjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.icon} {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Target Minutes</label>
                  <input
                    type="number"
                    min={15}
                    max={360}
                    value={planMinutes}
                    onChange={e => setPlanMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Study Notes</label>
                <textarea
                  rows={2}
                  placeholder="Target chapters or focus goals..."
                  value={planNotes}
                  onChange={e => setPlanNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowAddPlanModal(false)}
                  className="min-h-[44px] px-4 rounded-xl bg-white/5 text-slate-300 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25"
                >
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
