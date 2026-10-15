import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ToastProvider, useToast } from './components/Toast.tsx';
import { Sidebar, NavTab } from './components/Sidebar.tsx';
import { TopHeader } from './components/TopHeader.tsx';
import { FocusTimerModal } from './components/FocusTimerModal.tsx';
import { TaskModal } from './components/TaskModal.tsx';
import { LogSessionModal } from './components/LogSessionModal.tsx';

import { DashboardView } from './views/DashboardView.tsx';
import { TasksView } from './views/TasksView.tsx';
import { AiPlannerView } from './views/AiPlannerView.tsx';
import { ProgressView } from './views/ProgressView.tsx';
import { SettingsView } from './views/SettingsView.tsx';

import { api, Task } from './lib/api.ts';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const { success, error: toastError } = useToast();

  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Modals
  const [timerModalOpen, setTimerModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [logSessionModalOpen, setLogSessionModalOpen] = useState(false);

  // Active tasks cache for timer selector
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);

  const loadTasksForTimer = async () => {
    try {
      const data = await api.getTasks();
      setAvailableTasks(data);
    } catch {
      // quiet catch
    }
  };

  const handleOpenTimer = (task?: Task) => {
    loadTasksForTimer();
    setTimerModalOpen(true);
  };

  const handleOpenCreateTask = () => {
    setEditingTask(null);
    setTaskModalOpen(true);
  };

  const handleOpenEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskModalOpen(true);
  };

  const handleSaveTask = async (taskData: {
    title: string;
    subject: string;
    priority: 'Low' | 'Medium' | 'High' | 'Urgent';
    dueDate: string;
    estimatedDuration: number;
    notes?: string;
  }) => {
    try {
      if (editingTask) {
        await api.updateTask(editingTask.id, taskData);
        success('Task Updated', `"${taskData.title}" has been updated.`);
      } else {
        await api.createTask(taskData);
        success('Task Created', `"${taskData.title}" has been added.`);
      }
      loadTasksForTimer();
    } catch (err: any) {
      toastError('Error', err.message || 'Failed to save task');
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0B1120] text-white">
        <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-900/50 animate-bounce">
          <span className="text-xl font-bold font-mono">F</span>
        </div>
        <p className="text-sm font-semibold text-purple-200 mt-4 tracking-wide">
          Loading FocusFlow AI...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#FAF7FD] text-slate-800 antialiased selection:bg-purple-200 selection:text-purple-900">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenTimer={() => handleOpenTimer()}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <TopHeader
          currentTab={currentTab}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          onOpenTimer={() => handleOpenTimer()}
          onOpenCreateTask={handleOpenCreateTask}
          onNavigateToPlanner={() => setCurrentTab('planner')}
        />

        <main className="flex-1 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              onOpenTimer={() => handleOpenTimer()}
              onOpenCreateTask={handleOpenCreateTask}
              onNavigateToTasks={() => setCurrentTab('tasks')}
              onNavigateToPlanner={() => setCurrentTab('planner')}
              onNavigateToProgress={() => setCurrentTab('progress')}
            />
          )}

          {currentTab === 'tasks' && (
            <TasksView
              onOpenCreateTask={handleOpenCreateTask}
              onEditTask={handleOpenEditTask}
              onStartTimerForTask={(t) => handleOpenTimer(t)}
              onNavigateToPlanner={() => setCurrentTab('planner')}
            />
          )}

          {currentTab === 'planner' && (
            <AiPlannerView
              onNavigateToTasks={() => setCurrentTab('tasks')}
              onOpenTimer={() => handleOpenTimer()}
            />
          )}

          {currentTab === 'progress' && (
            <ProgressView
              onOpenTimer={() => handleOpenTimer()}
              onOpenLogSession={() => setLogSessionModalOpen(true)}
            />
          )}

          {currentTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Focus Timer Modal */}
      <FocusTimerModal
        isOpen={timerModalOpen}
        onClose={() => setTimerModalOpen(false)}
        tasks={availableTasks}
      />

      {/* Task Create / Edit Modal */}
      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        initialTask={editingTask}
      />

      {/* Manual Study Session Modal */}
      <LogSessionModal
        isOpen={logSessionModalOpen}
        onClose={() => setLogSessionModalOpen(false)}
        onSuccess={() => {}}
      />
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}
