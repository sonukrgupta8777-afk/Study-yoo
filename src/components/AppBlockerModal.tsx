import React, { useState, useEffect } from 'react';
import { AppBlockConfig, BlockedApp } from '../types/index.js';
import { api } from '../utils/api.js';
import { ambientSound } from '../utils/audio.js';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  X,
  Plus,
  Trash2,
  Lock,
  Volume2,
  AlertTriangle,
  Check,
  Sparkles,
  Smartphone,
  Eye,
  Sliders
} from 'lucide-react';

interface AppBlockerModalProps {
  onClose: () => void;
  onConfigChanged?: (config: AppBlockConfig) => void;
}

export const AppBlockerModal: React.FC<AppBlockerModalProps> = ({
  onClose,
  onConfigChanged,
}) => {
  const [config, setConfig] = useState<AppBlockConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [newAppName, setNewAppName] = useState('');
  const [newAppDomain, setNewAppDomain] = useState('');
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const loadConfig = async () => {
    try {
      const res = await api.getAppBlockConfig();
      setConfig(res.config);
    } catch (err) {
      console.error('Failed to load app block config', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const triggerToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 2500);
  };

  const handleToggleGlobal = async () => {
    if (!config) return;
    const nextState = !config.enabled;
    const updated = await api.updateAppBlockConfig({ enabled: nextState });
    setConfig(updated.config);
    onConfigChanged?.(updated.config);
    triggerToast(nextState ? 'Distraction Shield activated' : 'Distraction Shield disabled');
  };

  const handleToggleStrictLock = async () => {
    if (!config) return;
    const nextState = !config.strictFocusLock;
    const updated = await api.updateAppBlockConfig({ strictFocusLock: nextState });
    setConfig(updated.config);
    onConfigChanged?.(updated.config);
    triggerToast(nextState ? 'Strict Focus Lock enabled' : 'Strict Focus Lock relaxed');
  };

  const handleToggleSoundAlert = async () => {
    if (!config) return;
    const nextState = !config.soundAlertOnLeave;
    const updated = await api.updateAppBlockConfig({ soundAlertOnLeave: nextState });
    setConfig(updated.config);
    onConfigChanged?.(updated.config);
  };

  const handleToggleAppBlocked = async (appId: string) => {
    if (!config) return;
    const nextBlockedApps = config.blockedApps.map(a =>
      a.id === appId ? { ...a, isBlocked: !a.isBlocked } : a
    );
    const updated = await api.updateAppBlockConfig({ blockedApps: nextBlockedApps });
    setConfig(updated.config);
    onConfigChanged?.(updated.config);
  };

  const handleAddCustomApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config || !newAppName.trim()) return;

    const newApp: BlockedApp = {
      id: 'app_custom_' + Date.now(),
      name: newAppName.trim(),
      category: 'custom',
      icon: '🚫',
      isBlocked: true,
      packageOrDomain: newAppDomain.trim() || undefined,
    };

    const nextBlockedApps = [...config.blockedApps, newApp];
    const updated = await api.updateAppBlockConfig({ blockedApps: nextBlockedApps });
    setConfig(updated.config);
    onConfigChanged?.(updated.config);
    setNewAppName('');
    setNewAppDomain('');
    triggerToast(`Added ${newApp.name} to blocklist`);
  };

  const handleDeleteApp = async (appId: string) => {
    if (!config) return;
    const nextBlockedApps = config.blockedApps.filter(a => a.id !== appId);
    const updated = await api.updateAppBlockConfig({ blockedApps: nextBlockedApps });
    setConfig(updated.config);
    onConfigChanged?.(updated.config);
  };

  if (loading || !config) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <div className="p-8 text-white text-xs">Loading App Blocker...</div>
      </div>
    );
  }

  const blockedCount = config.blockedApps.filter(a => a.isBlocked).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl p-6 space-y-5 my-8 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              config.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
            }`}>
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  App Blocker & Distraction Shield
                </h2>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  config.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                }`}>
                  {config.enabled ? 'ACTIVE' : 'OFF'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Lock distracting applications and focus 100% on your studies
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Floating Toast */}
        {saveToast && (
          <div className="p-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{saveToast}</span>
          </div>
        )}

        {/* Master Switches Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Main Shield Toggle */}
          <div
            onClick={handleToggleGlobal}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
              config.enabled
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-slate-950/60 border-white/5 opacity-70'
            }`}
          >
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Distraction Shield</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {config.enabled ? `${blockedCount} apps currently blocked` : 'Protection paused'}
              </div>
            </div>

            <div className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
              config.enabled ? 'bg-emerald-500' : 'bg-slate-800'
            }`}>
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                config.enabled ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </div>
          </div>

          {/* Strict Focus Lock */}
          <div
            onClick={handleToggleStrictLock}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
              config.strictFocusLock
                ? 'bg-rose-500/10 border-rose-500/30'
                : 'bg-slate-950/60 border-white/5 opacity-70'
            }`}
          >
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-rose-400" />
                <span>Strict Focus Lock</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {config.strictFocusLock ? 'Tab-loss alert & penalty active' : 'Relaxed focus mode'}
              </div>
            </div>

            <div className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
              config.strictFocusLock ? 'bg-rose-500' : 'bg-slate-800'
            }`}>
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                config.strictFocusLock ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </div>
          </div>
        </div>

        {/* Secondary Options Strip */}
        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-indigo-400" />
            <span className="text-slate-300 font-medium">Sound chime when leaving focus tab</span>
          </div>
          <button
            onClick={handleToggleSoundAlert}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
              config.soundAlertOnLeave ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-400'
            }`}
          >
            {config.soundAlertOnLeave ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Allowed Educational Apps Whitelist */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>ALLOWED APPS & TOOLS (WHITELIST)</span>
            </span>
            <span className="text-[11px] text-emerald-400 font-mono">Always permitted</span>
          </div>

          <div className="flex flex-wrap gap-1.5 p-3 rounded-2xl bg-slate-950/60 border border-white/5">
            {config.allowedApps.map(app => (
              <span
                key={app}
                className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-medium flex items-center gap-1"
              >
                <span>✓</span>
                <span>{app}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Blocked Applications List */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              BLOCKED APPS & SITES ({blockedCount} BLOCKED)
            </span>
            <span className="text-[11px] text-slate-500">
              Toggle switch to allow or block
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1">
            {config.blockedApps.map(app => (
              <div
                key={app.id}
                onClick={() => handleToggleAppBlocked(app.id)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                  app.isBlocked
                    ? 'bg-rose-500/10 border-rose-500/20 text-white'
                    : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-lg">{app.icon}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">{app.name}</div>
                    <div className="text-[10px] text-slate-500 capitalize">{app.category}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    app.isBlocked ? 'bg-rose-500/20 text-rose-300' : 'bg-white/5 text-slate-500'
                  }`}>
                    {app.isBlocked ? 'Blocked' : 'Allowed'}
                  </span>

                  {app.category === 'custom' && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleDeleteApp(app.id);
                      }}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add Custom App / Website Block */}
        <form onSubmit={handleAddCustomApp} className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2.5">
          <span className="text-xs font-bold text-slate-300 block">
            Add Custom Distracting App or Domain
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="App Name (e.g. Steam, Twitch)..."
              value={newAppName}
              onChange={e => setNewAppName(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <input
              type="text"
              placeholder="Domain / Package (optional)..."
              value={newAppDomain}
              onChange={e => setNewAppDomain(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={!newAppName.trim()}
            className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-40 text-xs font-semibold text-slate-200 transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add to Blocklist</span>
          </button>
        </form>

        {/* Footer */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Zenith Distraction Shield v2.4
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
