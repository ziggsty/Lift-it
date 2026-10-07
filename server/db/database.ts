import bcrypt from 'bcryptjs';
import { supabase, SUPABASE_CONFIG } from './supabase';
import { 
  IUser, IWorkoutLog, IMealLog, IFoodItem, ISystemAnnouncement, UserRole,
  WorkoutSessionItem, ExerciseProgressionRecord, ExerciseProgressionTimelinePoint,
  SessionExerciseData, WorkoutSetData 
} from '../types';

class LiftItDatabase {
  // Local fallback caches for in-memory responsiveness & offline resilience
  private localUsers: IUser[] = [
    {
      _id: '4',
      id: '4',
      name: 'Marcus Administrator',
      email: 'admin@liftit.com',
      passwordHash: '$2b$10$P4xURYAwCUfUqPO0vZ5qNuu37JMEi9zCDsqBjyMz2QQZOxgERz63K', // AdminPass123!
      role: 'admin',
      isFlagged: false,
      flagReason: '',
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z',
      profile: {
        heightCm: 182,
        weightKg: 85,
        activityLevel: 'very_active',
        targetCalorieGoal: 2800,
        targetProteinGoal: 180,
      },
    },
    {
      _id: '3',
      id: '3',
      name: 'Sarah Lifter',
      email: 'sarah.lifter@liftit.com',
      passwordHash: '$2b$10$ET1PlXoxogvxVFckYGYM9OF5RClAIwWPK2LKXPRUeHhBrS2LMtEAS', // LiftStrong2026!
      role: 'registered',
      isFlagged: false,
      flagReason: '',
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z',
      profile: {
        heightCm: 168,
        weightKg: 62,
        activityLevel: 'moderate',
        targetCalorieGoal: 2100,
        targetProteinGoal: 130,
      },
    },
  ];
  private localWorkouts: IWorkoutLog[] = [];
  private localWorkoutSessions: WorkoutSessionItem[] = [];
  private localMeals: IMealLog[] = [];
  private foodDatabase: IFoodItem[] = [];
  private announcements: ISystemAnnouncement[] = [];
  private isInitialized = false;

  constructor() {
    this.seedFoodAndAnnouncements();
    this.initializeFromSupabase().catch((err) => {
      console.warn('[Database] Initial Supabase sync deferred:', err.message);
    });
  }

