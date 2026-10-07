export type UserRole = 'guest' | 'registered' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isFlagged?: boolean;
  flagReason?: string;
  createdAt: string;
  profile?: {
    heightCm?: number;
    weightKg?: number;
    activityLevel?: string;
    targetCalorieGoal?: number;
    targetProteinGoal?: number;
  };
}

export interface WorkoutItem {
  _id: string;
  id: string;
  userId: string;
  exerciseName: string;
  exerciseId?: string;
  isCustomExercise?: boolean;
  sets: number;
  reps: number;
  weightLiftedKg: number;
  durationMinutes: number;
  notes?: string;
  rpe?: number;
  calculated1RM?: number;
  totalVolumeKg?: number;
  timestamp: string;
  isPersonalRecord?: boolean;
  formattedDate?: string;
  workCapacityScore?: number;
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
  isCustom?: boolean;
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
  isCustomExercise?: boolean;
  allTimeMaxWeightKg: number;
  allTimeEstimated1RMKg: number;
  totalLifetimeVolumeKg: number;
  totalSessionsCount: number;
  streakCount?: number;
  overloadStreakCount?: number;
  lastSessionDate: string;
  nextTargetWeightKg: number;
  nextTargetReps: number;
  progressionTimeline: ExerciseProgressionTimelinePoint[];
}

export interface ProgressiveChallenge {
  exerciseName: string;
  exerciseId?: string;
  isCustomExercise?: boolean;
  currentEstimated1RM: number;
  lastWeightKg: number;
  lastReps: number;
  targetWeightKg: number;
  targetReps: number;
  progressionType: 'weight_increase' | 'rep_overload' | 'volume_density';
  progressionReason: string;
  recommendedSets: number;
  targetRestSeconds: number;
  allTimeMaxWeightKg?: number;
  isPersonalRecord?: boolean;
  streakCount?: number;
  overloadStreakCount?: number;
}

export interface MealItem {
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
  formattedDate?: string;
  formattedTime?: string;
  macroRatio?: {
    protein: number;
    carbs: number;
    fats: number;
  };
}

export interface FoodItem {
  _id: string;
  id: string;
  name: string;
  category: string;
  servingSize: string;
  calories: number;
  proteinGrams?: number;
  fiberGrams?: number;
  carbsGrams?: number;
  fatsGrams?: number;
  sodiumMg?: number;
  potassiumMg?: number;
  publicNotes?: string;
  accessTier?: string;
}

export interface Announcement {
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

export interface DailyNutritionSummary {
  date: string;
  totals: {
    calories: number;
    proteinGrams: number;
    fiberGrams: number;
    carbsGrams: number;
    fatsGrams: number;
  };
  targets: {
    calories: number;
    proteinGrams: number;
  };
  progress: {
    caloriePercent: number;
    proteinPercent: number;
  };
  macroPercentages: {
    protein: number;
    carbs: number;
    fats: number;
  };
  loggedMealsCount: number;
}
