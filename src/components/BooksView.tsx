import React, { useState, useEffect } from 'react';
import {
  Subject,
  NCERTBook,
  NCERTClass,
  NCERTSubject,
  NCERTLanguage,
  UserBookProgress,
  UploadedNote,
  NoteHighlight,
  HighlightColor,
  NCERTChapter
} from '../types/index.js';
import { api } from '../utils/api.js';
import { NCERTPdfReaderModal } from './NCERTPdfReaderModal.js';
import { NCERTChapterSelectModal } from './NCERTChapterSelectModal.js';
import { NotesUploadModal } from './NotesUploadModal.js';
import { NoteViewerModal } from './NoteViewerModal.js';
import {
  BookOpen,
  Search,
  Bookmark,
  ExternalLink,
  Download,
  Layers,
  Sparkles,
  ChevronRight,
  Clock,
  CheckCircle,
  Plus,
  Trash2,
  Edit3,
  BookMarked,
  Filter,
  GraduationCap,
  Upload,
  Highlighter,
  FileText,
  Tag,
  Rocket,
  Compass,
  ThumbsUp,
  MessageSquare
} from 'lucide-react';

interface BooksViewProps {
  subjects: Subject[];
  initialTab?: 'ncert' | 'notes' | 'my_books' | 'future';
}

