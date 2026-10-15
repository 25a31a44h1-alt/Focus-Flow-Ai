# FocusFlow AI — Student Study Planner & Timetable Generator

FocusFlow AI is a student productivity and study planning application designed to maximize academic performance, defeat procrastination, and build cognitive study routines.

Powered by **Gemini 3.8 Flash**, **PostgreSQL on Cloud SQL**, **Drizzle ORM**, **Firebase Authentication**, and a **React 19 + Tailwind CSS** frontend.

---

## 🌟 Core Features

### 1. Productivity Dashboard
- **Today's Focus Tasks**: Instant checklist of tasks due today or pending review with duration, priority badges, and quick completion toggles.
- **Dynamic KPI Cards**: Tracks today's tasks completed, daily study hours vs. goals, total tasks, and overall completion rate.
- **Weekly Study Progress Chart**: Visual bar chart comparing each day's study time against target daily goals.
- **Upcoming Deadlines**: Real-time countdown for upcoming exams and assignment submissions.
- **Personalized Greeting**: Morning/afternoon/evening greetings tailored to the student.

### 2. Task Management & Prioritization
- **Full CRUD Support**: Create, read, edit, complete, and delete study tasks.
- **Task Attributes**: Title, Subject, Priority (`Urgent`, `High`, `Medium`, `Low`), Due Date, Estimated Duration (minutes), and Notes.
- **Multi-Filter & Search**: Instant client-side search, status filter (`All`, `Pending`, `Completed`), subject filter, and priority filter.
- **Sorting**: Sort by due date, urgency priority, duration, or title.
- **One-Click Timer Launch**: Launch a focus timer directly for any specific task.

### 3. AI Study Planner (Gemini 3.8 Flash)
- **Comprehensive Profile Input**: Accepts multiple subjects, target exam dates, difficult/weak topics, daily study capacity (hours), preferred technique, and weekend study preferences.
- **Cognitive Science Scheduling**: The AI balances cognitive fatigue, active recall, interleaving (subject switching), and spaced repetition intervals.
- **Structured 7-Day Timetable**: Hourly blocks with start/end times, topics, specific practice activities, and break intervals.
- **One-Click Batch Import**: Add all high-impact AI action items directly to the student task board with one click.
- **Save & Review Plans**: Archive generated plans into the persistent database to review or reopen anytime.

### 4. Progress & Study Session Analytics
- **Live Database Calculations**: Every statistic is computed directly from saved task and session records.
- **Subject Distribution**: Visual percentage progress bars showing time invested across each academic subject.
- **Session Logs Table**: Detailed historical record of all completed focus sessions with dates, durations, and notes.
- **Interactive Focus Timer (Pomodoro)**: Real-time 25m Pomodoro, 50m Deep Work, or custom duration timer with automatic DB logging on completion.
- **Manual Log Modal**: Quickly record offline study time.

### 5. Settings & Preferences
- **Customizable Daily Goal**: Slider to set daily target study hours (1 to 12 hours).
- **Default Study Style**: Configure Pomodoro, Deep Work, or Spaced Repetition preferences.
- **Focus & Break Durations**: Adjust work block and rest periods.
- **Weekend Allowance**: Toggle weekend study scheduling.
- **Account Data Isolation**: Securely isolates user records by Firebase Auth UID.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, date-fns
- **Backend**: Node.js, Express, tsx
- **Database**: PostgreSQL on Google Cloud SQL, Drizzle ORM, Drizzle Kit
- **AI Integration**: `@google/genai` TypeScript SDK with `gemini-3.8-flash`
- **Authentication**: Firebase Authentication (Google Sign-In + Guest fallback)

---

## 🚀 Running the Project

### Prerequisites
- Node.js 18+ or 20+
- Google Cloud SQL / PostgreSQL database
- Google Gemini API key

### 1. Installation
```bash
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

Ensure `GEMINI_API_KEY` is provided for AI timetable generation.

### 3. Database Migration
To generate and push the database schema:
```bash
npx drizzle-kit push
```

### 4. Development Server
Run the full-stack server (Express + Vite middleware):
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Production Build
```bash
npm run build
npm start
```

---

## 🔒 Security & Best Practices
- **Server-Side AI API Calls**: Gemini API is only invoked from server-side functions; the API key is never exposed to the browser.
- **User Record Isolation**: Every database query is scoped strictly to the authenticated `user.uid`.
- **Zero-Pill Aesthetic Discipline**: Clean unboxed metadata, sophisticated dark navy sidebar (`#0B1120`), and light lavender content areas.
