import React, { useState, useEffect } from 'react';
import { StudyGroup, UserProfile, GroupMemberLive } from '../types/index.js';
import { api } from '../utils/api.js';
import { Users, Plus, Lock, Search, ChevronRight, UserPlus, Flame, Shield, ArrowRight } from 'lucide-react';

interface GroupsViewProps {
  user: UserProfile | null;
  onOpenStudyRoom: (group: StudyGroup) => void;
}

export const GroupsView: React.FC<GroupsViewProps> = ({ user, onOpenStudyRoom }) => {
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupIcon, setNewGroupIcon] = useState('🔥');
  const [newGroupIsPrivate, setNewGroupIsPrivate] = useState(false);
  const [newGroupMax, setNewGroupMax] = useState(50);

  const fetchGroups = async () => {
    try {
      const res = await api.getGroups();
      setGroups(res.groups);
    } catch (e) {
      console.error('Error fetching groups', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    try {
      const res = await api.createGroup({
        name: newGroupName.trim(),
        description: newGroupDesc.trim(),
        icon: newGroupIcon,
        isPrivate: newGroupIsPrivate,
        maxMembers: Number(newGroupMax),
      });
      setShowCreateModal(false);
      setNewGroupName('');
      setNewGroupDesc('');
      fetchGroups();
      onOpenStudyRoom(res.group);
    } catch (e) {
      alert('Failed to create group');
    }
  };

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <span className="text-xs font-semibold text-indigo-400 tracking-wider uppercase">
            COMMUNITY & REAL-TIME FOCUS
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-0.5">
            Study Groups
          </h1>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="min-h-[44px] px-5 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Group</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search study groups by name or focus goal..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-900/60 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 backdrop-blur-xl"
        />
      </div>

      {/* Groups List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
            Active Study Rooms ({filteredGroups.length})
          </h2>
          <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Sync
          </span>
        </div>

        {loading ? (
          <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 text-center text-sm text-slate-400">
            Loading groups...
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
            <p className="text-sm text-slate-400">No study groups found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredGroups.map(group => (
              <div
                key={group.id}
                onClick={() => onOpenStudyRoom(group)}
                className="group p-5 rounded-3xl bg-slate-900/80 hover:bg-slate-900 border border-white/5 hover:border-indigo-500/30 transition-all cursor-pointer shadow-lg space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform shadow-inner">
                        {group.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                            {group.name}
                          </h3>
                          {group.isPrivate && (
                            <Lock className="w-3.5 h-3.5 text-amber-400" />
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          Led by {group.ownerName}
                        </div>
                      </div>
                    </div>

                    <div className="px-2.5 py-1 rounded-full bg-white/5 border border-white/5 text-xs font-mono text-slate-300">
                      {group.memberCount} / {group.maxMembers}
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 mt-3 leading-relaxed">
                    {group.description || 'Dedicated study room with real-time peer focus timer synchronization.'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs">
                  <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Enter Focus Room
                  </span>
                  <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-slate-300 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Create Study Group</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Group Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Padhe Le Yrr, NEET 2026 Batch..."
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Icon Emblem</label>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-white/10 overflow-x-auto">
                  {['🔥', '📚', '⚡', '🌙', '🧬', '🔬', '💡', '🎓', '🎯'].map(emoji => (
                    <button
                      type="button"
                      key={emoji}
                      onClick={() => setNewGroupIcon(emoji)}
                      className={`text-xl p-2 rounded-lg transition-transform ${
                        newGroupIcon === emoji ? 'bg-indigo-600/30 border border-indigo-500 scale-110' : 'hover:bg-white/5'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Description</label>
                <textarea
                  rows={2}
                  placeholder="Study goals, subject focus, rules..."
                  value={newGroupDesc}
                  onChange={e => setNewGroupDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Max Members</label>
                  <input
                    type="number"
                    min={2}
                    max={100}
                    value={newGroupMax}
                    onChange={e => setNewGroupMax(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1.5 flex flex-col justify-end">
                  <label className="flex items-center gap-2 py-2.5 px-3 rounded-xl bg-slate-950 border border-white/10 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newGroupIsPrivate}
                      onChange={e => setNewGroupIsPrivate(e.target.checked)}
                      className="rounded accent-indigo-500"
                    />
                    <span className="text-xs text-slate-300 font-medium">Private Group</span>
                  </label>
                </div>
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
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
