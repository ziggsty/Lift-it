import React, { useState, useEffect } from 'react';
import { Terminal, Send, CheckCircle2, AlertCircle, Copy, Check, Clock, ShieldAlert } from 'lucide-react';
import { api, ApiCallLog } from '../services/api';

interface EndpointPreset {
  name: string;
  category: 'Auth' | 'Workouts' | 'Meals' | 'Food' | 'Calculator' | 'Admin' | 'Public';
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  endpoint: string;
  description: string;
  defaultBody?: any;
  requiredRole?: string;
}

const PRESETS: EndpointPreset[] = [
  // Public
  {
    name: 'Calculate BMI & Metabolic TDEE (Public)',
    category: 'Calculator',
    method: 'POST',
    endpoint: '/api/calculator/bmi',
    description: 'Open to all roles. Calculates WHO category, BMR, and caloric targets.',
    defaultBody: { weightKg: 82, heightCm: 180, age: 26, gender: 'male', activityLevel: 'active' },
    requiredRole: 'guest',
  },
  {
    name: 'Get Platform History & Vision (Public)',
    category: 'Public',
    method: 'GET',
    endpoint: '/api/info',
    description: 'Static website data, core engineering principles, and founding story.',
    requiredRole: 'guest',
  },
  {
    name: 'Query Food Database (Guest limited vs Registered full)',
    category: 'Food',
    method: 'GET',
    endpoint: '/api/food?search=chicken',
    description: 'Returns basic calories for guest; unlocks deep macros for registered/admin.',
    requiredRole: 'guest',
  },
  {
    name: 'Import Foods from Open Food Facts API',
    category: 'Food',
    method: 'POST',
    endpoint: '/api/import-foods',
    description: 'Queries Open Food Facts API, parses per-100g calories & macros, and inserts records into Supabase food_items table.',
    defaultBody: {
      searchTerm: 'rolled oats',
      pageSize: 5,
    },
    requiredRole: 'guest',
  },
  {
    name: 'Get Active Broadcast Announcements',
    category: 'Public',
    method: 'GET',
    endpoint: '/api/notifications',
    description: 'Public notifications feed pushed by system admins.',
    requiredRole: 'guest',
  },

  // Auth
  {
    name: 'Sign Up New Account',
    category: 'Auth',
    method: 'POST',
    endpoint: '/api/auth/signup',
    description: 'Registers user, hashes password via bcrypt, upgrades role to registered.',
    defaultBody: {
      name: 'Taylor Brooks',
      email: `taylor.${Math.floor(Math.random() * 1000)}@liftit.com`,
      password: 'StrongPassword123!',
      profile: { heightCm: 178, weightKg: 80 },
    },
    requiredRole: 'guest',
  },
  {
    name: 'Log In (Registered Athlete)',
    category: 'Auth',
    method: 'POST',
    endpoint: '/api/auth/login',
    description: 'Verifies bcrypt hash, signs JWT, returns session credentials.',
    defaultBody: { email: 'sarah.lifter@liftit.com', password: 'LiftStrong2026!' },
    requiredRole: 'guest',
  },
  {
    name: 'Log In (System Admin)',
    category: 'Auth',
    method: 'POST',
    endpoint: '/api/auth/login',
    description: 'Authenticates administrator account for access to /api/admin.',
    defaultBody: { email: 'admin@liftit.com', password: 'AdminPass123!' },
    requiredRole: 'guest',
  },
  {
    name: 'Get Authenticated User Profile',
    category: 'Auth',
    method: 'GET',
    endpoint: '/api/auth/me',
    description: 'Requires JWT token. Returns user info and personal goals.',
    requiredRole: 'registered',
  },

  // Workouts
  {
    name: 'Get Weekly Progressive Overload Challenges',
    category: 'Workouts',
    method: 'GET',
    endpoint: '/api/workouts/progressive-challenge',
    description: 'Evaluates past 14 days and computes dynamic weight/rep overload jumps.',
    requiredRole: 'registered',
  },
  {
    name: 'Get Pop-up Workout History & PRs',
    category: 'Workouts',
    method: 'GET',
    endpoint: '/api/workouts/history',
    description: 'Returns logs with estimated 1RM (Brzycki) and personal record flags.',
    requiredRole: 'registered',
  },
  {
    name: 'Log New Workout Exercise',
    category: 'Workouts',
    method: 'POST',
    endpoint: '/api/workouts',
    description: 'Requires exerciseName, reps, weightLiftedKg, durationMinutes.',
    defaultBody: {
      exerciseName: 'Barbell Back Squat',
      sets: 4,
      reps: 6,
      weightLiftedKg: 90,
      durationMinutes: 45,
      rpe: 8.5,
      notes: 'API test session',
    },
    requiredRole: 'registered',
  },

  // Meals
  {
    name: 'Get Daily Nutrition Summary & Targets',
    category: 'Meals',
    method: 'GET',
    endpoint: '/api/meals/summary',
    description: 'Computes macro calorie ratios, total protein, carbs, fats, and fiber.',
    requiredRole: 'registered',
  },
  {
    name: 'Get Pop-up Meal Plan History & Macros',
    category: 'Meals',
    method: 'GET',
    endpoint: '/api/meals/history',
    description: 'Returns all logged meals with formatted dates, times, and macro ratios for pop-up display.',
    requiredRole: 'registered',
  },
  {
    name: 'Log Detailed Macronutrient Meal',
    category: 'Meals',
    method: 'POST',
    endpoint: '/api/meals',
    description: 'Logs meal with exact calories, protein, carbs, fats, and fiber.',
    defaultBody: {
      mealName: 'Whey Protein & Almond Butter Shake',
      mealType: 'snack',
      calories: 340,
      proteinGrams: 32,
      carbsGrams: 12,
      fatsGrams: 16,
      fiberGrams: 3,
      notes: 'Post-workout recovery shake',
    },
    requiredRole: 'registered',
  },

  // Admin
  {
    name: 'Fetch All User Accounts (Admin Only)',
    category: 'Admin',
    method: 'GET',
    endpoint: '/api/admin/users',
    description: 'Strict RBAC guard. Returns 403 Forbidden if not Admin.',
    requiredRole: 'admin',
  },
  {
    name: 'Get Administrative Telemetry & Health',
    category: 'Admin',
    method: 'GET',
    endpoint: '/api/admin/stats',
    description: 'Active users, database health, total lifted volume, memory usage.',
    requiredRole: 'admin',
  },
  {
    name: 'Broadcast System Alert (Admin Only)',
    category: 'Admin',
    method: 'POST',
    endpoint: '/api/admin/announcements',
    description: 'Dispatches global notification to all registered athletes.',
    defaultBody: {
      title: 'Database Index Maintenance Complete',
      message: 'High-throughput aggregation indexes are optimized.',
      priority: 'normal',
    },
    requiredRole: 'admin',
  },
];

