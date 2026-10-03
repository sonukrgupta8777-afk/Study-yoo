import React, { useState } from 'react';
import { api } from '../utils/api.js';
import { Search, BookOpen, CheckSquare, Users, Book, Clock } from 'lucide-react';
import { Subject, TaskItem, BookItem, StudyGroup, StudySession } from '../types/index.js';

interface GlobalSearchModalProps {
  onClose: () => void;
  onSelectSubject?: (sub: Subject) => void;
  onOpenStudyRoom?: (grp: StudyGroup) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  onClose,
  onSelectSubject,
  onOpenStudyRoom,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    subjects: Subject[];
    tasks: TaskItem[];
    books: BookItem[];
    groups: StudyGroup[];
    sessions: StudySession[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (!val.trim()) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const res = await api.search(val.trim());
      setResults(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
        {/* Search Bar Input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            autoFocus
            placeholder="Search subjects, tasks, study rooms, books..."
            value={query}
            onChange={e => handleSearch(e.target.value)}
            className="w-full pl-11 pr-10 py-3 rounded-2xl bg-slate-950 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={onClose}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
          >
            ✕
          </button>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {loading && (
            <div className="text-center py-8 text-xs text-slate-500">Searching workspace...</div>
          )}

          {!loading && !results && (
            <div className="text-center py-8 text-xs text-slate-500">
              Type to search across subjects, tasks, books, and study groups.
            </div>
          )}

          {results && (
            <>
              {/* Subjects */}
              {results.subjects.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                    Subjects ({results.subjects.length})
                  </div>
                  {results.subjects.map(s => (
                    <div
                      key={s.id}
                      onClick={() => {
                        if (onSelectSubject) onSelectSubject(s);
                        onClose();
                      }}
                      className="p-3 rounded-xl bg-slate-950/60 hover:bg-slate-950 border border-white/5 flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{s.icon}</span>
                        <span className="text-sm font-semibold text-white">{s.name}</span>
                      </div>
                      <span className="text-xs text-indigo-400">Select</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Tasks */}
              {results.tasks.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                    Tasks ({results.tasks.length})
                  </div>
                  {results.tasks.map(t => (
                    <div
                      key={t.id}
                      className="p-3 rounded-xl bg-slate-950/60 border border-white/5 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <CheckSquare className="w-4 h-4 text-emerald-400" />
                        <span className="text-white font-medium">{t.title}</span>
                      </div>
                      <span className="text-slate-400">{t.dueDate}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Groups */}
              {results.groups.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                    Study Groups ({results.groups.length})
                  </div>
                  {results.groups.map(g => (
                    <div
                      key={g.id}
                      onClick={() => {
                        if (onOpenStudyRoom) onOpenStudyRoom(g);
                        onClose();
                      }}
                      className="p-3 rounded-xl bg-slate-950/60 hover:bg-slate-950 border border-white/5 flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{g.icon}</span>
                        <span className="text-sm font-semibold text-white">{g.name}</span>
                      </div>
                      <span className="text-xs text-emerald-400">Open Room</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Books */}
              {results.books.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                    Books ({results.books.length})
                  </div>
                  {results.books.map(b => (
                    <div
                      key={b.id}
                      className="p-3 rounded-xl bg-slate-950/60 border border-white/5 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-amber-400" />
                        <span className="text-white font-medium">{b.title}</span>
                      </div>
                      <span className="text-slate-400 font-mono">p. {b.currentPage}/{b.totalPages}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
