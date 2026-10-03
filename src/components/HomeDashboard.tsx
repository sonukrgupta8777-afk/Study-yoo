import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  Subject,
  StudySession,
  ActiveTimerState,
  TimerMode,
  UserPreferences,
  DDayEvent
} from '../types/index.js';
import {
  Play,
  Pause,
  Square,
  Plus,
  Flame,
  Clock,
  Award,
  ChevronRight,
  MoreVertical,
  CheckCircle2,
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  BookOpen,
  CloudSun,
  Target,
  CalendarCheck,
  Grid,
  Shield,
  FileText,
  GraduationCap,
  Edit3,
  Music,
  Palette,
  Youtube,
  Zap
} from 'lucide-react';
import { formatSecondsToDigital, formatSecondsToHuman, calculateDDay } from '../utils/api.js';

interface HomeDashboardProps {
  user: UserProfile | null;
  preferences: UserPreferences;
  subjects: Subject[];
  activeTimer: ActiveTimerState | null;
  todaySessions: StudySession[];
  ddays: DDayEvent[];
  stats: {
    totalStudySeconds: number;
    sessionCount: number;
    averageSessionSeconds: number;
    longestSessionSeconds: number;
    streak: number;
  };
  selectedSubject: Subject | null;
  onSelectSubject: (sub: Subject) => void;
  onStartTimer: (subject: Subject, mode?: TimerMode, customDuration?: number) => void;
  onPauseTimer: () => void;
  onResumeTimer: () => void;
  onFinishTimer: (notes?: string) => void;
  onOpenSubjectModal: (subjectToEdit?: Subject) => void;
  onOpenFocusMode: () => void;
  onOpenSoundModal: () => void;
  onOpenDDayModal: () => void;
  onOpenPlanner: () => void;
  onOpenHeatmap: () => void;
  onDeleteSession: (sessionId: string) => void;
  onResetTimer?: () => void;
  onNavigateToBooks?: () => void;
  onNavigateToNotes?: () => void;
  onOpenAppBlocker?: () => void;
  onOpenSpotify?: () => void;
  onOpenAppearance?: () => void;
  onOpenYouTube?: () => void;
  onOpenDailyTarget?: () => void;
  onQuickSetTarget?: (hours: number) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  user,
  preferences,
  subjects,
  activeTimer,
  todaySessions,
  ddays,
  stats,
  selectedSubject,
  onSelectSubject,
  onStartTimer,
  onPauseTimer,
  onResumeTimer,
  onFinishTimer,
  onOpenSubjectModal,
  onOpenFocusMode,
  onOpenSoundModal,
  onOpenDDayModal,
  onOpenPlanner,
  onOpenHeatmap,
  onDeleteSession,
  onResetTimer,
  onNavigateToBooks,
  onNavigateToNotes,
  onOpenAppBlocker,
  onOpenSpotify,
  onOpenAppearance,
  onOpenYouTube,
  onOpenDailyTarget,
  onQuickSetTarget,
}) => {
  // Local high-precision tick counter computed strictly from server startTimestamp to prevent frame loss
  const [currentSeconds, setCurrentSeconds] = useState(0);
  const [timerMode, setTimerMode] = useState<TimerMode>('stopwatch');
  const [activeTabStats, setActiveTabStats] = useState<'today' | 'week' | 'month'>('today');
  const [finishModalOpen, setFinishModalOpen] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  const [showSubjectMenu, setShowSubjectMenu] = useState<string | null>(null);

  // High precision time sync
  useEffect(() => {
    if (!activeTimer) {
      setCurrentSeconds(0);
      return;
    }

    const updateTimer = () => {
      if (activeTimer.isPaused) {
        setCurrentSeconds(activeTimer.accumulatedSeconds || 0);
      } else {
        const elapsedSinceStart = Math.floor((Date.now() - activeTimer.startTimestamp) / 1000);
        const total = (activeTimer.accumulatedSeconds || 0) + elapsedSinceStart;

        if (activeTimer.mode === 'countdown' || activeTimer.mode === 'pomodoro') {
          const target = activeTimer.targetDurationSeconds || 25 * 60;
          const remaining = Math.max(0, target - total);
          setCurrentSeconds(remaining);
          if (remaining === 0 && !activeTimer.isPaused) {
            // Reached completion
            onFinishTimer('Pomodoro goal reached');
          }
        } else {
          setCurrentSeconds(total);
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 500);
    return () => clearInterval(interval);
  }, [activeTimer, onFinishTimer]);

  const activeSubject = selectedSubject || subjects[0] || null;
  const isStudying = activeTimer && !activeTimer.isPaused;
  const isPaused = activeTimer && activeTimer.isPaused;

  // Daily goal calculation
  const dailyGoalMinutes = user?.dailyGoalMinutes || 360;
  const dailyGoalSeconds = dailyGoalMinutes * 60;
  const todayProgressSeconds = stats.totalStudySeconds + (isStudying ? currentSeconds : 0);
  const goalPercentage = Math.min(100, Math.round((todayProgressSeconds / dailyGoalSeconds) * 100));

  // Current Date display
  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const getGreeting = () => {
    const hour = now.getHours();
    if (hour < 12) return 'GOOD MORNING';
    if (hour < 18) return 'GOOD AFTERNOON';
    return 'GOOD EVENING';
  };

  const handleStart = () => {
    if (!activeSubject) return;
    let target = undefined;
    if (timerMode === 'pomodoro') {
      target = (preferences.breakSettings?.pomodoroFocusMinutes || 25) * 60;
    } else if (timerMode === 'countdown') {
      target = 45 * 60;
    }
    onStartTimer(activeSubject, timerMode, target);
  };

  const handleConfirmFinish = () => {
    onFinishTimer(sessionNotes);
    setFinishModalOpen(false);
    setSessionNotes('');
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-4xl mx-auto">
      {/* Top Header Card: Greeting, Date, Live Time & Weather */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 tracking-wider uppercase">
              <span>{getGreeting()}, {user?.username?.toUpperCase() || 'STUDENT'}</span>
              <span className="text-slate-600">·</span>
              <span className="font-mono text-slate-300">
                {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-0.5">
              {dateFormatted}
            </h1>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            {/* Ambient Weather Widget */}
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/[0.03] border border-white/5 text-xs text-slate-300">
              <CloudSun className="w-4 h-4 text-amber-400" />
              <span>24°C Focus Skies</span>
            </div>

            {/* D-Day Quick Badge */}
            {ddays.length > 0 && (
              <button
                onClick={onOpenDDayModal}
                className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-xs transition-colors"
              >
                <Target className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-bold font-mono text-indigo-300">
                  {calculateDDay(ddays[0].targetDate).label}
                </span>
                <span className="text-slate-300 truncate max-w-[110px]">
                  {ddays[0].title}
                </span>
              </button>
            )}

            {/* Daily Goal Quick Badge (Clickable to set 8h, 10h, 12h target) */}
            <button
              onClick={onOpenDailyTarget}
              title="Click to change today focus target (8hr, 10hr, etc.)"
              className="flex items-center gap-2.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-indigo-500/40 rounded-2xl p-2 px-3 transition-all text-left group"
            >
              <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
                <svg className="w-8 h-8 -rotate-90">
                  <circle
                    cx="16"
                    cy="16"
                    r="13"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="text-white/10"
                    fill="transparent"
                  />
                  <circle
                    cx="16"
                    cy="16"
                    r="13"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeDasharray={81.6}
                    strokeDashoffset={81.6 - (81.6 * goalPercentage) / 100}
                    strokeLinecap="round"
                    className="text-indigo-400 transition-all duration-500"
                    fill="transparent"
                  />
                </svg>
                <span className="absolute text-[10px] font-mono font-bold text-white">
                  {goalPercentage}%
                </span>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <span>TARGET: {Math.round(dailyGoalMinutes / 60)}h</span>
                  <Zap className="w-2.5 h-2.5 text-amber-400" />
                </div>
                <div className="text-xs font-semibold font-mono text-white group-hover:text-indigo-300 transition-colors">
                  {formatSecondsToHuman(todayProgressSeconds)}
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Quick Tools Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {/* Quick Target Switcher Pills (8h, 10h, 12h) */}
          {onQuickSetTarget && (
            <div className="flex items-center gap-1 bg-white/[0.02] border border-white/5 p-1 rounded-xl shrink-0">
              <span className="text-[10px] text-slate-500 uppercase font-mono font-bold px-1.5">
                Target:
              </span>
              {[6, 8, 10, 12].map(hrs => {
                const isActive = Math.round(dailyGoalMinutes / 60) === hrs;
                return (
                  <button
                    key={hrs}
                    onClick={() => onQuickSetTarget(hrs)}
                    className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {hrs}h
                  </button>
                );
              })}
            </div>
          )}

          {/* YouTube Study Video Button */}
          {onOpenYouTube && (
            <button
              onClick={onOpenYouTube}
              className="px-3 py-1.5 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-xs text-red-400 flex items-center gap-1.5 border border-red-500/30 transition-colors shrink-0 font-semibold active:scale-95"
            >
              <Youtube className="w-3.5 h-3.5 fill-current" />
              <span>YouTube Video</span>
            </button>
          )}

          {onOpenSpotify && (
            <button
              onClick={onOpenSpotify}
              className="px-3 py-1.5 rounded-xl bg-[#1DB954]/10 hover:bg-[#1DB954]/20 text-xs text-[#1DB954] flex items-center gap-1.5 border border-[#1DB954]/30 transition-colors shrink-0 font-semibold"
            >
              <Music className="w-3.5 h-3.5 animate-pulse" />
              <span>Spotify Beats</span>
            </button>
          )}

          {onOpenAppearance && (
            <button
              onClick={onOpenAppearance}
              className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-xs text-purple-300 flex items-center gap-1.5 border border-purple-500/20 transition-colors shrink-0 font-medium"
            >
              <Palette className="w-3.5 h-3.5 text-purple-400" />
              <span>100+ Wallpapers</span>
            </button>
          )}

          <button
            onClick={onOpenPlanner}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 flex items-center gap-1.5 border border-white/5 transition-colors shrink-0"
          >
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>10-Minute Planner</span>
          </button>

          <button
            onClick={onOpenHeatmap}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 flex items-center gap-1.5 border border-white/5 transition-colors shrink-0"
          >
            <Grid className="w-3.5 h-3.5 text-emerald-400" />
            <span>Yearly Heatmap</span>
          </button>

          <button
            onClick={onOpenDDayModal}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 flex items-center gap-1.5 border border-white/5 transition-colors shrink-0"
          >
            <Target className="w-3.5 h-3.5 text-amber-400" />
            <span>D-Day Events ({ddays.length})</span>
          </button>

          {onNavigateToBooks && (
            <button
              onClick={onNavigateToBooks}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-xs text-emerald-300 flex items-center gap-1.5 border border-emerald-500/20 transition-colors shrink-0 font-medium"
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span>Books & Textbooks</span>
            </button>
          )}

          {onNavigateToNotes && (
            <button
              onClick={onNavigateToNotes}
              className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-xs text-amber-300 flex items-center gap-1.5 border border-amber-500/20 transition-colors shrink-0 font-medium"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
              <span>Personal Notes</span>
            </button>
          )}

          {onOpenAppBlocker && (
            <button
              onClick={onOpenAppBlocker}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-xs text-cyan-300 flex items-center gap-1.5 border border-cyan-500/20 transition-colors shrink-0 font-medium"
            >
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>App Block</span>
            </button>
          )}
        </div>
      </div>

      {/* Core Academic Productivity Hub Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div
          onClick={onNavigateToBooks}
          className="p-4 rounded-3xl bg-slate-900/90 border border-emerald-500/20 hover:border-emerald-500/50 transition-all cursor-pointer group flex flex-col justify-between space-y-2 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">Library</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">Books & Textbooks</h3>
            <p className="text-[11px] text-slate-400 leading-tight">Digital Reader & Progress</p>
          </div>
        </div>

        <div
          onClick={onNavigateToNotes}
          className="p-4 rounded-3xl bg-slate-900/90 border border-amber-500/20 hover:border-amber-500/50 transition-all cursor-pointer group flex flex-col justify-between space-y-2 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Edit3 className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono text-amber-300 font-bold">Workspace</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">Study Notes</h3>
            <p className="text-[11px] text-slate-400 leading-tight">Rich Notes & Canvas Drawings</p>
          </div>
        </div>

        <div
          onClick={onOpenFocusMode}
          className="p-4 rounded-3xl bg-slate-900/90 border border-indigo-500/20 hover:border-indigo-500/50 transition-all cursor-pointer group flex flex-col justify-between space-y-2 shadow-lg col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono text-indigo-300 font-bold">Deep Focus</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">Focus Immersion</h3>
            <p className="text-[11px] text-slate-400 leading-tight">Distraction-Free Timer</p>
          </div>
        </div>
      </div>

      {/* Hero Main Focus Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-white/10 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        {/* Glow ambient accent behind timer */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-[100px] pointer-events-none opacity-20"
          style={{ backgroundColor: activeSubject?.color || '#6366f1' }}
        />

        {/* Status Kicker & Subject Badge */}
        <div className="relative z-10 flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isStudying ? 'bg-emerald-400 animate-pulse' : isPaused ? 'bg-amber-400' : 'bg-slate-500'
              }`}
            />
            <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
              {isStudying ? 'FOCUSING' : isPaused ? 'TIMER PAUSED' : 'READY TO STUDY'}
            </span>
          </div>

          {/* Mode Selector Tabs */}
          {!activeTimer && (
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
              {(['stopwatch', 'pomodoro', 'countdown'] as TimerMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => setTimerMode(mode)}
                  className={`px-2.5 py-1 text-xs rounded-lg capitalize transition-colors ${
                    timerMode === mode
                      ? 'bg-indigo-600 text-white font-medium shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Subject Selector */}
        <div className="relative z-10 flex items-center justify-center mb-6">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
            <span className="text-lg">{activeSubject?.icon || '📖'}</span>
            <span className="text-sm font-semibold text-white">
              {activeSubject?.name || 'Select a Subject'}
            </span>
          </div>
        </div>

        {/* Big Digital Timer Display */}
        <div className="relative z-10 text-center my-4">
          <div className="text-[11px] font-medium tracking-widest text-slate-400 uppercase mb-1">
            CURRENT FOCUS TIME
          </div>
          <div className="text-5xl sm:text-7xl font-bold font-mono tracking-tight text-white tabular-nums select-all drop-shadow-sm">
            {formatSecondsToDigital(currentSeconds)}
          </div>
        </div>

        {/* Timer Action Controls */}
        <div className="relative z-10 flex items-center justify-center gap-3 mt-8">
          {!activeTimer ? (
            <button
              onClick={handleStart}
              className="min-h-[50px] px-8 rounded-2xl bg-indigo-500 hover:bg-indigo-400 active:scale-95 text-white font-semibold text-base shadow-lg shadow-indigo-500/25 flex items-center gap-2.5 transition-all"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>START FOCUS</span>
            </button>
          ) : isStudying ? (
            <>
              <button
                onClick={onPauseTimer}
                className="min-h-[50px] px-6 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-semibold text-sm flex items-center gap-2 transition-all active:scale-95"
              >
                <Pause className="w-4 h-4 fill-current" />
                <span>PAUSE</span>
              </button>
              <button
                onClick={() => setFinishModalOpen(true)}
                className="min-h-[50px] px-6 rounded-2xl bg-white/10 hover:bg-white/15 text-white border border-white/10 font-semibold text-sm flex items-center gap-2 transition-all active:scale-95"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>FINISH</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onResumeTimer}
                className="min-h-[50px] px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>RESUME</span>
              </button>
              <button
                onClick={() => setFinishModalOpen(true)}
                className="min-h-[50px] px-6 rounded-2xl bg-white/10 hover:bg-white/15 text-white border border-white/10 font-semibold text-sm flex items-center gap-2 transition-all active:scale-95"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>STOP & SAVE</span>
              </button>
            </>
          )}

          {/* Small Reset Button */}
          <button
            onClick={() => {
              if (onResetTimer) {
                onResetTimer();
              } else {
                setCurrentSeconds(0);
              }
            }}
            title="Reset Timer (00:00:00)"
            className="min-h-[50px] min-w-[50px] rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Fullscreen Immersion Button */}
          <button
            onClick={onOpenFocusMode}
            title="Full Screen Focus"
            className="min-h-[50px] min-w-[50px] rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all"
          >
            <Sparkles className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Quick Stat Pill Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">STREAK</div>
            <div className="text-base font-bold font-mono text-white">
              {stats.streak} DAYS 🔥
            </div>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">SESSIONS TODAY</div>
            <div className="text-base font-bold font-mono text-white">
              {todaySessions.length}
            </div>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">AVERAGE SESSION</div>
            <div className="text-base font-bold font-mono text-white">
              {stats.averageSessionSeconds ? formatSecondsToHuman(stats.averageSessionSeconds) : '0m'}
            </div>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">LONGEST SESSION</div>
            <div className="text-base font-bold font-mono text-white">
              {stats.longestSessionSeconds ? formatSecondsToHuman(stats.longestSessionSeconds) : '0m'}
            </div>
          </div>
        </div>
      </div>

      {/* Subjects Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-tight">SUBJECTS</h2>
            <span className="text-xs text-slate-400 font-mono">({subjects.length})</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Today / Week / Month Toggle */}
            <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/5 text-xs">
              {(['today', 'week', 'month'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTabStats(tab)}
                  className={`px-2.5 py-1 rounded-lg capitalize transition-colors ${
                    activeTabStats === tab
                      ? 'bg-white/10 text-white font-medium'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <button
              onClick={() => onOpenSubjectModal()}
              className="min-h-[36px] px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Subject</span>
            </button>
          </div>
        </div>

        {/* Subject Cards List */}
        <div className="space-y-2">
          {subjects.map(subject => {
            const isCurrent = activeSubject?.id === subject.id;
            const isCurrentlyStudyingThis = activeTimer?.subjectId === subject.id;

            const timeToShow =
              activeTabStats === 'today'
                ? subject.todaySeconds || 0
                : activeTabStats === 'week'
                ? subject.weekSeconds || 0
                : subject.monthSeconds || 0;

            return (
              <div
                key={subject.id}
                onClick={() => onSelectSubject(subject)}
                className={`group relative flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-slate-900/90 border-indigo-500/40 shadow-sm'
                    : 'bg-slate-950/40 hover:bg-slate-900/50 border-white/5'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 shadow-sm"
                    style={{ backgroundColor: `${subject.color}25`, color: subject.color }}
                  >
                    {subject.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white group-hover:text-indigo-200 transition-colors">
                        {subject.name}
                      </span>
                      {isCurrentlyStudyingThis && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Focusing
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 font-mono flex items-center gap-2 flex-wrap">
                      <span>
                        {activeTabStats === 'today'
                          ? 'Today: ' + formatSecondsToDigital(timeToShow)
                          : activeTabStats === 'week'
                          ? 'This Week: ' + formatSecondsToHuman(timeToShow)
                          : 'This Month: ' + formatSecondsToHuman(timeToShow)}
                      </span>
                      {subject.totalSeconds ? (
                        <>
                          <span className="text-slate-600">·</span>
                          <span className="text-slate-400">
                            Total: {formatSecondsToHuman(subject.totalSeconds)}
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Quick Dynamic Subject Action Button */}
                  {isCurrentlyStudyingThis ? (
                    isStudying ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPauseTimer();
                        }}
                        title="Pause timer for this subject"
                        className="min-h-[36px] px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
                      >
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        <span className="hidden xs:inline">Pause</span>
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onResumeTimer();
                        }}
                        title="Resume timer for this subject"
                        className="min-h-[36px] px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span className="hidden xs:inline">Resume</span>
                      </button>
                    )
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSubject(subject);
                        onStartTimer(subject, timerMode);
                      }}
                      title="Start timer for this subject"
                      className="min-h-[36px] px-3 rounded-xl bg-white/5 hover:bg-indigo-600 hover:text-white text-slate-300 text-xs font-medium flex items-center gap-1.5 border border-white/5 transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span className="hidden xs:inline">Study</span>
                    </button>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenSubjectModal(subject);
                    }}
                    title="Edit Subject"
                    className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white tracking-tight">RECENT ACTIVITY</h2>
          <span className="text-xs text-slate-400 font-mono">{todaySessions.length} sessions logged today</span>
        </div>

        {todaySessions.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
            <p className="text-sm text-slate-400">No study sessions recorded yet today.</p>
            <p className="text-xs text-slate-500 mt-1">Select a subject above and press Start Focus!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todaySessions.slice(0, 5).map(session => (
              <div
                key={session.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/40 border border-white/5"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
                    style={{ backgroundColor: `${session.subjectColor}20`, color: session.subjectColor }}
                  >
                    {session.subjectIcon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{session.subjectName}</span>
                      <span className="text-xs text-slate-500">
                        {new Date(session.startTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {' – '}
                        {new Date(session.endTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {session.notes && (
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1 italic">
                        "{session.notes}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {formatSecondsToHuman(session.durationSeconds)}
                  </span>
                  <button
                    onClick={() => onDeleteSession(session.id)}
                    className="text-slate-500 hover:text-rose-400 text-xs p-1"
                    title="Delete session"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Daily Study Log Breakdown */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight uppercase">DAILY STUDY LOG</h2>
            <span className="text-xs text-slate-400">{dateFormatted}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Today Total</span>
            <span className="text-sm font-mono font-extrabold text-emerald-400">
              {formatSecondsToHuman(todayProgressSeconds)}
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-white/5 space-y-3">
          {subjects.map(sub => {
            const subSec = sub.todaySeconds || 0;
            return (
              <div key={sub.id} className="flex items-center justify-between text-xs py-1 border-b border-white/[0.03] last:border-none">
                <div className="flex items-center gap-2">
                  <span>{sub.icon}</span>
                  <span className="font-semibold text-slate-200">{sub.name}</span>
                </div>
                <span className="font-mono text-slate-300 font-bold">
                  {formatSecondsToDigital(subSec)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Finish Session Confirmation Modal */}
      {finishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Save Study Session</h3>
              <button
                onClick={() => setFinishModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
              <span className="text-2xl">{activeSubject?.icon}</span>
              <div className="text-sm font-semibold text-white mt-1">{activeSubject?.name}</div>
              <div className="text-3xl font-bold font-mono text-indigo-400 my-2">
                {formatSecondsToHuman(currentSeconds)}
              </div>
              <div className="text-xs text-slate-400">
                Session will be securely saved to your real database.
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Session Notes (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Chapter 4 problem set revision..."
                value={sessionNotes}
                onChange={e => setSessionNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setFinishModalOpen(false)}
                className="min-h-[44px] rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmFinish}
                className="min-h-[44px] rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all"
              >
                Save & Finish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
