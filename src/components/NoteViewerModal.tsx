import React, { useState, useRef } from 'react';
import { UploadedNote, NoteHighlight, HighlightColor } from '../types/index.js';
import { api } from '../utils/api.js';
import {
  X,
  Highlighter,
  Trash2,
  Tag,
  BookOpen,
  Check,
  Plus,
  Edit2,
  FileText,
  MessageSquare,
  Sparkles,
  Info,
  Copy,
  ChevronDown
} from 'lucide-react';

interface NoteViewerModalProps {
  note: UploadedNote;
  onClose: () => void;
  onNoteUpdated: (updated: UploadedNote) => void;
  onDeleteNote: (id: string) => void;
}

export const HIGHLIGHT_COLORS: {
  id: HighlightColor;
  name: string;
  label: string;
  hex: string;
  markClass: string;
  cardClass: string;
  dotClass: string;
}[] = [
  {
    id: 'yellow',
    name: 'Yellow',
    label: 'Yellow (Key Facts)',
    hex: '#fde047',
    markClass: 'bg-yellow-300 text-slate-950 font-medium px-1 py-0.5 rounded shadow-sm',
    cardClass: 'bg-yellow-400/15 border-yellow-400/40 text-yellow-100',
    dotClass: 'bg-yellow-400',
  },
  {
    id: 'green',
    name: 'Green',
    label: 'Green (Core Concepts)',
    hex: '#86efac',
    markClass: 'bg-emerald-300 text-slate-950 font-medium px-1 py-0.5 rounded shadow-sm',
    cardClass: 'bg-emerald-400/15 border-emerald-400/40 text-emerald-100',
    dotClass: 'bg-emerald-400',
  },
  {
    id: 'blue',
    name: 'Blue',
    label: 'Blue (Formulas & Laws)',
    hex: '#93c5fd',
    markClass: 'bg-sky-300 text-slate-950 font-medium px-1 py-0.5 rounded shadow-sm',
    cardClass: 'bg-sky-400/15 border-sky-400/40 text-sky-100',
    dotClass: 'bg-sky-400',
  },
  {
    id: 'pink',
    name: 'Pink',
    label: 'Pink (Exam High-Yield)',
    hex: '#f472b6',
    markClass: 'bg-pink-300 text-slate-950 font-medium px-1 py-0.5 rounded shadow-sm',
    cardClass: 'bg-pink-400/15 border-pink-400/40 text-pink-100',
    dotClass: 'bg-pink-400',
  },
  {
    id: 'orange',
    name: 'Orange',
    label: 'Orange (Exam Warnings & PYQs)',
    hex: '#fb923c',
    markClass: 'bg-orange-300 text-slate-950 font-medium px-1 py-0.5 rounded shadow-sm',
    cardClass: 'bg-orange-400/15 border-orange-400/40 text-orange-100',
    dotClass: 'bg-orange-400',
  },
  {
    id: 'purple',
    name: 'Purple',
    label: 'Purple (Mnemonics & Memory)',
    hex: '#c084fc',
    markClass: 'bg-purple-300 text-slate-950 font-medium px-1 py-0.5 rounded shadow-sm',
    cardClass: 'bg-purple-400/15 border-purple-400/40 text-purple-100',
    dotClass: 'bg-purple-400',
  },
  {
    id: 'cyan',
    name: 'Cyan',
    label: 'Cyan (Reactions & Terms)',
    hex: '#67e8f9',
    markClass: 'bg-cyan-300 text-slate-950 font-medium px-1 py-0.5 rounded shadow-sm',
    cardClass: 'bg-cyan-400/15 border-cyan-400/40 text-cyan-100',
    dotClass: 'bg-cyan-400',
  },
];

