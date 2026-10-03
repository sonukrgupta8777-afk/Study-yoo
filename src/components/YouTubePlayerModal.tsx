import React, { useState } from 'react';
import { parseYouTubeUrl } from '../utils/youtube.js';
import { CURATED_YOUTUBE_STREAMS } from '../data/studyMusic.js';
import { YouTubePresetItem } from '../types/index.js';
import { Youtube, Play, Link as LinkIcon, Radio, Clock, Sparkles, ExternalLink, History, Trash2, Check } from 'lucide-react';

interface YouTubePlayerModalProps {
  currentVideoId: string;
  onSelectVideo: (videoId: string, embedUrl: string, title: string) => void;
  onClose: () => void;
}

const CATEGORIES = [
  { id: 'all', label: 'All Streams', icon: '✨' },
  { id: 'lofi', label: 'Lo-Fi 24/7', icon: '🎧' },
  { id: 'pomodoro', label: 'Study With Me', icon: '⏳' },
  { id: 'piano', label: 'Piano & Classical', icon: '🎹' },
  { id: 'ambient', label: 'Ambient & 432Hz', icon: '🌿' },
];

export const YouTubePlayerModal: React.FC<YouTubePlayerModalProps> = ({
  currentVideoId,
  onSelectVideo,
  onClose,
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [recentVideos, setRecentVideos] = useState<{ id: string; title: string; url: string }[]>(() => {
    try {
      const saved = localStorage.getItem('zenith_yt_recent');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveRecent = (id: string, title: string, url: string) => {
    try {
      const updated = [{ id, title, url }, ...recentVideos.filter(v => v.id !== id)].slice(0, 8);
      setRecentVideos(updated);
      localStorage.setItem('zenith_yt_recent', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const clearRecent = () => {
    setRecentVideos([]);
    localStorage.removeItem('zenith_yt_recent');
  };

  const handleApplyUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setInputError(null);

    const parsed = parseYouTubeUrl(urlInput);
    if (!parsed) {
      setInputError('Invalid YouTube URL. Please enter a valid video link (e.g. https://youtu.be/... or https://youtube.com/watch?v=...)');
      return;
    }

    const title = parsed.type === 'playlist' ? 'Custom YouTube Playlist' : 'Custom YouTube Video';
    saveRecent(parsed.id, title, urlInput.trim());
    onSelectVideo(parsed.id, parsed.embedUrl, title);
    setUrlInput('');
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrlInput(text.trim());
        const parsed = parseYouTubeUrl(text.trim());
        if (parsed) {
          const title = parsed.type === 'playlist' ? 'Custom YouTube Playlist' : 'Custom YouTube Video';
          saveRecent(parsed.id, title, text.trim());
          onSelectVideo(parsed.id, parsed.embedUrl, title);
          setUrlInput('');
        }
      }
    } catch {
      // User may need to manually paste
    }
  };

  const filteredStreams = selectedCategory === 'all'
    ? CURATED_YOUTUBE_STREAMS
    : CURATED_YOUTUBE_STREAMS.filter(s => s.category === selectedCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center shadow-lg shadow-red-500/20">
              <Youtube className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                YouTube Study Player
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                  Video &amp; Audio
                </span>
              </h3>
              <p className="text-xs text-slate-400">Paste any YouTube URL or play curated 24/7 study streams</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* URL Input Form */}
        <form onSubmit={handleApplyUrl} className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-red-400" />
              Paste YouTube Video, Live Stream, or Playlist URL
            </span>
            <button
              type="button"
              onClick={handlePasteClipboard}
              className="text-[11px] text-red-400 hover:text-red-300 underline font-medium"
            >
              Paste from Clipboard
            </button>
          </label>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={urlInput}
                onChange={e => {
                  setUrlInput(e.target.value);
                  if (inputError) setInputError(null);
                }}
                placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 font-mono"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shrink-0 shadow-lg shadow-red-600/30 active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Play Video</span>
            </button>
          </div>

          {inputError && (
            <p className="text-xs text-rose-400 font-medium">{inputError}</p>
          )}
        </form>

        {/* Recent Videos (if any) */}
        {recentVideos.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <History className="w-3.5 h-3.5" /> Recent Links
              </span>
              <button onClick={clearRecent} className="text-[10px] text-slate-500 hover:text-rose-400">
                Clear
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {recentVideos.map(r => (
                <button
                  key={r.id}
                  onClick={() => {
                    const parsed = parseYouTubeUrl(r.url || r.id);
                    if (parsed) {
                      onSelectVideo(parsed.id, parsed.embedUrl, r.title);
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-slate-300 border border-white/5 flex items-center gap-1.5 max-w-[200px] truncate"
                >
                  <Play className="w-2.5 h-2.5 text-red-400 fill-current shrink-0" />
                  <span className="truncate">{r.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                selectedCategory === cat.id
                  ? 'bg-red-600/20 text-red-300 border border-red-500/40 shadow-sm'
                  : 'bg-white/[0.03] text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Curated YouTube Streams Grid */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>Curated Study Streams &amp; Videos ({filteredStreams.length})</span>
            <span className="text-[11px] text-slate-500 font-normal">Click to play in floating study dock</span>
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
            {filteredStreams.map(item => {
              const isCurrent = currentVideoId === item.videoId;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    const embedUrl = `https://www.youtube-nocookie.com/embed/${item.videoId}?autoplay=1&enablejsapi=1`;
                    saveRecent(item.videoId, item.title, `https://youtu.be/${item.videoId}`);
                    onSelectVideo(item.videoId, embedUrl, item.title);
                  }}
                  className={`p-2.5 rounded-2xl border text-left transition-all flex items-start gap-3 group relative ${
                    isCurrent
                      ? 'bg-red-600/15 border-red-500/50 shadow-md shadow-red-500/10 ring-1 ring-red-500/30'
                      : 'bg-white/[0.02] border-white/5 hover:border-white/20 hover:bg-white/[0.05]'
                  }`}
                >
                  {/* Video Thumbnail */}
                  <div className="relative w-24 h-16 rounded-xl overflow-hidden bg-black shrink-0 border border-white/10">
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {item.isLive && (
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-red-600 text-[9px] font-bold text-white uppercase tracking-wider">
                        LIVE
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-5 h-5 text-white fill-current" />
                    </div>
                  </div>

                  {/* Video Info */}
                  <div className="min-w-0 flex-1">
                    <h4 className={`text-xs font-semibold line-clamp-2 leading-snug ${isCurrent ? 'text-red-200 font-bold' : 'text-slate-200'}`}>
                      {item.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-1 truncate">
                      {item.channel}
                    </p>
                  </div>

                  {isCurrent && (
                    <div className="absolute top-2 right-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Feature Notice */}
        <div className="p-3 rounded-2xl bg-red-950/30 border border-red-500/20 text-xs text-red-300 flex items-center gap-2.5">
          <Youtube className="w-4 h-4 text-red-400 shrink-0 fill-current" />
          <span>Floating picture-in-picture player keeps video and audio playing while you take notes, solve timers, and browse subjects.</span>
        </div>
      </div>
    </div>
  );
};
