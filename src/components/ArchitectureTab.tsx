import React, { useState } from 'react';
import { Database, Layers, Shield, FileText, Check, Copy, Code2, Server } from 'lucide-react';
import {
  UserMongooseSchemaString,
  WorkoutLogMongooseSchemaString,
  MealLogMongooseSchemaString,
  FoodDatabaseMongooseSchemaString,
  AnnouncementMongooseSchemaString,
  SUPABASE_SQL_SETUP,
} from '../data/schemaDocs';

export const ArchitectureTab: React.FC = () => {
  const [activeSchema, setActiveSchema] = useState<'supabase' | 'user' | 'workout' | 'meal' | 'food' | 'announcement'>('supabase');
  const [copied, setCopied] = useState(false);

  const schemas: Record<string, { title: string; code: string; desc: string }> = {
    supabase: {
      title: 'Supabase PostgreSQL Schema (schema.sql)',
      code: SUPABASE_SQL_SETUP.trim(),
      desc: 'Complete PostgreSQL DDL for users, workout_logs, meal_logs, food_items, and announcements in Supabase with RLS.',
    },
    user: {
      title: 'User.model.ts (Mongoose / MongoDB Schema)',
      code: UserMongooseSchemaString.trim(),
      desc: 'Role-Based Access Control (RBAC), bcrypt pre-save password hashing hook, profile goals, and indexing.',
    },
    workout: {
      title: 'WorkoutLog.model.ts (Mongoose / MongoDB Schema)',
      code: WorkoutLogMongooseSchemaString.trim(),
      desc: 'Biomechanical metrics, Brzycki 1RM automated calculation hook, total volume indexing, and chronological queries.',
    },
    meal: {
      title: 'MealLog.model.ts (Mongoose / MongoDB Schema)',
      code: MealLogMongooseSchemaString.trim(),
      desc: 'Macronutrient breakdown (calories, protein, carbs, fats, fiber), meal categories, and user aggregation indexes.',
    },
    food: {
      title: 'FoodDatabase.model.ts (Mongoose / MongoDB Schema)',
      code: FoodDatabaseMongooseSchemaString.trim(),
      desc: 'Master nutritional database with tiered field projections: public calories for guests vs deep macro profile for registered users.',
    },
    announcement: {
      title: 'Announcement.model.ts (Mongoose / MongoDB Schema)',
      code: AnnouncementMongooseSchemaString.trim(),
      desc: 'System updates and administrative broadcast messaging with priority levels.',
    },
  };

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 mb-2">
          <Database className="w-3.5 h-3.5" />
          SYSTEM DESIGN &amp; DATABASE ARCHITECTURE
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          Backend Architecture &amp; Schemas
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Complete production deliverables: Mongoose schemas, RBAC middleware pipeline, API routing layout, and directory structure.
        </p>
      </div>

      {/* RBAC Architecture Visual Diagram */}
      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-orange-400" />
          Role-Based Access Control (RBAC) Pipeline
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Guest Tier */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-amber-500/30 relative">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-amber-400">1. Guest Tier</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">Public</span>
            </div>
            <p className="text-zinc-400 text-[11px] mb-3">
              Unauthenticated access without JWT credentials.
            </p>
            <ul className="space-y-1.5 text-zinc-300">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                POST /api/calculator/bmi (BMI Logic)
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                GET /api/food (Basic calories only)
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                GET /api/info (Platform history &amp; vision)
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                POST /api/auth/signup &amp; /login
              </li>
            </ul>
          </div>

          {/* Registered Athlete Tier */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-emerald-500/30 relative">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-emerald-400">2. Registered Athlete</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">verifyToken</span>
            </div>
            <p className="text-zinc-400 text-[11px] mb-3">
              Requires valid Bearer JWT + 'registered' or 'admin' role.
            </p>
            <ul className="space-y-1.5 text-zinc-300">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                POST &amp; GET /api/workouts
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                GET /api/workouts/progressive-challenge
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                GET /api/workouts/history (1RM Pop-ups)
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                POST &amp; GET /api/meals &amp; /summary
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Full Macronutrients Unlocked (P/C/F)
              </li>
            </ul>
          </div>

          {/* Admin Tier */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-rose-500/30 relative">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-rose-400">3. Platform Admin</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">verifyAdmin</span>
            </div>
            <p className="text-zinc-400 text-[11px] mb-3">
              Requires valid Bearer JWT + explicit 'admin' role check.
            </p>
            <ul className="space-y-1.5 text-zinc-300">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                GET &amp; PATCH &amp; DELETE /api/admin/users
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                POST /api/admin/announcements (Broadcast)
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                POST/PUT/DELETE /api/admin/food (CRUD)
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                GET /api/admin/stats (Telemetry)
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Database Schema Code Viewer */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Database Schema Designs (Mongoose)</h3>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveSchema('user')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                activeSchema === 'user' ? 'bg-orange-500 text-black' : 'bg-zinc-950 text-zinc-400 hover:text-white'
              }`}
            >
              User
            </button>
            <button
              onClick={() => setActiveSchema('workout')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                activeSchema === 'workout' ? 'bg-orange-500 text-black' : 'bg-zinc-950 text-zinc-400 hover:text-white'
              }`}
            >
              WorkoutLog
            </button>
            <button
              onClick={() => setActiveSchema('meal')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                activeSchema === 'meal' ? 'bg-orange-500 text-black' : 'bg-zinc-950 text-zinc-400 hover:text-white'
              }`}
            >
              MealLog
            </button>
            <button
              onClick={() => setActiveSchema('food')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                activeSchema === 'food' ? 'bg-orange-500 text-black' : 'bg-zinc-950 text-zinc-400 hover:text-white'
              }`}
            >
              FoodDatabase
            </button>
            <button
              onClick={() => setActiveSchema('announcement')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                activeSchema === 'announcement' ? 'bg-orange-500 text-black' : 'bg-zinc-950 text-zinc-400 hover:text-white'
              }`}
            >
              Announcement
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
          <span>{schemas[activeSchema].desc}</span>
          <button
            onClick={() => copyCode(schemas[activeSchema].code)}
            className="flex items-center gap-1 text-zinc-300 hover:text-white px-2 py-1 bg-zinc-800 rounded transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy Schema'}
          </button>
        </div>

        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 overflow-x-auto max-h-[500px]">
          <pre className="text-xs font-mono text-zinc-200 whitespace-pre">
            {schemas[activeSchema].code}
          </pre>
        </div>
      </div>

      {/* Scalable Directory Layout */}
      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl">
        <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
          <Layers className="w-4 h-4 text-orange-400" />
          Production Project Structure
        </h3>
        <p className="text-xs text-zinc-400 mb-4">
          Modular separation of concerns following enterprise Node.js Express conventions:
        </p>

        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-300 leading-relaxed overflow-x-auto">
          <pre>{`lift-it/
