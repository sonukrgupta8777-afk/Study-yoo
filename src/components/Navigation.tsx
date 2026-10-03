import React from 'react';
import { PWAInstallButton } from './PWAInstallButton.js';
import {
  Home,
  CheckSquare,
  Calendar,
  Users,
  MoreHorizontal,
  Clock,
  BookOpen,
  BarChart2,
  Edit3
} from 'lucide-react';

export type NavTab =
  | 'home'
  | 'todo'
  | 'calendar'
  | 'groups'
  | 'more'
  | 'stats'
  | 'timetable'
  | 'books'
  | 'notes';

interface NavigationProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  unreadMessagesCount?: number;
  onOpenGlobalSearch?: () => void;
  onOpenSettings?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onTabChange,
  unreadMessagesCount = 0,
}) => {
  // Mobile Bottom Navigation: Home | Tasks | Calendar | Groups | More
  const primaryTabs: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { id: 'todo', label: 'Tasks', icon: <CheckSquare className="w-5 h-5" /> },
    { id: 'calendar', label: 'Calendar', icon: <Calendar className="w-5 h-5" /> },
    { id: 'groups', label: 'Rooms', icon: <Users className="w-5 h-5" /> },
    { id: 'more', label: 'More', icon: <MoreHorizontal className="w-5 h-5" /> },
  ];

  // Desktop / Tablet Sidebar Modules
  const desktopModules: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Dashboard', icon: <Home className="w-4 h-4" /> },
    { id: 'todo', label: 'To-Do & Tasks', icon: <CheckSquare className="w-4 h-4 text-emerald-400" /> },
    { id: 'calendar', label: 'Calendar', icon: <Calendar className="w-4 h-4 text-amber-400" /> },
    { id: 'timetable', label: 'Timetable', icon: <Clock className="w-4 h-4 text-indigo-400" /> },
    { id: 'groups', label: 'Study Rooms & Groups', icon: <Users className="w-4 h-4 text-purple-400" /> },
    { id: 'stats', label: 'Study Statistics', icon: <BarChart2 className="w-4 h-4 text-cyan-400" /> },
    { id: 'books', label: 'Books & Library', icon: <BookOpen className="w-4 h-4 text-emerald-400" /> },
    { id: 'notes', label: 'Personal Notes', icon: <Edit3 className="w-4 h-4 text-pink-400" /> },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-white/10 pb-[env(safe-area-inset-bottom,0px)]">
        <div className="grid grid-cols-5 h-16 items-center px-1">
          {primaryTabs.map(tab => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`relative flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] transition-colors ${
                  isActive ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="relative">
                  {tab.icon}
                  {tab.id === 'groups' && unreadMessagesCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-indigo-500" />
                  )}
                </div>
                <span className={`text-[10px] tracking-tight mt-1 ${isActive ? 'text-indigo-400 font-bold' : 'text-slate-400'}`}>
                  {tab.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-1 w-6 h-0.5 rounded-full bg-indigo-400 shadow-sm shadow-indigo-500/50" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Desktop & Tablet Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-950/85 backdrop-blur-xl border-r border-white/5 p-4 shrink-0 justify-between">
        <div className="space-y-6">
          <div className="px-3 pt-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center text-white font-extrabold text-base shadow-md shadow-indigo-500/20">
                ⚡
              </div>
              <div>
                <span className="text-sm font-extrabold text-white tracking-tight block">ZenithStudy</span>
                <span className="text-[10px] font-mono text-indigo-400 tracking-wider uppercase block">Focus & Productivity OS</span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase px-3">
              Workspace Modules
            </span>
            <div className="space-y-1 mt-2">
              {desktopModules.map(tab => {
                const isActive = currentTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                      isActive
                        ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/25 font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-white/5 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={isActive ? 'text-indigo-400' : 'text-slate-400'}>{tab.icon}</span>
                      <span>{tab.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile PWA Install option for sidebar */}
        <div className="space-y-2">
          <PWAInstallButton variant="sidebar" />

          {/* Quiet footer system badge */}
          <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-xs text-slate-400 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-300">Zenith Workspace</span>
              <span className="text-emerald-400 font-mono text-[10px]">Active</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">
              Deep focus, task management & group study room platform.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
