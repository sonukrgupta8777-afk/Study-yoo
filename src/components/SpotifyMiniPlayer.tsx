import React, { useState } from 'react';
import { Maximize2, X, ChevronDown, ChevronUp, Music, Sparkles } from 'lucide-react';

interface SpotifyMiniPlayerProps {
  embedId: string;
  title: string;
  onExpand: () => void;
  onClose: () => void;
}

export const SpotifyMiniPlayer: React.FC<SpotifyMiniPlayerProps> = ({
  embedId,
  title,
  onExpand,
  onClose,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={`fixed bottom-20 md:bottom-6 right-4 z-40 transition-all duration-300 ${
        isCollapsed ? 'w-auto' : 'w-[320px] sm:w-[360px]'
      }`}
    >
      <div className="rounded-2xl bg-slate-950/95 border border-[#1DB954]/40 backdrop-blur-2xl shadow-2xl shadow-[#1DB954]/15 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-3 py-2 bg-slate-900/80 border-b border-white/5">
          <div className="flex items-center gap-2 min-w-0">
            {/* Pulsing equalizer indicator */}
            <div className="flex items-end gap-[2px] h-3 shrink-0">
              <span className="w-[2.5px] bg-[#1DB954] rounded-full animate-bounce [animation-delay:0ms] h-full" />
              <span className="w-[2.5px] bg-[#1DB954] rounded-full animate-bounce [animation-delay:150ms] h-2/3" />
              <span className="w-[2.5px] bg-[#1DB954] rounded-full animate-bounce [animation-delay:300ms] h-4/5" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-[#1DB954] font-bold uppercase tracking-wider">
                  Spotify BG Active
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-xs font-semibold text-white truncate leading-tight">
                {title || 'Study Beats'}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? 'Show Player Controls' : 'Collapse to Background Pill'}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              onClick={onExpand}
              title="Expand Playlist Directory"
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              title="Stop Spotify Audio"
              className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Persistent Spotify Embed Iframe Container */}
        {/* We keep the iframe mounted even when collapsed to guarantee background audio NEVER pauses */}
        <div
          className={`transition-all duration-300 overflow-hidden bg-black ${
            isCollapsed ? 'h-0 opacity-0 pointer-events-none' : 'h-[84px] opacity-100'
          }`}
        >
          <iframe
            key={embedId}
            src={`https://open.spotify.com/embed/playlist/${embedId}?utm_source=generator&theme=0`}
            width="100%"
            height="80"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            title="Spotify Background Music Player"
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};
