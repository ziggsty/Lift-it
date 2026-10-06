export const SUPABASE_SQL_SETUP = `
-- ===============================================================
-- LIFT IT PLATFORM: COMPLETE SUPABASE POSTGRESQL SCHEMA
-- Paste and execute this in your Supabase Project -> SQL Editor
-- ===============================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'REGISTERED',
  flagged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index on email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. WORKOUT_LOGS TABLE
CREATE TABLE IF NOT EXISTS workout_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  reps INTEGER NOT NULL DEFAULT 8,
  weight NUMERIC(6,2) NOT NULL DEFAULT 0,
  duration INTEGER NOT NULL DEFAULT 45,
  rpe NUMERIC(3,1) DEFAULT 8.0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workout_logs_user_time ON workout_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workout_logs_exercise ON workout_logs(user_id, exercise_name);

-- 3. MEAL_LOGS TABLE
CREATE TABLE IF NOT EXISTS meal_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  calories INTEGER NOT NULL DEFAULT 0,
  protein NUMERIC(6,2) NOT NULL DEFAULT 0,
  fiber NUMERIC(6,2) NOT NULL DEFAULT 0,
  carbs NUMERIC(6,2) NOT NULL DEFAULT 0,
  fats NUMERIC(6,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meal_logs_user_time ON meal_logs(user_id, created_at DESC);

-- 4. FOOD DATABASE TABLE (OPTIONAL EXPANSION)
CREATE TABLE IF NOT EXISTS food_items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  serving_size TEXT NOT NULL,
  calories INTEGER NOT NULL DEFAULT 0,
  protein_grams NUMERIC(6,2) NOT NULL DEFAULT 0,
  fiber_grams NUMERIC(6,2) NOT NULL DEFAULT 0,
  carbs_grams NUMERIC(6,2) NOT NULL DEFAULT 0,
  fats_grams NUMERIC(6,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. DISABLE RLS FOR SERVER SERVICE ROLE / DIRECT API ACCESS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE meal_logs DISABLE ROW LEVEL SECURITY;
`;

export const UserMongooseSchemaString = `
import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUserDocument extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'guest' | 'registered' | 'admin';
  isFlagged: boolean;
  flagReason?: string;
  profile: {
    heightCm?: number;
    weightKg?: number;
    activityLevel?: 'sedentary' | 'moderate' | 'active' | 'athlete';
    targetCalorieGoal?: number;
    targetProteinGoal?: number;
  };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address'],
      index: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ['guest', 'registered', 'admin'],
      default: 'registered',
      index: true,
    },
    isFlagged: { type: Boolean, default: false },
    flagReason: { type: String, default: '' },
    profile: {
      heightCm: { type: Number, default: 175 },
      weightKg: { type: Number, default: 75 },
      activityLevel: {
        type: String,
        enum: ['sedentary', 'moderate', 'active', 'athlete'],
        default: 'moderate',
      },
      targetCalorieGoal: { type: Number, default: 2400 },
      targetProteinGoal: { type: Number, default: 150 },
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook: Hash password with bcrypt before persisting
UserSchema.pre<IUserDocument>('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

export const User = mongoose.model<IUserDocument>('User', UserSchema);
`;

export const WorkoutLogMongooseSchemaString = `
import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkoutDocument extends Document {
  userId: mongoose.Types.ObjectId;
  exerciseName: string;
  sets: number;
  reps: number;
  weightLiftedKg: number;
  durationMinutes: number;
  notes?: string;
  rpe?: number;
  calculated1RM?: number;
  totalVolumeKg?: number;
  timestamp: Date;
}

const WorkoutLogSchema = new Schema<IWorkoutDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    exerciseName: { type: String, required: true, trim: true, index: true },
    sets: { type: Number, required: true, min: 1, default: 3 },
    reps: { type: Number, required: true, min: 1 },
    weightLiftedKg: { type: Number, required: true, min: 0 },
    durationMinutes: { type: Number, required: true, min: 1 },
    notes: { type: String, default: '' },
    rpe: { type: Number, min: 1, max: 10, default: 8 },
    calculated1RM: { type: Number },
    totalVolumeKg: { type: Number },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

// Pre-save hook: Compute 1-Rep Max (Brzycki formula) and total workload volume
WorkoutLogSchema.pre<IWorkoutDocument>('save', function (next) {
  this.totalVolumeKg = this.sets * this.reps * this.weightLiftedKg;
  if (this.reps === 1) {
    this.calculated1RM = this.weightLiftedKg;
  } else if (this.reps < 37) {
    this.calculated1RM = Math.round((this.weightLiftedKg / (1.0278 - 0.0278 * this.reps)) * 10) / 10;
  } else {
    this.calculated1RM = this.weightLiftedKg;
  }
  next();
});

export const WorkoutLog = mongoose.model<IWorkoutDocument>('WorkoutLog', WorkoutLogSchema);
`;

export const MealLogMongooseSchemaString = `
import mongoose, { Schema, Document } from 'mongoose';

export interface IMealDocument extends Document {
  userId: mongoose.Types.ObjectId;
  mealName: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  proteinGrams: number;
  fiberGrams: number;
  carbsGrams: number;
  fatsGrams: number;
  notes?: string;
  timestamp: Date;
}

const MealLogSchema = new Schema<IMealDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    mealName: { type: String, required: true, trim: true },
    mealType: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'snack'],
      required: true,
      default: 'lunch',
    },
    calories: { type: Number, required: true, min: 0 },
    proteinGrams: { type: Number, required: true, min: 0 },
    fiberGrams: { type: Number, default: 0, min: 0 },
    carbsGrams: { type: Number, required: true, min: 0 },
    fatsGrams: { type: Number, required: true, min: 0 },
    notes: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

export const MealLog = mongoose.model<IMealDocument>('MealLog', MealLogSchema);
`;

export const FoodDatabaseMongooseSchemaString = `
import mongoose, { Schema, Document } from 'mongoose';

export interface IFoodItemDocument extends Document {
  name: string;
  category: 'protein' | 'carbs' | 'fats' | 'dairy' | 'vegetable' | 'fruit' | 'beverage' | 'snack';
  servingSize: string;
  calories: number;
  proteinGrams: number;
  fiberGrams: number;
  carbsGrams: number;
  fatsGrams: number;
  isCustom: boolean;
}

const FoodDatabaseSchema = new Schema<IFoodItemDocument>(
  {
    name: { type: String, required: true, trim: true, index: true },
    category: { type: String, required: true },
    servingSize: { type: String, required: true },
    calories: { type: Number, required: true },
    proteinGrams: { type: Number, required: true },
    fiberGrams: { type: Number, default: 0 },
    carbsGrams: { type: Number, required: true },
    fatsGrams: { type: Number, required: true },
    isCustom: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const FoodDatabase = mongoose.model<IFoodItemDocument>('FoodDatabase', FoodDatabaseSchema);
`;

export const AnnouncementMongooseSchemaString = `
import mongoose, { Schema, Document } from 'mongoose';

export interface IAnnouncementDocument extends Document {
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createdByEmail: string;
  active: boolean;
}

const AnnouncementSchema = new Schema<IAnnouncementDocument>(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
    createdByEmail: { type: String, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const SystemAnnouncement = mongoose.model<IAnnouncementDocument>('SystemAnnouncement', AnnouncementSchema);
`;
