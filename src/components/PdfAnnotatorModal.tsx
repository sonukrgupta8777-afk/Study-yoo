import React, { useState, useEffect, useRef } from 'react';
import { PdfAnnotationItem } from '../types/index.js';
import { api } from '../utils/api.js';
import {
  X,
  PenTool,
  Highlighter,
  Underline,
  Type,
  StickyNote,
  Eraser,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Search,
  Check,
  Download,
  Tag
} from 'lucide-react';

interface PdfAnnotatorModalProps {
  pdfId: string;
  pdfTitle: string;
  pdfUrl?: string;
  totalPages?: number;
  initialPage?: number;
  onClose: () => void;
}

export const PdfAnnotatorModal: React.FC<PdfAnnotatorModalProps> = ({
  pdfId,
  pdfTitle,
  pdfUrl,
  totalPages = 12,
  initialPage = 1,
  onClose,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [activeTool, setActiveTool] = useState<'pen' | 'highlighter' | 'underline' | 'textbox' | 'sticky' | 'eraser' | 'none'>('pen');
  const [selectedColor, setSelectedColor] = useState<string>('#6366f1');
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [annotations, setAnnotations] = useState<PdfAnnotationItem[]>([]);
  const [bookmarkedPages, setBookmarkedPages] = useState<number[]>([]);
  const [savedToast, setSavedToast] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Undo / Redo history
  const [historyStack, setHistoryStack] = useState<PdfAnnotationItem[][]>([]);
  const [redoStack, setRedoStack] = useState<PdfAnnotationItem[][]>([]);

  // Canvas drawing state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const currentStrokePoints = useRef<{ x: number; y: number }[]>([]);

  // Textbox & Sticky note insertion state
  const [newStickyText, setNewStickyText] = useState<string>('');
  const [activeStickyPrompt, setActiveStickyPrompt] = useState<{ x: number; y: number } | null>(null);

  // Load annotations from backend database for this page
  const loadAnnotationsForPage = async (page: number) => {
    try {
      const res = await api.getPdfAnnotations(pdfId, page);
      setAnnotations(res.annotations || []);
      setHistoryStack([]);
      setRedoStack([]);
    } catch (err) {
      console.error('Failed to load annotations', err);
    }
  };

  useEffect(() => {
    loadAnnotationsForPage(currentPage);
  }, [currentPage, pdfId]);

  // Redraw canvas whenever annotations or zoom changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    annotations.forEach(ann => {
      if (ann.type === 'pen' && ann.points && ann.points.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = ann.color;
        ctx.lineWidth = ann.strokeWidth || 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = 1.0;
        ctx.moveTo(ann.points[0].x, ann.points[0].y);
        for (let i = 1; i < ann.points.length; i++) {
          ctx.lineTo(ann.points[i].x, ann.points[i].y);
        }
        ctx.stroke();
      } else if (ann.type === 'highlight' && ann.rect) {
        ctx.fillStyle = ann.color;
        ctx.globalAlpha = 0.35;
        ctx.fillRect(ann.rect.x, ann.rect.y, ann.rect.width, ann.rect.height);
      } else if (ann.type === 'underline' && ann.rect) {
        ctx.strokeStyle = ann.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.moveTo(ann.rect.x, ann.rect.y + ann.rect.height);
        ctx.lineTo(ann.rect.x + ann.rect.width, ann.rect.y + ann.rect.height);
        ctx.stroke();
      }
    });
    ctx.globalAlpha = 1.0;
  }, [annotations, zoomLevel]);

  // Auto-save notification
  const triggerAutoSave = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 1500);
  };

  // Drawing event handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === 'none') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === 'sticky' || activeTool === 'textbox') {
      setActiveStickyPrompt({ x, y });
      return;
    }

    if (activeTool === 'eraser') {
      // Find annotation closest to (x, y) and erase
      const remaining = annotations.filter(a => {
        if (a.rect) {
          return !(x >= a.rect.x && x <= a.rect.x + a.rect.width && y >= a.rect.y && y <= a.rect.y + a.rect.height);
        }
        if (a.points) {
          return !a.points.some(p => Math.hypot(p.x - x, p.y - y) < 15);
        }
        return true;
      });
      if (remaining.length !== annotations.length) {
        setHistoryStack(prev => [...prev, annotations]);
        setAnnotations(remaining);
        triggerAutoSave();
      }
      return;
    }

    isDrawingRef.current = true;
    currentStrokePoints.current = [{ x, y }];
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    currentStrokePoints.current.push({ x, y });

    // Live preview stroke
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.strokeStyle = activeTool === 'highlighter' ? `${selectedColor}66` : selectedColor;
    ctx.lineWidth = activeTool === 'highlighter' ? 14 : strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const pts = currentStrokePoints.current;
    if (pts.length > 1) {
      ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const handleMouseUp = async () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    if (currentStrokePoints.current.length < 2) return;

    const newAnnotation: PdfAnnotationItem = {
      id: `ann_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      pdfId,
      pageNumber: currentPage,
      type: activeTool === 'highlighter' ? 'highlight' : activeTool === 'underline' ? 'underline' : 'pen',
      color: selectedColor,
      strokeWidth: activeTool === 'highlighter' ? 14 : strokeWidth,
      points: [...currentStrokePoints.current],
      createdAt: new Date().toISOString(),
    };

    setHistoryStack(prev => [...prev, annotations]);
    setRedoStack([]);
    const updated = [...annotations, newAnnotation];
    setAnnotations(updated);

    try {
      await api.savePdfAnnotation(newAnnotation);
      triggerAutoSave();
    } catch (err) {
      console.error('Failed to save annotation', err);
    }
    currentStrokePoints.current = [];
  };

  const handleAddStickyNote = async () => {
    if (!activeStickyPrompt || !newStickyText.trim()) {
      setActiveStickyPrompt(null);
      return;
    }

    const item: PdfAnnotationItem = {
      id: `sticky_${Date.now()}`,
      pdfId,
      pageNumber: currentPage,
      type: activeTool === 'textbox' ? 'textbox' : 'sticky',
      color: selectedColor,
      text: newStickyText.trim(),
      rect: { x: activeStickyPrompt.x, y: activeStickyPrompt.y, width: 140, height: 70 },
      createdAt: new Date().toISOString(),
    };

    setHistoryStack(prev => [...prev, annotations]);
    const updated = [...annotations, item];
    setAnnotations(updated);
    setNewStickyText('');
    setActiveStickyPrompt(null);

    try {
      await api.savePdfAnnotation(item);
      triggerAutoSave();
    } catch (err) {
      console.error('Failed to save sticky note', err);
    }
  };

  const handleUndo = () => {
    if (historyStack.length === 0) return;
    const prev = historyStack[historyStack.length - 1];
    setRedoStack(r => [...r, annotations]);
    setAnnotations(prev);
    setHistoryStack(h => h.slice(0, -1));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistoryStack(h => [...h, annotations]);
    setAnnotations(next);
    setRedoStack(r => r.slice(0, -1));
  };

  const togglePageBookmark = () => {
    setBookmarkedPages(prev =>
      prev.includes(currentPage) ? prev.filter(p => p !== currentPage) : [...prev, currentPage]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-6xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl flex flex-col h-[95vh] overflow-hidden">
        {/* Top Header & Document Metadata */}
        <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between gap-3 bg-slate-950 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xl">📄</span>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white tracking-tight truncate">{pdfTitle}</h2>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                <span>Page {currentPage} of {totalPages}</span>
                {savedToast && <span className="text-emerald-400 font-bold flex items-center gap-1">✓ Saved</span>}
              </div>
            </div>
          </div>

          {/* Quick Toolbar */}
          <div className="flex items-center gap-2">
            <button
              onClick={togglePageBookmark}
              className={`p-2 rounded-xl border transition-colors ${
                bookmarkedPages.includes(currentPage)
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
              }`}
              title="Bookmark page"
            >
              <Bookmark className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Secondary Tool Ribbon */}
        <div className="px-4 py-2 border-b border-white/5 bg-slate-950/80 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          {/* Annotation Tools */}
          <div className="flex items-center gap-1">
            {[
              { id: 'pen', label: 'Pen', icon: <PenTool className="w-4 h-4" /> },
              { id: 'highlighter', label: 'Highlight', icon: <Highlighter className="w-4 h-4" /> },
              { id: 'underline', label: 'Underline', icon: <Underline className="w-4 h-4" /> },
              { id: 'textbox', label: 'Text Box', icon: <Type className="w-4 h-4" /> },
              { id: 'sticky', label: 'Sticky Note', icon: <StickyNote className="w-4 h-4" /> },
              { id: 'eraser', label: 'Eraser', icon: <Eraser className="w-4 h-4" /> },
            ].map(tool => (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id as any)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTool === tool.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tool.icon}
                <span className="hidden sm:inline">{tool.label}</span>
              </button>
            ))}
          </div>

          {/* Color Palette */}
          <div className="flex items-center gap-1.5 px-2 border-l border-white/10">
            {['#6366f1', '#10b981', '#06b6d4', '#f43f5e', '#f59e0b', '#a855f7'].map(c => (
              <button
                key={c}
                onClick={() => setSelectedColor(c)}
                style={{ backgroundColor: c }}
                className={`w-5 h-5 rounded-full transition-transform ${
                  selectedColor === c ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'
                }`}
              />
            ))}
          </div>

          {/* Undo/Redo & Zoom */}
          <div className="flex items-center gap-1 border-l border-white/10 pl-2">
            <button
              onClick={handleUndo}
              disabled={historyStack.length === 0}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30"
              title="Undo"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30"
              title="Redo"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setZoomLevel(prev => Math.max(60, prev - 15))}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-slate-400 px-1">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel(prev => Math.min(180, prev + 15))}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PDF Reader Body & Canvas Overlay Area */}
        <div className="flex-1 bg-slate-950 p-4 overflow-auto flex items-center justify-center relative">
          <div
            className="bg-white text-slate-900 rounded-2xl shadow-2xl relative overflow-hidden transition-all duration-150"
            style={{
              width: `${(600 * zoomLevel) / 100}px`,
              height: `${(840 * zoomLevel) / 100}px`,
            }}
          >
            {/* Embedded PDF iframe or simulated high-fidelity document sheet */}
            {pdfUrl ? (
              <iframe
                src={`${pdfUrl}#page=${currentPage}&toolbar=0&navpanes=0`}
                className="w-full h-full border-none pointer-events-none"
                title="PDF Page"
              />
            ) : (
              <div className="p-8 space-y-4 select-text">
                <div className="border-b pb-2 flex justify-between items-center text-xs text-slate-500 font-mono">
                  <span>NCERT OFFICIAL STUDY MATERIAL · CHAPTER REVISION</span>
                  <span>PAGE {currentPage}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {currentPage === 1 ? '1. Cell: The Unit of Life' : `Section ${currentPage}. Membrane Dynamics & Organelles`}
                </h3>
                <p className="text-xs leading-relaxed text-slate-700">
                  When you look around, you see both living and non-living things. You must have wondered and asked yourself—‘what is it that makes an organism living, or what is it that an inanimate thing does not have which a living thing has’? The answer to this is the presence of the basic unit of life—the cell in all living organisms.
                </p>
                <p className="text-xs leading-relaxed text-slate-700">
                  Anton von Leeuwenhoek first saw and described a live cell. Robert Brown later discovered the nucleus. The invention of the microscope and its improvement leading to the electron microscope revealed all the structural details of the cell.
                </p>
                <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-800 space-y-1">
                  <strong>High-Yield Exam Note:</strong> Rudolf Virchow (1855) first explained that cells divided and new cells are formed from pre-existing cells (<em>Omnis cellula-e cellula</em>).
                </div>
              </div>
            )}

            {/* Interactive Drawing Canvas Layer */}
            <canvas
              ref={canvasRef}
              width={(600 * zoomLevel) / 100}
              height={(840 * zoomLevel) / 100}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              className="absolute inset-0 cursor-crosshair z-10"
            />

            {/* Rendered Sticky Notes & Textboxes */}
            {annotations
              .filter(a => a.type === 'sticky' || a.type === 'textbox')
              .map(note => (
                <div
                  key={note.id}
                  style={{
                    left: note.rect?.x || 20,
                    top: note.rect?.y || 20,
                    backgroundColor: note.color ? `${note.color}22` : '#fef08a',
                    borderColor: note.color || '#eab308',
                  }}
                  className="absolute z-20 p-2.5 rounded-xl border text-xs text-slate-900 shadow-lg max-w-[180px] break-words"
                >
                  <div className="text-[10px] font-bold uppercase opacity-75 mb-0.5">
                    {note.type === 'sticky' ? '📌 Note' : '🔤 Text'}
                  </div>
                  <p className="text-[11px] leading-snug">{note.text}</p>
                </div>
              ))}

            {/* Prompt for creating a new sticky note */}
            {activeStickyPrompt && (
              <div
                style={{ left: activeStickyPrompt.x, top: activeStickyPrompt.y }}
                className="absolute z-30 p-3 rounded-2xl bg-slate-900 border border-white/20 shadow-2xl text-xs space-y-2 w-52"
              >
                <label className="text-[10px] font-bold text-white uppercase block">
                  Add {activeTool === 'textbox' ? 'Text Box' : 'Sticky Note'}
                </label>
                <textarea
                  rows={2}
                  value={newStickyText}
                  onChange={e => setNewStickyText(e.target.value)}
                  placeholder="Type note text..."
                  className="w-full p-1.5 rounded-lg bg-slate-950 border border-white/10 text-xs text-white focus:outline-none"
                  autoFocus
                />
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => setActiveStickyPrompt(null)}
                    className="px-2 py-1 rounded bg-white/5 text-slate-400 hover:text-white text-[11px]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddStickyNote}
                    className="px-2.5 py-1 rounded bg-indigo-600 text-white font-bold text-[11px]"
                  >
                    Place Note
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Pagination Bar */}
        <div className="px-5 py-3 border-t border-white/10 bg-slate-950 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-white">
              Page {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-mono">
            {annotations.length} annotation{annotations.length === 1 ? '' : 's'} on this page · Auto-saved
          </div>
        </div>
      </div>
    </div>
  );
};
