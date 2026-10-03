import React, { useState, useEffect } from 'react';
import { ChallengeItem, UserProfile } from '../types/index.js';
import { api, formatSecondsToHuman } from '../utils/api.js';
import { Trophy, Plus, Users, Flame, CheckCircle, Calendar, Target } from 'lucide-react';

interface ChallengesViewProps {
  user: UserProfile | null;
}

export const ChallengesView: React.FC<ChallengesViewProps> = ({ user }) => {
  const [challenges, setChallenges] = useState<ChallengeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetHours, setTargetHours] = useState(50);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 14 * 86400 * 1000).toISOString().split('T')[0]
  );

  const loadChallenges = async () => {
    try {
      const res = await api.getChallenges();
      setChallenges(res.challenges);
    } catch (e) {
      console.error('Failed to load challenges', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChallenges();
  }, []);

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const res = await api.createChallenge({
        title: title.trim(),
        description: description.trim(),
        targetHours: Number(targetHours),
        startDate: new Date().toISOString().split('T')[0],
        endDate,
        isGroup: false,
      });
      setChallenges(prev => [res.challenge, ...prev]);
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
    } catch (e) {
      alert('Failed to create challenge');
    }
  };

  const handleJoin = async (id: string) => {
    try {
      await api.joinChallenge(id);
      loadChallenges();
    } catch (e) {
      alert('Failed to join challenge');
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <span className="text-xs font-semibold text-indigo-400 tracking-wider uppercase">
            TARGETS & STREAK ACCELERATORS
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-0.5">
            Study Challenges
          </h1>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="min-h-[44px] px-5 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Challenge</span>
        </button>
      </div>

      {/* Challenges List */}
      <div className="space-y-4">
        {challenges.map(ch => {
          const targetSeconds = ch.targetHours * 3600;
          const completedSeconds = ch.totalSecondsStudied || 0;
          const progressPercent = Math.min(100, Math.round((completedSeconds / targetSeconds) * 100));
          const isMember = user ? ch.participants.includes(user.id) : false;

          return (
            <div
              key={ch.id}
              className="p-5 sm:p-6 rounded-3xl bg-slate-900/80 border border-white/5 shadow-xl space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center text-xl shrink-0">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">
                      {ch.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {ch.description || 'Target study challenge.'}
                    </p>
                  </div>
                </div>

                <div className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-xs font-mono text-indigo-300 shrink-0">
                  Target: {ch.targetHours}h
                </div>
              </div>

              {/* Progress Bar & Details */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono">
                    Completed: {formatSecondsToHuman(completedSeconds)} / {ch.targetHours}h
                  </span>
                  <span className="font-mono font-bold text-indigo-400">
                    {progressPercent}%
                  </span>
                </div>

                <div className="w-full h-2.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Ends: {ch.endDate}</span>
                  </span>

                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span>{ch.participants.length} participant{ch.participants.length !== 1 ? 's' : ''}</span>
                    </span>

                    {!isMember && (
                      <button
                        onClick={() => handleJoin(ch.id)}
                        className="px-3 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 font-semibold"
                      >
                        Join
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Create Challenge</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateChallenge} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Challenge Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 30 Day 100-Hour Focus Sprint"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Target Hours</label>
                  <input
                    type="number"
                    min={5}
                    max={500}
                    value={targetHours}
                    onChange={e => setTargetHours(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Description</label>
                <textarea
                  rows={2}
                  placeholder="Focus rules, subjects, motivation..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="min-h-[44px] px-4 rounded-xl bg-white/5 text-slate-300 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25"
                >
                  Start Challenge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
