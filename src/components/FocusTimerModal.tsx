import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Check, X, Clock, Award } from 'lucide-react';
import { api, Task } from '../lib/api.ts';
import { useToast } from './Toast.tsx';

interface FocusTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionLogged?: () => void;
  tasks?: Task[];
}

export const FocusTimerModal: React.FC<FocusTimerModalProps> = ({
  isOpen,
  onClose,
  onSessionLogged,
  tasks = [],
}) => {
  const { success, error } = useToast();

  const [mode, setMode] = useState<'pomodoro' | 'deep' | 'custom'>('pomodoro');
  const [targetMinutes, setTargetMinutes] = useState<number>(25);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [selectedSubject, setSelectedSubject] = useState<string>('Mathematics');
  const [selectedTaskId, setSelectedTaskId] = useState<number | undefined>(undefined);
  const [customSubject, setCustomSubject] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [completedCycles, setCompletedCycles] = useState<number>(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Set default subject if tasks exist
  useEffect(() => {
    if (tasks.length > 0 && !selectedTaskId) {
      const pendingTask = tasks.find((t) => !t.completed);
      if (pendingTask) {
        setSelectedTaskId(pendingTask.id);
        setSelectedSubject(pendingTask.subject);
      }
    }
  }, [tasks, selectedTaskId]);

  // Mode change handler
  const handleModeChange = (newMode: 'pomodoro' | 'deep' | 'custom') => {
    setMode(newMode);
    setIsRunning(false);
    let mins = 25;
    if (newMode === 'pomodoro') mins = 25;
    else if (newMode === 'deep') mins = 50;
    else mins = targetMinutes;
    setTargetMinutes(mins);
    setSecondsRemaining(mins * 60);
  };

  const handleCustomMinutesChange = (mins: number) => {
    const clamped = Math.max(1, Math.min(180, mins));
    setTargetMinutes(clamped);
    if (!isRunning) {
      setSecondsRemaining(clamped * 60);
    }
  };

  // Timer countdown loop
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const handleTimerComplete = async () => {
    setCompletedCycles((c) => c + 1);
    await logSession(targetMinutes, true);
  };

  const logSession = async (minutesSpent: number, finishedNaturally: boolean = false) => {
    if (minutesSpent <= 0) return;
    setIsSubmitting(true);
    try {
      const subject = customSubject.trim() || selectedSubject || 'General Study';
      const todayStr = new Date().toISOString().split('T')[0];

      await api.createSession({
        subject,
        durationMinutes: minutesSpent,
        sessionDate: todayStr,
        taskId: selectedTaskId,
        notes: notes || (finishedNaturally ? 'Completed full focus cycle' : 'Partial focus session'),
        markTaskCompleted: finishedNaturally && selectedTaskId ? true : false,
      });

      success('Study session logged!', `Recorded ${minutesSpent} minutes of focused study in ${subject}.`);
      if (onSessionLogged) {
        onSessionLogged();
      }
      setIsRunning(false);
      setSecondsRemaining(targetMinutes * 60);
    } catch (err: any) {
      console.error('Failed to log session:', err);
      error('Could not save session', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEarlyFinish = () => {
    const elapsedSeconds = targetMinutes * 60 - secondsRemaining;
    const elapsedMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
    logSession(elapsedMinutes, false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsRemaining(targetMinutes * 60);
  };

  if (!isOpen) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const totalSeconds = targetMinutes * 60;
  const progressPercent = totalSeconds > 0 ? ((totalSeconds - secondsRemaining) / totalSeconds) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-purple-100 max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#0B1120] to-[#1E1B4B] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center border border-purple-500/30">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Focus Session Timer</h3>
              <p className="text-[11px] text-purple-200/80">Stay locked in and track actual study time</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => handleModeChange('pomodoro')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'pomodoro'
                  ? 'bg-white text-purple-700 shadow-xs border border-purple-100'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pomodoro (25m)
            </button>
            <button
              onClick={() => handleModeChange('deep')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'deep'
                  ? 'bg-white text-purple-700 shadow-xs border border-purple-100'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Deep Work (50m)
            </button>
            <button
              onClick={() => handleModeChange('custom')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'custom'
                  ? 'bg-white text-purple-700 shadow-xs border border-purple-100'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Custom
            </button>
          </div>

          {mode === 'custom' && (
            <div className="flex items-center justify-center gap-3">
              <span className="text-xs text-slate-600 font-medium">Duration:</span>
              <input
                type="range"
                min="5"
                max="120"
                step="5"
                value={targetMinutes}
                onChange={(e) => handleCustomMinutesChange(Number(e.target.value))}
                className="w-48 accent-purple-600"
              />
              <span className="text-xs font-bold text-purple-900 font-mono w-12 text-right">
                {targetMinutes}m
              </span>
            </div>
          )}

          {/* Clock Display */}
          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative w-52 h-52 flex items-center justify-center">
              {/* Outer Circular Ring */}
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  className="stroke-slate-100"
                  strokeWidth="6"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  className="stroke-purple-600 transition-all duration-500 ease-linear"
                  strokeWidth="6"
                  strokeDasharray="276.46"
                  strokeDashoffset={276.46 - (276.46 * progressPercent) / 100}
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-4xl font-extrabold tracking-tight text-slate-900 font-mono tabular-nums">
                  {formattedTime}
                </span>
                <span className="text-[11px] font-semibold text-purple-600 uppercase tracking-wider mt-1">
                  {isRunning ? 'Focus Mode' : secondsRemaining === 0 ? 'Cycle Done!' : 'Ready'}
                </span>
              </div>
            </div>

            {/* Timer Controls */}
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={handleReset}
                title="Reset Timer"
                className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`py-3 px-8 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-md transition-all ${
                  isRunning
                    ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-900/20'
                    : 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-900/30'
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4 fill-white" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>{secondsRemaining === targetMinutes * 60 ? 'Start Focus' : 'Resume'}</span>
                  </>
                )}
              </button>

              {secondsRemaining < targetMinutes * 60 && (
                <button
                  onClick={handleEarlyFinish}
                  disabled={isSubmitting}
                  title="Finish & Save Current Time"
                  className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Context: Subject & Task linking */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Study Subject
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full text-xs py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                >
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Biology">Biology</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="History">History</option>
                  <option value="Literature">Literature</option>
                  <option value="Economics">Economics</option>
                  <option value="Other">Other (Custom)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Link to Task (Optional)
                </label>
                <select
                  value={selectedTaskId || ''}
                  onChange={(e) => {
                    const id = e.target.value ? Number(e.target.value) : undefined;
                    setSelectedTaskId(id);
                    if (id) {
                      const t = tasks.find((item) => item.id === id);
                      if (t) setSelectedSubject(t.subject);
                    }
                  }}
                  className="w-full text-xs py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-purple-500 truncate"
                >
                  <option value="">No linked task</option>
                  {tasks
                    .filter((t) => !t.completed)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title} ({t.subject})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {selectedSubject === 'Other' && (
              <div>
                <input
                  type="text"
                  placeholder="Enter custom subject name..."
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="w-full text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                />
              </div>
            )}

            <div>
              <input
                type="text"
                placeholder="Session notes (e.g. Completed Chapter 4 review exercises)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          {completedCycles > 0 && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-50 border border-purple-200 text-purple-800 text-xs font-medium">
              <Award className="w-4 h-4 text-purple-600 shrink-0" />
              <span>Great focus! You have completed {completedCycles} study cycle(s) today.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
