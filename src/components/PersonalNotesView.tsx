import React, { useState, useEffect, useRef } from 'react';
import { PersonalStudyNote, NEETSubject } from '../types/index.js';
import { api } from '../utils/api.js';
import {
  Edit3,
  Plus,
  Pin,
  CheckCircle2,
  Trash2,
  Search,
  Tag,
  BookOpen,
  Image,
  PenTool,
  RotateCcw,
  Sparkles,
  Filter
} from 'lucide-react';

interface PersonalNotesViewProps {
  onOpenPdfReader?: () => void;
}

export const PersonalNotesView: React.FC<PersonalNotesViewProps> = ({ onOpenPdfReader }) => {
  const [notes, setNotes] = useState<PersonalStudyNote[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [activeModal, setActiveModal] = useState<'create' | 'edit' | null>(null);
  const [selectedNote, setSelectedNote] = useState<PersonalStudyNote | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState<string>('');
  const [formContent, setFormContent] = useState<string>('');
  const [formSubject, setFormSubject] = useState<'biology' | 'physics' | 'chemistry' | 'general'>('biology');
  const [formChapter, setFormChapter] = useState<string>('');
  const [formTags, setFormTags] = useState<string>('');
  const [formImageUrl, setFormImageUrl] = useState<string>('');

  // Handwritten canvas tool state inside modal
  const [showCanvasPad, setShowCanvasPad] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);

  const loadNotes = async () => {
    try {
      const res = await api.getPersonalNotes({
        subject: filterSubject === 'all' ? undefined : filterSubject,
        search: searchQuery.trim() || undefined,
      });
      setNotes(res.notes || []);
    } catch (err) {
      console.error('Failed to load notes', err);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [filterSubject, searchQuery]);

  const handleOpenCreate = () => {
    setFormTitle('');
    setFormContent('');
    setFormSubject('biology');
    setFormChapter('');
    setFormTags('');
    setFormImageUrl('');
    setShowCanvasPad(false);
    setSelectedNote(null);
    setActiveModal('create');
  };

  const handleOpenEdit = (note: PersonalStudyNote) => {
    setSelectedNote(note);
    setFormTitle(note.title);
    setFormContent(note.content);
    setFormSubject(note.subject);
    setFormChapter(note.chapter || '');
    setFormTags(note.tags.join(', '));
    setFormImageUrl(note.imageUrl || '');
    setShowCanvasPad(false);
    setActiveModal('edit');
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    let handwrittenDataUrl: string | undefined = undefined;
    if (showCanvasPad && canvasRef.current) {
      handwrittenDataUrl = canvasRef.current.toDataURL('image/png');
    }

    const tagsArray = formTags.split(',').map(t => t.trim()).filter(Boolean);

    try {
      if (activeModal === 'create') {
        await api.createPersonalNote({
          title: formTitle.trim(),
          content: formContent.trim(),
          subject: formSubject,
          chapter: formChapter.trim() || undefined,
          tags: tagsArray,
          imageUrl: formImageUrl.trim() || undefined,
          handwrittenDataUrl,
        });
      } else if (activeModal === 'edit' && selectedNote) {
        await api.updatePersonalNote(selectedNote.id, {
          title: formTitle.trim(),
          content: formContent.trim(),
          subject: formSubject,
          chapter: formChapter.trim() || undefined,
          tags: tagsArray,
          imageUrl: formImageUrl.trim() || undefined,
          handwrittenDataUrl: handwrittenDataUrl || selectedNote.handwrittenDataUrl,
        });
      }
      setActiveModal(null);
      loadNotes();
    } catch (err) {
      alert('Failed to save note');
    }
  };

  const handleTogglePin = async (note: PersonalStudyNote) => {
    try {
      await api.updatePersonalNote(note.id, { isPinned: !note.isPinned });
      loadNotes();
    } catch (err) {
      console.error('Failed to toggle pin', err);
    }
  };

  const handleToggleComplete = async (note: PersonalStudyNote) => {
    try {
      await api.updatePersonalNote(note.id, { isCompleted: !note.isCompleted });
      loadNotes();
    } catch (err) {
      console.error('Failed to toggle completion', err);
    }
  };

  const handleDelete = async (noteId: string) => {
    if (confirm('Delete this note?')) {
      try {
        await api.deletePersonalNote(noteId);
        loadNotes();
      } catch (err) {
        alert('Failed to delete note');
      }
    }
  };

  // Canvas drawing handlers
  const handleStartDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    isDrawingRef.current = true;
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#6366f1';
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const handleStopDraw = () => {
    isDrawingRef.current = false;
  };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 tracking-wider uppercase">
              <span>HIGH-YIELD REVISION</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">Personal Study Notes & Canvas</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1 flex items-center gap-2">
              <span>Personal Study Notes</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Create formulas, chapter summaries, diagrams, and handwritten mnemonics.
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-indigo-600/25 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Note</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search notes by title, concept, or tags..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {['all', 'biology', 'physics', 'chemistry'].map(sub => (
            <button
              key={sub}
              onClick={() => setFilterSubject(sub)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                filterSubject === sub
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 border border-white/5 hover:text-white'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {notes.map(note => {
          const subjectColor =
            note.subject === 'biology'
              ? 'border-emerald-500/30 text-emerald-300'
              : note.subject === 'physics'
              ? 'border-cyan-500/30 text-cyan-300'
              : 'border-amber-500/30 text-amber-300';

          return (
            <div
              key={note.id}
              onClick={() => handleOpenEdit(note)}
              className={`p-5 rounded-3xl bg-slate-900/80 border border-white/10 hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-3 cursor-pointer group relative ${
                note.isPinned ? 'ring-1 ring-amber-400/40' : ''
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/5 border capitalize ${subjectColor}`}>
                    {note.subject} {note.chapter ? `· ${note.chapter}` : ''}
                  </span>

                  <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => handleTogglePin(note)}
                      className={`p-1 rounded-lg hover:bg-white/10 ${note.isPinned ? 'text-amber-400' : 'text-slate-500'}`}
                      title="Pin note"
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleToggleComplete(note)}
                      className={`p-1 rounded-lg hover:bg-white/10 ${note.isCompleted ? 'text-emerald-400' : 'text-slate-500'}`}
                      title="Mark reviewed"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-indigo-200 transition-colors line-clamp-1">
                  {note.title}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed whitespace-pre-line">
                  {note.content}
                </p>

                {note.handwrittenDataUrl && (
                  <div className="p-2 rounded-xl bg-slate-950/60 border border-white/5">
                    <img
                      src={note.handwrittenDataUrl}
                      alt="Handwritten diagram"
                      className="h-16 w-full object-contain filter invert"
                    />
                  </div>
                )}
              </div>

              {/* Tags footer */}
              {note.tags && note.tags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-white/5">
                  {note.tags.map(t => (
                    <span key={t} className="text-[10px] text-slate-400 font-mono">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Note Creation / Edit Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white">
                {activeModal === 'create' ? 'Create Study Note' : 'Edit Study Note'}
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNote} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Chemical Equilibrium Kp & Kc Relationships"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Subject</label>
                  <select
                    value={formSubject}
                    onChange={e => setFormSubject(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none"
                  >
                    <option value="biology">Biology</option>
                    <option value="physics">Physics</option>
                    <option value="chemistry">Chemistry</option>
                    <option value="general">General</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Chapter</label>
                  <input
                    type="text"
                    placeholder="e.g. Thermodynamics"
                    value={formChapter}
                    onChange={e => setFormChapter(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Content / Formulas / Notes</label>
                <textarea
                  rows={4}
                  placeholder="Write high-yield revision points, reaction mechanisms, or equations..."
                  value={formContent}
                  onChange={e => setFormContent(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Tags (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="Formula, High-Yield, NEET2027, PYQ"
                  value={formTags}
                  onChange={e => setFormTags(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none"
                />
              </div>

              {/* Handwritten Sketch Pad Option */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Handwritten Sketch / Formula Canvas</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCanvasPad(!showCanvasPad)}
                    className="text-xs text-indigo-400 hover:underline"
                  >
                    {showCanvasPad ? 'Hide Canvas' : 'Draw Sketch'}
                  </button>
                </div>

                {showCanvasPad && (
                  <div className="space-y-2">
                    <canvas
                      ref={canvasRef}
                      width={500}
                      height={180}
                      onMouseDown={handleStartDraw}
                      onMouseMove={handleDraw}
                      onMouseUp={handleStopDraw}
                      onMouseLeave={handleStopDraw}
                      className="w-full h-44 bg-slate-950 rounded-2xl border border-white/20 cursor-crosshair"
                    />
                    <button
                      type="button"
                      onClick={handleClearCanvas}
                      className="text-[11px] text-slate-400 hover:text-white"
                    >
                      Clear Sketch
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/25"
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
