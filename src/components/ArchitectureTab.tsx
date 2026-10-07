import React, { useState, useMemo } from 'react';
import {
  Database,
  Layers,
  Shield,
  Check,
  Copy,
  Code2,
  Server,
  Folder,
  FolderOpen,
  FileCode,
  Terminal,
  Search,
  Lock,
  Unlock,
  Sparkles,
  Table,
  Workflow,
  Cpu,
  ArrowRight,
  HardDrive,
} from 'lucide-react';
import {
  UserMongooseSchemaString,
  WorkoutLogMongooseSchemaString,
  MealLogMongooseSchemaString,
  FoodDatabaseMongooseSchemaString,
  AnnouncementMongooseSchemaString,
  SUPABASE_SQL_SETUP,
} from '../data/schemaDocs';

interface FileTreeNode {
  name: string;
  type: 'file' | 'folder';
  description?: string;
  badge?: string;
  children?: FileTreeNode[];
}

export const ArchitectureTab: React.FC = () => {
  const [activeSchema, setActiveSchema] = useState<
    'supabase' | 'user' | 'workout' | 'meal' | 'food' | 'announcement'
  >('supabase');
  const [copied, setCopied] = useState(false);
  const [treeSearchQuery, setTreeSearchQuery] = useState('');
  const [activeTabSection, setActiveTabSection] = useState<'all' | 'schemas' | 'tree' | 'pipeline'>('all');

  // Exact Folder Tree reflecting current workspace
  const projectTree: FileTreeNode = {
    name: 'lift-it',
    type: 'folder',
    description: 'Root workspace repository',
    children: [
      {
        name: 'server.ts',
        type: 'file',
        description: 'Server entry point: Express app mounted with Vite development middlewares on port 3000',
        badge: 'Core Server',
      },
      {
        name: 'package.json',
        type: 'file',
        description: 'Package manifest with full-stack dependencies (Express, Supabase, bcryptjs, jsonwebtoken, React, Lucide)',
      },
      {
        name: 'tsconfig.json',
        type: 'file',
        description: 'TypeScript compiler configuration for strict type safety across client and server',
      },
      {
        name: 'vite.config.ts',
        type: 'file',
        description: 'Vite configuration for modern React SPA bundling and HMR handling',
      },
      {
        name: '.env.example',
        type: 'file',
        description: 'Environment variable template (SUPABASE_URL, SUPABASE_KEY, JWT_SECRET, PORT=3000)',
      },
      {
        name: 'scripts',
        type: 'folder',
        description: 'Automated data ingestion and ingestion tooling',
        children: [
          {
            name: 'bulk-import-foods.ts',
            type: 'file',
            description: 'Automated CLI script to import batches of verified nutritional items from Open Food Facts API into Supabase',
            badge: 'CLI Tool',
          },
          {
            name: 'import-exercisedb.ts',
            type: 'file',
            description: 'External utility script to ingest exercise movements and metadata from RapidAPI ExerciseDB',
            badge: 'CLI Tool',
          },
        ],
      },
      {
        name: 'server',
        type: 'folder',
        description: 'Backend Express REST API architecture with modular separation of concerns',
        badge: 'Backend Architecture',
        children: [
          {
            name: 'controllers',
            type: 'folder',
            description: 'Express route controllers executing business logic and data queries',
            children: [
              {
                name: 'authController.ts',
                type: 'file',
                description: 'User registration, login with bcrypt verification, authenticated session check (/api/auth/me), and profile updates',
              },
              {
                name: 'workoutController.ts',
                type: 'file',
                description: 'Workout logging, Brzycki 1RM computation, volume load tracking, and progressive challenge progression queries',
              },
              {
                name: 'mealController.ts',
                type: 'file',
                description: 'Daily nutritional ledger, meal logging, macro aggregations (P/C/F/Fiber), and chronological history queries',
              },
              {
                name: 'foodController.ts',
                type: 'file',
                description: 'Global nutritional database lookup, Open Food Facts proxy, and RBAC field projections (Guest calories-only vs Full macros)',
              },
              {
                name: 'calculatorController.ts',
                type: 'file',
                description: 'Public physiological engine: WHO BMI classification, Mifflin-St Jeor BMR, TDEE, and macronutrient targets',
              },
              {
                name: 'adminController.ts',
                type: 'file',
                description: 'Admin management: user moderation, system broadcast announcements, food DB management, and telemetry stats',
              },
              {
                name: 'infoController.ts',
                type: 'file',
                description: 'Public platform metadata endpoint (/api/info) delivering founding history, vision, and system goals',
              },
            ],
          },
          {
            name: 'routes',
            type: 'folder',
            description: 'Express REST endpoint router definitions',
            children: [
              { name: 'authRoutes.ts', type: 'file', description: 'Mounts /api/auth routes (signup, login, me, profile)' },
              { name: 'workoutRoutes.ts', type: 'file', description: 'Mounts /api/workouts routes (log, delete, history, progressive-challenge)' },
              { name: 'mealRoutes.ts', type: 'file', description: 'Mounts /api/meals routes (log, delete, history, summary)' },
              { name: 'foodRoutes.ts', type: 'file', description: 'Mounts /api/food routes (search, categories, /api/import-foods)' },
              { name: 'calculatorRoutes.ts', type: 'file', description: 'Mounts /api/calculator routes (public /bmi endpoint)' },
              { name: 'adminRoutes.ts', type: 'file', description: 'Mounts /api/admin routes (users, announcements, food CRUD, telemetry stats)' },
              { name: 'infoRoutes.ts', type: 'file', description: 'Mounts /api/info and /api/notifications public endpoints' },
            ],
          },
          {
            name: 'middleware',
            type: 'folder',
            description: 'Authentication and authorization middleware pipeline',
            children: [
              {
                name: 'auth.ts',
                type: 'file',
                description: 'JWT verification pipeline: requireAuth (authenticated users), requireAdmin (admin only), requireRole, and optionalAuth',
                badge: 'RBAC Pipeline',
              },
            ],
          },
          {
            name: 'db',
            type: 'folder',
            description: 'Database drivers, persistence layer, and seed caches',
            children: [
              {
                name: 'supabase.ts',
                type: 'file',
                description: 'Supabase client initialization (@supabase/supabase-js), connection config, and canonical PostgreSQL SQL DDL schema',
                badge: 'Primary DB',
              },
              {
                name: 'database.ts',
                type: 'file',
                description: 'Hybrid persistence engine: executes queries against Supabase PostgreSQL with resilient in-memory local fallback caches',
                badge: 'Persistence Engine',
              },
            ],
          },
          {
            name: 'models',
            type: 'folder',
            description: 'Mongoose / MongoDB object data modeling designs and TypeScript schemas',
            children: [
              { name: 'User.model.ts', type: 'file', description: 'User schema with RBAC enum, bcrypt pre-save hash hook, and biometric profile' },
              { name: 'WorkoutLog.model.ts', type: 'file', description: 'Workout log schema with Brzycki 1RM automated calculation and volume indexing' },
              { name: 'MealLog.model.ts', type: 'file', description: 'Meal log schema with macronutrient breakdown (P/C/F/Fiber) and category tags' },
              { name: 'FoodDatabase.model.ts', type: 'file', description: 'Nutritional food schema with tiered field projection and serving sizes' },
              { name: 'Announcement.model.ts', type: 'file', description: 'System announcement schema with priority levels and admin author metadata' },
            ],
          },
          {
            name: 'types',
            type: 'folder',
            description: 'Backend TypeScript domain interfaces and type definitions',
            children: [
              {
                name: 'index.ts',
                type: 'file',
                description: 'Type definitions: IUser, IWorkoutLog, IMealLog, IFoodItem, IAnnouncement, and UserRole',
              },
            ],
          },
        ],
      },
      {
        name: 'src',
        type: 'folder',
        description: 'Frontend React 18 SPA client application',
        badge: 'Client SPA',
        children: [
          {
            name: 'App.tsx',
            type: 'file',
            description: 'Main React component: tab navigation state, user authentication session state, and global announcements banner',
          },
          {
            name: 'main.tsx',
            type: 'file',
            description: 'Vite React application entry point mounting root DOM node',
          },
          {
            name: 'index.css',
            type: 'file',
            description: 'Global stylesheet importing Tailwind CSS with custom dark mode theme variables',
          },
          {
            name: 'types.ts',
            type: 'file',
            description: 'Frontend TypeScript contracts: User, WorkoutLog, MealItem, FoodItem, Announcement, and RBAC UserRole',
          },
          {
            name: 'components',
            type: 'folder',
            description: 'Modular React UI components for each feature and role tab',
            children: [
              {
                name: 'Navbar.tsx',
                type: 'file',
                description: 'Sticky header with live persona quick-switcher (Guest, Sarah Lifter, Marcus Admin) and announcement bell',
                badge: 'Persona Switcher',
              },
              {
                name: 'WorkoutTab.tsx',
                type: 'file',
                description: 'Workout logger: custom session title with presets, controllable live timer & manual duration, expandable history folders, and decoupled progressive overload',
                badge: 'Workout Engine',
              },
              {
                name: 'MealTab.tsx',
                type: 'file',
                description: 'Meal & macro architecture: food search autocomplete, portion scaling, guest calories-only RBAC lock, and daily macro ledger',
                badge: 'Macro Architecture',
              },
              {
                name: 'CalculatorTab.tsx',
                type: 'file',
                description: 'Public physiological engine: direct input boxes with dual-unit live conversion (kg/lbs, cm/ft-in), WHO BMI, BMR, and TDEE calculations',
                badge: 'Physiological Engine',
              },
              {
                name: 'AdminTab.tsx',
                type: 'file',
                description: 'Platform administration: user account management, system broadcasts, food database moderation, and telemetry metrics',
                badge: 'Admin Panel',
              },
              {
                name: 'ArchitectureTab.tsx',
                type: 'file',
                description: 'Full system architecture viewer: exact workspace project folder tree, RBAC pipeline, and database schemas',
                badge: 'Architecture Viewer',
              },
              {
                name: 'ApiTesterTab.tsx',
                type: 'file',
                description: 'Interactive API console: live REST endpoint testing, response viewer, and copyable cURL commands',
                badge: 'API Console',
              },
              {
                name: 'AuthModal.tsx',
                type: 'file',
                description: 'Authentication modal dialog: signup and sign-in tabs with validation feedback and demo credential pre-fills',
              },
            ],
          },
          {
            name: 'data',
            type: 'folder',
            description: 'Static reference schemas and documentation strings',
            children: [
              {
                name: 'schemaDocs.ts',
                type: 'file',
                description: 'Canonical SQL DDL setup script for Supabase PostgreSQL and Mongoose schema definitions',
              },
            ],
          },
          {
            name: 'services',
            type: 'folder',
            description: 'API client services and utilities',
            children: [
              {
                name: 'api.ts',
                type: 'file',
                description: 'Fetch HTTP client wrapper with automated JWT Bearer headers, token storage, and live request telemetry logging',
              },
            ],
          },
        ],
      },
    ],
  };

  const schemas: Record<string, { title: string; code: string; desc: string; badge: string; dbType: string }> = {
    supabase: {
      title: 'Supabase PostgreSQL Schema (schema.sql)',
      code: SUPABASE_SQL_SETUP.trim(),
      desc: 'Canonical PostgreSQL DDL deployed on Supabase. Defines tables (users, workouts, meals, food_items, announcements), foreign key cascades, check constraints, indexes, and RLS policies.',
      badge: 'Production Active',
      dbType: 'PostgreSQL 15 (Supabase)',
    },
    user: {
      title: 'User.model.ts (Mongoose / MongoDB Schema)',
      code: UserMongooseSchemaString.trim(),
      desc: 'Enterprise Mongoose User model with RBAC role enum (guest, registered, admin), bcrypt salt pre-save hashing hook, and nested biometric goals.',
      badge: 'Mongoose ODM',
      dbType: 'MongoDB / Mongoose',
    },
    workout: {
      title: 'WorkoutLog.model.ts (Mongoose / MongoDB Schema)',
      code: WorkoutLogMongooseSchemaString.trim(),
      desc: 'Workout log model with Brzycki 1RM automated calculation hook, total volume indexing (sets × reps × weight), and user timeline compound indexes.',
      badge: 'Mongoose ODM',
      dbType: 'MongoDB / Mongoose',
    },
    meal: {
      title: 'MealLog.model.ts (Mongoose / MongoDB Schema)',
      code: MealLogMongooseSchemaString.trim(),
      desc: 'Meal ledger schema with comprehensive macronutrient breakdowns (calories, protein, carbs, fats, fiber), meal category enums, and date indexing.',
      badge: 'Mongoose ODM',
      dbType: 'MongoDB / Mongoose',
    },
    food: {
      title: 'FoodDatabase.model.ts (Mongoose / MongoDB Schema)',
      code: FoodDatabaseMongooseSchemaString.trim(),
      desc: 'Global nutritional library schema supporting tiered field projection: basic energy (calories) for unauthenticated guests vs deep macronutrient profiles for registered users.',
      badge: 'Mongoose ODM',
      dbType: 'MongoDB / Mongoose',
    },
    announcement: {
      title: 'Announcement.model.ts (Mongoose / MongoDB Schema)',
      code: AnnouncementMongooseSchemaString.trim(),
      desc: 'System notifications and alerts schema supporting global broadcasts to all athletes or targeted delivery to specific users, with priority levels and active status filtering.',
      badge: 'Mongoose ODM',
      dbType: 'MongoDB / Mongoose',
    },
  };

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filter tree nodes recursively based on search term
  const filterNode = (node: FileTreeNode, query: string): FileTreeNode | null => {
    if (!query) return node;
    const lowerQuery = query.toLowerCase();
    const matchSelf =
      node.name.toLowerCase().includes(lowerQuery) ||
      (node.description && node.description.toLowerCase().includes(lowerQuery)) ||
      (node.badge && node.badge.toLowerCase().includes(lowerQuery));

    if (node.type === 'file') {
      return matchSelf ? node : null;
    }

    if (node.children) {
      const filteredChildren = node.children
        .map((child) => filterNode(child, query))
        .filter((child): child is FileTreeNode => child !== null);

      if (filteredChildren.length > 0 || matchSelf) {
        return {
          ...node,
          children: filteredChildren,
        };
      }
    }

    return null;
  };

  const filteredTree = useMemo(() => {
    return filterNode(projectTree, treeSearchQuery) || { ...projectTree, children: [] };
  }, [treeSearchQuery]);

  // Recursive Tree Renderer
  const renderTree = (node: FileTreeNode, depth = 0) => {
    const isFolder = node.type === 'folder';

    return (
      <div key={node.name} className="text-left">
        <div
          className={`flex items-start sm:items-center justify-between gap-3 py-1 px-2 rounded-lg transition hover:bg-zinc-800/50 group ${
            depth === 0 ? 'bg-zinc-900/60 font-bold border border-zinc-800 mb-1' : ''
          }`}
          style={{ paddingLeft: `${Math.max(8, depth * 20)}px` }}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {isFolder ? (
              <FolderOpen className="w-4 h-4 text-orange-400 shrink-0" />
            ) : (
              <FileCode className="w-3.5 h-3.5 text-zinc-400 shrink-0 group-hover:text-emerald-400 transition" />
            )}
            <span
              className={`font-mono text-xs truncate ${
                isFolder ? 'text-white font-bold' : 'text-zinc-300 group-hover:text-white'
              }`}
            >
              {node.name}
            </span>

            {node.badge && (
              <span className="hidden sm:inline-flex text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-orange-500/15 text-orange-400 border border-orange-500/30 shrink-0">
                {node.badge}
              </span>
            )}
          </div>

          {node.description && (
            <span className="text-[11px] text-zinc-500 group-hover:text-zinc-400 transition truncate max-w-[280px] sm:max-w-md hidden md:inline">
              {node.description}
            </span>
          )}
        </div>

        {isFolder && node.children && (
          <div className="border-l border-zinc-800/80 ml-3 sm:ml-4 pl-1">
            {node.children.map((child) => renderTree(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 mb-2">
          <Database className="w-3.5 h-3.5" />
          SYSTEM DESIGN • PRODUCTION SCHEMAS • WORKSPACE DIRECTORY
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
          <Layers className="w-7 h-7 text-orange-500" />
          Backend Architecture &amp; Database Schemas
        </h1>
        <p className="text-xs text-zinc-400 mt-1 max-w-3xl">
          Comprehensive production documentation: canonical Supabase PostgreSQL tables, Mongoose object data models, exact workspace directory structure, and the 3-tier Role-Based Access Control (RBAC) middleware pipeline.
        </p>
      </div>

      {/* Navigation Filter Buttons */}
      <div className="flex items-center gap-2 flex-wrap pb-2 border-b border-zinc-800">
        <button
          onClick={() => setActiveTabSection('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeTabSection === 'all'
              ? 'bg-orange-500 text-black shadow-md'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Workflow className="w-3.5 h-3.5" />
          Full Overview
        </button>
        <button
          onClick={() => setActiveTabSection('schemas')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeTabSection === 'schemas'
              ? 'bg-orange-500 text-black shadow-md'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          Database Schemas (SQL &amp; Mongoose)
        </button>
        <button
          onClick={() => setActiveTabSection('tree')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeTabSection === 'tree'
              ? 'bg-orange-500 text-black shadow-md'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Folder className="w-3.5 h-3.5" />
          Exact Workspace Tree
        </button>
        <button
          onClick={() => setActiveTabSection('pipeline')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeTabSection === 'pipeline'
              ? 'bg-orange-500 text-black shadow-md'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          RBAC Security Pipeline
        </button>
      </div>

      {/* Relational Entity Overview Cards */}
      {(activeTabSection === 'all' || activeTabSection === 'schemas') && (
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Table className="w-4 h-4 text-emerald-400" />
                Relational Database Entity Architecture (Supabase PostgreSQL)
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                5 Primary database entities with referential integrity, check constraints, and high-speed B-Tree indexes:
              </p>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <HardDrive className="w-3 h-3" /> Supabase Hosted
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
            {/* Users */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-white">users</span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                  Primary Entity
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-tight">
                Identity, bcrypt hash, role enum ('guest'|'registered'|'admin'), and profile JSONB.
              </p>
              <div className="text-[10px] font-mono text-zinc-500 pt-1 border-t border-zinc-900">
                idx_users_email (unique)
              </div>
            </div>

            {/* Workouts */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-orange-400">workouts</span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-400">
                  FK: users(id)
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-tight">
                Sets, reps, weight_lifted_kg, duration, Brzycki calculated_1rm, and total_volume_kg.
              </p>
              <div className="text-[10px] font-mono text-zinc-500 pt-1 border-t border-zinc-900">
                idx_workouts_user_time
              </div>
            </div>

            {/* Meals */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-emerald-400">meals</span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400">
                  FK: users(id)
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-tight">
                Meal categories (breakfast, lunch, dinner, snack), calories, protein, carbs, fats, fiber.
              </p>
              <div className="text-[10px] font-mono text-zinc-500 pt-1 border-t border-zinc-900">
                idx_meals_user_time
              </div>
            </div>

            {/* Food Items */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-amber-400">food_items</span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400">
                  Global Library
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-tight">
                Master nutritional registry with 100g baselines and Open Food Facts imports.
              </p>
              <div className="text-[10px] font-mono text-zinc-500 pt-1 border-t border-zinc-900">
                idx_food_name
              </div>
            </div>

            {/* Announcements */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-rose-400">announcements</span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400">
                  System Admin
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-tight">
                Global broadcasts with priority tags ('low', 'normal', 'high', 'urgent') and active flags.
              </p>
              <div className="text-[10px] font-mono text-zinc-500 pt-1 border-t border-zinc-900">
                created_at DESC
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Database Schema Code Viewer */}
      {(activeTabSection === 'all' || activeTabSection === 'schemas') && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-base font-bold text-white">Database Schema Definitions</h3>
                <p className="text-xs text-zinc-400">
                  Switch between PostgreSQL DDL (Supabase) and individual Mongoose Models (TypeScript)
                </p>
              </div>
            </div>

            {/* Schema Selector Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveSchema('supabase')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  activeSchema === 'supabase'
                    ? 'bg-emerald-500 text-black shadow-md font-extrabold'
                    : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                <Database className="w-3 h-3" />
                Supabase SQL (DDL)
              </button>
              <button
                type="button"
                onClick={() => setActiveSchema('user')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeSchema === 'user'
                    ? 'bg-orange-500 text-black font-bold shadow-md'
                    : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                User Model
              </button>
              <button
                type="button"
                onClick={() => setActiveSchema('workout')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeSchema === 'workout'
                    ? 'bg-orange-500 text-black font-bold shadow-md'
                    : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                WorkoutLog Model
              </button>
              <button
                type="button"
                onClick={() => setActiveSchema('meal')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeSchema === 'meal'
                    ? 'bg-orange-500 text-black font-bold shadow-md'
                    : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                MealLog Model
              </button>
              <button
                type="button"
                onClick={() => setActiveSchema('food')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeSchema === 'food'
                    ? 'bg-orange-500 text-black font-bold shadow-md'
                    : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                FoodDatabase Model
              </button>
              <button
                type="button"
                onClick={() => setActiveSchema('announcement')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeSchema === 'announcement'
                    ? 'bg-orange-500 text-black font-bold shadow-md'
                    : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                Announcement Model
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">{schemas[activeSchema].title}</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-zinc-800 text-orange-400 border border-zinc-700">
                  {schemas[activeSchema].dbType}
                </span>
              </div>
              <p className="text-zinc-400 text-[11px]">{schemas[activeSchema].desc}</p>
            </div>

            <button
              onClick={() => copyCode(schemas[activeSchema].code)}
              className="flex items-center gap-1.5 text-zinc-200 hover:text-white px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition font-semibold shrink-0 cursor-pointer text-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied to Clipboard!' : 'Copy Schema'}
            </button>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 overflow-x-auto max-h-[520px] shadow-inner">
            <pre className="text-xs font-mono text-zinc-200 whitespace-pre leading-relaxed">
              {schemas[activeSchema].code}
            </pre>
          </div>
        </div>
      )}

      {/* Exact Workspace Folder Tree */}
      {(activeTabSection === 'all' || activeTabSection === 'tree') && (
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-orange-400" />
                Exact Workspace Folder Tree
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Accurate file layout representing all production modules, controllers, routes, models, and UI components in the workspace:
              </p>
            </div>

            {/* Tree Search Box */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search file, folder or feature..."
                value={treeSearchQuery}
                onChange={(e) => setTreeSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 max-h-[600px] overflow-y-auto space-y-0.5 shadow-inner">
            {renderTree(filteredTree)}
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs text-zinc-500 pt-1">
            <span>Enterprise modular architecture: separation of concerns between Controllers, Routes, Services, and Views</span>
            <span>Files tracked: 35+ components and modules</span>
          </div>
        </div>
      )}

      {/* Role-Based Access Control (RBAC) Pipeline */}
      {(activeTabSection === 'all' || activeTabSection === 'pipeline') && (
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-orange-400" />
              Role-Based Access Control (RBAC) Pipeline &amp; Security Tiers
            </h3>
            <span className="text-xs text-zinc-400 font-mono">server/middleware/auth.ts</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Guest Tier */}
            <div className="p-4 rounded-xl bg-zinc-950 border border-amber-500/30 relative flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-amber-400 text-sm">1. Guest Tier</span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Public (Zero Auth)
                  </span>
                </div>
                <p className="text-zinc-400 text-[11px] mb-3 leading-relaxed">
                  Unauthenticated visitors accessing public endpoints without requiring Bearer JWT tokens.
                </p>
                <div className="space-y-2 text-zinc-300">
                  <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800">
                    <span className="font-mono text-amber-400 block font-bold">POST /api/calculator/bmi</span>
                    <span className="text-[11px] text-zinc-400">WHO BMI classification, Mifflin-St Jeor BMR, TDEE</span>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800">
                    <span className="font-mono text-amber-400 block font-bold">GET /api/food</span>
                    <span className="text-[11px] text-zinc-400">Basic food search &amp; calories only (P/C/F macros locked)</span>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800">
                    <span className="font-mono text-amber-400 block font-bold">GET /api/info</span>
                    <span className="text-[11px] text-zinc-400">Platform history, vision, and core engineering goals</span>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800">
                    <span className="font-mono text-amber-400 block font-bold">POST /api/auth/login &amp; signup</span>
                    <span className="text-[11px] text-zinc-400">Credential exchange issuing signed JWT token</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-900 text-[11px] text-amber-400/90 font-medium flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" /> Full macro logging &amp; workout history locked
              </div>
            </div>

            {/* Registered Athlete Tier */}
            <div className="p-4 rounded-xl bg-zinc-950 border border-emerald-500/30 relative flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-emerald-400 text-sm">2. Registered Athlete</span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    requireAuth
                  </span>
                </div>
                <p className="text-zinc-400 text-[11px] mb-3 leading-relaxed">
                  Requires valid Bearer JWT. Grants full personal workout tracking, progressive overload, and macro logging.
                </p>
                <div className="space-y-2 text-zinc-300">
                  <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800">
                    <span className="font-mono text-emerald-400 block font-bold">POST /api/workouts</span>
                    <span className="text-[11px] text-zinc-400">Log custom sessions, live timer duration, sets, reps, and 1RM</span>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800">
                    <span className="font-mono text-emerald-400 block font-bold">GET /api/workouts/history</span>
                    <span className="text-[11px] text-zinc-400">Expandable session folders &amp; decoupled progressive overload</span>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800">
                    <span className="font-mono text-emerald-400 block font-bold">POST /api/meals &amp; GET /summary</span>
                    <span className="text-[11px] text-zinc-400">Full P/C/F/Fiber macro breakdown and daily summary ledger</span>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800">
                    <span className="font-mono text-emerald-400 block font-bold">GET /api/auth/me</span>
                    <span className="text-[11px] text-zinc-400">Authenticated user profile &amp; personalized biometric targets</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-900 text-[11px] text-emerald-400/90 font-medium flex items-center gap-1">
                <Unlock className="w-3.5 h-3.5" /> Full macro logging &amp; progressive overload unlocked
              </div>
            </div>

            {/* Admin Tier */}
            <div className="p-4 rounded-xl bg-zinc-950 border border-rose-500/30 relative flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-rose-400 text-sm">3. Platform Admin</span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    requireAdmin
                  </span>
                </div>
                <p className="text-zinc-400 text-[11px] mb-3 leading-relaxed">
                  Requires valid Bearer JWT with verified 'admin' role. Grants platform moderation and administrative controls.
                </p>
                <div className="space-y-2 text-zinc-300">
                  <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800">
                    <span className="font-mono text-rose-400 block font-bold">GET &amp; PATCH /api/admin/users</span>
                    <span className="text-[11px] text-zinc-400">User account administration, account flagging, and role changes</span>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800">
                    <span className="font-mono text-rose-400 block font-bold">POST /api/admin/announcements</span>
                    <span className="text-[11px] text-zinc-400">Push system-wide broadcasts with priority alerts</span>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800">
                    <span className="font-mono text-rose-400 block font-bold">POST/PUT/DELETE /api/admin/food</span>
                    <span className="text-[11px] text-zinc-400">Direct curation &amp; moderation of the master food catalog</span>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800">
                    <span className="font-mono text-rose-400 block font-bold">GET /api/admin/stats</span>
                    <span className="text-[11px] text-zinc-400">Telemetry metrics: volume aggregations and account counts</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-900 text-[11px] text-rose-400/90 font-medium flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" /> Full administrative controls &amp; system telemetry
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Technology Stack Footer Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-center space-y-1">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block">Frontend Stack</span>
          <span className="text-sm font-bold text-white block">React 18 + Vite</span>
          <span className="text-[11px] text-zinc-500">Tailwind CSS + Lucide Icons</span>
        </div>
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-center space-y-1">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block">Backend Server</span>
          <span className="text-sm font-bold text-white block">Node.js Express + TS</span>
          <span className="text-[11px] text-zinc-500">tsx runtime on Port 3000</span>
        </div>
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-center space-y-1">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block">Database Engine</span>
          <span className="text-sm font-bold text-emerald-400 block">Supabase PostgreSQL</span>
          <span className="text-[11px] text-zinc-500">+ In-Memory Fallback Cache</span>
        </div>
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-center space-y-1">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block">Security &amp; Auth</span>
          <span className="text-sm font-bold text-orange-400 block">JWT + bcryptjs</span>
          <span className="text-[11px] text-zinc-500">3-Tier RBAC Middleware</span>
        </div>
      </div>
    </div>
  );
};
