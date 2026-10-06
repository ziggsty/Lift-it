import dotenv from 'dotenv';
dotenv.config();

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gscqhrruuuxkrgbaoajl.supabase.co';
export const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzY3FocnJ1dXV4a3JnYmFvYWpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwODE5NTUsImV4cCI6MjEwNjY1Nzk1NX0.k4fwjGWvLOkQQmPtDw7Gj5e3iGKXr9Dneunu_zzXtFk';
export const SUPABASE_ANON_KEY = SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('[Supabase] Warning: SUPABASE_URL or SUPABASE_KEY is missing from environment variables.');
}

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export const SUPABASE_CONFIG = {
  url: SUPABASE_URL,
  isConfigured: Boolean(SUPABASE_URL && SUPABASE_KEY),
};

/**
 * SQL Schema script for user to execute in Supabase SQL Editor
 * Creates all required tables, indexes, and sample seeds.
 */
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
