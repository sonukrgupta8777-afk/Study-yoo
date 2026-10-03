import React, { useState, useEffect } from 'react';
import { api, formatSecondsToHuman, formatSecondsToDigital } from '../utils/api.js';
import { Users, UserPlus, Search, Flame, Check, Shield } from 'lucide-react';

interface FriendsModalProps {
  onClose: () => void;
}

export const FriendsModal: React.FC<FriendsModalProps> = ({ onClose }) => {
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [friendInput, setFriendInput] = useState('');
  const [addStatus, setAddStatus] = useState<string | null>(null);

  const loadFriends = async () => {
    try {
      const res = await api.getFriends();
      setFriends(res.friends);
    } catch (e) {
      console.error('Failed to load friends', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFriends();
  }, []);

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendInput.trim()) return;
    try {
      await api.addFriend(friendInput.trim());
      setAddStatus('Friend added successfully!');
      setFriendInput('');
      loadFriends();
      setTimeout(() => setAddStatus(null), 3000);
    } catch (err: any) {
      setAddStatus(err.message || 'User not found');
      setTimeout(() => setAddStatus(null), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white">Friends & Social Study</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        {/* Add Friend Form */}
        <form onSubmit={handleAddFriend} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Username or email (e.g. Ankit_420, Sonu)..."
            value={friendInput}
            onChange={e => setFriendInput(e.target.value)}
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="min-h-[40px] px-4 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </form>

        {addStatus && (
          <div className="text-xs text-indigo-300 bg-indigo-500/10 px-3 py-1.5 rounded-xl">
            {addStatus}
          </div>
        )}

        {/* Friends List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            My Study Network ({friends.length})
          </div>

          {loading ? (
            <div className="text-center py-8 text-xs text-slate-500">Loading friends...</div>
          ) : friends.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No friends added yet. Add peers by their username to see live focus status!
            </div>
          ) : (
            friends.map(f => (
              <div
                key={f.id}
                className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lg">
                      {f.avatar || '👤'}
                    </div>
                    <span
                      className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-950 ${
                        f.isStudying ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                      }`}
                    />
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-white">{f.username}</div>
                    <div className="text-xs text-slate-400">
                      {f.isStudying ? (
                        <span className="text-emerald-400 font-medium">
                          🟢 Focusing on {f.currentSubject || 'Study'}
                        </span>
                      ) : (
                        <span className="text-slate-500">⚫ Offline</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-indigo-300">
                    {formatSecondsToHuman(f.totalTodaySeconds)}
                  </div>
                  <div className="text-[10px] text-slate-500">today</div>
                </div>
              </div>
            ))
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full min-h-[44px] rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};