  private seedFoodAndAnnouncements() {
    this.foodDatabase = [
      {
        _id: 'food_001',
        id: 'food_001',
        name: 'Boneless Skinless Chicken Breast (Cooked)',
        category: 'protein',
        servingSize: '100g',
        calories: 165,
        proteinGrams: 31.0,
        fiberGrams: 0,
        carbsGrams: 0,
        fatsGrams: 3.6,
        sodiumMg: 74,
        potassiumMg: 256,
        publicNotes: 'Lean whole poultry protein staple',
        isCustom: false,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        _id: 'food_002',
        id: 'food_002',
        name: 'Whole Rolled Oats (Raw)',
        category: 'carbs',
        servingSize: '50g (1/2 cup)',
        calories: 190,
        proteinGrams: 6.5,
        fiberGrams: 5.0,
        carbsGrams: 34.0,
        fatsGrams: 3.0,
        sodiumMg: 2,
        potassiumMg: 180,
        publicNotes: 'Complex slow-digesting carbohydrate with beta-glucan',
        isCustom: false,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        _id: 'food_003',
        id: 'food_003',
        name: 'Whey Protein Isolate 90% (Chocolate)',
        category: 'protein',
        servingSize: '30g (1 scoop)',
        calories: 115,
        proteinGrams: 27.0,
        fiberGrams: 0.5,
        carbsGrams: 1.0,
        fatsGrams: 0.5,
        sodiumMg: 110,
        potassiumMg: 160,
        publicNotes: 'Ultra-fast absorbing post-workout protein',
        isCustom: false,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        _id: 'food_004',
        id: 'food_004',
        name: 'Wild Atlantic Salmon Fillet',
        category: 'protein',
        servingSize: '150g',
        calories: 280,
        proteinGrams: 34.0,
        fiberGrams: 0,
        carbsGrams: 0,
        fatsGrams: 15.0,
        sodiumMg: 85,
        potassiumMg: 520,
        publicNotes: 'Premium heart-healthy EPA/DHA fatty acids',
        isCustom: false,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        _id: 'food_005',
        id: 'food_005',
        name: 'Large Grade-A Whole Egg',
        category: 'protein',
        servingSize: '1 large egg (50g)',
        calories: 72,
        proteinGrams: 6.3,
        fiberGrams: 0,
        carbsGrams: 0.4,
        fatsGrams: 4.8,
        sodiumMg: 71,
        potassiumMg: 69,
        publicNotes: 'Complete amino acid profile with bioavailable choline',
        isCustom: false,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        _id: 'food_006',
        id: 'food_006',
        name: 'Cooked Jasmine Brown Rice',
        category: 'carbs',
        servingSize: '150g (1 cup cooked)',
        calories: 168,
        proteinGrams: 3.8,
        fiberGrams: 2.8,
        carbsGrams: 35.0,
        fatsGrams: 1.2,
        sodiumMg: 5,
        potassiumMg: 120,
        publicNotes: 'Wholesome grain for sustained glycogen replenishment',
        isCustom: false,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        _id: 'food_007',
        id: 'food_007',
        name: 'Hass Avocado (Fresh)',
        category: 'fats',
        servingSize: '100g (approx 1/2 avocado)',
        calories: 160,
        proteinGrams: 2.0,
        fiberGrams: 6.7,
        carbsGrams: 8.5,
        fatsGrams: 14.7,
        sodiumMg: 7,
        potassiumMg: 485,
        publicNotes: 'Monounsaturated oleic acid source for hormonal balance',
        isCustom: false,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        _id: 'food_008',
        id: 'food_008',
        name: 'Nonfat Plain Greek Yogurt',
        category: 'dairy',
        servingSize: '170g (3/4 cup)',
        calories: 100,
        proteinGrams: 18.0,
        fiberGrams: 0,
        carbsGrams: 6.0,
        fatsGrams: 0.7,
        sodiumMg: 60,
        potassiumMg: 240,
        publicNotes: 'Probiotic casein protein ideal before sleep',
        isCustom: false,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        _id: 'food_009',
        id: 'food_009',
        name: 'Natural Crunchy Peanut Butter',
        category: 'fats',
        servingSize: '32g (2 tbsp)',
        calories: 190,
        proteinGrams: 8.0,
        fiberGrams: 2.0,
        carbsGrams: 7.0,
        fatsGrams: 16.0,
        sodiumMg: 5,
        potassiumMg: 210,
        publicNotes: 'Calorie-dense healthy lipid source',
        isCustom: false,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        _id: 'food_010',
        id: 'food_010',
        name: 'Medium Ripe Banana',
        category: 'fruit',
        servingSize: '1 medium (118g)',
        calories: 105,
        proteinGrams: 1.3,
        fiberGrams: 3.1,
        carbsGrams: 27.0,
        fatsGrams: 0.3,
        sodiumMg: 1,
        potassiumMg: 422,
        publicNotes: 'Electrolyte and fast-acting pre-workout glucose',
        isCustom: false,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ];

    this.announcements = [
      {
        _id: 'anc_001',
        id: 'anc_001',
        title: 'Lift It Platform Live on Supabase PostgreSQL!',
        message: 'All athlete accounts, workouts, and meal plan logs are now persisting directly into your Supabase database.',
        priority: 'high',
        targetType: 'all',
        targetUserIds: [],
        targetUserEmails: [],
        createdByEmail: 'admin@liftit.com',
        createdAt: '2026-10-01T12:00:00.000Z',
        active: true,
      },
      {
        _id: 'anc_002',
        id: 'anc_002',
        title: 'Dynamic Progressive Overload Engine Activated',
        message: 'Your rolling 14-day training volume is evaluated automatically to calculate progressive weight and rep jumps.',
        priority: 'normal',
        targetType: 'all',
        targetUserIds: [],
        targetUserEmails: [],
        createdByEmail: 'admin@liftit.com',
        createdAt: '2026-10-02T09:00:00.000Z',
        active: true,
      },
    ];
  }

  /**
   * Sync initial data from Supabase
   */
  public async initializeFromSupabase(): Promise<void> {
    try {
      const { data: users, error: uErr } = await supabase.from('users').select('*');
      if (!uErr && users) {
        const loaded = users.map(this.mapSupabaseUser);
        const hasAdmin = loaded.some((u) => u.email.toLowerCase() === 'admin@liftit.com');
        if (!hasAdmin) {
          try {
            const adminHash = '$2b$10$P4xURYAwCUfUqPO0vZ5qNuu37JMEi9zCDsqBjyMz2QQZOxgERz63K'; // AdminPass123!
            const { data: seededAdmin } = await supabase.from('users').insert({
              username: 'Marcus Administrator',
              email: 'admin@liftit.com',
              password_hash: adminHash,
              role: 'ADMIN',
              flagged: false,
            }).select().single();
            if (seededAdmin) {
              loaded.push(this.mapSupabaseUser(seededAdmin));
              console.log('[Supabase] Auto-seeded admin@liftit.com into Supabase.');
            }
          } catch (seedErr: any) {
            console.warn('[Supabase] Admin auto-seed deferred:', seedErr.message);
          }
        }
        this.localUsers = loaded;
        console.log(`[Supabase] Loaded ${this.localUsers.length} user(s) from Supabase 'users' table.`);
      }

      const { data: workouts, error: wErr } = await supabase.from('workout_logs').select('*');
      if (!wErr && workouts) {
        this.localWorkouts = workouts.map(this.mapSupabaseWorkout);
        console.log(`[Supabase] Loaded ${this.localWorkouts.length} workout(s) from Supabase 'workout_logs' table.`);
      }

      const { data: meals, error: mErr } = await supabase.from('meal_logs').select('*');
      if (!mErr && meals) {
        this.localMeals = meals.map(this.mapSupabaseMeal);
        console.log(`[Supabase] Loaded ${this.localMeals.length} meal(s) from Supabase 'meal_logs' table.`);
      }

      this.isInitialized = true;
    } catch (err: any) {
      console.warn('[Supabase] Sync notice:', err.message);
    }
  }

  // Mapper helpers
  private mapSupabaseUser(row: any): IUser {
    const rawRole = (row.role || 'registered').toLowerCase();
    const role: UserRole = rawRole === 'admin' ? 'admin' : rawRole === 'guest' ? 'guest' : 'registered';
    const id = String(row.id);

    return {
      _id: id,
      id,
      name: row.username || row.name || (row.email ? row.email.split('@')[0] : 'Athlete'),
      email: (row.email || '').toLowerCase(),
      passwordHash: row.password_hash || '',
      role,
      isFlagged: Boolean(row.flagged || row.is_flagged),
      flagReason: row.flag_reason || (row.flagged ? 'Flagged by administrator' : ''),
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || row.created_at || new Date().toISOString(),
      profile: row.profile || {
        heightCm: 175,
        weightKg: 75,
        activityLevel: 'moderate',
        targetCalorieGoal: 2400,
        targetProteinGoal: 150,
      },
    };
  }

  private mapSupabaseWorkout(row: any): IWorkoutLog {
    const id = String(row.id);
    const weight = Number(row.weight || row.weight_lifted_kg || 0);
    const reps = Number(row.reps || 8);
    const sets = Number(row.sets || (row.notes && row.notes.match(/Sets:\s*(\d+)/) ? Number(row.notes.match(/Sets:\s*(\d+)/)[1]) : 4));
    const duration = Number(row.duration || row.duration_minutes || 45);

    let calculated1RM = weight;
    if (reps > 1 && reps < 37) {
      calculated1RM = Math.round((weight / (1.0278 - 0.0278 * reps)) * 10) / 10;
    }
    const totalVolumeKg = sets * reps * weight;

    return {
      _id: id,
      id,
      userId: String(row.user_id),
      exerciseName: row.exercise_name,
      sets,
      reps,
      weightLiftedKg: weight,
      durationMinutes: duration,
      rpe: Number(row.rpe || 8.0),
      notes: row.notes || '',
      calculated1RM,
      totalVolumeKg,
      timestamp: row.created_at || row.timestamp || new Date().toISOString(),
    };
  }

  private mapSupabaseMeal(row: any): IMealLog {
    const id = String(row.id);
    const mealTypeRaw = (row.meal_type || 'lunch').toLowerCase();
    const mealType = (['breakfast', 'lunch', 'dinner', 'snack'].includes(mealTypeRaw)
      ? mealTypeRaw
      : 'lunch') as 'breakfast' | 'lunch' | 'dinner' | 'snack';

    return {
      _id: id,
      id,
      userId: String(row.user_id),
      mealName: row.food_name || row.meal_name || 'Meal',
      mealType,
      calories: Number(row.calories || 0),
      proteinGrams: Number(row.protein || row.protein_grams || 0),
      fiberGrams: Number(row.fiber || row.fiber_grams || 0),
      carbsGrams: Number(row.carbs || row.carbs_grams || 0),
      fatsGrams: Number(row.fats || row.fats_grams || 0),
      notes: row.notes || '',
      timestamp: row.created_at || row.timestamp || new Date().toISOString(),
    };
  }

  // ==========================================
  // USER OPERATIONS (Direct to Supabase 'users')
  // ==========================================

  public async findUserById(id: string): Promise<IUser | undefined> {
    const query = !isNaN(Number(id)) ? Number(id) : id;
    try {
      const { data, error } = await supabase.from('users').select('*').eq('id', query).maybeSingle();
      if (!error && data) {
        return this.mapSupabaseUser(data);
      }
      if (error) {
        console.warn('[Supabase] findUserById error:', error.message);
      }
    } catch (err: any) {
      console.warn('[Supabase] findUserById exception:', err.message);
    }
    return this.localUsers.find((u) => u.id === String(id) || u._id === String(id));
  }

  public async findUserByEmail(email: string): Promise<IUser | undefined> {
    const cleanEmail = email.toLowerCase().trim();
    try {
      const { data, error } = await supabase.from('users').select('*').ilike('email', cleanEmail).maybeSingle();
      if (!error && data) {
        return this.mapSupabaseUser(data);
      }
      if (error) {
        console.warn('[Supabase] findUserByEmail error:', error.message);
      }
    } catch (err: any) {
      console.warn('[Supabase] findUserByEmail exception:', err.message);
    }
    return this.localUsers.find((u) => u.email.toLowerCase() === cleanEmail);
  }

  public async getAllUsers(): Promise<IUser[]> {
    const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('[Supabase] getAllUsers error:', error.message);
      throw new Error(`Supabase query error: ${error.message}`);
    }
    return (data || []).map((r) => this.mapSupabaseUser(r));
  }

