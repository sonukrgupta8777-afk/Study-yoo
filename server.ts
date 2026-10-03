import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { db, hashPassword, defaultPreferences, UserAccount } from './server/database.js';
import { StudySession, ActiveTimerState, GroupChatMessage, TaskItem, BookItem, TimetableBlock, UploadedNote, NoteHighlight, AppBlockConfig, PdfAnnotationItem, PersonalStudyNote, NEETQuestion, QuestionTest } from './src/types/index.js';

async function parsePdfQuestions(params: {
  fileName?: string;
  fileSize?: number;
  rawText?: string;
  fileDataUrl?: string;
  subjectClass?: string;
  subjectName?: string;
}): Promise<QuestionTest> {
  return {
    id: `test_${Date.now()}`,
    userId: 'user_default',
    title: params.fileName ? params.fileName.replace(/\.pdf$/i, '') : 'Uploaded Question Paper',
    fileName: params.fileName || 'Uploaded_Paper.pdf',
    fileSize: params.fileSize || 0,
    fileDataUrl: params.fileDataUrl,
    totalQuestions: 0,
    timeLimitMinutes: 60,
    timeSpentSeconds: 0,
    hasAnswerKey: false,
    userAnswers: {},
    markedQuestions: [],
    subjectClass: params.subjectClass || 'General',
    subjectName: params.subjectName || 'Study',
    status: 'in_progress',
    questions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

const app = express();
const isProd = process.env.NODE_ENV === 'production';
const PORT = isProd && process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to authenticate request (Bearer token or cookie or header userId for seamless dev)
function getAuthUser(req: Request): UserAccount | undefined {
  const authHeader = req.headers.authorization;
  let userId = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    userId = authHeader.substring(7);
  } else if (req.headers['x-user-id']) {
    userId = req.headers['x-user-id'] as string;
  }

  if (!userId) {
    // Default to the seeded primary user (Monu)
    return db.findUserById('user_monu_1');
  }

  return db.findUserById(userId) || db.findUserById('user_monu_1');
}

// In-memory SSE connections for real-time live group updates
type SSEClient = {
  id: string;
  res: Response;
  groupId?: string;
  userId: string;
};
const sseClients: SSEClient[] = [];

function broadcastToGroup(groupId: string, event: string, payload: any) {
  const message = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  sseClients.forEach(client => {
    if (!client.groupId || client.groupId === groupId) {
      try {
        client.res.write(message);
      } catch (err) {
        // ignore closed socket
      }
    }
  });
}

function broadcastGlobal(event: string, payload: any) {
  const message = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  sseClients.forEach(client => {
    try {
      client.res.write(message);
    } catch (err) {
      // ignore
    }
  });
}

// ==========================================
// AUTHENTICATION & PROFILE APIS
// ==========================================
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password required' });
    return;
  }
  const user = db.findUserByEmail(email);
  if (!user || user.passwordHash !== hashPassword(password)) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }
  const { passwordHash, pinHash, ...safeUser } = user;
  res.json({ user: safeUser, token: user.id });
});

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    res.status(400).json({ error: 'Username, email and password required' });
    return;
  }
  const existing = db.findUserByEmail(email);
  if (existing) {
    res.status(400).json({ error: 'User with this email already exists' });
    return;
  }

  const newUser: UserAccount = {
    id: 'user_' + Date.now(),
    username,
    email,
    passwordHash: hashPassword(password),
    avatar: '🎓',
    dailyGoalMinutes: 360,
    weeklyGoalMinutes: 2400,
    monthlyGoalMinutes: 9600,
    minStreakMinutes: 30,
    hasPin: false,
    isPinLocked: false,
    createdAt: new Date().toISOString(),
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

  db.createUser(newUser);
  // Auto-seed default subjects
  const defaultSubs = [
    { id: 'sub_' + Date.now() + '_1', userId: newUser.id, name: 'Core Study', icon: '📖', color: '#6366f1', order: 1, isArchived: false, createdAt: new Date().toISOString() },
    { id: 'sub_' + Date.now() + '_2', userId: newUser.id, name: 'Practice & Revision', icon: '⚡', color: '#10b981', order: 2, isArchived: false, createdAt: new Date().toISOString() },
  ];
  defaultSubs.forEach(s => db.addSubject(s));

  const { passwordHash: _, pinHash: __, ...safeUser } = newUser;
  res.json({ user: safeUser, token: newUser.id });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const { passwordHash, pinHash, ...safeUser } = user;
  res.json({ user: safeUser, token: user.id });
});

app.put('/api/user/profile', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const { username, avatar, dailyGoalMinutes, weeklyGoalMinutes, monthlyGoalMinutes, minStreakMinutes, privacySettings } = req.body;
  const updated = db.updateUser(user.id, {
    ...(username ? { username } : {}),
    ...(avatar ? { avatar } : {}),
    ...(dailyGoalMinutes !== undefined ? { dailyGoalMinutes: Number(dailyGoalMinutes) } : {}),
    ...(weeklyGoalMinutes !== undefined ? { weeklyGoalMinutes: Number(weeklyGoalMinutes) } : {}),
    ...(monthlyGoalMinutes !== undefined ? { monthlyGoalMinutes: Number(monthlyGoalMinutes) } : {}),
    ...(minStreakMinutes !== undefined ? { minStreakMinutes: Number(minStreakMinutes) } : {}),
    ...(privacySettings ? { privacySettings: { ...user.privacySettings, ...privacySettings } } : {}),
  });

  if (dailyGoalMinutes) {
    db.logEdit(user.id, 'Daily goal changed', `Updated to ${Math.round(dailyGoalMinutes / 60)} hours`);
  }

  const { passwordHash, pinHash, ...safeUser } = updated!;
  res.json({ user: safeUser });
});

app.put('/api/user/preferences', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const current = user.preferences || defaultPreferences;
  const merged = { ...current, ...req.body };
  db.updateUser(user.id, { preferences: merged });
  res.json({ preferences: merged });
});

app.post('/api/user/pin/set', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const { pin } = req.body;
  if (!pin || pin.length < 4) {
    res.status(400).json({ error: 'PIN must be at least 4 digits' });
    return;
  }
  db.updateUser(user.id, { pinHash: hashPassword(pin), hasPin: true, isPinLocked: true });
  db.logEdit(user.id, 'Security updated', 'App PIN lock configured');
  res.json({ success: true, hasPin: true });
});

app.post('/api/user/pin/verify', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const { pin } = req.body;
  if (!user.pinHash || user.pinHash === hashPassword(pin)) {
    db.updateUser(user.id, { isPinLocked: false });
    res.json({ valid: true });
  } else {
    res.status(401).json({ valid: false, error: 'Incorrect PIN' });
  }
});

