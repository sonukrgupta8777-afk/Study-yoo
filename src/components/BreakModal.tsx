import React, { useState, useEffect } from 'react';
import { Coffee, Play, Square, SkipForward } from 'lucide-react';
import { formatSecondsToDigital } from '../utils/api.js';

interface BreakModalProps {
  breakMinutes: number;
  onFinishBreak: () => void;
  onContinueStudy: () => void;
  onClose: () => void;
}

export const BreakModal: React.FC<BreakModalProps> = ({
  breakMinutes,
  onFinishBreak,
  onContinueStudy,
  onClose,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(breakMinutes * 60);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused || secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onFinishBreak();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused, secondsLeft, onFinishBreak]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto shadow-inner">
          <Coffee className="w-8 h-8" />
        </div>

        <div>
          <span className="text-xs uppercase tracking-widest text-amber-400 font-semibold font-mono">
            RELAX & RECHARGE
          </span>
          <h2 className="text-2xl font-bold text-white mt-1">Study Break Active</h2>
          <p className="text-xs text-slate-400 mt-1">
            Rest your eyes, hydrate, and stretch before the next sprint.
          </p>
        </div>

        {/* Break Timer Display */}
        <div className="text-5xl sm:text-6xl font-bold font-mono tracking-tight text-white tabular-nums">
          {formatSecondsToDigital(secondsLeft)}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={onContinueStudy}
            className="min-h-[48px] rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Continue Study</span>
          </button>

          <button
            onClick={onFinishBreak}
            className="min-h-[48px] rounded-2xl bg-white/10 hover:bg-white/15 text-slate-200 text-sm font-semibold flex items-center justify-center gap-2 transition-all"
          >
            <Square className="w-4 h-4" />
            <span>End Break</span>
          </button>
        </div>
      </div>
    </div>
  );
};
