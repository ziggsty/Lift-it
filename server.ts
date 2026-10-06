import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase configuration handled using dotenv with user provided credentials as default
export const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gscqhrruuuxkrgbaoajl.supabase.co';
export const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzY3FocnJ1dXV4a3JnYmFvYWpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwODE5NTUsImV4cCI6MjEwNjY1Nzk1NX0.k4fwjGWvLOkQQmPtDw7Gj5e3iGKXr9Dneunu_zzXtFk';
export const SUPABASE_ANON_KEY = SUPABASE_KEY;

// Initialize @supabase/supabase-js client
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

import authRoutes from './server/routes/authRoutes';
import workoutRoutes from './server/routes/workoutRoutes';
import mealRoutes from './server/routes/mealRoutes';
import foodRoutes from './server/routes/foodRoutes';
import { foodController } from './server/controllers/foodController';
import calculatorRoutes from './server/routes/calculatorRoutes';
import adminRoutes from './server/routes/adminRoutes';
import infoRoutes from './server/routes/infoRoutes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  console.log(`[Supabase] Initialized @supabase/supabase-js client for: ${SUPABASE_URL}`);

  // Test Supabase connectivity on startup
  try {
    const { count, error } = await supabase.from('users').select('*', { count: 'exact', head: true });
    if (!error) {
      console.log(`[Supabase] Successfully connected to PostgreSQL! Found ${count ?? 0} active athlete record(s).`);
    } else {
      console.warn('[Supabase] Startup ping notification:', error.message);
    }
  } catch (err: any) {
    console.warn('[Supabase] Initial connection notice:', err.message);
  }

  // Core Express Middlewares
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Basic API request logger
  app.use((req: Request, _res: Response, next: NextFunction) => {
    if (req.url.startsWith('/api')) {
      const authSnippet = req.headers.authorization ? ' (Authenticated)' : ' (Guest)';
      console.log(`[API ${req.method}] ${req.url}${authSnippet}`);
    }
    next();
  });

  // Mount API Endpoints
  app.use('/api/auth', authRoutes);
  app.use('/api/workouts', workoutRoutes);
  app.use('/api/meals', mealRoutes);
  app.use('/api/food', foodRoutes);
  app.post('/api/import-foods', foodController.importFoods);

  // Exercise Database search endpoint (Supabase public.exercises)
  app.get('/api/exercises', async (req: Request, res: Response) => {
    try {
      const search = req.query.search as string;
      const bodyPart = req.query.bodyPart as string;
      const equipment = req.query.equipment as string;
      let query = supabase.from('exercises').select('*').order('name');
      if (search && search.trim()) {
        query = query.ilike('name', `%${search.trim()}%`);
      }
      if (bodyPart && bodyPart !== 'all') {
        query = query.eq('body_part', bodyPart);
      }
      if (equipment && equipment !== 'all') {
        query = query.eq('equipment', equipment);
      }
      const { data, error } = await query.limit(100);
      if (error) throw error;
      res.json({ success: true, count: data?.length || 0, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.use('/api/calculator', calculatorRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api', infoRoutes); // exposes /api/info and /api/notifications

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'healthy',
      app: 'Lift It Fitness & Nutrition Platform',
      version: '2.4.0',
      database: 'Supabase PostgreSQL',
      supabaseUrl: SUPABASE_URL,
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  });

  // Global Error Handler for API routes
  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
      return next(err);
    }
    console.error('Unhandled server error:', err);
    res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Internal Server Error',
      code: err.code || 'SERVER_ERROR',
    });
  });

  // Serve Frontend
  if (!isProduction) {
    // Mount Vite middleware in development
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[Server] Vite middleware mounted in development mode');
  } else {
    // Serve static build in production
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Lift It] Backend API server active on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting Lift It server:', err);
  process.exit(1);
});