export const NoteViewerModal: React.FC<NoteViewerModalProps> = ({
  note,
  onClose,
  onNoteUpdated,
  onDeleteNote,
}) => {
  const [selectedColor, setSelectedColor] = useState<HighlightColor>('yellow');
  const [selectedText, setSelectedText] = useState('');
  const [stickyComment, setStickyComment] = useState('');
  const [showAddHighlightBox, setShowAddHighlightBox] = useState(false);
  const [activeHighlightInfo, setActiveHighlightInfo] = useState<NoteHighlight | null>(null);
  const [colorFilter, setColorFilter] = useState<HighlightColor | 'all'>('all');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'highlights'>('content');
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualText, setManualText] = useState('');

  const contentRef = useRef<HTMLDivElement | null>(null);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const text = selection.toString().trim();
      setSelectedText(text);
      setShowAddHighlightBox(true);
      setActiveHighlightInfo(null);
    }
  };

  const handleApplyHighlightWithColor = async (colorToUse: HighlightColor, customText?: string) => {
    const textToHighlight = customText || selectedText;
    if (!textToHighlight.trim()) return;

    try {
      const res = await api.addNoteHighlight(note.id, {
        text: textToHighlight.trim(),
        color: colorToUse,
        note: stickyComment.trim() || undefined,
      });
      onNoteUpdated(res.note);
      setShowAddHighlightBox(false);
      setShowManualAdd(false);
      setSelectedText('');
      setManualText('');
      setStickyComment('');
      const colorMeta = HIGHLIGHT_COLORS.find(c => c.id === colorToUse);
      triggerToast(`✓ Highlighted with ${colorMeta?.name || colorToUse}`);
    } catch (err) {
      alert('Failed to save highlight');
    }
  };

  const handleRemoveHighlight = async (highlightId: string) => {
    try {
      const res = await api.removeNoteHighlight(note.id, highlightId);
      onNoteUpdated(res.note);
      setActiveHighlightInfo(null);
      triggerToast('Highlight removed');
    } catch (err) {
      alert('Failed to remove highlight');
    }
  };

  // True inline text highlighting parser
  const renderHighlightedContent = () => {
    const text = note.content;
    const highlights = note.highlights || [];

    if (highlights.length === 0) {
      return (
        <div
          ref={contentRef}
          onMouseUp={handleTextSelection}
          className="whitespace-pre-wrap leading-relaxed text-sm text-slate-200 select-text font-sans"
        >
          {text}
        </div>
      );
    }

    // Build occurrence spans for all highlights
    interface SpanMatch {
      start: number;
      end: number;
      highlight: NoteHighlight;
    }

    const matches: SpanMatch[] = [];

    highlights.forEach(hl => {
      const searchTarget = hl.text.trim();
      if (!searchTarget) return;

      let startIdx = 0;
      // Find all matches of this highlight string in note text
      while (startIdx < text.length) {
        const found = text.indexOf(searchTarget, startIdx);
        if (found === -1) break;
        matches.push({
          start: found,
          end: found + searchTarget.length,
          highlight: hl,
        });
        startIdx = found + searchTarget.length;
      }
    });

    // Sort by start index
    matches.sort((a, b) => a.start - b.start);

    // Filter out overlapping intervals (keep earlier)
    const nonOverlapping: SpanMatch[] = [];
    let lastEnd = 0;
    for (const m of matches) {
      if (m.start >= lastEnd) {
        nonOverlapping.push(m);
        lastEnd = m.end;
      }
    }

    // Build segments
    const elements: React.ReactNode[] = [];
    let cursor = 0;

    nonOverlapping.forEach((span, i) => {
      // Plain text before match
      if (span.start > cursor) {
        elements.push(
          <span key={`text_${cursor}_${span.start}`}>
            {text.slice(cursor, span.start)}
          </span>
        );
      }

      // Highlighted <mark>
      const colorMeta = HIGHLIGHT_COLORS.find(c => c.id === span.highlight.color) || HIGHLIGHT_COLORS[0];
      const isFilteredOut = colorFilter !== 'all' && span.highlight.color !== colorFilter;

      elements.push(
        <mark
          key={`hl_${span.highlight.id}_${i}`}
          onClick={(e) => {
            e.stopPropagation();
            setActiveHighlightInfo(span.highlight);
          }}
          className={`cursor-pointer transition-all ${
            isFilteredOut ? 'opacity-40 line-through' : ''
          } ${colorMeta.markClass} hover:opacity-90 inline-block my-0.5`}
          title={`Click to view note: ${colorMeta.label}`}
        >
          {text.slice(span.start, span.end)}
        </mark>
      );

      cursor = span.end;
    });

    // Tail text
    if (cursor < text.length) {
      elements.push(
        <span key={`text_tail_${cursor}`}>
          {text.slice(cursor)}
        </span>
      );
    }

    return (
      <div
        ref={contentRef}
        onMouseUp={handleTextSelection}
        className="whitespace-pre-wrap leading-relaxed text-sm text-slate-200 select-text font-sans"
      >
        {elements}
      </div>
    );
  };

  const filteredHighlights = (note.highlights || []).filter(h =>
    colorFilter === 'all' ? true : h.color === colorFilter
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-150">
      <div className="w-full max-w-3xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-start justify-between gap-3 bg-slate-950/70 shrink-0">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {note.subjectName && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${note.subjectColor || '#6366f1'}20`,
                    color: note.subjectColor || '#6366f1',
                  }}
                >
                  {note.subjectName}
                </span>
              )}
              {note.bookTitle && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400">
                  {note.bookTitle}
                </span>
              )}
              {note.chapterNumber && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-indigo-300 font-semibold">
                  Chapter {note.chapterNumber}
                </span>
              )}
            </div>

            <h2 className="text-lg font-bold text-white tracking-tight truncate">
              {note.title}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onDeleteNote(note.id)}
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-colors"
              title="Delete Note"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Highlighting Toolbar Strip with 7 Color Swatches */}
        <div className="px-4 sm:px-5 py-2.5 bg-slate-950/90 border-b border-white/5 flex items-center justify-between gap-3 shrink-0 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Highlighter className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Palette:</span>
            </span>

            {/* 7 Distinct Color Swatches */}
            <div className="flex items-center gap-1.5">
              {HIGHLIGHT_COLORS.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedColor(c.id)}
                  title={c.label}
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                    selectedColor === c.id
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-950 scale-110'
                      : 'opacity-75 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.hex }}
                >
                  {selectedColor === c.id && <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowManualAdd(!showManualAdd)}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium px-2 py-1 rounded-lg bg-white/5 flex items-center gap-1 ml-1"
            >
              <Plus className="w-3 h-3" />
              <span>Type passage</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('content')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'content'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Note Content
            </button>
            <button
              onClick={() => setActiveTab('highlights')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'highlights'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Highlights</span>
              <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] flex items-center justify-center font-mono">
                {note.highlights?.length || 0}
              </span>
            </button>
          </div>
        </div>

        {/* Floating Quick Highlighter Bar when text is selected */}
        {showAddHighlightBox && (
          <div className="p-3 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border-b border-indigo-500/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0 animate-in fade-in slide-in-from-top-2">
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Selected passage to highlight:</span>
              </div>
              <p className="text-xs text-white font-medium italic truncate max-w-lg mt-0.5">
                "{selectedText}"
              </p>
            </div>

            {/* Quick 1-click color buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="text"
                placeholder="Margin note / comment (optional)..."
                value={stickyComment}
                onChange={e => setStickyComment(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 w-36 sm:w-44"
              />

              <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-white/10">
                {HIGHLIGHT_COLORS.map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleApplyHighlightWithColor(c.id)}
                    title={`Highlight in ${c.name}`}
                    className="w-5 h-5 rounded-full hover:scale-125 transition-transform"
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>

              <button
                onClick={() => {
                  setShowAddHighlightBox(false);
                  setSelectedText('');
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
                title="Cancel"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Manual passage highlight adder */}
        {showManualAdd && (
          <div className="p-3 bg-slate-950 border-b border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 animate-in fade-in">
            <input
              type="text"
              placeholder="Paste exact phrase or formula to highlight..."
              value={manualText}
              onChange={e => setManualText(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <input
              type="text"
              placeholder="Comment/Tip..."
              value={stickyComment}
              onChange={e => setStickyComment(e.target.value)}
              className="w-36 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <div className="flex items-center gap-1">
              {HIGHLIGHT_COLORS.map(c => (
                <button
                  key={c.id}
                  onClick={() => handleApplyHighlightWithColor(c.id, manualText)}
                  title={`Apply ${c.name} highlight`}
                  className="w-5 h-5 rounded-full hover:scale-125 transition-transform"
                  style={{ backgroundColor: c.hex }}
                />
              ))}
              <button
                onClick={() => setShowManualAdd(false)}
                className="p-1 text-slate-400 hover:text-white text-xs ml-1"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Active highlight details bubble popup */}
        {activeHighlightInfo && (
          <div className="p-3.5 bg-slate-950 border-b border-indigo-500/30 flex items-center justify-between gap-3 shrink-0 animate-in fade-in">
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{
                    backgroundColor:
                      HIGHLIGHT_COLORS.find(c => c.id === activeHighlightInfo.color)?.hex || '#fde047',
                  }}
                />
                <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">
                  {HIGHLIGHT_COLORS.find(c => c.id === activeHighlightInfo.color)?.label}
                </span>
                {activeHighlightInfo.note && (
                  <span className="text-xs text-indigo-300 font-medium">
                    · Note: "{activeHighlightInfo.note}"
                  </span>
                )}
              </div>
              <p className="text-xs text-white font-semibold truncate">
                "{activeHighlightInfo.text}"
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleRemoveHighlight(activeHighlightInfo.id)}
                className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-xs font-semibold flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Remove</span>
              </button>
              <button
                onClick={() => setActiveHighlightInfo(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Toast Alert */}
        {toastMsg && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-xl">
            <Check className="w-3.5 h-3.5" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Body View Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {activeTab === 'content' ? (
            <div className="space-y-4">
              {/* Highlight instruction helper & color filter */}
              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold">💡 How to highlight:</span>
                  <span>Select any text with your mouse or finger to paint with color!</span>
                </div>

                {/* Filter by color */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[11px] text-slate-500">Filter:</span>
                  <select
                    value={colorFilter}
                    onChange={e => setColorFilter(e.target.value as any)}
                    className="bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-slate-300 focus:outline-none"
                  >
                    <option value="all">All Highlights ({note.highlights?.length || 0})</option>
                    {HIGHLIGHT_COLORS.map(c => {
                      const count = (note.highlights || []).filter(h => h.color === c.id).length;
                      return (
                        <option key={c.id} value={c.id}>
                          {c.name} ({count})
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Main Note Text with Live Colored Highlights */}
              <div className="p-4 sm:p-6 rounded-2xl bg-slate-950/70 border border-white/5 min-h-[240px] leading-relaxed">
                {renderHighlightedContent()}
              </div>

              {/* Highlights cards summary section */}
              {note.highlights && note.highlights.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Active Color Highlights ({note.highlights.length})
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Click any highlight card to inspect or remove
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {note.highlights.map(hl => {
                      const colorMeta = HIGHLIGHT_COLORS.find(c => c.id === hl.color) || HIGHLIGHT_COLORS[0];
                      return (
                        <div
                          key={hl.id}
                          className={`p-3 rounded-xl border flex items-start justify-between gap-2.5 transition-all ${colorMeta.cardClass}`}
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: colorMeta.hex }}
                              />
                              <span className="text-[10px] font-mono uppercase tracking-wider font-bold opacity-80">
                                {colorMeta.name}
                              </span>
                            </div>

                            <p className="text-xs font-medium leading-relaxed line-clamp-2">
                              "{hl.text}"
                            </p>

                            {hl.note && (
                              <div className="flex items-center gap-1 text-[11px] opacity-90 font-mono text-white/90">
                                <MessageSquare className="w-2.5 h-2.5" />
                                <span className="truncate">Tip: {hl.note}</span>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => handleRemoveHighlight(hl.id)}
                            className="text-slate-400 hover:text-rose-400 p-1 shrink-0"
                            title="Delete Highlight"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Highlights Only Tab */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Summary of All Highlighted Passages
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {note.highlights?.length || 0} highlights
                </span>
              </div>

              {(!note.highlights || note.highlights.length === 0) ? (
                <div className="p-12 text-center text-xs text-slate-500">
                  No text highlights added yet. Select text in the "Note Content" tab to highlight with colors!
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredHighlights.map(hl => {
                    const colorMeta = HIGHLIGHT_COLORS.find(c => c.id === hl.color) || HIGHLIGHT_COLORS[0];
                    return (
                      <div
                        key={hl.id}
                        className={`p-4 rounded-2xl border flex items-start justify-between gap-3 ${colorMeta.cardClass}`}
                      >
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: colorMeta.hex }}
                            />
                            <span className="text-[10px] font-mono uppercase tracking-wider font-bold opacity-75">
                              {colorMeta.label}
                            </span>
                          </div>
                          <p className="text-sm font-semibold leading-relaxed">
                            "{hl.text}"
                          </p>
                          {hl.note && (
                            <div className="p-2 rounded-lg bg-black/20 text-xs text-white/90">
                              💬 {hl.note}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => handleRemoveHighlight(hl.id)}
                          className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            {note.tags?.map(tag => (
              <span key={tag} className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] text-slate-400">
                #{tag}
              </span>
            ))}
          </div>

          <span className="text-[11px] text-slate-500">
            Updated {new Date(note.updatedAt || note.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
};
