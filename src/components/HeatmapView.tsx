import React, { useState, useEffect } from 'react';
import { StudySession } from '../types/index.js';
import { api, formatSecondsToHuman } from '../utils/api.js';
import { Flame, Calendar, Info, Clock } from 'lucide-react';

interface HeatmapViewProps {
  onSelectDate?: (date: string) => void;
}

export const HeatmapView: React.FC<HeatmapViewProps> = ({ onSelectDate }) => {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDayInfo, setSelectedDayInfo] = useState<{ date: string; seconds: number; count: number } | null>(null);

  useEffect(() => {
    api.getSessions().then(res => {
      setSessions(res.sessions);
      setLoading(false);
    });
  }, []);

  // Map dates to total seconds
  const sessionsByDate: Record<string, { seconds: number; count: number; subjects: string[] }> = {};
  sessions.forEach(s => {
    if (!sessionsByDate[s.date]) {
      sessionsByDate[s.date] = { seconds: 0, count: 0, subjects: [] };
    }
    sessionsByDate[s.date].seconds += s.durationSeconds;
    sessionsByDate[s.date].count += 1;
    if (!sessionsByDate[s.date].subjects.includes(s.subjectName)) {
      sessionsByDate[s.date].subjects.push(s.subjectName);
    }
  });

  // Generate 52 weeks of dates ending today
  const weeks = [];
  const today = new Date();
  const currentDayOfWeek = today.getDay(); // 0 is Sunday

  // Start 52 weeks ago on Sunday
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - currentDayOfWeek - 51 * 7);

  let tempDate = new Date(startDate);
  for (let w = 0; w < 52; w++) {
    const weekDays = [];
    for (let d = 0; d < 7; d++) {
      const dStr = tempDate.toISOString().split('T')[0];
      const data = sessionsByDate[dStr] || { seconds: 0, count: 0, subjects: [] };
      weekDays.push({
        date: dStr,
        dayNum: tempDate.getDate(),
        seconds: data.seconds,
        count: data.count,
        subjects: data.subjects,
        isFuture: tempDate > today,
      });
      tempDate.setDate(tempDate.getDate() + 1);
    }
    weeks.push(weekDays);
  }

  // Color intensity calculator based on study hours (0h, <1h, 1-3h, 3-6h, >6h)
  const getCellColor = (seconds: number, isFuture: boolean) => {
    if (isFuture) return 'bg-transparent border border-white/5 opacity-20';
    if (seconds === 0) return 'bg-slate-900/60 border border-white/5';
    const hours = seconds / 3600;
    if (hours < 1) return 'bg-emerald-950/80 border border-emerald-800/40 text-emerald-400';
    if (hours < 3) return 'bg-emerald-700/80 border border-emerald-600/50 text-emerald-200';
    if (hours < 5) return 'bg-emerald-500 border border-emerald-400 text-slate-950';
    return 'bg-emerald-400 border border-emerald-300 text-slate-950 font-bold shadow-sm shadow-emerald-400/30';
  };

  const totalStudiedAllTime = sessions.reduce((acc, s) => acc + s.durationSeconds, 0);
  const activeDaysCount = Object.keys(sessionsByDate).length;

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <span className="text-xs font-semibold text-indigo-400 tracking-wider uppercase">
            STUDY HABIT ACTIVITY MAP
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-0.5">
            Yearly Study Heatmap
          </h1>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/10 text-xs font-mono text-emerald-400">
            {activeDaysCount} Days Active
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/10 text-xs font-mono text-indigo-300">
            {formatSecondsToHuman(totalStudiedAllTime)} Total
          </div>
        </div>
      </div>

      {/* Heatmap Grid Container */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/80 border border-white/10 shadow-2xl space-y-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-white uppercase tracking-wider">
            Past 52 Weeks Consistency Matrix
          </span>
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <span>Less</span>
            <div className="w-3 h-3 rounded bg-slate-900 border border-white/5" />
            <div className="w-3 h-3 rounded bg-emerald-950 border border-emerald-800/40" />
            <div className="w-3 h-3 rounded bg-emerald-700 border border-emerald-600/50" />
            <div className="w-3 h-3 rounded bg-emerald-500" />
            <div className="w-3 h-3 rounded bg-emerald-400" />
            <span>More Focus</span>
          </div>
        </div>

        {/* Scrollable Heatmap Columns */}
        <div className="overflow-x-auto pb-2">
          <div className="inline-flex gap-1 min-w-[740px]">
            {weeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-1">
                {week.map(day => (
                  <button
                    key={day.date}
                    onClick={() => {
                      setSelectedDayInfo({
                        date: day.date,
                        seconds: day.seconds,
                        count: day.count,
                      });
                      if (onSelectDate) onSelectDate(day.date);
                    }}
                    title={`${day.date}: ${formatSecondsToHuman(day.seconds)} (${day.count} sessions)`}
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-sm transition-all hover:scale-125 ${getCellColor(
                      day.seconds,
                      day.isFuture
                    )}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Day of Week Labels */}
        <div className="flex items-center gap-4 text-[10px] text-slate-500 font-mono">
          <span>Sun</span>
          <span>Mon</span>
          <span>Wed</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>
      </div>

      {/* Selected Day Inspector */}
      {selectedDayInfo && (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-white/10 shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-mono font-bold">
              📅
            </div>
            <div>
              <div className="text-sm font-bold text-white">
                {new Date(selectedDayInfo.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
              <div className="text-xs text-slate-400">
                {selectedDayInfo.count} verified session{selectedDayInfo.count !== 1 ? 's' : ''} logged
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-base font-bold font-mono text-emerald-400">
              {formatSecondsToHuman(selectedDayInfo.seconds)}
            </div>
            <div className="text-[10px] text-slate-500">recorded focus</div>
          </div>
        </div>
      )}
    </div>
  );
};
