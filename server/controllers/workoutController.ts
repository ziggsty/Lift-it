import { Request, Response } from 'express';
import { db } from '../db/database';
import { supabase } from '../db/supabase';
import { IProgressiveChallenge, IWorkoutLog } from '../types';

export const workoutController = {
  /**
   * Log a new workout session
   * Requires: exerciseName, reps, weightLiftedKg, durationMinutes, timestamp
   */
  async logWorkout(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { exerciseName, sets, reps, weightLiftedKg, durationMinutes, notes, rpe, timestamp } = req.body;

      if (!exerciseName || reps === undefined || weightLiftedKg === undefined || durationMinutes === undefined) {
        res.status(400).json({
          success: false,
          error: 'Missing required workout parameters: exerciseName, reps, weightLiftedKg, durationMinutes.',
          code: 'WORKOUT_PARAMS_MISSING',
        });
        return;
      }

      if (reps <= 0 || weightLiftedKg < 0 || durationMinutes <= 0) {
        res.status(400).json({
          success: false,
          error: 'Reps and duration must be positive values. Weight must be non-negative.',
          code: 'INVALID_NUMERIC_VALUES',
        });
        return;
      }

      const workout = await db.createWorkout({
        userId,
        exerciseName: exerciseName.trim(),
        sets: sets ? Number(sets) : 3,
        reps: Number(reps),
        weightLiftedKg: Number(weightLiftedKg),
        durationMinutes: Number(durationMinutes),
        notes: notes ? notes.trim() : '',
        rpe: rpe ? Number(rpe) : 8,
        timestamp: timestamp || new Date().toISOString(),
      });

      res.status(201).json({
        success: true,
        message: 'Workout session logged successfully.',
        data: workout,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Get all workouts for current authenticated user
   */
  async getWorkouts(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { exercise, limit } = req.query;
      let logs = await db.getWorkoutsByUserId(userId);

      if (exercise && typeof exercise === 'string') {
        logs = logs.filter((w) => w.exerciseName.toLowerCase().includes(exercise.toLowerCase()));
      }

      if (limit && !isNaN(Number(limit))) {
        logs = logs.slice(0, Number(limit));
      }

      res.status(200).json({
        success: true,
        count: logs.length,
        data: logs,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Get detailed history formatted specifically for pop-up data displays
   * Groups by exercise, calculates Personal Records (PRs), volume trends, and 1RM gains
   */
  async getHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const logs = await db.getWorkoutsByUserId(userId);

      // Map to find all-time max weights per exercise for PR badges
      const maxWeightsPerExercise = new Map<string, number>();
      logs.forEach((log) => {
        const currentMax = maxWeightsPerExercise.get(log.exerciseName.toLowerCase()) || 0;
        if (log.weightLiftedKg > currentMax) {
          maxWeightsPerExercise.set(log.exerciseName.toLowerCase(), log.weightLiftedKg);
        }
      });

      // Enhance history items with PR status and metrics ready for pop-up modal
      const formattedHistory = logs.map((log) => {
        const isPR = log.weightLiftedKg >= (maxWeightsPerExercise.get(log.exerciseName.toLowerCase()) || 0);
        return {
          ...log,
          isPersonalRecord: isPR,
          brzyckiEstimated1RM: log.calculated1RM,
          workCapacityScore: Math.round(((log.totalVolumeKg || 0) / (log.durationMinutes || 1)) * 10) / 10,
          formattedDate: new Date(log.timestamp).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
        };
      });

      // Retrieve workout sessions folder structure and decoupled exercise progressions
      const sessions = await db.getWorkoutSessionsByUserId(userId);
      const progressions = await db.getExerciseProgressionByUserId(userId);

      // Aggregate high level summary for the user's dashboard
      const totalVolume = logs.reduce((acc, curr) => acc + (curr.totalVolumeKg || 0), 0);
      const totalMinutes = logs.reduce((acc, curr) => acc + curr.durationMinutes, 0);

      res.status(200).json({
        success: true,
        summary: {
          totalWorkoutsLogged: logs.length,
          totalSessionsLogged: sessions.length,
          totalCumulativeVolumeKg: Math.round(totalVolume),
          totalTrainingMinutes: totalMinutes,
          distinctExercisesCount: new Set(logs.map((l) => l.exerciseName.toLowerCase())).size,
        },
        sessions,
        progressions,
        data: formattedHistory,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Weekly Progressive Overload Challenge Generator
   * Evaluates weekly progress, compares previous 7-14 days volume and loads,
   * and dynamically generates personalized progressive overload targets.
   */
  async getProgressiveChallenge(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const allUserLogs = await db.getWorkoutsByUserId(userId);
      if (allUserLogs.length === 0) {
        res.status(200).json({
          success: true,
          message: 'No previous workouts logged yet. Complete your first session to unlock progressive overload challenges!',
          challenges: [],
        });
        return;
      }

      // Group workouts by exercise name
      const exerciseMap = new Map<string, IWorkoutLog[]>();
      allUserLogs.forEach((log) => {
        const key = log.exerciseName;
        if (!exerciseMap.has(key)) {
          exerciseMap.set(key, []);
        }
        exerciseMap.get(key)!.push(log);
      });

      const challenges: IProgressiveChallenge[] = [];

      // Generate dynamic overload challenge for each tracked exercise
      exerciseMap.forEach((logs, exerciseName) => {
        // Logs are sorted chronologically descending
        const latest = logs[0];
        const previous = logs.length > 1 ? logs[1] : null;

        let targetWeight = latest.weightLiftedKg;
        let targetReps = latest.reps;
        let progressionType: 'weight_increase' | 'rep_overload' | 'volume_density' = 'weight_increase';
        let reason = '';
        let targetRestSeconds = 90;

        // Logic 1: If reps are >= 8 and RPE is <= 8.5 -> Increase load (Weight Overload)
        if (latest.reps >= 8 && (latest.rpe || 8) <= 8.5) {
          const increment = latest.weightLiftedKg >= 80 ? 5 : 2.5;
          targetWeight = latest.weightLiftedKg + increment;
          targetReps = latest.reps >= 10 ? 8 : latest.reps; // reset rep floor slightly on weight jump
          progressionType = 'weight_increase';
          reason = `You hit ${latest.reps} reps cleanly at ${latest.weightLiftedKg}kg (RPE ${latest.rpe || 8}). You have earned a +${increment}kg weight jump!`;
          targetRestSeconds = 120;
        }
        // Logic 2: If weight was matched across 2 sessions -> Push rep overload
        else if (previous && previous.weightLiftedKg === latest.weightLiftedKg && latest.reps < 10) {
          targetReps = latest.reps + 2;
          targetWeight = latest.weightLiftedKg;
          progressionType = 'rep_overload';
          reason = `Consolidating ${latest.weightLiftedKg}kg. Target +2 reps per set (${targetReps} reps) before jumping weight.`;
          targetRestSeconds = 90;
        }
        // Logic 3: Heavy compound low rep (<= 5 reps) -> Volume density & work capacity
        else if (latest.reps <= 5) {
          targetWeight = latest.weightLiftedKg + 2.5;
          targetReps = latest.reps;
          progressionType = 'volume_density';
          reason = `Strength phase detected. Push load to ${targetWeight}kg while maintaining explosive concentric drive and 3 min recovery.`;
          targetRestSeconds = 180;
        } else {
          // Default sensible progressive overload
          targetWeight = latest.weightLiftedKg + 2.5;
          targetReps = latest.reps;
          progressionType = 'weight_increase';
          reason = `Progressive stimulus: Maintain form integrity with +2.5kg increase on your working sets.`;
        }

        challenges.push({
          exerciseName,
          currentEstimated1RM: latest.calculated1RM || latest.weightLiftedKg,
          lastWeightKg: latest.weightLiftedKg,
          lastReps: latest.reps,
          targetWeightKg: targetWeight,
          targetReps,
          progressionType,
          progressionReason: reason,
          recommendedSets: latest.sets || 4,
          targetRestSeconds,
        });
      });

      res.status(200).json({
        success: true,
        generatedAt: new Date().toISOString(),
        evaluationPeriodDays: 14,
        totalTrackedMovements: challenges.length,
        challenges,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Delete workout log
   */
  async deleteWorkout(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const deleted = await db.deleteWorkout(id, userId);
      if (!deleted) {
        res.status(404).json({ success: false, error: 'Workout log not found or already deleted.' });
        return;
      }

      res.status(200).json({ success: true, message: 'Workout log removed successfully.' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Log a complete workout session folder with multiple exercises and sets
   * Route: POST /api/workouts/sessions
   */
  async logSession(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { name, durationMinutes, weightUnit, notes, exercises, startTime, endTime } = req.body;

      if (!name || !Array.isArray(exercises) || exercises.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Session name and at least one exercise are required.',
          code: 'INVALID_SESSION_DATA',
        });
        return;
      }

      const durMins = Number(durationMinutes) || 45;
      const unit = weightUnit === 'lbs' ? 'lbs' : 'kg';
      const createdLogs: any[] = [];

      // Try inserting into Supabase workout_sessions / session_exercises / workout_sets if tables exist
      let supabaseSessionId: string | null = null;
      try {
        const { data: sData, error: sErr } = await supabase
          .from('workout_sessions')
          .insert({
            user_id: userId,
            name: name.trim(),
            status: 'completed',
            start_time: startTime || new Date(Date.now() - durMins * 60000).toISOString(),
            end_time: endTime || new Date().toISOString(),
            duration_seconds: durMins * 60,
            notes: notes || '',
          })
          .select()
          .single();

        if (!sErr && sData) {
          supabaseSessionId = sData.id;
          for (let i = 0; i < exercises.length; i++) {
            const ex = exercises[i];
            const { data: seData } = await supabase
              .from('session_exercises')
              .insert({
                session_id: sData.id,
                exercise_id: ex.exerciseId || ex.id || 'ex_custom',
                order_in_session: i + 1,
                notes: ex.notes || '',
              })
              .select()
              .single();

            if (seData && Array.isArray(ex.sets)) {
              const setsToInsert = ex.sets.map((s: any, sIdx: number) => ({
                session_exercise_id: seData.id,
                session_id: sData.id,
                user_id: userId,
                exercise_id: ex.exerciseId || ex.id || 'ex_custom',
                set_number: s.setNumber || sIdx + 1,
                weight: Number(s.weight || 0),
                weight_unit: unit,
                reps: Number(s.reps || 0),
                rpe: s.rpe ? Number(s.rpe) : null,
                is_warmup: !!s.isWarmup,
              }));
              await supabase.from('workout_sets').insert(setsToInsert);
            }
          }
        }
      } catch (sbErr) {
        console.warn('[workoutController] Notice on Supabase workout_sessions table:', sbErr);
      }

      // Save structured session folder in application database so history & progression update immediately
      const savedSession = await db.createWorkoutSession({
        userId,
        name: name.trim(),
        durationMinutes: durMins,
        weightUnit: unit,
        notes: notes || '',
        exercises,
        timestamp: startTime || new Date().toISOString(),
        supabaseId: supabaseSessionId || undefined,
      });

      // Also persist to legacy workout_logs for backward compatibility
      for (const ex of exercises) {
        const workingSets = Array.isArray(ex.sets) ? ex.sets.filter((s: any) => !s.isWarmup) : [];
        const targetSets = workingSets.length > 0 ? workingSets : ex.sets || [];

        const topSet = targetSets.reduce((prev: any, curr: any) => {
          return (Number(curr.weight) > Number(prev.weight)) ? curr : prev;
        }, targetSets[0] || { weight: 50, reps: 10, rpe: 8 });

        const rawWeight = Number(topSet.weight) || 50;
        const normalizedWeightKg = unit === 'lbs' ? Math.round(rawWeight * 0.45359237 * 10) / 10 : rawWeight;
        const avgReps = Math.round(targetSets.reduce((acc: number, s: any) => acc + (Number(s.reps) || 0), 0) / (targetSets.length || 1));
        const avgRpe = topSet.rpe ? Number(topSet.rpe) : 8.5;

        const workoutLog = await db.createWorkout({
          userId,
          exerciseName: (ex.exerciseName || ex.name || 'Custom Exercise').trim(),
          sets: ex.sets ? ex.sets.length : 3,
          reps: avgReps > 0 ? avgReps : 8,
          weightLiftedKg: normalizedWeightKg,
          durationMinutes: Math.round(durMins / (exercises.length || 1)),
          notes: `${name}: ${ex.notes || (unit === 'lbs' ? `${rawWeight} lbs logged` : `${rawWeight} kg logged`)}`,
          rpe: avgRpe,
          timestamp: new Date().toISOString(),
        });

        createdLogs.push(workoutLog);
      }

      res.status(201).json({
        success: true,
        message: `Workout session "${name}" logged successfully with ${exercises.length} exercises.`,
        sessionId: supabaseSessionId || savedSession.id,
        session: savedSession,
        exerciseCount: exercises.length,
        logs: createdLogs,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Get all saved workout sessions (folders with exercises and sets) for current user
   * Route: GET /api/workouts/sessions
   */
  async getSessions(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const sessions = await db.getWorkoutSessionsByUserId(userId);
      res.status(200).json({
        success: true,
        count: sessions.length,
        data: sessions,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Delete a saved workout session folder
   * Route: DELETE /api/workouts/sessions/:id
   */
  async deleteSession(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const deleted = await db.deleteWorkoutSession(id, userId);
      res.status(200).json({
        success: true,
        message: 'Workout session removed successfully.',
        deleted,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * STRICT RULE: Dedicated Exercise Progressive Overload Tracker
   * Purely tied to the individual exercise program over time across all past sessions,
   * completely decoupled from the session folder level.
   * Route: GET /api/workouts/progression?exercise=Bench
   */
  async getProgression(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { exercise } = req.query;
      const progression = await db.getExerciseProgressionByUserId(
        userId,
        typeof exercise === 'string' ? exercise : undefined
      );

      res.status(200).json({
        success: true,
        count: progression.length,
        data: progression,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
