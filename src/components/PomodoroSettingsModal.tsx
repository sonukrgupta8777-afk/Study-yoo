import React, { useState } from 'react';
import { BreakSettings, UserPreferences } from '../types/index.js';
import { Timer, Coffee, Play, Sliders } from 'lucide-react';

interface PomodoroSettingsModalProps {
  preferences: UserPreferences;
  onUpdatePreferences: (updates: Partial<UserPreferences>) => void;
  onClose: () => void;
}

export const PomodoroSettingsModal: React.FC<PomodoroSettingsModalProps> = ({
  preferences,
  onUpdatePreferences,
  onClose,
}) => {
  const current = preferences.breakSettings || {
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    pomodoroFocusMinutes: 25,
    autoStartBreak: false,
    skipBreak: false,
  };

  const [focusMin, setFocusMin] = useState(current.pomodoroFocusMinutes);
  const [shortBreak, setShortBreak] = useState(current.shortBreakMinutes);
  const [longBreak, setLongBreak] = useState(current.longBreakMinutes);
  const [autoStart, setAutoStart] = useState(current.autoStartBreak);
  const [skipBreak, setSkipBreak] = useState(current.skipBreak);

  const handleSave = () => {
    onUpdatePreferences({
      breakSettings: {
        pomodoroFocusMinutes: Number(focusMin),
        shortBreakMinutes: Number(shortBreak),
        longBreakMinutes: Number(longBreak),
        autoStartBreak: autoStart,
        skipBreak: skipBreak,
      },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white">Pomodoro & Break Rules</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-semibold">Focus Session Duration</span>
              <span className="font-mono text-indigo-400">{focusMin} minutes</span>
            </div>
            <input
              type="range"
              min={10}
              max={120}
              step={5}
              value={focusMin}
              onChange={e => setFocusMin(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-semibold">Short Break Duration</span>
              <span className="font-mono text-emerald-400">{shortBreak} minutes</span>
            </div>
            <input
              type="range"
              min={2}
              max={20}
              step={1}
              value={shortBreak}
              onChange={e => setShortBreak(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-semibold">Long Break Duration</span>
              <span className="font-mono text-amber-400">{longBreak} minutes</span>
            </div>
            <input
              type="range"
              min={10}
              max={45}
              step={5}
              value={longBreak}
              onChange={e => setLongBreak(Number(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          {/* Toggle Switches */}
          <div className="space-y-2 pt-2 border-t border-white/5">
            <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-white/5 cursor-pointer">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-white">Auto-Start Breaks</span>
                <p className="text-[11px] text-slate-400">Launch break timer immediately when focus completes</p>
              </div>
              <input
                type="checkbox"
                checked={autoStart}
                onChange={e => setAutoStart(e.target.checked)}
                className="rounded accent-indigo-500 w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-white/5 cursor-pointer">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-white">Skip Breaks Automatically</span>
                <p className="text-[11px] text-slate-400">Jump directly to next focus session without pause</p>
              </div>
              <input
                type="checkbox"
                checked={skipBreak}
                onChange={e => setSkipBreak(e.target.checked)}
                className="rounded accent-indigo-500 w-4 h-4"
              />
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
          <button
            onClick={onClose}
            className="min-h-[44px] px-4 rounded-xl bg-white/5 text-slate-300 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="min-h-[44px] px-5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