export const ApiTesterTab: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<EndpointPreset>(PRESETS[0]);
  const [method, setMethod] = useState<'GET' | 'POST' | 'PATCH' | 'DELETE'>('POST');
  const [endpoint, setEndpoint] = useState('/api/calculator/bmi');
  const [requestBody, setRequestBody] = useState(
    JSON.stringify(PRESETS[0].defaultBody, null, 2) || ''
  );
  const [responseOutput, setResponseOutput] = useState<any>(null);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<ApiCallLog[]>(api.getCallLogs());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    return api.onLogUpdate((newLogs) => {
      setLogs(newLogs);
    });
  }, []);

  const selectPreset = (p: EndpointPreset) => {
    setSelectedPreset(p);
    setMethod(p.method);
    setEndpoint(p.endpoint);
    setRequestBody(p.defaultBody ? JSON.stringify(p.defaultBody, null, 2) : '');
  };

  const handleSend = async () => {
    setLoading(true);
    setResponseOutput(null);
    setResponseStatus(null);

    let parsedBody = undefined;
    if (method !== 'GET' && requestBody.trim()) {
      try {
        parsedBody = JSON.parse(requestBody);
      } catch (err: any) {
        setResponseOutput({ error: 'Invalid JSON formatted in request body: ' + err.message });
        setResponseStatus(400);
        setLoading(false);
        return;
      }
    }

    const t0 = performance.now();
    const { response, status } = await api.request(method, endpoint, parsedBody);
    const t1 = performance.now();

    setExecutionTime(Math.round(t1 - t0));
    setResponseStatus(status);
    setResponseOutput(response);
    setLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentToken = api.getToken();

  return (
    <div className="space-y-8 animate-fade-in text-left">
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 mb-2">
          <Terminal className="w-3.5 h-3.5" />
          INTERACTIVE API CONSOLE &amp; RBAC SANDBOX
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          Backend API Explorer
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Execute real HTTP requests against all Express controllers, inspect JWT Authorization headers, and test RBAC permission boundaries.
        </p>
      </div>

      {/* Preset Selector */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-2">
          Select API Route Preset:
        </span>
        <div className="flex gap-2 flex-wrap">
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => selectPreset(p)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                selectedPreset.name === p.name
                  ? 'bg-orange-500 text-black font-bold shadow-md'
                  : 'bg-zinc-950 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              <span
                className={`text-[9px] font-black uppercase px-1 rounded ${
                  p.method === 'GET'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : p.method === 'POST'
                    ? 'bg-orange-500/20 text-orange-400'
                    : p.method === 'PATCH'
                    ? 'bg-indigo-500/20 text-indigo-400'
                    : 'bg-rose-500/20 text-rose-400'
                }`}
              >
                {p.method}
              </span>
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Request & Response Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Request Config */}
        <div className="lg:col-span-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                HTTP Request Configuration
              </span>
              <span className="text-[10px] text-zinc-500">
                Required Role: <strong className="text-orange-400 uppercase">{selectedPreset.requiredRole}</strong>
              </span>
            </div>

            {/* URL input bar */}
            <div className="flex items-center gap-2">
              <select
                value={method}
                onChange={(e: any) => setMethod(e.target.value)}
                className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-bold text-orange-400 focus:outline-none focus:border-orange-500"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>

              <input
                type="text"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-orange-500"
              />

              <button
                onClick={handleSend}
                disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-xs rounded-lg hover:opacity-95 shadow-md shadow-orange-500/20 transition flex items-center gap-1.5 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                {loading ? 'Sending...' : 'Send'}
              </button>
            </div>

            {/* Headers Viewer */}
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono">
              <div className="text-zinc-500 text-[10px] uppercase font-bold mb-1">Outgoing Request Headers:</div>
              <div className="text-zinc-300">Content-Type: application/json</div>
              <div className="text-zinc-300 truncate">
                Authorization:{' '}
                {currentToken ? (
                  <span className="text-emerald-400 font-semibold">Bearer {currentToken.slice(0, 24)}... (Attached)</span>
                ) : (
                  <span className="text-zinc-500 italic">None (Guest Request)</span>
                )}
              </div>
            </div>

            {/* Request Body (if applicable) */}
            {method !== 'GET' && (
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  JSON Request Body:
                </label>
                <textarea
                  rows={8}
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-200 focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>
            )}
          </div>

          <p className="text-[11px] text-zinc-500 mt-4 pt-3 border-t border-zinc-800">
            {selectedPreset.description}
          </p>
        </div>

        {/* Right: Response Output */}
        <div className="lg:col-span-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  HTTP Response
                </span>
                {responseStatus !== null && (
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                      responseStatus >= 200 && responseStatus < 300
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : responseStatus === 403
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    }`}
                  >
                    HTTP {responseStatus}
                  </span>
                )}
                {executionTime !== null && (
                  <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {executionTime}ms
                  </span>
                )}
              </div>

              {responseOutput && (
                <button
                  onClick={() => copyToClipboard(JSON.stringify(responseOutput, null, 2))}
                  className="p-1 rounded text-zinc-400 hover:text-white transition"
                  title="Copy JSON"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              )}
            </div>

            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs overflow-auto max-h-[460px] min-h-[300px]">
              {loading ? (
                <div className="py-20 text-center text-zinc-500">Executing Express route controller...</div>
              ) : responseOutput ? (
                <pre className="text-emerald-400 whitespace-pre-wrap">
                  {JSON.stringify(responseOutput, null, 2)}
                </pre>
              ) : (
                <div className="py-20 text-center text-zinc-600">
                  Click "Send" to fire the HTTP request and inspect JSON response headers &amp; payloads.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800 flex justify-between items-center text-xs text-zinc-500">
            <span>JSON serialization via express.json()</span>
            <span>RESTful status code standard</span>
          </div>
        </div>
      </div>

      {/* Real-time Call Log Stream */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-orange-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Live API Request Log Stream ({logs.length})
            </h3>
          </div>
          <button
            onClick={() => api.clearLogs()}
            className="text-[11px] text-zinc-400 hover:text-white"
          >
            Clear Log History
          </button>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {logs.length === 0 ? (
            <p className="text-xs text-zinc-500 text-center py-6">No requests recorded yet.</p>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 font-mono text-xs flex items-center justify-between hover:border-zinc-700 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-zinc-500 text-[10px]">{log.timestamp}</span>
                  <span
                    className={`font-black text-[10px] px-1.5 py-0.5 rounded ${
                      log.method === 'GET'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : log.method === 'POST'
                        ? 'bg-orange-500/20 text-orange-400'
                        : log.method === 'PATCH'
                        ? 'bg-indigo-500/20 text-indigo-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {log.method}
                  </span>
                  <span className="text-zinc-200 font-medium truncate max-w-xs sm:max-w-md">
                    {log.endpoint}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-zinc-500 text-[10px]">{log.durationMs}ms</span>
                  <span
                    className={`font-bold text-[10px] px-2 py-0.5 rounded ${
                      log.status >= 200 && log.status < 300
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : log.status === 403
                        ? 'bg-rose-500/15 text-rose-400'
                        : 'bg-amber-500/15 text-amber-400'
                    }`}
                  >
                    {log.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
