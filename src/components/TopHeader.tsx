import React from 'react';
import { Menu, Timer, Plus, Sparkles, LogIn } from 'lucide-react';
import { NavTab } from './Sidebar.tsx';
import { useAuth } from '../context/AuthContext.tsx';

interface TopHeaderProps {
  currentTab: NavTab;
  onOpenMobileSidebar: () => void;
  onOpenTimer: () => void;
  onOpenCreateTask: () => void;
  onNavigateToPlanner: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentTab,
  onOpenMobileSidebar,
  onOpenTimer,
  onOpenCreateTask,
  onNavigateToPlanner,
}) => {
  const { user, loginWithGoogle } = useAuth();

  const getBreadcrumb = () => {
    switch (currentTab) {
      case 'dashboard':
        return 'Overview & Daily Focus';
      case 'tasks':
        return 'Task Management & Prioritization';
      case 'planner':
        return 'AI Personalized Timetable';
      case 'progress':
        return 'Study Analytics & Logs';
      case 'settings':
        return 'Daily Goals & Preferences';
      default:
        return 'Workspace';
    }
  };

  return (
    <header className="h-16 px-4 md:px-8 bg-white border-b border-purple-100/80 flex items-center justify-between gap-4 sticky top-0 z-20">
      {/* Left: Mobile Toggle + Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs text-slate-500 truncate">
          <span className="font-semibold text-slate-900 capitalize">{currentTab}</span>
          <span aria-hidden="true" className="text-slate-300">/</span>
          <span className="truncate hidden sm:inline">{getBreadcrumb()}</span>
        </div>
      </div>

      {/* Right: Primary Fast Actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        {currentTab !== 'planner' && (
          <button
            onClick={onNavigateToPlanner}
            className="hidden md:flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold border border-purple-200 transition-colors whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Plan</span>
          </button>
        )}

        <button
          onClick={onOpenTimer}
          className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors whitespace-nowrap"
        >
          <Timer className="w-3.5 h-3.5 text-purple-600" />
          <span className="hidden sm:inline">Focus Timer</span>
        </button>

        <button
          onClick={onOpenCreateTask}
          className="flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs shadow-purple-900/20 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Task</span>
        </button>

        {user?.isGuest && (
          <button
            onClick={() => loginWithGoogle()}
            className="hidden sm:flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold border border-amber-200/80 transition-colors whitespace-nowrap"
            title="Link Google Account to save study history permanently"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
