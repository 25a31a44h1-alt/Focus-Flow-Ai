import { db } from './index.ts';
import { users, userSettings, tasks, studySessions, studyPlans } from './schema.ts';
import { eq, and, desc, sql } from 'drizzle-orm';

// User & Settings Queries
export async function getOrCreateUser(uid: string, email: string, displayName?: string, photoUrl?: string) {
  try {
    const existing = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    if (existing.length > 0) {
      // update profile if provided
      if (displayName || photoUrl) {
        await db
          .update(users)
          .set({
            displayName: displayName || existing[0].displayName,
            photoUrl: photoUrl || existing[0].photoUrl,
          })
          .where(eq(users.uid, uid));
      }
      return existing[0];
    }

    const inserted = await db
      .insert(users)
      .values({
        uid,
        email: email || 'student@focusflow.ai',
        displayName: displayName || 'Student',
        photoUrl: photoUrl || null,
      })
      .returning();

    // Ensure initial settings exist
    await db
      .insert(userSettings)
      .values({
        userId: uid,
        dailyStudyGoalHours: 4,
        preferredStudyStyle: 'Pomodoro',
        notificationsEnabled: true,
        weekendStudyAllowed: true,
        focusTimeMinutes: 25,
        breakTimeMinutes: 5,
      })
      .onConflictDoNothing();

    return inserted[0];
  } catch (error) {
    console.error('getOrCreateUser error:', error);
    throw new Error('Failed to resolve user account', { cause: error });
  }
}

export async function getUserSettings(userId: string) {
  try {
    const settings = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    if (settings.length === 0) {
      const created = await db
        .insert(userSettings)
        .values({
          userId,
          dailyStudyGoalHours: 4,
          preferredStudyStyle: 'Pomodoro',
          notificationsEnabled: true,
          weekendStudyAllowed: true,
          focusTimeMinutes: 25,
          breakTimeMinutes: 5,
        })
        .returning();
      return created[0];
    }
    return settings[0];
  } catch (error) {
    console.error('getUserSettings error:', error);
    throw new Error('Failed to load user settings', { cause: error });
  }
}

export async function updateUserSettings(
  userId: string,
  data: {
    dailyStudyGoalHours?: number;
    preferredStudyStyle?: string;
    notificationsEnabled?: boolean;
    weekendStudyAllowed?: boolean;
    focusTimeMinutes?: number;
    breakTimeMinutes?: number;
  }
) {
  try {
    const updated = await db
      .insert(userSettings)
      .values({
        userId,
        dailyStudyGoalHours: data.dailyStudyGoalHours ?? 4,
        preferredStudyStyle: data.preferredStudyStyle ?? 'Pomodoro',
        notificationsEnabled: data.notificationsEnabled ?? true,
        weekendStudyAllowed: data.weekendStudyAllowed ?? true,
        focusTimeMinutes: data.focusTimeMinutes ?? 25,
        breakTimeMinutes: data.breakTimeMinutes ?? 5,
      })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: {
          ...data,
          updatedAt: new Date(),
        },
      })
      .returning();
    return updated[0];
  } catch (error) {
    console.error('updateUserSettings error:', error);
    throw new Error('Failed to save user settings', { cause: error });
  }
}

// Tasks Queries
export async function getTasks(userId: string) {
  try {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId))
      .orderBy(desc(tasks.createdAt));
  } catch (error) {
    console.error('getTasks error:', error);
    throw new Error('Failed to load tasks', { cause: error });
  }
}

export async function createTask(
  userId: string,
  data: {
    title: string;
    subject: string;
    priority: string;
    dueDate: string;
    estimatedDuration: number;
    notes?: string;
    source?: string;
  }
) {
  try {
    const res = await db
      .insert(tasks)
      .values({
        userId,
        title: data.title,
        subject: data.subject,
        priority: data.priority || 'Medium',
        dueDate: data.dueDate,
        estimatedDuration: data.estimatedDuration,
        notes: data.notes || null,
        source: data.source || 'manual',
        completed: false,
      })
      .returning();
    return res[0];
  } catch (error) {
    console.error('createTask error:', error);
    throw new Error('Failed to create task', { cause: error });
  }
}

export async function updateTask(
  userId: string,
  taskId: number,
  data: {
    title?: string;
    subject?: string;
    priority?: string;
    dueDate?: string;
    estimatedDuration?: number;
    notes?: string;
    completed?: boolean;
  }
) {
  try {
    const updatePayload: any = { ...data };
    if (data.completed !== undefined) {
      updatePayload.completedAt = data.completed ? new Date() : null;
    }
    const res = await db
      .update(tasks)
      .set(updatePayload)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .returning();
    return res[0];
  } catch (error) {
    console.error('updateTask error:', error);
    throw new Error('Failed to update task', { cause: error });
  }
}

export async function deleteTask(userId: string, taskId: number) {
  try {
    await db
      .delete(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));
    return { success: true, id: taskId };
  } catch (error) {
    console.error('deleteTask error:', error);
    throw new Error('Failed to delete task', { cause: error });
  }
}

// Study Sessions Queries
export async function getStudySessions(userId: string) {
  try {
    return await db
      .select()
      .from(studySessions)
      .where(eq(studySessions.userId, userId))
      .orderBy(desc(studySessions.createdAt));
  } catch (error) {
    console.error('getStudySessions error:', error);
    throw new Error('Failed to load study sessions', { cause: error });
  }
}

export async function createStudySession(
  userId: string,
  data: {
    subject: string;
    durationMinutes: number;
    sessionDate: string;
    taskId?: number;
    notes?: string;
  }
) {
  try {
    const res = await db
      .insert(studySessions)
      .values({
        userId,
        subject: data.subject,
        durationMinutes: data.durationMinutes,
        sessionDate: data.sessionDate,
        taskId: data.taskId || null,
        notes: data.notes || null,
      })
      .returning();
    return res[0];
  } catch (error) {
    console.error('createStudySession error:', error);
    throw new Error('Failed to log study session', { cause: error });
  }
}

// AI Study Plans Queries
export async function getStudyPlans(userId: string) {
  try {
    return await db
      .select()
      .from(studyPlans)
      .where(eq(studyPlans.userId, userId))
      .orderBy(desc(studyPlans.createdAt));
  } catch (error) {
    console.error('getStudyPlans error:', error);
    throw new Error('Failed to load study plans', { cause: error });
  }
}

export async function createStudyPlan(
  userId: string,
  data: {
    title: string;
    examDates: string;
    difficultTopics: string;
    dailyHours: number;
    startDate: string;
    endDate: string;
    timetableJson: string;
    recommendationsJson?: string;
  }
) {
  try {
    const res = await db
      .insert(studyPlans)
      .values({
        userId,
        title: data.title,
        examDates: data.examDates,
        difficultTopics: data.difficultTopics,
        dailyHours: data.dailyHours,
        startDate: data.startDate,
        endDate: data.endDate,
        timetableJson: data.timetableJson,
        recommendationsJson: data.recommendationsJson || null,
        isActive: true,
      })
      .returning();
    return res[0];
  } catch (error) {
    console.error('createStudyPlan error:', error);
    throw new Error('Failed to save study plan', { cause: error });
  }
}

export async function deleteStudyPlan(userId: string, planId: number) {
  try {
    await db
      .delete(studyPlans)
      .where(and(eq(studyPlans.id, planId), eq(studyPlans.userId, userId)));
    return { success: true, id: planId };
  } catch (error) {
    console.error('deleteStudyPlan error:', error);
    throw new Error('Failed to delete study plan', { cause: error });
  }
}
