import React, { useState, useEffect } from 'react';
import { api, formatSecondsToHuman, formatSecondsToDigital } from '../utils/api.js';
import { BarChart3, PieChart, Flame, Clock, Award, Calendar, TrendingUp } from 'lucide-react';

export const StatisticsView: React.FC = () => {
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('today');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      setLoading(true);
      const res = await api.getStatistics(period);
      setStats(res);
    } catch (e) {
      console.error('Failed to load stats', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [period]);

  const totalSec = stats?.totalStudySeconds || 0;
  const subjects = stats?.subjectBreakdown || [];

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-4xl mx-auto">
      {/* Header & Period Segmented Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <span className="text-xs font-semibold text-indigo-400 tracking-wider uppercase">
            ANALYTICS & HISTORICAL PERFORMANCE
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-0.5">
            Study Statistics
          </h1>
        </div>

        {/* Filter Period Tabs */}
        <div className="flex items-center bg-slate-900/80 p-1.5 rounded-2xl border border-white/10 text-xs self-start sm:self-auto overflow-x-auto">
          {(['today', 'week', 'month', 'year', 'all'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-xl capitalize font-semibold transition-all shrink-0 ${
                period === p
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {p === 'all' ? 'All Time' : p}
            </button>
          ))}
        </div>
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-3xl bg-slate-900/80 border border-white/5 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
            TOTAL FOCUS
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-indigo-300">
            {formatSecondsToHuman(totalSec)}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            {formatSecondsToDigital(totalSec)}
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900/80 border border-white/5 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
            STREAK
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400 flex items-center gap-1">
            <span>{stats?.streak || 0}</span>
            <span className="text-sm">DAYS</span>
            <Flame className="w-4 h-4 fill-current text-amber-400" />
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Min. {stats?.minStreakMinutes || 30}m / day
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900/80 border border-white/5 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
            AVERAGE SESSION
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
            {stats?.averageSessionSeconds ? formatSecondsToHuman(stats.averageSessionSeconds) : '0m'}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            {stats?.sessionCount || 0} sessions
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900/80 border border-white/5 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
            LONGEST SESSION
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-rose-400">
            {stats?.longestSessionSeconds ? formatSecondsToHuman(stats.longestSessionSeconds) : '0m'}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Deep focus peak
          </div>
        </div>
      </div>

      {/* Daily Study Activity Bar Chart (Past 7 Days) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/80 border border-white/10 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Recent 7 Days Focus Distribution
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">Hours per day</span>
        </div>

        <div className="h-44 flex items-end justify-between gap-2 sm:gap-4 pt-6 px-2">
          {stats?.past7Days?.map((d: any) => {
            const hours = d.seconds / 3600;
            // Max height reference 8 hours
            const heightPercent = Math.min(100, Math.max(8, (hours / 8) * 100));

            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  {hours.toFixed(1)}h
                </div>
                <div className="w-full max-w-[40px] bg-white/5 rounded-t-xl overflow-hidden flex flex-col justify-end h-full">
                  <div
                    className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-xl transition-all duration-500 group-hover:brightness-125"
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                <div className="text-xs font-semibold text-slate-400 group-hover:text-white transition-colors">
                  {d.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subject Distribution Breakdown */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/80 border border-white/10 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Most Studied Subjects
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {subjects.length} active subject{subjects.length !== 1 ? 's' : ''}
          </span>
        </div>

        {subjects.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            No study sessions recorded for this period yet.
          </div>
        ) : (
          <div className="space-y-3">
            {subjects
              .sort((a: any, b: any) => b.seconds - a.seconds)
              .map((sub: any) => {
                const percent = totalSec > 0 ? Math.round((sub.seconds / totalSec) * 100) : 0;

                return (
                  <div key={sub.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{sub.icon}</span>
                        <span className="font-semibold text-white">{sub.name}</span>
                      </div>
                      <div className="flex items-center gap-3 font-mono">
                        <span className="text-slate-400 font-semibold">{percent}%</span>
                        <span className="text-indigo-300 font-bold">
                          {formatSecondsToHuman(sub.seconds)}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: sub.color || '#6366f1',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
};
