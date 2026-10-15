import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import {
  getOrCreateUser,
  getUserSettings,
  updateUserSettings,
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getStudySessions,
  createStudySession,
  getStudyPlans,
  createStudyPlan,
  deleteStudyPlan,
} from './src/db/queries.ts';
import { generateStudyTimetable } from './src/services/aiPlanner.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// API Routes

// 1. Check AI Key availability
app.get('/api/ai/status', (req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '');
  res.json({
    hasKey,
    model: 'gemini-3.8-flash',
  });
});

// 2. Auth sync
app.post('/api/auth/sync', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const dbUser = await getOrCreateUser(user.uid, user.email || '', user.name, user.picture);
    const settings = await getUserSettings(user.uid);
    res.json({ user: dbUser, settings });
  } catch (err: any) {
    console.error('Auth sync failed:', err);
    res.status(500).json({ error: err.message || 'Failed to synchronize user session' });
  }
});

// 3. User Settings
app.get('/api/settings', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const settings = await getUserSettings(user.uid);
    res.json(settings);
  } catch (err: any) {
    console.error('Get settings failed:', err);
    res.status(500).json({ error: err.message || 'Failed to retrieve settings' });
  }
});

app.put('/api/settings', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const updated = await updateUserSettings(user.uid, req.body);
    res.json(updated);
  } catch (err: any) {
    console.error('Update settings failed:', err);
    res.status(500).json({ error: err.message || 'Failed to update settings' });
  }
});

// 4. Tasks API
app.get('/api/tasks', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const userTasks = await getTasks(user.uid);
    res.json(userTasks);
  } catch (err: any) {
    console.error('Get tasks failed:', err);
    res.status(500).json({ error: err.message || 'Failed to retrieve tasks' });
  }
});

app.post('/api/tasks', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const { title, subject, priority, dueDate, estimatedDuration, notes, source } = req.body;
    if (!title || !subject || !dueDate || estimatedDuration === undefined) {
      return res.status(400).json({ error: 'Missing required task fields (title, subject, dueDate, estimatedDuration)' });
    }
    const newTask = await createTask(user.uid, {
      title,
      subject,
      priority: priority || 'Medium',
      dueDate,
      estimatedDuration: Number(estimatedDuration),
      notes,
      source: source || 'manual',
    });
    res.status(201).json(newTask);
  } catch (err: any) {
    console.error('Create task failed:', err);
    res.status(500).json({ error: err.message || 'Failed to create task' });
  }
});

app.put('/api/tasks/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const taskId = parseInt(req.params.id, 10);
    if (isNaN(taskId)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }
    const updated = await updateTask(user.uid, taskId, req.body);
    res.json(updated);
  } catch (err: any) {
    console.error('Update task failed:', err);
    res.status(500).json({ error: err.message || 'Failed to update task' });
  }
});

app.delete('/api/tasks/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const taskId = parseInt(req.params.id, 10);
    if (isNaN(taskId)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }
    const result = await deleteTask(user.uid, taskId);
    res.json(result);
  } catch (err: any) {
    console.error('Delete task failed:', err);
    res.status(500).json({ error: err.message || 'Failed to delete task' });
  }
});

// Batch import tasks from AI study timetable
app.post('/api/tasks/batch-import', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const { tasksToImport } = req.body;
    if (!Array.isArray(tasksToImport) || tasksToImport.length === 0) {
      return res.status(400).json({ error: 'No tasks array provided' });
    }

    const createdList = [];
    for (const t of tasksToImport) {
      const created = await createTask(user.uid, {
        title: t.title,
        subject: t.subject || 'General Study',
        priority: t.priority || 'Medium',
        dueDate: t.dueDate || new Date().toISOString().split('T')[0],
        estimatedDuration: Number(t.estimatedMinutes || t.estimatedDuration || 60),
        notes: t.reason || t.notes || 'Imported from AI Study Plan',
        source: 'ai_planner',
      });
      createdList.push(created);
    }
    res.status(201).json({ imported: createdList.length, tasks: createdList });
  } catch (err: any) {
    console.error('Batch import tasks failed:', err);
    res.status(500).json({ error: err.message || 'Failed to import tasks' });
  }
});

// 5. Study Sessions API (Actual time spent studying)
app.get('/api/sessions', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const sessions = await getStudySessions(user.uid);
    res.json(sessions);
  } catch (err: any) {
    console.error('Get sessions failed:', err);
    res.status(500).json({ error: err.message || 'Failed to retrieve study sessions' });
  }
});

app.post('/api/sessions', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const { subject, durationMinutes, sessionDate, taskId, notes } = req.body;
    if (!subject || !durationMinutes || !sessionDate) {
      return res.status(400).json({ error: 'Missing subject, durationMinutes, or sessionDate' });
    }
    const newSession = await createStudySession(user.uid, {
      subject,
      durationMinutes: Number(durationMinutes),
      sessionDate,
      taskId: taskId ? Number(taskId) : undefined,
      notes,
    });

    // If taskId is provided, optionally check if caller requested marking it complete
    if (taskId && req.body.markTaskCompleted) {
      await updateTask(user.uid, Number(taskId), { completed: true });
    }

    res.status(201).json(newSession);
  } catch (err: any) {
    console.error('Create session failed:', err);
    res.status(500).json({ error: err.message || 'Failed to log study session' });
  }
});

