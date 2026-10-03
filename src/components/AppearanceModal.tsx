import React, { useState, useMemo } from 'react';
import { UserPreferences, AppTheme, AccentColor } from '../types/index.js';
import { Palette, Check, Image as ImageIcon, Sliders, Search, Sparkles, ExternalLink, RefreshCw } from 'lucide-react';
import { WALLPAPERS_100, WALLPAPER_CATEGORIES, WallpaperItem } from '../data/wallpapers.js';

interface AppearanceModalProps {
  preferences: UserPreferences;
  onUpdatePreferences: (updates: Partial<UserPreferences>) => void;
  onClose: () => void;
}

const ACCENT_COLORS: { id: AccentColor; label: string; hex: string }[] = [
  { id: 'indigo', label: 'Electric Indigo', hex: '#6366f1' },
  { id: 'purple', label: 'Royal Purple', hex: '#a855f7' },
  { id: 'emerald', label: 'Focus Emerald', hex: '#10b981' },
  { id: 'blue', label: 'Deep Blue', hex: '#3b82f6' },
  { id: 'rose', label: 'Crimson Rose', hex: '#f43f5e' },
  { id: 'amber', label: 'Warm Amber', hex: '#f59e0b' },
  { id: 'cyan', label: 'Cyber Cyan', hex: '#06b6d4' },
];

