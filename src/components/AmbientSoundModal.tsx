import React, { useState, useEffect } from 'react';
import { UserPreferences } from '../types/index.js';
import { Volume2, VolumeX, CloudRain, Wind, Coffee, Radio, Sparkles, Play, Pause, Disc, Waves, Music } from 'lucide-react';
import { ambientSound } from '../utils/audio.js';
import { backgroundMusic, BG_MUSIC_STATIONS, BackgroundMusicStation } from '../utils/backgroundMusic.js';

interface AmbientSoundModalProps {
  preferences: UserPreferences;
  onUpdatePreferences: (updates: Partial<UserPreferences>) => void;
  onClose: () => void;
}

const SOUNDS = [
  { id: 'none', label: 'Mute Synthesizer', icon: <VolumeX className="w-5 h-5 text-slate-400" /> },
  { id: 'rain', label: 'Gentle Rain on Glass', icon: <CloudRain className="w-5 h-5 text-indigo-400" /> },
  { id: 'forest', label: 'Forest Wind & Leaves', icon: <Wind className="w-5 h-5 text-emerald-400" /> },
  { id: 'cafe', label: 'Study Library / Cafe Murmur', icon: <Coffee className="w-5 h-5 text-amber-400" /> },
  { id: 'whitenoise', label: 'Clean White Noise', icon: <Radio className="w-5 h-5 text-cyan-400" /> },
  { id: 'ambient', label: '432Hz Binaural Ambient Drone', icon: <Sparkles className="w-5 h-5 text-purple-400" /> },
];

export const AmbientSoundModal: React.FC<AmbientSoundModalProps> = ({
  preferences,
  onUpdatePreferences,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'bg_music' | 'synthesizer'>('bg_music');
  const [bgState, setBgState] = useState(backgroundMusic.getState());

  useEffect(() => {
    const unsub = backgroundMusic.subscribe(state => {
      setBgState({ ...state });
    });
    return () => unsub();
  }, []);

  const currentSound = preferences.activeSound || 'none';
  const currentVolume = preferences.soundVolume || 70;

  const handleSelectSound = (soundId: any) => {
    onUpdatePreferences({ activeSound: soundId });
    if (soundId !== 'none') {
      ambientSound.play(soundId, currentVolume);
    } else {
      ambientSound.stop();
    }
  };

  const handleVolumeChange = (vol: number) => {
    onUpdatePreferences({ soundVolume: vol });
    ambientSound.setVolume(vol);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Study Audio &amp; Background Music
                {bgState.isPlaying && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </h3>
              <p className="text-xs text-slate-400">Continuous playback across tabs &amp; lock screens</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-2xl border border-white/5">
          <button
            onClick={() => setActiveTab('bg_music')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'bg_music'
                ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>24/7 Lo-Fi &amp; Focus Radio</span>
          </button>
          <button
            onClick={() => setActiveTab('synthesizer')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'synthesizer'
                ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Waves className="w-3.5 h-3.5" />
            <span>Offline Ambient Synthesizer</span>
          </button>
        </div>

        {/* TAB 1: 24/7 BACKGROUND RADIO (LO-FI, ALPHA WAVES, PIANO) */}
        {activeTab === 'bg_music' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-lg">
                  {bgState.station?.icon || '🎧'}
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-bold flex items-center gap-1.5">
                    {bgState.isPlaying ? 'Now Playing in Background' : 'Background Audio Paused'}
                    {bgState.isPlaying && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />}
                  </div>
                  <p className="text-sm font-bold text-white truncate">
                    {bgState.station?.title || 'Lo-Fi Chill & Study Radio'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => backgroundMusic.toggle()}
                className={`min-w-[42px] min-h-[42px] rounded-xl flex items-center justify-center transition-all ${
                  bgState.isPlaying
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold shadow-lg shadow-emerald-500/20'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                }`}
              >
                {bgState.isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>
            </div>

            {/* Radio Stations List */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Select Background Focus Station
              </span>
              <div className="space-y-2">
                {BG_MUSIC_STATIONS.map(st => {
                  const isCurrent = bgState.station?.id === st.id;
                  const isPlayingThis = isCurrent && bgState.isPlaying;

                  return (
                    <button
                      key={st.id}
                      onClick={() => {
                        if (isPlayingThis) {
                          backgroundMusic.pause();
                        } else {
                          backgroundMusic.play(st.id);
                        }
                      }}
                      className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between group ${
                        isCurrent
                          ? 'bg-indigo-600/20 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/30'
                          : 'bg-slate-950/60 border-white/5 hover:border-white/15'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-lg shrink-0">
                          {st.icon}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm font-semibold truncate ${isCurrent ? 'text-indigo-200' : 'text-slate-300'}`}>
                            {st.title}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">{st.description}</p>
                        </div>
                      </div>

                      <div className="shrink-0 ml-3">
                        {isPlayingThis ? (
                          <div className="flex items-end gap-[2px] h-4">
                            <span className="w-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:0ms] h-full" />
                            <span className="w-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:150ms] h-2/3" />
                            <span className="w-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:300ms] h-4/5" />
                          </div>
                        ) : (
                          <Play className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Volume Control */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Background Stream Volume</span>
                <span className="font-mono text-indigo-400">{bgState.volume}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={bgState.volume}
                onChange={e => backgroundMusic.setVolume(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>
          </div>
        )}

        {/* TAB 2: OFFLINE AMBIENT SYNTHESIZER */}
        {activeTab === 'synthesizer' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Synthesized purely offline via Web Audio API. Mix with your background music to block noise.
            </p>

            <div className="space-y-2">
              {SOUNDS.map(s => {
                const isPlaying = currentSound === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => handleSelectSound(s.id)}
                    className={`w-full p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                      isPlaying
                        ? 'bg-indigo-600/20 border-indigo-500 shadow-md'
                        : 'bg-slate-950/60 border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
                        {s.icon}
                      </div>
                      <span className={`text-sm font-semibold ${isPlaying ? 'text-indigo-200' : 'text-slate-300'}`}>
                        {s.label}
                      </span>
                    </div>
                    {isPlaying && (
                      <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Volume Slider */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Synthesizer Volume</span>
                <span className="font-mono text-indigo-400">{currentVolume}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                value={currentVolume}
                onChange={e => handleVolumeChange(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>
          </div>
        )}

        {/* Background Persistence Notice */}
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span>Continuous background playback: Music keeps playing when you navigate, minimize, or lock your device.</span>
        </div>
      </div>
    </div>
  );
};
