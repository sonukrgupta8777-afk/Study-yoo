import React, { useState, useEffect, useRef } from 'react';
import { NCERTBook, NCERTChapter, UserBookProgress } from '../types/index.js';
import { api } from '../utils/api.js';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Bookmark,
  Share2,
  Download,
  ExternalLink,
  BookOpen,
  Search,
  List,
  Check,
  AlertCircle,
  RotateCcw
} from 'lucide-react';

interface NCERTPdfReaderModalProps {
  book: NCERTBook;
  initialProgress?: UserBookProgress | null;
  onClose: () => void;
  onProgressUpdated?: (progress: UserBookProgress) => void;
}

export const NCERTPdfReaderModal: React.FC<NCERTPdfReaderModalProps> = ({
  book,
  initialProgress,
  onClose,
  onProgressUpdated,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(initialProgress?.currentPage || 1);
  const [selectedChapterNumber, setSelectedChapterNumber] = useState<number>(
    initialProgress?.currentChapter || book.chapters[0]?.chapterNumber || 1
  );
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showChaptersSidebar, setShowChaptersSidebar] = useState<boolean>(false);
  const [bookmarkedPages, setBookmarkedPages] = useState<number[]>(initialProgress?.bookmarkedPages || []);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(initialProgress?.isBookmarked || false);
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [pageInput, setPageInput] = useState<string>(String(initialProgress?.currentPage || 1));
  const [iframeError, setIframeError] = useState<boolean>(false);
  const [chapterSearch, setChapterSearch] = useState<string>('');

  const modalRef = useRef<HTMLDivElement | null>(null);

  const currentChapter = book.chapters.find(c => c.chapterNumber === selectedChapterNumber) || book.chapters[0];

  // Save progress on page or chapter change
  useEffect(() => {
    const saveProgress = async () => {
      try {
        const res = await api.updateNCERTProgress({
          bookId: book.id,
          currentPage,
          currentChapter: selectedChapterNumber,
          totalPages: book.totalPages,
          bookmarkedPages,
          isBookmarked,
        });
        if (onProgressUpdated) {
          onProgressUpdated(res.progress);
        }
      } catch (err) {
        console.error('Failed to sync reading progress', err);
      }
    };

    const timeout = setTimeout(saveProgress, 600);
    return () => clearTimeout(timeout);
  }, [book.id, currentPage, selectedChapterNumber, bookmarkedPages, isBookmarked, book.totalPages]);

  const handleNextPage = () => {
    if (currentPage < book.totalPages) {
      const next = currentPage + 1;
      setCurrentPage(next);
      setPageInput(String(next));

      // Check if entering new chapter
      const nextChapter = book.chapters.find(c => c.pageStart && c.pageEnd && next >= c.pageStart && next <= c.pageEnd);
      if (nextChapter && nextChapter.chapterNumber !== selectedChapterNumber) {
        setSelectedChapterNumber(nextChapter.chapterNumber);
      }
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const prev = currentPage - 1;
      setCurrentPage(prev);
      setPageInput(String(prev));

      const prevChapter = book.chapters.find(c => c.pageStart && c.pageEnd && prev >= c.pageStart && prev <= c.pageEnd);
      if (prevChapter && prevChapter.chapterNumber !== selectedChapterNumber) {
        setSelectedChapterNumber(prevChapter.chapterNumber);
      }
    }
  };

  const handlePageJump = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(pageInput, 10);
    if (!isNaN(val) && val >= 1 && val <= book.totalPages) {
      setCurrentPage(val);
      const matchedChapter = book.chapters.find(c => c.pageStart && c.pageEnd && val >= c.pageStart && val <= c.pageEnd);
      if (matchedChapter) {
        setSelectedChapterNumber(matchedChapter.chapterNumber);
      }
    } else {
      setPageInput(String(currentPage));
    }
  };

  const handleSelectChapter = (ch: NCERTChapter) => {
    setSelectedChapterNumber(ch.chapterNumber);
    if (ch.pageStart) {
      setCurrentPage(ch.pageStart);
      setPageInput(String(ch.pageStart));
    }
    setShowChaptersSidebar(false);
  };

  const handleTogglePageBookmark = () => {
    let updated: number[];
    if (bookmarkedPages.includes(currentPage)) {
      updated = bookmarkedPages.filter(p => p !== currentPage);
      triggerToast(`Removed bookmark for Page ${currentPage}`);
    } else {
      updated = [...bookmarkedPages, currentPage].sort((a, b) => a - b);
      triggerToast(`Bookmarked Page ${currentPage}`);
    }
    setBookmarkedPages(updated);
  };

  const handleToggleBookBookmark = async () => {
    const nextState = !isBookmarked;
    setIsBookmarked(nextState);
    await api.toggleBookBookmark(book.id);
    triggerToast(nextState ? 'Book added to My Books' : 'Book removed from My Books');
  };

  const triggerToast = (msg: string) => {
    setCopyToast(msg);
    setTimeout(() => setCopyToast(null), 2500);
  };

  const handleShareLink = () => {
    const url = currentChapter?.officialPdfUrl || book.officialSourceUrl;
    navigator.clipboard.writeText(url);
    triggerToast('Official NCERT link copied to clipboard');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      modalRef.current?.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const isCurrentPageBookmarked = bookmarkedPages.includes(currentPage);

  const filteredChapters = book.chapters.filter(c =>
    c.title.toLowerCase().includes(chapterSearch.toLowerCase()) ||
    (c.titleHindi && c.titleHindi.toLowerCase().includes(chapterSearch.toLowerCase())) ||
    String(c.chapterNumber).includes(chapterSearch)
  );

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-100 overflow-hidden select-none"
    >
      {/* Top Header Bar */}
      <header className="h-14 bg-slate-900/90 border-b border-white/10 px-3 sm:px-5 flex items-center justify-between shrink-0 gap-2 backdrop-blur-md">
        {/* Left: Book Meta & Chapter Selector */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors shrink-0"
            title="Close Viewer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 uppercase tracking-wider font-mono shrink-0">
                {book.classLevel.replace('_', ' ')}
              </span>
              <h2 className="text-sm font-bold text-white truncate max-w-[140px] sm:max-w-xs">
                {book.title}
              </h2>
            </div>
            <div className="text-[11px] text-slate-400 truncate hidden sm:block">
              Chapter {currentChapter?.chapterNumber}: {currentChapter?.title}
            </div>
          </div>
        </div>

        {/* Center: Page Controls & Jump */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 px-2 py-1 rounded-xl border border-white/5 shrink-0">
          <button
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <form onSubmit={handlePageJump} className="flex items-center gap-1">
            <span className="text-[11px] text-slate-400 hidden xs:inline">Page</span>
            <input
              type="text"
              value={pageInput}
              onChange={e => setPageInput(e.target.value)}
              onBlur={() => setPageInput(String(currentPage))}
              className="w-12 text-center bg-white/5 border border-white/10 rounded-md py-0.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-indigo-500"
            />
            <span className="text-[11px] text-slate-400 font-mono">/ {book.totalPages}</span>
          </form>

          <button
            onClick={handleNextPage}
            disabled={currentPage >= book.totalPages}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Actions (Zoom, Bookmark, Chapters, Fullscreen, Share, Download) */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Zoom controls */}
          <div className="hidden md:flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/5 mr-1">
            <button
              onClick={() => setZoomLevel(z => Math.max(50, z - 15))}
              className="p-1.5 rounded hover:bg-white/10 text-slate-300 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono font-medium px-1 text-slate-400">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel(z => Math.min(200, z + 15))}
              className="p-1.5 rounded hover:bg-white/10 text-slate-300 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(100)}
              className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-white"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Bookmark page */}
          <button
            onClick={handleTogglePageBookmark}
            title={isCurrentPageBookmarked ? 'Remove Page Bookmark' : 'Bookmark this Page'}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
              isCurrentPageBookmarked
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isCurrentPageBookmarked ? 'fill-current' : ''}`} />
          </button>

          {/* Chapters Sidebar Toggle */}
          <button
            onClick={() => setShowChaptersSidebar(!showChaptersSidebar)}
            title="Table of Contents / Chapters"
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
              showChaptersSidebar
                ? 'bg-indigo-600 text-white'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white'
            }`}
          >
            <List className="w-4 h-4" />
          </button>

          {/* Share official link */}
          <button
            onClick={handleShareLink}
            title="Share Official NCERT Link"
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors hidden sm:flex"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Download Official PDF */}
          <a
            href={currentChapter?.officialPdfUrl || book.officialDownloadUrl || book.officialSourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Download Official NCERT PDF"
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <Download className="w-4 h-4" />
          </a>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            title="Toggle Fullscreen Reading"
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors hidden sm:flex"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Reading Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Toast alert banner */}
        {copyToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-600 border border-indigo-400/40 text-xs font-semibold text-white shadow-2xl animate-in fade-in duration-150">
            <Check className="w-4 h-4" />
            <span>{copyToast}</span>
          </div>
        )}

        {/* Chapters Sidebar Drawer */}
        {showChaptersSidebar && (
          <aside className="absolute md:relative top-0 bottom-0 left-0 z-20 w-80 bg-slate-900 border-r border-white/10 flex flex-col shadow-2xl transition-all">
            <div className="p-3.5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Chapters ({book.chapters.length})
                </span>
              </div>
              <button
                onClick={() => setShowChaptersSidebar(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            {/* Chapter search filter */}
            <div className="p-2.5 border-b border-white/5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter chapters or topics..."
                  value={chapterSearch}
                  onChange={e => setChapterSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Bookmarked Pages list */}
            {bookmarkedPages.length > 0 && (
              <div className="p-2.5 bg-amber-500/5 border-b border-amber-500/10">
                <span className="text-[10px] font-bold text-amber-400 tracking-wider uppercase block mb-1.5">
                  ★ Bookmarked Pages
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {bookmarkedPages.map(page => (
                    <button
                      key={page}
                      onClick={() => {
                        setCurrentPage(page);
                        setPageInput(String(page));
                      }}
                      className={`px-2 py-0.5 rounded text-xs font-mono transition-colors ${
                        currentPage === page
                          ? 'bg-amber-400 text-slate-950 font-bold'
                          : 'bg-amber-400/15 text-amber-300 hover:bg-amber-400/25'
                      }`}
                    >
                      p. {page}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chapter List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredChapters.map(ch => {
                const isSelected = ch.chapterNumber === selectedChapterNumber;
                return (
                  <button
                    key={ch.chapterNumber}
                    onClick={() => handleSelectChapter(ch)}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-indigo-600 text-white font-medium shadow-md'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-400'
                      }`}
                    >
                      {ch.chapterNumber}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs leading-snug line-clamp-2 font-medium">
                        Chapter {ch.chapterNumber}: {ch.title}
                      </div>
                      {ch.titleHindi && (
                        <div
                          className={`text-[10px] mt-0.5 truncate ${
                            isSelected ? 'text-indigo-200' : 'text-slate-500'
                          }`}
                        >
                          {ch.titleHindi}
                        </div>
                      )}
                      {ch.pageStart && (
                        <div
                          className={`text-[10px] font-mono mt-0.5 ${
                            isSelected ? 'text-indigo-200' : 'text-slate-500'
                          }`}
                        >
                          Pages {ch.pageStart} – {ch.pageEnd}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Official Source attribution footer */}
            <div className="p-3 bg-slate-950 border-t border-white/5 text-[11px] text-slate-400 space-y-1">
              <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                <span>🏛️ Official NCERT Source</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                National Council of Educational Research and Training (NCERT), New Delhi, India.
              </p>
              <a
                href={book.officialSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
              >
                <span>Visit ncert.nic.in</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </aside>
        )}

        {/* Reader Center Canvas / PDF View */}
        <div className="flex-1 bg-slate-950 flex flex-col items-center justify-center p-2 sm:p-4 overflow-auto">
          {iframeError ? (
            /* Fallback Card when browser origin blocks embedding */
            <div className="max-w-md w-full bg-slate-900 border border-white/10 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Official PDF currently unavailable inline</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  NCERT servers protect official textbook PDFs using origin security headers. You can open and read Chapter {currentChapter?.chapterNumber} directly via the official NCERT viewer tab.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <a
                  href={currentChapter?.officialPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full min-h-[44px] rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open Official NCERT Chapter PDF</span>
                </a>

                <a
                  href={book.officialSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full min-h-[44px] rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 border border-white/5 transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>View on NCERT Textbook Portal</span>
                </a>
              </div>

              <button
                onClick={() => setIframeError(false)}
                className="text-[11px] text-slate-500 hover:text-slate-300 underline"
              >
                Retry inline view
              </button>
            </div>
          ) : (
            <div
              className="w-full h-full flex flex-col items-center justify-center relative rounded-2xl overflow-hidden border border-white/10 bg-slate-900/50 shadow-2xl transition-all"
              style={{
                maxWidth: `${Math.min(100, zoomLevel)}%`,
                maxHeight: '100%',
              }}
            >
              {/* Embedded PDF iframe viewer */}
              <iframe
                src={`${currentChapter?.officialPdfUrl || book.officialSourceUrl}#page=${currentPage}&zoom=${zoomLevel}`}
                title={`${book.title} - Chapter ${currentChapter?.chapterNumber}`}
                className="w-full h-full border-0 bg-white rounded-xl"
                onError={() => setIframeError(true)}
              />

              {/* Direct Open Overlay Bar in bottom corner for 1-click legal access */}
              <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-slate-950/90 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl text-xs text-slate-300 shadow-xl">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-[11px] font-medium hidden xs:inline">Official NCERT Document</span>
                <a
                  href={currentChapter?.officialPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 ml-1"
                >
                  <span>Open Tab</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
