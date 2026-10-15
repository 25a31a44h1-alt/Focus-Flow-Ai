export interface Task {
  id: number;
  userId: string;
  title: string;
  subject: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  dueDate: string;
  estimatedDuration: number;
  completed: boolean;
  completedAt?: string | null;
  notes?: string | null;
  source: 'manual' | 'ai_planner';
  createdAt: string;
}

export interface UserSettings {
  id?: number;
  userId?: string;
  dailyStudyGoalHours: number;
  preferredStudyStyle: string;
  notificationsEnabled: boolean;
  weekendStudyAllowed: boolean;
  focusTimeMinutes: number;
  breakTimeMinutes: number;
  updatedAt?: string;
}

export interface StudySession {
  id: number;
  userId: string;
  taskId?: number | null;
  subject: string;
  durationMinutes: number;
  sessionDate: string;
  notes?: string | null;
  createdAt: string;
}

export interface SavedStudyPlan {
  id: number;
  userId: string;
  title: string;
  examDates: string;
  difficultTopics: string;
  dailyHours: number;
  startDate: string;
  endDate: string;
  timetableJson: string;
  recommendationsJson?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface DashboardStats {
  todayTasksCount: number;
  todayTasksCompleted: number;
  todayTasks: Task[];
  totalCompletedTasks: number;
  totalTasksCount: number;
  completionRate: number;
  totalStudyHours: number;
  todayStudyHours: number;
  todayStudyMinutes: number;
  dailyGoalHours: number;
  goalProgressPercent: number;
  weeklyData: { date: string; day: string; minutes: number; targetMinutes: number }[];
  upcomingDeadlines: Task[];
  subjectMinutesMap: Record<string, number>;
  recentSessions: StudySession[];
}

export interface AIGeneratedPlan {
  planTitle: string;
  overview: string;
  dailySchedule: {
    day: string;
    date: string;
    focusTheme: string;
    totalHours: number;
    blocks: {
      startTime: string;
      endTime: string;
      subject: string;
      topic: string;
      activity: string;
      durationMinutes: number;
      breakMinutes: number;
      studyTechnique: string;
    }[];
  }[];
  priorityActionItems: {
    title: string;
    subject: string;
    priority: string;
    estimatedMinutes: number;
    dueDate: string;
    reason: string;
  }[];
  revisionMilestones: {
    milestone: string;
    targetDate: string;
    subject: string;
  }[];
  studyTips: string[];
}

class ApiService {
  private getToken: (() => Promise<string | null>) | null = null;

  setTokenGetter(getter: () => Promise<string | null>) {
    this.getToken = getter;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken ? await this.getToken() : null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.error || `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    return data as T;
  }

  // AI Key Status
  async getAiStatus(): Promise<{ hasKey: boolean; model: string }> {
    const res = await fetch('/api/ai/status');
    return res.json();
  }

  // Auth sync
  async syncAuth(): Promise<{ user: any; settings: UserSettings }> {
    return this.request('/api/auth/sync', { method: 'POST' });
  }

  // Settings
  async getSettings(): Promise<UserSettings> {
    return this.request('/api/settings');
  }

  async updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    return this.request('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // Tasks
  async getTasks(): Promise<Task[]> {
    return this.request('/api/tasks');
  }

  async createTask(task: Partial<Task>): Promise<Task> {
    return this.request('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }

  async updateTask(id: number, updates: Partial<Task>): Promise<Task> {
    return this.request(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteTask(id: number): Promise<{ success: boolean; id: number }> {
    return this.request(`/api/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  async batchImportTasks(tasks: any[]): Promise<{ imported: number; tasks: Task[] }> {
    return this.request('/api/tasks/batch-import', {
      method: 'POST',
      body: JSON.stringify({ tasksToImport: tasks }),
    });
  }

  // Sessions
  async getSessions(): Promise<StudySession[]> {
    return this.request('/api/sessions');
  }

  async createSession(session: {
    subject: string;
    durationMinutes: number;
    sessionDate: string;
    taskId?: number;
    notes?: string;
    markTaskCompleted?: boolean;
  }): Promise<StudySession> {
    return this.request('/api/sessions', {
      method: 'POST',
      body: JSON.stringify(session),
    });
  }

  // AI Plan
  async generatePlan(payload: {
    subjects: { name: string; examDate: string; priority?: string }[];
    difficultTopics: string;
    dailyHours: number;
    preferredStyle: string;
    weekendStudy: boolean;
    notes?: string;
  }): Promise<AIGeneratedPlan> {
    return this.request('/api/ai/generate-plan', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getSavedPlans(): Promise<SavedStudyPlan[]> {
    return this.request('/api/plans');
  }

  async savePlan(plan: {
    title: string;
    examDates: any;
    difficultTopics: string;
    dailyHours: number;
    startDate: string;
    endDate: string;
    timetableJson: any;
    recommendationsJson?: any;
  }): Promise<SavedStudyPlan> {
    return this.request('/api/plans', {
      method: 'POST',
      body: JSON.stringify(plan),
    });
  }

  async deletePlan(id: number): Promise<{ success: boolean; id: number }> {
    return this.request(`/api/plans/${id}`, {
      method: 'DELETE',
    });
  }

  // Dashboard Stats
  async getDashboardStats(): Promise<DashboardStats> {
    return this.request('/api/dashboard/stats');
  }
}

export const api = new ApiService();