// ==========================================
// REAL-TIME SERVER-SENT EVENTS
// ==========================================
app.get('/api/realtime/stream', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const groupId = req.query.groupId as string | undefined;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const clientId = 'sse_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const client: SSEClient = {
    id: clientId,
    res,
    groupId,
    userId: user?.id || 'anonymous',
  };
  sseClients.push(client);

  // Send initial ping
  res.write(`event: connected\ndata: ${JSON.stringify({ clientId, timestamp: Date.now() })}\n\n`);

  req.on('close', () => {
    const idx = sseClients.findIndex(c => c.id === clientId);
    if (idx !== -1) sseClients.splice(idx, 1);
  });
});

// ==========================================
// TIMER & ACTIVE SESSION APIS (Zero frame counting - Pure timestamp logic)
// ==========================================
app.get('/api/timer/active', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const active = db.getActiveTimer(user.id);
  res.json({ active: active || null });
});

app.post('/api/timer/start', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const { subjectId, subjectName, subjectColor, subjectIcon, mode = 'stopwatch', targetDurationSeconds } = req.body;
  const now = Date.now();

  const activeTimer: ActiveTimerState = {
    userId: user.id,
    subjectId,
    subjectName,
    subjectColor,
    subjectIcon,
    startTimestamp: now,
    lastHeartbeat: now,
    mode,
    isPaused: false,
    accumulatedSeconds: 0,
    targetDurationSeconds,
  };

  db.setActiveTimer(user.id, activeTimer);

  // Log in edit log
  db.logEdit(user.id, 'Session started', `Started ${subjectName} (${mode})`);

  // Broadcast to all groups user belongs to
  broadcastGlobal('timer_started', {
    userId: user.id,
    username: user.username,
    avatar: user.avatar,
    subjectName,
    subjectColor,
    subjectIcon,
    startTimestamp: now,
  });

  // Post system notice to Padhe Le Yrr or joined groups
  const userGroups = db.getGroups();
  userGroups.forEach(grp => {
    db.addGroupMessage({
      id: 'msg_sys_' + Date.now(),
      groupId: grp.id,
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
      text: `${user.username} started studying ${subjectName}`,
      type: 'study_start',
      createdAt: new Date().toISOString(),
    });
  });

  res.json({ active: activeTimer });
});

app.post('/api/timer/pause', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const active = db.getActiveTimer(user.id);
  if (!active) {
    res.status(400).json({ error: 'No active timer' });
    return;
  }

  const now = Date.now();
  if (!active.isPaused) {
    const elapsedSinceStart = Math.floor((now - active.startTimestamp) / 1000);
    active.accumulatedSeconds += Math.max(0, elapsedSinceStart);
    active.isPaused = true;
    active.lastHeartbeat = now;
    db.setActiveTimer(user.id, active);
  }

  broadcastGlobal('timer_paused', { userId: user.id });
  res.json({ active });
});

app.post('/api/timer/resume', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const active = db.getActiveTimer(user.id);
  if (!active) {
    res.status(400).json({ error: 'No active timer' });
    return;
  }

  const now = Date.now();
  if (active.isPaused) {
    active.isPaused = false;
    active.startTimestamp = now;
    active.lastHeartbeat = now;
    db.setActiveTimer(user.id, active);
  }

  broadcastGlobal('timer_resumed', { userId: user.id });
  res.json({ active });
});

app.post('/api/timer/reset', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const active = db.getActiveTimer(user.id);
  if (active) {
    active.startTimestamp = Date.now();
    active.accumulatedSeconds = 0;
    active.isPaused = false;
    db.setActiveTimer(user.id, active);
    broadcastGlobal('timer_started', { userId: user.id });
    res.json({ active });
  } else {
    res.json({ active: null });
  }
});

app.post('/api/timer/cancel', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  db.removeActiveTimer(user.id);
  broadcastGlobal('timer_finished', { userId: user.id, cancelled: true });
  res.json({ success: true });
});

app.post('/api/timer/finish', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const { notes = '', customDurationSeconds } = req.body;
  const active = db.removeActiveTimer(user.id);

  const now = Date.now();
  let duration = customDurationSeconds;

  if (active) {
    const elapsed = active.isPaused ? 0 : Math.floor((now - active.startTimestamp) / 1000);
    duration = (active.accumulatedSeconds || 0) + elapsed;
  }

  duration = Math.max(1, duration || 0);

  const todayStr = new Date().toISOString().split('T')[0];
  const subjectName = active?.subjectName || req.body.subjectName || 'Study';
  const subjectId = active?.subjectId || req.body.subjectId || 'sub_general';
  const subjectColor = active?.subjectColor || req.body.subjectColor || '#6366f1';
  const subjectIcon = active?.subjectIcon || req.body.subjectIcon || '📖';

  const session: StudySession = {
    id: 'sess_' + Date.now(),
    userId: user.id,
    subjectId,
    subjectName,
    subjectColor,
    subjectIcon,
    startTimestamp: active ? active.startTimestamp - (active.accumulatedSeconds * 1000) : now - (duration * 1000),
    endTimestamp: now,
    durationSeconds: duration,
    date: todayStr,
    timerType: active?.mode || 'stopwatch',
    notes,
    sessionStatus: 'completed',
    createdAt: new Date().toISOString(),
  };

  db.addSession(session);
  const minutes = Math.round(duration / 60);
  db.logEdit(user.id, `${subjectName} session saved`, `Completed ${minutes}m study session`);

  // System notice to group
  db.getGroups().forEach(grp => {
    db.addGroupMessage({
      id: 'msg_sys_' + Date.now(),
      groupId: grp.id,
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
      text: `${user.username} finished ${minutes}m of ${subjectName}`,
      type: 'study_finish',
      createdAt: new Date().toISOString(),
    });
  });

  broadcastGlobal('timer_finished', {
    userId: user.id,
    durationSeconds: duration,
    subjectName,
  });

  res.json({ session, message: '✓ Study session saved' });
});

// Study Sessions
app.get('/api/sessions', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const { date, subjectId } = req.query;
  let sessions = db.getSessions(user.id);
  if (date) {
    sessions = sessions.filter(s => s.date === date);
  }
  if (subjectId) {
    sessions = sessions.filter(s => s.subjectId === subjectId);
  }
  sessions.sort((a, b) => b.startTimestamp - a.startTimestamp);
  res.json({ sessions });
});

app.delete('/api/sessions/:id', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const success = db.deleteSession(req.params.id, user.id);
  if (success) {
    db.logEdit(user.id, 'Session deleted', 'Manually removed study session');
  }
  res.json({ success });
});

