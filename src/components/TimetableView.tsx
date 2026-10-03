import React, { useState, useEffect } from 'react';
import { TimetableBlock, Subject } from '../types/index.js';
import { api } from '../utils/api.js';
import { Clock, Plus, Trash2, Calendar, Edit3 } from 'lucide-react';

interface TimetableViewProps {
  subjects: Subject[];
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const TimetableView: React.FC<TimetableViewProps> = ({ subjects }) => {
  const [timetable, setTimetable] = useState<TimetableBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number>(1); // Monday default
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [blockDay, setBlockDay] = useState(1);
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('08:00');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [notes, setNotes] = useState('');

  const loadTimetable = async () => {
    try {
      const res = await api.getTimetable();
      setTimetable(res.timetable);
    } catch (e) {
      console.error('Failed to load timetable', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimetable();
  }, []);

  const handleAddBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    const sub = subjects.find(s => s.id === subjectId);
    const newBlock: TimetableBlock = {
      id: 'tt_' + Date.now(),
      userId: '',
      dayOfWeek: blockDay,
      startTime,
      endTime,
      subjectId,
      subjectName: sub?.name || 'Study',
      subjectColor: sub?.color || '#6366f1',
      notes,
    };

    const updated = [...timetable, newBlock];
    setTimetable(updated);
    setShowAddModal(false);
    setNotes('');
    await api.saveTimetable(updated);
  };

  const handleDeleteBlock = async (id: string) => {
    const updated = timetable.filter(b => b.id !== id);
    setTimetable(updated);
    await api.saveTimetable(updated);
  };

  const dayBlocks = timetable
    .filter(b => b.dayOfWeek === selectedDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <span className="text-xs font-semibold text-indigo-400 tracking-wider uppercase">
            WEEKLY SCHEDULE & STUDY BLOCKS
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-0.5">
            Timetable
          </h1>
        </div>

        <button
          onClick={() => {
            setBlockDay(selectedDay);
            setShowAddModal(true);
          }}
          className="min-h-[44px] px-5 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Study Block</span>
        </button>
      </div>

      {/* Days Tabs Scroller */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/60 border border-white/5 overflow-x-auto">
        {DAYS.map((dayName, idx) => {
          const dayNum = idx + 1; // 1 = Mon ... 7 = Sun
          const isSelected = selectedDay === dayNum;
          const count = timetable.filter(b => b.dayOfWeek === dayNum).length;

          return (
            <button
              key={dayName}
              onClick={() => setSelectedDay(dayNum)}
              className={`flex-1 min-w-[90px] py-2.5 px-3 rounded-xl text-xs font-semibold transition-all flex flex-col items-center gap-1 ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{dayName.slice(0, 3)}</span>
              <span className={`text-[10px] font-mono ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>
                {count} blocks
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Day Timetable List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
            {DAYS[selectedDay - 1]} Schedule
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            {dayBlocks.length} planned session{dayBlocks.length !== 1 ? 's' : ''}
          </span>
        </div>

        {dayBlocks.length === 0 ? (
          <div className="p-8 rounded-3xl bg-slate-900/40 border border-white/5 text-center space-y-2">
            <Clock className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm text-slate-400">No study blocks planned for {DAYS[selectedDay - 1]}.</p>
            <button
              onClick={() => {
                setBlockDay(selectedDay);
                setShowAddModal(true);
              }}
              className="text-xs text-indigo-400 hover:underline"
            >
              + Create a schedule block
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {dayBlocks.map(block => (
              <div
                key={block.id}
                className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/80 border border-white/5 shadow-sm"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-1.5 h-10 rounded-full"
                    style={{ backgroundColor: block.subjectColor }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">
                        {block.subjectName}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">
                      {block.startTime} – {block.endTime}
                    </div>
                    {block.notes && (
                      <p className="text-xs text-slate-500 italic mt-0.5">
                        {block.notes}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteBlock(block.id)}
                  className="text-slate-500 hover:text-rose-400 p-2 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Block Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Add Schedule Block</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddBlock} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Day of the Week</label>
                <select
                  value={blockDay}
                  onChange={e => setBlockDay(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {DAYS.map((d, idx) => (
                    <option key={d} value={idx + 1}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Subject</label>
                <select
                  value={subjectId}
                  onChange={e => setSubjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Inorganic revision, Chapter 2 test..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="min-h-[44px] px-4 rounded-xl bg-white/5 text-slate-300 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25"
                >
                  Save Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
