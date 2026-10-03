import { UserProfile, Subject, StudySession, ActiveTimerState, StudyGroup, GroupChatMessage, TaskItem, BookItem, TimetableBlock, ChallengeItem, EditLogItem, UserPreferences, GroupMemberLive, DDayEvent, PlannerBlock, AchievementItem, NCERTBook, NCERTChapter, UserBookProgress, UploadedNote, NoteHighlight, HighlightColor, AppBlockConfig, QuestionTest, NEETQuestion, PdfAnnotationItem, PersonalStudyNote, StudentPracticeGoal, SpotifyStatusResponse, SpotifyUserPlaylist } from '../types/index.js';

export const defaultPreferences: UserPreferences = {
  theme: 'dark',
  accentColor: 'indigo',
  wallpaper: 'default',
  wallpaperBlur: 0,
  wallpaperOpacity: 90,
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

const TOKEN_KEY = 'zenith_auth_token';
const OFFLINE_SESSIONS_KEY = 'zenith_offline_sessions';
const OFFLINE_TASKS_KEY = 'zenith_offline_tasks';

export function getStoredToken(): string {
  return localStorage.getItem(TOKEN_KEY) || 'user_monu_1';
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// Queue offline sessions
export function queueOfflineSession(session: StudySession) {
  try {
    const raw = localStorage.getItem(OFFLINE_SESSIONS_KEY);
    const list: StudySession[] = raw ? JSON.parse(raw) : [];
    list.push(session);
    localStorage.setItem(OFFLINE_SESSIONS_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to queue offline session', e);
  }
}

export function getOfflineSessions(): StudySession[] {
  try {
    const raw = localStorage.getItem(OFFLINE_SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function clearOfflineSessions() {
  localStorage.removeItem(OFFLINE_SESSIONS_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('x-user-id', token);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ user: UserProfile; token: string }> {
    const res = await request<{ user: UserProfile; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredToken(res.token);
    return res;
  },

  async register(username: string, email: string, password: string): Promise<{ user: UserProfile; token: string }> {
    const res = await request<{ user: UserProfile; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
    setStoredToken(res.token);
    return res;
  },

  async getMe(): Promise<{ user: UserProfile & { preferences: UserPreferences }; token: string }> {
    return request('/api/auth/me');
  },

  async updateProfile(updates: Partial<UserProfile>): Promise<{ user: UserProfile }> {
    return request('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async updatePreferences(updates: Partial<UserPreferences>): Promise<{ preferences: UserPreferences }> {
    return request('/api/user/preferences', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async setPin(pin: string): Promise<{ success: boolean }> {
    return request('/api/user/pin/set', {
      method: 'POST',
      body: JSON.stringify({ pin }),
    });
  },

  async verifyPin(pin: string): Promise<{ valid: boolean }> {
    return request('/api/user/pin/verify', {
      method: 'POST',
      body: JSON.stringify({ pin }),
    });
  },

  // Active Timer
  async getActiveTimer(): Promise<{ active: ActiveTimerState | null }> {
    return request('/api/timer/active');
  },

  async startTimer(params: {
    subjectId: string;
    subjectName: string;
    subjectColor: string;
    subjectIcon: string;
    mode?: string;
    targetDurationSeconds?: number;
  }): Promise<{ active: ActiveTimerState }> {
    return request('/api/timer/start', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async pauseTimer(): Promise<{ active: ActiveTimerState }> {
    return request('/api/timer/pause', { method: 'POST' });
  },

  async resumeTimer(): Promise<{ active: ActiveTimerState }> {
    return request('/api/timer/resume', { method: 'POST' });
  },

  async resetTimer(): Promise<{ active: ActiveTimerState | null }> {
    return request('/api/timer/reset', { method: 'POST' });
  },

  async cancelTimer(): Promise<{ success: boolean }> {
    return request('/api/timer/cancel', { method: 'POST' });
  },

  async finishTimer(params: {
    notes?: string;
    customDurationSeconds?: number;
    subjectId?: string;
    subjectName?: string;
    subjectColor?: string;
    subjectIcon?: string;
  }): Promise<{ session: StudySession; message: string }> {
    return request('/api/timer/finish', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // Subjects
  async getSubjects(): Promise<{ subjects: Subject[] }> {
    return request('/api/subjects');
  },

  async addSubject(sub: { name: string; icon: string; color: string }): Promise<{ subject: Subject }> {
    return request('/api/subjects', {
      method: 'POST',
      body: JSON.stringify(sub),
    });
  },

  async updateSubject(id: string, updates: Partial<Subject>): Promise<{ subject: Subject }> {
    return request(`/api/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteSubject(id: string): Promise<{ success: boolean }> {
    return request(`/api/subjects/${id}`, { method: 'DELETE' });
  },

  // Sessions
  async getSessions(query?: { date?: string; subjectId?: string }): Promise<{ sessions: StudySession[] }> {
    const q = new URLSearchParams();
    if (query?.date) q.set('date', query.date);
    if (query?.subjectId) q.set('subjectId', query.subjectId);
    return request(`/api/sessions?${q.toString()}`);
  },

  async deleteSession(id: string): Promise<{ success: boolean }> {
    return request(`/api/sessions/${id}`, { method: 'DELETE' });
  },

  // Groups & Social
  async getGroups(): Promise<{ groups: StudyGroup[] }> {
    return request('/api/groups');
  },

  async createGroup(data: { name: string; description: string; icon: string; isPrivate: boolean; maxMembers: number }): Promise<{ group: StudyGroup }> {
    return request('/api/groups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getGroupDetails(id: string): Promise<{ group: StudyGroup }> {
    return request(`/api/groups/${id}`);
  },

  async getGroupMembers(id: string): Promise<{ members: GroupMemberLive[] }> {
    return request(`/api/groups/${id}/members`);
  },

  async joinGroup(id: string): Promise<{ success: boolean }> {
    return request(`/api/groups/${id}/join`, { method: 'POST' });
  },

  async leaveGroup(id: string): Promise<{ success: boolean }> {
    return request(`/api/groups/${id}/leave`, { method: 'POST' });
  },

  async getGroupMessages(id: string): Promise<{ messages: GroupChatMessage[] }> {
    return request(`/api/groups/${id}/messages`);
  },

  async sendGroupMessage(id: string, text: string): Promise<{ message: GroupChatMessage }> {
    return request(`/api/groups/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },

  async getGroupRankings(id: string, period = 'today'): Promise<{ rankings: any[] }> {
    return request(`/api/groups/${id}/rankings?period=${period}`);
  },

  // Tasks
  async getTasks(): Promise<{ tasks: TaskItem[] }> {
    return request('/api/tasks');
  },

  async addTask(data: Partial<TaskItem>): Promise<{ task: TaskItem }> {
    return request('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateTask(id: string, updates: Partial<TaskItem>): Promise<{ task: TaskItem }> {
    return request(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteTask(id: string): Promise<{ success: boolean }> {
    return request(`/api/tasks/${id}`, { method: 'DELETE' });
  },

  // Timetable
  async getTimetable(): Promise<{ timetable: TimetableBlock[] }> {
    return request('/api/timetable');
  },

  async saveTimetable(blocks: TimetableBlock[]): Promise<{ success: boolean; timetable: TimetableBlock[] }> {
    return request('/api/timetable', {
      method: 'POST',
      body: JSON.stringify({ blocks }),
    });
  },

  // Books
  async getBooks(): Promise<{ books: BookItem[] }> {
    return request('/api/books');
  },

  async addBook(data: Partial<BookItem>): Promise<{ book: BookItem }> {
    return request('/api/books', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateBook(id: string, updates: Partial<BookItem>): Promise<{ book: BookItem }> {
    return request(`/api/books/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteBook(id: string): Promise<{ success: boolean }> {
    return request(`/api/books/${id}`, { method: 'DELETE' });
  },

  // NCERT Official Textbooks & Reading
  async getNCERTBooks(params?: { classLevel?: string; subject?: string; language?: string; search?: string }): Promise<{ books: NCERTBook[] }> {
    const query = new URLSearchParams();
    if (params?.classLevel) query.append('classLevel', params.classLevel);
    if (params?.subject) query.append('subject', params.subject);
    if (params?.language) query.append('language', params.language);
    if (params?.search) query.append('search', params.search);
    const qs = query.toString();
    return request(`/api/ncert/books${qs ? '?' + qs : ''}`);
  },

  async getNCERTBook(id: string): Promise<{ book: NCERTBook }> {
    return request(`/api/ncert/books/${id}`);
  },

  async getMyBooks(): Promise<{
    myBooks: { progress: UserBookProgress; book: NCERTBook }[];
    bookmarked: { progress: UserBookProgress; book: NCERTBook }[];
    recent: { progress: UserBookProgress; book: NCERTBook }[];
  }> {
    return request('/api/ncert/my-books');
  },

  async updateNCERTProgress(params: {
    bookId: string;
    currentPage: number;
    currentChapter?: number;
    totalPages?: number;
    bookmarkedPages?: number[];
    isBookmarked?: boolean;
  }): Promise<{ progress: UserBookProgress }> {
    return request('/api/ncert/progress', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async toggleBookBookmark(bookId: string): Promise<{ isBookmarked: boolean }> {
    return request('/api/ncert/toggle-bookmark', {
      method: 'POST',
      body: JSON.stringify({ bookId }),
    });
  },

  // Notes & Multi-Color Highlighting
  async getNotes(params?: { subjectId?: string; bookId?: string; search?: string }): Promise<{ notes: UploadedNote[] }> {
    const query = new URLSearchParams();
    if (params?.subjectId) query.append('subjectId', params.subjectId);
    if (params?.bookId) query.append('bookId', params.bookId);
    if (params?.search) query.append('search', params.search);
    const qs = query.toString();
    return request(`/api/notes${qs ? '?' + qs : ''}`);
  },

  async getNote(id: string): Promise<{ note: UploadedNote }> {
    return request(`/api/notes/${id}`);
  },

  async createNote(data: Partial<UploadedNote>): Promise<{ note: UploadedNote }> {
    return request('/api/notes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateNote(id: string, data: Partial<UploadedNote>): Promise<{ note: UploadedNote }> {
    return request(`/api/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteNote(id: string): Promise<{ success: boolean }> {
    return request(`/api/notes/${id}`, { method: 'DELETE' });
  },

  async addNoteHighlight(noteId: string, data: { text: string; color: HighlightColor; note?: string }): Promise<{ highlight: NoteHighlight; note: UploadedNote }> {
    return request(`/api/notes/${noteId}/highlights`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async removeNoteHighlight(noteId: string, highlightId: string): Promise<{ success: boolean; note: UploadedNote }> {
    return request(`/api/notes/${noteId}/highlights/${highlightId}`, { method: 'DELETE' });
  },

  // App Blocker & Distraction Shield
  async getAppBlockConfig(): Promise<{ config: AppBlockConfig }> {
    return request('/api/app-block/config');
  },

  async updateAppBlockConfig(updates: Partial<AppBlockConfig>): Promise<{ config: AppBlockConfig }> {
    return request('/api/app-block/config', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Challenges
  async getChallenges(): Promise<{ challenges: ChallengeItem[] }> {
    return request('/api/challenges');
  },

  async createChallenge(data: Partial<ChallengeItem>): Promise<{ challenge: ChallengeItem }> {
    return request('/api/challenges', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async joinChallenge(id: string): Promise<{ success: boolean }> {
    return request(`/api/challenges/${id}/join`, { method: 'POST' });
  },

  // Friends
  async getFriends(): Promise<{ friends: any[] }> {
    return request('/api/friends');
  },

  async addFriend(friendEmailOrUsername: string): Promise<{ success: boolean; friend: any }> {
    return request('/api/friends/add', {
      method: 'POST',
      body: JSON.stringify({ friendEmailOrUsername }),
    });
  },

  // Edit Logs
  async getEditLogs(): Promise<{ logs: EditLogItem[] }> {
    return request('/api/edit-logs');
  },

  // Statistics
  async getStatistics(period = 'today'): Promise<{
    totalStudySeconds: number;
    sessionCount: number;
    averageSessionSeconds: number;
    longestSessionSeconds: number;
    streak: number;
    minStreakMinutes: number;
    subjectBreakdown: Array<{ name: string; color: string; icon: string; seconds: number }>;
    past7Days: Array<{ date: string; label: string; seconds: number }>;
  }> {
    return request(`/api/statistics?period=${period}`);
  },

  // D-Day Countdowns
  async getDDays(): Promise<{ ddays: DDayEvent[] }> {
    return request('/api/ddays');
  },

  async addDDay(data: { title: string; targetDate: string; category?: string }): Promise<{ dday: DDayEvent }> {
    return request('/api/ddays', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteDDay(id: string): Promise<{ success: boolean }> {
    return request(`/api/ddays/${id}`, { method: 'DELETE' });
  },

  // 10-Minute Daily Planner
  async getPlanner(date: string): Promise<{ blocks: PlannerBlock[] }> {
    return request(`/api/planner?date=${date}`);
  },

  async savePlanner(date: string, blocks: PlannerBlock[]): Promise<{ success: boolean; blocks: PlannerBlock[] }> {
    return request('/api/planner', {
      method: 'POST',
      body: JSON.stringify({ date, blocks }),
    });
  },

  // Achievements
  async getAchievements(): Promise<{ achievements: AchievementItem[] }> {
    return request('/api/achievements');
  },

  // Global Search
  async search(query: string): Promise<{
    subjects: Subject[];
    tasks: TaskItem[];
    books: BookItem[];
    groups: StudyGroup[];
    sessions: StudySession[];
  }> {
    return request(`/api/search?q=${encodeURIComponent(query)}`);
  },

  // Sync offline queue
  async syncOfflineData(): Promise<{ success: boolean; syncedSessions: number }> {
    const offlineSessions = getOfflineSessions();
    if (offlineSessions.length === 0) return { success: true, syncedSessions: 0 };

    const res = await request<{ success: boolean; syncedSessions: number }>('/api/sync', {
      method: 'POST',
      body: JSON.stringify({ offlineSessions }),
    });
    if (res.success) {
      clearOfflineSessions();
    }
    return res;
  },

  // Question Tests & Question Paper PDFs
  async getQuestionTests(): Promise<{ tests: QuestionTest[] }> {
    return request('/api/question-tests');
  },

  async getQuestionTestById(id: string): Promise<{ test: QuestionTest }> {
    return request(`/api/question-tests/${id}`);
  },

  async uploadQuestionPdf(payload: {
    fileName: string;
    fileSize?: number;
    rawText?: string;
    fileDataUrl?: string;
    subjectClass?: string;
    subjectName?: string;
  }): Promise<{ test: QuestionTest; message: string }> {
    return request('/api/question-tests/upload', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateQuestionTest(id: string, updates: Partial<QuestionTest>): Promise<{ test: QuestionTest }> {
    return request(`/api/question-tests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async submitQuestionTest(id: string, payload: {
    userAnswers: Record<string, string | string[]>;
    timeSpentSeconds: number;
  }): Promise<{ test: QuestionTest }> {
    return request(`/api/question-tests/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async deleteQuestionTest(id: string): Promise<{ success: boolean }> {
    return request(`/api/question-tests/${id}`, { method: 'DELETE' });
  },

  // NEET Question Bank & Practice
  async getNeetQuestions(params?: {
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
  }): Promise<{ questions: NEETQuestion[]; total: number; chapters: string[]; topics: string[] }> {
    const q = new URLSearchParams();
    if (params?.subject) q.set('subject', params.subject);
    if (params?.chapter) q.set('chapter', params.chapter);
    if (params?.topic) q.set('topic', params.topic);
    if (params?.difficulty) q.set('difficulty', params.difficulty);
    if (params?.isPYQ !== undefined) q.set('isPYQ', String(params.isPYQ));
    if (params?.status) q.set('status', params.status);
    if (params?.bookmarked !== undefined) q.set('bookmarked', String(params.bookmarked));
    if (params?.search) q.set('search', params.search);
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.offset) q.set('offset', String(params.offset));
    return request(`/api/neet/questions?${q.toString()}`);
  },

  async getNeetQuestionById(id: string): Promise<{ question: NEETQuestion }> {
    return request(`/api/neet/questions/${id}`);
  },

  async addNeetQuestion(question: Partial<NEETQuestion>): Promise<{ question: NEETQuestion }> {
    return request('/api/neet/questions', {
      method: 'POST',
      body: JSON.stringify(question),
    });
  },

  async bulkAddNeetQuestions(questions: any[]): Promise<{ success: boolean; count: number; questions: NEETQuestion[] }> {
    return request('/api/neet/questions/bulk', {
      method: 'POST',
      body: JSON.stringify({ questions }),
    });
  },

  async updateNeetQuestion(id: string, updates: Partial<NEETQuestion>): Promise<{ question: NEETQuestion }> {
    return request(`/api/neet/questions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteNeetQuestion(id: string): Promise<{ success: boolean }> {
    return request(`/api/neet/questions/${id}`, { method: 'DELETE' });
  },

  async attemptNeetQuestion(id: string, selectedOption: string, isCorrect: boolean, timeSpentSeconds: number): Promise<{ question: NEETQuestion }> {
    return request(`/api/neet/questions/${id}/attempt`, {
      method: 'POST',
      body: JSON.stringify({ selectedOption, isCorrect, timeSpentSeconds }),
    });
  },

  async toggleBookmarkNeetQuestion(id: string): Promise<{ question: NEETQuestion }> {
    return request(`/api/neet/questions/${id}/bookmark`, { method: 'POST' });
  },

  async reportNeetQuestion(id: string): Promise<{ success: boolean }> {
    return request(`/api/neet/questions/${id}/report`, { method: 'POST' });
  },

  // NEET Goals & Analytics
  async getNeetPracticeGoal(): Promise<{ goal: StudentPracticeGoal }> {
    return request('/api/neet/goals');
  },

  async updateNeetPracticeGoal(updates: Partial<StudentPracticeGoal>): Promise<{ goal: StudentPracticeGoal }> {
    return request('/api/neet/goals', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async getNeetAnalytics(): Promise<{ analytics: any }> {
    return request('/api/neet/analytics');
  },

  // PDF Annotations
  async getPdfAnnotations(pdfId: string, pageNumber?: number): Promise<{ annotations: PdfAnnotationItem[] }> {
    const q = new URLSearchParams({ pdfId });
    if (pageNumber !== undefined) q.set('pageNumber', String(pageNumber));
    return request(`/api/neet/pdf-annotations?${q.toString()}`);
  },

  async savePdfAnnotation(annotation: Partial<PdfAnnotationItem>): Promise<{ annotation: PdfAnnotationItem }> {
    return request('/api/neet/pdf-annotations', {
      method: 'POST',
      body: JSON.stringify(annotation),
    });
  },

  async deletePdfAnnotation(id: string): Promise<{ success: boolean }> {
    return request(`/api/neet/pdf-annotations/${id}`, { method: 'DELETE' });
  },

  // Personal Study Notes
  async getPersonalNotes(params?: { subject?: string; search?: string }): Promise<{ notes: PersonalStudyNote[] }> {
    const q = new URLSearchParams();
    if (params?.subject) q.set('subject', params.subject);
    if (params?.search) q.set('search', params.search);
    return request(`/api/neet/personal-notes?${q.toString()}`);
  },

  async createPersonalNote(note: Partial<PersonalStudyNote>): Promise<{ note: PersonalStudyNote }> {
    return request('/api/neet/personal-notes', {
      method: 'POST',
      body: JSON.stringify(note),
    });
  },

  async updatePersonalNote(id: string, updates: Partial<PersonalStudyNote>): Promise<{ note: PersonalStudyNote }> {
    return request(`/api/neet/personal-notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deletePersonalNote(id: string): Promise<{ success: boolean }> {
    return request(`/api/neet/personal-notes/${id}`, { method: 'DELETE' });
  },

  async getAdminStats(): Promise<{ stats: any }> {
    return request('/api/neet/admin/stats');
  },

  // Spotify Study Music API
  async getSpotifyStatus(): Promise<SpotifyStatusResponse> {
    return request('/api/spotify/status');
  },

  async getSpotifyAuthUrl(): Promise<{ configured: boolean; url: string; redirectUri: string; message?: string }> {
    return request('/api/spotify/auth-url');
  },

  async disconnectSpotify(): Promise<{ success: boolean }> {
    return request('/api/spotify/disconnect', { method: 'POST' });
  },

  async saveSpotifyConfig(clientId: string, clientSecret?: string): Promise<{ success: boolean }> {
    return request('/api/spotify/config', {
      method: 'POST',
      body: JSON.stringify({ clientId, clientSecret }),
    });
  },

  async getSpotifyPlaylists(): Promise<{ playlists: SpotifyUserPlaylist[] }> {
    return request('/api/spotify/playlists');
  },

  async getSpotifyCurrentPlayback(): Promise<{ isPlaying: boolean; item?: any }> {
    return request('/api/spotify/current');
  },

  // Reset App Data
  async resetAppData(): Promise<{ success: boolean; message: string }> {
    return request('/api/reset', { method: 'POST' });
  },
};

// Formatting helpers
export function formatSecondsToDigital(totalSeconds: number): string {
  const sec = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function formatSecondsToHuman(totalSeconds: number): string {
  const sec = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h === 0 && m === 0) {
    return `${sec}s`;
  }
  if (h === 0) {
    return `${m}m`;
  }
  return `${h}h ${m}m`;
}


export function calculateDDay(targetDateStr: string): { label: string; daysDiff: number; isPast: boolean } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDateStr);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { label: 'D-DAY', daysDiff: 0, isPast: false };
  } else if (diffDays > 0) {
    return { label: `D-${diffDays}`, daysDiff: diffDays, isPast: false };
  } else {
    return { label: `D+${Math.abs(diffDays)}`, daysDiff: diffDays, isPast: true };
  }
}

