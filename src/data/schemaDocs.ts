export const SUPABASE_SQL_SETUP = `
-- ===============================================================
-- LIFT IT PLATFORM: COMPLETE SUPABASE POSTGRESQL SCHEMA
-- Paste and execute this in your Supabase Project -> SQL Editor
-- ===============================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'registered' CHECK (role IN ('guest', 'registered', 'admin')),
  is_flagged BOOLEAN DEFAULT FALSE,
  flag_reason TEXT DEFAULT '',
  profile JSONB DEFAULT '{"heightCm": 175, "weightKg": 75, "activityLevel": "moderate", "targetCalorieGoal": 2400, "targetProteinGoal": 150}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index on email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. WORKOUTS TABLE
CREATE TABLE IF NOT EXISTS workouts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  sets INTEGER NOT NULL DEFAULT 3,
  reps INTEGER NOT NULL DEFAULT 8,
  weight_lifted_kg NUMERIC(6,2) NOT NULL DEFAULT 0,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  notes TEXT DEFAULT '',
  rpe NUMERIC(3,1) DEFAULT 8.0,
  calculated_1rm NUMERIC(6,2),
  total_volume_kg NUMERIC(8,2),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workouts_user_time ON workouts(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_workouts_exercise ON workouts(user_id, exercise_name);

-- 3. MEALS TABLE
CREATE TABLE IF NOT EXISTS meals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  meal_name TEXT NOT NULL,
  meal_type TEXT NOT NULL DEFAULT 'lunch' CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  calories INTEGER NOT NULL DEFAULT 0,
  protein_grams NUMERIC(6,2) NOT NULL DEFAULT 0,
  fiber_grams NUMERIC(6,2) NOT NULL DEFAULT 0,
  carbs_grams NUMERIC(6,2) NOT NULL DEFAULT 0,
  fats_grams NUMERIC(6,2) NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meals_user_time ON meals(user_id, timestamp DESC);

-- 4. FOOD DATABASE TABLE
CREATE TABLE IF NOT EXISTS food_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('protein', 'carbs', 'fats', 'dairy', 'vegetable', 'fruit', 'beverage', 'snack')),
  serving_size TEXT NOT NULL,
  calories INTEGER NOT NULL DEFAULT 0,
  protein_grams NUMERIC(6,2) NOT NULL DEFAULT 0,
  fiber_grams NUMERIC(6,2) NOT NULL DEFAULT 0,
  carbs_grams NUMERIC(6,2) NOT NULL DEFAULT 0,
  fats_grams NUMERIC(6,2) NOT NULL DEFAULT 0,
  sodium_mg INTEGER DEFAULT 0,
  potassium_mg INTEGER DEFAULT 0,
  public_notes TEXT DEFAULT '',
  is_custom BOOLEAN DEFAULT FALSE,
  created_by_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_food_name ON food_items(name);

-- 5. ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_by_email TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. DISABLE RLS OR ENABLE OPEN POLICIES FOR BACKEND SERVICE ACCESS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE workouts DISABLE ROW LEVEL SECURITY;
ALTER TABLE meals DISABLE ROW LEVEL SECURITY;
ALTER TABLE food_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE announcements DISABLE ROW LEVEL SECURITY;
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
  exerciseName: string; // User-typed custom exercise name or library movement
  exerciseId?: string; // Optional string identifier (does not strictly require a library ID)
  isCustomExercise?: boolean; // Flag if exercise is custom user-defined
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
    exerciseId: { type: String, required: false, trim: true },
    isCustomExercise: { type: Boolean, default: false, index: true },
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
  targetType: 'all' | 'specific';
  targetUserIds: string[];
  targetUserEmails?: string[];
  createdByEmail: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema = new Schema<IAnnouncementDocument>(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
    targetType: { type: String, enum: ['all', 'specific'], default: 'all', index: true },
    targetUserIds: { type: [String], default: [], index: true },
    targetUserEmails: { type: [String], default: [] },
    createdByEmail: { type: String, required: true },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

AnnouncementSchema.index({ active: 1, createdAt: -1 });
AnnouncementSchema.index({ targetType: 1, active: 1 });

export const SystemAnnouncement = mongoose.model<IAnnouncementDocument>('SystemAnnouncement', AnnouncementSchema);
`;
