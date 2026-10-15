import React from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Sparkles,
  BarChart3,
  Settings,
  Timer,
  LogIn,
  LogOut,
  GraduationCap,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

export type NavTab = 'dashboard' | 'tasks' | 'planner' | 'progress' | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenTimer: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenTimer,
  mobileOpen,
  onCloseMobile,
}) => {
  const { user, loginWithGoogle, logout } = useAuth();

  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks' as NavTab, label: 'Tasks', icon: CheckSquare },
    { id: 'planner' as NavTab, label: 'AI Study Planner', icon: Sparkles, badge: 'AI' },
    { id: 'progress' as NavTab, label: 'Progress & Stats', icon: BarChart3 },
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0B1120] text-slate-200 border-r border-slate-800/80">
      {/* Brand Header */}
      <div className="p-5 flex items-center justify-between border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-900/30">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              FocusFlow <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">AI</span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">Study Planner & Analytics</p>
          </div>
        </div>
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Focus Timer CTA Button */}
      <div className="p-4">
        <button
          onClick={() => {
            onOpenTimer();
            onCloseMobile();
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs shadow-md shadow-purple-900/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Timer className="w-4 h-4" />
          <span>Start Focus Timer</span>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
          WORKSPACE
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-purple-600/15 text-purple-300 border border-purple-500/20 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-purple-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-400/30">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Session Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt="Profile"
                className="w-8 h-8 rounded-full border border-purple-400/30 object-cover shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-purple-900/60 border border-purple-500/40 text-purple-300 font-semibold text-xs flex items-center justify-center shrink-0">
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'S'}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.displayName || 'Student'}</p>
              <p className="text-[10px] text-slate-400 truncate">
                {user?.isGuest ? 'Guest Session' : user?.email}
              </p>
            </div>
          </div>

          {user?.isGuest ? (
            <button
              onClick={() => loginWithGoogle()}
              title="Sign in with Google"
              className="p-1.5 rounded-lg text-purple-300 hover:text-white hover:bg-purple-600/30 transition-colors"
            >
              <LogIn className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => logout()}
              title="Sign out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>

        {user?.isGuest && (
          <button
            onClick={() => loginWithGoogle()}
            className="w-full mt-2 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium flex items-center justify-center gap-1.5 border border-slate-700/60 transition-colors"
          >
            <LogIn className="w-3.5 h-3.5 text-purple-400" />
            <span>Connect Google Account</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[80vw] z-50">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