// ==========================================
// SUBJECTS APIS with Accurate Statistics
// ==========================================
app.get('/api/subjects', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const subjects = db.getSubjects(user.id);
  const sessions = db.getSessions(user.id);

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Calculate 7-day week start
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const oneWeekAgoStr = oneWeekAgo.toISOString().split('T')[0];

  // Calculate 30-day month start
  const oneMonthAgo = new Date();
  oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
  const oneMonthAgoStr = oneMonthAgo.toISOString().split('T')[0];

  const activeTimer = db.getActiveTimer(user.id);
  const activeElapsed = activeTimer && !activeTimer.isPaused
    ? Math.floor((Date.now() - activeTimer.startTimestamp) / 1000) + (activeTimer.accumulatedSeconds || 0)
    : 0;

  const enriched = subjects.map(sub => {
    const subSessions = sessions.filter(s => s.subjectId === sub.id);
    const todaySec = subSessions
      .filter(s => s.date === todayStr)
      .reduce((a, b) => a + b.durationSeconds, 0) +
      (activeTimer && activeTimer.subjectId === sub.id ? activeElapsed : 0);

    const weekSec = subSessions
      .filter(s => s.date >= oneWeekAgoStr)
      .reduce((a, b) => a + b.durationSeconds, 0) +
      (activeTimer && activeTimer.subjectId === sub.id ? activeElapsed : 0);

    const monthSec = subSessions
      .filter(s => s.date >= oneMonthAgoStr)
      .reduce((a, b) => a + b.durationSeconds, 0) +
      (activeTimer && activeTimer.subjectId === sub.id ? activeElapsed : 0);

    const totalSec = subSessions
      .reduce((a, b) => a + b.durationSeconds, 0) +
      (activeTimer && activeTimer.subjectId === sub.id ? activeElapsed : 0);

    return {
      ...sub,
      todaySeconds: todaySec,
      weekSeconds: weekSec,
      monthSeconds: monthSec,
      totalSeconds: totalSec,
    };
  });

  res.json({ subjects: enriched });
});

app.post('/api/subjects', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const { name, icon = '📖', color = '#6366f1' } = req.body;
  if (!name) {
    res.status(400).json({ error: 'Subject name required' });
    return;
  }

  const existing = db.getSubjects(user.id);
  const newSub = db.addSubject({
    id: 'sub_' + Date.now(),
    userId: user.id,
    name,
    icon,
    color,
    order: existing.length + 1,
    isArchived: false,
    createdAt: new Date().toISOString(),
  });

  db.logEdit(user.id, 'Subject created', `Added ${name} ${icon}`);
  res.json({ subject: newSub });
});

app.put('/api/subjects/:id', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const updated = db.updateSubject(req.params.id, user.id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'Subject not found' });
    return;
  }
  db.logEdit(user.id, 'Subject updated', `Modified ${updated.name}`);
  res.json({ subject: updated });
});

app.delete('/api/subjects/:id', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const success = db.deleteSubject(req.params.id, user.id);
  if (success) {
    db.logEdit(user.id, 'Subject deleted', 'Deleted subject');
  }
  res.json({ success });
});

// ==========================================
// GROUPS & REAL-TIME SOCIAL STUDY ROOMS
// ==========================================
app.get('/api/groups', (req: Request, res: Response) => {
  const groups = db.getGroups();
  res.json({ groups });
});

app.post('/api/groups', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const { name, description = '', icon = '📚', isPrivate = false, maxMembers = 50 } = req.body;
  if (!name) {
    res.status(400).json({ error: 'Group name required' });
    return;
  }
  const newGroup = db.createGroup(
    {
      id: 'grp_' + Date.now(),
      name,
      description,
      icon,
      isPrivate,
      ownerId: user.id,
      ownerName: user.username,
      maxMembers,
      memberCount: 1,
      createdAt: new Date().toISOString(),
    },
    user.id
  );

  db.logEdit(user.id, 'Group created', `Created study group ${name}`);
  res.json({ group: newGroup });
});

app.get('/api/groups/:id', (req: Request, res: Response) => {
  const group = db.getGroupById(req.params.id);
  if (!group) {
    res.status(404).json({ error: 'Group not found' });
    return;
  }
  res.json({ group });
});

app.get('/api/groups/:id/members', (req: Request, res: Response) => {
  const members = db.getGroupMembers(req.params.id);
  res.json({ members });
});

app.post('/api/groups/:id/join', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const success = db.addGroupMember(req.params.id, user.id);
  broadcastToGroup(req.params.id, 'member_joined', { userId: user.id, username: user.username });
  res.json({ success });
});

app.post('/api/groups/:id/leave', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const success = db.leaveGroup(req.params.id, user.id);
  res.json({ success });
});

app.get('/api/groups/:id/messages', (req: Request, res: Response) => {
  const messages = db.getGroupMessages(req.params.id);
  res.json({ messages });
});

app.post('/api/groups/:id/messages', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const { text } = req.body;
  if (!text || !text.trim()) {
    res.status(400).json({ error: 'Message cannot be empty' });
    return;
  }

  const msg: GroupChatMessage = {
    id: 'msg_' + Date.now(),
    groupId: req.params.id,
    userId: user.id,
    username: user.username,
    avatar: user.avatar,
    text: text.trim(),
    type: 'chat',
    createdAt: new Date().toISOString(),
  };

  db.addGroupMessage(msg);
  broadcastToGroup(req.params.id, 'chat_message', msg);
  res.json({ message: msg });
});

app.get('/api/groups/:id/rankings', (req: Request, res: Response) => {
  const { period = 'today' } = req.query;
  const members = db.getGroupMembers(req.params.id);
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const oneWeekAgoStr = oneWeekAgo.toISOString().split('T')[0];

  const oneMonthAgo = new Date();
  oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
  const oneMonthAgoStr = oneMonthAgo.toISOString().split('T')[0];

  const rankings = members.map(m => {
    let sessions = db.getSessions(m.userId);
    if (period === 'today') {
      sessions = sessions.filter(s => s.date === todayStr);
    } else if (period === 'week') {
      sessions = sessions.filter(s => s.date >= oneWeekAgoStr);
    } else if (period === 'month') {
      sessions = sessions.filter(s => s.date >= oneMonthAgoStr);
    }

    const totalSeconds = sessions.reduce((a, b) => a + b.durationSeconds, 0) +
      (period === 'today' && m.status === 'studying' ? m.currentSessionDuration : 0);

    return {
      userId: m.userId,
      username: m.username,
      avatar: m.avatar,
      studySeconds: totalSeconds,
      sessionCount: sessions.length,
      status: m.status,
    };
  });

  rankings.sort((a, b) => b.studySeconds - a.studySeconds);
  const rankedWithPosition = rankings.map((r, idx) => ({ ...r, rank: idx + 1 }));
  res.json({ rankings: rankedWithPosition });
});

// ==========================================
// TASKS, TIMETABLE, BOOKS, CHALLENGES, STATS
// ==========================================
app.get('/api/tasks', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const tasks = db.getTasks(user.id);
  res.json({ tasks });
});

app.post('/api/tasks', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const { title, subjectId, subjectName, dueDate, priority = 'medium', estimatedMinutes = 30, notes = '' } = req.body;
  if (!title) {
    res.status(400).json({ error: 'Task title required' });
    return;
  }

  const task: TaskItem = {
    id: 'task_' + Date.now(),
    userId: user.id,
    subjectId,
    subjectName,
    title,
    dueDate: dueDate || new Date().toISOString().split('T')[0],
    priority,
    estimatedMinutes: Number(estimatedMinutes),
    notes,
    isCompleted: false,
    createdAt: new Date().toISOString(),
  };

  db.addTask(task);
  db.logEdit(user.id, 'Task created', `Added task "${title}"`);
  res.json({ task });
});

