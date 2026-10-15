import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  Calendar,
  Flame,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Sparkles,
  BookOpen,
  Plus,
  Timer,
} from 'lucide-react';
import { api, DashboardStats, Task } from '../lib/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../components/Toast.tsx';

interface DashboardViewProps {
  onOpenTimer: () => void;
  onOpenCreateTask: () => void;
  onNavigateToTasks: () => void;
  onNavigateToPlanner: () => void;
  onNavigateToProgress: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenTimer,
  onOpenCreateTask,
  onNavigateToTasks,
  onNavigateToPlanner,
  onNavigateToProgress,
}) => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      console.error('Fetch dashboard stats error:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user?.uid]);

  const handleToggleTask = async (task: Task) => {
    try {
      const updated = await api.updateTask(task.id, { completed: !task.completed });
      success(
        updated.completed ? 'Task completed!' : 'Task reopened',
        `"${task.title}" updated.`
      );
      // Refresh stats
      fetchStats();
    } catch (err: any) {
      toastError('Could not update task', err.message);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formatDueNotice = (dueDateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    if (dueDateStr === today) {
      return <span className="text-amber-600 font-semibold">Today</span>;
    }
    if (dueDateStr < today) {
      return <span className="text-rose-600 font-semibold">Overdue</span>;
    }
    const daysDiff = Math.ceil(
      (new Date(dueDateStr).getTime() - new Date(today).getTime()) / (1000 * 3600 * 24)
    );
    if (daysDiff === 1) return <span className="text-purple-600 font-medium">Tomorrow</span>;
    return <span className="text-slate-500 font-medium">In {daysDiff} days</span>;
  };

  if (loading && !stats) {
    return (
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="h-28 bg-purple-100/50 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-slate-100 rounded-2xl animate-pulse" />
          <div className="h-72 bg-slate-100 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Dashboard Unavailable</h3>
        <p className="text-xs text-slate-600">{error}</p>
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-purple-600 text-white text-xs font-semibold rounded-xl hover:bg-purple-700 transition-colors"
        >
          Retry Loading
        </button>
      </div>
    );
  }

  const todayTasks = stats?.todayTasks || [];
  const weeklyData = stats?.weeklyData || [];
  const maxWeeklyMinutes = Math.max(
    ...weeklyData.map((w) => Math.max(w.minutes, w.targetMinutes)),
    60
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in">
      {/* Welcome Banner */}
      <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-[#1E1B4B] via-[#2E1065] to-[#0F172A] text-white relative overflow-hidden shadow-lg border border-purple-900/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-purple-400/20 text-purple-200 border border-purple-400/30">
                Focus Engine
              </span>
              <span className="text-xs text-purple-300">·</span>
              <span className="text-xs text-purple-200">
                {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white text-balance">
              {getGreeting()}, {user?.displayName || 'Student'}!
            </h2>
            <p className="text-xs md:text-sm text-purple-200/90 leading-relaxed">
              You have <span className="font-bold text-white">{stats?.todayTasksCount || 0} tasks</span> scheduled for today and have logged <span className="font-bold text-white">{stats?.todayStudyHours || 0} hrs</span> of focused study.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenTimer}
              className="py-2.5 px-4 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-semibold text-xs shadow-md shadow-purple-950/40 transition-all hover:scale-[1.02] flex items-center gap-2"
            >
              <Timer className="w-4 h-4" />
              <span>Start Focus Timer</span>
            </button>
            <button
              onClick={onNavigateToPlanner}
              className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-purple-300" />
              <span>AI Study Plan</span>
            </button>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Tasks */}
        <div className="p-5 rounded-2xl bg-white border border-purple-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Today's Tasks</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {stats?.todayTasksCompleted || 0} / {stats?.todayTasksCount || 0}
              </span>
              <span className="text-[11px] text-slate-400">done</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Study Time Today */}
        <div className="p-5 rounded-2xl bg-white border border-purple-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Today's Study Hours</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {stats?.todayStudyHours || 0}h
              </span>
              <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                goal: {stats?.dailyGoalHours || 4}h
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Total Tasks Done */}
        <div className="p-5 rounded-2xl bg-white border border-purple-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Completion Rate</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {stats?.completionRate || 0}%
              </span>
              <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                ({stats?.totalCompletedTasks || 0} total)
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Total Logged Hours */}
        <div className="p-5 rounded-2xl bg-white border border-purple-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Study Logged</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {stats?.totalStudyHours || 0}h
              </span>
              <span className="text-[11px] text-emerald-600 font-medium">all-time</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
            <Flame className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Content Grid: 2 cols */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Tasks & Weekly Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Tasks Card */}
          <div className="p-6 rounded-2xl bg-white border border-purple-100/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Today's Focus Tasks</h3>
                <p className="text-[11px] text-slate-500">Tasks scheduled for today or pending review</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenCreateTask}
                  className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 transition-colors"
                  title="Add Task"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={onNavigateToTasks}
                  className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1 transition-colors"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {todayTasks.length === 0 ? (
              <div className="py-8 px-4 text-center rounded-xl bg-purple-50/40 border border-dashed border-purple-200 space-y-2">
                <BookOpen className="w-7 h-7 text-purple-400 mx-auto" />
                <p className="text-xs font-semibold text-slate-800">All clear for today!</p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  No pending tasks due today. Create a task or generate an AI timetable to keep momentum.
                </p>
                <button
                  onClick={onOpenCreateTask}
                  className="mt-2 py-1.5 px-3 rounded-lg bg-purple-600 text-white text-xs font-medium hover:bg-purple-700 transition-colors"
                >
                  Add a Study Task
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {todayTasks.map((task) => (
                  <div
                    key={task.id}
                    className="py-3 flex items-center justify-between gap-3 group hover:bg-slate-50/60 px-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => handleToggleTask(task)}
                        className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors shrink-0 ${
                          task.completed
                            ? 'bg-purple-600 text-white'
                            : 'border border-slate-300 hover:border-purple-500 text-transparent'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="min-w-0">
                        <p
                          className={`text-xs font-medium truncate ${
                            task.completed ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                          <span className="font-medium text-purple-700">{task.subject}</span>
                          <span>·</span>
                          <span className="font-mono tabular-nums">{task.estimatedDuration}m</span>
                          <span>·</span>
                          <span>{formatDueNotice(task.dueDate)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          task.priority === 'Urgent'
                            ? 'bg-rose-100 text-rose-700'
                            : task.priority === 'High'
                            ? 'bg-amber-100 text-amber-800'
                            : task.priority === 'Medium'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Weekly Progress Chart */}
          <div className="p-6 rounded-2xl bg-white border border-purple-100/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Weekly Study Minutes</h3>
                <p className="text-[11px] text-slate-500">Actual logged study time vs daily target</p>
              </div>
              <button
                onClick={onNavigateToProgress}
                className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1 transition-colors"
              >
                <span>Full Analytics</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Visual Bar Chart */}
            <div className="pt-4">
              <div className="grid grid-cols-7 gap-2 sm:gap-3 items-end h-44 border-b border-slate-100 pb-2">
                {weeklyData.map((item) => {
                  const heightPercent = Math.min(100, Math.round((item.minutes / maxWeeklyMinutes) * 100));
                  const isToday = item.date === new Date().toISOString().split('T')[0];
                  return (
                    <div key={item.date} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                      <span className="text-[10px] font-mono tabular-nums text-slate-400 group-hover:text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.minutes}m
                      </span>
                      <div className="w-full max-w-[36px] bg-slate-100 rounded-t-lg h-full flex items-end overflow-hidden p-0.5">
                        <div
                          style={{ height: `${Math.max(heightPercent, 4)}%` }}
                          className={`w-full rounded-t-md transition-all duration-500 ${
                            isToday
                              ? 'bg-purple-600'
                              : item.minutes >= item.targetMinutes
                              ? 'bg-emerald-500'
                              : item.minutes > 0
                              ? 'bg-purple-400'
                              : 'bg-slate-200'
                          }`}
                        />
                      </div>
                      <span
                        className={`text-[11px] font-semibold ${
                          isToday ? 'text-purple-700 font-bold' : 'text-slate-500'
                        }`}
                      >
                        {item.day}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-3 text-[11px] text-slate-500">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-purple-600" />
                    <span>Today</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
                    <span>Goal Met</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-purple-400" />
                    <span>Studied</span>
                  </div>
                </div>
                <span className="font-mono tabular-nums">
                  Daily target: {stats?.dailyGoalHours || 4}h
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Upcoming Deadlines & Quick Planner Pitch */}
        <div className="space-y-6">
          {/* Upcoming Deadlines */}
          <div className="p-6 rounded-2xl bg-white border border-purple-100/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Upcoming Deadlines</h3>
                <p className="text-[11px] text-slate-500">Exams and assignments countdown</p>
              </div>
              <Calendar className="w-4 h-4 text-purple-600" />
            </div>

            {(!stats?.upcomingDeadlines || stats.upcomingDeadlines.length === 0) ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No upcoming deadlines in the next 14 days.
              </div>
            ) : (
              <div className="space-y-3">
                {stats.upcomingDeadlines.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 space-y-1 hover:border-purple-200 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-900 truncate">
                        {task.title}
                      </span>
                      <span className="text-[10px] shrink-0 font-medium">{formatDueNotice(task.dueDate)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{task.subject}</span>
                      <span className="font-mono tabular-nums">{task.dueDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Study Planner Quick Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-50 via-indigo-50/50 to-white border border-purple-200/80 shadow-xs space-y-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-purple-950">AI Study Timetable</h4>
              <p className="text-xs text-purple-900/80 mt-1 leading-relaxed">
                Exam approaching? Input your subjects, weak areas, and daily hours to generate a customized cognitive study schedule.
              </p>
            </div>
            <button
              onClick={onNavigateToPlanner}
              className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Generate Timetable</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
