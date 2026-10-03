import React, { useState, useEffect } from 'react';
import { AchievementItem } from '../types/index.js';
import { api } from '../utils/api.js';
import { Trophy, Award, Lock, CheckCircle2, Sparkles } from 'lucide-react';

interface AchievementsModalProps {
  onClose: () => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({ onClose }) => {
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAchievements().then(res => {
      setAchievements(res.achievements);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-6 h-6 text-amber-400" />
            <div>
              <h3 className="text-lg font-bold text-white">Study Milestones & Badges</h3>
              <div className="text-xs text-slate-400">
                {unlockedCount} of {achievements.length} badges unlocked
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        {/* Badges Grid */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {loading ? (
            <div className="text-center py-8 text-xs text-slate-500">Evaluating milestones...</div>
          ) : (
            achievements.map(badge => {
              const progressPct = Math.min(100, Math.round((badge.currentValue / badge.targetValue) * 100));

              return (
                <div
                  key={badge.id}
                  className={`p-4 rounded-2xl border transition-all flex items-start gap-4 ${
                    badge.unlocked
                      ? 'bg-slate-950/80 border-amber-500/30 shadow-md shadow-amber-500/5'
                      : 'bg-slate-950/40 border-white/5 opacity-70'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${
                      badge.unlocked
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-inner'
                        : 'bg-white/5 text-slate-600 grayscale'
                    }`}
                  >
                    {badge.icon}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{badge.title}</span>
                        {badge.unlocked ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-slate-500" />
                        )}
                      </div>
                      <span className="text-xs font-mono font-bold text-indigo-300">
                        {badge.currentValue} / {badge.targetValue}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      {badge.description}
                    </p>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden mt-2">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          badge.unlocked ? 'bg-amber-400' : 'bg-indigo-500'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full min-h-[44px] rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold transition-colors"
        >
          Close Trophies
        </button>
      </div>
    </div>
  );
};
