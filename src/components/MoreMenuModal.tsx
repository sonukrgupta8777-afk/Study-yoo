import React from 'react';
import {
  BarChart2,
  Clock,
  BookOpen,
  Trophy,
  Shield,
  Palette,
  Volume2,
  Lock,
  History,
  Wifi,
  Camera,
  Settings,
  HelpCircle,
  Users,
  Timer,
  Target,
  Sparkles,
  ShoppingBag,
  Grid,
  CheckCircle2,
  FileText,
  Music
} from 'lucide-react';
import { NavTab } from './Navigation.js';

interface MoreMenuModalProps {
  onSelectAction: (action: string) => void;
  onNavigateTab: (tab: NavTab) => void;
}

export const MoreMenuModal: React.FC<MoreMenuModalProps> = ({
  onSelectAction,
  onNavigateTab,
}) => {
  const categories = [
    {
      title: 'MAIN FEATURES',
      items: [
        { id: 'stats', label: 'Statistics', icon: <BarChart2 className="w-5 h-5 text-indigo-400" />, action: () => onNavigateTab('stats') },
        { id: 'rankings', label: 'Rankings', icon: <Trophy className="w-5 h-5 text-amber-400" />, action: () => onNavigateTab('groups') },
        { id: 'pomodoro', label: 'Pomodoro', icon: <Timer className="w-5 h-5 text-teal-400" />, action: () => onSelectAction('pomodoro') },
        { id: 'app_block', label: 'App Block (Distraction Shield)', icon: <Shield className="w-5 h-5 text-cyan-400" />, action: () => onSelectAction('app_block') },
        { id: 'edit_log', label: 'Edit Log', icon: <History className="w-5 h-5 text-slate-400" />, action: () => onSelectAction('edit_log') },
        { id: 'offline', label: 'Offline Mode', icon: <Wifi className="w-5 h-5 text-emerald-400" />, action: () => onSelectAction('offline') },
      ],
    },
    {
      title: 'EXTRA FEATURES',
      items: [
        { id: 'books', label: 'Books & Textbooks', icon: <BookOpen className="w-5 h-5 text-emerald-400" />, action: () => onNavigateTab('books') },
        { id: 'challenges', label: 'Challenges', icon: <Trophy className="w-5 h-5 text-rose-400" />, action: () => onSelectAction('challenges') },
        { id: 'timetable', label: 'Timetable', icon: <Clock className="w-5 h-5 text-emerald-400" />, action: () => onNavigateTab('timetable') },
        { id: 'timelapse', label: 'Timelapse', icon: <Camera className="w-5 h-5 text-rose-400" />, action: () => onSelectAction('timelapse') },
        { id: 'spotify', label: 'Spotify Study Music', icon: <Music className="w-5 h-5 text-[#1DB954]" />, action: () => onSelectAction('spotify') },
        { id: 'music', label: 'Ambient Sounds', icon: <Volume2 className="w-5 h-5 text-indigo-400" />, action: () => onSelectAction('sound') },
        { id: 'planner', label: '10-Minute Planner', icon: <Clock className="w-5 h-5 text-purple-400" />, action: () => onSelectAction('planner') },
        { id: 'heatmap', label: 'Yearly Heatmap', icon: <Grid className="w-5 h-5 text-emerald-400" />, action: () => onSelectAction('heatmap') },
        { id: 'dday', label: 'D-Day', icon: <Target className="w-5 h-5 text-amber-400" />, action: () => onSelectAction('dday') },
      ],
    },
    {
      title: 'DECORATE',
      items: [
        { id: 'theme', label: 'Theme & Wallpapers', icon: <Palette className="w-5 h-5 text-pink-400" />, action: () => onSelectAction('appearance') },
        { id: 'studicon', label: 'Studicon (Badges & Trophies)', icon: <CheckCircle2 className="w-5 h-5 text-amber-400" />, action: () => onSelectAction('achievements') },
        { id: 'planner_dec', label: 'Decorate Planner', icon: <Sparkles className="w-5 h-5 text-indigo-400" />, action: () => onSelectAction('planner') },
        { id: 'store', label: 'Zenith Store', icon: <ShoppingBag className="w-5 h-5 text-teal-400" />, action: () => onSelectAction('store') },
      ],
    },
    {
      title: 'MORE',
      items: [
        { id: 'home_screen', label: 'Select Home Screen Widgets', icon: <Palette className="w-5 h-5 text-indigo-400" />, action: () => onSelectAction('appearance') },
        { id: 'breaks', label: 'Break Settings', icon: <Timer className="w-5 h-5 text-amber-400" />, action: () => onSelectAction('pomodoro') },
        { id: 'lock', label: 'App Lock', icon: <Lock className="w-5 h-5 text-rose-400" />, action: () => onSelectAction('lock') },
        { id: 'help', label: 'Help & Shortcuts', icon: <HelpCircle className="w-5 h-5 text-slate-400" />, action: () => onSelectAction('help') },
        { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5 text-slate-400" />, action: () => onSelectAction('settings') },
      ],
    },
  ];

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="pt-2">
        <span className="text-xs font-semibold text-indigo-400 tracking-wider uppercase">
          APPLICATION DIRECTORY
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-0.5">
          More Menu
        </h1>
      </div>

      <div className="space-y-6">
        {categories.map(section => (
          <div key={section.title} className="space-y-2.5">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              {section.title}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {section.items.map(item => (
                <button
                  key={item.id}
                  onClick={item.action}
                  className="p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-white/5 hover:border-indigo-500/30 transition-all flex items-center justify-between text-left group shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      {item.icon}
                    </div>
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors">
                      {item.label}
                    </span>
                  </div>
                  <span className="text-slate-600 group-hover:text-slate-300 transition-colors text-sm">
                    ›
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