app.put('/api/tasks/:id', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const updates = req.body;
  if (updates.isCompleted && !updates.completedAt) {
    updates.completedAt = new Date().toISOString();
  }
  const updated = db.updateTask(req.params.id, user.id, updates);
  if (updated?.isCompleted) {
    db.logEdit(user.id, 'Task completed', `Finished "${updated.title}"`);
  }
  res.json({ task: updated });
});

app.delete('/api/tasks/:id', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const success = db.deleteTask(req.params.id, user.id);
  res.json({ success });
});

app.get('/api/timetable', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const blocks = db.getTimetable(user.id);
  res.json({ timetable: blocks });
});

app.post('/api/timetable', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const { blocks } = req.body;
  db.setTimetable(user.id, blocks || []);
  db.logEdit(user.id, 'Timetable updated', 'Updated weekly timetable schedule');
  res.json({ success: true, timetable: blocks });
});

app.get('/api/books', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const books = db.getBooks(user.id);
  res.json({ books });
});

app.post('/api/books', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const { title, author = '', subjectId, totalPages = 100, currentPage = 0, status = 'reading', notes = '' } = req.body;
  if (!title) {
    res.status(400).json({ error: 'Book title required' });
    return;
  }

  const book: BookItem = {
    id: 'book_' + Date.now(),
    userId: user.id,
    title,
    author,
    subjectId,
    totalPages: Number(totalPages),
    currentPage: Number(currentPage),
    status,
    notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.addBook(book);
  db.logEdit(user.id, 'Book added', `Added book "${title}"`);
  res.json({ book });
});

app.put('/api/books/:id', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const updated = db.updateBook(req.params.id, user.id, req.body);
  res.json({ book: updated });
});

app.delete('/api/books/:id', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const success = db.deleteBook(req.params.id, user.id);
  res.json({ success });
});

// ==========================================
// NCERT TEXTBOOKS & READING PROGRESS APIS
// ==========================================
app.get('/api/ncert/books', (req: Request, res: Response) => {
  const { classLevel, subject, language, search } = req.query;
  const books = db.getNCERTBooks({
    classLevel: classLevel as string,
    subject: subject as string,
    language: language as string,
    search: search as string,
  });
  res.json({ books });
});

app.get('/api/ncert/books/:id', (req: Request, res: Response) => {
  const book = db.getNCERTBookById(req.params.id);
  if (!book) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }
  res.json({ book });
});

app.get('/api/ncert/my-books', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const progressList = db.getUserBookProgress(user.id);
  const allBooks = db.getNCERTBooks();

  const myBooks = progressList.map(prog => {
    const book = allBooks.find(b => b.id === prog.bookId);
    return {
      progress: prog,
      book,
    };
  }).filter(item => !!item.book);

  myBooks.sort((a, b) => new Date(b.progress.lastReadAt).getTime() - new Date(a.progress.lastReadAt).getTime());

  res.json({
    myBooks,
    bookmarked: myBooks.filter(m => m.progress.isBookmarked),
    recent: myBooks.slice(0, 6),
  });
});

app.post('/api/ncert/progress', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const { bookId, currentPage, currentChapter, totalPages, bookmarkedPages, isBookmarked } = req.body;
  if (!bookId) {
    res.status(400).json({ error: 'bookId is required' });
    return;
  }
  const progress = db.saveUserBookProgress(user.id, {
    bookId,
    currentPage: Number(currentPage),
    currentChapter: currentChapter !== undefined ? Number(currentChapter) : undefined,
    totalPages: totalPages !== undefined ? Number(totalPages) : undefined,
    bookmarkedPages: Array.isArray(bookmarkedPages) ? bookmarkedPages : undefined,
    isBookmarked: typeof isBookmarked === 'boolean' ? isBookmarked : undefined,
  });
  res.json({ progress });
});

app.post('/api/ncert/toggle-bookmark', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const { bookId } = req.body;
  if (!bookId) {
    res.status(400).json({ error: 'bookId is required' });
    return;
  }
  const isBookmarked = db.toggleBookBookmark(user.id, bookId);
  res.json({ isBookmarked });
});

// ==========================================
// UPLOADED NOTES & MULTI-COLOR HIGHLIGHTS
// ==========================================
app.get('/api/notes', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const { subjectId, bookId, search } = req.query;
  const notes = db.getNotes(user.id, {
    subjectId: subjectId as string,
    bookId: bookId as string,
    search: search as string,
  });
  res.json({ notes });
});

app.get('/api/notes/:id', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const note = db.getNoteById(req.params.id, user.id);
  if (!note) {
    res.status(404).json({ error: 'Note not found' });
    return;
  }
  res.json({ note });
});

app.post('/api/notes', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const {
    title,
    subjectId,
    subjectName,
    subjectColor,
    bookId,
    bookTitle,
    chapterNumber,
    chapterTitle,
    content = '',
    fileUrl,
    fileName,
    fileSize,
    fileType,
    highlights = [],
    tags = [],
  } = req.body;

  if (!title) {
    res.status(400).json({ error: 'Note title is required' });
    return;
  }

  const now = new Date().toISOString();
  const note: UploadedNote = {
    id: 'note_' + Date.now(),
    userId: user.id,
    title,
    subjectId,
    subjectName,
    subjectColor,
    bookId,
    bookTitle,
    chapterNumber: chapterNumber !== undefined ? Number(chapterNumber) : undefined,
    chapterTitle,
    content,
    fileUrl,
    fileName,
    fileSize,
    fileType,
    highlights,
    tags,
    createdAt: now,
    updatedAt: now,
  };

  db.addNote(note);
  db.logEdit(user.id, 'Note uploaded', `Added note "${title}"`);
  res.json({ note });
});

app.put('/api/notes/:id', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const updated = db.updateNote(req.params.id, user.id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'Note not found' });
    return;
  }
  res.json({ note: updated });
});

app.delete('/api/notes/:id', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const success = db.deleteNote(req.params.id, user.id);
  res.json({ success });
});

app.post('/api/notes/:id/highlights', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const { text, color = 'yellow', note: stickyComment } = req.body;
  if (!text) {
    res.status(400).json({ error: 'Highlight text is required' });
    return;
  }
  const highlight: NoteHighlight = {
    id: 'hl_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    text,
    color,
    note: stickyComment,
    createdAt: new Date().toISOString(),
  };

  const updated = db.addNoteHighlight(req.params.id, user.id, highlight);
  if (!updated) {
    res.status(404).json({ error: 'Note not found' });
    return;
  }
  res.json({ highlight, note: updated });
});

app.delete('/api/notes/:id/highlights/:highlightId', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const updated = db.removeNoteHighlight(req.params.id, req.params.highlightId, user.id);
  res.json({ success: !!updated, note: updated });
});

// ==========================================
// APP BLOCKER & DISTRACTION SHIELD
// ==========================================
app.get('/api/app-block/config', (_req: Request, res: Response) => {
  const config = db.getAppBlockConfig();
  res.json({ config });
});