export const AppearanceModal: React.FC<AppearanceModalProps> = ({
  preferences,
  onUpdatePreferences,
  onClose,
}) => {
  const [theme, setTheme] = useState<AppTheme>(preferences.theme);
  const [accent, setAccent] = useState<AccentColor>(preferences.accentColor);
  const [wallpaper, setWallpaper] = useState(preferences.wallpaper);
  const [blur, setBlur] = useState(preferences.wallpaperBlur || 0);
  const [opacity, setOpacity] = useState(preferences.wallpaperOpacity ?? 90);
  const [selectedCategory, setSelectedCategory] = useState<WallpaperItem['category'] | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Filter wallpapers
  const filteredWallpapers = useMemo(() => {
    return WALLPAPERS_100.filter(item => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch = !searchQuery.trim() || item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const handleApplyCustomUrl = () => {
    if (customUrlInput.trim()) {
      setWallpaper(customUrlInput.trim());
      setShowCustomInput(false);
    }
  };

  const handleRandomize = () => {
    const randomIndex = Math.floor(Math.random() * WALLPAPERS_100.length);
    const chosen = WALLPAPERS_100[randomIndex];
    setWallpaper(chosen.url);
  };

  const handleSave = () => {
    onUpdatePreferences({
      theme,
      accentColor: accent,
      wallpaper,
      wallpaperBlur: blur,
      wallpaperOpacity: opacity,
    });
    onClose();
  };

  const activeWallpaperItem = useMemo(() => {
    return WALLPAPERS_100.find(w => w.url === wallpaper);
  }, [wallpaper]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-3xl bg-slate-900 border border-white/10 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Themes & 100+ Wallpapers
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {WALLPAPERS_100.length}+ 4K HD
                </span>
              </h3>
              <p className="text-xs text-slate-400">Personalize your deep study atmosphere</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Theme Mode & Accent Color in 2 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Theme Mode */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Theme Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['dark', 'oled', 'light'] as AppTheme[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium capitalize border transition-all ${
                    theme === t
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-semibold'
                      : 'bg-slate-950/50 border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {t === 'oled' ? 'OLED Black' : t}
                </button>
              ))}
            </div>
          </div>

          {/* Accent Color */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
            <label className="text-xs font-semibold text-slate-300">Accent Focus Tone</label>
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {ACCENT_COLORS.map(c => (
                <button
                  key={c.id}
                  onClick={() => setAccent(c.id)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform hover:scale-110 ${
                    accent === c.id ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : ''
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.label}
                >
                  {accent === c.id && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Wallpaper Preview Card */}
        <div className="relative rounded-2xl overflow-hidden border border-white/10 h-32 flex items-center justify-between p-4 bg-slate-950 shadow-inner">
          {wallpaper && !wallpaper.startsWith('bg-') && (
            <img
              src={wallpaper}
              alt="Active preview"
              className="absolute inset-0 w-full h-full object-cover transition-all"
              style={{
                filter: `blur(${blur}px)`,
                opacity: opacity / 100,
              }}
            />
          )}
          {wallpaper && wallpaper.startsWith('bg-') && (
            <div className={`absolute inset-0 ${wallpaper}`} />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/40 to-transparent pointer-events-none" />

          <div className="relative z-10 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-semibold">
              Active Atmosphere
            </span>
            <h4 className="text-sm font-bold text-white">
              {activeWallpaperItem?.name || (wallpaper.startsWith('http') ? 'Custom Image Wallpaper' : 'Obsidian Pure')}
            </h4>
            <div className="flex items-center gap-2 text-[11px] text-slate-300">
              <span>Blur: {blur}px</span>
              <span>·</span>
              <span>Opacity: {opacity}%</span>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-2">
            <button
              onClick={handleRandomize}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-white flex items-center gap-1.5 backdrop-blur-md transition-colors font-medium border border-white/10"
              title="Surprise me with a random 4K wallpaper"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Shuffle</span>
            </button>
          </div>
        </div>

        {/* Wallpaper Blur & Opacity Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                Background Blur
              </span>
              <span className="font-mono text-white">{blur}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              value={blur}
              onChange={e => setBlur(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Image Opacity</span>
              <span className="font-mono text-white">{opacity}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              value={opacity}
              onChange={e => setOpacity(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
        </div>

        {/* Wallpaper Library Section */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-emerald-400" />
              Wallpaper Gallery ({filteredWallpapers.length} Available)
            </label>
            <div className="flex items-center gap-2">
              {/* Search bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search wallpaper..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1 text-xs rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-36 sm:w-44"
                />
              </div>

              {/* Custom URL Toggle */}
              <button
                onClick={() => setShowCustomInput(!showCustomInput)}
                className="px-2.5 py-1 text-xs rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors"
              >
                + URL
              </button>
            </div>
          </div>

          {/* Custom URL Input Field */}
          {showCustomInput && (
            <div className="p-3 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 flex items-center gap-2">
              <input
                type="url"
                placeholder="Paste direct image link (https://...jpg, png)"
                value={customUrlInput}
                onChange={e => setCustomUrlInput(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
              />
              <button
                onClick={handleApplyCustomUrl}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
              >
                Apply
              </button>
            </div>
          )}

          {/* Category Chips Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin">
            {WALLPAPER_CATEGORIES.map(cat => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1 rounded-xl text-xs whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                    isActive
                      ? 'bg-indigo-600 text-white font-semibold shadow-sm shadow-indigo-600/30'
                      : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Wallpapers Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-72 overflow-y-auto pr-1">
            {/* Pure OLED Black Card */}
            <div
              onClick={() => setWallpaper('bg-black')}
              className={`relative h-24 rounded-2xl overflow-hidden cursor-pointer border-2 transition-all group flex flex-col justify-end p-2.5 bg-black ${
                wallpaper === 'bg-black' ? 'border-indigo-500 shadow-lg shadow-indigo-500/20 ring-2 ring-indigo-500/20' : 'border-white/10 hover:border-white/30'
              }`}
            >
              <div className="relative z-10 flex items-center justify-between">
                <span className="text-[11px] font-bold text-white">Pure OLED Black</span>
                {wallpaper === 'bg-black' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
              </div>
            </div>

            {/* Render 100+ Wallpapers */}
            {filteredWallpapers.map(item => {
              const isSelected = wallpaper === item.url;
              return (
                <div
                  key={item.id}
                  onClick={() => setWallpaper(item.url)}
                  className={`relative h-24 rounded-2xl overflow-hidden cursor-pointer border-2 transition-all group flex flex-col justify-end p-2.5 ${
                    isSelected
                      ? 'border-indigo-500 shadow-lg shadow-indigo-500/20 ring-2 ring-indigo-500/20 scale-[1.02]'
                      : 'border-white/10 hover:border-white/30 hover:scale-[1.01]'
                  }`}
                >
                  <img
                    src={item.thumbnail}
                    alt={item.name}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                  <div className="relative z-10 flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-white leading-tight truncate pr-1">
                      {item.name}
                    </span>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
          >
            Save Appearance
          </button>
        </div>
      </div>
    </div>
  );
};
