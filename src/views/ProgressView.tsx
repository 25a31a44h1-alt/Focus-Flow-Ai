import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  Clock,
  CheckCircle2,
  Calendar,
  Plus,
  Timer,
  TrendingUp,
  BookOpen,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { api, DashboardStats, StudySession } from '../lib/api.ts';
import { useToast } from '../components/Toast.tsx';

interface ProgressViewProps {
  onOpenTimer: () => void;
  onOpenLogSession: () => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  onOpenTimer,
  onOpenLogSession,
}) => {
  const { error: toastError } = useToast();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterSubject, setFilterSubject] = useState<string>('all');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, sessionsData] = await Promise.all([
        api.getDashboardStats(),
        api.getSessions(),
      ]);
      setStats(statsData);
      setSessions(sessionsData);
    } catch (err: any) {
      console.error('Fetch progress data error:', err);
      setError(err.message || 'Failed to load progress analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Distinct subjects from sessions
  const subjectsList = useMemo(() => {
    const set = new Set<string>();
    sessions.forEach((s) => set.add(s.subject));
    return Array.from(set);
  }, [sessions]);

  // Subject breakdown with percentages
  const totalSessionMinutes = useMemo(() => {
    return sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  }, [sessions]);

  const subjectBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    sessions.forEach((s) => {
      map[s.subject] = (map[s.subject] || 0) + s.durationMinutes;
    });

    return Object.entries(map)
      .map(([subject, minutes]) => ({
        subject,
        minutes,
        hours: parseFloat((minutes / 60).toFixed(1)),
        percentage: totalSessionMinutes > 0 ? Math.round((minutes / totalSessionMinutes) * 100) : 0,
      }))
      .sort((a, b) => b.minutes - a.minutes);
  }, [sessions, totalSessionMinutes]);

  const filteredSessions = useMemo(() => {
    if (filterSubject === 'all') return sessions;
    return sessions.filter((s) => s.subject === filterSubject);
  }, [sessions, filterSubject]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
            Study Analytics & Progress
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time calculations and historical session logs saved in Cloud SQL
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenTimer}
            className="py-2 px-3.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold border border-purple-200 transition-colors flex items-center gap-1.5"
          >
            <Timer className="w-3.5 h-3.5" />
            <span>Launch Timer</span>
          </button>
          <button
            onClick={onOpenLogSession}
            className="py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs shadow-purple-900/20 transition-all hover:scale-[1.02] flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Log Study Session</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-purple-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Study Time</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {stats?.totalStudyHours || 0}h
              </span>
              <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                ({totalSessionMinutes} mins)
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-purple-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Sessions</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {sessions.length}
              </span>
              <span className="text-[11px] text-emerald-600 font-medium">recorded</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-purple-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Completed Tasks</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {stats?.totalCompletedTasks || 0} / {stats?.totalTasksCount || 0}
              </span>
              <span className="text-[11px] text-purple-600 font-semibold font-mono tabular-nums">
                {stats?.completionRate || 0}%
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-purple-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Today's Target Pace</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {stats?.goalProgressPercent || 0}%
              </span>
              <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                ({stats?.todayStudyHours || 0}h / {stats?.dailyGoalHours || 4}h)
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Grid: Subject Breakdown & Recent Sessions Log Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subject Breakdown Card */}
        <div className="p-6 rounded-2xl bg-white border border-purple-100 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Subject Distribution</h3>
            <p className="text-[11px] text-slate-500">Proportion of study hours per subject</p>
          </div>

          {subjectBreakdown.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No study sessions logged yet. Complete a Pomodoro session or log study hours to see distribution.
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {subjectBreakdown.map((item, idx) => (
                <div key={item.subject} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-800">{item.subject}</span>
                    <span className="text-slate-500 font-mono tabular-nums">
                      {item.hours}h ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      style={{ width: `${item.percentage}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${
                        idx === 0
                          ? 'bg-purple-600'
                          : idx === 1
                          ? 'bg-indigo-500'
                          : idx === 2
                          ? 'bg-emerald-500'
                          : 'bg-amber-500'
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sessions Table Card */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-purple-100 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Study Session Logs</h3>
              <p className="text-[11px] text-slate-500">Actual persistent session records in database</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Filter:</span>
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="text-xs py-1 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden"
              >
                <option value="all">All Subjects</option>
                {subjectsList.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="py-12 text-center rounded-xl bg-purple-50/40 border border-dashed border-purple-200 space-y-3">
              <Clock className="w-8 h-8 text-purple-400 mx-auto" />
              <p className="text-xs font-semibold text-slate-800">No study sessions logged yet</p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Track your active study sessions using the Pomodoro timer or click "Log Study Session" to record completed hours.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={onOpenTimer}
                  className="py-1.5 px-3 rounded-xl bg-purple-600 text-white text-xs font-medium hover:bg-purple-700 transition-colors"
                >
                  Start Focus Timer
                </button>
                <button
                  onClick={onOpenLogSession}
                  className="py-1.5 px-3 rounded-xl bg-white text-purple-700 border border-purple-200 text-xs font-medium hover:bg-purple-50 transition-colors"
                >
                  Manual Log
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Subject</th>
                    <th className="py-2.5 px-3 text-right">Duration</th>
                    <th className="py-2.5 px-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSessions.map((session) => (
                    <tr key={session.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3 font-mono tabular-nums text-slate-700 whitespace-nowrap">
                        {session.sessionDate}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-purple-900 whitespace-nowrap">
                        {session.subject}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                        {session.durationMinutes} mins
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 truncate max-w-xs">
                        {session.notes || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
