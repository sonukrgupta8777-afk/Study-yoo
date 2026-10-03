import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  UserProfile,
  UserPreferences,
  Subject,
  StudySession,
  ActiveTimerState,
  StudyGroup,
  TimerMode,
  DDayEvent
} from './types/index.js';
import { api, defaultPreferences } from './utils/api.js';
import { Header } from './components/Header.js';
import { Navigation, NavTab } from './components/Navigation.js';
import { HomeDashboard } from './components/HomeDashboard.js';
import { TodoView } from './components/TodoView.js';
import { CalendarView } from './components/CalendarView.js';
import { GroupsView } from './components/GroupsView.js';
import { StudyRoomView } from './components/StudyRoomView.js';
import { StatisticsView } from './components/StatisticsView.js';
import { TimetableView } from './components/TimetableView.js';
import { BooksView } from './components/BooksView.js';
import { PersonalNotesView } from './components/PersonalNotesView.js';
import { ChallengesView } from './components/ChallengesView.js';
import { MoreMenuModal } from './components/MoreMenuModal.js';
import { FocusFullscreen } from './components/FocusFullscreen.js';
import { SubjectModal } from './components/SubjectModal.js';
import { AmbientSoundModal } from './components/AmbientSoundModal.js';
import { AppearanceModal } from './components/AppearanceModal.js';
import { PinLockModal } from './components/PinLockModal.js';
import { EditLogView } from './components/EditLogView.js';
import { PomodoroSettingsModal } from './components/PomodoroSettingsModal.js';
import { BreakModal } from './components/BreakModal.js';
import { FriendsModal } from './components/FriendsModal.js';
import { SettingsModal } from './components/SettingsModal.js';
import { AuthView } from './components/AuthView.js';
import { DDayModal } from './components/DDayModal.js';
import { PlannerView } from './components/PlannerView.js';
import { HeatmapView } from './components/HeatmapView.js';
import { AchievementsModal } from './components/AchievementsModal.js';
import { GlobalSearchModal } from './components/GlobalSearchModal.js';
import { AppBlockerModal } from './components/AppBlockerModal.js';
import { SpotifyPlayerModal } from './components/SpotifyPlayerModal.js';
import { SpotifyMiniPlayer } from './components/SpotifyMiniPlayer.js';
import { ambientSound } from './utils/audio.js';
import { Check } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [activeTimer, setActiveTimer] = useState<ActiveTimerState | null>(null);
  const [todaySessions, setTodaySessions] = useState<StudySession[]>([]);
  const [ddays, setDDays] = useState<DDayEvent[]>([]);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalStudySeconds: 0,
    sessionCount: 0,
    averageSessionSeconds: 0,
    longestSessionSeconds: 0,
    streak: 0,
  });

  // Navigation
  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [activeStudyRoomGroup, setActiveStudyRoomGroup] = useState<StudyGroup | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isAppLocked, setIsAppLocked] = useState(false);

  // Modals
  const [showFocusMode, setShowFocusMode] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [subjectToEdit, setSubjectToEdit] = useState<Subject | null>(null);
  const [showSoundModal, setShowSoundModal] = useState(false);
  const [showAppearanceModal, setShowAppearanceModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinModalMode, setPinModalMode] = useState<'unlock' | 'set'>('unlock');
  const [showEditLog, setShowEditLog] = useState(false);
  const [showPomodoroSettings, setShowPomodoroSettings] = useState(false);
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [breakDurationMinutes, setBreakDurationMinutes] = useState(5);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDDayModal, setShowDDayModal] = useState(false);
  const [showPlannerModal, setShowPlannerModal] = useState(false);
  const [showHeatmapModal, setShowHeatmapModal] = useState(false);
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showAppBlockerModal, setShowAppBlockerModal] = useState(false);
  const [showSpotifyModal, setShowSpotifyModal] = useState(false);
  const [activeSpotifyEmbedId, setActiveSpotifyEmbedId] = useState('0vvXsW14ReMV929pm5nR9r');
  const [activeSpotifyTitle, setActiveSpotifyTitle] = useState('Lofi Beats for Studying');
  const [isSpotifyActive, setIsSpotifyActive] = useState(false);

  const triggerToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 2500);
  };

  // Load User & State
  const loadAppState = useCallback(async () => {
    try {
      const [authRes, subRes, timerRes, sessRes, statsRes, ddayRes] = await Promise.all([
        api.getMe(),
        api.getSubjects(),
        api.getActiveTimer(),
        api.getSessions({ date: new Date().toISOString().split('T')[0] }),
        api.getStatistics('today'),
        api.getDDays(),
      ]);

      setUser(authRes.user);
      if (authRes.user.preferences) {
        setPreferences(authRes.user.preferences);
      }
      setSubjects(subRes.subjects);
      setActiveTimer(timerRes.active);
      setTodaySessions(sessRes.sessions);
      setDDays(ddayRes.ddays);
      setStats({
        totalStudySeconds: statsRes.totalStudySeconds,
        sessionCount: statsRes.sessionCount,
        averageSessionSeconds: statsRes.averageSessionSeconds,
        longestSessionSeconds: statsRes.longestSessionSeconds,
        streak: statsRes.streak,
      });

      if (!selectedSubject && subRes.subjects.length > 0) {
        setSelectedSubject(subRes.subjects[0]);
      }

      if (authRes.user.hasPin && authRes.user.isPinLocked) {
        setIsAppLocked(true);
      }
    } catch (err) {
      console.error('Failed to load initial app state', err);
    }
  }, [selectedSubject]);

  useEffect(() => {
    loadAppState();

    // Listen to network status
    const handleOnline = () => {
      setIsOnline(true);
      api.syncOfflineData().then(res => {
        if (res.syncedSessions > 0) loadAppState();
      });
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Keyboard shortcut: Cmd/Ctrl + K for search
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearchModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Real-Time SSE listener
    const eventSource = new EventSource('/api/realtime/stream');
    eventSource.addEventListener('timer_started', () => loadAppState());
    eventSource.addEventListener('timer_finished', () => {
      loadAppState();
      ambientSound.playTimerBell();
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('keydown', handleKeyDown);
      eventSource.close();
    };
  }, [loadAppState]);

  // Timer Handlers
  const handleStartTimer = async (subject: Subject, mode: TimerMode = 'stopwatch', customDuration?: number) => {
    try {
      const res = await api.startTimer({
        subjectId: subject.id,
        subjectName: subject.name,
        subjectColor: subject.color,
        subjectIcon: subject.icon,
        mode,
        targetDurationSeconds: customDuration,
      });
      setActiveTimer(res.active);
      setSelectedSubject(subject);
      triggerToast('Focus timer started');
    } catch (e) {
      console.error('Failed to start timer', e);
    }
  };

  const handlePauseTimer = async () => {
    try {
      const res = await api.pauseTimer();
      setActiveTimer(res.active);
      triggerToast('Timer paused');
    } catch (e) {
      console.error('Failed to pause timer', e);
    }
  };

  const handleResumeTimer = async () => {
    try {
      const res = await api.resumeTimer();
      setActiveTimer(res.active);
      triggerToast('Timer resumed');
    } catch (e) {
      console.error('Failed to resume timer', e);
    }
  };

  const handleResetTimer = async () => {
    if (activeTimer) {
      if (confirm('Reset timer back to 00:00:00?')) {
        const res = await api.resetTimer();
        setActiveTimer(res.active);
        triggerToast('Timer reset to 00:00:00');
      }
    }
  };

  const handleFinishTimer = async (notes?: string) => {
    try {
      const res = await api.finishTimer({
        notes,
        subjectId: selectedSubject?.id,
        subjectName: selectedSubject?.name,
        subjectColor: selectedSubject?.color,
        subjectIcon: selectedSubject?.icon,
      });
      setActiveTimer(null);
      ambientSound.playTimerBell();
      triggerToast('✓ Study session saved');

      // Confetti celebration
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });

      loadAppState();

      // Prompt break if not skipped
      if (!preferences.breakSettings?.skipBreak) {
        setBreakDurationMinutes(preferences.breakSettings?.shortBreakMinutes || 5);
        setShowBreakModal(true);
      }
    } catch (e) {
      console.error('Failed to finish timer', e);
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (confirm('Delete this saved session?')) {
      await api.deleteSession(id);
      loadAppState();
      triggerToast('Session removed');
    }
  };

  const handleSaveSubject = async (data: { name: string; icon: string; color: string; id?: string }) => {
    if (data.id) {
      await api.updateSubject(data.id, data);
    } else {
      await api.addSubject(data);
    }
    loadAppState();
    triggerToast('✓ Subject saved');
  };

  const handleDeleteSubject = async (id: string) => {
    await api.deleteSubject(id);
    loadAppState();
    triggerToast('Subject deleted');
  };

  const handleUpdatePreferences = async (updates: Partial<UserPreferences>) => {
    const res = await api.updatePreferences(updates);
    setPreferences(res.preferences);
    triggerToast('✓ Preferences updated');
  };

  // More menu action router
  const handleMoreAction = (action: string) => {
    switch (action) {
      case 'challenges':
        setCurrentTab('todo');
        break;
      case 'sound':
        setShowSoundModal(true);
        break;
      case 'appearance':
        setShowAppearanceModal(true);
        break;
      case 'pomodoro':
        setShowPomodoroSettings(true);
        break;
      case 'allowed_apps':
      case 'app_block':
        setShowAppBlockerModal(true);
        break;
      case 'lock':
        setPinModalMode(user?.hasPin ? 'unlock' : 'set');
        setShowPinModal(true);
        break;
      case 'friends':
        setShowFriendsModal(true);
        break;
      case 'edit_log':
        setShowEditLog(true);
        break;
      case 'settings':
        setShowSettingsModal(true);
        break;
      case 'planner':
        setShowPlannerModal(true);
        break;
      case 'heatmap':
        setShowHeatmapModal(true);
        break;
      case 'dday':
        setShowDDayModal(true);
        break;
      case 'achievements':
        setShowAchievementsModal(true);
        break;
      case 'store':
        alert('Zenith Studicon & Theme Store unlocks at 50 study hours!');
        break;
      case 'spotify':
        setShowSpotifyModal(true);
        break;
      case 'offline':
        api.syncOfflineData().then(() => alert('Offline sync complete! All records verified.'));
        break;
      case 'help':
        alert('ZenithStudy Shortcuts: [Cmd/Ctrl+K] Search workspace. Press Study to begin timestamps tracking.');
        break;
    }
  };

  // Determine wallpaper style supporting all 100+ wallpapers & custom URLs
  const getWallpaperStyles = () => {
    // When public link is opened or default wallpaper is active, display aesthetic lo-fi study wallpaper image
    if (!preferences.wallpaper || preferences.wallpaper === 'default') {
      return {
        backgroundImage: `url('https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=2574&auto=format&fit=crop')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      };
    }
    if (preferences.wallpaper === 'bg-black' || preferences.wallpaper === 'solid') {
      return { background: '#000000' };
    }
    if (preferences.wallpaper === 'gradient') {
      return {
        background: 'linear-gradient(135deg, #090a1a 0%, #070913 50%, #15091e 100%)',
      };
    }
    if (preferences.wallpaper.startsWith('http') || preferences.wallpaper.startsWith('/')) {
      return {
        backgroundImage: `url('${preferences.wallpaper}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      };
    }
    return {
      backgroundImage: `url('https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=2574&auto=format&fit=crop')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
    };
  };

  return (
    <div
      className={`min-h-screen text-slate-100 flex flex-col transition-colors selection:bg-indigo-500/30 ${
        preferences.theme === 'oled' ? 'bg-black' : 'bg-[#0b0f17]'
      }`}
      style={getWallpaperStyles()}
    >
      {/* Background Overlay for Readability with Blur & Opacity */}
      <div
        className="fixed inset-0 pointer-events-none transition-all duration-300"
        style={{
          backgroundColor: `rgba(9, 13, 22, ${Math.max(0, 1 - (preferences.wallpaperOpacity ?? 85) / 100)})`,
          backdropFilter: preferences.wallpaperBlur ? `blur(${preferences.wallpaperBlur}px)` : 'none',
        }}
      />

      {/* Floating Auto-Save Toast */}
      {saveToast && (
        <div className="fixed top-16 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900 border border-emerald-500/30 text-xs font-semibold text-emerald-300 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Main App Container */}
      <div className="relative z-10 flex flex-col flex-1 min-h-screen">
        {/* Header */}
        <Header
          user={user}
          preferences={preferences}
          isOnline={isOnline}
          onOpenSoundModal={() => setShowSoundModal(true)}
          onOpenFocusMode={() => setShowFocusMode(true)}
          onOpenProfile={() => setShowSettingsModal(true)}
          onLockApp={() => setIsAppLocked(true)}
          onOpenSearch={() => setShowSearchModal(true)}
          onOpenDDay={() => setShowDDayModal(true)}
          onOpenAppBlocker={() => setShowAppBlockerModal(true)}
          onOpenSpotify={() => setShowSpotifyModal(true)}
          onOpenAppearance={() => setShowAppearanceModal(true)}
        />

        <div className="flex-1 flex w-full">
          {/* Desktop Adaptive Sidebar Navigation */}
          <Navigation
            currentTab={currentTab}
            onTabChange={tab => {
              setActiveStudyRoomGroup(null);
              setCurrentTab(tab);
            }}
          />

          {/* Main Content Area */}
          <main className="flex-1 px-4 sm:px-6 pt-4 pb-20 md:pb-6 overflow-y-auto w-full">
            {activeStudyRoomGroup ? (
              <StudyRoomView
                group={activeStudyRoomGroup}
                currentUser={user}
                activeTimer={activeTimer}
                onBack={() => setActiveStudyRoomGroup(null)}
                onStartFocus={() => {
                  if (selectedSubject) {
                    handleStartTimer(selectedSubject);
                    setShowFocusMode(true);
                  }
                }}
              />
            ) : currentTab === 'home' ? (
              <HomeDashboard
                user={user}
                preferences={preferences}
                subjects={subjects}
                activeTimer={activeTimer}
                todaySessions={todaySessions}
                ddays={ddays}
                stats={stats}
                selectedSubject={selectedSubject}
                onSelectSubject={sub => setSelectedSubject(sub)}
                onStartTimer={handleStartTimer}
                onPauseTimer={handlePauseTimer}
                onResumeTimer={handleResumeTimer}
                onFinishTimer={handleFinishTimer}
                onOpenSubjectModal={sub => {
                  setSubjectToEdit(sub || null);
                  setShowSubjectModal(true);
                }}
                onOpenFocusMode={() => setShowFocusMode(true)}
                onOpenSoundModal={() => setShowSoundModal(true)}
                onOpenDDayModal={() => setShowDDayModal(true)}
                onOpenPlanner={() => setShowPlannerModal(true)}
                onOpenHeatmap={() => setShowHeatmapModal(true)}
                onDeleteSession={handleDeleteSession}
                onResetTimer={handleResetTimer}
                onNavigateToBooks={() => setCurrentTab('books')}
                onNavigateToNotes={() => setCurrentTab('notes')}
                onOpenAppBlocker={() => setShowAppBlockerModal(true)}
                onOpenSpotify={() => setShowSpotifyModal(true)}
                onOpenAppearance={() => setShowAppearanceModal(true)}
              />
            ) : currentTab === 'todo' ? (
              <TodoView user={user} subjects={subjects} />
            ) : currentTab === 'calendar' ? (
              <CalendarView subjects={subjects} />
            ) : currentTab === 'timetable' ? (
              <TimetableView subjects={subjects} />
            ) : currentTab === 'groups' ? (
              <GroupsView
                user={user}
                onOpenStudyRoom={grp => setActiveStudyRoomGroup(grp)}
              />
            ) : currentTab === 'stats' ? (
              <StatisticsView />
            ) : currentTab === 'books' ? (
              <BooksView subjects={subjects} />
            ) : currentTab === 'notes' ? (
              <PersonalNotesView onOpenPdfReader={() => setCurrentTab('books')} />
            ) : (
              <MoreMenuModal
                onSelectAction={handleMoreAction}
                onNavigateTab={tab => {
                  setActiveStudyRoomGroup(null);
                  setCurrentTab(tab);
                }}
              />
            )}
          </main>
        </div>
      </div>

      {/* FULLSCREEN FOCUS IMMERSION */}
      {showFocusMode && (
        <FocusFullscreen
          activeTimer={activeTimer}
          subject={selectedSubject}
          preferences={preferences}
          onPauseTimer={handlePauseTimer}
          onResumeTimer={handleResumeTimer}
          onFinishTimer={notes => {
            handleFinishTimer(notes);
            setShowFocusMode(false);
          }}
          onClose={() => setShowFocusMode(false)}
        />
      )}

      {/* SUBJECT MODAL */}
      <SubjectModal
        isOpen={showSubjectModal}
        subjectToEdit={subjectToEdit}
        onClose={() => {
          setShowSubjectModal(false);
          setSubjectToEdit(null);
        }}
        onSave={handleSaveSubject}
        onDelete={handleDeleteSubject}
      />

      {/* AMBIENT SOUND MODAL */}
      {showSoundModal && (
        <AmbientSoundModal
          preferences={preferences}
          onUpdatePreferences={handleUpdatePreferences}
          onClose={() => setShowSoundModal(false)}
        />
      )}

      {/* APPEARANCE / THEMES / WALLPAPERS */}
      {showAppearanceModal && (
        <AppearanceModal
          preferences={preferences}
          onUpdatePreferences={handleUpdatePreferences}
          onClose={() => setShowAppearanceModal(false)}
        />
      )}

      {/* POMODORO & BREAK RULES */}
      {showPomodoroSettings && (
        <PomodoroSettingsModal
          preferences={preferences}
          onUpdatePreferences={handleUpdatePreferences}
          onClose={() => setShowPomodoroSettings(false)}
        />
      )}

      {/* BREAK COUNTDOWN MODAL */}
      {showBreakModal && (
        <BreakModal
          breakMinutes={breakDurationMinutes}
          onFinishBreak={() => setShowBreakModal(false)}
          onContinueStudy={() => {
            setShowBreakModal(false);
            if (selectedSubject) {
              handleStartTimer(selectedSubject);
            }
          }}
          onClose={() => setShowBreakModal(false)}
        />
      )}

      {/* D-DAY COUNTDOWNS MODAL */}
      {showDDayModal && (
        <DDayModal
          ddays={ddays}
          onRefresh={loadAppState}
          onClose={() => setShowDDayModal(false)}
        />
      )}

      {/* 10-MINUTE DAILY PLANNER MODAL */}
      {showPlannerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-4xl bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Interactive Timeline</span>
              <button
                onClick={() => setShowPlannerModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <PlannerView
              subjects={subjects}
              onStartFocusWithSubject={sub => {
                setShowPlannerModal(false);
                handleStartTimer(sub);
                setShowFocusMode(true);
              }}
            />
          </div>
        </div>
      )}

      {/* YEARLY HEATMAP MODAL */}
      {showHeatmapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-4xl bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Consistency Matrix</span>
              <button
                onClick={() => setShowHeatmapModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <HeatmapView />
          </div>
        </div>
      )}

      {/* ACHIEVEMENTS TROPHY CASE MODAL */}
      {showAchievementsModal && (
        <AchievementsModal onClose={() => setShowAchievementsModal(false)} />
      )}

      {/* GLOBAL OMNISEARCH MODAL */}
      {showSearchModal && (
        <GlobalSearchModal
          onClose={() => setShowSearchModal(false)}
          onSelectSubject={sub => setSelectedSubject(sub)}
          onOpenStudyRoom={grp => setActiveStudyRoomGroup(grp)}
        />
      )}

      {/* APP LOCK PIN MODAL */}
      {(isAppLocked || showPinModal) && (
        <PinLockModal
          mode={pinModalMode}
          onSuccess={() => {
            setIsAppLocked(false);
            setShowPinModal(false);
            loadAppState();
          }}
          onCancel={showPinModal && !isAppLocked ? () => setShowPinModal(false) : undefined}
        />
      )}

      {/* FRIENDS MODAL */}
      {showFriendsModal && (
        <FriendsModal onClose={() => setShowFriendsModal(false)} />
      )}

      {/* APP BLOCKER & DISTRACTION SHIELD MODAL */}
      {showAppBlockerModal && (
        <AppBlockerModal
          onClose={() => setShowAppBlockerModal(false)}
          onConfigChanged={() => {
            loadAppState();
            triggerToast('App Blocker settings updated');
          }}
        />
      )}

      {/* EDIT LOG VIEW */}
      {showEditLog && (
        <EditLogView onClose={() => setShowEditLog(false)} />
      )}

      {/* SETTINGS / PROFILE MODAL */}
      {showSettingsModal && (
        <SettingsModal
          user={user}
          onUpdateUser={u => setUser(u)}
          onClose={() => setShowSettingsModal(false)}
          onLogout={() => {
            setShowSettingsModal(false);
            setShowAuthModal(true);
          }}
        />
      )}

      {/* AUTH VIEW */}
      {showAuthModal && (
        <AuthView
          onSuccess={u => {
            setUser(u);
            setShowAuthModal(false);
            loadAppState();
          }}
          onSkip={() => setShowAuthModal(false)}
        />
      )}

      {/* SPOTIFY STUDY PLAYER MODAL */}
      {showSpotifyModal && (
        <SpotifyPlayerModal
          activeEmbedId={activeSpotifyEmbedId}
          onSelectEmbed={(embedId, title) => {
            setActiveSpotifyEmbedId(embedId);
            setActiveSpotifyTitle(title);
            setIsSpotifyActive(true);
            triggerToast(`Playing ${title}`);
          }}
          onClose={() => setShowSpotifyModal(false)}
        />
      )}

      {/* FLOATING SPOTIFY MINI-PLAYER DOCK (PERSISTENT BACKGROUND AUDIO HOST) */}
      {isSpotifyActive && (
        <div style={{ display: showSpotifyModal ? 'none' : 'block' }}>
          <SpotifyMiniPlayer
            embedId={activeSpotifyEmbedId}
            title={activeSpotifyTitle}
            onExpand={() => setShowSpotifyModal(true)}
            onClose={() => setIsSpotifyActive(false)}
          />
        </div>
      )}
    </div>
  );
}