  public async createUser(userData: Omit<IUser, '_id' | 'id' | 'createdAt' | 'updatedAt'>): Promise<IUser> {
    const cleanEmail = userData.email.toLowerCase().trim();

    // Insert directly into Supabase 'users' table
    let { data, error } = await supabase
      .from('users')
      .insert({
        username: userData.name,
        email: cleanEmail,
        password_hash: userData.passwordHash,
        role: userData.role.toUpperCase(),
        flagged: Boolean(userData.isFlagged),
      })
      .select()
      .single();

    // If column 'username' is named 'name' in a custom schema, handle gracefully
    if (error && error.message.includes('username')) {
      const retry = await supabase
        .from('users')
        .insert({
          name: userData.name,
          email: cleanEmail,
          password_hash: userData.passwordHash,
          role: userData.role.toUpperCase(),
        })
        .select()
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error('[Supabase] Failed to insert user into Supabase users table:', error.message);
      throw new Error(`Supabase user registration error: ${error.message}`);
    }

    if (data) {
      const mapped = this.mapSupabaseUser(data);
      console.log(`[Supabase] Created user ${cleanEmail} directly in Supabase (ID: ${mapped.id})`);
      return mapped;
    }

    throw new Error('Failed to create user in Supabase.');
  }

  public async updateUser(id: string, updates: Partial<IUser>): Promise<IUser | undefined> {
    try {
      const queryId = !isNaN(Number(id)) ? Number(id) : id;
      const sbUpdates: Record<string, any> = {};

      if (updates.name !== undefined) sbUpdates.username = updates.name;
      if (updates.role !== undefined) sbUpdates.role = updates.role.toUpperCase();
      if (updates.isFlagged !== undefined) sbUpdates.flagged = Boolean(updates.isFlagged);

      const { data, error } = await supabase
        .from('users')
        .update(sbUpdates)
        .eq('id', queryId)
        .select()
        .maybeSingle();

      if (!error && data) {
        const mapped = this.mapSupabaseUser(data);
        this.upsertLocalUser(mapped);
        return mapped;
      }
    } catch (err: any) {
      console.warn('[Supabase] updateUser exception:', err.message);
    }

    // Local fallback update
    const index = this.localUsers.findIndex((u) => u._id === id || u.id === id);
    if (index === -1) return undefined;
    this.localUsers[index] = {
      ...this.localUsers[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return this.localUsers[index];
  }

  public async deleteUser(id: string): Promise<boolean> {
    try {
      const queryId = !isNaN(Number(id)) ? Number(id) : id;
      const { error } = await supabase.from('users').delete().eq('id', queryId);
      if (!error) {
        this.localUsers = this.localUsers.filter((u) => u._id !== id && u.id !== id);
        this.localWorkouts = this.localWorkouts.filter((w) => w.userId !== id);
        this.localMeals = this.localMeals.filter((m) => m.userId !== id);
        return true;
      }
    } catch (err: any) {
      console.warn('[Supabase] deleteUser exception:', err.message);
    }

    const initialLen = this.localUsers.length;
    this.localUsers = this.localUsers.filter((u) => u._id !== id && u.id !== id);
    this.localWorkouts = this.localWorkouts.filter((w) => w.userId !== id);
    this.localMeals = this.localMeals.filter((m) => m.userId !== id);
    return this.localUsers.length < initialLen;
  }

  private upsertLocalUser(user: IUser) {
    const idx = this.localUsers.findIndex((u) => u.id === user.id || u.email === user.email);
    if (idx >= 0) {
      this.localUsers[idx] = user;
    } else {
      this.localUsers.push(user);
    }
  }

  // ==========================================
  // WORKOUT OPERATIONS (Direct to Supabase 'workout_logs')
  // ==========================================

  public async getWorkoutsByUserId(userId: string): Promise<IWorkoutLog[]> {
    const queryUserId = !isNaN(Number(userId)) ? Number(userId) : userId;
    const { data, error } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', queryUserId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Supabase] getWorkoutsByUserId error:', error.message);
      throw new Error(`Supabase query error: ${error.message}`);
    }

    return (data || []).map((r) => this.mapSupabaseWorkout(r));
  }