export const BooksView: React.FC<BooksViewProps> = ({ subjects, initialTab = 'ncert' }) => {
  // Navigation tab
  const [activeTab, setActiveTab] = useState<'ncert' | 'notes' | 'my_books' | 'future'>(initialTab);

  // Filtering states for NCERT
  const [selectedClass, setSelectedClass] = useState<NCERTClass | 'all'>('class_11');
  const [selectedSubject, setSelectedSubject] = useState<NCERTSubject | 'all'>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<NCERTLanguage | 'all'>('english');
  const [searchQuery, setSearchQuery] = useState('');

  // Data states
  const [books, setBooks] = useState<NCERTBook[]>([]);
  const [myBooksList, setMyBooksList] = useState<{ progress: UserBookProgress; book: NCERTBook }[]>([]);
  const [recentList, setRecentList] = useState<{ progress: UserBookProgress; book: NCERTBook }[]>([]);
  const [notes, setNotes] = useState<UploadedNote[]>([]);
  const [loading, setLoading] = useState(true);

  // Chapter Index Selection Modal
  const [chapterModalBook, setChapterModalBook] = useState<NCERTBook | null>(null);
  const [chapterModalProgress, setChapterModalProgress] = useState<UserBookProgress | null>(null);

  // PDF Viewer Modal
  const [readingBook, setReadingBook] = useState<NCERTBook | null>(null);
  const [readingProgress, setReadingProgress] = useState<UserBookProgress | null>(null);

  // Notes Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [preselectedUploadBook, setPreselectedUploadBook] = useState<NCERTBook | null>(null);
  const [activeViewingNote, setActiveViewingNote] = useState<UploadedNote | null>(null);
  const [noteSearchQuery, setNoteSearchQuery] = useState('');
  const [notesSubjectFilter, setNotesSubjectFilter] = useState('all');

  // Future Scope Modal
  const [showFutureModal, setShowFutureModal] = useState(false);
  const [newFutureTitle, setNewFutureTitle] = useState('');
  const [newFutureCategory, setNewFutureCategory] = useState('Exemplar');
  const [newFutureNotes, setNewFutureNotes] = useState('');
  const [futureRequests, setFutureRequests] = useState([
    { id: '1', title: 'NCERT Class 10 Science (Complete Biology & Chemistry)', category: 'Class 10', votes: 142, status: 'In Review' },
    { id: '2', title: 'NCERT Exemplar Class 12 Biology (Problems & Solutions)', category: 'Exemplar', votes: 218, status: 'Pipeline' },
    { id: '3', title: 'Comprehensive Organic Reaction Mechanisms Guide', category: 'Reference', votes: 345, status: 'Scheduled' },
    { id: '4', title: 'Fundamentals of Classical Mechanics & Optics Handbook', category: 'Physics Notes', votes: 189, status: 'Under Development' },
  ]);

  const handleUpvoteFuture = (id: string) => {
    setFutureRequests(prev =>
      prev.map(item => (item.id === id ? { ...item, votes: item.votes + 1 } : item))
    );
  };

  const handleAddFutureResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFutureTitle.trim()) return;
    const newReq = {
      id: 'req_' + Date.now(),
      title: newFutureTitle.trim(),
      category: newFutureCategory,
      votes: 1,
      status: 'Community Request',
    };
    setFutureRequests([newReq, ...futureRequests]);
    setNewFutureTitle('');
    setNewFutureNotes('');
    setShowFutureModal(false);
  };

  const loadData = async () => {
    try {
      const [ncertRes, myBooksRes, notesRes] = await Promise.all([
        api.getNCERTBooks({
          classLevel: selectedClass === 'all' ? undefined : selectedClass,
          subject: selectedSubject === 'all' ? undefined : selectedSubject,
          language: selectedLanguage === 'all' ? undefined : selectedLanguage,
          search: searchQuery.trim() || undefined,
        }),
        api.getMyBooks().catch(() => ({ myBooks: [], bookmarked: [], recent: [] })),
        api.getNotes().catch(() => ({ notes: [] })),
      ]);

      setBooks(ncertRes.books);
      setMyBooksList(myBooksRes.myBooks);
      setRecentList(myBooksRes.recent);
      setNotes(notesRes.notes);
    } catch (e) {
      console.error('Failed to load books and notes', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedClass, selectedSubject, selectedLanguage, searchQuery]);

  // Click on book card: opens Chapter selection first showing Chapter 1, Chapter 2, etc. with names!
  const handleOpenBookChapters = (book: NCERTBook) => {
    const prog = myBooksList.find(m => m.book.id === book.id)?.progress || null;
    setChapterModalProgress(prog);
    setChapterModalBook(book);
  };

  const handleSelectChapterToRead = (chapter: NCERTChapter) => {
    if (!chapterModalBook) return;
    const book = chapterModalBook;
    const existingProg = chapterModalProgress;
    setChapterModalBook(null);

    // Open PDF reader with selected chapter
    setReadingProgress(existingProg ? { ...existingProg, currentChapter: chapter.chapterNumber, currentPage: chapter.pageStart || 1 } : null);
    setReadingBook(book);
  };

  const handleContinueReadingFromLastPage = () => {
    if (!chapterModalBook) return;
    const book = chapterModalBook;
    const prog = chapterModalProgress;
    setChapterModalBook(null);
    setReadingProgress(prog);
    setReadingBook(book);
  };

  const handleToggleBookmark = async (e: React.MouseEvent, bookId: string) => {
    e.stopPropagation();
    try {
      await api.toggleBookBookmark(bookId);
      loadData();
    } catch (err) {
      console.error('Failed to toggle bookmark', err);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (confirm('Delete this uploaded note?')) {
      await api.deleteNote(id);
      setActiveViewingNote(null);
      loadData();
    }
  };

  const getBookProgress = (bookId: string): UserBookProgress | undefined => {
    return myBooksList.find(m => m.book.id === bookId)?.progress;
  };

  // Filter notes
  const filteredNotes = notes.filter(n => {
    const matchesSubject = notesSubjectFilter === 'all' || n.subjectId === notesSubjectFilter;
    const matchesSearch =
      !noteSearchQuery.trim() ||
      n.title.toLowerCase().includes(noteSearchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(noteSearchQuery.toLowerCase()) ||
      n.tags.some(t => t.toLowerCase().includes(noteSearchQuery.toLowerCase())) ||
      n.highlights?.some(h => h.text.toLowerCase().includes(noteSearchQuery.toLowerCase()));
    return matchesSubject && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-5xl mx-auto">
      {/* Top Header Card */}
      <div className="pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 tracking-wider uppercase">
              <span className="flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-emerald-400" />
                OFFICIAL NCERT CURRICULUM
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">Class 11 & Class 12 Textbooks & Notes</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1 flex items-center gap-2.5">
              <span>NCERT BOOKS & NOTES</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Direct official textbooks, chapter index navigation, note upload, and multi-color highlighting.
            </p>
          </div>

          {/* Primary View Switcher Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-900/90 rounded-2xl border border-white/5 self-start sm:self-auto flex-wrap">
            <button
              onClick={() => setActiveTab('ncert')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'ncert'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Textbooks</span>
            </button>

            <button
              onClick={() => setActiveTab('notes')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'notes'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Highlighter className="w-3.5 h-3.5 text-amber-400" />
              <span>Notes & Highlights ({notes.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('my_books')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'my_books'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>My Books</span>
            </button>

            <button
              onClick={() => setActiveTab('future')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'future'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Rocket className="w-3.5 h-3.5 text-emerald-400" />
              <span>Future Scope</span>
            </button>

            <button
              onClick={() => {
                setPreselectedUploadBook(null);
                setShowUploadModal(true);
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/25 flex items-center gap-1.5 transition-all ml-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Notes</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: NCERT TEXTBOOKS */}
      {/* ========================================================= */}
      {activeTab === 'ncert' && (
        <div className="space-y-5">
          {/* SEARCH BAR */}
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search books, Class 11, Class 12, Biology, Physics Part I, Chemistry Part II..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-slate-900/70 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 backdrop-blur-md transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs p-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* MY BOOKS PREVIEW STRIP */}
          {recentList.length > 0 && !searchQuery && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Continue Reading
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {recentList.length} in progress
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {recentList.slice(0, 3).map(({ progress, book }) => (
                  <div
                    key={book.id}
                    onClick={() => handleOpenBookChapters(book)}
                    className="p-3.5 rounded-2xl bg-slate-900/90 border border-indigo-500/30 hover:border-indigo-500 transition-all cursor-pointer shadow-lg space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg">
                        {book.subject === 'biology' ? '🧬' : book.subject === 'physics' ? '⚛️' : '🧪'}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-indigo-300 px-2 py-0.5 rounded bg-indigo-500/20">
                        {book.classLevel.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="font-bold text-sm text-white group-hover:text-indigo-200 transition-colors truncate">
                      {book.title}
                    </div>

                    {/* Example format: "Biology Class 11 Continue from Page 142" */}
                    <div className="text-xs text-emerald-400 font-semibold flex items-center justify-between">
                      <span>Continue from Page {progress.currentPage}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FILTER CONTROLS */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-900/60 border border-white/5">
            {/* Row 1: Class Tabs [CLASS 11] [CLASS 12] */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider mr-1 hidden xs:inline">
                  Class:
                </span>
                {(['class_11', 'class_12', 'all'] as const).map(cls => (
                  <button
                    key={cls}
                    onClick={() => setSelectedClass(cls)}
                    className={`min-h-[38px] px-4 rounded-xl text-xs font-bold uppercase transition-all ${
                      selectedClass === cls
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300'
                    }`}
                  >
                    {cls === 'all' ? 'All Classes' : cls.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {/* Language Selector: [English | हिंदी] */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider mr-1">
                  Language:
                </span>
                <div className="flex items-center bg-white/5 p-0.5 rounded-xl border border-white/5">
                  <button
                    onClick={() => setSelectedLanguage('english')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      selectedLanguage === 'english'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => setSelectedLanguage('hindi')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      selectedLanguage === 'hindi'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    हिंदी (Hindi)
                  </button>
                  <button
                    onClick={() => setSelectedLanguage('all')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      selectedLanguage === 'all'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All
                  </button>
                </div>
              </div>
            </div>

            {/* Row 2: Subject Cards [🧬 BIOLOGY] [⚛️ PHYSICS] [🧪 CHEMISTRY] */}
            <div className="pt-2 border-t border-white/5 flex items-center gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedSubject('all')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                  selectedSubject === 'all'
                    ? 'bg-white/15 text-white font-bold'
                    : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white'
                }`}
              >
                All Subjects
              </button>

              <button
                onClick={() => setSelectedSubject('biology')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 flex items-center gap-2 transition-all ${
                  selectedSubject === 'biology'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300'
                }`}
              >
                <span className="text-base">🧬</span>
                <span>BIOLOGY</span>
              </button>

              <button
                onClick={() => setSelectedSubject('physics')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 flex items-center gap-2 transition-all ${
                  selectedSubject === 'physics'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300'
                }`}
              >
                <span className="text-base">⚛️</span>
                <span>PHYSICS</span>
              </button>

              <button
                onClick={() => setSelectedSubject('chemistry')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 flex items-center gap-2 transition-all ${
                  selectedSubject === 'chemistry'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300'
                }`}
              >
                <span className="text-base">🧪</span>
                <span>CHEMISTRY</span>
              </button>
            </div>
          </div>

          {/* BOOKS LIST */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Official Textbooks ({books.length})
              </span>
              <span className="text-[11px] text-slate-500">
                Click any book to view Chapter 1, Chapter 2, etc.
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {books.map(book => {
                const userProg = getBookProgress(book.id);
                const isBookmarked = userProg?.isBookmarked;

                const subjectBadgeColor =
                  book.subject === 'biology'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : book.subject === 'physics'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';

                return (
                  <div
                    key={book.id}
                    onClick={() => handleOpenBookChapters(book)}
                    className="p-5 rounded-3xl bg-slate-900/70 border border-white/10 hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-4 group shadow-xl cursor-pointer"
                  >
                    <div className="space-y-3">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${subjectBadgeColor}`}>
                            {book.subject === 'biology'
                              ? '🧬 Biology'
                              : book.subject === 'physics'
                              ? '⚛️ Physics'
                              : '🧪 Chemistry'}
                          </span>
                          <span className="text-[11px] font-mono font-bold text-slate-400 uppercase">
                            {book.classLevel.replace('_', ' ')}
                          </span>
                          {book.partNumber && (
                            <span className="text-[11px] font-bold text-slate-300 px-2 py-0.5 rounded bg-white/5">
                              Part {book.partNumber === 1 ? 'I' : 'II'}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 px-1.5 py-0.5 rounded bg-white/5 uppercase">
                            {book.language}
                          </span>
                        </div>

                        {/* Bookmark Button */}
                        <button
                          onClick={e => handleToggleBookmark(e, book.id)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                            isBookmarked
                              ? 'text-amber-400 bg-amber-500/10'
                              : 'text-slate-500 hover:text-white hover:bg-white/5'
                          }`}
                          title={isBookmarked ? 'Remove Bookmark' : 'Add to My Books'}
                        >
                          <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                        </button>
                      </div>

                      {/* Book Title & Info */}
                      <div>
                        <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                          {book.title}
                        </h3>
                        {book.titleHindi && book.language === 'hindi' && (
                          <div className="text-xs text-slate-400 font-medium mt-0.5">
                            {book.titleHindi}
                          </div>
                        )}
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {book.description}
                        </p>
                      </div>

                      {/* Chapter Preview List (Shows Chapter 1, Chapter 2 etc. with names!) */}
                      <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/5 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-300 flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Chapters List ({book.chapters.length})</span>
                          </span>
                          <span className="text-[11px] font-mono text-indigo-400 font-semibold group-hover:underline">
                            View All →
                          </span>
                        </div>

                        {/* List first chapters with names */}
                        <div className="space-y-1.5">
                          {book.chapters.slice(0, 3).map(ch => (
                            <div
                              key={ch.chapterNumber}
                              className="text-xs text-slate-300 flex items-center justify-between gap-2 p-1.5 rounded-lg bg-white/[0.02]"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span className="w-5 h-5 rounded-md bg-white/5 text-[10px] font-mono font-bold flex items-center justify-center text-slate-400 shrink-0">
                                  {ch.chapterNumber}
                                </span>
                                <span className="truncate font-medium">Chapter {ch.chapterNumber}: {ch.title}</span>
                              </div>
                              {ch.pageStart && (
                                <span className="text-[10px] text-slate-500 font-mono shrink-0">
                                  p. {ch.pageStart}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Official Source Link */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>Official NCERT Source</span>
                        </span>
                        <a
                          href={book.officialSourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                        >
                          <span>ncert.nic.in</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                    {/* Card Open Book / Chapters Actions */}
                    <div className="pt-2 flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenBookChapters(book);
                        }}
                        className="flex-1 min-h-[44px] rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all"
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>Open Book · Chapters (1, 2...)</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreselectedUploadBook(book);
                          setShowUploadModal(true);
                        }}
                        title="Upload notes for this textbook"
                        className="min-h-[44px] px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        <span className="hidden xs:inline">Notes</span>
                      </button>

                      <a
                        href={book.officialDownloadUrl || book.officialSourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        title="Download Official NCERT PDF"
                        className="min-h-[44px] px-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        <span className="hidden xs:inline">PDF</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: UPLOADED NOTES & MULTI-COLOR HIGHLIGHTS */}
      {/* ========================================================= */}
      {activeTab === 'notes' && (
        <div className="space-y-5">
          {/* Notes Actions Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-3xl bg-slate-900/60 border border-white/5">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Highlighter className="w-5 h-5 text-amber-400" />
                <span>Uploaded Study Notes & Color Highlights</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Highlight your notes with 5 distinct colors (🟡 Yellow, 🟢 Green, 🔵 Blue, 🟣 Pink, 🟠 Orange).
              </p>
            </div>

            <button
              onClick={() => setShowUploadModal(true)}
              className="min-h-[42px] px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all self-start sm:self-auto"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Notes</span>
            </button>
          </div>

          {/* Notes Filters & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search notes, topics, formulas, or highlighted text..."
                value={noteSearchQuery}
                onChange={e => setNoteSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <select
              value={notesSubjectFilter}
              onChange={e => setNotesSubjectFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Subjects</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>
                  {s.icon} {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Notes List */}
          {filteredNotes.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-white/5 space-y-3">
              <FileText className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No notes uploaded yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Upload your chapter summaries or formula sheets and highlight important exam points!
              </p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
              >
                Upload First Note
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredNotes.map(n => {
                const yellowCount = n.highlights?.filter(h => h.color === 'yellow').length || 0;
                const greenCount = n.highlights?.filter(h => h.color === 'green').length || 0;
                const blueCount = n.highlights?.filter(h => h.color === 'blue').length || 0;
                const pinkCount = n.highlights?.filter(h => h.color === 'pink').length || 0;
                const orangeCount = n.highlights?.filter(h => h.color === 'orange').length || 0;

                return (
                  <div
                    key={n.id}
                    onClick={() => setActiveViewingNote(n)}
                    className="p-5 rounded-3xl bg-slate-900/70 border border-white/10 hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-3 cursor-pointer group shadow-lg"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {n.subjectName && (
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={{
                                backgroundColor: `${n.subjectColor || '#6366f1'}20`,
                                color: n.subjectColor || '#6366f1',
                              }}
                            >
                              {n.subjectName}
                            </span>
                          )}
                          {n.chapterNumber && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400">
                              Ch {n.chapterNumber}
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(n.updatedAt || n.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-white group-hover:text-indigo-200 transition-colors">
                        {n.title}
                      </h3>

                      <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                        {n.content}
                      </p>
                    </div>

                    {/* Multi-Color Highlights Counter Badges */}
                    <div className="pt-2 border-t border-white/5 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-400 font-medium">Highlights:</span>
                        <div className="flex items-center gap-1.5">
                          {yellowCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[10px] font-bold">
                              🟡 {yellowCount}
                            </span>
                          )}
                          {greenCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-300 text-[10px] font-bold">
                              🟢 {greenCount}
                            </span>
                          )}
                          {blueCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-sky-400/20 text-sky-300 text-[10px] font-bold">
                              🔵 {blueCount}
                            </span>
                          )}
                          {pinkCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-pink-400/20 text-pink-300 text-[10px] font-bold">
                              🟣 {pinkCount}
                            </span>
                          )}
                          {orangeCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-orange-400/20 text-orange-300 text-[10px] font-bold">
                              🟠 {orangeCount}
                            </span>
                          )}
                          {(!n.highlights || n.highlights.length === 0) && (
                            <span className="text-[10px] text-slate-500 italic">No highlights</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <div className="flex items-center gap-1 overflow-hidden">
                          {n.tags?.slice(0, 2).map(tag => (
                            <span key={tag} className="text-[10px] text-slate-400 truncate">
                              #{tag}
                            </span>
                          ))}
                        </div>

                        <span className="text-indigo-400 group-hover:text-indigo-300 font-semibold flex items-center gap-1">
                          <span>Open & Highlight</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: MY BOOKS (Saved & Bookmarks) */}
      {/* ========================================================= */}
      {activeTab === 'my_books' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Bookmarked Textbooks ({myBooksList.length})
            </span>
          </div>

          {myBooksList.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-white/5 space-y-3">
              <Bookmark className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No bookmarked textbooks</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Click the bookmark star on any NCERT textbook in the library to save it here for fast 1-tap access.
              </p>
              <button
                onClick={() => setActiveTab('ncert')}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
              >
                Browse NCERT Library
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myBooksList.map(({ progress, book }) => (
                <div
                  key={book.id}
                  onClick={() => handleOpenBookChapters(book)}
                  className="p-5 rounded-3xl bg-slate-900/80 border border-white/10 hover:border-indigo-500/40 flex flex-col justify-between space-y-3 cursor-pointer group transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-indigo-400 uppercase">
                        {book.classLevel.replace('_', ' ')}
                      </span>
                      <button
                        onClick={e => handleToggleBookmark(e, book.id)}
                        className="text-amber-400"
                      >
                        <Bookmark className="w-4 h-4 fill-current" />
                      </button>
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-indigo-200 transition-colors">
                      {book.title}
                    </h3>
                    <p className="text-xs text-slate-400">{book.description}</p>

                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs">
                      <span className="text-emerald-400 font-semibold">
                        Page {progress.currentPage} of {progress.totalPages}
                      </span>
                      <span className="text-slate-400 font-mono">
                        {Math.round((progress.currentPage / progress.totalPages) * 100)}% Complete
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenBookChapters(book);
                    }}
                    className="w-full min-h-[42px] rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-all"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>View Chapters & Continue</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: FUTURE ROADMAP & EDUCATIONAL EXPANSIONS */}
      {/* ========================================================= */}
      {activeTab === 'future' && (
        <div className="space-y-5">
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-950 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                <Rocket className="w-4 h-4 text-emerald-400" />
                <span>Educational Curriculum & Resource Pipeline</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Upcoming Additions & Educational Resources
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                StudyMed is built with an expandable architecture to integrate additional legally authorized NCERT books, question banks, and custom student PDFs without rebuilding the app.
              </p>
            </div>

            <button
              onClick={() => setShowFutureModal(true)}
              className="min-h-[42px] px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all self-start sm:self-auto shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Suggest / Add Resource</span>
            </button>
          </div>

          {/* Official Expansion Architecture Cards */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              Official Syllabus Roadmap
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2 hover:border-indigo-500/30 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">📘</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold uppercase">
                    Architecture Ready
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white">NCERT Class 9 & Class 10</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Foundation Science (Biology, Chemistry, Physics) and Mathematics textbooks for secondary school curricula.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2 hover:border-indigo-500/30 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">🔬</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold uppercase">
                    In Pipeline
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white">NCERT Exemplar Problems</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Advanced multiple-choice questions, reasoning assertions, and analytical problem sets for competitive exams (NEET / JEE).
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2 hover:border-indigo-500/30 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">📝</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold uppercase">
                    Scheduled
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white">Previous Years Questions (PYQs)</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Official past examination papers with chapter-wise classification and step-by-step marking schemes.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2 hover:border-indigo-500/30 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">🌐</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold uppercase">
                    Multilingual Engine
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white">Regional Language Editions</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Expansion to Urdu, Tamil, Marathi, and Gujarati official NCERT translations as verified digital releases are authenticated.
                </p>
              </div>
            </div>
          </div>

          {/* Student Requested Resources Board */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Community Resource Requests ({futureRequests.length})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Upvote topics or textbooks you want prioritized next in the library
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {futureRequests.map(req => (
                <div
                  key={req.id}
                  className="p-4 rounded-2xl bg-slate-900/70 border border-white/10 hover:border-indigo-500/30 transition-all flex items-start justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/5 text-slate-300">
                        {req.category}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-400">
                        ● {req.status}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white leading-snug">
                      {req.title}
                    </div>
                  </div>

                  <button
                    onClick={() => handleUpvoteFuture(req.id)}
                    className="flex flex-col items-center justify-center min-w-[48px] px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-indigo-600/20 hover:text-indigo-300 text-slate-400 transition-all border border-white/5 shrink-0"
                    title="Upvote this resource"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-mono font-bold mt-0.5">{req.votes}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}


      {/* SUGGEST / ADD FUTURE RESOURCE MODAL */}
      {showFutureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Rocket className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Suggest / Add Future Resource</h3>
              </div>
              <button onClick={() => setShowFutureModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddFutureResource} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Resource Title / Topic *</label>
                <input
                  type="text"
                  placeholder="e.g. Class 10 Genetics & Evolution / NEET Solved Papers..."
                  value={newFutureTitle}
                  onChange={e => setNewFutureTitle(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Category</label>
                  <select
                    value={newFutureCategory}
                    onChange={e => setNewFutureCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Class 9">NCERT Class 9</option>
                    <option value="Class 10">NCERT Class 10</option>
                    <option value="Exemplar">NCERT Exemplar</option>
                    <option value="PYQs">Previous Year Questions</option>
                    <option value="Medical Notes">Medical Revision Notes</option>
                    <option value="Coaching PDF">User Coaching PDF</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Priority</label>
                  <input
                    type="text"
                    disabled
                    value="High (NEET / Board Prep)"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-white/5 text-xs text-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Why should this be added? (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Needed for NEET 2026 biology revision..."
                  value={newFutureNotes}
                  onChange={e => setNewFutureNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFutureModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/25"
                >
                  Submit Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHAPTER INDEX MODAL (Shows Chapter 1, Chapter 2, etc. with names when opening a book) */}
      {chapterModalBook && (
        <NCERTChapterSelectModal
          book={chapterModalBook}
          progress={chapterModalProgress}
          onSelectChapter={handleSelectChapterToRead}
          onContinueReading={handleContinueReadingFromLastPage}
          onClose={() => {
            setChapterModalBook(null);
            setChapterModalProgress(null);
          }}
        />
      )}

      {/* PDF READER MODAL */}
      {readingBook && (
        <NCERTPdfReaderModal
          book={readingBook}
          initialProgress={readingProgress}
          onClose={() => setReadingBook(null)}
          onProgressUpdated={prog => {
            setReadingProgress(prog);
            loadData();
          }}
        />
      )}

      {/* UPLOAD NOTES MODAL */}
      {showUploadModal && (
        <NotesUploadModal
          subjects={subjects}
          books={books}
          preselectedBook={preselectedUploadBook}
          onClose={() => {
            setShowUploadModal(false);
            setPreselectedUploadBook(null);
          }}
          onSuccess={() => {
            setShowUploadModal(false);
            setPreselectedUploadBook(null);
            loadData();
          }}
        />
      )}

      {/* NOTE VIEWER & MULTI-COLOR HIGHLIGHTER MODAL */}
      {activeViewingNote && (
        <NoteViewerModal
          note={activeViewingNote}
          onClose={() => setActiveViewingNote(null)}
          onNoteUpdated={updated => {
            setActiveViewingNote(updated);
            loadData();
          }}
          onDeleteNote={handleDeleteNote}
        />
      )}
    </div>
  );
};
