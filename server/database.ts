import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  UserProfile,
  Subject,
  StudySession,
  ActiveTimerState,
  StudyGroup,
  GroupChatMessage,
  TaskItem,
  TimetableBlock,
  BookItem,
  ChallengeItem,
  EditLogItem,
  UserPreferences,
  GroupMemberLive,
  DDayEvent,
  PlannerBlock,
  AchievementItem,
  NCERTBook,
  UserBookProgress,
  UploadedNote,
  NoteHighlight,
  AppBlockConfig,
  BlockedApp,
  HighlightColor,
  QuestionTest,
  QuestionItem,
  NEETQuestion,
  PdfAnnotationItem,
  PersonalStudyNote,
  StudentPracticeGoal
} from '../src/types/index.js';
import { INITIAL_NCERT_BOOKS } from './ncertData.js';

const INITIAL_SAMPLE_QUESTION_TESTS: QuestionTest[] = [];
const generateNeetQuestionBank = (_count = 0): NEETQuestion[] => [];

export const defaultAppBlockConfig: AppBlockConfig = {
  enabled: true,
  strictFocusLock: false,
  blockBrowsers: false,
  allowedApps: ['ZenithStudy', 'NCERT Reader', 'Calculator', 'Formulas & Dictionary', 'Notes'],
  blockedApps: [
    { id: 'app_1', name: 'Instagram', category: 'social', icon: '📸', isBlocked: true, packageOrDomain: 'instagram.com' },
    { id: 'app_2', name: 'YouTube', category: 'video', icon: '▶️', isBlocked: true, packageOrDomain: 'youtube.com' },
    { id: 'app_3', name: 'TikTok', category: 'video', icon: '🎵', isBlocked: true, packageOrDomain: 'tiktok.com' },
    { id: 'app_4', name: 'Reddit', category: 'social', icon: '🤖', isBlocked: true, packageOrDomain: 'reddit.com' },
    { id: 'app_5', name: 'X / Twitter', category: 'social', icon: '🐦', isBlocked: true, packageOrDomain: 'x.com' },
    { id: 'app_6', name: 'Netflix', category: 'video', icon: '🍿', isBlocked: true, packageOrDomain: 'netflix.com' },
    { id: 'app_7', name: 'Discord', category: 'messaging', icon: '💬', isBlocked: true, packageOrDomain: 'discord.com' },
    { id: 'app_8', name: 'Mobile Legends / BGMI', category: 'games', icon: '🎮', isBlocked: true },
    { id: 'app_9', name: 'WhatsApp Web', category: 'messaging', icon: '🟢', isBlocked: false, packageOrDomain: 'web.whatsapp.com' },
    { id: 'app_10', name: 'Telegram', category: 'messaging', icon: '✈️', isBlocked: false, packageOrDomain: 'web.telegram.org' },
  ],
  maxDailyDistractions: 3,
  soundAlertOnLeave: true,
  pinRequiredToUnlock: false,
};

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'zenith_study.json');

export interface UserAccount extends UserProfile {
  passwordHash: string;
  pinHash?: string;
  preferences: UserPreferences;
}

export interface GroupMembership {
  id: string;
  groupId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
}

export interface FriendRelation {
  id: string;
  userId: string;
  friendId: string;
  status: 'pending' | 'accepted';
  requestedBy: string;
  createdAt: string;
}

export interface SpotifyAuthRecord {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  profile?: {
    id: string;
    displayName: string;
    email?: string;
    avatarUrl?: string;
    product?: string;
    uri?: string;
  };
}

export interface DatabaseSchema {
  users: UserAccount[];
  subjects: Subject[];
  studySessions: StudySession[];
  activeTimers: Record<string, ActiveTimerState>;
  groups: StudyGroup[];
  groupMembers: GroupMembership[];
  groupMessages: GroupChatMessage[];
  tasks: TaskItem[];
  timetable: TimetableBlock[];
  books: BookItem[];
  challenges: ChallengeItem[];
  friends: FriendRelation[];
  editLogs: EditLogItem[];
  dDayEvents?: DDayEvent[];
  plannerBlocks?: PlannerBlock[];
  ncertBooks?: NCERTBook[];
  userBookProgress?: UserBookProgress[];
  uploadedNotes?: UploadedNote[];
  appBlockConfig?: AppBlockConfig;
  questionTests?: QuestionTest[];
  neetQuestions?: NEETQuestion[];
  pdfAnnotations?: PdfAnnotationItem[];
  personalNotes?: PersonalStudyNote[];
  practiceGoals?: Record<string, StudentPracticeGoal>;
  spotifyAuth?: Record<string, SpotifyAuthRecord>;
  spotifyConfig?: { clientId?: string; clientSecret?: string };
}

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_zenith_salt_2026').digest('hex');
}

export const DEFAULT_AESTHETIC_WALLPAPER = 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=2574&auto=format&fit=crop';

export const defaultPreferences: UserPreferences = {
  theme: 'dark',
  accentColor: 'indigo',
  wallpaper: DEFAULT_AESTHETIC_WALLPAPER,
  wallpaperBlur: 1,
  wallpaperOpacity: 78,
  cardStyle: 'glass',
  timerStyle: 'digital',
  breakSettings: {
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    pomodoroFocusMinutes: 25,
    autoStartBreak: false,
    skipBreak: false,
  },
  soundVolume: 70,
  activeSound: 'none',
  notifications: {
    studyReminder: true,
    taskReminder: true,
    timerCompleted: true,
    breakCompleted: true,
    friendRequest: true,
    groupStudyStarted: true,
    dailyGoalReminder: true,
  },
  allowedApps: {
    enabled: false,
    apps: ['Calculator', 'Dictionary', 'Notion', 'Anki'],
    strictFocusWarning: true,
  },
};