  public async createWorkout(
    workoutData: Omit<IWorkoutLog, '_id' | 'id' | 'calculated1RM' | 'totalVolumeKg'>
  ): Promise<IWorkoutLog> {
    const queryUserId = !isNaN(Number(workoutData.userId)) ? Number(workoutData.userId) : workoutData.userId;
    const sets = Number(workoutData.sets || 3);
    const reps = Number(workoutData.reps || 8);
    const weight = Number(workoutData.weightLiftedKg || 0);
    const duration = Number(workoutData.durationMinutes || 30);
    const notesWithSets = workoutData.notes ? `Sets: ${sets} • ${workoutData.notes}` : `Sets: ${sets}`;

    const { data, error } = await supabase
      .from('workout_logs')
      .insert({
        user_id: queryUserId,
        exercise_name: workoutData.exerciseName,
        reps,
        weight,
        duration,
        rpe: workoutData.rpe || 8.0,
        notes: notesWithSets,
        created_at: workoutData.timestamp || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[Supabase] Workout insert error into Supabase workout_logs:', error.message);
      throw new Error(`Supabase workout insert error: ${error.message}`);
    }

    if (data) {
      const mapped = this.mapSupabaseWorkout(data);
      console.log(`[Supabase] Persisted workout '${mapped.exerciseName}' directly into Supabase workout_logs (ID: ${mapped.id}).`);
      return mapped;
    }

    throw new Error('Failed to persist workout in Supabase.');
  }

  public async deleteWorkout(id: string, userId: string): Promise<boolean> {
    try {
      const queryId = !isNaN(Number(id)) ? Number(id) : id;
      const queryUserId = !isNaN(Number(userId)) ? Number(userId) : userId;
      const { error } = await supabase
        .from('workout_logs')
        .delete()
        .eq('id', queryId)
        .eq('user_id', queryUserId);
      if (!error) {
        this.localWorkouts = this.localWorkouts.filter((w) => w.id !== id && w._id !== id);
        return true;
      }
    } catch (err: any) {
      console.warn('[Supabase] deleteWorkout error:', err.message);
    }

    const initialLen = this.localWorkouts.length;
    this.localWorkouts = this.localWorkouts.filter((w) => !(w.id === id && w.userId === userId));
    return this.localWorkouts.length < initialLen;
  }

  public async getAllWorkouts(): Promise<IWorkoutLog[]> {
    try {
      const { data, error } = await supabase.from('workout_logs').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        this.localWorkouts = data.map((r) => this.mapSupabaseWorkout(r));
        return [...this.localWorkouts];
      }
    } catch {
      // Fallback
    }
    return [...this.localWorkouts];
  }

  // ==========================================
  // WORKOUT SESSION 'FOLDER' OPERATIONS
  // ==========================================