├── server.ts                       # Server entry point (Express + Vite Middlewares)
├── server/
│   ├── types/
│   │   └── index.ts                # TypeScript domain models (User, Workout, Meal, RBAC roles)
│   ├── models/
│   │   ├── User.model.ts           # Mongoose User Schema (bcrypt hooks, RBAC)
│   │   ├── WorkoutLog.model.ts     # Mongoose Workout Schema (Brzycki 1RM formula, volume)
│   │   ├── MealLog.model.ts        # Mongoose Meal Schema (P/C/F/Fiber macros)
│   │   ├── FoodDatabase.model.ts   # Mongoose Food Schema (Field projection tiers)
│   │   └── Announcement.model.ts   # Mongoose System Broadcast Schema
│   ├── middleware/
│   │   └── auth.ts                 # verifyToken, verifyAdmin, verifyRole, optionalAuth
│   ├── controllers/
│   │   ├── authController.ts       # signup, login, getMe, updateProfile
│   │   ├── workoutController.ts    # logWorkout, getHistory, getProgressiveChallenge
│   │   ├── mealController.ts       # logMeal, getMeals, getDailySummary
│   │   ├── foodController.ts       # getFoodItems (tier projected), getFoodById
│   │   ├── calculatorController.ts # calculateBmi (WHO categories, Mifflin BMR)
│   │   ├── adminController.ts      # user management, broadcast push, food DB CRUD
│   │   └── infoController.ts       # static website info & system notifications
│   ├── routes/
│   │   ├── authRoutes.ts           # /api/auth
│   │   ├── workoutRoutes.ts        # /api/workouts
│   │   ├── mealRoutes.ts           # /api/meals
│   │   ├── foodRoutes.ts           # /api/food
│   │   ├── calculatorRoutes.ts     # /api/calculator
│   │   ├── adminRoutes.ts          # /api/admin
│   │   └── infoRoutes.ts           # /api/info & /api/notifications
│   └── db/
│       └── database.ts             # Persistence engine & initial pre-seeded datasets
└── src/
    ├── App.tsx                     # Full-stack interactive platform UI
    ├── components/                 # Tab views & interactive modules
    └── services/api.ts             # Client API service with JWT management & live logger`}</pre>
        </div>
      </div>
    </div>
  );
};
