import React, { useState } from 'react';
import { DDayEvent } from '../types/index.js';
import { api, calculateDDay } from '../utils/api.js';
import { Calendar, Plus, Trash2, Pin, Sparkles, Target } from 'lucide-react';

interface DDayModalProps {
  ddays: DDayEvent[];
  onRefresh: () => void;
  onClose: () => void;
}

export const DDayModal: React.FC<DDayModalProps> = ({
  ddays,
  onRefresh,
  onClose,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState('Competitive Exam');

  const handleAddDDay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetDate) return;
    try {
      await api.addDDay({
        title: title.trim(),
        targetDate,
        category,
      });
      setTitle('');
      setTargetDate('');
      setShowAddForm(false);
      onRefresh();
    } catch (e) {
      alert('Failed to add D-Day event');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this D-Day event?')) {
      await api.deleteDDay(id);
      onRefresh();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white">D-Day Countdowns</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <p className="text-xs text-slate-400">
          Track upcoming exams, tests, and target milestones with automatic day countdowns.
        </p>

        {/* D-Day List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {ddays.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No D-Day countdowns set yet.
            </div>
          ) : (
            ddays.map(event => {
              const ddayInfo = calculateDDay(event.targetDate);

              return (
                <div
                  key={event.id}
                  className="p-4 rounded-2xl bg-slate-950/70 border border-white/5 flex items-center justify-between shadow-sm"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{event.title}</span>
                      {event.isPinned && (
                        <Pin className="w-3 h-3 text-amber-400 fill-current" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="px-1.5 py-0.2 rounded bg-white/5 text-[10px]">
                        {event.category}
                      </span>
                      <span>Target: {event.targetDate}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-lg font-mono font-extrabold text-indigo-300">
                        {ddayInfo.label}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {ddayInfo.daysDiff} days left
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="text-slate-600 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Add Form */}
        {showAddForm ? (
          <form onSubmit={handleAddDDay} className="p-4 rounded-2xl bg-slate-950 border border-white/10 space-y-3">
            <div className="text-xs font-bold text-slate-300">New Target Countdown</div>
            <input
              type="text"
              required
              placeholder="e.g. Semester Exams, Board Finals, Competitive Target..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                required
                value={targetDate}
                onChange={e => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Competitive Exam">Competitive Exam</option>
                <option value="School / College">School / College</option>
                <option value="Mock Test">Mock Test</option>
                <option value="Personal Goal">Personal Goal</option>
              </select>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 rounded-lg bg-white/5 text-xs text-slate-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-indigo-500 text-xs font-semibold text-white"
              >
                Save D-Day
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full min-h-[44px] rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add D-Day Target</span>
          </button>
        )}
      </div>
    </div>
  );
};