app.put('/api/app-block/config', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const config = db.updateAppBlockConfig(req.body);
  db.logEdit(user.id, 'App Blocker updated', `App block state: ${config.enabled ? 'Enabled' : 'Disabled'}`);
  res.json({ config });
});

// ==========================================
// QUESTION PDF & INTERACTIVE TEST APIS
// ==========================================
app.get('/api/question-tests', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const tests = db.getQuestionTests(user.id);
  res.json({ tests });
});

app.get('/api/question-tests/:id', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const test = db.getQuestionTestById(req.params.id, user.id);
  if (!test) {
    res.status(404).json({ error: 'Test not found' });
    return;
  }
  res.json({ test });
});

app.post('/api/question-tests/upload', async (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  try {
    const { fileName = 'Untitled_Question_Paper.pdf', fileSize, rawText, fileDataUrl, subjectClass, subjectName } = req.body;
    const test = await parsePdfQuestions({
      fileName,
      fileSize,
      rawText,
      fileDataUrl,
      subjectClass,
      subjectName,
    });
    test.userId = user.id;

    db.saveQuestionTest(test);
    db.logEdit(user.id, 'Question PDF processed', `Extracted ${test.totalQuestions} questions from ${fileName}`);
    res.json({ test, message: 'PDF processed successfully' });
  } catch (err: any) {
    console.error('Error processing Question PDF:', err);
    res.status(500).json({ error: 'Failed to process question PDF', details: err?.message });
  }
});

app.put('/api/question-tests/:id', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const updated = db.updateQuestionTest(req.params.id, user.id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'Test not found' });
    return;
  }
  res.json({ test: updated });
});

app.post('/api/question-tests/:id/submit', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const test = db.getQuestionTestById(req.params.id, user.id);
  if (!test) {
    res.status(404).json({ error: 'Test not found' });
    return;
  }

  const { userAnswers, timeSpentSeconds } = req.body;
  const answers = userAnswers || test.userAnswers || {};

  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;
  let totalScoredMarks = 0;
  const maxPossibleMarks = test.questions.length * 4;

  test.questions.forEach(q => {
    const ans = answers[q.id];
    if (!ans) {
      unansweredCount++;
    } else if (test.hasAnswerKey && q.correctOptionId) {
      if (Array.isArray(q.correctOptionId)) {
        const correctSet = new Set(q.correctOptionId);
        const userSet = new Set(Array.isArray(ans) ? ans : [ans]);
        const isMatch = correctSet.size === userSet.size && [...correctSet].every(v => userSet.has(v));
        if (isMatch) {
          correctCount++;
          totalScoredMarks += 4;
        } else {
          incorrectCount++;
          totalScoredMarks = Math.max(0, totalScoredMarks - 1);
        }
      } else {
        if (String(ans).trim().toUpperCase() === String(q.correctOptionId).trim().toUpperCase()) {
          correctCount++;
          totalScoredMarks += 4;
        } else {
          incorrectCount++;
          totalScoredMarks = Math.max(0, totalScoredMarks - 1);
        }
      }
    } else {
      correctCount++;
    }
  });

  const accuracy = (correctCount + incorrectCount) > 0
    ? Math.round((correctCount / (correctCount + incorrectCount)) * 100)
    : 0;

  const updated = db.updateQuestionTest(req.params.id, user.id, {
    userAnswers: answers,
    timeSpentSeconds: timeSpentSeconds !== undefined ? Number(timeSpentSeconds) : test.timeSpentSeconds,
    status: 'completed',
    score: totalScoredMarks,
    accuracy,
    correctCount,
    incorrectCount,
    unansweredCount,
    completedAt: new Date().toISOString(),
  });

  db.logEdit(user.id, 'Test submitted', `Completed test ${test.title} with score ${totalScoredMarks}/${maxPossibleMarks} (${accuracy}%)`);
  res.json({ test: updated });
});

app.delete('/api/question-tests/:id', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const deleted = db.deleteQuestionTest(req.params.id, user.id);
  res.json({ success: deleted });
});

// ==========================================
// NEET MCQ SYSTEM & PRACTICE ENDPOINTS
// ==========================================
app.get('/api/neet/questions', (req: Request, res: Response) => {
  const { subject, chapter, topic, difficulty, isPYQ, status, bookmarked, search, limit, offset } = req.query;
  const result = db.getNeetQuestions({
    subject: subject as string,
    chapter: chapter as string,
    topic: topic as string,
    difficulty: difficulty as string,
    isPYQ: isPYQ !== undefined ? isPYQ === 'true' : undefined,
    status: status as string,
    bookmarked: bookmarked !== undefined ? bookmarked === 'true' : undefined,
    search: search as string,
    limit: limit ? parseInt(limit as string, 10) : 50,
    offset: offset ? parseInt(offset as string, 10) : 0,
  });
  res.json(result);
});

app.get('/api/neet/questions/:id', (req: Request, res: Response) => {
  const q = db.getNeetQuestionById(req.params.id);
  if (!q) {
    res.status(404).json({ error: 'Question not found' });
    return;
  }
  res.json({ question: q });
});

