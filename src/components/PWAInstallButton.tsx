import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall.js';
import { Download, Smartphone, Share, PlusSquare, CheckCircle2 } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'header' | 'sidebar' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running in standalone PWA mode, suppress install button
  if (isInstalled) {
    return null;
  }

  // Handle click based on platform
  const handleClick = () => {
    if (isInstallable) {
      install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      // Desktop or fallback instructions
      setShowIOSGuide(true);
    }
  };

  return (
    <>
      {variant === 'header' && (
        <button
          onClick={handleClick}
          title="Install ZenithStudy App on Phone or PC"
          className="min-h-[38px] px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Install App</span>
        </button>
      )}

      {variant === 'sidebar' && (
        <button
          onClick={handleClick}
          className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-indigo-900/30 to-emerald-900/20 border border-indigo-500/25 hover:border-indigo-500/50 text-xs transition-all group cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/30 text-indigo-400 flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block group-hover:text-indigo-300 transition-colors">
                Install as Mobile App
              </span>
              <span className="text-[10px] text-slate-400 block">Offline Mode & Home Screen</span>
            </div>
          </div>
          <Download className="w-4 h-4 text-indigo-400 group-hover:translate-y-0.5 transition-transform" />
        </button>
      )}

      {variant === 'banner' && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center shrink-0">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white block">Download App to Home Screen</span>
              <span className="text-[11px] text-slate-400 block">Get full-screen immersion without browser tabs</span>
            </div>
          </div>
          <button
            onClick={handleClick}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition-all hover:scale-105 shrink-0"
          >
            Install
          </button>
        </div>
      )}

      {/* iOS Safari Guided Install Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-white/10 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Install on Mobile</h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Install ZenithStudy on your phone home screen for offline access and full-screen immersion:
            </p>

            <div className="space-y-3 bg-white/[0.02] border border-white/5 rounded-2xl p-3.5 text-xs text-slate-300">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <span className="font-semibold text-white">Tap the Share button</span>
                  <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                    In Safari or browser menu <Share className="w-3 h-3 text-indigo-400 inline" />
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <span className="font-semibold text-white">Select "Add to Home Screen"</span>
                  <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                    Scroll down and tap <PlusSquare className="w-3 h-3 text-emerald-400 inline" />
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <span className="font-semibold text-white">Tap "Add" in top-right</span>
                  <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                    ZenithStudy will launch as a standalone app! <CheckCircle2 className="w-3 h-3 text-cyan-400 inline" />
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
