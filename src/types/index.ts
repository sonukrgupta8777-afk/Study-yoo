export type TimerMode = 'stopwatch' | 'countdown' | 'pomodoro' | 'custom';
export type UserStatus = 'studying' | 'break' | 'offline';
export type AccentColor = 'indigo' | 'purple' | 'emerald' | 'blue' | 'rose' | 'amber' | 'cyan';
export type AppTheme = 'dark' | 'oled' | 'light';

export interface DDayEvent {
  id: string;
  userId: string;
  title: string;
  targetDate: string; // YYYY-MM-DD
  category: string;
  isPinned: boolean;
  createdAt: string;
}

export interface PlannerBlock {
  id: string;
  userId: string;
  date: string;
  timeSlot: string; // "06:00", "06:10", etc.
  subjectId?: string;
  subjectName?: string;
  subjectColor?: string;
  type: 'actual' | 'planned';
  notes?: string;
}

export interface UserPrivacySettings {
  showOnlineStatus: boolean;
  showStudyStatus: boolean;
  showCurrentSubject: boolean;
  showStudyDuration: boolean;
  showStatistics: boolean;
  showProfile: boolean;
  allowGroupInvitations: boolean;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar: string;
  dailyGoalMinutes: number;
  weeklyGoalMinutes: number;
  monthlyGoalMinutes: number;
  minStreakMinutes: number;
  hasPin: boolean;
  isPinLocked: boolean;
  createdAt: string;
  privacySettings: UserPrivacySettings;
}

export interface Subject {
  id: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  order: number;
  isArchived: boolean;
  createdAt: string;
  todaySeconds?: number;
  weekSeconds?: number;
  monthSeconds?: number;
  totalSeconds?: number;
  dailyGoalMinutes?: number;
}

export interface StudySession {
  id: string;
  userId: string;
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  subjectIcon: string;
  startTimestamp: number;
  endTimestamp: number;
  durationSeconds: number;
  date: string; // YYYY-MM-DD
  timerType: TimerMode;
  notes: string;
  sessionStatus: 'completed' | 'cancelled';
  createdAt: string;
}

export interface ActiveTimerState {
  userId: string;
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  subjectIcon: string;
  startTimestamp: number;
  lastHeartbeat: number;
  mode: TimerMode;
  isPaused: boolean;
  accumulatedSeconds: number;
  targetDurationSeconds?: number;
}

export interface StudyGroup {
  id: string;
  name: string;
  description: string;
  icon: string;
  isPrivate: boolean;
  hasPassword?: boolean;
  ownerId: string;
  ownerName: string;
  maxMembers: number;
  memberCount: number;
  createdAt: string;
}

export interface GroupMemberLive {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  role: 'owner' | 'admin' | 'member';
  status: UserStatus;
  currentSubject?: string;
  currentSubjectColor?: string;
  currentSubjectIcon?: string;
  currentSessionDuration: number;
  todayTotalDuration: number;
  lastActive: string;
}

export interface GroupChatMessage {
  id: string;
  groupId: string;
  userId: string;
  username: string;
  avatar: string;
  text: string;
  type: 'chat' | 'system' | 'study_start' | 'study_finish';
  createdAt: string;
}

export interface TaskItem {
  id: string;
  userId: string;
  subjectId?: string;
  subjectName?: string;
  title: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  estimatedMinutes: number;
  notes: string;
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
}

export interface TimetableBlock {
  id: string;
  userId: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  subjectId?: string;
  subjectName: string;
  subjectColor: string;
  notes?: string;
}

