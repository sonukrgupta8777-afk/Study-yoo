import React, { useState, useEffect, useRef } from 'react';
import { Subject, ActiveTimerState, UserPreferences } from '../types/index.js';
import {
  X,
  Volume2,
  VolumeX,
  Camera,
  Play,
  Pause,
  Square,
  Maximize2,
  Minimize2,
  ShieldAlert,
  Sparkles,
  Coffee
} from 'lucide-react';
import { formatSecondsToDigital, formatSecondsToHuman } from '../utils/api.js';
import { ambientSound } from '../utils/audio.js';

interface FocusFullscreenProps {
  activeTimer: ActiveTimerState | null;
  subject: Subject | null;
  preferences: UserPreferences;
  onPauseTimer: () => void;
  onResumeTimer: () => void;
  onFinishTimer: (notes?: string) => void;
  onClose: () => void;
}

export const FocusFullscreen: React.FC<FocusFullscreenProps> = ({
  activeTimer,
  subject,
  preferences,
  onPauseTimer,
  onResumeTimer,
  onFinishTimer,
  onClose,
}) => {
  const [currentSeconds, setCurrentSeconds] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [soundType, setSoundType] = useState(preferences.activeSound || 'none');
  const [soundVolume, setSoundVolume] = useState(preferences.soundVolume || 70);
  const [showAllowedAppsNotice, setShowAllowedAppsNotice] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Sync Timer accurately from server start timestamp
  useEffect(() => {
    if (!activeTimer) {
      setCurrentSeconds(0);
      return;
    }

    const tick = () => {
      if (activeTimer.isPaused) {
        setCurrentSeconds(activeTimer.accumulatedSeconds || 0);
      } else {
        const elapsed = Math.floor((Date.now() - activeTimer.startTimestamp) / 1000);
        const total = (activeTimer.accumulatedSeconds || 0) + elapsed;
        if (activeTimer.mode === 'pomodoro' || activeTimer.mode === 'countdown') {
          const target = activeTimer.targetDurationSeconds || 25 * 60;
          setCurrentSeconds(Math.max(0, target - total));
        } else {
          setCurrentSeconds(total);
        }
      }
    };

    tick();
    const interval = setInterval(tick, 500);
    return () => clearInterval(interval);
  }, [activeTimer]);

  // Handle ambient sound change
  useEffect(() => {
    if (soundType !== 'none') {
      ambientSound.play(soundType as any, soundVolume);
    } else {
      ambientSound.stop();
    }
    return () => {
      // Don't stop if user closes focus mode, but let them choose
    };
  }, [soundType, soundVolume]);

  // Fullscreen API toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Camera Timelapse toggle
  const toggleCamera = async () => {
    if (isCameraActive) {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
      setIsCameraActive(false);
    } else {
      setCameraError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraActive(true);
      } catch (err: any) {
        setCameraError('Camera access unavailable or declined.');
      }
    }
  };

  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const isStudying = activeTimer && !activeTimer.isPaused;

  return (
    <div className="fixed inset-0 z-50 bg-[#070a10] text-slate-100 flex flex-col justify-between p-6 overflow-hidden">
      {/* Subtle background glow */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25 blur-[120px]"
        style={{
          background: `radial-gradient(circle at 50% 40%, ${subject?.color || '#6366f1'} 0%, transparent 60%)`,
        }}
      />

      {/* Top Header Bar */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-lg"
            style={{ backgroundColor: `${subject?.color || '#6366f1'}30`, color: subject?.color || '#6366f1' }}
          >
            {subject?.icon || '📖'}
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
              IMMERSION FOCUS
            </div>
            <div className="text-base font-bold text-white">
              {subject?.name || 'Deep Study Session'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Allowed Apps Notice */}
          <button
            onClick={() => setShowAllowedAppsNotice(true)}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 flex items-center gap-1.5 border border-white/5 transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Focus Lock</span>
          </button>

          {/* Camera Timelapse */}
          <button
            onClick={toggleCamera}
            className={`px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors border ${
              isCameraActive
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                : 'bg-white/5 text-slate-300 hover:text-white border-white/5'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isCameraActive ? 'Recording Live' : 'Timelapse'}</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="min-h-[38px] min-w-[38px] rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors border border-white/5"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Exit Focus Mode */}
          <button
            onClick={onClose}
            className="min-h-[38px] min-w-[38px] rounded-xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-300 flex items-center justify-center text-slate-300 transition-colors border border-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Center Area: Huge Tabular Digital Clock & Optional Camera PiP */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center my-4">
        {/* Camera Video Stream PiP if active */}
        {isCameraActive && (
          <div className="relative mb-6 rounded-2xl overflow-hidden border border-white/15 shadow-2xl w-48 h-36 bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
            <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-[10px] text-rose-400 font-semibold font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              TIMELAPSE REC
            </div>
          </div>
        )}

        {cameraError && (
          <div className="text-xs text-rose-400 mb-4 bg-rose-500/10 px-3 py-1 rounded-xl">
            {cameraError}
          </div>
        )}

        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400 font-mono tracking-wider uppercase">
            <span className={`w-2 h-2 rounded-full ${isStudying ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            {isStudying ? 'SESSION RUNNING' : 'SESSION PAUSED'}
          </div>

          <div className="text-6xl sm:text-9xl font-bold font-mono tracking-tighter text-white tabular-nums select-all drop-shadow-2xl">
            {formatSecondsToDigital(currentSeconds)}
          </div>

          <p className="text-sm text-slate-400 font-medium tracking-wide">
            Maintain deep focus · Avoid tab switching
          </p>
        </div>
      </div>

      {/* Bottom Control Bar */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl">
        {/* Ambient Sound Selector */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 shrink-0 pr-1">
            <Volume2 className="w-4 h-4 text-indigo-400" />
            <span>Sound:</span>
          </div>
          {(['none', 'rain', 'forest', 'cafe', 'whitenoise', 'ambient'] as const).map(snd => (
            <button
              key={snd}
              onClick={() => setSoundType(snd)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize shrink-0 transition-colors ${
                soundType === snd
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              {snd}
            </button>
          ))}
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {isStudying ? (
            <button
              onClick={onPauseTimer}
              className="min-h-[44px] px-6 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-sm font-semibold flex items-center gap-2 transition-all active:scale-95"
            >
              <Pause className="w-4 h-4 fill-current" />
              <span>Pause</span>
            </button>
          ) : (
            <button
              onClick={onResumeTimer}
              className="min-h-[44px] px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Resume</span>
            </button>
          )}

          <button
            onClick={() => onFinishTimer()}
            className="min-h-[44px] px-6 rounded-2xl bg-white/10 hover:bg-white/15 text-white border border-white/10 text-sm font-semibold flex items-center gap-2 transition-all active:scale-95"
          >
            <Square className="w-4 h-4 fill-current" />
            <span>Finish Session</span>
          </button>
        </div>
      </div>

      {/* Allowed Apps Modal Notice */}
      {showAllowedAppsNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 space-y-4 text-left shadow-2xl">
            <div className="flex items-center gap-2.5 text-amber-400">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">Focus & App Restriction</h3>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 leading-relaxed">
              <p className="font-semibold mb-1">Notice on Operating System Permissions:</p>
              "App blocking is not available on this device. Use Focus Mode instead."
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Modern web applications cannot terminate external native OS applications without root MDM permissions. ZenithStudy keeps full immersion focus active, suppresses distractions, and logs focus metrics.
            </p>

            <button
              onClick={() => setShowAllowedAppsNotice(false)}
              className="w-full min-h-[44px] rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-semibold transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
