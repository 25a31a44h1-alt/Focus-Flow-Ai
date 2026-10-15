import { relations } from 'drizzle-orm';
import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const userSettings = pgTable('user_settings', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.uid, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  dailyStudyGoalHours: integer('daily_study_goal_hours').default(4).notNull(),
  preferredStudyStyle: text('preferred_study_style').default('Pomodoro').notNull(),
  notificationsEnabled: boolean('notifications_enabled').default(true).notNull(),
  weekendStudyAllowed: boolean('weekend_study_allowed').default(true).notNull(),
  focusTimeMinutes: integer('focus_time_minutes').default(25).notNull(),
  breakTimeMinutes: integer('break_time_minutes').default(5).notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.uid, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  subject: text('subject').notNull(),
  priority: text('priority').default('Medium').notNull(), // 'Low' | 'Medium' | 'High' | 'Urgent'
  dueDate: text('due_date').notNull(), // YYYY-MM-DD
  estimatedDuration: integer('estimated_duration').notNull(), // minutes
  completed: boolean('completed').default(false).notNull(),
  completedAt: timestamp('completed_at'),
  notes: text('notes'),
  source: text('source').default('manual').notNull(), // 'manual' | 'ai_planner'
  createdAt: timestamp('created_at').defaultNow(),
});

export const studySessions = pgTable('study_sessions', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.uid, { onDelete: 'cascade' })
    .notNull(),
  taskId: integer('task_id'),
  subject: text('subject').notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  sessionDate: text('session_date').notNull(), // YYYY-MM-DD
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const studyPlans = pgTable('study_plans', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.uid, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  examDates: text('exam_dates').notNull(), // JSON string
  difficultTopics: text('difficult_topics').notNull(),
  dailyHours: integer('daily_hours').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  timetableJson: text('timetable_json').notNull(), // JSON string
  recommendationsJson: text('recommendations_json'), // JSON string
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  settings: one(userSettings, {
    fields: [users.uid],
    references: [userSettings.userId],
  }),
  tasks: many(tasks),
  sessions: many(studySessions),
  plans: many(studyPlans),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.uid],
  }),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.uid],
  }),
}));

export const studySessionsRelations = relations(studySessions, ({ one }) => ({
  user: one(users, {
    fields: [studySessions.userId],
    references: [users.uid],
  }),
}));

export const studyPlansRelations = relations(studyPlans, ({ one }) => ({
  user: one(users, {
    fields: [studyPlans.userId],
    references: [users.uid],
  }),
}));
