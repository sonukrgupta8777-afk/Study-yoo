import React, { useState, useEffect, useRef } from 'react';
import {
  StudyGroup,
  GroupMemberLive,
  GroupChatMessage,
  UserProfile,
  ActiveTimerState
} from '../types/index.js';
import { api, formatSecondsToDigital, formatSecondsToHuman } from '../utils/api.js';
import {
  ArrowLeft,
  Users,
  MessageSquare,
  Trophy,
  Send,
  Sparkles,
  Smile,
  Shield,
  Clock,
  Flame,
  Volume2
} from 'lucide-react';

interface StudyRoomViewProps {
  group: StudyGroup;
  currentUser: UserProfile | null;
  activeTimer: ActiveTimerState | null;
  onBack: () => void;
  onStartFocus: () => void;
}

export const StudyRoomView: React.FC<StudyRoomViewProps> = ({
  group,
  currentUser,
  activeTimer,
  onBack,
  onStartFocus,
}) => {
  const [activeTab, setActiveTab] = useState<'members' | 'chat' | 'rankings'>('members');
  const [members, setMembers] = useState<GroupMemberLive[]>([]);
  const [messages, setMessages] = useState<GroupChatMessage[]>([]);
  const [rankings, setRankings] = useState<any[]>([]);
  const [rankPeriod, setRankPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(true);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Fetch initial group data
  const loadRoomData = async () => {
    try {
      const [membersRes, messagesRes, rankRes] = await Promise.all([
        api.getGroupMembers(group.id),
        api.getGroupMessages(group.id),
        api.getGroupRankings(group.id, rankPeriod),
      ]);
      setMembers(membersRes.members);
      setMessages(messagesRes.messages);
      setRankings(rankRes.rankings);
    } catch (e) {
      console.error('Failed to load group room data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoomData();
    // Real-time synchronization via Server-Sent Events (SSE)
    const eventSource = new EventSource(`/api/realtime/stream?groupId=${group.id}`);

    eventSource.addEventListener('timer_started', () => loadRoomData());
    eventSource.addEventListener('timer_paused', () => loadRoomData());
    eventSource.addEventListener('timer_resumed', () => loadRoomData());
    eventSource.addEventListener('timer_finished', () => loadRoomData());
    eventSource.addEventListener('member_joined', () => loadRoomData());
    eventSource.addEventListener('chat_message', (e: any) => {
      try {
        const msg = JSON.parse(e.data);
        setMessages(prev => [...prev, msg]);
      } catch (err) {}
    });

    // Fallback sync polling every 3 seconds for continuous second accuracy
    const interval = setInterval(loadRoomData, 3000);

    return () => {
      eventSource.close();
      clearInterval(interval);
    };
  }, [group.id, rankPeriod]);

  // Scroll chat to bottom on new message
  useEffect(() => {
    if (activeTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const text = chatInput.trim();
    setChatInput('');
    try {
      const res = await api.sendGroupMessage(group.id, text);
      setMessages(prev => [...prev, res.message]);
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  const studyingCount = members.filter(m => m.status === 'studying').length;

  return (
    <div className="space-y-5 pb-24 md:pb-12 max-w-4xl mx-auto">
      {/* Header bar with Back button & Group branding */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="min-h-[40px] min-w-[40px] rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors border border-white/5"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{group.icon}</span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {group.name}
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {studyingCount} Studying Now
                </span>
              </div>
              <div className="text-xs text-slate-400">
                {members.length} / {group.maxMembers} members · Real-time synchronized
              </div>
            </div>
          </div>
        </div>

        {/* Start focus quick button */}
        <button
          onClick={onStartFocus}
          className="min-h-[44px] px-5 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition-all self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          <span>Join Study Room</span>
        </button>
      </div>

      {/* Tabs Segmented Control */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/80 border border-white/10">
        <button
          onClick={() => setActiveTab('members')}
          className={`flex-1 min-h-[40px] rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'members'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Members ({members.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 min-h-[40px] rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'chat'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Study Room Chat</span>
        </button>

        <button
          onClick={() => setActiveTab('rankings')}
          className={`flex-1 min-h-[40px] rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'rankings'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Rankings</span>
        </button>
      </div>

      {/* TAB 1: MEMBERS LIVE STUDY ROOM */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {members.map(member => {
              const isStudying = member.status === 'studying';
              const isBreak = member.status === 'break';
              const isSelf = member.userId === currentUser?.id;

              return (
                <div
                  key={member.userId}
                  className={`p-4 rounded-3xl border transition-all ${
                    isStudying
                      ? 'bg-slate-900/90 border-emerald-500/30 shadow-lg shadow-emerald-500/5'
                      : isBreak
                      ? 'bg-slate-900/60 border-amber-500/20'
                      : 'bg-slate-950/40 border-white/5 opacity-80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xl">
                          {member.avatar || '👤'}
                        </div>
                        {/* Status Dot: 🟢 Studying, 🟡 Break, ⚫ Offline */}
                        <span
                          className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-950 ${
                            isStudying
                              ? 'bg-emerald-400 animate-pulse'
                              : isBreak
                              ? 'bg-amber-400'
                              : 'bg-slate-600'
                          }`}
                        />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">
                            {member.username}
                          </span>
                          {isSelf && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-medium">
                              You
                            </span>
                          )}
                          {member.role === 'owner' && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-medium">
                              Host
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-400 mt-0.5">
                          {isStudying ? (
                            <span className="text-emerald-400 font-medium flex items-center gap-1">
                              <span>🟢 Studying</span>
                              {member.currentSubject && (
                                <span>· {member.currentSubject}</span>
                              )}
                            </span>
                          ) : isBreak ? (
                            <span className="text-amber-400 font-medium">🟡 On Break</span>
                          ) : (
                            <span className="text-slate-500">⚫ Offline</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Member Running Timer */}
                    <div className="text-right">
                      {isStudying ? (
                        <div className="text-sm font-mono font-bold text-emerald-400 tabular-nums">
                          {formatSecondsToDigital(member.currentSessionDuration)}
                        </div>
                      ) : (
                        <div className="text-xs font-mono text-slate-500">
                          {formatSecondsToHuman(member.todayTotalDuration)} today
                        </div>
                      )}
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {isStudying ? 'Current session' : 'Total today'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: STUDY ROOM CHAT */}
      {activeTab === 'chat' && (
        <div className="flex flex-col h-[520px] rounded-3xl bg-slate-900/80 border border-white/10 overflow-hidden shadow-2xl backdrop-blur-xl">
          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No messages yet. Send a motivating note or start studying!
              </div>
            ) : (
              messages.map(msg => {
                const isSystem = msg.type === 'study_start' || msg.type === 'study_finish' || msg.type === 'system';
                const isMine = msg.userId === currentUser?.id;

                if (isSystem) {
                  return (
                    <div key={msg.id} className="flex justify-center my-2">
                      <div className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/5 text-[11px] text-slate-400 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-indigo-400" />
                        <span>{msg.text}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 ${isMine ? 'flex-row-reverse' : ''}`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-sm shrink-0">
                      {msg.avatar || '👤'}
                    </div>
                    <div className={`max-w-[75%] space-y-1 ${isMine ? 'text-right' : ''}`}>
                      <div className="text-[11px] text-slate-400 font-medium">
                        {msg.username}
                      </div>
                      <div
                        className={`p-3 rounded-2xl text-xs leading-relaxed inline-block ${
                          isMine
                            ? 'bg-indigo-600 text-white rounded-tr-none'
                            : 'bg-slate-800 text-slate-200 rounded-tl-none border border-white/5'
                        }`}
                      >
                        {msg.text}
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick emoji reaction bar */}
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-950/60 border-t border-white/5 overflow-x-auto">
            {['🔥 Keep grinding!', '💪 Almost there!', '☕ Coffee break', '📚 Zoology revision', '👏 Well done!'].map(quick => (
              <button
                key={quick}
                onClick={() => {
                  api.sendGroupMessage(group.id, quick);
                }}
                className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-[11px] text-slate-300 shrink-0 transition-colors"
              >
                {quick}
              </button>
            ))}
          </div>

          {/* Chat input form */}
          <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-white/10 flex items-center gap-2">
            <input
              type="text"
              placeholder="Send message to group room..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="min-h-[40px] px-4 rounded-xl bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: GROUP RANKINGS */}
      {activeTab === 'rankings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Leaderboard from verified saved sessions
            </div>
            {/* Period filter buttons */}
            <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/5 text-xs">
              {(['today', 'week', 'month'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setRankPeriod(p)}
                  className={`px-3 py-1 rounded-lg capitalize transition-colors ${
                    rankPeriod === p ? 'bg-indigo-600 text-white font-medium shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {rankings.map(item => (
              <div
                key={item.userId}
                className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/60 border border-white/5"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-mono font-bold text-xs ${
                      item.rank === 1
                        ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                        : item.rank === 2
                        ? 'bg-slate-300 text-slate-950'
                        : item.rank === 3
                        ? 'bg-amber-600 text-white'
                        : 'bg-white/5 text-slate-400'
                    }`}
                  >
                    {item.rank}
                  </div>

                  <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lg">
                    {item.avatar}
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-white flex items-center gap-2">
                      <span>{item.username}</span>
                      {item.status === 'studying' && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      )}
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      {item.sessionCount} sessions logged
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-mono font-bold text-indigo-300">
                    {formatSecondsToHuman(item.studySeconds)}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {formatSecondsToDigital(item.studySeconds)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
