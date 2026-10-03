import React, { useState } from 'react';
import { Target, Clock, Flame, Check, Sparkles, Trophy, Zap, AlertCircle } from 'lucide-react';
import { formatSecondsToHuman } from '../utils/api.js';

interface DailyTargetModalProps {
  currentGoalMinutes: number;
  todayStudiedSeconds: number;
  onSave: (minutes: number) => void;
  onClose: () => void;
}

const PRESETS = [
  { hours: 4, minutes: 240, label: '4 Hours', subtitle: 'Light / Revision', icon: '🌱' },
  { hours: 6, minutes: 360, label: '6 Hours', subtitle: 'Standard Study', icon: '📚' },
  { hours: 8, minutes: 480, label: '8 Hours', subtitle: 'Intensive Focus', icon: '🎯', badge: 'Popular' },
  { hours: 10, minutes: 600, label: '10 Hours', subtitle: 'Hardcore Prep', icon: '⚡', badge: 'Challenger' },
  { hours: 12, minutes: 720, label: '12 Hours', subtitle: 'Extreme Marathon', icon: '🚀', badge: 'Elite' },
  { hours: 14, minutes: 840, label: '14 Hours', subtitle: 'All-Day Grind', icon: '🔥', badge: 'Ultra' },
];

export const DailyTargetModal: React.FC<DailyTargetModalProps> = ({
  currentGoalMinutes,
  todayStudiedSeconds,
  onSave,
  onClose,
}) => {
  const [selectedMinutes, setSelectedMinutes] = useState(currentGoalMinutes || 480);
  const [customHours, setCustomHours] = useState(Math.round(selectedMinutes / 60));

  const targetSeconds = selectedMinutes * 60;
  const progressPercent = Math.min(100, Math.round((todayStudiedSeconds / targetSeconds) * 100));
  const remainingSeconds = Math.max(0, targetSeconds - todayStudiedSeconds);

  const handleSelectPreset = (mins: number) => {
    setSelectedMinutes(mins);
    setCustomHours(Math.round(mins / 60));
  };

  const handleSliderChange = (hrs: number) => {
    setCustomHours(hrs);
    setSelectedMinutes(hrs * 60);
  };

  const handleSave = () => {
    onSave(selectedMinutes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Today Focus Target
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                  {Math.round(selectedMinutes / 60)} Hours
                </span>
              </h3>
              <p className="text-xs text-slate-400">Set daily target (8 hr, 10 hr, 12 hr) &amp; track progress</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Current Progress Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 to-slate-900/80 border border-indigo-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                TODAY COMPLETED
              </div>
              <div className="text-xl font-bold font-mono text-white">
                {formatSecondsToHuman(todayStudiedSeconds)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-bold">
                TARGET: {Math.round(selectedMinutes / 60)}h
              </div>
              <div className="text-xl font-bold font-mono text-indigo-300">
                {progressPercent}%
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              {remainingSeconds > 0 ? (
                <>
                  <span className="text-amber-300 font-semibold">{formatSecondsToHuman(remainingSeconds)}</span> remaining to hit target
                </>
              ) : (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  🎉 Target achieved for today!
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Quick Presets: 4hr, 6hr, 8hr, 10hr, 12hr, 14hr */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Quick Focus Targets (8hr, 10hr, 12hr)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {PRESETS.map(preset => {
              const isSelected = selectedMinutes === preset.minutes;
              return (
                <button
                  key={preset.minutes}
                  onClick={() => handleSelectPreset(preset.minutes)}
                  className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500 shadow-md shadow-indigo-600/10 ring-1 ring-indigo-500/30'
                      : 'bg-slate-950/60 border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg">{preset.icon}</span>
                    {preset.badge && (
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                        preset.hours === 8 ? 'bg-indigo-500/20 text-indigo-300' :
                        preset.hours === 10 ? 'bg-amber-500/20 text-amber-300' :
                        'bg-purple-500/20 text-purple-300'
                      }`}>
                        {preset.badge}
                      </span>
                    )}
                  </div>
                  <div className="mt-2">
                    <div className={`text-sm font-bold ${isSelected ? 'text-indigo-200' : 'text-white'}`}>
                      {preset.label}
                    </div>
                    <div className="text-[10px] text-slate-400">{preset.subtitle}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Hours Slider */}
        <div className="space-y-2 pt-2 border-t border-white/5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-semibold">Custom Target Slider</span>
            <span className="font-mono text-indigo-400 font-bold">{customHours} Hours ({customHours * 60} mins)</span>
          </div>
          <input
            type="range"
            min={1}
            max={16}
            step={1}
            value={customHours}
            onChange={e => handleSliderChange(Number(e.target.value))}
            className="w-full accent-indigo-500"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>1h</span>
            <span>4h</span>
            <span>8h (Intense)</span>
            <span>10h (Hardcore)</span>
            <span>14h</span>
            <span>16h</span>
          </div>
        </div>

        {/* Save & Confirm Button */}
        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Set Today's Target ({Math.round(selectedMinutes / 60)}hr)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
