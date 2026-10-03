import React, { useState, useEffect } from 'react';
import { Subject, NCERTBook } from '../types/index.js';
import { api } from '../utils/api.js';
import { X, Upload, FileText, Tag, Plus, Check, BookOpen, AlertCircle, Sparkles } from 'lucide-react';

interface NotesUploadModalProps {
  subjects: Subject[];
  books: NCERTBook[];
  preselectedBook?: NCERTBook | null;
  preselectedChapter?: number | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const NotesUploadModal: React.FC<NotesUploadModalProps> = ({
  subjects,
  books,
  preselectedBook,
  preselectedChapter,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || '');
  const [selectedBookId, setSelectedBookId] = useState(preselectedBook?.id || '');
  const [selectedChapterNumber, setSelectedChapterNumber] = useState<number | ''>(
    preselectedChapter || (preselectedBook?.chapters[0]?.chapterNumber || '')
  );
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['Revision', 'High Yield']);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileSize, setUploadedFileSize] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (preselectedBook) {
      setSelectedBookId(preselectedBook.id);
      if (preselectedBook.chapters[0]) {
        setSelectedChapterNumber(preselectedChapter || preselectedBook.chapters[0].chapterNumber);
      }
      const matched = subjects.find(s =>
        s.name.toLowerCase().includes(preselectedBook.subject.toLowerCase()) ||
        preselectedBook.subject.toLowerCase().includes(s.name.toLowerCase())
      );
      if (matched) {
        setSelectedSubjectId(matched.id);
      }
      if (!title) {
        setTitle(`${preselectedBook.title} - Notes`);
      }
    }
  }, [preselectedBook, preselectedChapter, subjects]);

  const matchedBook = books.find(b => b.id === selectedBookId) || preselectedBook;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setUploadedFileSize(file.size);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ''));
    }

    // Read content preview if text/markdown
    if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      const reader = new FileReader();
      reader.onload = event => {
        if (event.target?.result) {
          setContent(event.target.result as string);
        }
      };
      reader.readAsText(file);
    } else {
      setContent(prev => prev || `Uploaded file: ${file.name} (${Math.round(file.size / 1024)} KB). Add your chapter summary and key revision points here.`);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setLoading(true);
    try {
      const subj = subjects.find(s => s.id === selectedSubjectId);
      const selectedChap = matchedBook?.chapters.find(c => c.chapterNumber === Number(selectedChapterNumber));

      await api.createNote({
        title: title.trim(),
        subjectId: subj?.id,
        subjectName: subj?.name,
        subjectColor: subj?.color,
        bookId: matchedBook?.id,
        bookTitle: matchedBook?.title,
        chapterNumber: selectedChapterNumber ? Number(selectedChapterNumber) : undefined,
        chapterTitle: selectedChap?.title,
        content: content.trim(),
        fileName: uploadedFileName || undefined,
        fileSize: uploadedFileSize,
        tags,
        highlights: [],
      });
      onSuccess();
    } catch (err) {
      alert('Failed to save note');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl p-6 space-y-4 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Upload / Create Notes</h3>
              <p className="text-xs text-slate-400">Save notes, chapter summaries, and formula sheets</p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Note Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Note Title *</label>
            <input
              type="text"
              placeholder="e.g. Chapter 4 Biomolecules High-Yield Points..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Subject & Book Link Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Subject</label>
              <select
                value={selectedSubjectId}
                onChange={e => setSelectedSubjectId(e.target.value)}
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
              <label className="text-xs font-semibold text-slate-300">Link to NCERT Book (Optional)</label>
              <select
                value={selectedBookId}
                onChange={e => {
                  setSelectedBookId(e.target.value);
                  setSelectedChapterNumber('');
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">None / General</option>
                {books.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Chapter selection if a book is linked */}
          {matchedBook && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Link to Chapter</label>
              <select
                value={selectedChapterNumber}
                onChange={e => setSelectedChapterNumber(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select Chapter (Optional)</option>
                {matchedBook.chapters.map(ch => (
                  <option key={ch.chapterNumber} value={ch.chapterNumber}>
                    Chapter {ch.chapterNumber}: {ch.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* File Upload Zone */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Attach Document / PDF / Image (Optional)</label>
            <div className="border border-dashed border-white/15 rounded-2xl p-4 text-center hover:border-indigo-500/50 transition-colors bg-white/[0.02]">
              <input
                type="file"
                id="note-file-upload"
                onChange={handleFileUpload}
                accept=".pdf,.png,.jpg,.jpeg,.txt,.md,.doc,.docx"
                className="hidden"
              />
              <label
                htmlFor="note-file-upload"
                className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
              >
                <Upload className="w-6 h-6 text-indigo-400" />
                <span className="text-xs text-slate-300 font-medium">
                  {uploadedFileName ? `Attached: ${uploadedFileName}` : 'Choose PDF, Image or Text file'}
                </span>
                <span className="text-[10px] text-slate-500">Supports PDF, Markdown, Images, Text</span>
              </label>
            </div>
          </div>

          {/* Note Content / Notes text */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Note Content / Highlights text *</label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setContent(prev => prev + '\n\n### Key Concepts & Definitions:\n- \n- \n\n### Exam High-Yield Points:\n- \n')}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 px-1.5 py-0.5 rounded bg-white/5"
                >
                  + Summary Template
                </button>
                <button
                  type="button"
                  onClick={() => setContent(prev => prev + '\n\n### Formulas & Constants:\n- Formula: \n- Units: \n')}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 px-1.5 py-0.5 rounded bg-white/5"
                >
                  + Formulas
                </button>
              </div>
            </div>
            <textarea
              rows={6}
              placeholder="Paste or write your notes, formulas, high-yield definitions here. You will be able to highlight sections with 7 distinct colors (Yellow, Green, Blue, Pink, Orange, Purple, Cyan)!"
              value={content}
              onChange={e => setContent(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed font-mono"
            />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Tags</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Add tag (e.g. NEET, Physics)..."
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {tags.map(t => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-500/15 text-indigo-300 text-xs"
                >
                  <span>#{t}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="hover:text-white"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim() || !content.trim()}
              className="min-h-[44px] rounded-xl bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save & Upload Note'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
