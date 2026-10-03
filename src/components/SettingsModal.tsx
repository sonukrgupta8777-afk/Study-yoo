import React, { useState } from 'react';
import { UserProfile, UserPrivacySettings } from '../types/index.js';
import { api } from '../utils/api.js';
import { User, Shield, Target, LogOut, Check } from 'lucide-react';

interface SettingsModalProps {
  user: UserProfile | null;
  onUpdateUser: (user: UserProfile) => void;
  onClose: () => void;
  onLogout: () => void;
}

const AVATARS = ['👨‍🎓', '👩‍🎓', '⚡', '🌱', '🔬', '🔥', '📚', '🎯', '🐱', '🦊'];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  user,
  onUpdateUser,
  onClose,
  onLogout,
}) => {
  const [username, setUsername] = useState(user?.username || '');
  const [avatar, setAvatar] = useState(user?.avatar || '👨‍🎓');
  const [dailyGoalHours, setDailyGoalHours] = useState(Math.round((user?.dailyGoalMinutes || 360) / 60));
  const [minStreakMin, setMinStreakMin] = useState(user?.minStreakMinutes || 30);
  const [privacy, setPrivacy] = useState<UserPrivacySettings>(
    user?.privacySettings || {
      showOnlineStatus: true,
      showStudyStatus: true,
      showCurrentSubject: true,
      showStudyDuration: true,
      showStatistics: true,
      showProfile: true,
      allowGroupInvitations: true,
    }
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.updateProfile({
        username: username.trim(),
        avatar,
        dailyGoalMinutes: dailyGoalHours * 60,
        minStreakMinutes: Number(minStreakMin),
        privacySettings: privacy,
      });
      onUpdateUser(res.user);
      onClose();
    } catch (err) {
      alert('Failed to update settings');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white">Profile & Study Goals</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Avatar Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Choose Avatar</label>
            <div className="flex items-center gap-2 overflow-x-auto p-1">
              {AVATARS.map(av => (
                <button
                  type="button"
                  key={av}
                  onClick={() => setAvatar(av)}
                  className={`w-10 h-10 rounded-2xl text-xl flex items-center justify-center transition-all ${
                    avatar === av
                      ? 'bg-indigo-600/30 border border-indigo-500 scale-110'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Goals */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Daily Study Target</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={dailyGoalHours}
                  onChange={e => setDailyGoalHours(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
                <span className="text-xs text-slate-400">hours</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Min. Streak Time</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={10}
                  max={120}
                  step={5}
                  value={minStreakMin}
                  onChange={e => setMinStreakMin(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
                <span className="text-xs text-slate-400">mins</span>
              </div>
            </div>
          </div>

          {/* Privacy Controls */}
          <div className="space-y-2 pt-2 border-t border-white/5">
            <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Social Privacy Controls</span>
            </div>

            <div className="space-y-2 bg-slate-950/60 p-3 rounded-2xl border border-white/5 text-xs">
              {[
                { key: 'showStudyStatus', label: 'Show live study status to friends' },
                { key: 'showCurrentSubject', label: 'Show current subject name when focusing' },
                { key: 'showStudyDuration', label: 'Show active timer duration' },
                { key: 'showStatistics', label: 'Show profile stats on leaderboard' },
                { key: 'allowGroupInvitations', label: 'Allow peer group study invitations' },
              ].map(item => (
                <label key={item.key} className="flex items-center justify-between cursor-pointer py-1">
                  <span className="text-slate-300">{item.label}</span>
                  <input
                    type="checkbox"
                    checked={(privacy as any)[item.key]}
                    onChange={e =>
                      setPrivacy(prev => ({ ...prev, [item.key]: e.target.checked }))
                    }
                    className="rounded accent-indigo-500 w-4 h-4"
                  />
                </label>
              ))}
            </div>

            {/* Danger Zone: Reset App Data */}
            <div className="pt-3 border-t border-white/5 space-y-2">
              <span className="text-xs font-semibold text-rose-400">Danger Zone</span>
              <div className="p-3 rounded-2xl bg-rose-950/20 border border-rose-500/20 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Reset App Data</span>
                  <span className="text-[10px] text-slate-400 block">Clear study records, active timers and restore clean factory state</span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm('Are you sure you want to reset the app? All study sessions, timers, and customized workspace settings will be cleared.')) {
                      await api.resetAppData();
                      localStorage.clear();
                      window.location.reload();
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-semibold transition-all shrink-0"
                >
                  Reset App
                </button>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <button
              type="button"
              onClick={onLogout}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 p-2 rounded-xl hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] px-4 rounded-xl bg-white/5 text-slate-300 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-[44px] px-5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25"
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