app.post('/api/neet/questions', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const q = req.body;
  if (!q.questionText || !q.options || !q.correctOptionId) {
    res.status(400).json({ error: 'Invalid question payload' });
    return;
  }
  const newQ = db.addNeetQuestion({
    ...q,
    id: q.id || `custom_mcq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString(),
  });
  db.logEdit(user.id, 'MCQ added', `Added question to ${newQ.subject} - ${newQ.chapter}`);
  res.json({ question: newQ });
});

app.post('/api/neet/questions/bulk', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const { questions = [] } = req.body;
  const added: NEETQuestion[] = [];
  questions.forEach((q: any, idx: number) => {
    const item: NEETQuestion = {
      id: q.id || `uploaded_mcq_${Date.now()}_${idx}`,
      subject: q.subject || 'biology',
      subCategory: q.subCategory,
      classLevel: q.classLevel || 'class_11',
      chapter: q.chapter || 'General Practice',
      topic: q.topic || 'Extracted Questions',
      difficulty: q.difficulty || 'medium',
      questionText: q.questionText || q.text,
      options: q.options || [],
      correctOptionId: q.correctOptionId || 'A',
      explanation: q.explanation || 'Extracted from PDF practice set.',
      source: 'pdf_extracted',
      status: 'unattempted',
      createdAt: new Date().toISOString(),
    };
    db.addNeetQuestion(item);
    added.push(item);
  });
  db.logEdit(user.id, 'Bulk MCQs imported', `Added ${added.length} questions to question bank`);
  res.json({ success: true, count: added.length, questions: added });
});

app.put('/api/neet/questions/:id', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const updated = db.updateNeetQuestion(req.params.id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'Question not found' });
    return;
  }
  res.json({ question: updated });
});

app.delete('/api/neet/questions/:id', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const success = db.deleteNeetQuestion(req.params.id);
  res.json({ success });
});

app.post('/api/neet/questions/:id/attempt', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const { selectedOption, isCorrect, timeSpentSeconds = 30 } = req.body;
  const updated = db.recordMcqAttempt(user.id, req.params.id, selectedOption, !!isCorrect, timeSpentSeconds);
  res.json({ question: updated });
});

app.post('/api/neet/questions/:id/bookmark', (req: Request, res: Response) => {
  const q = db.getNeetQuestionById(req.params.id);
  if (!q) {
    res.status(404).json({ error: 'Question not found' });
    return;
  }
  const updated = db.updateNeetQuestion(req.params.id, { bookmarked: !q.bookmarked });
  res.json({ question: updated });
});

app.post('/api/neet/questions/:id/report', (req: Request, res: Response) => {
  const updated = db.updateNeetQuestion(req.params.id, { reported: true });
  res.json({ success: !!updated });
});

// Student Practice Goal
app.get('/api/neet/goals', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const goal = db.getPracticeGoal(user.id);
  res.json({ goal });
});

app.put('/api/neet/goals', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const goal = db.updatePracticeGoal(user.id, req.body);
  res.json({ goal });
});

// Student Performance Analytics
app.get('/api/neet/analytics', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const analytics = db.getNeetAnalytics(user.id);
  res.json({ analytics });
});

// PDF Annotations
app.get('/api/neet/pdf-annotations', (req: Request, res: Response) => {
  const { pdfId, pageNumber } = req.query;
  if (!pdfId) {
    res.status(400).json({ error: 'pdfId required' });
    return;
  }
  const annotations = db.getPdfAnnotations(
    pdfId as string,
    pageNumber !== undefined ? parseInt(pageNumber as string, 10) : undefined
  );
  res.json({ annotations });
});

app.post('/api/neet/pdf-annotations', (req: Request, res: Response) => {
  const ann = req.body;
  if (!ann.pdfId || ann.pageNumber === undefined || !ann.type) {
    res.status(400).json({ error: 'Missing required annotation parameters' });
    return;
  }
  const item: PdfAnnotationItem = {
    ...ann,
    id: ann.id || `ann_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    createdAt: ann.createdAt || new Date().toISOString(),
  };
  const saved = db.savePdfAnnotation(item);
  res.json({ annotation: saved });
});

app.delete('/api/neet/pdf-annotations/:id', (req: Request, res: Response) => {
  const success = db.deletePdfAnnotation(req.params.id);
  res.json({ success });
});

// Personal Study Notes
app.get('/api/neet/personal-notes', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const { subject, search } = req.query;
  const notes = db.getPersonalNotes(user.id, {
    subject: subject as string,
    search: search as string,
  });
  res.json({ notes });
});