  public async getWorkoutSessionsByUserId(userId: string): Promise<WorkoutSessionItem[]> {
    const queryUserId = !isNaN(Number(userId)) ? Number(userId) : userId;

    // 1. Check if Supabase has workout_sessions with joined session_exercises & workout_sets
    try {
      const { data: sbSessions, error: sErr } = await supabase
        .from('workout_sessions')
        .select(`
          id,
          user_id,
          name,
          status,
          duration_seconds,
          notes,
          start_time,
          created_at,
          session_exercises (
            id,
            exercise_id,
            order_in_session,
            notes,
            exercises (id, name, body_part, target, equipment),
            workout_sets (
              id,
              set_number,
              weight,
              weight_unit,
              reps,
              rpe,
              is_warmup,
              is_personal_record
            )
          )
        `)
        .eq('user_id', queryUserId)
        .order('start_time', { ascending: false });

      if (!sErr && Array.isArray(sbSessions) && sbSessions.length > 0) {
        const mappedSessions: WorkoutSessionItem[] = sbSessions.map((row: any) => {
          let totalVol = 0;
          let totalSets = 0;
          const exercises = (row.session_exercises || [])
            .sort((a: any, b: any) => (a.order_in_session || 0) - (b.order_in_session || 0))
            .map((se: any) => {
              const sets = (se.workout_sets || [])
                .sort((a: any, b: any) => (a.set_number || 0) - (b.set_number || 0))
                .map((ws: any) => {
                  const w = Number(ws.weight || 0);
                  const r = Number(ws.reps || 0);
                  const isKg = ws.weight_unit !== 'lbs';
                  const kgWeight = isKg ? w : w * 0.45359237;
                  if (!ws.is_warmup) {
                    totalVol += Math.round(kgWeight * r);
                  }
                  totalSets++;
                  return {
                    id: String(ws.id),
                    setNumber: ws.set_number,
                    weight: w,
                    weightUnit: ws.weight_unit || 'kg',
                    reps: r,
                    rpe: ws.rpe ? Number(ws.rpe) : undefined,
                    isWarmup: Boolean(ws.is_warmup),
                    isPersonalRecord: Boolean(ws.is_personal_record),
                  };
                });

              const exDetails = se.exercises || {};
              return {
                id: String(se.id),
                exerciseId: String(se.exercise_id || exDetails.id),
                exerciseName: exDetails.name || 'Custom Exercise',
                bodyPart: exDetails.body_part || 'other',
                target: exDetails.target || 'general',
                equipment: exDetails.equipment || 'other',
                notes: se.notes || '',
                sets,
              };
            });

          const durationMins = Math.round(Number(row.duration_seconds || 2700) / 60);
          return {
            _id: String(row.id),
            id: String(row.id),
            userId: String(row.user_id),
            name: row.name,
            status: row.status || 'completed',
            durationMinutes: durationMins,
            weightUnit: 'kg',
            notes: row.notes || '',
            exercises,
            totalVolumeKg: totalVol,
            totalSetsCount: totalSets,
            timestamp: row.start_time || row.created_at,
            formattedDate: new Date(row.start_time || row.created_at).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }),
          };
        });

        this.localWorkoutSessions = mappedSessions;
        return mappedSessions;
      }
    } catch {
      // Proceed to local memory fallback
    }

    const existingLocal = this.localWorkoutSessions.filter((s) => s.userId === String(userId));
    if (existingLocal.length > 0) {
      return existingLocal.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }

    // If no session folders exist yet, synthesize structured folders from legacy workout_logs
    try {
      const logs = await this.getWorkoutsByUserId(userId);
      if (logs.length > 0) {
        // Group by day (YYYY-MM-DD)
        const dateGroups = new Map<string, IWorkoutLog[]>();
        logs.forEach((log) => {
          const dateKey = new Date(log.timestamp).toISOString().split('T')[0];
          if (!dateGroups.has(dateKey)) dateGroups.set(dateKey, []);
          dateGroups.get(dateKey)!.push(log);
        });

        const synthesized: WorkoutSessionItem[] = [];
        dateGroups.forEach((dayLogs, dateStr) => {
          let dayVol = 0;
          let daySets = 0;
          let totalDuration = 0;

          const exList: SessionExerciseData[] = dayLogs.map((log, exIdx) => {
            const setCount = log.sets || 3;
            const reps = log.reps || 8;
            const weight = log.weightLiftedKg || 50;
            totalDuration += log.durationMinutes || 20;

            const sets: WorkoutSetData[] = [];
            for (let s = 1; s <= setCount; s++) {
              daySets++;
              dayVol += Math.round(weight * reps);
              sets.push({
                id: `set_syn_${log.id}_${s}`,
                setNumber: s,
                weight,
                weightUnit: 'kg',
                reps,
                rpe: log.rpe || 8,
                isWarmup: s === 1 && setCount > 2,
                isPersonalRecord: Boolean((log as any).isPersonalRecord),
              });
            }

            return {
              id: `se_syn_${log.id}`,
              exerciseId: `ex_${log.exerciseName.toLowerCase().replace(/\s+/g, '_')}`,
              exerciseName: log.exerciseName,
              bodyPart: 'general',
              target: 'strength',
              equipment: 'standard',
              notes: log.notes || '',
              sets,
            };
          });

          synthesized.push({
            _id: `ses_syn_${dateStr}_${userId}`,
            id: `ses_syn_${dateStr}_${userId}`,
            userId: String(userId),
            name: dayLogs[0].notes && !dayLogs[0].notes.startsWith('Sets:')
              ? dayLogs[0].notes.split('•')[0].trim()
              : `Workout Routine (${dayLogs.length} Movements)`,
            status: 'completed',
            durationMinutes: Math.min(120, Math.max(30, totalDuration)),
            weightUnit: 'kg',
            notes: `Synthesized training routine from recorded sets`,
            exercises: exList,
            totalVolumeKg: dayVol,
            totalSetsCount: daySets,
            timestamp: dayLogs[0].timestamp,
            formattedDate: new Date(dayLogs[0].timestamp).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }),
          });
        });

        this.localWorkoutSessions.push(...synthesized);
        return synthesized.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      }
    } catch {
      // Ignore if fallback unavailable
    }

    return [];
  }

  public async createWorkoutSession(sessionData: {
    userId: string;
    name: string;
    durationMinutes: number;
    weightUnit?: 'kg' | 'lbs';
    notes?: string;
    exercises: any[];
    timestamp?: string;
    supabaseId?: string;
  }): Promise<WorkoutSessionItem> {
    const id = sessionData.supabaseId || `ses_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const durMins = Number(sessionData.durationMinutes || 45);
    const unit = sessionData.weightUnit === 'lbs' ? 'lbs' : 'kg';
    const timestamp = sessionData.timestamp || new Date().toISOString();

    let totalVol = 0;
    let totalSets = 0;

    const formattedExercises = (sessionData.exercises || []).map((ex: any) => {
      const sets = (ex.sets || []).map((s: any, idx: number) => {
        const w = Number(s.weight || 0);
        const r = Number(s.reps || 0);
        const isKg = unit !== 'lbs';
        const kgWeight = isKg ? w : w * 0.45359237;
        if (!s.isWarmup) {
          totalVol += Math.round(kgWeight * r);
        }
        totalSets++;
        return {
          id: s.id || `set_${Date.now()}_${idx}`,
          setNumber: s.setNumber || idx + 1,
          weight: w,
          weightUnit: unit,
          reps: r,
          rpe: s.rpe ? Number(s.rpe) : undefined,
          isWarmup: Boolean(s.isWarmup),
          isPersonalRecord: Boolean(s.isPersonalRecord),
        };
      });

      return {
        id: ex.id || `se_${Date.now()}`,
        exerciseId: ex.exerciseId || 'ex_custom',
        exerciseName: ex.exerciseName || ex.name || 'Custom Exercise',
        bodyPart: ex.bodyPart || 'other',
        target: ex.target || 'general',
        equipment: ex.equipment || 'other',
        notes: ex.notes || '',
        sets,
      };
    });

    const newSession: WorkoutSessionItem = {
      _id: id,
      id,
      userId: String(sessionData.userId),
      name: sessionData.name.trim(),
      status: 'completed',
      durationMinutes: durMins,
      weightUnit: unit,
      notes: sessionData.notes || '',
      exercises: formattedExercises,
      totalVolumeKg: totalVol,
      totalSetsCount: totalSets,
      timestamp,
      formattedDate: new Date(timestamp).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };

    this.localWorkoutSessions.unshift(newSession);
    return newSession;
  }

  public async deleteWorkoutSession(id: string, userId: string): Promise<boolean> {
    try {
      await supabase.from('workout_sessions').delete().eq('id', id).eq('user_id', userId);
    } catch {
      // Ignore if table not present
    }

    const prevLen = this.localWorkoutSessions.length;
    this.localWorkoutSessions = this.localWorkoutSessions.filter(
      (s) => !(s.id === id && s.userId === String(userId))
    );
    return this.localWorkoutSessions.length < prevLen;
  }

  /**
   * PURE EXERCISE PROGRESSIVE OVERLOAD TIMELINE (STRICT RULE)
   * Tracks an individual exercise over time across ALL past sessions,
   * completely decoupled from the session folder level.
   */
  public async getExerciseProgressionByUserId(userId: string, targetExercise?: string): Promise<ExerciseProgressionRecord[]> {
    // 1. Gather all session history
    const sessions = await this.getWorkoutSessionsByUserId(userId);
    // 2. Also gather standalone workout logs
    const legacyLogs = await this.getWorkoutsByUserId(userId);

    interface Occurrence {
      exerciseId: string;
      exerciseName: string;
      targetMuscle: string;
      sessionDate: string;
      sessionName: string;
      sessionId: string;
      topWeightKg: number;
      topWeightRaw: number;
      weightUnit: 'kg' | 'lbs';
      topReps: number;
      estimated1RMKg: number;
      volumeKg: number;
      workingSetsCount: number;
    }

    const exerciseMap = new Map<string, Occurrence[]>();

    // Process from structured workout sessions
    for (const session of sessions) {
      for (const ex of session.exercises) {
        const key = ex.exerciseName.trim().toLowerCase();
        if (targetExercise && !key.includes(targetExercise.trim().toLowerCase())) continue;

        const workingSets = ex.sets.filter((s: WorkoutSetData) => !s.isWarmup);
        const validSets = workingSets.length > 0 ? workingSets : ex.sets;
        if (validSets.length === 0) continue;

        let topWeightKg = 0;
        let topWeightRaw = 0;
        let topReps = 8;
        let topUnit: 'kg' | 'lbs' = 'kg';
        let volumeKg = 0;

        for (const s of validSets) {
          const w = Number(s.weight || 0);
          const r = Number(s.reps || 0);
          const isKg = s.weightUnit !== 'lbs';
          const setKg = isKg ? w : w * 0.45359237;

          volumeKg += Math.round(setKg * r);

          if (setKg > topWeightKg) {
            topWeightKg = Math.round(setKg * 10) / 10;
            topWeightRaw = w;
            topReps = r;
            topUnit = s.weightUnit || 'kg';
          }
        }

        // Brzycki 1RM formula: Weight * (36 / (37 - min(reps, 36)))
        const est1RM = topReps > 1 && topReps < 37
          ? Math.round((topWeightKg * (36.0 / (37.0 - Math.min(topReps, 36)))) * 10) / 10
          : topWeightKg;

        const occ: Occurrence = {
          exerciseId: ex.exerciseId,
          exerciseName: ex.exerciseName,
          targetMuscle: ex.target || ex.bodyPart || 'General',
          sessionDate: session.timestamp,
          sessionName: session.name,
          sessionId: session.id,
          topWeightKg,
          topWeightRaw,
          weightUnit: topUnit,
          topReps,
          estimated1RMKg: est1RM,
          volumeKg,
          workingSetsCount: validSets.length,
        };

        if (!exerciseMap.has(key)) exerciseMap.set(key, []);
        exerciseMap.get(key)!.push(occ);
      }
    }

    // Process from standalone logs
    for (const log of legacyLogs) {
      const key = log.exerciseName.trim().toLowerCase();
      if (targetExercise && !key.includes(targetExercise.trim().toLowerCase())) continue;

      const existingOccs = exerciseMap.get(key) || [];
      const sameDay = existingOccs.some(
        (o) => new Date(o.sessionDate).toDateString() === new Date(log.timestamp).toDateString()
      );

      if (!sameDay) {
        const topWeightKg = log.weightLiftedKg;
        const est1RM = log.calculated1RM || topWeightKg;
        const occ: Occurrence = {
          exerciseId: `ex_${key.replace(/\s+/g, '_')}`,
          exerciseName: log.exerciseName,
          targetMuscle: 'General',
          sessionDate: log.timestamp,
          sessionName: log.notes ? log.notes.split('•')[0].trim() : 'Logged Training',
          sessionId: log.id,
          topWeightKg,
          topWeightRaw: topWeightKg,
          weightUnit: 'kg',
          topReps: log.reps,
          estimated1RMKg: est1RM,
          volumeKg: log.totalVolumeKg || Math.round(topWeightKg * log.reps * log.sets),
          workingSetsCount: log.sets,
        };

        if (!exerciseMap.has(key)) exerciseMap.set(key, []);
        exerciseMap.get(key)!.push(occ);
      }
    }

    const progressionRecords: ExerciseProgressionRecord[] = [];

    for (const [, occurrences] of exerciseMap.entries()) {
      if (occurrences.length === 0) continue;

      // Sort chronological: oldest to newest
      occurrences.sort(
        (a, b) => new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime()
      );

      let runningMaxWeight = 0;
      let allTimeMaxWeight = 0;
      let allTimeEstimated1RM = 0;
      let lifetimeVolume = 0;

      const timeline: ExerciseProgressionTimelinePoint[] = occurrences.map((occ) => {
        const isPR = occ.topWeightKg > runningMaxWeight;
        if (isPR) {
          runningMaxWeight = occ.topWeightKg;
        }

        if (occ.topWeightKg > allTimeMaxWeight) allTimeMaxWeight = occ.topWeightKg;
        if (occ.estimated1RMKg > allTimeEstimated1RM) allTimeEstimated1RM = occ.estimated1RMKg;
        lifetimeVolume += occ.volumeKg;

        return {
          date: occ.sessionDate,
          sessionName: occ.sessionName,
          sessionId: occ.sessionId,
          topWeightKg: occ.topWeightKg,
          topWeightRaw: occ.topWeightRaw,
          weightUnit: occ.weightUnit,
          topReps: occ.topReps,
          estimated1RMKg: occ.estimated1RMKg,
          totalVolumeKg: occ.volumeKg,
          workingSetsCount: occ.workingSetsCount,
          isPersonalRecord: isPR,
        };
      });

      const lastOccurrence = occurrences[occurrences.length - 1];
      const nextTargetWeight = Math.round((lastOccurrence.topWeightKg + 2.5) * 2) / 2;

      progressionRecords.push({
        exerciseId: lastOccurrence.exerciseId,
        exerciseName: lastOccurrence.exerciseName,
        targetMuscle: lastOccurrence.targetMuscle,
        allTimeMaxWeightKg: allTimeMaxWeight,
        allTimeEstimated1RMKg: allTimeEstimated1RM,
        totalLifetimeVolumeKg: lifetimeVolume,
        totalSessionsCount: occurrences.length,
        lastSessionDate: lastOccurrence.sessionDate,
        nextTargetWeightKg: nextTargetWeight,
        nextTargetReps: lastOccurrence.topReps,
        progressionTimeline: timeline.reverse(), // Reverse so newest appears first
      });
    }

    return progressionRecords.sort(
      (a, b) => new Date(b.lastSessionDate).getTime() - new Date(a.lastSessionDate).getTime()
    );
  }

  // ==========================================
  // MEAL OPERATIONS (Direct to Supabase 'meal_logs')
  // ==========================================

  public async getMealsByUserId(userId: string): Promise<IMealLog[]> {
    const queryUserId = !isNaN(Number(userId)) ? Number(userId) : userId;
    const { data, error } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', queryUserId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Supabase] getMealsByUserId error:', error.message);
      throw new Error(`Supabase query error: ${error.message}`);
    }

    return (data || []).map((r) => this.mapSupabaseMeal(r));
  }

  public async createMeal(mealData: Omit<IMealLog, '_id' | 'id'>): Promise<IMealLog> {
    const queryUserId = !isNaN(Number(mealData.userId)) ? Number(mealData.userId) : mealData.userId;

    const { data, error } = await supabase
      .from('meal_logs')
      .insert({
        user_id: queryUserId,
        food_name: mealData.mealName,
        calories: Number(mealData.calories),
        protein: Number(mealData.proteinGrams),
        fiber: Number(mealData.fiberGrams || 0),
        carbs: Number(mealData.carbsGrams),
        fats: Number(mealData.fatsGrams),
        created_at: mealData.timestamp || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[Supabase] Meal insert error into Supabase meal_logs:', error.message);
      throw new Error(`Supabase meal insert error: ${error.message}`);
    }

    if (data) {
      const mapped = this.mapSupabaseMeal(data);
      console.log(`[Supabase] Persisted meal '${mapped.mealName}' directly into Supabase meal_logs (ID: ${mapped.id}).`);
      return mapped;
    }

    throw new Error('Failed to persist meal in Supabase.');
  }

  public async deleteMeal(id: string, userId: string): Promise<boolean> {
    try {
      const queryId = !isNaN(Number(id)) ? Number(id) : id;
      const queryUserId = !isNaN(Number(userId)) ? Number(userId) : userId;
      const { error } = await supabase
        .from('meal_logs')
        .delete()
        .eq('id', queryId)
        .eq('user_id', queryUserId);
      if (!error) {
        this.localMeals = this.localMeals.filter((m) => m.id !== id && m._id !== id);
        return true;
      }
    } catch (err: any) {
      console.warn('[Supabase] deleteMeal error:', err.message);
    }

    const initialLen = this.localMeals.length;
    this.localMeals = this.localMeals.filter((m) => !(m.id === id && m.userId === userId));
    return this.localMeals.length < initialLen;
  }

  public async getAllMeals(): Promise<IMealLog[]> {
    try {
      const { data, error } = await supabase.from('meal_logs').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        this.localMeals = data.map((r) => this.mapSupabaseMeal(r));
        return [...this.localMeals];
      }
    } catch {
      // Fallback
    }
    return [...this.localMeals];
  }

  // ==========================================
  // FOOD DATABASE & ANNOUNCEMENTS
  // ==========================================

  public getFoodItems(query?: string, category?: string): IFoodItem[] {
    let results = [...this.foodDatabase];
    if (query) {
      const q = query.toLowerCase().trim();
      results = results.filter((f) => f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q));
    }
    if (category && category !== 'all') {
      results = results.filter((f) => f.category.toLowerCase() === category.toLowerCase());
    }
    return results;
  }

  public getFoodById(id: string): IFoodItem | undefined {
    return this.foodDatabase.find((f) => f._id === id || f.id === id);
  }

  public addFoodItem(itemData: Omit<IFoodItem, '_id' | 'id' | 'createdAt'>): IFoodItem {
    const id = `food_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newItem: IFoodItem = {
      _id: id,
      id,
      ...itemData,
      createdAt: new Date().toISOString(),
    };
    this.foodDatabase.push(newItem);
    return newItem;
  }

  public updateFoodItem(id: string, updates: Partial<IFoodItem>): IFoodItem | undefined {
    const index = this.foodDatabase.findIndex((f) => f._id === id || f.id === id);
    if (index === -1) return undefined;
    this.foodDatabase[index] = {
      ...this.foodDatabase[index],
      ...updates,
    };
    return this.foodDatabase[index];
  }

  public deleteFoodItem(id: string): boolean {
    const initialLen = this.foodDatabase.length;
    this.foodDatabase = this.foodDatabase.filter((f) => f._id !== id && f.id !== id);
    return this.foodDatabase.length < initialLen;
  }

  public getAnnouncements(onlyActive: boolean = true): ISystemAnnouncement[] {
    if (onlyActive) {
      return this.announcements
        .filter((a) => a.active)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return [...this.announcements].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getAnnouncementsForUser(userId?: string, onlyActive: boolean = true): ISystemAnnouncement[] {
    const all = onlyActive ? this.announcements.filter((a) => a.active) : [...this.announcements];

    return all
      .filter((a) => {
        // Global broadcast: visible to all users and guests
        if (!a.targetType || a.targetType === 'all') {
          return true;
        }

        // Targeted notification: requires authenticated userId matching targetUserIds
        if (a.targetType === 'specific') {
          if (!userId) return false;
          const targetIds = Array.isArray(a.targetUserIds) ? a.targetUserIds.map((id) => String(id)) : [];
          return targetIds.includes(String(userId));
        }

        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public createAnnouncement(data: Omit<ISystemAnnouncement, '_id' | 'id' | 'createdAt'>): ISystemAnnouncement {
    const id = `anc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newAnc: ISystemAnnouncement = {
      _id: id,
      id,
      title: data.title,
      message: data.message,
      priority: data.priority,
      targetType: data.targetType || 'all',
      targetUserIds: data.targetUserIds || [],
      targetUserEmails: data.targetUserEmails || [],
      createdByEmail: data.createdByEmail,
      active: data.active !== false,
      createdAt: new Date().toISOString(),
    };
    this.announcements.push(newAnc);
    return newAnc;
  }

  public deleteAnnouncement(id: string): boolean {
    const initialLen = this.announcements.length;
    this.announcements = this.announcements.filter((a) => a._id !== id && a.id !== id);
    return this.announcements.length < initialLen;
  }
}

export const db = new LiftItDatabase();