class Database {
  private data: DatabaseSchema;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.ensureDir();
    this.data = this.load();
    this.seedIfEmpty();
  }

  private ensureDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!parsed.ncertBooks || parsed.ncertBooks.length === 0) {
          parsed.ncertBooks = INITIAL_NCERT_BOOKS;
        }
        if (!parsed.userBookProgress) {
          parsed.userBookProgress = [];
        }
        if (!parsed.uploadedNotes) {
          parsed.uploadedNotes = [];
        }
        if (!parsed.appBlockConfig) {
          parsed.appBlockConfig = defaultAppBlockConfig;
        }
        if (!parsed.questionTests || parsed.questionTests.length === 0) {
          parsed.questionTests = INITIAL_SAMPLE_QUESTION_TESTS;
        }
        return parsed;
      }
    } catch (e) {
      console.error('Error loading db file, initializing fresh:', e);
    }
    return {
      users: [],
      subjects: [],
      studySessions: [],
      activeTimers: {},
      groups: [],
      groupMembers: [],
      groupMessages: [],
      tasks: [],
      timetable: [],
      books: [],
      challenges: [],
      friends: [],
      editLogs: [],
      ncertBooks: INITIAL_NCERT_BOOKS,
      userBookProgress: [],
      uploadedNotes: [],
      appBlockConfig: defaultAppBlockConfig,
      questionTests: INITIAL_SAMPLE_QUESTION_TESTS,
    };
  }

  public save() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      try {
        const tempPath = DB_FILE + '.tmp';
        fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
        fs.renameSync(tempPath, DB_FILE);
      } catch (err) {
        console.error('Failed to save database atomically:', err);
      }
    }, 50);
  }

  private seedIfEmpty() {
    if (this.data.users.length === 0) {
      const now = new Date().toISOString();
      const todayStr = now.split('T')[0];

      // Seed Primary User (Monu / sonukrgupta8777@gmail.com)
      const primaryUser: UserAccount = {
        id: 'user_monu_1',
        username: 'Monu',
        email: 'sonukrgupta8777@gmail.com',
        passwordHash: hashPassword('zenith123'),
        avatar: '👨‍🎓',
        dailyGoalMinutes: 360, // 6 hours
        weeklyGoalMinutes: 2400,
        monthlyGoalMinutes: 9600,
        minStreakMinutes: 30,
        hasPin: false,
        isPinLocked: false,
        createdAt: now,
        privacySettings: {
          showOnlineStatus: true,
          showStudyStatus: true,
          showCurrentSubject: true,
          showStudyDuration: true,
          showStatistics: true,
          showProfile: true,
          allowGroupInvitations: true,
        },
        preferences: defaultPreferences,
      };

      // Seed Peers
      const peerAnkit: UserAccount = {
        id: 'user_ankit_2',
        username: 'Ankit_420',
        email: 'ankit@example.com',
        passwordHash: hashPassword('pass123'),
        avatar: '⚡',
        dailyGoalMinutes: 300,
        weeklyGoalMinutes: 1800,
        monthlyGoalMinutes: 7200,
        minStreakMinutes: 30,
        hasPin: false,
        isPinLocked: false,
        createdAt: now,
        privacySettings: {
          showOnlineStatus: true,
          showStudyStatus: true,
          showCurrentSubject: true,
          showStudyDuration: true,
          showStatistics: true,
          showProfile: true,
          allowGroupInvitations: true,
        },
        preferences: defaultPreferences,
      };

      const peerSonu: UserAccount = {
        id: 'user_sonu_3',
        username: 'Sonu',
        email: 'sonu.peer@example.com',
        passwordHash: hashPassword('pass123'),
        avatar: '🌱',
        dailyGoalMinutes: 360,
        weeklyGoalMinutes: 2000,
        monthlyGoalMinutes: 8000,
        minStreakMinutes: 30,
        hasPin: false,
        isPinLocked: false,
        createdAt: now,
        privacySettings: {
          showOnlineStatus: true,
          showStudyStatus: true,
          showCurrentSubject: true,
          showStudyDuration: true,
          showStatistics: true,
          showProfile: true,
          allowGroupInvitations: true,
        },
        preferences: defaultPreferences,
      };

      const peerRittik: UserAccount = {
        id: 'user_rittik_4',
        username: 'Rittik',
        email: 'rittik@example.com',
        passwordHash: hashPassword('pass123'),
        avatar: '🔬',
        dailyGoalMinutes: 240,
        weeklyGoalMinutes: 1500,
        monthlyGoalMinutes: 6000,
        minStreakMinutes: 30,
        hasPin: false,
        isPinLocked: false,
        createdAt: now,
        privacySettings: {
          showOnlineStatus: true,
          showStudyStatus: true,
          showCurrentSubject: true,
          showStudyDuration: true,
          showStatistics: true,
          showProfile: true,
          allowGroupInvitations: true,
        },
        preferences: defaultPreferences,
      };

      this.data.users.push(primaryUser, peerAnkit, peerSonu, peerRittik);

      // Seed Default Subjects for Monu
      const initialSubjects: Subject[] = [
        { id: 'sub_1', userId: primaryUser.id, name: 'Zoology', icon: '🦴', color: '#10b981', order: 1, isArchived: false, createdAt: now },
        { id: 'sub_2', userId: primaryUser.id, name: 'Botany', icon: '🌱', color: '#14b8a6', order: 2, isArchived: false, createdAt: now },
        { id: 'sub_3', userId: primaryUser.id, name: 'Chemistry', icon: '🧪', color: '#6366f1', order: 3, isArchived: false, createdAt: now },
        { id: 'sub_4', userId: primaryUser.id, name: 'Physics', icon: '🧮', color: '#f59e0b', order: 4, isArchived: false, createdAt: now },
        { id: 'sub_5', userId: primaryUser.id, name: 'Self Study', icon: '👩‍🎓', color: '#ec4899', order: 5, isArchived: false, createdAt: now },
      ];
      this.data.subjects.push(...initialSubjects);

      // Seed Previous Study Sessions for realistic stats (streaks & subjects)
      const baseTime = Date.now() - 3600 * 1000 * 4;
      this.data.studySessions.push(
        {
          id: 'sess_1',
          userId: primaryUser.id,
          subjectId: 'sub_1',
          subjectName: 'Zoology',
          subjectColor: '#10b981',
          subjectIcon: '🦴',
          startTimestamp: baseTime,
          endTimestamp: baseTime + 2700 * 1000,
          durationSeconds: 2700, // 45 min
          date: todayStr,
          timerType: 'stopwatch',
          notes: 'Completed Animal Kingdom revision notes',
          sessionStatus: 'completed',
          createdAt: now,
        },
        {
          id: 'sess_2',
          userId: primaryUser.id,
          subjectId: 'sub_3',
          subjectName: 'Chemistry',
          subjectColor: '#6366f1',
          subjectIcon: '🧪',
          startTimestamp: baseTime + 3600 * 1000,
          endTimestamp: baseTime + 3600 * 1000 + 3600 * 1000,
          durationSeconds: 3600, // 60 min
          date: todayStr,
          timerType: 'pomodoro',
          notes: 'Chemical Kinetics numericals',
          sessionStatus: 'completed',
          createdAt: now,
        },
        {
          id: 'sess_3',
          userId: primaryUser.id,
          subjectId: 'sub_2',
          subjectName: 'Botany',
          subjectColor: '#14b8a6',
          subjectIcon: '🌱',
          startTimestamp: baseTime + 8000 * 1000,
          endTimestamp: baseTime + 8000 * 1000 + 4200 * 1000,
          durationSeconds: 4200, // 1h 10m
          date: todayStr,
          timerType: 'stopwatch',
          notes: 'Plant Physiology chloroplast diagrams',
          sessionStatus: 'completed',
          createdAt: now,
        },
        // Sessions for yesterday & earlier to establish a streak
        {
          id: 'sess_prev_1',
          userId: primaryUser.id,
          subjectId: 'sub_4',
          subjectName: 'Physics',
          subjectColor: '#f59e0b',
          subjectIcon: '🧮',
          startTimestamp: Date.now() - 86400 * 1000 * 1 - 7200 * 1000,
          endTimestamp: Date.now() - 86400 * 1000 * 1,
          durationSeconds: 7200, // 2 hours
          date: new Date(Date.now() - 86400 * 1000 * 1).toISOString().split('T')[0],
          timerType: 'stopwatch',
          notes: 'Rotational Dynamics',
          sessionStatus: 'completed',
          createdAt: now,
        },
        {
          id: 'sess_prev_2',
          userId: primaryUser.id,
          subjectId: 'sub_3',
          subjectName: 'Chemistry',
          subjectColor: '#6366f1',
          subjectIcon: '🧪',
          startTimestamp: Date.now() - 86400 * 1000 * 2 - 5400 * 1000,
          endTimestamp: Date.now() - 86400 * 1000 * 2,
          durationSeconds: 5400,
          date: new Date(Date.now() - 86400 * 1000 * 2).toISOString().split('T')[0],
          timerType: 'pomodoro',
          notes: 'Organic mechanisms',
          sessionStatus: 'completed',
          createdAt: now,
        }
      );

      // Peer Sessions
      this.data.studySessions.push(
        {
          id: 'sess_peer_1',
          userId: peerAnkit.id,
          subjectId: 'sub_ankit_chem',
          subjectName: 'Organic Chemistry',
          subjectColor: '#6366f1',
          subjectIcon: '🧪',
          startTimestamp: Date.now() - 4365 * 1000,
          endTimestamp: Date.now(),
          durationSeconds: 4365, // 01:12:45
          date: todayStr,
          timerType: 'stopwatch',
          notes: 'Reaction mechanisms batch 1',
          sessionStatus: 'completed',
          createdAt: now,
        }
      );

      // Seed Group: "Padhe Le Yrr" (4 / 50 members)
      const padheGroup: StudyGroup = {
        id: 'grp_padhe_le_yrr',
        name: 'Padhe Le Yrr',
        description: 'Daily 6+ hours target! NEET & JEE hardcore focus room. No slacking!',
        icon: '🔥',
        isPrivate: false,
        ownerId: primaryUser.id,
        ownerName: 'Monu',
        maxMembers: 50,
        memberCount: 4,
        createdAt: now,
      };

      const groupFocusClub: StudyGroup = {
        id: 'grp_midnight_club',
        name: 'Midnight Study Society',
        description: 'Night owls studying from 10 PM to 4 AM. Quiet library vibe.',
        icon: '🌙',
        isPrivate: false,
        ownerId: peerAnkit.id,
        ownerName: 'Ankit_420',
        maxMembers: 30,
        memberCount: 3,
        createdAt: now,
      };

      this.data.groups.push(padheGroup, groupFocusClub);

      this.data.groupMembers.push(
        { id: 'gm_1', groupId: padheGroup.id, userId: primaryUser.id, role: 'owner', joinedAt: now },
        { id: 'gm_2', groupId: padheGroup.id, userId: peerAnkit.id, role: 'member', joinedAt: now },
        { id: 'gm_3', groupId: padheGroup.id, userId: peerSonu.id, role: 'member', joinedAt: now },
        { id: 'gm_4', groupId: padheGroup.id, userId: peerRittik.id, role: 'member', joinedAt: now },
        { id: 'gm_5', groupId: groupFocusClub.id, userId: peerAnkit.id, role: 'owner', joinedAt: now },
        { id: 'gm_6', groupId: groupFocusClub.id, userId: primaryUser.id, role: 'member', joinedAt: now },
        { id: 'gm_7', groupId: groupFocusClub.id, userId: peerRittik.id, role: 'member', joinedAt: now }
      );

      // Seed Ankit as currently studying in activeTimers so the room shows real live status
      this.data.activeTimers[peerAnkit.id] = {
        userId: peerAnkit.id,
        subjectId: 'sub_ankit_chem',
        subjectName: 'Chemistry',
        subjectColor: '#6366f1',
        subjectIcon: '🧪',
        startTimestamp: Date.now() - 4365 * 1000, // 01:12:45 ago
        lastHeartbeat: Date.now(),
        mode: 'stopwatch',
        isPaused: false,
        accumulatedSeconds: 4365,
      };

      // Seed Group Messages
      this.data.groupMessages.push(
        {
          id: 'msg_1',
          groupId: padheGroup.id,
          userId: peerAnkit.id,
          username: 'Ankit_420',
          avatar: '⚡',
          text: 'Starting Chemistry 120-minute sprint now!',
          type: 'chat',
          createdAt: new Date(Date.now() - 4400 * 1000).toISOString(),
        },
        {
          id: 'msg_2',
          groupId: padheGroup.id,
          userId: peerAnkit.id,
          username: 'Ankit_420',
          avatar: '⚡',
          text: 'Ankit started studying Chemistry',
          type: 'study_start',
          createdAt: new Date(Date.now() - 4365 * 1000).toISOString(),
        },
        {
          id: 'msg_3',
          groupId: padheGroup.id,
          userId: peerSonu.id,
          username: 'Sonu',
          avatar: '🌱',
          text: 'Taking a 15-minute dinner break, will be back for Botany!',
          type: 'chat',
          createdAt: new Date(Date.now() - 1800 * 1000).toISOString(),
        }
      );

      // Seed Tasks
      this.data.tasks.push(
        {
          id: 'task_1',
          userId: primaryUser.id,
          subjectId: 'sub_1',
          subjectName: 'Zoology',
          title: 'Complete Human Physiology',
          dueDate: todayStr,
          priority: 'high',
          estimatedMinutes: 60,
          notes: 'Solve chapter end MCQs and summary questions',
          isCompleted: false,
          createdAt: now,
        },
        {
          id: 'task_2',
          userId: primaryUser.id,
          subjectId: 'sub_3',
          subjectName: 'Chemistry',
          title: 'Electrochemistry Formula Sheet',
          dueDate: todayStr,
          priority: 'medium',
          estimatedMinutes: 45,
          notes: 'Nernst equation & Faraday laws quick revision',
          isCompleted: true,
          completedAt: new Date(Date.now() - 7200 * 1000).toISOString(),
          createdAt: now,
        },
        {
          id: 'task_3',
          userId: primaryUser.id,
          subjectId: 'sub_4',
          subjectName: 'Physics',
          title: 'Optics Problem Set 3',
          dueDate: new Date(Date.now() + 86400 * 1000).toISOString().split('T')[0],
          priority: 'high',
          estimatedMinutes: 90,
          notes: 'Lens formula & ray diagrams',
          isCompleted: false,
          createdAt: now,
        }
      );

      // Seed Books
      this.data.books.push(
        {
          id: 'book_1',
          userId: primaryUser.id,
          title: 'NCERT Biology Class 12',
          author: 'NCERT Editorial Board',
          subjectId: 'sub_1',
          totalPages: 320,
          currentPage: 215,
          status: 'reading',
          notes: 'High yield for competitive exams. Highlight diagrams.',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'book_2',
          userId: primaryUser.id,
          title: 'Concepts of Physics (Vol 1)',
          author: 'H.C. Verma',
          subjectId: 'sub_4',
          totalPages: 460,
          currentPage: 180,
          status: 'reading',
          notes: 'Focus on mechanics & work-energy theorem',
          createdAt: now,
          updatedAt: now,
        }
      );

      // Seed Timetable Blocks
      this.data.timetable.push(
        { id: 'tt_1', userId: primaryUser.id, dayOfWeek: 1, startTime: '06:00', endTime: '07:00', subjectId: 'sub_4', subjectName: 'Physics', subjectColor: '#f59e0b', notes: 'Morning formulas' },
        { id: 'tt_2', userId: primaryUser.id, dayOfWeek: 1, startTime: '17:00', endTime: '18:00', subjectId: 'sub_3', subjectName: 'Chemistry', subjectColor: '#6366f1', notes: 'Inorganic revision' },
        { id: 'tt_3', userId: primaryUser.id, dayOfWeek: 1, startTime: '19:00', endTime: '20:00', subjectId: 'sub_1', subjectName: 'Zoology', subjectColor: '#10b981', notes: 'Human physiology' },
        { id: 'tt_4', userId: primaryUser.id, dayOfWeek: 2, startTime: '06:00', endTime: '08:00', subjectId: 'sub_2', subjectName: 'Botany', subjectColor: '#14b8a6', notes: 'Genetics' },
        { id: 'tt_5', userId: primaryUser.id, dayOfWeek: 3, startTime: '18:00', endTime: '20:00', subjectId: 'sub_3', subjectName: 'Chemistry', subjectColor: '#6366f1', notes: 'Organic mock' },
        { id: 'tt_6', userId: primaryUser.id, dayOfWeek: 4, startTime: '06:00', endTime: '07:30', subjectId: 'sub_4', subjectName: 'Physics', subjectColor: '#f59e0b', notes: 'Modern Physics' }
      );

      // Seed Challenges
      this.data.challenges.push(
        {
          id: 'chal_1',
          title: '30 Day Study Challenge',
          description: 'Reach 100 hours of focused study time in 30 days. Maintain high consistency!',
          targetHours: 100,
          startDate: todayStr,
          endDate: new Date(Date.now() + 30 * 86400 * 1000).toISOString().split('T')[0],
          creatorId: primaryUser.id,
          isGroup: false,
          participants: [primaryUser.id],
          totalSecondsStudied: 42 * 3600 + 15 * 60, // 42h 15m
          isCompleted: false,
          createdAt: now,
        },
        {
          id: 'chal_group_1',
          title: 'Padhe Le Yrr 50h Sprint',
          description: 'Group challenge: accumulate 50 hours of study as a team this week!',
          targetHours: 50,
          startDate: todayStr,
          endDate: new Date(Date.now() + 7 * 86400 * 1000).toISOString().split('T')[0],
          creatorId: primaryUser.id,
          isGroup: true,
          groupId: padheGroup.id,
          participants: [primaryUser.id, peerAnkit.id, peerSonu.id, peerRittik.id],
          totalSecondsStudied: 31 * 3600,
          isCompleted: false,
          createdAt: now,
        }
      );

      // Seed Friends
      this.data.friends.push(
        { id: 'fr_1', userId: primaryUser.id, friendId: peerAnkit.id, status: 'accepted', requestedBy: primaryUser.id, createdAt: now },
        { id: 'fr_2', userId: primaryUser.id, friendId: peerSonu.id, status: 'accepted', requestedBy: peerSonu.id, createdAt: now },
        { id: 'fr_3', userId: primaryUser.id, friendId: peerRittik.id, status: 'accepted', requestedBy: primaryUser.id, createdAt: now }
      );

      // Seed Edit Log
      this.data.editLogs.push(
        { id: 'log_1', userId: primaryUser.id, action: 'Daily goal changed', details: 'Updated to 6 hours daily target', timestamp: now },
        { id: 'log_2', userId: primaryUser.id, action: 'Subject created', details: 'Added Zoology 🦴 with Emerald theme', timestamp: now },
        { id: 'log_3', userId: primaryUser.id, action: 'Chemistry session saved', details: 'Completed 60m Pomodoro session', timestamp: now }
      );

      // Seed Initial NCERT Reading Progress
      this.data.userBookProgress = [
        {
          bookId: 'ncert_11_bio_en',
          userId: primaryUser.id,
          currentPage: 142,
          currentChapter: 8,
          totalPages: 342,
          bookmarkedPages: [125, 142],
          isBookmarked: true,
          lastReadAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
        },
        {
          bookId: 'ncert_11_phy_part1_en',
          userId: primaryUser.id,
          currentPage: 87,
          currentChapter: 4,
          totalPages: 204,
          bookmarkedPages: [45, 87],
          isBookmarked: true,
          lastReadAt: new Date(Date.now() - 86400 * 1000).toISOString(),
        },
        {
          bookId: 'ncert_11_chem_part1_en',
          userId: primaryUser.id,
          currentPage: 52,
          currentChapter: 2,
          totalPages: 218,
          bookmarkedPages: [29],
          isBookmarked: false,
          lastReadAt: new Date(Date.now() - 86400 * 1000 * 3).toISOString(),
        }
      ];

      // Seed Initial Uploaded Notes with Multi-Color Highlights
      this.data.uploadedNotes = [
        {
          id: 'note_1',
          userId: primaryUser.id,
          title: 'Cell: The Unit of Life (Chapter 8 High-Yield Revision)',
          subjectId: 'sub_1',
          subjectName: 'Zoology',
          subjectColor: '#10b981',
          bookId: 'ncert_11_bio_en',
          bookTitle: 'Biology Class 11',
          chapterNumber: 8,
          chapterTitle: 'Cell: The Unit of Life',
          content: `Cell Biology Rapid Points for NEET / Class 11 Exam:

1. Cell Theory was formulated by Schleiden and Schwann. Rudolf Virchow in 1855 added the crucial phrase "Omnis cellula-e cellula", meaning all living cells arise from pre-existing cells.

2. Fluid Mosaic Model proposed by Singer and Nicolson in 1972 is the most widely accepted membrane structure. Lipids are arranged as a bilayer with polar hydrophilic heads outwards and nonpolar hydrophobic tails inside.

3. Endomembrane system includes ER, Golgi apparatus, lysosomes and vacuoles because their functions are coordinated. Chloroplasts and peroxisomes are NOT part of the endomembrane system.

4. Mitochondria and chloroplasts are semi-autonomous organelles containing circular DNA, 70S ribosomes, and RNA components, capable of dividing by fission.

5. Ribosomes in prokaryotes are 70S while in eukaryotes they are 80S. Sedimentation coefficient (S) represents density and size.

6. Centrioles form the basal body of cilia or flagella and spindle fibers that give rise to spindle apparatus during cell division in animal cells.`,
          highlights: [
            {
              id: 'hl_1',
              text: 'Fluid Mosaic Model proposed by Singer and Nicolson in 1972',
              color: 'yellow',
              note: 'High frequency NEET question (Asked in 2021, 2023)',
              createdAt: now,
            },
            {
              id: 'hl_2',
              text: 'Mitochondria and chloroplasts are semi-autonomous organelles containing circular DNA',
              color: 'green',
              note: 'Endosymbiotic origin concept',
              createdAt: now,
            },
            {
              id: 'hl_3',
              text: 'Ribosomes in prokaryotes are 70S while in eukaryotes they are 80S',
              color: 'blue',
              note: 'Remember: 70S = 50S + 30S; 80S = 60S + 40S',
              createdAt: now,
            },
            {
              id: 'hl_4',
              text: 'Endomembrane system includes ER, Golgi apparatus, lysosomes and vacuoles',
              color: 'pink',
              note: 'Peroxisomes are excluded!',
              createdAt: now,
            },
            {
              id: 'hl_5',
              text: 'Centrioles form the basal body of cilia or flagella',
              color: 'orange',
              note: '9+0 triplet microtubule arrangement',
              createdAt: now,
            },
          ],
          tags: ['High Yield', 'Cell Biology', 'NEET 2026', 'Revision'],
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'note_2',
          userId: primaryUser.id,
          title: 'Newtonian Dynamics & Friction Formulas',
          subjectId: 'sub_4',
          subjectName: 'Physics',
          subjectColor: '#f59e0b',
          bookId: 'ncert_11_phy_part1_en',
          bookTitle: 'Physics Part I Class 11',
          chapterNumber: 4,
          chapterTitle: 'Laws of Motion',
          content: `Key Formula Sheet for Laws of Motion:

1. Static friction adjusts itself up to limiting friction: f_s <= μ_s * N.
2. Kinetic friction is constant and independent of contact area: f_k = μ_k * N, where μ_k < μ_s.
3. Angle of repose: tan(θ) = μ_s.
4. Optimum banking speed for road curves without relying on friction: v = sqrt(R * g * tan(θ)).
5. Maximum safe speed on banked road with friction: v_max = sqrt(R * g * ((μ + tan θ) / (1 - μ * tan θ))).
6. Rocket propulsion thrust: F = u * (dm/dt) - m * g.`,
          highlights: [
            {
              id: 'hl_6',
              text: 'Maximum safe speed on banked road with friction: v_max = sqrt(R * g * ((μ + tan θ) / (1 - μ * tan θ)))',
              color: 'yellow',
              note: 'Most common numerical formula',
              createdAt: now,
            },
            {
              id: 'hl_7',
              text: 'Static friction adjusts itself up to limiting friction: f_s <= μ_s * N',
              color: 'green',
              note: 'Self-adjusting nature of static friction',
              createdAt: now,
            },
            {
              id: 'hl_8',
              text: 'Kinetic friction is constant and independent of contact area: f_k = μ_k * N',
              color: 'blue',
              note: 'Remember μ_k is always less than μ_s',
              createdAt: now,
            }
          ],
          tags: ['Formulas', 'Mechanics', 'Physics 11'],
          createdAt: now,
          updatedAt: now,
        }
      ];

      this.save();
    }
  }

  // User queries
  public findUserById(id: string): UserAccount | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public findUserByEmail(email: string): UserAccount | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public createUser(user: UserAccount): UserAccount {
    this.data.users.push(user);
    this.save();
    return user;
  }

  public updateUser(id: string, updates: Partial<UserAccount>): UserAccount | undefined {
    const user = this.findUserById(id);
    if (!user) return undefined;
    Object.assign(user, updates);
    this.save();
    return user;
  }

  // Active Timers
  public getActiveTimer(userId: string): ActiveTimerState | undefined {
    return this.data.activeTimers[userId];
  }

  public setActiveTimer(userId: string, timer: ActiveTimerState) {
    this.data.activeTimers[userId] = timer;
    this.save();
  }

  public removeActiveTimer(userId: string): ActiveTimerState | undefined {
    const existing = this.data.activeTimers[userId];
    delete this.data.activeTimers[userId];
    this.save();
    return existing;
  }

  public getAllActiveTimers(): Record<string, ActiveTimerState> {
    return this.data.activeTimers;
  }

  // Subjects
  public getSubjects(userId: string): Subject[] {
    return this.data.subjects.filter(s => s.userId === userId);
  }

  public addSubject(subject: Subject): Subject {
    this.data.subjects.push(subject);
    this.save();
    return subject;
  }

  public updateSubject(id: string, userId: string, updates: Partial<Subject>): Subject | undefined {
    const sub = this.data.subjects.find(s => s.id === id && s.userId === userId);
    if (!sub) return undefined;
    Object.assign(sub, updates);
    this.save();
    return sub;
  }

  public deleteSubject(id: string, userId: string): boolean {
    const idx = this.data.subjects.findIndex(s => s.id === id && s.userId === userId);
    if (idx === -1) return false;
    this.data.subjects.splice(idx, 1);
    this.save();
    return true;
  }

  // Sessions
  public getSessions(userId: string): StudySession[] {
    return this.data.studySessions.filter(s => s.userId === userId);
  }

  public addSession(session: StudySession): StudySession {
    this.data.studySessions.push(session);
    this.save();
    return session;
  }

  public deleteSession(id: string, userId: string): boolean {
    const idx = this.data.studySessions.findIndex(s => s.id === id && s.userId === userId);
    if (idx === -1) return false;
    this.data.studySessions.splice(idx, 1);
    this.save();
    return true;
  }

  // Groups
  public getGroups(): StudyGroup[] {
    return this.data.groups;
  }

  public getGroupById(id: string): StudyGroup | undefined {
    return this.data.groups.find(g => g.id === id);
  }

  public createGroup(group: StudyGroup, ownerId: string): StudyGroup {
    this.data.groups.push(group);
    this.data.groupMembers.push({
      id: 'gm_' + Date.now(),
      groupId: group.id,
      userId: ownerId,
      role: 'owner',
      joinedAt: new Date().toISOString(),
    });
    this.save();
    return group;
  }

  public getGroupMembers(groupId: string): GroupMemberLive[] {
    const memberships = this.data.groupMembers.filter(m => m.groupId === groupId);
    const today = new Date().toISOString().split('T')[0];

    return memberships.map(m => {
      const user = this.findUserById(m.userId);
      const activeTimer = this.data.activeTimers[m.userId];
      
      // Calculate today's total from saved sessions
      const todaySeconds = this.data.studySessions
        .filter(s => s.userId === m.userId && s.date === today)
        .reduce((acc, curr) => acc + curr.durationSeconds, 0);

      const isStudying = !!activeTimer && !activeTimer.isPaused;
      const status: 'studying' | 'break' | 'offline' = isStudying
        ? 'studying'
        : activeTimer?.isPaused
        ? 'break'
        : 'offline';

      const currentDuration = activeTimer
        ? Math.floor((Date.now() - activeTimer.startTimestamp) / 1000)
        : 0;

      return {
        id: m.id,
        userId: m.userId,
        username: user ? user.username : 'Unknown User',
        avatar: user ? user.avatar : '👤',
        role: m.role,
        status,
        currentSubject: isStudying ? activeTimer?.subjectName : undefined,
        currentSubjectColor: isStudying ? activeTimer?.subjectColor : undefined,
        currentSubjectIcon: isStudying ? activeTimer?.subjectIcon : undefined,
        currentSessionDuration: currentDuration,
        todayTotalDuration: todaySeconds + (isStudying ? currentDuration : 0),
        lastActive: activeTimer ? new Date(activeTimer.lastHeartbeat).toLocaleTimeString() : 'Offline',
      };
    });
  }

  public addGroupMember(groupId: string, userId: string): boolean {
    const existing = this.data.groupMembers.find(m => m.groupId === groupId && m.userId === userId);
    if (existing) return true;
    this.data.groupMembers.push({
      id: 'gm_' + Date.now(),
      groupId,
      userId,
      role: 'member',
      joinedAt: new Date().toISOString(),
    });
    const grp = this.getGroupById(groupId);
    if (grp) grp.memberCount += 1;
    this.save();
    return true;
  }

  public leaveGroup(groupId: string, userId: string): boolean {
    const idx = this.data.groupMembers.findIndex(m => m.groupId === groupId && m.userId === userId);
    if (idx === -1) return false;
    this.data.groupMembers.splice(idx, 1);
    const grp = this.getGroupById(groupId);
    if (grp && grp.memberCount > 0) grp.memberCount -= 1;
    this.save();
    return true;
  }

  public getGroupMessages(groupId: string): GroupChatMessage[] {
    return this.data.groupMessages.filter(m => m.groupId === groupId);
  }

  public addGroupMessage(message: GroupChatMessage): GroupChatMessage {
    this.data.groupMessages.push(message);
    this.save();
    return message;
  }

  // Tasks
  public getTasks(userId: string): TaskItem[] {
    return this.data.tasks.filter(t => t.userId === userId);
  }

  public addTask(task: TaskItem): TaskItem {
    this.data.tasks.push(task);
    this.save();
    return task;
  }

  public updateTask(id: string, userId: string, updates: Partial<TaskItem>): TaskItem | undefined {
    const t = this.data.tasks.find(item => item.id === id && item.userId === userId);
    if (!t) return undefined;
    Object.assign(t, updates);
    this.save();
    return t;
  }

  public deleteTask(id: string, userId: string): boolean {
    const idx = this.data.tasks.findIndex(t => t.id === id && t.userId === userId);
    if (idx === -1) return false;
    this.data.tasks.splice(idx, 1);
    this.save();
    return true;
  }

  // Timetable
  public getTimetable(userId: string): TimetableBlock[] {
    return this.data.timetable.filter(b => b.userId === userId);
  }

  public setTimetable(userId: string, blocks: TimetableBlock[]) {
    this.data.timetable = this.data.timetable.filter(b => b.userId !== userId).concat(blocks);
    this.save();
  }

  // Books
  public getBooks(userId: string): BookItem[] {
    return this.data.books.filter(b => b.userId === userId);
  }

  public addBook(book: BookItem): BookItem {
    this.data.books.push(book);
    this.save();
    return book;
  }

  public updateBook(id: string, userId: string, updates: Partial<BookItem>): BookItem | undefined {
    const b = this.data.books.find(item => item.id === id && item.userId === userId);
    if (!b) return undefined;
    Object.assign(b, updates);
    b.updatedAt = new Date().toISOString();
    this.save();
    return b;
  }

  public deleteBook(id: string, userId: string): boolean {
    const idx = this.data.books.findIndex(b => b.id === id && b.userId === userId);
    if (idx === -1) return false;
    this.data.books.splice(idx, 1);
    this.save();
    return true;
  }

  // ==========================================
  // NCERT TEXTBOOKS & READING PROGRESS
  // ==========================================
  public getNCERTBooks(filters?: { classLevel?: string; subject?: string; language?: string; search?: string }): NCERTBook[] {
    let books = this.data.ncertBooks && this.data.ncertBooks.length > 0 ? this.data.ncertBooks : INITIAL_NCERT_BOOKS;

    if (!filters) return books;

    if (filters.classLevel && filters.classLevel !== 'all') {
      books = books.filter(b => b.classLevel === filters.classLevel);
    }
    if (filters.subject && filters.subject !== 'all') {
      books = books.filter(b => b.subject === filters.subject);
    }
    if (filters.language && filters.language !== 'all') {
      books = books.filter(b => b.language === filters.language);
    }
    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      books = books.filter(b =>
        b.title.toLowerCase().includes(q) ||
        (b.titleHindi && b.titleHindi.toLowerCase().includes(q)) ||
        b.subject.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        b.chapters.some(c => c.title.toLowerCase().includes(q) || (c.titleHindi && c.titleHindi.toLowerCase().includes(q)))
      );
    }
    return books;
  }

  public getNCERTBookById(id: string): NCERTBook | undefined {
    const list = this.data.ncertBooks && this.data.ncertBooks.length > 0 ? this.data.ncertBooks : INITIAL_NCERT_BOOKS;
    return list.find(b => b.id === id);
  }

  public getUserBookProgress(userId: string): UserBookProgress[] {
    return (this.data.userBookProgress || []).filter(p => p.userId === userId);
  }

  public saveUserBookProgress(userId: string, progress: Partial<UserBookProgress> & { bookId: string }): UserBookProgress {
    if (!this.data.userBookProgress) this.data.userBookProgress = [];
    let existing = this.data.userBookProgress.find(p => p.userId === userId && p.bookId === progress.bookId);
    if (existing) {
      Object.assign(existing, progress);
      existing.lastReadAt = new Date().toISOString();
    } else {
      const book = this.getNCERTBookById(progress.bookId);
      existing = {
        bookId: progress.bookId,
        userId,
        currentPage: progress.currentPage || 1,
        currentChapter: progress.currentChapter || 1,
        totalPages: progress.totalPages || book?.totalPages || 100,
        bookmarkedPages: progress.bookmarkedPages || [],
        isBookmarked: progress.isBookmarked ?? false,
        lastReadAt: new Date().toISOString(),
      };
      this.data.userBookProgress.push(existing);
    }
    this.save();
    return existing;
  }

  public toggleBookBookmark(userId: string, bookId: string): boolean {
    if (!this.data.userBookProgress) this.data.userBookProgress = [];
    let progress = this.data.userBookProgress.find(p => p.userId === userId && p.bookId === bookId);
    if (!progress) {
      const book = this.getNCERTBookById(bookId);
      progress = {
        bookId,
        userId,
        currentPage: 1,
        totalPages: book?.totalPages || 100,
        bookmarkedPages: [],
        isBookmarked: true,
        lastReadAt: new Date().toISOString(),
      };
      this.data.userBookProgress.push(progress);
      this.save();
      return true;
    }
    progress.isBookmarked = !progress.isBookmarked;
    this.save();
    return progress.isBookmarked;
  }

  // ==========================================
  // UPLOADED NOTES & HIGHLIGHTS
  // ==========================================
  public getNotes(userId: string, filters?: { subjectId?: string; bookId?: string; search?: string }): UploadedNote[] {
    let notes = (this.data.uploadedNotes || []).filter(n => n.userId === userId);
    if (!filters) return notes;

    if (filters.subjectId && filters.subjectId !== 'all') {
      notes = notes.filter(n => n.subjectId === filters.subjectId);
    }
    if (filters.bookId && filters.bookId !== 'all') {
      notes = notes.filter(n => n.bookId === filters.bookId);
    }
    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      notes = notes.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        (n.chapterTitle && n.chapterTitle.toLowerCase().includes(q)) ||
        n.tags.some(t => t.toLowerCase().includes(q)) ||
        n.highlights.some(h => h.text.toLowerCase().includes(q) || (h.note && h.note.toLowerCase().includes(q)))
      );
    }
    notes.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
    return notes;
  }

  public getNoteById(id: string, userId: string): UploadedNote | undefined {
    return (this.data.uploadedNotes || []).find(n => n.id === id && n.userId === userId);
  }

  public addNote(note: UploadedNote): UploadedNote {
    if (!this.data.uploadedNotes) this.data.uploadedNotes = [];
    this.data.uploadedNotes.unshift(note);
    this.save();
    return note;
  }

  public updateNote(id: string, userId: string, updates: Partial<UploadedNote>): UploadedNote | undefined {
    const note = this.getNoteById(id, userId);
    if (!note) return undefined;
    Object.assign(note, updates);
    note.updatedAt = new Date().toISOString();
    this.save();
    return note;
  }

  public deleteNote(id: string, userId: string): boolean {
    if (!this.data.uploadedNotes) return false;
    const idx = this.data.uploadedNotes.findIndex(n => n.id === id && n.userId === userId);
    if (idx === -1) return false;
    this.data.uploadedNotes.splice(idx, 1);
    this.save();
    return true;
  }

  public addNoteHighlight(noteId: string, userId: string, highlight: NoteHighlight): UploadedNote | undefined {
    const note = this.getNoteById(noteId, userId);
    if (!note) return undefined;
    if (!note.highlights) note.highlights = [];
    note.highlights.push(highlight);
    note.updatedAt = new Date().toISOString();
    this.save();
    return note;
  }

  public removeNoteHighlight(noteId: string, highlightId: string, userId: string): UploadedNote | undefined {
    const note = this.getNoteById(noteId, userId);
    if (!note || !note.highlights) return undefined;
    note.highlights = note.highlights.filter(h => h.id !== highlightId);
    note.updatedAt = new Date().toISOString();
    this.save();
    return note;
  }

  // ==========================================
  // APP BLOCK & DISTRACTION SHIELD
  // ==========================================
  public getAppBlockConfig(): AppBlockConfig {
    if (!this.data.appBlockConfig) {
      this.data.appBlockConfig = defaultAppBlockConfig;
      this.save();
    }
    return this.data.appBlockConfig;
  }

  public updateAppBlockConfig(updates: Partial<AppBlockConfig>): AppBlockConfig {
    const current = this.getAppBlockConfig();
    this.data.appBlockConfig = { ...current, ...updates };
    this.save();
    return this.data.appBlockConfig;
  }

  // Challenges
  public getChallenges(): ChallengeItem[] {
    return this.data.challenges;
  }

  public addChallenge(challenge: ChallengeItem): ChallengeItem {
    this.data.challenges.push(challenge);
    this.save();
    return challenge;
  }

  public joinChallenge(challengeId: string, userId: string): boolean {
    const ch = this.data.challenges.find(c => c.id === challengeId);
    if (!ch) return false;
    if (!ch.participants.includes(userId)) {
      ch.participants.push(userId);
      this.save();
    }
    return true;
  }

  // Friends
  public getFriends(userId: string) {
    const rels = this.data.friends.filter(f => (f.userId === userId || f.friendId === userId) && f.status === 'accepted');
    const today = new Date().toISOString().split('T')[0];

    return rels.map(rel => {
      const otherId = rel.userId === userId ? rel.friendId : rel.userId;
      const user = this.findUserById(otherId);
      const activeTimer = this.data.activeTimers[otherId];
      const todaySeconds = this.data.studySessions
        .filter(s => s.userId === otherId && s.date === today)
        .reduce((acc, curr) => acc + curr.durationSeconds, 0);

      const isStudying = !!activeTimer && !activeTimer.isPaused;
      const currentDuration = activeTimer ? Math.floor((Date.now() - activeTimer.startTimestamp) / 1000) : 0;

      return {
        id: rel.id,
        friendId: otherId,
        username: user?.username || 'Student',
        avatar: user?.avatar || '👤',
        isStudying,
        currentSubject: isStudying ? activeTimer?.subjectName : undefined,
        currentDuration,
        totalTodaySeconds: todaySeconds + (isStudying ? currentDuration : 0),
        status: rel.status,
      };
    });
  }

  public addFriend(userId: string, friendId: string): FriendRelation {
    const existing = this.data.friends.find(
      f => (f.userId === userId && f.friendId === friendId) || (f.userId === friendId && f.friendId === userId)
    );
    if (existing) return existing;
    const rel: FriendRelation = {
      id: 'fr_' + Date.now(),
      userId,
      friendId,
      status: 'accepted',
      requestedBy: userId,
      createdAt: new Date().toISOString(),
    };
    this.data.friends.push(rel);
    this.save();
    return rel;
  }

  // D-Day Events
  public getDDays(userId: string): DDayEvent[] {
    if (!this.data.dDayEvents) {
      this.data.dDayEvents = [];
    }
    const userDDays = this.data.dDayEvents.filter(d => d.userId === userId);
    if (userDDays.length === 0) {
      const defaultEvents: DDayEvent[] = [
        {
          id: 'dday_1',
          userId,
          title: 'NEET & JEE Final Exam',
          targetDate: '2027-05-04',
          category: 'Competitive',
          isPinned: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'dday_2',
          userId,
          title: 'Semester Board Exams',
          targetDate: '2026-12-15',
          category: 'Exams',
          isPinned: true,
          createdAt: new Date().toISOString(),
        },
      ];
      this.data.dDayEvents.push(...defaultEvents);
      this.save();
      return defaultEvents;
    }
    return userDDays;
  }

  public addDDay(event: DDayEvent): DDayEvent {
    if (!this.data.dDayEvents) this.data.dDayEvents = [];
    this.data.dDayEvents.push(event);
    this.save();
    return event;
  }

  public deleteDDay(id: string, userId: string): boolean {
    if (!this.data.dDayEvents) return false;
    const idx = this.data.dDayEvents.findIndex(d => d.id === id && d.userId === userId);
    if (idx === -1) return false;
    this.data.dDayEvents.splice(idx, 1);
    this.save();
    return true;
  }

  // 10-Minute Planner Blocks
  public getPlannerBlocks(userId: string, date: string): PlannerBlock[] {
    if (!this.data.plannerBlocks) this.data.plannerBlocks = [];
    return this.data.plannerBlocks.filter(b => b.userId === userId && b.date === date);
  }

  public savePlannerBlocks(userId: string, date: string, blocks: PlannerBlock[]) {
    if (!this.data.plannerBlocks) this.data.plannerBlocks = [];
    this.data.plannerBlocks = this.data.plannerBlocks.filter(b => !(b.userId === userId && b.date === date)).concat(blocks);
    this.save();
  }

  // Achievements Evaluated from Real Database Records
  public getAchievements(userId: string): AchievementItem[] {
    const sessions = this.getSessions(userId);
    const totalSeconds = sessions.reduce((acc, s) => acc + s.durationSeconds, 0);
    const totalHours = Math.floor(totalSeconds / 3600);
    const sessionCount = sessions.length;
    const books = this.getBooks(userId);
    const completedBooks = books.filter(b => b.status === 'completed').length;

    // Calculate streak
    const sessionsByDate: Record<string, number> = {};
    sessions.forEach(s => {
      sessionsByDate[s.date] = (sessionsByDate[s.date] || 0) + s.durationSeconds;
    });
    let streak = 0;
    const todayStr = new Date().toISOString().split('T')[0];
    if ((sessionsByDate[todayStr] || 0) >= 1800) streak++;
    for (let i = 1; i <= 365; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      if ((sessionsByDate[dStr] || 0) >= 1800) streak++;
      else break;
    }

    const achievementsList: AchievementItem[] = [
      {
        id: 'ach_first_session',
        title: 'First Step',
        description: 'Complete your first focused study session',
        icon: '🌱',
        requirementType: 'sessions',
        targetValue: 1,
        unlocked: sessionCount >= 1,
        unlockedAt: sessionCount >= 1 ? sessions[sessions.length - 1]?.createdAt : undefined,
        currentValue: sessionCount,
      },
      {
        id: 'ach_10_hours',
        title: '10 Hours Focused',
        description: 'Log 10 hours of verified study time',
        icon: '⚡',
        requirementType: 'hours',
        targetValue: 10,
        unlocked: totalHours >= 10,
        unlockedAt: totalHours >= 10 ? new Date().toISOString() : undefined,
        currentValue: totalHours,
      },
      {
        id: 'ach_50_hours',
        title: '50-Hour Scholar',
        description: 'Accumulate 50 hours of deep focus',
        icon: '🔥',
        requirementType: 'hours',
        targetValue: 50,
        unlocked: totalHours >= 50,
        unlockedAt: totalHours >= 50 ? new Date().toISOString() : undefined,
        currentValue: totalHours,
      },
      {
        id: 'ach_100_hours',
        title: 'Centurion of Focus',
        description: 'Achieve 100 hours of recorded study time',
        icon: '👑',
        requirementType: 'hours',
        targetValue: 100,
        unlocked: totalHours >= 100,
        currentValue: totalHours,
      },
      {
        id: 'ach_7_streak',
        title: '7-Day Discipline',
        description: 'Maintain a 7-day consistent study streak',
        icon: '🎯',
        requirementType: 'streak',
        targetValue: 7,
        unlocked: streak >= 7,
        currentValue: streak,
      },
      {
        id: 'ach_30_streak',
        title: 'Unstoppable Habit',
        description: 'Reach a 30-day continuous study streak',
        icon: '🏆',
        requirementType: 'streak',
        targetValue: 30,
        unlocked: streak >= 30,
        currentValue: streak,
      },
      {
        id: 'ach_100_sessions',
        title: 'Master of Consistency',
        description: 'Complete 100 individual study sessions',
        icon: '⭐',
        requirementType: 'sessions',
        targetValue: 100,
        unlocked: sessionCount >= 100,
        currentValue: sessionCount,
      },
      {
        id: 'ach_bookworm',
        title: 'Avid Reader',
        description: 'Finish reading your first complete textbook',
        icon: '📚',
        requirementType: 'books',
        targetValue: 1,
        unlocked: completedBooks >= 1,
        currentValue: completedBooks,
      },
    ];

    return achievementsList;
  }

  // Global Search across all database collections
  public searchAll(userId: string, query: string) {
    const q = query.toLowerCase();
    const subjects = this.getSubjects(userId).filter(s => s.name.toLowerCase().includes(q));
    const tasks = this.getTasks(userId).filter(t => t.title.toLowerCase().includes(q) || t.notes.toLowerCase().includes(q));
    const books = this.getBooks(userId).filter(b => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q));
    const groups = this.getGroups().filter(g => g.name.toLowerCase().includes(q) || g.description.toLowerCase().includes(q));
    const sessions = this.getSessions(userId).filter(s => s.subjectName.toLowerCase().includes(q) || s.notes.toLowerCase().includes(q)).slice(0, 8);

    return {
      subjects,
      tasks,
      books,
      groups,
      sessions,
    };
  }

  // Edit Logs
  public getEditLogs(userId: string): EditLogItem[] {
    return this.data.editLogs.filter(l => l.userId === userId).slice(-50).reverse();
  }

  public logEdit(userId: string, action: string, details: string) {
    this.data.editLogs.push({
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId,
      action,
      details,
      timestamp: new Date().toISOString(),
    });
    this.save();
  }

  // ==========================================
  // QUESTION TESTS & PDF EXAM PAPERS
  // ==========================================
  public getQuestionTests(userId: string): QuestionTest[] {
    if (!this.data.questionTests || this.data.questionTests.length === 0) {
      this.data.questionTests = [...INITIAL_SAMPLE_QUESTION_TESTS];
      this.save();
    }
    return this.data.questionTests.filter(t => t.userId === userId || t.userId === 'user_default');
  }

  public getQuestionTestById(id: string, userId: string): QuestionTest | undefined {
    const tests = this.getQuestionTests(userId);
    return tests.find(t => t.id === id);
  }

  public saveQuestionTest(test: QuestionTest): QuestionTest {
    if (!this.data.questionTests) {
      this.data.questionTests = [...INITIAL_SAMPLE_QUESTION_TESTS];
    }
    const idx = this.data.questionTests.findIndex(t => t.id === test.id);
    if (idx >= 0) {
      this.data.questionTests[idx] = test;
    } else {
      this.data.questionTests.unshift(test);
    }
    this.save();
    return test;
  }

  public updateQuestionTest(id: string, userId: string, updates: Partial<QuestionTest>): QuestionTest | undefined {
    if (!this.data.questionTests) {
      this.data.questionTests = [...INITIAL_SAMPLE_QUESTION_TESTS];
    }
    const idx = this.data.questionTests.findIndex(t => t.id === id && (t.userId === userId || t.userId === 'user_default'));
    if (idx === -1) return undefined;

    const existing = this.data.questionTests[idx];
    const updated: QuestionTest = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.data.questionTests[idx] = updated;
    this.save();
    return updated;
  }

  public deleteQuestionTest(id: string, userId: string): boolean {
    if (!this.data.questionTests) return false;
    const initialLen = this.data.questionTests.length;
    this.data.questionTests = this.data.questionTests.filter(t => !(t.id === id && (t.userId === userId || t.userId === 'user_default')));
    const deleted = this.data.questionTests.length < initialLen;
    if (deleted) this.save();
    return deleted;
  }

  // ==========================================
  // NEET MCQ QUESTION BANK (10,000+ Scalable)
  // ==========================================
  public getNeetQuestions(params: {
    subject?: string;
    chapter?: string;
    topic?: string;
    difficulty?: string;
    isPYQ?: boolean;
    status?: string;
    bookmarked?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }): { questions: NEETQuestion[]; total: number; chapters: string[]; topics: string[] } {
    if (!this.data.neetQuestions || this.data.neetQuestions.length === 0) {
      this.data.neetQuestions = generateNeetQuestionBank(120);
      this.save();
    }

    let list = this.data.neetQuestions;

    if (params.subject && params.subject !== 'all') {
      list = list.filter(q => q.subject.toLowerCase() === params.subject?.toLowerCase());
    }
    if (params.chapter && params.chapter !== 'all') {
      list = list.filter(q => q.chapter.toLowerCase() === params.chapter?.toLowerCase());
    }
    if (params.topic && params.topic !== 'all') {
      list = list.filter(q => q.topic.toLowerCase() === params.topic?.toLowerCase());
    }
    if (params.difficulty && params.difficulty !== 'all') {
      list = list.filter(q => q.difficulty === params.difficulty);
    }
    if (params.isPYQ !== undefined) {
      list = list.filter(q => !!q.isPYQ === params.isPYQ);
    }
    if (params.status && params.status !== 'all') {
      list = list.filter(q => (q.status || 'unattempted') === params.status);
    }
    if (params.bookmarked !== undefined) {
      list = list.filter(q => !!q.bookmarked === params.bookmarked);
    }
    if (params.search && params.search.trim()) {
      const q = params.search.toLowerCase();
      list = list.filter(item =>
        item.questionText.toLowerCase().includes(q) ||
        item.chapter.toLowerCase().includes(q) ||
        item.topic.toLowerCase().includes(q) ||
        item.options.some(o => o.text.toLowerCase().includes(q))
      );
    }

    const subjectPool = params.subject && params.subject !== 'all'
      ? this.data.neetQuestions.filter(q => q.subject.toLowerCase() === params.subject?.toLowerCase())
      : this.data.neetQuestions;
    const allChapters = Array.from(new Set(subjectPool.map(q => q.chapter))).sort();
    const chapterPool = params.chapter && params.chapter !== 'all'
      ? subjectPool.filter(q => q.chapter.toLowerCase() === params.chapter?.toLowerCase())
      : subjectPool;
    const allTopics = Array.from(new Set(chapterPool.map(q => q.topic))).sort();

    const total = list.length;
    const offset = params.offset || 0;
    const limit = params.limit || 50;
    const paginated = list.slice(offset, offset + limit);

    return {
      questions: paginated,
      total,
      chapters: allChapters,
      topics: allTopics,
    };
  }

  public getNeetQuestionById(id: string): NEETQuestion | undefined {
    return this.data.neetQuestions?.find(q => q.id === id);
  }

  public updateNeetQuestion(id: string, updates: Partial<NEETQuestion>): NEETQuestion | undefined {
    if (!this.data.neetQuestions) return undefined;
    const idx = this.data.neetQuestions.findIndex(q => q.id === id);
    if (idx === -1) return undefined;

    const updated = { ...this.data.neetQuestions[idx], ...updates };
    this.data.neetQuestions[idx] = updated;
    this.save();
    return updated;
  }

  public addNeetQuestion(question: NEETQuestion): NEETQuestion {
    if (!this.data.neetQuestions) {
      this.data.neetQuestions = generateNeetQuestionBank(100);
    }
    this.data.neetQuestions.unshift(question);
    this.save();
    return question;
  }

  public deleteNeetQuestion(id: string): boolean {
    if (!this.data.neetQuestions) return false;
    const initLen = this.data.neetQuestions.length;
    this.data.neetQuestions = this.data.neetQuestions.filter(q => q.id !== id);
    const deleted = this.data.neetQuestions.length < initLen;
    if (deleted) this.save();
    return deleted;
  }

  public recordMcqAttempt(
    _userId: string,
    questionId: string,
    selectedOption: string,
    isCorrect: boolean,
    _timeSpentSeconds: number
  ): NEETQuestion | undefined {
    if (!this.data.neetQuestions) return undefined;
    const q = this.data.neetQuestions.find(item => item.id === questionId);
    if (!q) return undefined;

    q.status = isCorrect ? 'correct' : 'incorrect';
    q.lastAttemptedOption = selectedOption;
    this.save();
    return q;
  }

  // ==========================================
  // PDF ANNOTATIONS (Pen, Highlight, Underline, Sticky)
  // ==========================================
  public getPdfAnnotations(pdfId: string, pageNumber?: number): PdfAnnotationItem[] {
    if (!this.data.pdfAnnotations) this.data.pdfAnnotations = [];
    return this.data.pdfAnnotations.filter(a => a.pdfId === pdfId && (pageNumber === undefined || a.pageNumber === pageNumber));
  }

  public savePdfAnnotation(annotation: PdfAnnotationItem): PdfAnnotationItem {
    if (!this.data.pdfAnnotations) this.data.pdfAnnotations = [];
    const idx = this.data.pdfAnnotations.findIndex(a => a.id === annotation.id);
    if (idx >= 0) {
      this.data.pdfAnnotations[idx] = annotation;
    } else {
      this.data.pdfAnnotations.push(annotation);
    }
    this.save();
    return annotation;
  }

  public deletePdfAnnotation(id: string): boolean {
    if (!this.data.pdfAnnotations) return false;
    const initLen = this.data.pdfAnnotations.length;
    this.data.pdfAnnotations = this.data.pdfAnnotations.filter(a => a.id !== id);
    const deleted = this.data.pdfAnnotations.length < initLen;
    if (deleted) this.save();
    return deleted;
  }

  // ==========================================
  // PERSONAL STUDY NOTES (Rich text & Canvas)
  // ==========================================
  public getPersonalNotes(userId: string, params?: { subject?: string; search?: string }): PersonalStudyNote[] {
    if (!this.data.personalNotes) {
      this.data.personalNotes = [
        {
          id: 'note_seed_1',
          userId,
          title: 'High-Yield Formula Sheet: Ray Optics & Prisms',
          content: 'Minimum deviation angle: μ = sin((A + δ_m)/2) / sin(A/2). Real vs Apparent depth: d_app = d_real / μ. Lens Maker Formula: 1/f = (μ - 1)(1/R1 - 1/R2). Remember sign conventions rigorously!',
          subject: 'physics',
          chapter: 'Ray Optics',
          tags: ['Formula', 'NEET', 'High-Yield'],
          isPinned: true,
          isCompleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'note_seed_2',
          userId,
          title: 'Genetics: Dihybrid Cross & Recombination Ratios',
          content: 'Classic Mendelian F2 phenotypic ratio: 9:3:3:1. Genotypic ratio: 1:2:2:4:1:2:1:2:1. When linkage is present, recombinant frequency is strictly < 50%. Morgan Drosophila experiment: yellow-white cross showed only 1.3% recombination.',
          subject: 'biology',
          chapter: 'Principles of Inheritance',
          tags: ['Genetics', 'Botany', 'Important'],
          isPinned: true,
          isCompleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ];
      this.save();
    }

    let notes = this.data.personalNotes.filter(n => n.userId === userId || n.userId === 'user_default');
    if (params?.subject && params.subject !== 'all') {
      notes = notes.filter(n => n.subject === params.subject);
    }
    if (params?.search && params.search.trim()) {
      const q = params.search.toLowerCase();
      notes = notes.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || n.tags.some(t => t.toLowerCase().includes(q)));
    }
    notes.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
    return notes;
  }

  public addPersonalNote(note: PersonalStudyNote): PersonalStudyNote {
    if (!this.data.personalNotes) this.data.personalNotes = [];
    this.data.personalNotes.unshift(note);
    this.save();
    return note;
  }

  public updatePersonalNote(id: string, userId: string, updates: Partial<PersonalStudyNote>): PersonalStudyNote | undefined {
    if (!this.data.personalNotes) return undefined;
    const idx = this.data.personalNotes.findIndex(n => n.id === id && (n.userId === userId || n.userId === 'user_default'));
    if (idx === -1) return undefined;

    const updated = {
      ...this.data.personalNotes[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.data.personalNotes[idx] = updated;
    this.save();
    return updated;
  }

  public deletePersonalNote(id: string, userId: string): boolean {
    if (!this.data.personalNotes) return false;
    const initLen = this.data.personalNotes.length;
    this.data.personalNotes = this.data.personalNotes.filter(n => !(n.id === id && (n.userId === userId || n.userId === 'user_default')));
    const deleted = this.data.personalNotes.length < initLen;
    if (deleted) this.save();
    return deleted;
  }

  // ==========================================
  // PRACTICE GOALS & PERFORMANCE ANALYTICS
  // ==========================================
  public getPracticeGoal(userId: string): StudentPracticeGoal {
    if (!this.data.practiceGoals) this.data.practiceGoals = {};
    if (!this.data.practiceGoals[userId]) {
      this.data.practiceGoals[userId] = {
        dailyTargetMcqs: 60,
        dailyTargetMinutes: 180,
        todayCompletedMcqs: 38,
        todayCompletedMinutes: 145,
      };
      this.save();
    }
    return this.data.practiceGoals[userId];
  }

  public updatePracticeGoal(userId: string, updates: Partial<StudentPracticeGoal>): StudentPracticeGoal {
    const cur = this.getPracticeGoal(userId);
    const updated = { ...cur, ...updates };
    this.data.practiceGoals![userId] = updated;
    this.save();
    return updated;
  }

  public getNeetAnalytics(userId: string) {
    const questions = this.data.neetQuestions || [];
    const tests = this.getQuestionTests(userId);
    const sessions = this.getSessions(userId);

    const totalQuestions = questions.length;
    const attempted = questions.filter(q => q.status === 'correct' || q.status === 'incorrect');
    const correctCount = questions.filter(q => q.status === 'correct').length;
    const incorrectCount = questions.filter(q => q.status === 'incorrect').length;
    const unattemptedCount = totalQuestions - attempted.length;
    const accuracy = attempted.length > 0 ? Math.round((correctCount / attempted.length) * 100) : 0;

    // Subject breakdown
    const subjects = ['biology', 'physics', 'chemistry'] as const;
    const subjectStats = subjects.map(sub => {
      const subQs = questions.filter(q => q.subject === sub);
      const subAttempted = subQs.filter(q => q.status === 'correct' || q.status === 'incorrect');
      const subCorrect = subQs.filter(q => q.status === 'correct').length;
      const subAcc = subAttempted.length > 0 ? Math.round((subCorrect / subAttempted.length) * 100) : 0;
      return {
        subject: sub,
        label: sub.charAt(0).toUpperCase() + sub.slice(1),
        total: subQs.length,
        attempted: subAttempted.length,
        correct: subCorrect,
        accuracy: subAcc,
      };
    });

    // Chapter performance & weak topics
    const chapterMap: Record<string, { total: number; correct: number; incorrect: number }> = {};
    questions.forEach(q => {
      if (!chapterMap[q.chapter]) {
        chapterMap[q.chapter] = { total: 0, correct: 0, incorrect: 0 };
      }
      chapterMap[q.chapter].total++;
      if (q.status === 'correct') chapterMap[q.chapter].correct++;
      if (q.status === 'incorrect') chapterMap[q.chapter].incorrect++;
    });

    const chapterList = Object.entries(chapterMap).map(([ch, data]) => {
      const attemptedCh = data.correct + data.incorrect;
      const acc = attemptedCh > 0 ? Math.round((data.correct / attemptedCh) * 100) : 0;
      return { chapter: ch, ...data, accuracy: acc, attempted: attemptedCh };
    });

    const weakTopics = chapterList.filter(c => c.attempted >= 1 && c.accuracy < 60).slice(0, 5);
    const strongTopics = chapterList.filter(c => c.accuracy >= 75 && c.attempted >= 1).slice(0, 5);

    const totalStudyHours = Math.round(sessions.reduce((acc, s) => acc + s.durationSeconds, 0) / 3600);

    return {
      totalQuestions,
      attemptedCount: attempted.length,
      correctCount,
      incorrectCount,
      unattemptedCount,
      accuracy,
      totalStudyHours,
      subjectStats,
      weakTopics,
      strongTopics,
      recentTestsCount: tests.length,
    };
  }

  public getAdminStats() {
    return {
      totalMcqs: this.data.neetQuestions?.length || 0,
      totalUsers: this.data.users?.length || 0,
      totalPdfs: this.data.questionTests?.length || 0,
      totalNotes: this.data.personalNotes?.length || 0,
      reportedCount: this.data.neetQuestions?.filter(q => q.reported).length || 0,
    };
  }

  // ==========================================
  // SPOTIFY OAUTH & CREDENTIAL STORAGE
  // ==========================================
  public getSpotifyAuth(userId: string): SpotifyAuthRecord | undefined {
    if (!this.data.spotifyAuth) this.data.spotifyAuth = {};
    return this.data.spotifyAuth[userId];
  }

  public setSpotifyAuth(userId: string, authData: SpotifyAuthRecord): void {
    if (!this.data.spotifyAuth) this.data.spotifyAuth = {};
    this.data.spotifyAuth[userId] = authData;
    this.save();
  }

  public clearSpotifyAuth(userId: string): void {
    if (!this.data.spotifyAuth) return;
    delete this.data.spotifyAuth[userId];
    this.save();
  }

  public getSpotifyConfig(): { clientId?: string; clientSecret?: string } {
    return {
      clientId: process.env.SPOTIFY_CLIENT_ID || process.env.CLIENT_ID || this.data.spotifyConfig?.clientId,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET || process.env.CLIENT_SECRET || this.data.spotifyConfig?.clientSecret,
    };
  }

  public setSpotifyConfig(config: { clientId?: string; clientSecret?: string }): void {
    this.data.spotifyConfig = {
      ...this.data.spotifyConfig,
      ...config,
    };
    this.save();
  }

  public resetApp(userId?: string): void {
    if (userId) {
      this.data.studySessions = this.data.studySessions.filter(s => s.userId !== userId);
      delete this.data.activeTimers[userId];
      this.data.tasks = this.data.tasks.filter(t => t.userId !== userId);
      this.data.timetable = this.data.timetable.filter(t => t.userId !== userId);
      if (this.data.personalNotes) {
        this.data.personalNotes = this.data.personalNotes.filter(n => n.userId !== userId);
      }
      if (this.data.pdfAnnotations) {
        this.data.pdfAnnotations = [];
      }
      if (this.data.userBookProgress) {
        this.data.userBookProgress = this.data.userBookProgress.filter(p => p.userId !== userId);
      }
      const user = this.data.users.find(u => u.id === userId);
      if (user) {
        user.preferences = { ...defaultPreferences };
      }
    } else {
      this.data.studySessions = [];
      this.data.activeTimers = {};
      this.data.tasks = [];
      this.data.timetable = [];
      this.data.books = [];
      this.data.challenges = [];
      this.data.editLogs = [];
      this.data.userBookProgress = [];
      this.data.uploadedNotes = [];
      this.data.personalNotes = [];
      this.data.pdfAnnotations = [];
      this.data.appBlockConfig = defaultAppBlockConfig;
      this.data.spotifyAuth = {};
    }
    this.save();
  }
}

export const db = new Database();