export interface BookItem {
  id: string;
  userId: string;
  title: string;
  author: string;
  subjectId?: string;
  totalPages: number;
  currentPage: number;
  status: 'not_started' | 'reading' | 'completed';
  notes: string;
  coverUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type NCERTClass = 'class_11' | 'class_12' | 'class_9' | 'class_10' | 'exemplar';
export type NCERTSubject = 'biology' | 'physics' | 'chemistry' | 'mathematics' | 'other';
export type NCERTLanguage = 'english' | 'hindi';

export interface NCERTChapter {
  chapterNumber: number;
  title: string;
  titleHindi?: string;
  pageStart?: number;
  pageEnd?: number;
  pdfFileName?: string;
  officialPdfUrl: string;
}

export interface NCERTBook {
  id: string;
  title: string;
  titleHindi?: string;
  classLevel: NCERTClass;
  subject: NCERTSubject;
  partNumber?: 1 | 2;
  language: NCERTLanguage;
  coverImage?: string;
  officialSourceUrl: string;
  officialDownloadUrl?: string;
  code: string;
  editionYear?: string;
  totalPages: number;
  chapters: NCERTChapter[];
  description: string;
  isAvailable: boolean;
}

export interface UserBookProgress {
  bookId: string;
  userId: string;
  currentPage: number;
  currentChapter?: number;
  totalPages: number;
  bookmarkedPages: number[];
  isBookmarked: boolean;
  lastReadAt: string;
}

export interface ChallengeItem {
  id: string;
  title: string;
  description: string;
  targetHours: number;
  startDate: string;
  endDate: string;
  creatorId: string;
  isGroup: boolean;
  groupId?: string;
  participants: string[];
  totalSecondsStudied: number;
  isCompleted: boolean;
  createdAt: string;
}

export interface EditLogItem {
  id: string;
  userId: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface AchievementItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  requirementType: 'hours' | 'streak' | 'sessions' | 'books';
  targetValue: number;
  unlocked: boolean;
  unlockedAt?: string;
  currentValue: number;
}

export interface BreakSettings {
  shortBreakMinutes: number;
  longBreakMinutes: number;
  pomodoroFocusMinutes: number;
  autoStartBreak: boolean;
  skipBreak: boolean;
}

export interface UserPreferences {
  theme: AppTheme;
  accentColor: AccentColor;
  wallpaper: string;
  customWallpaperUrl?: string;
  wallpaperBlur: number;
  wallpaperOpacity: number;
  cardStyle: 'glass' | 'solid';
  timerStyle: 'digital' | 'ring' | 'minimal';
  breakSettings: BreakSettings;
  soundVolume: number;
  activeSound: 'rain' | 'forest' | 'cafe' | 'whitenoise' | 'ambient' | 'none';
  notifications: {
    studyReminder: boolean;
    taskReminder: boolean;
    timerCompleted: boolean;
    breakCompleted: boolean;
    friendRequest: boolean;
    groupStudyStarted: boolean;
    dailyGoalReminder: boolean;
  };
  allowedApps: {
    enabled: boolean;
    apps: string[];
    strictFocusWarning: boolean;
  };
}

export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink' | 'orange' | 'purple' | 'cyan';

export interface NoteHighlight {
  id: string;
  text: string;
  color: HighlightColor;
  note?: string;
  createdAt: string;
}

export interface UploadedNote {
  id: string;
  userId: string;
  title: string;
  subjectId?: string;
  subjectName?: string;
  subjectColor?: string;
  bookId?: string;
  bookTitle?: string;
  chapterNumber?: number;
  chapterTitle?: string;
  content: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  highlights: NoteHighlight[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BlockedApp {
  id: string;
  name: string;
  category: 'social' | 'video' | 'games' | 'messaging' | 'custom';
  icon: string;
  isBlocked: boolean;
  packageOrDomain?: string;
}

export interface AppBlockConfig {
  enabled: boolean;
  strictFocusLock: boolean;
  blockBrowsers: boolean;
  allowedApps: string[];
  blockedApps: BlockedApp[];
  maxDailyDistractions: number;
  soundAlertOnLeave: boolean;
  pinRequiredToUnlock: boolean;
}

export type QuestionType =
  | 'mcq'
  | 'multiple_choice'
  | 'true_false'
  | 'assertion_reason'
  | 'numerical'
  | 'short_answer';

export interface QuestionOption {
  id: string; // 'A' | 'B' | 'C' | 'D'
  text: string;
}

export interface QuestionItem {
  id: string;
  questionNumber: number;
  text: string;
  type: QuestionType;
  options?: QuestionOption[];
  correctOptionId?: string | string[];
  explanation?: string;
  imageUrl?: string;
  diagramDescription?: string;
  subject?: string;
  topic?: string;
  marks?: number;
}

export interface QuestionTest {
  id: string;
  userId: string;
  title: string;
  fileName: string;
  fileSize?: number;
  fileDataUrl?: string;
  subjectClass?: string;
  subjectName?: string;
  totalQuestions: number;
  questions: QuestionItem[];
  hasAnswerKey: boolean;
  userAnswers: Record<string, string | string[]>;
  markedQuestions: string[];
  timeSpentSeconds: number;
  timeLimitMinutes?: number;
  status: 'in_progress' | 'completed';
  score?: number;
  accuracy?: number;
  correctCount?: number;
  incorrectCount?: number;
  unansweredCount?: number;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  warningNote?: string;
}

export type NEETSubject = 'biology' | 'physics' | 'chemistry';
export type MCQDifficulty = 'easy' | 'medium' | 'hard';

export interface NEETQuestion {
  id: string;
  subject: NEETSubject;
  subCategory?: string; // e.g. 'Botany', 'Zoology', 'Physical', 'Organic', 'Inorganic', 'Mechanics', 'Optics'
  classLevel: 'class_11' | 'class_12';
  chapter: string;
  topic: string;
  difficulty: MCQDifficulty;
  questionText: string;
  options: QuestionOption[];
  correctOptionId: string;
  explanation: string;
  isPYQ?: boolean;
  pyqYear?: number;
  diagramDescription?: string;
  imageUrl?: string;
  source?: 'neet_official' | 'pyq' | 'ncert_exemplar' | 'pdf_extracted' | 'custom';
  bookmarked?: boolean;
  status?: 'unattempted' | 'correct' | 'incorrect';
  lastAttemptedOption?: string;
  notes?: string;
  reported?: boolean;
  createdAt?: string;
}

export interface PdfAnnotationItem {
  id: string;
  pdfId: string;
  pageNumber: number;
  type: 'highlight' | 'underline' | 'pen' | 'textbox' | 'sticky';
  color: string;
  text?: string;
  rect?: { x: number; y: number; width: number; height: number };
  points?: { x: number; y: number }[];
  strokeWidth?: number;
  createdAt: string;
}

export interface PersonalStudyNote {
  id: string;
  userId: string;
  title: string;
  content: string;
  subject: 'biology' | 'physics' | 'chemistry' | 'general';
  chapter?: string;
  tags: string[];
  isPinned: boolean;
  isCompleted: boolean;
  imageUrl?: string;
  handwrittenDataUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentPracticeGoal {
  dailyTargetMcqs: number;
  dailyTargetMinutes: number;
  todayCompletedMcqs: number;
  todayCompletedMinutes: number;
}

// ==========================================
// SPOTIFY INTEGRATION TYPES
// ==========================================
export interface SpotifyPlaylistPreset {
  id: string;
  title: string;
  description: string;
  type: 'playlist' | 'album' | 'track';
  embedId: string; // Spotify 22-character ID
  category: 'lofi' | 'focus' | 'classical' | 'ambient' | 'jazz' | 'synthwave';
  icon: string;
  color: string;
}

export interface SpotifyUserProfile {
  id: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
  product?: string;
  uri?: string;
  externalUrl?: string;
}

export interface SpotifyStatusResponse {
  connected: boolean;
  configured: boolean;
  profile?: SpotifyUserProfile;
  redirectUri: string;
  clientIdPreview?: string;
}

export interface SpotifyUserPlaylist {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  tracksCount: number;
  uri: string;
  externalUrl?: string;
  ownerName?: string;
}

// ==========================================
// YOUTUBE INTEGRATION TYPES
// ==========================================
export interface YouTubePresetItem {
  id: string;
  title: string;
  videoId: string;
  channel: string;
  category: 'lofi' | 'pomodoro' | 'piano' | 'ambient' | 'lecture';
  thumbnailUrl: string;
  isLive?: boolean;
}


