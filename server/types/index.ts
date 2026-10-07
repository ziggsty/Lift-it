export type UserRole = 'guest' | 'registered' | 'admin';

export interface IUser {
  _id: string;
  id: string; // compatibility alias
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isFlagged?: boolean;
  flagReason?: string;
  createdAt: string;
  updatedAt: string;
  profile?: {
    heightCm?: number;
    weightKg?: number;
    activityLevel?: string;
    targetCalorieGoal?: number;
    targetProteinGoal?: number;
  };
}

export interface IWorkoutLog {
  _id: string;
  id: string;
  userId: string;
  exerciseName: string;
  sets: number;
  reps: number;
  weightLiftedKg: number;
  durationMinutes: number; // time consumed
  notes?: string;
  rpe?: number; // Rate of Perceived Exertion 1-10
  calculated1RM?: number;
  totalVolumeKg?: number;
  timestamp: string; // ISO date string
}

export interface IMealLog {
  _id: string;
  id: string;
  userId: string;
  mealName: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  proteinGrams: number;
  fiberGrams: number;
  carbsGrams: number;
  fatsGrams: number;
  notes?: string;
  timestamp: string;
}

export interface IFoodItem {
  _id: string;
  id: string;
  name: string;
  category: 'protein' | 'carbs' | 'fats' | 'dairy' | 'vegetable' | 'fruit' | 'beverage' | 'snack';
  servingSize: string;
  calories: number;
  // Full macronutrient & micronutrient breakdown (protected for registered / admin users)
  proteinGrams: number;
  fiberGrams: number;
  carbsGrams: number;
  fatsGrams: number;
  sodiumMg?: number;
  potassiumMg?: number;
  publicNotes?: string;
  isCustom?: boolean;
  createdById?: string;
  createdAt: string;
}

export interface ISystemAnnouncement {
  _id: string;
  id: string;
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  targetType?: 'all' | 'specific';
  targetUserIds?: string[];
  targetUserEmails?: string[];
  createdByEmail: string;
  createdAt: string;
  active: boolean;
}

export interface IAuthTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
}

export interface IProgressiveChallenge {
  exerciseName: string;
  currentEstimated1RM: number;
  lastWeightKg: number;
  lastReps: number;
  targetWeightKg: number;
  targetReps: number;
  progressionType: 'weight_increase' | 'rep_overload' | 'volume_density';
  progressionReason: string;
  recommendedSets: number;
  targetRestSeconds: number;
}

export interface WorkoutSetData {
  id: string;
  setNumber: number;
  weight: number;
  weightUnit: 'kg' | 'lbs';
  reps: number;
  rpe?: number;
  isWarmup: boolean;
  isPersonalRecord?: boolean;
}

export interface SessionExerciseData {
  id?: string;
  exerciseId: string;
  exerciseName: string;
  bodyPart?: string;
  target?: string;
  equipment?: string;
  notes?: string;
  sets: WorkoutSetData[];
}

export interface WorkoutSessionItem {
  _id: string;
  id: string;
  userId: string;
  name: string;
  status: 'completed' | 'in_progress' | 'cancelled';
  durationMinutes: number;
  weightUnit: 'kg' | 'lbs';
  notes?: string;
  exercises: SessionExerciseData[];
  totalVolumeKg: number;
  totalSetsCount: number;
  timestamp: string;
  formattedDate?: string;
}

export interface ExerciseProgressionTimelinePoint {
  date: string;
  sessionName: string;
  sessionId: string;
  topWeightKg: number;
  topWeightRaw: number;
  weightUnit: 'kg' | 'lbs';
  topReps: number;
  estimated1RMKg: number;
  totalVolumeKg: number;
  workingSetsCount: number;
  isPersonalRecord?: boolean;
}

export interface ExerciseProgressionRecord {
  exerciseId: string;
  exerciseName: string;
  targetMuscle?: string;
  allTimeMaxWeightKg: number;
  allTimeEstimated1RMKg: number;
  totalLifetimeVolumeKg: number;
  totalSessionsCount: number;
  lastSessionDate: string;
  nextTargetWeightKg: number;
  nextTargetReps: number;
  progressionTimeline: ExerciseProgressionTimelinePoint[];
}