// 6. AI Study Planner API
app.post('/api/ai/generate-plan', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { subjects, difficultTopics, dailyHours, preferredStyle, weekendStudy, notes } = req.body;
    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ error: 'Please provide at least one subject and target exam date.' });
    }

    const timetable = await generateStudyTimetable({
      subjects,
      difficultTopics: difficultTopics || '',
      dailyHours: Number(dailyHours) || 4,
      preferredStyle: preferredStyle || 'Pomodoro',
      weekendStudy: Boolean(weekendStudy),
      notes,
    });

    res.json(timetable);
  } catch (err: any) {
    console.error('AI plan generation error:', err);
    const msg = err.message || 'Failed to generate AI study timetable';
    const isApiKeyError = msg.includes('GEMINI_API_KEY');
    res.status(isApiKeyError ? 503 : 500).json({ error: msg });
  }
});

// Save AI Study Plan
app.get('/api/plans', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const plans = await getStudyPlans(user.uid);
    res.json(plans);
  } catch (err: any) {
    console.error('Get plans failed:', err);
    res.status(500).json({ error: err.message || 'Failed to load study plans' });
  }
});

app.post('/api/plans', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const { title, examDates, difficultTopics, dailyHours, startDate, endDate, timetableJson, recommendationsJson } = req.body;
    const plan = await createStudyPlan(user.uid, {
      title,
      examDates: typeof examDates === 'string' ? examDates : JSON.stringify(examDates),
      difficultTopics: difficultTopics || '',
      dailyHours: Number(dailyHours),
      startDate,
      endDate,
      timetableJson: typeof timetableJson === 'string' ? timetableJson : JSON.stringify(timetableJson),
      recommendationsJson: typeof recommendationsJson === 'string' ? recommendationsJson : JSON.stringify(recommendationsJson),
    });
    res.status(201).json(plan);
  } catch (err: any) {
    console.error('Create plan failed:', err);
    res.status(500).json({ error: err.message || 'Failed to save study plan' });
  }
});

app.delete('/api/plans/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const planId = parseInt(req.params.id, 10);
    const result = await deleteStudyPlan(user.uid, planId);
    res.json(result);
  } catch (err: any) {
    console.error('Delete plan failed:', err);
    res.status(500).json({ error: err.message || 'Failed to delete study plan' });
  }
});

// 7. Comprehensive Dashboard Stats (connected directly to saved DB records)
app.get('/api/dashboard/stats', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const [allTasks, allSessions, settings] = await Promise.all([
      getTasks(user.uid),
      getStudySessions(user.uid),
      getUserSettings(user.uid),
    ]);

    const todayStr = new Date().toISOString().split('T')[0];

    // Today's tasks (due today or uncompleted and created/due by today)
    const todayTasks = allTasks.filter((t) => t.dueDate === todayStr || (!t.completed && t.dueDate <= todayStr));
    const completedTasks = allTasks.filter((t) => t.completed);
    const totalTasksCount = allTasks.length;
    const completionRate = totalTasksCount > 0 ? Math.round((completedTasks.length / totalTasksCount) * 100) : 0;

    // Study minutes calculation
    const totalStudyMinutes = allSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
    const todaySessions = allSessions.filter((s) => s.sessionDate === todayStr);
    const todayStudyMinutes = todaySessions.reduce((acc, s) => acc + s.durationMinutes, 0);

    // Last 7 days breakdown
    const weeklyData: { date: string; day: string; minutes: number; targetMinutes: number }[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const targetDailyMinutes = (settings.dailyStudyGoalHours || 4) * 60;

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const dayName = dayNames[d.getDay()];
      const dayMinutes = allSessions
        .filter((s) => s.sessionDate === dStr)
        .reduce((sum, s) => sum + s.durationMinutes, 0);

      weeklyData.push({
        date: dStr,
        day: dayName,
        minutes: dayMinutes,
        targetMinutes: targetDailyMinutes,
      });
    }

    // Upcoming deadlines (next 14 days, sorted ascending)
    const upcomingDeadlines = allTasks
      .filter((t) => !t.completed && t.dueDate >= todayStr)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 5);

    // Subject distribution
    const subjectMinutesMap: Record<string, number> = {};
    for (const s of allSessions) {
      subjectMinutesMap[s.subject] = (subjectMinutesMap[s.subject] || 0) + s.durationMinutes;
    }

    res.json({
      todayTasksCount: todayTasks.length,
      todayTasksCompleted: todayTasks.filter((t) => t.completed).length,
      todayTasks,
      totalCompletedTasks: completedTasks.length,
      totalTasksCount,
      completionRate,
      totalStudyHours: parseFloat((totalStudyMinutes / 60).toFixed(1)),
      todayStudyHours: parseFloat((todayStudyMinutes / 60).toFixed(1)),
      todayStudyMinutes,
      dailyGoalHours: settings.dailyStudyGoalHours,
      goalProgressPercent: Math.min(100, Math.round((todayStudyMinutes / targetDailyMinutes) * 100)),
      weeklyData,
      upcomingDeadlines,
      subjectMinutesMap,
      recentSessions: allSessions.slice(0, 5),
    });
  } catch (err: any) {
    console.error('Dashboard stats failed:', err);
    res.status(500).json({ error: err.message || 'Failed to compute dashboard analytics' });
  }
});

// Vite or Static handling
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FocusFlow AI server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup error:', err);
  process.exit(1);
});
