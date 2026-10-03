import React, { useState } from 'react';
import { Maximize2, X, ChevronDown, ChevronUp, Youtube, ExternalLink } from 'lucide-react';

interface YouTubeFloatingPlayerProps {
  embedUrl: string;
  videoId: string;
  title: string;
  onExpand: () => void;
  onClose: () => void;
}

export const YouTubeFloatingPlayer: React.FC<YouTubeFloatingPlayerProps> = ({
  embedUrl,
  videoId,
  title,
  onExpand,
  onClose,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={`fixed bottom-20 md:bottom-6 left-4 z-40 transition-all duration-300 ${
        isCollapsed ? 'w-auto' : 'w-[320px] sm:w-[400px]'
      }`}
    >
      <div className="rounded-2xl bg-slate-950/95 border border-red-500/40 backdrop-blur-2xl shadow-2xl shadow-red-500/15 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-3 py-2 bg-slate-900/90 border-b border-white/5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-red-600/20 text-red-500 flex items-center justify-center shrink-0">
              <Youtube className="w-3.5 h-3.5 fill-current" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-red-400 font-bold uppercase tracking-wider">
                  YouTube Study Tube
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              </div>
              <p className="text-xs font-semibold text-white truncate leading-tight">
                {title || 'Study Video Stream'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? 'Show Video Player' : 'Collapse to Mini Pill'}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              onClick={onExpand}
              title="Expand to Full Cinema Modal"
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              title="Close YouTube Player"
              className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Video Embed Container (Persisted even when collapsed so video/audio never stops) */}
        <div
          className={`transition-all duration-300 bg-black ${
            isCollapsed ? 'h-0 opacity-0 pointer-events-none' : 'aspect-video w-full opacity-100'
          }`}
        >
          <iframe
            key={videoId}
            src={embedUrl}
            width="100%"
            height="100%"
            title="YouTube Study Video"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      </div>
    </div>
  );
};
