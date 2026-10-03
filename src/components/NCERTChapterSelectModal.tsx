import React, { useState } from 'react';
import { NCERTBook, NCERTChapter, UserBookProgress } from '../types/index.js';
import {
  X,
  BookOpen,
  ChevronRight,
  ExternalLink,
  Download,
  Search,
  Sparkles,
  Clock,
  Bookmark,
  FileText
} from 'lucide-react';

interface NCERTChapterSelectModalProps {
  book: NCERTBook;
  progress?: UserBookProgress | null;
  onSelectChapter: (chapter: NCERTChapter) => void;
  onContinueReading: () => void;
  onClose: () => void;
}

export const NCERTChapterSelectModal: React.FC<NCERTChapterSelectModalProps> = ({
  book,
  progress,
  onSelectChapter,
  onContinueReading,
  onClose,
}) => {
  const [search, setSearch] = useState('');

  const filteredChapters = book.chapters.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    (c.titleHindi && c.titleHindi.toLowerCase().includes(search.toLowerCase())) ||
    String(c.chapterNumber).includes(search)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-start justify-between gap-3 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-2xl shrink-0 shadow-inner">
              {book.subject === 'biology' ? '🧬' : book.subject === 'physics' ? '⚛️' : '🧪'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold uppercase tracking-wider">
                  {book.classLevel.replace('_', ' ')}
                </span>
                {book.partNumber && (
                  <span className="text-[10px] font-bold text-slate-300 px-2 py-0.5 rounded bg-white/5">
                    Part {book.partNumber === 1 ? 'I' : 'II'}
                  </span>
                )}
                <span className="text-[10px] text-slate-400 px-1.5 py-0.5 rounded bg-white/5 uppercase">
                  {book.language}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight truncate mt-0.5">
                {book.title}
              </h2>
              <div className="text-xs text-slate-400 truncate">
                {book.chapters.length} Chapters · Official NCERT Direct Links
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Continue reading strip if progress exists */}
        {progress && progress.currentPage > 1 && (
          <div className="px-5 py-3 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs text-emerald-300 truncate font-medium">
                Last read: <strong>Page {progress.currentPage}</strong> of {book.totalPages}
              </span>
            </div>
            <button
              onClick={onContinueReading}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs shadow-md shadow-emerald-500/25 flex items-center gap-1.5 shrink-0 transition-all"
            >
              <span>Resume Page {progress.currentPage}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Chapter Search Bar */}
        <div className="p-3.5 border-b border-white/5 bg-slate-900/90 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Chapter 1, Chapter 2, topic name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Chapter List (Chapter 1, Chapter 2, etc. with full name and page range) */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2">
          {filteredChapters.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No chapters match your search.
            </div>
          ) : (
            filteredChapters.map(ch => (
              <div
                key={ch.chapterNumber}
                onClick={() => onSelectChapter(ch)}
                className="group p-3.5 rounded-2xl bg-slate-950/60 hover:bg-indigo-600/15 border border-white/5 hover:border-indigo-500/30 transition-all flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white/5 group-hover:bg-indigo-600 text-slate-300 group-hover:text-white flex flex-col items-center justify-center shrink-0 transition-colors">
                    <span className="text-[9px] uppercase tracking-wider font-semibold opacity-70">Ch</span>
                    <span className="text-sm font-bold font-mono leading-none">{ch.chapterNumber}</span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Chapter {ch.chapterNumber}
                      </span>
                      {ch.pageStart && ch.pageEnd && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          (Pages {ch.pageStart} – {ch.pageEnd})
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-bold text-white group-hover:text-indigo-200 transition-colors mt-1 line-clamp-1">
                      {ch.title}
                    </div>
                    {ch.titleHindi && (
                      <div className="text-xs text-slate-400 truncate mt-0.5">
                        {ch.titleHindi}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-semibold text-indigo-400 group-hover:text-indigo-300 flex items-center gap-1">
                    <span>Read</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-950 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span className="text-[11px] text-slate-500">
            Source: National Council of Educational Research & Training
          </span>
          <a
            href={book.officialSourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold text-[11px]"
          >
            <span>Official Portal</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
