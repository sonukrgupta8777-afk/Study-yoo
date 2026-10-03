import React, { useState, useEffect } from 'react';
import { TaskItem, Subject, UserProfile } from '../types/index.js';
import { api } from '../utils/api.js';
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Calendar,
  Clock,
  AlertCircle,
  Filter,
  CheckCircle2
} from 'lucide-react';

interface TodoViewProps {
  user: UserProfile | null;
  subjects: Subject[];
}

export const TodoView: React.FC<TodoViewProps> = ({ user, subjects }) => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [estimatedMinutes, setEstimatedMinutes] = useState(45);
  const [notes, setNotes] = useState('');

  const loadTasks = async () => {
    try {
      const res = await api.getTasks();
      setTasks(res.tasks);
    } catch (e) {
      console.error('Failed to load tasks', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleToggleTask = async (task: TaskItem) => {
    try {
      const nextState = !task.isCompleted;
      // Optimistic update
      setTasks(prev => prev.map(t => (t.id === task.id ? { ...t, isCompleted: nextState } : t)));
      await api.updateTask(task.id, { isCompleted: nextState });
    } catch (e) {
      loadTasks();
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      setTasks(prev => prev.filter(t => t.id !== id));
      await api.deleteTask(id);
    } catch (e) {
      loadTasks();
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const sub = subjects.find(s => s.id === subjectId);
    try {
      const res = await api.addTask({
        title: title.trim(),
        subjectId,
        subjectName: sub?.name || 'General',
        dueDate,
        priority,
        estimatedMinutes: Number(estimatedMinutes),
        notes: notes.trim(),
      });
      setTasks(prev => [res.task, ...prev]);
      setShowAddModal(false);
      setTitle('');
      setNotes('');
    } catch (e) {
      alert('Failed to add task');
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (filterSubject !== 'all' && t.subjectId !== filterSubject) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    return true;
  });

  const pendingTasks = filteredTasks.filter(t => !t.isCompleted);
  const completedTasks = filteredTasks.filter(t => t.isCompleted);

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <span className="text-xs font-semibold text-indigo-400 tracking-wider uppercase">
            TASK MANAGEMENT & PLANNER
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-0.5">
            To-Do List
          </h1>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="min-h-[44px] px-5 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-2 rounded-2xl bg-slate-900/60 border border-white/5">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 px-2 font-medium">
          <Filter className="w-3.5 h-3.5" />
          <span>Subject:</span>
        </div>
        <button
          onClick={() => setFilterSubject('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
            filterSubject === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          All
        </button>
        {subjects.map(s => (
          <button
            key={s.id}
            onClick={() => setFilterSubject(s.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 ${
              filterSubject === s.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>{s.icon}</span>
            <span>{s.name}</span>
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {/* Pending Tasks */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Active Tasks ({pendingTasks.length})
          </h2>
          {pendingTasks.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 text-center text-xs text-slate-400">
              No pending tasks. Great job staying on track!
            </div>
          ) : (
            pendingTasks.map(task => (
              <div
                key={task.id}
                onClick={() => handleToggleTask(task)}
                className="group p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-white/5 hover:border-indigo-500/30 transition-all flex items-start justify-between gap-3 cursor-pointer shadow-sm"
              >
                <div className="flex items-start gap-3.5 flex-1">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleToggleTask(task);
                    }}
                    className="mt-0.5 text-slate-400 hover:text-indigo-400 transition-colors"
                  >
                    <Square className="w-5 h-5" />
                  </button>

                  <div className="space-y-1 flex-1">
                    <div className="text-sm font-semibold text-white group-hover:text-indigo-200 transition-colors">
                      {task.title}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      {task.subjectName && (
                        <span className="font-medium text-indigo-300">
                          {task.subjectName}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>Due: {task.dueDate}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>~{task.estimatedMinutes}m</span>
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          task.priority === 'high'
                            ? 'text-rose-400'
                            : task.priority === 'medium'
                            ? 'text-amber-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {task.priority} Priority
                      </span>
                    </div>

                    {task.notes && (
                      <p className="text-xs text-slate-400 pt-0.5 line-clamp-1 italic">
                        {task.notes}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={e => {
                    e.stopPropagation();
                    handleDeleteTask(task.id);
                  }}
                  className="text-slate-500 hover:text-rose-400 p-1 rounded-lg hover:bg-white/5 transition-colors"
                  title="Delete task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <div className="space-y-2 pt-4">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
              Completed Tasks ({completedTasks.length})
            </h2>
            {completedTasks.map(task => (
              <div
                key={task.id}
                onClick={() => handleToggleTask(task)}
                className="p-3.5 rounded-2xl bg-slate-950/40 border border-white/5 flex items-center justify-between gap-3 cursor-pointer opacity-75"
              >
                <div className="flex items-center gap-3 flex-1">
                  <CheckSquare className="w-5 h-5 text-emerald-400" />
                  <div className="line-through text-sm text-slate-400">
                    {task.title}
                  </div>
                </div>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    handleDeleteTask(task.id);
                  }}
                  className="text-slate-600 hover:text-rose-400 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Create New Task</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Complete Human Physiology"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Subject</label>
                  <select
                    value={subjectId}
                    onChange={e => setSubjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.icon} {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Priority</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Est. Minutes</label>
                  <input
                    type="number"
                    min={5}
                    max={360}
                    value={estimatedMinutes}
                    onChange={e => setEstimatedMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Additional instructions, page numbers, links..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
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
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
