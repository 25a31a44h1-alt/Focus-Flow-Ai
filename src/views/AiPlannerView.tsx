import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  Calendar,
  Clock,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  BookmarkPlus,
  RefreshCw,
  ArrowRight,
  ListPlus,
  Layers,
} from 'lucide-react';
import { api, AIGeneratedPlan, SavedStudyPlan } from '../lib/api.ts';
import { useToast } from '../components/Toast.tsx';

interface SubjectEntry {
  id: string;
  name: string;
  examDate: string;
  priority: string;
}

interface AiPlannerViewProps {
  onNavigateToTasks: () => void;
  onOpenTimer: () => void;
}

export const AiPlannerView: React.FC<AiPlannerViewProps> = ({
  onNavigateToTasks,
  onOpenTimer,
}) => {
  const { success, error: toastError, info } = useToast();

  const [activeTab, setActiveTab] = useState<'create' | 'saved'>('create');
  const [aiStatus, setAiStatus] = useState<{ hasKey: boolean; model: string } | null>(null);

  // Form states
  const [subjects, setSubjects] = useState<SubjectEntry[]>([
    {
      id: 'sub-1',
      name: 'Mathematics',
      examDate: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 14);
        return d.toISOString().split('T')[0];
      })(),
      priority: 'Urgent',
    },
    {
      id: 'sub-2',
      name: 'Computer Science',
      examDate: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 21);
        return d.toISOString().split('T')[0];
      })(),
      priority: 'High',
    },
  ]);

  const [difficultTopics, setDifficultTopics] = useState(
    'Calculus integration techniques, dynamic programming algorithms, and recursion tree proofs.'
  );
  const [dailyHours, setDailyHours] = useState<number>(4);
  const [preferredStyle, setPreferredStyle] = useState<string>('Pomodoro (25m study / 5m break)');
  const [weekendStudy, setWeekendStudy] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('Need emphasis on active problem-solving rather than passive reading.');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [generatedPlan, setGeneratedPlan] = useState<AIGeneratedPlan | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isSavingPlan, setIsSavingPlan] = useState(false);

  // Saved plans history
  const [savedPlans, setSavedPlans] = useState<SavedStudyPlan[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  // Check key availability on mount
  const checkAiStatus = async () => {
    try {
      const status = await api.getAiStatus();
      setAiStatus(status);
    } catch (err) {
      console.error('Failed to get AI status:', err);
    }
  };

  const fetchSavedPlans = async () => {
    try {
      setLoadingSaved(true);
      const data = await api.getSavedPlans();
      setSavedPlans(data);
    } catch (err: any) {
      console.error('Failed to fetch saved plans:', err);
    } finally {
      setLoadingSaved(false);
    }
  };

  useEffect(() => {
    checkAiStatus();
    fetchSavedPlans();
  }, []);

  const handleAddSubject = () => {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 14);
    setSubjects((prev) => [
      ...prev,
      {
        id: 'sub-' + Math.random().toString(36).substring(2, 7),
        name: '',
        examDate: nextDate.toISOString().split('T')[0],
        priority: 'Medium',
      },
    ]);
  };

  const handleRemoveSubject = (id: string) => {
    if (subjects.length <= 1) {
      toastError('Cannot remove', 'At least one subject is required.');
      return;
    }
    setSubjects((prev) => prev.filter((s) => s.id !== id));
  };

  const handleUpdateSubject = (id: string, field: keyof SubjectEntry, value: string) => {
    setSubjects((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const validSubjects = subjects.filter((s) => s.name.trim() !== '');
    if (validSubjects.length === 0) {
      toastError('Validation Error', 'Please enter at least one subject name.');
      return;
    }

    setIsGenerating(true);
    setGenerationStep('Analyzing your exam deadlines and difficult topics...');

    try {
      setTimeout(() => {
        setGenerationStep('Calculating cognitive load and spaced repetition schedules...');
      }, 1500);

      setTimeout(() => {
        setGenerationStep('Generating high-retention daily timetable blocks...');
      }, 3500);

      const result = await api.generatePlan({
        subjects: validSubjects.map((s) => ({
          name: s.name.trim(),
          examDate: s.examDate,
          priority: s.priority,
        })),
        difficultTopics,
        dailyHours: Number(dailyHours),
        preferredStyle,
        weekendStudy,
        notes,
      });

      setGeneratedPlan(result);
      success('Timetable Ready!', 'FocusFlow AI has created your personalized study plan.');
    } catch (err: any) {
      console.error('Plan generation failed:', err);
      toastError('Generation Failed', err.message || 'Could not generate study timetable');
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  // Import tasks to board
  const handleBatchImport = async () => {
    if (!generatedPlan || !generatedPlan.priorityActionItems?.length) return;
    setIsImporting(true);
    try {
      const res = await api.batchImportTasks(generatedPlan.priorityActionItems);
      success(
        'Tasks Imported!',
        `Added ${res.imported} priority tasks directly to your Task board.`
      );
    } catch (err: any) {
      toastError('Import Failed', err.message);
    } finally {
      setIsImporting(false);
    }
  };

  // Save plan to DB
  const handleSavePlan = async () => {
    if (!generatedPlan) return;
    setIsSavingPlan(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);

      await api.savePlan({
        title: generatedPlan.planTitle,
        examDates: subjects,
        difficultTopics,
        dailyHours,
        startDate: todayStr,
        endDate: endDate.toISOString().split('T')[0],
        timetableJson: generatedPlan.dailySchedule,
        recommendationsJson: {
          overview: generatedPlan.overview,
          priorityActionItems: generatedPlan.priorityActionItems,
          studyTips: generatedPlan.studyTips,
        },
      });

      success('Plan Saved!', 'Your timetable has been archived to your saved plans.');
      fetchSavedPlans();
    } catch (err: any) {
      toastError('Save Failed', err.message);
    } finally {
      setIsSavingPlan(false);
    }
  };

  const handleDeleteSavedPlan = async (id: number) => {
    if (!window.confirm('Delete this saved plan?')) return;
    try {
      await api.deletePlan(id);
      setSavedPlans((prev) => prev.filter((p) => p.id !== id));
      success('Plan deleted', 'Removed from saved history.');
    } catch (err: any) {
      toastError('Delete failed', err.message);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in">
      {/* Top Banner & Mode Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
              AI Study Planner
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200">
              Gemini 3.8 Flash
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Intelligently balances exam deadlines, weak areas, and daily study capacity
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveTab('create')}
            className={`py-1.5 px-3.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'create'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Generate New Plan
          </button>
          <button
            onClick={() => {
              setActiveTab('saved');
              fetchSavedPlans();
            }}
            className={`py-1.5 px-3.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'saved'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Saved Plans ({savedPlans.length})</span>
          </button>
        </div>
      </div>

      {/* AI Key Missing Alert */}
      {aiStatus && !aiStatus.hasKey && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-950">Gemini API Key Required for Live AI Generation</p>
              <p className="text-amber-800 mt-0.5">
                To generate personalized AI study timetables using Gemini 3.8 Flash, make sure your <span className="font-mono font-bold">GEMINI_API_KEY</span> is configured in the AI Studio Secrets panel.
              </p>
            </div>
          </div>
          <button
            onClick={checkAiStatus}
            className="shrink-0 py-1 px-2.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold text-[11px] border border-amber-300 transition-colors flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Check Again</span>
          </button>
        </div>
      )}

      {activeTab === 'saved' ? (
        /* Saved Plans View */
        <div className="space-y-4">
          {loadingSaved ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : savedPlans.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-purple-100 shadow-xs space-y-3">
              <BookOpen className="w-8 h-8 text-purple-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No saved study plans yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Generate a study timetable and click "Save Plan" to archive it here for easy reference.
              </p>
              <button
                onClick={() => setActiveTab('create')}
                className="py-1.5 px-4 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition-colors"
              >
                Create a Study Plan
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedPlans.map((plan) => {
                let timetableArr = [];
                try {
                  timetableArr = JSON.parse(plan.timetableJson);
                } catch {
                  timetableArr = [];
                }

                return (
                  <div
                    key={plan.id}
                    className="p-5 rounded-2xl bg-white border border-purple-100 shadow-xs space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-bold text-slate-900">{plan.title}</h4>
                        <button
                          onClick={() => handleDeleteSavedPlan(plan.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                          title="Delete saved plan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="font-semibold text-purple-700 font-mono tabular-nums">
                          {plan.dailyHours}h/day
                        </span>
                        <span>·</span>
                        <span>{timetableArr.length || 7} days plan</span>
                        <span>·</span>
                        <span className="font-mono tabular-nums">{plan.startDate} to {plan.endDate}</span>
                      </div>
                      {plan.difficultTopics && (
                        <p className="text-[11px] text-slate-600 bg-purple-50/50 p-2 rounded-lg line-clamp-2">
                          <span className="font-semibold text-purple-900">Focus Areas: </span>
                          {plan.difficultTopics}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">
                        Saved on {new Date(plan.createdAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => {
                          let rec: any = {};
                          try {
                            rec = plan.recommendationsJson ? JSON.parse(plan.recommendationsJson) : {};
                          } catch {}
                          setGeneratedPlan({
                            planTitle: plan.title,
                            overview: rec.overview || 'Saved study schedule',
                            dailySchedule: timetableArr,
                            priorityActionItems: rec.priorityActionItems || [],
                            revisionMilestones: rec.revisionMilestones || [],
                            studyTips: rec.studyTips || [],
                          });
                          setActiveTab('create');
                          info('Loaded Plan', 'Viewing saved study timetable.');
                        }}
                        className="py-1 px-3 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-semibold transition-colors"
                      >
                        Open Plan
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Create & View Timetable Flow */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form Column */}
          <div className="lg:col-span-5 space-y-4">
            <form
              onSubmit={handleGeneratePlan}
              className="p-6 rounded-2xl bg-white border border-purple-100 shadow-xs space-y-5"
            >
              <div>
                <h3 className="text-sm font-bold text-slate-900">Study Profile & Deadlines</h3>
                <p className="text-[11px] text-slate-500">Provide your exam details for personalized scheduling</p>
              </div>

              {/* Subject Deadlines List */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    Subjects & Exam Dates
                  </label>
                  <button
                    type="button"
                    onClick={handleAddSubject}
                    className="text-[11px] font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Subject</span>
                  </button>
                </div>

                {subjects.map((sub, idx) => (
                  <div
                    key={sub.id}
                    className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Subject #{idx + 1}
                      </span>
                      {subjects.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSubject(sub.id)}
                          className="text-slate-400 hover:text-rose-600 p-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Subject (e.g. Physics)"
                        value={sub.name}
                        onChange={(e) => handleUpdateSubject(sub.id, 'name', e.target.value)}
                        className="text-xs py-1.5 px-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                      />
                      <input
                        type="date"
                        required
                        value={sub.examDate}
                        onChange={(e) => handleUpdateSubject(sub.id, 'examDate', e.target.value)}
                        className="text-xs py-1.5 px-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-purple-500 font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Weak / Difficult Topics */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Difficult Topics / Weak Areas
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Organic chemistry mechanism pathways, Calculus Taylor series..."
                  value={difficultTopics}
                  onChange={(e) => setDifficultTopics(e.target.value)}
                  className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Study Capacity & Preferences */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Daily Study Hours
                    </label>
                    <span className="text-xs font-bold text-purple-700 font-mono tabular-nums">
                      {dailyHours} hours/day
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.5"
                    value={dailyHours}
                    onChange={(e) => setDailyHours(Number(e.target.value))}
                    className="w-full accent-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Study Technique
                  </label>
                  <select
                    value={preferredStyle}
                    onChange={(e) => setPreferredStyle(e.target.value)}
                    className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-medium"
                  >
                    <option value="Pomodoro (25m study / 5m break)">Pomodoro (25m focus / 5m break)</option>
                    <option value="Deep Work (50m study / 10m break)">Deep Work (50m focus / 10m break)</option>
                    <option value="Spaced Repetition & Flashcards">Spaced Repetition & Flashcards</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-xs font-medium text-slate-700">Include Weekend Study</span>
                  <input
                    type="checkbox"
                    checked={weekendStudy}
                    onChange={(e) => setWeekendStudy(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 accent-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Additional Context / Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Free after 4 PM, prefers morning practice..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-900/30 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Synthesizing Timetable...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate AI Timetable</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-7 space-y-4">
            {isGenerating ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-purple-100 shadow-xs space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto border border-purple-200 animate-pulse">
                  <Sparkles className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900">Formulating Study Plan</h3>
                  <p className="text-xs text-purple-700 font-medium">{generationStep}</p>
                </div>
                <div className="w-48 h-1.5 bg-slate-100 rounded-full mx-auto overflow-hidden">
                  <div className="h-full bg-purple-600 rounded-full animate-pulse w-3/4" />
                </div>
              </div>
            ) : !generatedPlan ? (
              /* Empty Placeholder */
              <div className="p-12 text-center bg-white rounded-2xl border border-purple-100 shadow-xs space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto border border-purple-100">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Your AI Timetable will appear here</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Fill in your subjects, upcoming exams, and available hours on the left to generate an optimized revision schedule.
                  </p>
                </div>
              </div>
            ) : (
              /* Generated Plan View */
              <div className="space-y-4 animate-in fade-in">
                {/* Header Action Strip */}
                <div className="p-5 rounded-2xl bg-white border border-purple-100 shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{generatedPlan.planTitle}</h3>
                      <p className="text-xs text-slate-600 mt-1">{generatedPlan.overview}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={handleSavePlan}
                        disabled={isSavingPlan}
                        className="py-1.5 px-3 rounded-xl border border-purple-200 hover:bg-purple-50 text-purple-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
                      >
                        <BookmarkPlus className="w-3.5 h-3.5" />
                        <span>{isSavingPlan ? 'Saving...' : 'Save Plan'}</span>
                      </button>

                      {generatedPlan.priorityActionItems?.length > 0 && (
                        <button
                          onClick={handleBatchImport}
                          disabled={isImporting}
                          className="py-1.5 px-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                        >
                          <ListPlus className="w-3.5 h-3.5" />
                          <span>{isImporting ? 'Importing...' : 'Add to Tasks'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Study Strategy Tips */}
                  {generatedPlan.studyTips?.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2">
                      {generatedPlan.studyTips.map((tip, i) => (
                        <span
                          key={i}
                          className="text-[11px] py-1 px-2.5 rounded-lg bg-purple-50/80 text-purple-900 border border-purple-100/80"
                        >
                          💡 {tip}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Priority Action Tasks Ready to import */}
                {generatedPlan.priorityActionItems?.length > 0 && (
                  <div className="p-5 rounded-2xl bg-white border border-purple-100 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        High-Impact Action Items ({generatedPlan.priorityActionItems.length})
                      </h4>
                      <button
                        onClick={handleBatchImport}
                        disabled={isImporting}
                        className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1"
                      >
                        <span>Import All</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {generatedPlan.priorityActionItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1 hover:border-purple-200 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-900 truncate">
                              {item.title}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                item.priority === 'Urgent'
                                  ? 'bg-rose-100 text-rose-700'
                                  : item.priority === 'High'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-purple-100 text-purple-700'
                              }`}
                            >
                              {item.priority}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span>{item.subject}</span>
                            <span className="font-mono tabular-nums">{item.estimatedMinutes}m · {item.dueDate}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Daily Schedule Breakdown */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider px-1">
                    7-Day Timetable Schedule
                  </h4>

                  {generatedPlan.dailySchedule?.map((dayPlan, dayIdx) => (
                    <div
                      key={dayIdx}
                      className="p-4 rounded-2xl bg-white border border-purple-100 shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-purple-600 text-white font-bold text-xs flex items-center justify-center font-mono">
                            {dayIdx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-900">{dayPlan.day}</span>
                          <span className="text-[11px] text-slate-400 font-mono tabular-nums">({dayPlan.date})</span>
                        </div>
                        <span className="text-xs font-semibold text-purple-700 font-mono tabular-nums">
                          {dayPlan.totalHours} hrs
                        </span>
                      </div>

                      <p className="text-[11px] font-medium text-slate-600 italic">
                        Goal: {dayPlan.focusTheme}
                      </p>

                      {/* Blocks list */}
                      <div className="space-y-2 pt-1 border-t border-slate-100">
                        {dayPlan.blocks?.map((block, bIdx) => (
                          <div
                            key={bIdx}
                            className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-purple-50/30 transition-colors"
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <span className="text-[10px] font-bold text-purple-800 font-mono tabular-nums mt-0.5 shrink-0 bg-purple-100/70 px-1.5 py-0.5 rounded">
                                {block.startTime} - {block.endTime}
                              </span>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-900 truncate">
                                  {block.subject}: <span className="font-normal text-slate-700">{block.topic}</span>
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5">{block.activity}</p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-2 text-[10px] text-slate-500 shrink-0">
                              <span className="font-medium text-purple-700">{block.studyTechnique}</span>
                              <span>·</span>
                              <span className="font-mono tabular-nums">{block.durationMinutes}m</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
