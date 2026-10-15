import React, { useState, useEffect } from 'react';
import {
  Save,
  CheckCircle2,
  User,
  Shield,
  Clock,
  Database,
  LogIn,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { api, UserSettings } from '../lib/api.ts';
import { useToast } from '../components/Toast.tsx';

export const SettingsView: React.FC = () => {
  const { user, settings, refreshSettings, loginWithGoogle, logout } = useAuth();
  const { success, error: toastError } = useToast();

  const [dailyGoalHours, setDailyGoalHours] = useState(4);
  const [preferredStyle, setPreferredStyle] = useState('Pomodoro');
  const [focusTimeMinutes, setFocusTimeMinutes] = useState(25);
  const [breakTimeMinutes, setBreakTimeMinutes] = useState(5);
  const [weekendStudy, setWeekendStudy] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setDailyGoalHours(settings.dailyStudyGoalHours || 4);
      setPreferredStyle(settings.preferredStudyStyle || 'Pomodoro');
      setFocusTimeMinutes(settings.focusTimeMinutes || 25);
      setBreakTimeMinutes(settings.breakTimeMinutes || 5);
      setWeekendStudy(settings.weekendStudyAllowed ?? true);
      setNotifications(settings.notificationsEnabled ?? true);
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.updateSettings({
        dailyStudyGoalHours: Number(dailyGoalHours),
        preferredStudyStyle: preferredStyle,
        focusTimeMinutes: Number(focusTimeMinutes),
        breakTimeMinutes: Number(breakTimeMinutes),
        weekendStudyAllowed: weekendStudy,
        notificationsEnabled: notifications,
      });

      await refreshSettings();
      success('Settings Saved', 'Your study goals and preferences have been updated in Cloud SQL.');
    } catch (err: any) {
      toastError('Save Failed', err.message || 'Could not update settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in">
      <div>
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
          Preferences & Study Goals
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure your daily targets, focus intervals, and account settings
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Study Goals Section */}
        <div className="p-6 rounded-2xl bg-white border border-purple-100 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <Clock className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-900">Daily Study Target</h3>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Target Study Hours per Day
                </label>
                <span className="text-xs font-bold text-purple-700 font-mono tabular-nums">
                  {dailyGoalHours} hours/day
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="12"
                step="0.5"
                value={dailyGoalHours}
                onChange={(e) => setDailyGoalHours(Number(e.target.value))}
                className="w-full accent-purple-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>1h</span>
                <span>4h (Recommended)</span>
                <span>8h</span>
                <span>12h</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Default Study Style
                </label>
                <select
                  value={preferredStyle}
                  onChange={(e) => setPreferredStyle(e.target.value)}
                  className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-medium"
                >
                  <option value="Pomodoro">Pomodoro (25m / 5m)</option>
                  <option value="Deep Work">Deep Work (50m / 10m)</option>
                  <option value="Spaced Repetition">Spaced Repetition Cycles</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Focus Block (Minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  step="5"
                  value={focusTimeMinutes}
                  onChange={(e) => setFocusTimeMinutes(Number(e.target.value))}
                  className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-mono"
                />
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={weekendStudy}
                  onChange={(e) => setWeekendStudy(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 accent-purple-600"
                />
                <span className="text-xs font-medium text-slate-700">
                  Allow Study Scheduling on Weekends
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 accent-purple-600"
                />
                <span className="text-xs font-medium text-slate-700">
                  In-App Focus Reminders
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Account & Persistence Information */}
        <div className="p-6 rounded-2xl bg-white border border-purple-100 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <Shield className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-900">Account & Data Isolation</h3>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-3">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="w-10 h-10 rounded-full border border-purple-300"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 font-bold text-sm flex items-center justify-center">
                  {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'S'}
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-slate-900">{user?.displayName || 'Student'}</p>
                <p className="text-[11px] text-slate-500">{user?.email}</p>
                <p className="text-[10px] text-purple-700 font-mono mt-0.5">
                  UID: {user?.uid ? `${user.uid.slice(0, 14)}...` : 'N/A'}
                </p>
              </div>
            </div>

            <div className="shrink-0">
              {user?.isGuest ? (
                <button
                  type="button"
                  onClick={() => loginWithGoogle()}
                  className="py-2 px-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Connect Google Account</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => logout()}
                  className="py-2 px-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition-colors flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          </div>

          <div className="text-[11px] text-slate-500 leading-relaxed space-y-1">
            <p className="flex items-center gap-1.5 text-slate-700 font-semibold">
              <Database className="w-3.5 h-3.5 text-purple-600" />
              <span>PostgreSQL on Google Cloud SQL</span>
            </p>
            <p>
              All tasks, study sessions, and timetables are securely isolated by Firebase Authentication UID and stored permanently in Cloud SQL.
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="py-2.5 px-6 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-900/20 transition-all hover:scale-[1.02] flex items-center gap-2 disabled:opacity-70"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Preferences'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
