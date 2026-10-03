import React, { useState, useEffect } from 'react';
import { Subject, StudySession, TaskItem, PlannerBlock } from '../types/index.js';
import { api, formatSecondsToHuman } from '../utils/api.js';
import { Clock, Calendar, CheckSquare, Plus, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface PlannerViewProps {
  subjects: Subject[];
  onStartFocusWithSubject: (sub: Subject) => void;
}

export const PlannerView: React.FC<PlannerViewProps> = ({ subjects, onStartFocusWithSubject }) => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [blocks, setBlocks] = useState<PlannerBlock[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [planSubjectId, setPlanSubjectId] = useState(subjects[0]?.id || '');

  const loadDayData = async () => {
    try {
      const [sessRes, taskRes, planRes] = await Promise.all([
        api.getSessions({ date: selectedDate }),
        api.getTasks(),
        api.getPlanner(selectedDate),
      ]);
      setSessions(sessRes.sessions);
      setTasks(taskRes.tasks.filter(t => t.dueDate === selectedDate));
      setBlocks(planRes.blocks);
    } catch (e) {
      console.error('Error loading planner data', e);
    }
  };

  useEffect(() => {
    loadDayData();
  }, [selectedDate]);

  // Generate 10-minute slots from 06:00 to 24:00 (18 hours * 6 = 108 slots)
  const timeSlots: string[] = [];
  for (let hour = 6; hour < 24; hour++) {
    for (let min = 0; min < 60; min += 10) {
      const hStr = String(hour).padStart(2, '0');
      const mStr = String(min).padStart(2, '0');
      timeSlots.push(`${hStr}:${mStr}`);
    }
  }

  // Check if a time slot has an actual completed session
  const getSlotActivity = (slot: string) => {
    const [slotH, slotM] = slot.split(':').map(Number);
    const slotMinutes = slotH * 60 + slotM;

    for (const session of sessions) {
      const startD = new Date(session.startTimestamp);
      const endD = new Date(session.endTimestamp);
      const startMin = startD.getHours() * 60 + startD.getMinutes();
      const endMin = endD.getHours() * 60 + endD.getMinutes();

      if (slotMinutes >= startMin && slotMinutes < endMin) {
        return {
          type: 'actual',
          subjectName: session.subjectName,
          color: session.subjectColor,
          icon: session.subjectIcon,
        };
      }
    }

    // Check manual planned block
    const plan = blocks.find(b => b.timeSlot === slot);
    if (plan) {
      return {
        type: 'planned',
        subjectName: plan.subjectName || 'Planned',
        color: plan.subjectColor || '#6366f1',
        icon: '📝',
      };
    }

    return null;
  };

  const handleSlotClick = async (slot: string) => {
    const existing = blocks.find(b => b.timeSlot === slot);
    if (existing) {
      // Toggle off
      const next = blocks.filter(b => b.timeSlot !== slot);
      setBlocks(next);
      await api.savePlanner(selectedDate, next);
    } else {
      // Toggle on planned slot
      const sub = subjects.find(s => s.id === planSubjectId);
      const nextBlock: PlannerBlock = {
        id: 'pb_' + Date.now() + '_' + slot,
        userId: '',
        date: selectedDate,
        timeSlot: slot,
        subjectId: planSubjectId,
        subjectName: sub?.name,
        subjectColor: sub?.color,
        type: 'planned',
      };
      const next = [...blocks, nextBlock];
      setBlocks(next);
      await api.savePlanner(selectedDate, next);
    }
  };

  const totalActualMinutes = Math.round(
    sessions.reduce((acc, s) => acc + s.durationSeconds, 0) / 60
  );
  const totalPlannedMinutes = blocks.length * 10;

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <span className="text-xs font-semibold text-indigo-400 tracking-wider uppercase">
            10-MINUTE CHRONO TIMELINE
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-0.5">
            10-Minute Planner
          </h1>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-white/10 text-xs">
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="bg-transparent text-white font-mono focus:outline-none px-2"
          />
        </div>
      </div>

      {/* Planned vs Actual Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/5 space-y-1">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Actual Study</div>
          <div className="text-xl font-bold font-mono text-emerald-400">
            {formatSecondsToHuman(totalActualMinutes * 60)}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">{sessions.length} sessions</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/5 space-y-1">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Planned Study</div>
          <div className="text-xl font-bold font-mono text-indigo-400">
            {formatSecondsToHuman(totalPlannedMinutes * 60)}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">{blocks.length} blocks</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/5 space-y-1">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Adherence</div>
          <div className="text-xl font-bold font-mono text-amber-400">
            {totalPlannedMinutes > 0
              ? `${Math.min(100, Math.round((totalActualMinutes / totalPlannedMinutes) * 100))}%`
              : '100%'}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">Plan completion</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/5 space-y-1">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Due Tasks</div>
          <div className="text-xl font-bold font-mono text-rose-400">
            {tasks.filter(t => t.isCompleted).length} / {tasks.length}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">Tasks finished</div>
        </div>
      </div>

      {/* Plan Subject Selection Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Select Subject to Plan:</span>
          <select
            value={planSubjectId}
            onChange={e => setPlanSubjectId(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-white font-medium focus:outline-none"
          >
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
            ))}
          </select>
        </div>

        <div className="text-slate-400 text-[11px]">
          Tap any 10-minute slot to schedule or clear planned time.
        </div>
      </div>

      {/* 10-Minute Chrono Grid */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/80 border border-white/10 shadow-2xl space-y-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-white uppercase tracking-wider">
            Daily Timeline (06:00 – 24:00)
          </span>
          <div className="flex items-center gap-3 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500" />
              <span className="text-slate-300">Actual Session</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-indigo-500/40 border border-indigo-400" />
              <span className="text-slate-300">Planned Block</span>
            </span>
          </div>
        </div>

        {/* Hour Rows */}
        <div className="space-y-2">
          {Array.from({ length: 18 }).map((_, hourIdx) => {
            const hour = 6 + hourIdx;
            const hourStr = String(hour).padStart(2, '0');
            const hourSlots = [0, 10, 20, 30, 40, 50].map(
              m => `${hourStr}:${String(m).padStart(2, '0')}`
            );

            return (
              <div key={hour} className="flex items-center gap-2 sm:gap-4">
                <div className="w-12 text-right text-xs font-mono font-bold text-slate-400 shrink-0">
                  {hourStr}:00
                </div>

                <div className="flex-1 grid grid-cols-6 gap-1.5">
                  {hourSlots.map(slot => {
                    const activity = getSlotActivity(slot);
                    const isActual = activity?.type === 'actual';
                    const isPlanned = activity?.type === 'planned';

                    return (
                      <button
                        key={slot}
                        onClick={() => handleSlotClick(slot)}
                        title={`${slot} - ${activity ? `${activity.subjectName} (${activity.type})` : 'Empty'}`}
                        className={`h-7 rounded-lg transition-all text-[9px] font-mono flex items-center justify-center relative group border ${
                          isActual
                            ? 'bg-emerald-500/90 text-slate-950 font-bold border-emerald-400 shadow-sm'
                            : isPlanned
                            ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500 font-medium'
                            : 'bg-slate-950/60 hover:bg-white/10 text-slate-600 border-white/5'
                        }`}
                      >
                        <span className="truncate px-0.5">
                          {isActual ? activity.icon : isPlanned ? '10m' : ''}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
