import React from 'react';
import { UserProfile, UserPreferences } from '../types/index.js';
import { Volume2, VolumeX, Shield, Lock, Sparkles, Wifi, WifiOff, Search, Palette, Music, Youtube } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton.js';
import { backgroundMusic } from '../utils/backgroundMusic.js';

interface HeaderProps {
  user: UserProfile | null;
  preferences: UserPreferences;
  isOnline: boolean;
  onOpenSoundModal: () => void;
  onOpenFocusMode: () => void;
  onOpenProfile: () => void;
  onLockApp: () => void;
  onOpenSearch: () => void;
  onOpenDDay: () => void;
  onOpenAppBlocker?: () => void;
  onOpenSpotify?: () => void;
  onOpenAppearance?: () => void;
  onOpenYouTube?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  preferences,
  isOnline,
  onOpenSoundModal,
  onOpenFocusMode,
  onOpenProfile,
  onLockApp,
  onOpenSearch,
  onOpenDDay,
  onOpenAppBlocker,
  onOpenSpotify,
  onOpenAppearance,
  onOpenYouTube,
}) => {
  const [bgAudioState, setBgAudioState] = React.useState(backgroundMusic.getState());

  React.useEffect(() => {
    const unsub = backgroundMusic.subscribe(st => setBgAudioState({ ...st }));
    return () => unsub();
  }, []);

  const isSoundPlaying = preferences.activeSound !== 'none' || bgAudioState.isPlaying;

  return (
    <header className="sticky top-0 z-30 h-14 bg-slate-950/75 backdrop-blur-xl border-b border-white/5 px-4 sm:px-6 flex items-center justify-between transition-colors">
      {/* Zone 1: Discreet Status Indicator (Brand name and logo removed as requested) */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/5">
          {isOnline ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-medium text-slate-300">Live Workspace</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-400 text-[11px]">Offline</span>
            </>
          )}
        </div>
      </div>

      {/* Zone 2: Functional Actions & Study Tools */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* PWA Install Button */}
        <PWAInstallButton variant="header" />

        {/* Global Omnisearch */}
        <button
          onClick={onOpenSearch}
          title="Search Workspace (Ctrl/Cmd+K)"
          className="min-h-[38px] min-w-[38px] rounded-lg text-slate-400 hover:text-white hover:bg-white/5 flex items-center justify-center transition-colors border border-white/5"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Spotify Study Music */}
        {onOpenSpotify && (
          <button
            onClick={onOpenSpotify}
            title="Spotify Study Beats & Playlists"
            className="min-h-[38px] px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold bg-[#1DB954]/10 hover:bg-[#1DB954]/20 text-[#1DB954] border border-[#1DB954]/30 transition-all hover:scale-105 active:scale-95"
          >
            <Music className="w-3.5 h-3.5 animate-pulse" />
            <span className="hidden xs:inline">Spotify</span>
          </button>
        )}

        {/* YouTube Video / Stream Player */}
        {onOpenYouTube && (
          <button
            onClick={onOpenYouTube}
            title="Play YouTube Video, Live Stream or Music"
            className="min-h-[38px] px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/30 transition-all hover:scale-105 active:scale-95"
          >
            <Youtube className="w-3.5 h-3.5 fill-current" />
            <span className="hidden xs:inline">YouTube</span>
          </button>
        )}

        {/* Ambient Sound synthesizer button */}
        <button
          onClick={onOpenSoundModal}
          title="Ambient Study Sounds"
          className={`min-h-[38px] px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-all ${
            isSoundPlaying
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5 border border-white/5'
          }`}
        >
          {isSoundPlaying ? (
            <>
              <Volume2 className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span className="capitalize hidden sm:inline">
                {bgAudioState.isPlaying ? 'BG Music' : preferences.activeSound}
              </span>
            </>
          ) : (
            <>
              <VolumeX className="w-4 h-4" />
              <span className="hidden sm:inline">Audio</span>
            </>
          )}
        </button>

        {/* Appearance & 100+ Wallpapers */}
        {onOpenAppearance && (
          <button
            onClick={onOpenAppearance}
            title="Themes & 100+ Wallpapers"
            className="min-h-[38px] min-w-[38px] px-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 flex items-center justify-center gap-1.5 transition-colors border border-white/5 text-xs"
          >
            <Palette className="w-4 h-4 text-purple-400" />
            <span className="hidden md:inline">Themes</span>
          </button>
        )}

        {/* Focus Mode trigger */}
        <button
          onClick={onOpenFocusMode}
          title="Enter Immersion Focus Mode"
          className="min-h-[38px] px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 border border-white/5 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Focus OS</span>
        </button>

        {/* App Blocker trigger */}
        {onOpenAppBlocker && (
          <button
            onClick={onOpenAppBlocker}
            title="App Blocker & Distraction Shield"
            className="min-h-[38px] px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 border border-white/5 transition-all hidden xs:flex"
          >
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Shield</span>
          </button>
        )}

        {/* Lock App if PIN is set */}
        {user?.hasPin && (
          <button
            onClick={onLockApp}
            title="Lock App with PIN"
            className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Lock className="w-4 h-4" />
          </button>
        )}

        {/* Profile Avatar */}
        <button
          onClick={onOpenProfile}
          title="Account & Profile"
          className="min-h-[38px] min-w-[38px] rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-sm transition-transform active:scale-95"
        >
          {user?.avatar || '👨‍🎓'}
        </button>
      </div>
    </header>
  );
};
