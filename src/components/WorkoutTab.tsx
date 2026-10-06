import React, { useState, useEffect, useRef } from 'react';
import { 
  Dumbbell, TrendingUp, Clock, Flame, Plus, Trash2, Award, Sparkles, 
  ExternalLink, X, Info, AlertTriangle, Play, Pause, RotateCcw, 
  Search, Check, ChevronDown, ChevronUp, Scale, FolderPlus, Save,
  Edit3, BookOpen, Layers, Filter, Eye, CheckCircle2, ListFilter,
  Folder, History, Activity, BarChart2, Target, Zap, ArrowUpRight, Copy, Trophy, Calendar
} from 'lucide-react';
import { 
  WorkoutItem, ProgressiveChallenge, UserRole, 
  WorkoutSessionItem, ExerciseProgressionRecord 
} from '../types';
import { api } from '../services/api';

interface ExerciseSuggestion {
  id: string;
  name: string;
  body_part: string;
  target: string;
  equipment: string;
  gif_url?: string;
  instructions?: string[];
}

interface WorkoutSetState {
  id: string;
  setNumber: number;
  weight: number;
  reps: number;
  rpe?: number;
  isWarmup: boolean;
}

interface SessionExerciseState {
  exerciseId: string;
  exerciseName: string;
  bodyPart: string;
  target: string;
  equipment: string;
  notes?: string;
  sets: WorkoutSetState[];
}

interface WorkoutTabProps {
  currentRole: UserRole;
  onOpenAuth: () => void;
}