app.post('/api/neet/personal-notes', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const { title, content = '', subject = 'general', chapter = '', tags = [], imageUrl, handwrittenDataUrl } = req.body;
  if (!title) {
    res.status(400).json({ error: 'Title is required' });
    return;
  }
  const note: PersonalStudyNote = {
    id: `pnote_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId: user.id,
    title,
    content,
    subject,
    chapter,
    tags,
    isPinned: false,
    isCompleted: false,
    imageUrl,
    handwrittenDataUrl,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const added = db.addPersonalNote(note);
  db.logEdit(user.id, 'Note created', `Added note "${title}" in ${subject}`);
  res.json({ note: added });
});

app.put('/api/neet/personal-notes/:id', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const updated = db.updatePersonalNote(req.params.id, user.id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'Note not found' });
    return;
  }
  res.json({ note: updated });
});

app.delete('/api/neet/personal-notes/:id', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const success = db.deletePersonalNote(req.params.id, user.id);
  res.json({ success });
});

// Admin Panel Stats
// Reset App Data
app.post('/api/reset', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  db.resetApp(user?.id);
  res.json({ success: true, message: 'App state reset successfully' });
});


// ==========================================
// SPOTIFY OAUTH & STUDY PLAYER API
// ==========================================
function getSpotifyRedirectUri(req: Request): string {
  const origin = (req.headers.origin as string) || (req.headers.referer ? new URL(req.headers.referer as string).origin : '');
  if (origin && !origin.includes('localhost') && origin.includes('.run.app')) {
    return `${origin}/auth/callback`;
  }
  const appUrl = process.env.APP_URL;
  if (appUrl) {
    return `${appUrl.replace(/\/$/, '')}/auth/callback`;
  }
  return 'https://ais-dev-rdry47hne4akl4jigwrlpl-359187372829.asia-southeast1.run.app/auth/callback';
}

async function getValidSpotifyToken(userId: string): Promise<string | null> {
  const auth = db.getSpotifyAuth(userId);
  if (!auth) return null;
  if (Date.now() < auth.expiresAt - 60000) {
    return auth.accessToken;
  }
  if (!auth.refreshToken) return null;

  const config = db.getSpotifyConfig();
  if (!config.clientId || !config.clientSecret) return null;

  try {
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: auth.refreshToken,
      }).toString(),
    });
    if (!res.ok) return null;
    const data = await res.json();
    auth.accessToken = data.access_token;
    auth.expiresAt = Date.now() + (data.expires_in || 3600) * 1000;
    if (data.refresh_token) auth.refreshToken = data.refresh_token;
    db.setSpotifyAuth(userId, auth);
    return auth.accessToken;
  } catch (e) {
    console.error('Error refreshing Spotify token:', e);
    return null;
  }
}

app.get('/api/spotify/status', async (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const config = db.getSpotifyConfig();
  const token = await getValidSpotifyToken(user.id);
  const auth = db.getSpotifyAuth(user.id);
  const redirectUri = getSpotifyRedirectUri(req);

  res.json({
    connected: !!token && !!auth?.profile,
    configured: !!config.clientId,
    profile: auth?.profile || undefined,
    redirectUri,
    clientIdPreview: config.clientId ? `${config.clientId.slice(0, 4)}••••${config.clientId.slice(-4)}` : undefined,
  });
});

app.get('/api/spotify/auth-url', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const config = db.getSpotifyConfig();
  const redirectUri = getSpotifyRedirectUri(req);

  if (!config.clientId) {
    res.json({
      configured: false,
      redirectUri,
      url: '',
      message: 'Spotify Client ID is not configured yet. You can still use the embedded study player with curated playlists or enter your Client ID in Settings.',
    });
    return;
  }

  const scopes = [
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'playlist-read-private',
    'playlist-read-collaborative',
    'user-top-read',
    'user-library-read',
  ].join(' ');

  const state = JSON.stringify({ userId: user.id, ts: Date.now() });
  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: scopes,
    state,
    show_dialog: 'true',
  });

  const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;
  res.json({
    configured: true,
    url: authUrl,
    redirectUri,
  });
});

// OAuth Callback handler conforming to SKILL.md
app.get(['/auth/callback', '/auth/callback/'], async (req: Request, res: Response) => {
  const { code, state, error } = req.query;

  if (error || !code) {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Spotify Authorization</title></head>
        <body style="background:#0f172a;color:#f8fafc;font-family:sans-serif;text-align:center;padding:50px;">
          <h2 style="color:#ef4444;">Authorization Cancelled or Failed</h2>
          <p>${error ? String(error) : 'No authorization code received'}</p>
          <script>
            setTimeout(() => { if (window.opener) window.close(); }, 2500);
          </script>
        </body>
      </html>
    `);
    return;
  }

  let targetUserId = 'user_monu_1';
  if (state && typeof state === 'string') {
    try {
      const parsedState = JSON.parse(state);
      if (parsedState.userId) targetUserId = parsedState.userId;
    } catch {}
  }

  const config = db.getSpotifyConfig();
  const redirectUri = getSpotifyRedirectUri(req);

  if (!config.clientId || !config.clientSecret) {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Spotify Configuration Required</title></head>
        <body style="background:#0f172a;color:#f8fafc;font-family:sans-serif;text-align:center;padding:50px;">
          <h2>Configuration Missing</h2>
          <p>Spotify Client Secret is required to complete code exchange.</p>
        </body>
      </html>
    `);
    return;
  }

  try {
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: String(code),
        redirect_uri: redirectUri,
      }).toString(),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('Failed to exchange Spotify code:', errText);
      res.send(`
        <!DOCTYPE html>
        <html>
          <body style="background:#0f172a;color:#f8fafc;font-family:sans-serif;text-align:center;padding:50px;">
            <h2 style="color:#ef4444;">Token Exchange Failed</h2>
            <p>Error exchanging Spotify authorization code. Please verify your Client Secret.</p>
            <script>setTimeout(() => { if (window.opener) window.close(); }, 3000);</script>
          </body>
        </html>
      `);
      return;
    }

    const tokenData = await tokenRes.json();

    // Fetch user profile from Spotify
    const meRes = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    let profileData: any = {};
    if (meRes.ok) {
      profileData = await meRes.json();
    }

    const avatarUrl = profileData.images && profileData.images.length > 0 ? profileData.images[0].url : undefined;
    const spotifyProfile = {
      id: profileData.id || 'spotify_user',
      displayName: profileData.display_name || profileData.id || 'Spotify Listener',
      email: profileData.email,
      avatarUrl,
      product: profileData.product,
      uri: profileData.uri,
      externalUrl: profileData.external_urls?.spotify,
    };

    db.setSpotifyAuth(targetUserId, {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: Date.now() + (tokenData.expires_in || 3600) * 1000,
      profile: spotifyProfile,
    });

    db.logEdit(targetUserId, 'Spotify Connected', `Connected account @${spotifyProfile.displayName}`);

    // Return HTML with postMessage and auto-close conforming to SKILL.md
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Spotify Connected</title>
          <style>
            body { background: #090d16; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
            .card { background: #131c31; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 36px 28px; max-width: 380px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
            .logo { width: 56px; height: 56px; margin: 0 auto 16px; border-radius: 50%; background: #1DB954; display: flex; align-items: center; justify-content: center; }
            .logo svg { width: 34px; height: 34px; fill: #000; }
            h2 { margin: 0 0 8px; font-size: 20px; font-weight: 700; color: #fff; }
            p { margin: 0; color: #94a3b8; font-size: 14px; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="logo">
              <svg viewBox="0 0 24 24"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
            </div>
            <h2>Connected to Spotify!</h2>
            <p>Welcome, ${spotifyProfile.displayName}. Your account is linked to ZenithStudy.</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', provider: 'spotify' }, '*');
              setTimeout(() => { window.close(); }, 1000);
            } else {
              setTimeout(() => { window.location.href = '/'; }, 1500);
            }
          </script>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error('Error during Spotify OAuth callback:', err);
    res.status(500).send('Spotify Authentication error: ' + err?.message);
  }
});

app.post('/api/spotify/disconnect', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  db.clearSpotifyAuth(user.id);
  db.logEdit(user.id, 'Spotify Disconnected', 'Unlinked Spotify account');
  res.json({ success: true });
});

app.post('/api/spotify/config', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const { clientId, clientSecret } = req.body;
  if (!clientId) {
    res.status(400).json({ error: 'Client ID is required' });
    return;
  }
  db.setSpotifyConfig({
    clientId: String(clientId).trim(),
    clientSecret: clientSecret ? String(clientSecret).trim() : undefined,
  });
  res.json({ success: true });
});

app.get('/api/spotify/playlists', async (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const token = await getValidSpotifyToken(user.id);
  if (!token) {
    res.json({ playlists: [] });
    return;
  }

  try {
    const spotifyRes = await fetch('https://api.spotify.com/v1/me/playlists?limit=20', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!spotifyRes.ok) {
      res.json({ playlists: [] });
      return;
    }
    const data = await spotifyRes.json();
    const playlists = (data.items || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      imageUrl: p.images && p.images.length > 0 ? p.images[0].url : undefined,
      tracksCount: p.tracks?.total || 0,
      uri: p.uri,
      externalUrl: p.external_urls?.spotify,
      ownerName: p.owner?.display_name || 'Spotify',
    }));
    res.json({ playlists });
  } catch (err: any) {
    console.error('Error fetching user Spotify playlists:', err);
    res.json({ playlists: [] });
  }
});

app.get('/api/spotify/current', async (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const token = await getValidSpotifyToken(user.id);
  if (!token) {
    res.json({ isPlaying: false });
    return;
  }

  try {
    const spotifyRes = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (spotifyRes.status === 204 || !spotifyRes.ok) {
      res.json({ isPlaying: false });
      return;
    }
    const data = await spotifyRes.json();
    res.json({
      isPlaying: data.is_playing || false,
      item: data.item
        ? {
            id: data.item.id,
            name: data.item.name,
            artists: (data.item.artists || []).map((a: any) => a.name),
            album: data.item.album?.name,
            albumArt: data.item.album?.images?.[0]?.url,
            durationMs: data.item.duration_ms,
            progressMs: data.progress_ms,
            uri: data.item.uri,
            externalUrl: data.item.external_urls?.spotify,
          }
        : undefined,
    });
  } catch (err) {
    res.json({ isPlaying: false });
  }
});



app.get('/api/challenges', (req: Request, res: Response) => {
  const challenges = db.getChallenges();
  res.json({ challenges });
});

app.post('/api/challenges', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const { title, description = '', targetHours = 20, startDate, endDate, isGroup = false, groupId } = req.body;
  const ch = db.addChallenge({
    id: 'chal_' + Date.now(),
    title,
    description,
    targetHours: Number(targetHours),
    startDate: startDate || new Date().toISOString().split('T')[0],
    endDate: endDate || new Date(Date.now() + 14 * 86400 * 1000).toISOString().split('T')[0],
    creatorId: user.id,
    isGroup,
    groupId,
    participants: [user.id],
    totalSecondsStudied: 0,
    isCompleted: false,
    createdAt: new Date().toISOString(),
  });
  res.json({ challenge: ch });
});

app.post('/api/challenges/:id/join', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const success = db.joinChallenge(req.params.id, user.id);
  res.json({ success });
});

app.get('/api/friends', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const friends = db.getFriends(user.id);
  res.json({ friends });
});

app.post('/api/friends/add', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const { friendEmailOrUsername } = req.body;
  const target = db.findUserByEmail(friendEmailOrUsername) ||
    db['data'].users.find(u => u.username.toLowerCase() === friendEmailOrUsername.toLowerCase());

  if (!target || target.id === user.id) {
    res.status(404).json({ error: 'User not found or cannot add self' });
    return;
  }
  const rel = db.addFriend(user.id, target.id);
  res.json({ success: true, friend: rel });
});

// D-Day Countdown API
app.get('/api/ddays', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const ddays = db.getDDays(user.id);
  res.json({ ddays });
});

app.post('/api/ddays', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const { title, targetDate, category = 'General', isPinned = true } = req.body;
  if (!title || !targetDate) {
    res.status(400).json({ error: 'Title and targetDate required' });
    return;
  }
  const dday = db.addDDay({
    id: 'dday_' + Date.now(),
    userId: user.id,
    title,
    targetDate,
    category,
    isPinned,
    createdAt: new Date().toISOString(),
  });
  db.logEdit(user.id, 'D-Day event created', `Created target countdown: ${title}`);
  res.json({ dday });
});

app.delete('/api/ddays/:id', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const success = db.deleteDDay(req.params.id, user.id);
  res.json({ success });
});

// 10-Minute Planner API
app.get('/api/planner', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
  const blocks = db.getPlannerBlocks(user.id, date);
  res.json({ blocks });
});

app.post('/api/planner', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const { date, blocks } = req.body;
  db.savePlannerBlocks(user.id, date, blocks || []);
  res.json({ success: true, blocks });
});

// Achievements API
app.get('/api/achievements', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const achievements = db.getAchievements(user.id);
  res.json({ achievements });
});

// Global Omnisearch API
app.get('/api/search', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const q = (req.query.q as string) || '';
  if (!q.trim()) {
    res.json({ subjects: [], tasks: [], books: [], groups: [], sessions: [] });
    return;
  }
  const results = db.searchAll(user.id, q);
  res.json(results);
});

// Comprehensive Study Statistics from Real Database
app.get('/api/statistics', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const { period = 'today' } = req.query;
  const allSessions = db.getSessions(user.id);

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const oneWeekAgoStr = oneWeekAgo.toISOString().split('T')[0];

  const oneMonthAgo = new Date();
  oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
  const oneMonthAgoStr = oneMonthAgo.toISOString().split('T')[0];

  const oneYearAgo = new Date();
  oneYearAgo.setDate(oneYearAgo.getDate() - 365);
  const oneYearAgoStr = oneYearAgo.toISOString().split('T')[0];

  let filtered = allSessions;
  if (period === 'today') {
    filtered = allSessions.filter(s => s.date === todayStr);
  } else if (period === 'week') {
    filtered = allSessions.filter(s => s.date >= oneWeekAgoStr);
  } else if (period === 'month') {
    filtered = allSessions.filter(s => s.date >= oneMonthAgoStr);
  } else if (period === 'year') {
    filtered = allSessions.filter(s => s.date >= oneYearAgoStr);
  }

  const activeTimer = db.getActiveTimer(user.id);
  const activeElapsed = activeTimer && !activeTimer.isPaused
    ? Math.floor((Date.now() - activeTimer.startTimestamp) / 1000) + (activeTimer.accumulatedSeconds || 0)
    : 0;

  let totalStudySeconds = filtered.reduce((a, b) => a + b.durationSeconds, 0);
  if (period === 'today' && activeTimer) {
    totalStudySeconds += activeElapsed;
  }

  const sessionCount = filtered.length;
  const averageSessionSeconds = sessionCount > 0 ? Math.round(totalStudySeconds / sessionCount) : 0;
  const longestSessionSeconds = filtered.reduce((max, s) => Math.max(max, s.durationSeconds), 0);

  // Group by Subject
  const subjectBreakdown: Record<string, { name: string; color: string; icon: string; seconds: number }> = {};
  filtered.forEach(s => {
    if (!subjectBreakdown[s.subjectId]) {
      subjectBreakdown[s.subjectId] = {
        name: s.subjectName,
        color: s.subjectColor,
        icon: s.subjectIcon,
        seconds: 0,
      };
    }
    subjectBreakdown[s.subjectId].seconds += s.durationSeconds;
  });

  if (activeTimer && period === 'today') {
    if (!subjectBreakdown[activeTimer.subjectId]) {
      subjectBreakdown[activeTimer.subjectId] = {
        name: activeTimer.subjectName,
        color: activeTimer.subjectColor,
        icon: activeTimer.subjectIcon,
        seconds: 0,
      };
    }
    subjectBreakdown[activeTimer.subjectId].seconds += activeElapsed;
  }

  // Calculate Streak
  const minStreakSeconds = (user.minStreakMinutes || 30) * 60;
  const sessionsByDate: Record<string, number> = {};
  allSessions.forEach(s => {
    sessionsByDate[s.date] = (sessionsByDate[s.date] || 0) + s.durationSeconds;
  });
  if (activeTimer) {
    sessionsByDate[todayStr] = (sessionsByDate[todayStr] || 0) + activeElapsed;
  }

  let streak = 0;
  let checkDate = new Date();
  // Check if today meets criteria
  const todayMet = (sessionsByDate[todayStr] || 0) >= minStreakSeconds;
  if (todayMet) streak += 1;

  for (let i = 1; i <= 365; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dStr = d.toISOString().split('T')[0];
    if ((sessionsByDate[dStr] || 0) >= minStreakSeconds) {
      streak += 1;
    } else {
      break;
    }
  }

  // Daily study past 7 days for bar charts
  const past7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
    past7Days.push({
      date: dStr,
      label: dayLabel,
      seconds: sessionsByDate[dStr] || 0,
    });
  }

  res.json({
    totalStudySeconds,
    sessionCount,
    averageSessionSeconds,
    longestSessionSeconds,
    streak,
    minStreakMinutes: user.minStreakMinutes || 30,
    subjectBreakdown: Object.values(subjectBreakdown),
    past7Days,
  });
});

// Offline Sync Queue Endpoint
app.post('/api/sync', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const { offlineSessions = [], offlineTasks = [] } = req.body;
  let syncedSessions = 0;
  let syncedTasks = 0;

  offlineSessions.forEach((s: StudySession) => {
    if (!db.getSessions(user.id).some(existing => existing.id === s.id)) {
      db.addSession({ ...s, userId: user.id });
      syncedSessions++;
    }
  });

  offlineTasks.forEach((t: TaskItem) => {
    if (!db.getTasks(user.id).some(existing => existing.id === t.id)) {
      db.addTask({ ...t, userId: user.id });
      syncedTasks++;
    }
  });

  if (syncedSessions > 0 || syncedTasks > 0) {
    db.logEdit(user.id, 'Data synchronized', `Synced ${syncedSessions} offline sessions and ${syncedTasks} tasks`);
  }

  res.json({ success: true, syncedSessions, syncedTasks });
});

// ==========================================
// VITE DEV SERVER OR PRODUCTION STATIC
// ==========================================
async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ZenithStudy server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
