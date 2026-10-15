import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Trash2,
  Edit2,
  Timer,
  Calendar,
  Clock,
  Sparkles,
  AlertCircle,
  ArrowUpDown,
} from 'lucide-react';
import { api, Task } from '../lib/api.ts';
import { useToast } from '../components/Toast.tsx';

interface TasksViewProps {
  onOpenCreateTask: () => void;
  onEditTask: (task: Task) => void;
  onStartTimerForTask: (task: Task) => void;
  onNavigateToPlanner: () => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  onOpenCreateTask,
  onEditTask,
  onStartTimerForTask,
  onNavigateToPlanner,
}) => {
  const { success, error: toastError } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'duration' | 'title'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getTasks();
      setTasks(data);
    } catch (err: any) {
      console.error('Fetch tasks error:', err);
      setError(err.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleToggleComplete = async (task: Task) => {
    try {
      const updated = await api.updateTask(task.id, { completed: !task.completed });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
      success(
        updated.completed ? 'Task completed!' : 'Task reopened',
        `"${task.title}" updated.`
      );
    } catch (err: any) {
      toastError('Error updating task', err.message);
    }
  };

  const handleDeleteTask = async (taskId: number, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await api.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      success('Task deleted', `Removed "${title}".`);
    } catch (err: any) {
      toastError('Could not delete task', err.message);
    }
  };

  // Distinct subjects for filter dropdown
  const uniqueSubjects = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => {
      if (t.subject) set.add(t.subject);
    });
    return Array.from(set);
  }, [tasks]);

  const priorityWeights: Record<string, number> = {
    Urgent: 4,
    High: 3,
    Medium: 2,
    Low: 1,
  };

  // Filtered & Sorted list
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        // Status
        if (statusFilter === 'pending' && t.completed) return false;
        if (statusFilter === 'completed' && !t.completed) return false;
        // Priority
        if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
        // Subject
        if (subjectFilter !== 'all' && t.subject !== subjectFilter) return false;
        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = t.title.toLowerCase().includes(q);
          const matchSub = t.subject.toLowerCase().includes(q);
          const matchNotes = t.notes?.toLowerCase().includes(q);
          if (!matchTitle && !matchSub && !matchNotes) return false;
        }
        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'dueDate') {
          diff = a.dueDate.localeCompare(b.dueDate);
        } else if (sortBy === 'priority') {
          diff = (priorityWeights[b.priority] || 0) - (priorityWeights[a.priority] || 0);
        } else if (sortBy === 'duration') {
          diff = a.estimatedDuration - b.estimatedDuration;
        } else if (sortBy === 'title') {
          diff = a.title.localeCompare(b.title);
        }
        return sortOrder === 'asc' ? diff : -diff;
      });
  }, [tasks, statusFilter, priorityFilter, subjectFilter, searchQuery, sortBy, sortOrder]);

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in">
      {/* Header with Title and Create Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
            Study Tasks
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize, prioritize, and complete your academic assignments
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onNavigateToPlanner}
            className="py-2 px-3.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold border border-purple-200 transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Tasks with AI</span>
          </button>
          <button
            onClick={onOpenCreateTask}
            className="py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs shadow-purple-900/20 transition-all hover:scale-[1.02] flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-purple-100/90 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search tasks, subjects, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Status Tabs */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full text-xs py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending Only</option>
              <option value="completed">Completed Only</option>
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full text-xs py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-medium"
            >
              <option value="all">All Subjects</option>
              {uniqueSubjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full text-xs py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-medium"
            >
              <option value="all">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        {/* Sorting controls */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Showing <span className="font-semibold text-slate-800 font-mono tabular-nums">{filteredTasks.length}</span> of <span className="font-semibold text-slate-800 font-mono tabular-nums">{tasks.length}</span> tasks</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-slate-500">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs py-1 px-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden"
            >
              <option value="dueDate">Due Date</option>
              <option value="priority">Priority</option>
              <option value="duration">Estimated Time</option>
              <option value="title">Title</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100"
              title="Toggle sort direction"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Task List Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-rose-200 space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-sm font-semibold text-slate-800">{error}</p>
          <button
            onClick={fetchTasks}
            className="py-1.5 px-3 rounded-lg bg-purple-600 text-white text-xs font-medium"
          >
            Retry
          </button>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-purple-100/90 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto border border-purple-100">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">No tasks found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {searchQuery || priorityFilter !== 'all' || subjectFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : 'Get started by creating your first study task or generating an AI plan.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onOpenCreateTask}
              className="py-2 px-4 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition-colors"
            >
              Create New Task
            </button>
            <button
              onClick={onNavigateToPlanner}
              className="py-2 px-4 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold hover:bg-purple-100 transition-colors"
            >
              Use AI Planner
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTasks.map((task) => {
            const isOverdue = !task.completed && task.dueDate < todayStr;
            const isDueToday = !task.completed && task.dueDate === todayStr;

            return (
              <div
                key={task.id}
                className={`p-4 rounded-2xl bg-white border transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs hover:shadow-md ${
                  task.completed
                    ? 'border-slate-200/60 bg-slate-50/40 opacity-80'
                    : isOverdue
                    ? 'border-rose-200 bg-rose-50/20'
                    : isDueToday
                    ? 'border-amber-200 bg-amber-50/20'
                    : 'border-purple-100/80 hover:border-purple-200'
                }`}
              >
                {/* Left side: Checkbox + Title + Metadata */}
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  <button
                    onClick={() => handleToggleComplete(task)}
                    className={`w-5 h-5 mt-0.5 sm:mt-0 rounded-md flex items-center justify-center transition-colors shrink-0 ${
                      task.completed
                        ? 'bg-purple-600 text-white'
                        : 'border border-slate-300 hover:border-purple-500 text-transparent'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs md:text-sm font-semibold truncate ${
                          task.completed ? 'line-through text-slate-400' : 'text-slate-900'
                        }`}
                      >
                        {task.title}
                      </span>
                      {task.source === 'ai_planner' && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                          AI Plan
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-slate-500">
                      <span className="font-semibold text-purple-700">{task.subject}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1 font-mono tabular-nums">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {task.estimatedDuration}m
                      </span>
                      <span>·</span>
                      <span
                        className={`flex items-center gap-1 font-mono tabular-nums ${
                          isOverdue
                            ? 'text-rose-600 font-bold'
                            : isDueToday
                            ? 'text-amber-600 font-bold'
                            : 'text-slate-500'
                        }`}
                      >
                        <Calendar className="w-3 h-3" />
                        {task.dueDate} {isOverdue && '(Overdue)'} {isDueToday && '(Due Today)'}
                      </span>
                    </div>

                    {task.notes && (
                      <p className="text-[11px] text-slate-600 italic line-clamp-1">{task.notes}</p>
                    )}
                  </div>
                </div>

                {/* Right side: Priority badge + Quick actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                      task.priority === 'Urgent'
                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                        : task.priority === 'High'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : task.priority === 'Medium'
                        ? 'bg-purple-100 text-purple-700 border border-purple-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {task.priority}
                  </span>

                  <div className="flex items-center gap-1">
                    {!task.completed && (
                      <button
                        onClick={() => onStartTimerForTask(task)}
                        title="Start timer for this task"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                      >
                        <Timer className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onEditTask(task)}
                      title="Edit task"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id, task.title)}
                      title="Delete task"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