export const WorkoutTab: React.FC<WorkoutTabProps> = ({ currentRole, onOpenAuth }) => {
  // Top-level View Mode: 'session' | 'history' | 'progression' | 'library'
  const [activeSubTab, setActiveSubTab] = useState<'session' | 'history' | 'progression' | 'library'>('session');

  // Logs & History State
  const [workouts, setWorkouts] = useState<WorkoutItem[]>([]);
  const [savedSessions, setSavedSessions] = useState<WorkoutSessionItem[]>([]);
  const [exerciseProgressions, setExerciseProgressions] = useState<ExerciseProgressionRecord[]>([]);
  const [selectedProgressionExercise, setSelectedProgressionExercise] = useState<string>('all');
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [expandedSessionIds, setExpandedSessionIds] = useState<Set<string>>(new Set());
  const [challenges, setChallenges] = useState<ProgressiveChallenge[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeModalItem, setActiveModalItem] = useState<WorkoutItem | null>(null);
  const [showAllHistoryModal, setShowAllHistoryModal] = useState(false);
  const [historySummary, setHistorySummary] = useState<any>(null);

  // ==========================================
  // WORKOUT SESSION 'FOLDER/ROUTINE' STATE
  // ==========================================
  const [sessionName, setSessionName] = useState('Push Day A - Upper Power');
  const [sessionNotes, setSessionNotes] = useState('');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  
  // Stopwatch / Duration Tracking state ('live' vs 'manual')
  const [durationMode, setDurationMode] = useState<'live' | 'manual'>('live');
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [manualDurationMinutes, setManualDurationMinutes] = useState<number>(45);

  const handleSwitchDurationMode = (mode: 'live' | 'manual') => {
    setDurationMode(mode);
    if (mode === 'manual') {
      if (timerSeconds > 0) {
        setManualDurationMinutes(Math.max(1, Math.round(timerSeconds / 60)));
      }
      setIsTimerRunning(false);
    }
  };

  // Exercises inside this Session Folder
  const [sessionExercises, setSessionExercises] = useState<SessionExerciseState[]>([
    {
      exerciseId: 'ex_0001',
      exerciseName: 'Barbell Bench Press',
      bodyPart: 'chest',
      target: 'pectorals',
      equipment: 'barbell',
      notes: 'Focus on explosive concentric, 2s eccentric pause',
      sets: [
        { id: '1', setNumber: 1, weight: 60, reps: 12, rpe: 7, isWarmup: true },
        { id: '2', setNumber: 2, weight: 80, reps: 8, rpe: 8.5, isWarmup: false },
        { id: '3', setNumber: 3, weight: 85, reps: 6, rpe: 9, isWarmup: false },
        { id: '4', setNumber: 4, weight: 85, reps: 5, rpe: 9.5, isWarmup: false },
      ],
    },
    {
      exerciseId: 'ex_0016',
      exerciseName: 'Cable Tricep Pushdown',
      bodyPart: 'arms',
      target: 'triceps',
      equipment: 'cable',
      notes: 'Straight bar attachment, peak contraction squeeze',
      sets: [
        { id: '5', setNumber: 1, weight: 30, reps: 12, rpe: 8, isWarmup: false },
        { id: '6', setNumber: 2, weight: 35, reps: 10, rpe: 8.5, isWarmup: false },
        { id: '7', setNumber: 3, weight: 35, reps: 9, rpe: 9, isWarmup: false },
      ],
    },
  ]);

  // ==========================================
  // EXERCISE AUTO-SUGGEST SEARCH STATE (Session)
  // ==========================================
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<ExerciseSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  // Status feedback
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isSavingSession, setIsSavingSession] = useState(false);

  // ==========================================
  // EXERCISE LIBRARY / BROWSE STATE
  // ==========================================
  const [libraryExercises, setLibraryExercises] = useState<ExerciseSuggestion[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [librarySearch, setLibrarySearch] = useState('');
  const [selectedBodyPart, setSelectedBodyPart] = useState('all');
  const [selectedEquipment, setSelectedEquipment] = useState('all');
  const [inspectingExercise, setInspectingExercise] = useState<ExerciseSuggestion | null>(null);
  const libraryDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Timer interval effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && durationMode === 'live') {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, durationMode]);

  // Close auto-suggest dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTimer = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const fetchWorkoutData = async () => {
    setLoading(true);
    try {
      const [historyRes, sessionsRes, progressionRes, challengeRes] = await Promise.all([
        api.request('GET', '/api/workouts/history'),
        api.request('GET', '/api/workouts/sessions'),
        api.request('GET', '/api/workouts/progression'),
        api.request('GET', '/api/workouts/progressive-challenge'),
      ]);

      if (historyRes.status === 200 && historyRes.response.success) {
        setWorkouts(historyRes.response.data || []);
        setHistorySummary(historyRes.response.summary || null);
        if (historyRes.response.sessions && (!sessionsRes.response || !sessionsRes.response.data)) {
          setSavedSessions(historyRes.response.sessions);
        }
        if (historyRes.response.progressions && (!progressionRes.response || !progressionRes.response.data)) {
          setExerciseProgressions(historyRes.response.progressions);
        }
      } else {
        setWorkouts([]);
      }

      if (sessionsRes.status === 200 && sessionsRes.response.success && Array.isArray(sessionsRes.response.data)) {
        setSavedSessions(sessionsRes.response.data);
        if (sessionsRes.response.data.length > 0) {
          setExpandedSessionIds((prev) => {
            if (prev.size === 0) {
              const firstId = sessionsRes.response.data[0].id || sessionsRes.response.data[0]._id;
              return new Set([firstId]);
            }
            return prev;
          });
        }
      }

      if (progressionRes.status === 200 && progressionRes.response.success && Array.isArray(progressionRes.response.data)) {
        setExerciseProgressions(progressionRes.response.data);
      }

      if (challengeRes.status === 200 && challengeRes.response.success) {
        setChallenges(challengeRes.response.challenges || []);
      } else {
        setChallenges([]);
      }
    } catch (err) {
      console.error('Error fetching workout data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch full Exercise Library from /api/exercises
  const fetchLibraryExercises = async (search?: string, bodyPart?: string, equipment?: string) => {
    setLibraryLoading(true);
    const s = search !== undefined ? search : librarySearch;
    const bp = bodyPart !== undefined ? bodyPart : selectedBodyPart;
    const eq = equipment !== undefined ? equipment : selectedEquipment;

    const queryParams = new URLSearchParams();
    if (s.trim()) queryParams.set('search', s.trim());
    if (bp && bp !== 'all') queryParams.set('bodyPart', bp);
    if (eq && eq !== 'all') queryParams.set('equipment', eq);

    try {
      const { response, status } = await api.request('GET', `/api/exercises?${queryParams.toString()}`);
      if (status === 200 && response.success && Array.isArray(response.data)) {
        setLibraryExercises(response.data);
      } else {
        setLibraryExercises([]);
      }
    } catch {
      setLibraryExercises([]);
    } finally {
      setLibraryLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkoutData();
    fetchLibraryExercises();
  }, [currentRole]);

  // Handle Library Search with Debounce
  const handleLibrarySearchChange = (term: string) => {
    setLibrarySearch(term);
    if (libraryDebounceRef.current) clearTimeout(libraryDebounceRef.current);
    libraryDebounceRef.current = setTimeout(() => {
      fetchLibraryExercises(term, selectedBodyPart, selectedEquipment);
    }, 250);
  };

  // Handle Session Auto-Suggest Search
  const handleSearchChange = (term: string) => {
    setSearchQuery(term);
    if (!term.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setShowSuggestions(true);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    searchDebounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { response, status } = await api.request('GET', `/api/exercises?search=${encodeURIComponent(term.trim())}`);
        if (status === 200 && response.success && Array.isArray(response.data)) {
          setSuggestions(response.data.slice(0, 8));
        } else {
          setSuggestions([]);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 200);
  };

  const handleSelectExercise = (exercise: ExerciseSuggestion) => {
    const defaultWeight = weightUnit === 'lbs' ? 135 : 60;
    const newExercise: SessionExerciseState = {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      bodyPart: exercise.body_part,
      target: exercise.target,
      equipment: exercise.equipment,
      notes: '',
      sets: [
        { id: crypto.randomUUID(), setNumber: 1, weight: Math.round(defaultWeight * 0.7), reps: 12, rpe: 7, isWarmup: true },
        { id: crypto.randomUUID(), setNumber: 2, weight: defaultWeight, reps: 10, rpe: 8.5, isWarmup: false },
        { id: crypto.randomUUID(), setNumber: 3, weight: defaultWeight, reps: 8, rpe: 9, isWarmup: false },
      ],
    };

    setSessionExercises((prev) => [...prev, newExercise]);
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setActionMessage({
      text: `Added "${exercise.name}" to session folder!`,
      type: 'success',
    });
  };

  // Weight Unit Switcher (KG <-> LBS)
  const handleToggleWeightUnit = (newUnit: 'kg' | 'lbs') => {
    if (newUnit === weightUnit) return;
    setWeightUnit(newUnit);

    setSessionExercises((prev) =>
      prev.map((ex) => ({
        ...ex,
        sets: ex.sets.map((set) => ({
          ...set,
          weight: newUnit === 'lbs'
            ? Math.round(set.weight * 2.20462 * 2) / 2
            : Math.round((set.weight / 2.20462) * 2) / 2,
        })),
      }))
    );
  };

  const handleAddSet = (exerciseIdx: number) => {
    setSessionExercises((prev) => {
      const updated = [...prev];
      const targetEx = updated[exerciseIdx];
      const lastSet = targetEx.sets[targetEx.sets.length - 1];
      const newSet: WorkoutSetState = {
        id: crypto.randomUUID(),
        setNumber: targetEx.sets.length + 1,
        weight: lastSet ? lastSet.weight : (weightUnit === 'lbs' ? 135 : 60),
        reps: lastSet ? lastSet.reps : 8,
        rpe: lastSet?.rpe || 8.5,
        isWarmup: false,
      };
      targetEx.sets.push(newSet);
      return updated;
    });
  };

  const handleRemoveSet = (exerciseIdx: number, setIdx: number) => {
    setSessionExercises((prev) => {
      const updated = [...prev];
      const targetEx = updated[exerciseIdx];
      if (targetEx.sets.length <= 1) return prev;
      targetEx.sets.splice(setIdx, 1);
      targetEx.sets.forEach((s, idx) => {
        s.setNumber = idx + 1;
      });
      return updated;
    });
  };

  const handleUpdateSet = (exerciseIdx: number, setIdx: number, field: keyof WorkoutSetState, value: any) => {
    setSessionExercises((prev) => {
      const updated = [...prev];
      const targetSet = updated[exerciseIdx].sets[setIdx];
      (targetSet as any)[field] = value;
      return updated;
    });
  };

  const handleRemoveExercise = (exerciseIdx: number) => {
    setSessionExercises((prev) => prev.filter((_, idx) => idx !== exerciseIdx));
  };

  const handleMoveExercise = (idx: number, direction: 'up' | 'down') => {
    setSessionExercises((prev) => {
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(idx, 1);
      copy.splice(targetIdx, 0, moved);
      return copy;
    });
  };

  // Save Complete Workout Session Folder
  const handleSaveSession = async () => {
    if (!sessionName.trim()) {
      setActionMessage({ text: 'Please enter a name for this workout session.', type: 'error' });
      return;
    }
    if (sessionExercises.length === 0) {
      setActionMessage({ text: 'Please add at least one exercise to your session before saving.', type: 'error' });
      return;
    }

    setIsSavingSession(true);
    setActionMessage(null);

    const durationMinutes = durationMode === 'live'
      ? Math.max(1, Math.round(timerSeconds / 60))
      : Math.max(1, Math.round(manualDurationMinutes));

    const payload = {
      name: sessionName.trim(),
      durationMinutes,
      weightUnit,
      notes: sessionNotes.trim(),
      exercises: sessionExercises,
    };

    try {
      const { response, status } = await api.request('POST', '/api/workouts/sessions', payload);

      if (status === 201 && response.success) {
        setActionMessage({
          text: `🎉 Saved Workout Session "${sessionName}" (${sessionExercises.length} movements, ${durationMinutes} mins) into Supabase!`,
          type: 'success',
        });
        setTimerSeconds(0);
        setIsTimerRunning(false);
        await fetchWorkoutData();
        if (response.sessionId) {
          setExpandedSessionIds((prev) => new Set([response.sessionId, ...prev]));
        }
      } else {
        setActionMessage({
          text: response.error || `Failed to save workout session (HTTP ${status})`,
          type: 'error',
        });
      }
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Error saving session', type: 'error' });
    } finally {
      setIsSavingSession(false);
    }
  };

  const handleToggleSessionExpand = (sessionId: string) => {
    setExpandedSessionIds((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) next.delete(sessionId);
      else next.add(sessionId);
      return next;
    });
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      const { response, status } = await api.request('DELETE', `/api/workouts/sessions/${sessionId}`);
      if (status === 200 && response.success) {
        setSavedSessions((prev) => prev.filter((s) => s.id !== sessionId && s._id !== sessionId));
        fetchWorkoutData();
      }
    } catch (err) {
      console.error('Error deleting session folder:', err);
    }
  };

  const handleLoadSessionIntoBuilder = (session: WorkoutSessionItem) => {
    setSessionName(`${session.name} (Repeat)`);
    setWeightUnit(session.weightUnit || 'kg');
    setManualDurationMinutes(session.durationMinutes || 45);
    setSessionExercises(
      session.exercises.map((ex) => ({
        exerciseId: ex.exerciseId,
        exerciseName: ex.exerciseName,
        bodyPart: ex.bodyPart || 'general',
        target: ex.target || 'general',
        equipment: ex.equipment || 'standard',
        notes: ex.notes || '',
        sets: ex.sets.map((s, idx) => ({
          id: String(idx + 1),
          setNumber: s.setNumber,
          weight: s.weight,
          reps: s.reps,
          rpe: s.rpe || 8,
          isWarmup: s.isWarmup,
        })),
      }))
    );
    setActiveSubTab('session');
    setActionMessage({
      text: `Loaded routine "${session.name}" into Active Session builder!`,
      type: 'success',
    });
  };

  const handleDeleteWorkout = async (id: string) => {
    const { response, status } = await api.request('DELETE', `/api/workouts/${id}`);
    if (status === 200 && response.success) {
      setWorkouts((prev) => prev.filter((w) => w.id !== id && w._id !== id));
      fetchWorkoutData();
    }
  };

  const bodyPartFilters = [
    { id: 'all', label: 'All Body Parts' },
    { id: 'chest', label: 'Chest' },
    { id: 'back', label: 'Back' },
    { id: 'legs', label: 'Legs' },
    { id: 'shoulders', label: 'Shoulders' },
    { id: 'arms', label: 'Arms' },
    { id: 'waist', label: 'Core / Waist' },
  ];

  const equipmentFilters = [
    { id: 'all', label: 'All Equipment' },
    { id: 'barbell', label: 'Barbell' },
    { id: 'dumbbell', label: 'Dumbbell' },
    { id: 'cable', label: 'Cable' },
    { id: 'machine', label: 'Machine' },
    { id: 'body weight', label: 'Body Weight' },
  ];

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* RBAC Notice if Guest */}
      {currentRole === 'guest' && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-amber-200">
              Session Access: Guest Mode
            </h4>
            <p className="text-xs text-zinc-400 mt-0.5">
              You are currently browsing workouts as a guest. Log in to save complete workout routines and track progressive overload permanently.
            </p>
          </div>
        </div>
      )}

      {/* Primary Sub-Navigation Switch: Session Logger vs History Log vs Progressive Overload vs Exercise Library */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3 flex-wrap gap-3">
        <div className="flex items-center gap-1.5 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveSubTab('session')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeSubTab === 'session'
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <FolderPlus className="w-4 h-4" />
            Active Routine
            {sessionExercises.length > 0 && (
              <span className="px-1.5 py-0.2 bg-zinc-900 text-orange-300 rounded text-[10px]">
                {sessionExercises.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('history')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeSubTab === 'history'
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            History Log
            {savedSessions.length > 0 && (
              <span className="px-1.5 py-0.2 bg-zinc-900 text-emerald-300 rounded text-[10px]">
                {savedSessions.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('progression')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeSubTab === 'progression'
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Progressive Overload
            <span className="px-1.5 py-0.2 bg-zinc-900 text-amber-300 rounded text-[10px] flex items-center gap-0.5">
              <Sparkles className="w-2.5 h-2.5" /> Strict Rule
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSubTab('library');
              fetchLibraryExercises();
            }}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeSubTab === 'library'
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Exercise Database
            <span className="px-1.5 py-0.2 bg-zinc-900 text-zinc-400 rounded text-[10px]">
              {libraryExercises.length > 0 ? libraryExercises.length : '20+'}
            </span>
          </button>
        </div>

        <div className="text-xs text-zinc-400 hidden lg:block">
          {activeSubTab === 'session' && 'Configure routine folder, timer & sets'}
          {activeSubTab === 'history' && 'Browse saved session folders & routine archives'}
          {activeSubTab === 'progression' && 'Strict decoupled exercise progression & Brzycki 1RM targets'}
          {activeSubTab === 'library' && 'Browse ExerciseDB technique & instructions'}
        </div>
      </div>

      {/* ============================================================ */}
      {/* VIEW 1: ACTIVE WORKOUT SESSION & ROUTINE LOGGER             */}
      {/* ============================================================ */}
      {activeSubTab === 'session' && (
        <div className="space-y-8 animate-fade-in">
          {/* High-Level Progression Summary Header */}
          {historySummary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-3">
                <div className="p-3 rounded-lg bg-orange-500/10 text-orange-400">
                  <Dumbbell className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-zinc-400 block uppercase">Recorded Workouts</span>
                  <span className="text-lg font-bold text-white">{historySummary.totalWorkoutsLogged} sessions</span>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-3">
                <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-zinc-400 block uppercase">Cumulative Volume</span>
                  <span className="text-lg font-bold text-emerald-400">
                    {historySummary.totalCumulativeVolumeKg.toLocaleString()} kg
                  </span>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-3">
                <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-zinc-400 block uppercase">Gym Time</span>
                  <span className="text-lg font-bold text-white">{historySummary.totalDurationMinutes} mins</span>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-3">
                <div className="p-3 rounded-lg bg-amber-500/10 text-amber-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-zinc-400 block uppercase">PR Movements</span>
                  <span className="text-lg font-bold text-amber-400">
                    {historySummary.personalRecordMovements} verified
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Session Routine Folder Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500" />

            {/* Session Top Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-orange-500/15 text-orange-400 border border-orange-500/30 flex items-center gap-1">
                      <FolderPlus className="w-3 h-3" /> Workout Session Folder
                    </span>
                    <span className="text-xs text-zinc-400 font-semibold hidden sm:inline">Routine Title</span>
                  </div>
                  <span className="text-[11px] text-zinc-500 hidden sm:inline">
                    Type custom name or choose preset below
                  </span>
                </div>

                {/* Text input box that allows users to freely type or customize their own session title */}
                <div className="relative">
                  <input
                    type="text"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    placeholder="Enter custom session title (e.g. Push Day A, Back & Biceps, Full Body Blitz)..."
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-700/80 hover:border-zinc-600 focus:border-orange-500 rounded-xl text-base md:text-lg font-bold text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition shadow-inner"
                  />
                </div>

                {/* Quick-Click Preset Buttons */}
                <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
                  <span className="text-[11px] font-bold text-zinc-400">Quick Presets:</span>
                  {['Push Day A', 'Pull Day B', 'Leg Day Heavy', 'Full Body Power', 'Upper Hypertrophy'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setSessionName(preset)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition border ${
                        sessionName === preset
                          ? 'bg-orange-600 text-white border-orange-500 shadow-sm'
                          : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-white'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Controls: Duration Tracking Mode & Unit Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Duration Tracking Section */}
                <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 space-y-2 min-w-[280px]">
                  <div className="flex items-center justify-between gap-3 px-1">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-orange-400" /> Duration Mode
                    </span>

                    {/* Duration Mode Toggle Tabs */}
                    <div className="inline-flex items-center bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-[10px] font-semibold">
                      <button
                        type="button"
                        onClick={() => handleSwitchDurationMode('live')}
                        className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 ${
                          durationMode === 'live'
                            ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/30 font-bold'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        <Play className="w-2.5 h-2.5" /> Live Timer
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSwitchDurationMode('manual')}
                        className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 ${
                          durationMode === 'manual'
                            ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/30 font-bold'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        <Edit3 className="w-2.5 h-2.5" /> Manual
                      </button>
                    </div>
                  </div>

                  {/* Live Timer View */}
                  {durationMode === 'live' ? (
                    <div className="space-y-2 bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800/80">
                      <div className="flex items-center justify-between gap-2 px-1">
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-2.5 w-2.5">
                            {isTimerRunning && (
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            )}
                            <span
                              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                                isTimerRunning ? 'bg-emerald-500' : timerSeconds > 0 ? 'bg-amber-500' : 'bg-zinc-600'
                              }`}
                            ></span>
                          </span>
                          <span className="font-mono text-lg font-black text-white tracking-widest">
                            {formatTimer(timerSeconds)}
                          </span>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                            isTimerRunning
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : timerSeconds > 0
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {isTimerRunning ? 'RECORDING' : timerSeconds > 0 ? 'PAUSED' : 'STOPPED (00:00)'}
                        </span>
                      </div>

                      {/* Explicit Playback Controls: Start, Pause, Reset/Stop */}
                      <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-zinc-800/80">
                        <button
                          type="button"
                          onClick={() => setIsTimerRunning(true)}
                          disabled={isTimerRunning}
                          className={`py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm ${
                            isTimerRunning
                              ? 'bg-zinc-800/50 text-zinc-500 cursor-not-allowed'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                          }`}
                          title="Start live workout timer"
                        >
                          <Play className="w-3 h-3" /> Start
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsTimerRunning(false)}
                          disabled={!isTimerRunning}
                          className={`py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm ${
                            !isTimerRunning
                              ? 'bg-zinc-800/50 text-zinc-500 cursor-not-allowed'
                              : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
                          }`}
                          title="Pause workout timer"
                        >
                          <Pause className="w-3 h-3" /> Pause
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsTimerRunning(false);
                            setTimerSeconds(0);
                          }}
                          disabled={!isTimerRunning && timerSeconds === 0}
                          className={`py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm ${
                            !isTimerRunning && timerSeconds === 0
                              ? 'bg-zinc-800/50 text-zinc-500 cursor-not-allowed'
                              : 'bg-zinc-800 hover:bg-rose-600 text-zinc-300 hover:text-white border border-zinc-700 hover:border-rose-500'
                          }`}
                          title="Reset timer to 00:00"
                        >
                          <RotateCcw className="w-3 h-3" /> Reset/Stop
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Manual Input View */
                    <div className="space-y-2 bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800/80">
                      <div className="flex items-center justify-between text-[11px] px-1">
                        <span className="text-zinc-400 font-bold uppercase">Duration (mins):</span>
                        <span className="font-mono font-bold text-orange-400">{manualDurationMinutes} mins</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="relative flex-1">
                          <input
                            type="number"
                            min="1"
                            max="720"
                            value={manualDurationMinutes}
                            onChange={(e) => setManualDurationMinutes(Math.max(1, Number(e.target.value) || 0))}
                            className="w-full pl-3 pr-10 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-bold text-white focus:outline-none focus:border-orange-500 font-mono"
                          />
                          <span className="absolute right-2.5 top-2 text-[10px] text-zinc-500 font-semibold pointer-events-none">
                            mins
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[30, 45, 60, 75, 90].map((preset) => (
                            <button
                              type="button"
                              key={preset}
                              onClick={() => setManualDurationMinutes(preset)}
                              className={`px-2 py-1.5 rounded-lg text-[10px] font-bold transition ${
                                manualDurationMinutes === preset
                                  ? 'bg-orange-600 text-white'
                                  : 'bg-zinc-950 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
                              }`}
                            >
                              {preset}m
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Weight Unit Switch (KG / LBS) */}
                <div className="bg-zinc-950 p-2 rounded-xl border border-zinc-800 space-y-1.5 self-start sm:self-auto">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block px-1">
                    Weight Unit
                  </span>
                  <div className="flex items-center bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
                    <button
                      type="button"
                      onClick={() => handleToggleWeightUnit('kg')}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition flex items-center gap-1 ${
                        weightUnit === 'kg'
                          ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Scale className="w-3 h-3" /> KG
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleWeightUnit('lbs')}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition flex items-center gap-1 ${
                        weightUnit === 'lbs'
                          ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Scale className="w-3 h-3" /> LBS
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Feedback message banner */}
            {actionMessage && (
              <div
                className={`my-4 p-4 rounded-xl text-xs border font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  actionMessage.type === 'success'
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {actionMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{actionMessage.text}</span>
                </div>
                {actionMessage.type === 'success' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveSubTab('history')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm"
                    >
                      <History className="w-3.5 h-3.5" /> View in History Log
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSubTab('progression')}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                    >
                      <TrendingUp className="w-3.5 h-3.5 text-orange-400" /> Progressive Overload
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ============================================================ */}
            {/* EXERCISE AUTO-SUGGEST SEARCH BAR (SESSION)                   */}
            {/* ============================================================ */}
            <div className="my-6">
              <div ref={searchContainerRef} className="relative">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-orange-400" />
                    Add Exercise to this Session
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSubTab('library');
                      fetchLibraryExercises();
                    }}
                    className="text-[11px] text-orange-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Or Browse Full Exercise Library →
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onFocus={() => {
                      if (searchQuery.trim() && suggestions.length > 0) setShowSuggestions(true);
                    }}
                    placeholder="Type exercise name (e.g. 'bench', 'squat', 'deadlift', 'pull-up', 'curl')..."
                    className="w-full pl-10 pr-10 py-2.5 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-orange-500 rounded-xl text-sm text-white focus:outline-none transition shadow-inner placeholder-zinc-500"
                    autoComplete="off"
                  />
                  <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  {isSearching && (
                    <div className="absolute right-3.5 top-3">
                      <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                {/* Auto-suggest dropdown results */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-2 bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-zinc-800/80 max-h-72 overflow-y-auto">
                    <div className="px-3.5 py-2 bg-zinc-950/80 text-[10px] font-bold uppercase text-zinc-400 tracking-wider flex justify-between">
                      <span>Database Matches</span>
                      <span>Target Muscle / Equipment</span>
                    </div>
                    {suggestions.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectExercise(item)}
                        className="w-full px-4 py-3 text-left hover:bg-zinc-800/80 transition flex items-center justify-between gap-3 group"
                      >
                        <div>
                          <div className="text-sm font-bold text-white group-hover:text-orange-400 transition">
                            {item.name}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-400 border border-orange-500/30">
                              {item.body_part}
                            </span>
                            <span className="text-[11px] text-zinc-400">
                              Target: <strong className="text-zinc-300">{item.target}</strong>
                            </span>
                            <span className="text-[11px] text-zinc-500">• {item.equipment}</span>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-orange-400 opacity-0 group-hover:opacity-100 transition shrink-0 flex items-center gap-1">
                          + Add to Session
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Exercises List inside Folder */}
            <div className="space-y-5">
              {sessionExercises.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-950/40">
                  <Dumbbell className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-white">No exercises in this session folder yet</h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    Use the auto-suggest search above or browse the Exercise Library to add your first movement.
                  </p>
                </div>
              ) : (
                sessionExercises.map((exercise, exIdx) => (
                  <div
                    key={exercise.exerciseId + '-' + exIdx}
                    className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800/90 shadow-md hover:border-zinc-700 transition"
                  >
                    {/* Exercise Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800/60">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 font-bold text-xs flex items-center justify-center">
                          {exIdx + 1}
                        </span>
                        <div>
                          <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                            {exercise.exerciseName}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-400">
                            <span className="capitalize text-orange-400 font-semibold">{exercise.bodyPart}</span>
                            <span>•</span>
                            <span className="capitalize">{exercise.target}</span>
                            <span>•</span>
                            <span className="capitalize text-zinc-500">{exercise.equipment}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleMoveExercise(exIdx, 'up')}
                          disabled={exIdx === 0}
                          className="p-1 rounded text-zinc-500 hover:text-white disabled:opacity-30 transition"
                          title="Move up in routine"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveExercise(exIdx, 'down')}
                          disabled={exIdx === sessionExercises.length - 1}
                          className="p-1 rounded text-zinc-500 hover:text-white disabled:opacity-30 transition"
                          title="Move down in routine"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveExercise(exIdx)}
                          className="p-1 ml-2 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                          title="Remove exercise from session"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Sets Table */}
                    <div className="overflow-x-auto mt-3">
                      <table className="w-full text-xs text-left">
                        <thead className="text-[11px] uppercase font-bold text-zinc-400 border-b border-zinc-800">
                          <tr>
                            <th className="py-2 px-2 w-16 text-center">Set</th>
                            <th className="py-2 px-3">Weight ({weightUnit})</th>
                            <th className="py-2 px-3">Reps</th>
                            <th className="py-2 px-3">RPE (1-10)</th>
                            <th className="py-2 px-3 text-center">Warmup?</th>
                            <th className="py-2 px-2 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/40">
                          {exercise.sets.map((set, sIdx) => (
                            <tr
                              key={set.id || sIdx}
                              className={`hover:bg-zinc-800/30 transition ${set.isWarmup ? 'opacity-60 bg-zinc-900/40' : ''}`}
                            >
                              <td className="py-2 px-2 font-mono font-bold text-center text-zinc-400">
                                {set.setNumber}
                              </td>

                              <td className="py-2 px-3">
                                <div className="relative inline-flex items-center">
                                  <input
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    value={set.weight}
                                    onChange={(e) =>
                                      handleUpdateSet(exIdx, sIdx, 'weight', Number(e.target.value))
                                    }
                                    className="w-24 px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm font-bold text-white focus:outline-none focus:border-orange-500 font-mono"
                                  />
                                  <span className="ml-1.5 text-xs text-zinc-500 font-semibold">{weightUnit}</span>
                                </div>
                              </td>

                              <td className="py-2 px-3">
                                <input
                                  type="number"
                                  min="1"
                                  value={set.reps}
                                  onChange={(e) =>
                                    handleUpdateSet(exIdx, sIdx, 'reps', Number(e.target.value))
                                  }
                                  className="w-20 px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm font-bold text-white focus:outline-none focus:border-orange-500 font-mono"
                                />
                              </td>

                              <td className="py-2 px-3">
                                <input
                                  type="number"
                                  step="0.5"
                                  min="1"
                                  max="10"
                                  value={set.rpe || 8}
                                  onChange={(e) =>
                                    handleUpdateSet(exIdx, sIdx, 'rpe', Number(e.target.value))
                                  }
                                  className="w-16 px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-orange-500 font-mono"
                                />
                              </td>

                              <td className="py-2 px-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={set.isWarmup}
                                  onChange={(e) =>
                                    handleUpdateSet(exIdx, sIdx, 'isWarmup', e.target.checked)
                                  }
                                  className="rounded border-zinc-700 text-orange-500 focus:ring-0 w-4 h-4 cursor-pointer"
                                  title="Mark set as warm-up"
                                />
                              </td>

                              <td className="py-2 px-2 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSet(exIdx, sIdx)}
                                  className="p-1 rounded text-zinc-500 hover:text-rose-400 transition"
                                  title="Remove this set"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-zinc-800/60">
                      <button
                        type="button"
                        onClick={() => handleAddSet(exIdx)}
                        className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-orange-400 hover:text-orange-300 transition flex items-center gap-1.5 shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Set
                      </button>

                      <span className="text-[11px] text-zinc-500">
                        {exercise.sets.filter((s) => !s.isWarmup).length} working sets
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Session Bottom: Notes & Save Session Button */}
            <div className="mt-6 pt-6 border-t border-zinc-800 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Session Notes / Reflections
                </label>
                <textarea
                  rows={2}
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="e.g. Felt great on bench lockout, paused 2s on tricep extensions, RPE 9 on last working set..."
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 resize-none transition"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-xs text-zinc-400">
                  Folder summary:{' '}
                  <strong className="text-white">{sessionExercises.length} movements</strong> •{' '}
                  <strong className="text-white">
                    {sessionExercises.reduce((acc, ex) => acc + ex.sets.length, 0)} total sets
                  </strong>{' '}
                  • Duration:{' '}
                  <strong className="text-orange-400">
                    {durationMode === 'live' ? formatTimer(timerSeconds) : `${manualDurationMinutes} mins`}
                  </strong>{' '}
                  <span className="text-[10px] text-zinc-500 font-semibold">
                    ({durationMode === 'live' ? 'Live Timer' : 'Manual Entry'})
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleSaveSession}
                  disabled={isSavingSession || sessionExercises.length === 0}
                  className="py-3 px-6 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-sm shadow-xl shadow-orange-600/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSavingSession ? 'Saving Session...' : 'Save Workout Session'}
                </button>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* HISTORICAL WORKOUT REGISTRY & PROGRESSION                     */}
          {/* ============================================================ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Folder className="w-4 h-4 text-orange-400" />
                      Saved Workout Session Folders
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Tap any routine folder to expand and review movements, sets, weights &amp; reps
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveSubTab('history')}
                    className="text-xs text-orange-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    View History Log ({savedSessions.length}) <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                {loading ? (
                  <div className="py-12 text-center text-zinc-500 text-xs">Loading training folders...</div>
                ) : savedSessions.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-950/40">
                    <FolderPlus className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                    <h4 className="text-sm font-bold text-white">No session folders saved yet</h4>
                    <p className="text-xs text-zinc-400 mt-1">
                      Configure your movements above and click "Save Workout Session" to create your first folder!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedSessions.slice(0, 3).map((session) => {
                      const sId = session.id || session._id;
                      const isExpanded = expandedSessionIds.has(sId);

                      return (
                        <div
                          key={sId}
                          className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden transition"
                        >
                          <div
                            onClick={() => handleToggleSessionExpand(sId)}
                            className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-zinc-800/40 transition select-none"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400 shrink-0">
                                <Folder className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-sm font-bold text-white">{session.name}</h4>
                                  <span className="text-[11px] text-zinc-400 font-mono">
                                    {session.formattedDate || new Date(session.timestamp).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                                  <span className="text-orange-400 font-semibold">{session.durationMinutes} mins</span>
                                  <span>•</span>
                                  <span className="text-zinc-300 font-semibold">{session.exercises?.length || 0} exercises</span>
                                  <span>•</span>
                                  <span>{session.totalVolumeKg?.toLocaleString() || 0} kg vol</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleSessionExpand(sId);
                                }}
                                className="p-1 text-zinc-400 hover:text-white"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          {/* Expandable Folder Content */}
                          {isExpanded && (
                            <div className="p-3.5 border-t border-zinc-800/80 bg-zinc-900/60 space-y-2.5 animate-fade-in text-xs">
                              {session.exercises.map((ex, exIdx) => (
                                <div key={ex.id || exIdx} className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800/80">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className="font-bold text-white flex items-center gap-1.5">
                                      <span className="text-orange-400 font-mono font-bold">#{exIdx + 1}</span>
                                      {ex.exerciseName}
                                    </span>
                                    <span className="text-[10px] text-zinc-400 uppercase font-mono">
                                      {ex.sets.length} sets
                                    </span>
                                  </div>

                                  <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                                    {ex.sets.map((set, sIdx) => (
                                      <span
                                        key={set.id || sIdx}
                                        className={`px-2 py-0.5 rounded border ${
                                          set.isWarmup
                                            ? 'bg-zinc-900 text-zinc-500 border-zinc-800'
                                            : 'bg-zinc-900 text-zinc-200 border-zinc-800'
                                        }`}
                                      >
                                        S{set.setNumber || sIdx + 1}: <strong className="text-white">{set.weight}{set.weightUnit || 'kg'}</strong> × {set.reps}
                                        {set.isPersonalRecord && (
                                          <span className="ml-1 text-[9px] text-amber-400 font-bold">PR</span>
                                        )}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800 flex justify-between text-xs text-zinc-500">
                <span>Folder Routine Architecture Active</span>
                <span>Total sessions: {savedSessions.length}</span>
              </div>
            </div>

            {/* Weekly Overload Recommendations */}
            <div className="lg:col-span-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Flame className="w-4 h-4 text-orange-400" />
                      Target Overload
                    </h3>
                    <p className="text-xs text-zinc-400">Algorithmic next-session progression targets</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {challenges.length === 0 ? (
                    <div className="text-xs text-zinc-500 italic py-6 text-center">
                      Log at least 2 sessions of any exercise to unlock automated progressive overload recommendations.
                    </div>
                  ) : (
                    challenges.slice(0, 3).map((ch, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{ch.exerciseName}</span>
                          <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                            +{Math.round((ch.targetWeightKg - ch.lastWeightKg) * 10) / 10} kg
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          Target: <strong className="text-white">{ch.targetWeightKg} kg</strong> × {ch.targetReps} reps ({ch.recommendedSets} sets)
                        </div>
                        <p className="text-[10px] text-zinc-500 leading-snug">{ch.progressionReason}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800 text-[11px] text-zinc-500 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-zinc-400" />
                <span>Based on Brzycki 1RM progression equation</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* VIEW: WORKOUT SESSION HISTORY LOG (FOLDERS & ROUTINES)       */}
      {/* ============================================================ */}
      {activeSubTab === 'history' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header & Overview Stats */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-orange-400" />
                  Saved Workout Session History Log
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Complete routine folders with exercises, sets, weights, and reps saved in your database.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    const allIds = savedSessions.map((s) => s.id || s._id);
                    setExpandedSessionIds(
                      expandedSessionIds.size === allIds.length ? new Set() : new Set(allIds)
                    );
                  }}
                  className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold transition"
                >
                  {expandedSessionIds.size === savedSessions.length ? 'Collapse All Folders' : 'Expand All Folders'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('session')}
                  className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Start New Workout Session
                </button>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-zinc-800/80">
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block">Saved Folders</span>
                <span className="text-base font-extrabold text-white mt-0.5 block">{savedSessions.length} Routines</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block">Total Working Sets</span>
                <span className="text-base font-extrabold text-emerald-400 mt-0.5 block">
                  {savedSessions.reduce((acc, s) => acc + (s.totalSetsCount || 0), 0)} Sets
                </span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block">Cumulative Tonnage</span>
                <span className="text-base font-extrabold text-orange-400 mt-0.5 block">
                  {savedSessions.reduce((acc, s) => acc + (s.totalVolumeKg || 0), 0).toLocaleString()} kg
                </span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block">Avg Session Time</span>
                <span className="text-base font-extrabold text-indigo-400 mt-0.5 block">
                  {savedSessions.length > 0 
                    ? Math.round(savedSessions.reduce((acc, s) => acc + (s.durationMinutes || 45), 0) / savedSessions.length) 
                    : 0} mins
                </span>
              </div>
            </div>

            {/* Live History Search Filter */}
            <div className="relative">
              <input
                type="text"
                value={historySearchTerm}
                onChange={(e) => setHistorySearchTerm(e.target.value)}
                placeholder="Search past sessions by routine name, exercise, or notes (e.g. 'Push Day', 'Bench', 'Squat')..."
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition shadow-inner"
              />
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
              {historySearchTerm && (
                <button
                  type="button"
                  onClick={() => setHistorySearchTerm('')}
                  className="absolute right-3 top-2.5 p-0.5 text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Session Folders List */}
          {loading ? (
            <div className="py-16 text-center text-zinc-500 text-xs">Loading saved workout sessions...</div>
          ) : savedSessions.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-950/40 space-y-3">
              <Folder className="w-10 h-10 text-zinc-600 mx-auto" />
              <h4 className="text-base font-bold text-white">No Workout Session Folders Saved Yet</h4>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Use the Active Routine builder to customize exercises and sets, then hit "Save Workout Session" to permanently archive your routines here.
              </p>
              <button
                type="button"
                onClick={() => setActiveSubTab('session')}
                className="mt-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition shadow-md"
              >
                Go to Routine Builder
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {savedSessions
                .filter((session) => {
                  if (!historySearchTerm.trim()) return true;
                  const term = historySearchTerm.toLowerCase();
                  const matchName = session.name.toLowerCase().includes(term);
                  const matchNotes = (session.notes || '').toLowerCase().includes(term);
                  const matchEx = session.exercises.some((e) => e.exerciseName.toLowerCase().includes(term));
                  return matchName || matchNotes || matchEx;
                })
                .map((session) => {
                  const sId = session.id || session._id;
                  const isExpanded = expandedSessionIds.has(sId);

                  return (
                    <div
                      key={sId}
                      className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl transition"
                    >
                      {/* Folder Binder Header */}
                      <div
                        onClick={() => handleToggleSessionExpand(sId)}
                        className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-zinc-800/40 transition select-none"
                      >
                        <div className="flex items-start gap-3.5">
                          <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 shrink-0 mt-0.5">
                            <Folder className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <h4 className="text-base font-black text-white">{session.name}</h4>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                {session.status}
                              </span>
                              <span className="text-xs text-zinc-400 font-mono">
                                {session.formattedDate || new Date(session.timestamp).toLocaleDateString()}
                              </span>
                            </div>

                            {session.notes && (
                              <p className="text-xs text-zinc-400 mt-1 italic">
                                "{session.notes}"
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Badges & Actions */}
                        <div className="flex items-center gap-3 shrink-0 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] font-semibold text-zinc-300 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-zinc-400" />
                              {session.durationMinutes} mins
                            </span>
                            <span className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] font-bold text-orange-400">
                              {session.totalVolumeKg?.toLocaleString() || 0} kg vol
                            </span>
                            <span className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] font-semibold text-zinc-300">
                              {session.exercises?.length || 0} movements ({session.totalSetsCount || 0} sets)
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 ml-auto md:ml-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleLoadSessionIntoBuilder(session)}
                              title="Repeat this routine in Active Session"
                              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                            >
                              <Copy className="w-3.5 h-3.5 text-orange-400" /> Repeat
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSession(sId)}
                              title="Delete routine folder"
                              className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleSessionExpand(sId)}
                              className="p-1.5 text-zinc-400 hover:text-white"
                            >
                              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Folder Content (Exercises & Sets Table) */}
                      {isExpanded && (
                        <div className="p-5 border-t border-zinc-800/80 bg-zinc-950/60 space-y-4 animate-fade-in">
                          <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-orange-400" />
                            Exercises Performed in this Folder:
                          </div>

                          <div className="space-y-4">
                            {session.exercises.map((ex, exIdx) => (
                              <div
                                key={ex.id || exIdx}
                                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3"
                              >
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-orange-600/20 text-orange-400 font-mono font-bold text-xs flex items-center justify-center">
                                      {exIdx + 1}
                                    </span>
                                    <h5 className="text-sm font-bold text-white">{ex.exerciseName}</h5>
                                    {ex.target && (
                                      <span className="text-[10px] text-zinc-400 uppercase bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                                        {ex.target}
                                      </span>
                                    )}
                                    {ex.equipment && (
                                      <span className="text-[10px] text-orange-400/90 capitalize bg-orange-500/10 px-2 py-0.5 rounded">
                                        {ex.equipment}
                                      </span>
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedProgressionExercise(ex.exerciseName);
                                      setActiveSubTab('progression');
                                    }}
                                    className="text-[11px] text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1"
                                  >
                                    View Progression Lifecycle <ArrowUpRight className="w-3 h-3" />
                                  </button>
                                </div>

                                {ex.notes && (
                                  <p className="text-xs text-zinc-400 italic bg-zinc-950 p-2 rounded-lg border border-zinc-800/60">
                                    Coach note: "{ex.notes}"
                                  </p>
                                )}

                                {/* Sets Table */}
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs text-left">
                                    <thead className="text-[10px] text-zinc-400 uppercase bg-zinc-950/80 border-b border-zinc-800">
                                      <tr>
                                        <th className="py-2 px-3">Set</th>
                                        <th className="py-2 px-3">Type</th>
                                        <th className="py-2 px-3">Weight</th>
                                        <th className="py-2 px-3">Reps</th>
                                        <th className="py-2 px-3">Est. 1RM (Brzycki)</th>
                                        <th className="py-2 px-3">RPE</th>
                                        <th className="py-2 px-3 text-right">Status</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800/40 font-mono">
                                      {ex.sets.map((set, sIdx) => {
                                        const w = Number(set.weight || 0);
                                        const r = Number(set.reps || 0);
                                        const est1RM = r > 1 && r < 37
                                          ? Math.round((w * (36.0 / (37.0 - Math.min(r, 36)))) * 10) / 10
                                          : w;

                                        return (
                                          <tr key={set.id || sIdx} className="hover:bg-zinc-800/30">
                                            <td className="py-2 px-3 text-zinc-400 font-bold">
                                              #{set.setNumber || sIdx + 1}
                                            </td>
                                            <td className="py-2 px-3">
                                              {set.isWarmup ? (
                                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-sans">
                                                  Warmup
                                                </span>
                                              ) : (
                                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-sans font-bold">
                                                  Working
                                                </span>
                                              )}
                                            </td>
                                            <td className="py-2 px-3 font-bold text-white">
                                              {set.weight} {set.weightUnit || 'kg'}
                                            </td>
                                            <td className="py-2 px-3 text-zinc-300">
                                              {set.reps} reps
                                            </td>
                                            <td className="py-2 px-3 text-emerald-400 font-semibold">
                                              {est1RM} {set.weightUnit || 'kg'}
                                            </td>
                                            <td className="py-2 px-3 text-zinc-400">
                                              {set.rpe ? `${set.rpe}/10` : '-'}
                                            </td>
                                            <td className="py-2 px-3 text-right">
                                              {set.isPersonalRecord ? (
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 justify-end font-sans">
                                                  <Sparkles className="w-3 h-3" /> PR
                                                </span>
                                              ) : (
                                                <span className="text-zinc-500 text-[10px] font-sans">Logged</span>
                                              )}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* VIEW: STRICT PROGRESSIVE OVERLOAD (DECOUPLED FROM SESSIONS)  */}
      {/* ============================================================ */}
      {activeSubTab === 'progression' && (
        <div className="space-y-6 animate-fade-in">
          {/* Strict Rule Header Banner */}
          <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border border-amber-500/30 rounded-2xl p-6 shadow-xl space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  Progressive Overload Tracking Engine
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Strict Decoupling Rule Active
                  </span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Calculations for Top Weight, Estimated 1RM (Brzycki), and Volume Load are strictly tied to the individual exercise program over time across all past sessions, completely decoupled from the session folder level.
                </p>
              </div>
            </div>
          </div>

          {/* Exercise Selector / Filter Bar */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Select Movement to Analyze Progression:
                </span>
                <span className="text-xs text-zinc-500">
                  {exerciseProgressions.length} exercises tracked across your training history
                </span>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedProgressionExercise}
                  onChange={(e) => setSelectedProgressionExercise(e.target.value)}
                  className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-orange-500 transition"
                >
                  <option value="all">Overview: All Tracked Movements</option>
                  {exerciseProgressions.map((ep) => (
                    <option key={ep.exerciseId} value={ep.exerciseName}>
                      {ep.exerciseName} (PR: {ep.allTimeMaxWeightKg} kg)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Movement Pills */}
            <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-zinc-800/80">
              <button
                type="button"
                onClick={() => setSelectedProgressionExercise('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  selectedProgressionExercise === 'all'
                    ? 'bg-orange-600 text-white font-bold shadow-md shadow-orange-600/30'
                    : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                All Movements ({exerciseProgressions.length})
              </button>
              {exerciseProgressions.slice(0, 8).map((ep) => (
                <button
                  key={ep.exerciseId}
                  type="button"
                  onClick={() => setSelectedProgressionExercise(ep.exerciseName)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                    selectedProgressionExercise.toLowerCase() === ep.exerciseName.toLowerCase()
                      ? 'bg-orange-600 text-white font-bold shadow-md shadow-orange-600/30'
                      : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  <span>{ep.exerciseName}</span>
                  <span className="text-[10px] font-mono text-amber-400 font-bold">
                    {ep.allTimeMaxWeightKg}kg
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Focused Movement Details or Overview Grid */}
          {exerciseProgressions.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-950/40 space-y-3">
              <TrendingUp className="w-10 h-10 text-zinc-600 mx-auto" />
              <h4 className="text-base font-bold text-white">No Exercise Progression Data Yet</h4>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Log and save workout sessions with at least one exercise. Progressive overload will automatically calculate top weight, estimated 1RM, volume load, and algorithmic next-session targets for each individual movement.
              </p>
              <button
                type="button"
                onClick={() => setActiveSubTab('session')}
                className="mt-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition shadow-md"
              >
                Log a Workout Session Now
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {(() => {
                const target = selectedProgressionExercise === 'all'
                  ? exerciseProgressions[0]
                  : exerciseProgressions.find(
                      (ep) => ep.exerciseName.toLowerCase() === selectedProgressionExercise.toLowerCase()
                    ) || exerciseProgressions[0];

                if (!target) return null;

                const challenge = challenges.find(
                  (c) => c.exerciseName.toLowerCase() === target.exerciseName.toLowerCase()
                );

                return (
                  <div className="space-y-6">
                    {/* Selected Movement Detail Header */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">
                              Individual Movement Lifecycle
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-950 text-zinc-400 border border-zinc-800 uppercase">
                              {target.targetMuscle || 'Target Muscle'}
                            </span>
                          </div>
                          <h3 className="text-2xl font-black text-white mt-1">{target.exerciseName}</h3>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            Tracked across {target.totalSessionsCount} past workout sessions regardless of routine folder.
                          </p>
                        </div>

                        {/* Overload Target Pill */}
                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                          <Zap className="w-5 h-5 text-emerald-400 shrink-0" />
                          <div>
                            <span className="text-[10px] uppercase font-bold text-emerald-400 block">Next Overload Target</span>
                            <span className="text-sm font-extrabold text-white">
                              {target.nextTargetWeightKg} kg × {target.nextTargetReps} reps
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 4 Core Strict Progressive Overload KPI Cards */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* 1. All Time Top Weight */}
                        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                          <div className="flex items-center justify-between text-zinc-400">
                            <span className="text-[11px] font-bold uppercase tracking-wider">All-Time Top Weight</span>
                            <Trophy className="w-4 h-4 text-amber-400" />
                          </div>
                          <div className="text-2xl font-black text-white">
                            {target.allTimeMaxWeightKg} <span className="text-sm font-semibold text-zinc-400">kg</span>
                          </div>
                          <span className="text-[10px] text-amber-400 font-semibold block flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Peak Absolute Load (PR)
                          </span>
                        </div>

                        {/* 2. All Time Estimated 1RM */}
                        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                          <div className="flex items-center justify-between text-zinc-400">
                            <span className="text-[11px] font-bold uppercase tracking-wider">Estimated 1RM</span>
                            <Award className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div className="text-2xl font-black text-emerald-400">
                            {target.allTimeEstimated1RMKg} <span className="text-sm font-semibold text-zinc-400">kg</span>
                          </div>
                          <span className="text-[10px] text-zinc-500 font-mono block">
                            Brzycki Equation W*(36/(37-r))
                          </span>
                        </div>

                        {/* 3. Cumulative Lifetime Volume */}
                        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                          <div className="flex items-center justify-between text-zinc-400">
                            <span className="text-[11px] font-bold uppercase tracking-wider">Volume Load</span>
                            <TrendingUp className="w-4 h-4 text-orange-400" />
                          </div>
                          <div className="text-2xl font-black text-orange-400">
                            {target.totalLifetimeVolumeKg.toLocaleString()} <span className="text-sm font-semibold text-zinc-400">kg</span>
                          </div>
                          <span className="text-[10px] text-zinc-500 font-semibold block">
                            Cumulative Weight × Reps
                          </span>
                        </div>

                        {/* 4. Session Frequency */}
                        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                          <div className="flex items-center justify-between text-zinc-400">
                            <span className="text-[11px] font-bold uppercase tracking-wider">Historical Sessions</span>
                            <Calendar className="w-4 h-4 text-indigo-400" />
                          </div>
                          <div className="text-2xl font-black text-white">
                            {target.totalSessionsCount} <span className="text-sm font-semibold text-zinc-400">sessions</span>
                          </div>
                          <span className="text-[10px] text-zinc-400 font-mono block">
                            Last: {new Date(target.lastSessionDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Next Session Algorithmic Overload Prescription */}
                      <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Flame className="w-4 h-4 text-orange-400" />
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                              Automated Overload Recommendation for {target.exerciseName}:
                            </h4>
                          </div>
                          <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                            {challenge
                              ? challenge.progressionReason
                              : `Target a +${Math.round((target.nextTargetWeightKg - target.allTimeMaxWeightKg) * 10) / 10 || 2.5}kg load jump to ${target.nextTargetWeightKg}kg on working sets while maintaining explosive concentric bar velocity.`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300">
                            Rest: 90s - 120s
                          </span>
                          <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400">
                            Stimulus: Load Jump
                          </span>
                        </div>
                      </div>

                      {/* Chronological Decoupled Progression Stream */}
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                            <History className="w-3.5 h-3.5 text-orange-400" />
                            Performance Stream Across Past Sessions (Chronological):
                          </h4>
                          <span className="text-[11px] text-zinc-500">
                            {target.progressionTimeline?.length || 0} historical occurrences
                          </span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left">
                            <thead className="text-[10px] text-zinc-400 uppercase bg-zinc-950 border-b border-zinc-800">
                              <tr>
                                <th className="py-2.5 px-3">Date</th>
                                <th className="py-2.5 px-3">Origin Routine Folder</th>
                                <th className="py-2.5 px-3">Top Weight</th>
                                <th className="py-2.5 px-3">Top Reps</th>
                                <th className="py-2.5 px-3">Est. 1RM (Brzycki)</th>
                                <th className="py-2.5 px-3">Volume Moved</th>
                                <th className="py-2.5 px-3 text-right">PR Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/60 font-mono">
                              {target.progressionTimeline?.map((point, pIdx) => (
                                <tr key={pIdx} className="hover:bg-zinc-800/30">
                                  <td className="py-2.5 px-3 text-zinc-400">
                                    {new Date(point.date).toLocaleDateString()}
                                  </td>
                                  <td className="py-2.5 px-3 text-white font-sans font-semibold">
                                    {point.sessionName || 'Logged Session'}
                                  </td>
                                  <td className="py-2.5 px-3 font-bold text-orange-400">
                                    {point.topWeightKg} kg
                                  </td>
                                  <td className="py-2.5 px-3 text-zinc-300">
                                    {point.topReps} reps ({point.workingSetsCount} sets)
                                  </td>
                                  <td className="py-2.5 px-3 font-bold text-emerald-400">
                                    {point.estimated1RMKg} kg
                                  </td>
                                  <td className="py-2.5 px-3 text-zinc-300">
                                    {point.totalVolumeKg?.toLocaleString()} kg
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-sans">
                                    {point.isPersonalRecord ? (
                                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 justify-end">
                                        <Sparkles className="w-3 h-3" /> PR
                                      </span>
                                    ) : (
                                      <span className="text-zinc-500 text-[10px]">Standard</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Multi-Movement Summary Grid */}
                    {selectedProgressionExercise === 'all' && exerciseProgressions.length > 1 && (
                      <div className="space-y-4">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <BarChart2 className="w-4 h-4 text-orange-400" />
                          All Tracked Movement Programs:
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {exerciseProgressions.map((ep) => (
                            <div
                              key={ep.exerciseId}
                              onClick={() => setSelectedProgressionExercise(ep.exerciseName)}
                              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 cursor-pointer hover:border-orange-500/50 hover:bg-zinc-800/40 transition space-y-3"
                            >
                              <div className="flex items-center justify-between">
                                <h5 className="text-sm font-bold text-white">{ep.exerciseName}</h5>
                                <span className="text-[10px] text-zinc-500 uppercase bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                                  {ep.targetMuscle || 'Strength'}
                                </span>
                              </div>

                              <div className="grid grid-cols-3 gap-2 text-center py-2 border-y border-zinc-800/80">
                                <div>
                                  <span className="text-[10px] text-zinc-500 block uppercase">Top Weight</span>
                                  <span className="text-sm font-bold text-white font-mono">{ep.allTimeMaxWeightKg} kg</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-zinc-500 block uppercase">Est 1RM</span>
                                  <span className="text-sm font-bold text-emerald-400 font-mono">{ep.allTimeEstimated1RMKg} kg</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-zinc-500 block uppercase">Sessions</span>
                                  <span className="text-sm font-bold text-orange-400 font-mono">{ep.totalSessionsCount}</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-xs text-orange-400 font-semibold pt-1">
                                <span>Inspect progression & timeline</span>
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* VIEW 2: DEDICATED EXERCISE LIBRARY & BROWSE DATABASE         */}
      {/* ============================================================ */}
      {activeSubTab === 'library' && (
        <div className="space-y-6 animate-fade-in">
          {/* Library Header & Filters */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-orange-400" />
                  Exercise Database Library
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Browse technique instructions, target muscle groups, and add exercises to your active session.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono font-bold text-orange-400">
                  {libraryExercises.length} Movements Available
                </span>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('session')}
                  className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm"
                >
                  <FolderPlus className="w-3.5 h-3.5" /> Back to Session Folder
                </button>
              </div>
            </div>

            {/* Search Input for Library */}
            <div className="relative">
              <input
                type="text"
                value={librarySearch}
                onChange={(e) => handleLibrarySearchChange(e.target.value)}
                placeholder="Search exercise library by name or keyword (e.g. 'press', 'squat', 'curl', 'chest')..."
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition shadow-inner"
              />
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
            </div>

            {/* Filter 1: Body Part Pills */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="w-3 h-3 text-orange-400" /> Filter by Body Part:
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {bodyPartFilters.map((bp) => (
                  <button
                    key={bp.id}
                    type="button"
                    onClick={() => {
                      setSelectedBodyPart(bp.id);
                      fetchLibraryExercises(librarySearch, bp.id, selectedEquipment);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      selectedBodyPart === bp.id
                        ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                        : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    {bp.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter 2: Equipment Pills */}
            <div className="space-y-1.5 pt-2 border-t border-zinc-800/80">
              <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Dumbbell className="w-3 h-3 text-amber-400" /> Filter by Equipment:
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {equipmentFilters.map((eq) => (
                  <button
                    key={eq.id}
                    type="button"
                    onClick={() => {
                      setSelectedEquipment(eq.id);
                      fetchLibraryExercises(librarySearch, selectedBodyPart, eq.id);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      selectedEquipment === eq.id
                        ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                        : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    {eq.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Exercise Grid */}
          {libraryLoading ? (
            <div className="py-16 text-center text-zinc-500 text-xs">
              <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading exercise database...
            </div>
          ) : libraryExercises.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-900">
              <Dumbbell className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
              <h4 className="text-base font-bold text-white">No matching exercises found</h4>
              <p className="text-xs text-zinc-400 mt-1">
                Try clearing your search query or switching filters to view all movements.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {libraryExercises.map((exercise) => {
                const isAlreadyInSession = sessionExercises.some((s) => s.exerciseId === exercise.id);

                return (
                  <div
                    key={exercise.id}
                    className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 shadow-lg flex flex-col justify-between transition group"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-orange-500/15 text-orange-400 border border-orange-500/30">
                          {exercise.body_part}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-950 text-zinc-400 border border-zinc-800 capitalize">
                          {exercise.equipment}
                        </span>
                      </div>

                      {/* Exercise Name */}
                      <h4 className="text-base font-extrabold text-white group-hover:text-orange-400 transition">
                        {exercise.name}
                      </h4>

                      {/* Target Muscle */}
                      <div className="mt-1.5 text-xs text-zinc-400">
                        Primary Target: <strong className="text-zinc-200 capitalize">{exercise.target}</strong>
                      </div>

                      {/* Instructions Preview snippet */}
                      {exercise.instructions && exercise.instructions.length > 0 && (
                        <p className="mt-2.5 text-[11px] text-zinc-400 line-clamp-2 leading-relaxed bg-zinc-950/60 p-2 rounded-lg border border-zinc-800/60">
                          {exercise.instructions[0]}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setInspectingExercise(exercise)}
                        className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" /> Instructions
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectExercise(exercise)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                          isAlreadyInSession
                            ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-orange-600 hover:bg-orange-500 text-white shadow-md shadow-orange-600/30'
                        }`}
                      >
                        {isAlreadyInSession ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> In Session
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" /> Add to Session
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: EXERCISE TECHNIQUE & INSTRUCTIONS VIEWER              */}
      {/* ============================================================ */}
      {inspectingExercise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <span className="text-[10px] font-bold uppercase text-orange-400 bg-orange-500/15 px-2 py-0.5 rounded border border-orange-500/30">
                  {inspectingExercise.body_part} • {inspectingExercise.equipment}
                </span>
                <h3 className="text-xl font-black text-white mt-1">
                  {inspectingExercise.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectingExercise(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto my-4 space-y-4 pr-1">
              {/* Target Focus Banner */}
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Target Muscle Group</span>
                  <span className="text-sm font-bold text-white capitalize">{inspectingExercise.target}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-semibold block text-right">Equipment Required</span>
                  <span className="text-sm font-bold text-orange-400 capitalize text-right block">{inspectingExercise.equipment}</span>
                </div>
              </div>

              {/* Instructions List */}
              <div>
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ListFilter className="w-3.5 h-3.5 text-orange-400" /> Step-by-Step Execution Guide:
                </h4>
                <div className="space-y-2">
                  {inspectingExercise.instructions && inspectingExercise.instructions.length > 0 ? (
                    inspectingExercise.instructions.map((step, sIdx) => (
                      <div key={sIdx} className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-start gap-3">
                        <span className="w-5 h-5 rounded-full bg-orange-600/20 text-orange-400 font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {sIdx + 1}
                        </span>
                        <p className="text-xs text-zinc-300 leading-relaxed font-sans">{step}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-zinc-500 italic">No instructions available for this movement.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-3 border-t border-zinc-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setInspectingExercise(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl transition"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  handleSelectExercise(inspectingExercise);
                  setInspectingExercise(null);
                }}
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-orange-600/30 transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add to Workout Session Folder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POP-UP MODAL: Single Workout Item Details */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-orange-400" />
                <h3 className="text-base font-bold text-white">{activeModalItem.exerciseName}</h3>
              </div>
              <button
                onClick={() => setActiveModalItem(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-zinc-800">
                <span className="text-zinc-400">Date Logged</span>
                <span className="font-semibold text-white">
                  {new Date(activeModalItem.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800">
                <span className="text-zinc-400">Volume Lifted</span>
                <span className="font-semibold text-orange-400">{activeModalItem.totalVolumeKg} kg</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800">
                <span className="text-zinc-400">Est. 1RM (Brzycki)</span>
                <span className="font-semibold text-emerald-400">{activeModalItem.calculated1RM} kg</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800">
                <span className="text-zinc-400">Sets × Reps</span>
                <span className="font-semibold text-white">{activeModalItem.sets} × {activeModalItem.reps}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800">
                <span className="text-zinc-400">RPE (Exertion)</span>
                <span className="font-semibold text-white">{activeModalItem.rpe || 8} / 10</span>
              </div>
              {activeModalItem.notes && (
                <div className="pt-1">
                  <span className="text-zinc-400 block mb-1">Notes:</span>
                  <p className="italic text-zinc-300 font-mono text-[11px] bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                    "{activeModalItem.notes}"
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setActiveModalItem(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POP-UP MODAL: Full History Table */}
      {showAllHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-orange-400" />
                  Historical Training Logs &amp; PR Records
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Complete chronological progression database for current user
                </p>
              </div>
              <button
                onClick={() => setShowAllHistoryModal(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto my-4 space-y-2 pr-2">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] text-zinc-400 uppercase bg-zinc-950 border-b border-zinc-800 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Exercise</th>
                    <th className="py-2.5 px-3">Sets × Reps</th>
                    <th className="py-2.5 px-3">Weight</th>
                    <th className="py-2.5 px-3">1RM Est.</th>
                    <th className="py-2.5 px-3">Duration</th>
                    <th className="py-2.5 px-3">Total Vol.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {workouts.map((w) => (
                    <tr key={w.id || w._id} className="hover:bg-zinc-800/40">
                      <td className="py-2 px-3 text-zinc-400">{new Date(w.timestamp).toLocaleDateString()}</td>
                      <td className="py-2 px-3 font-semibold text-white">
                        {w.exerciseName}
                        {w.isPersonalRecord && (
                          <span className="ml-1 text-[9px] text-amber-400 font-bold bg-amber-500/20 px-1 rounded">
                            PR
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-zinc-300">{w.sets} × {w.reps}</td>
                      <td className="py-2 px-3 font-bold text-orange-400">{w.weightLiftedKg} kg</td>
                      <td className="py-2 px-3 font-bold text-emerald-400">{w.calculated1RM} kg</td>
                      <td className="py-2 px-3 text-zinc-400">{w.durationMinutes} min</td>
                      <td className="py-2 px-3 text-zinc-300">{w.totalVolumeKg} kg</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-3 border-t border-zinc-800 flex justify-between items-center text-xs text-zinc-500">
              <span>{workouts.length} total historical logs</span>
              <button
                onClick={() => setShowAllHistoryModal(false)}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg text-xs transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
