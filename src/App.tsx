import React, { useState, useEffect } from 'react';
import { Dumbbell, Utensils, Calculator, Shield, Terminal, Database, Sparkles } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { WorkoutTab } from './components/WorkoutTab';
import { MealTab } from './components/MealTab';
import { CalculatorTab } from './components/CalculatorTab';
import { AdminTab } from './components/AdminTab';
import { ApiTesterTab } from './components/ApiTesterTab';
import { ArchitectureTab } from './components/ArchitectureTab';
import { AuthModal } from './components/AuthModal';
import { UserProfile, UserRole, Announcement } from './types';
import { api } from './services/api';

export function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('registered');
  const [activeTab, setActiveTab] = useState<'workouts' | 'meals' | 'calculator' | 'admin' | 'tester' | 'architecture'>('workouts');
  const [authModalState, setAuthModalState] = useState<{ isOpen: boolean; mode: 'login' | 'signup' }>({
    isOpen: false,
    mode: 'login',
  });
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Initialize demo registered athlete by default for a lively first view
  useEffect(() => {
    const initDemo = async () => {
      // Fetch system announcements
      fetchAnnouncements();

      // Check for saved token or auto login as Sarah (Registered)
      const existingToken = api.getToken();
      if (existingToken) {
        const { response, status } = await api.request('GET', '/api/auth/me');
        if (status === 200 && response.success && response.data) {
          setCurrentUser(response.data);
          setCurrentRole(response.data.role);
          return;
        }
      }

      // Default to demo Sarah (Registered) for instant interactive experience
      const { response, status } = await api.request('POST', '/api/auth/login', {
        email: 'sarah.lifter@liftit.com',
        password: 'LiftStrong2026!',
      });
      if (status === 200 && response.success && response.data) {
        api.setToken(response.data.token);
        setCurrentUser(response.data.user);
        setCurrentRole(response.data.user.role);
      }
    };

    initDemo();
  }, []);

  const fetchAnnouncements = async () => {
    const { response, status } = await api.request('GET', '/api/notifications');
    if (status === 200 && response.success) {
      setAnnouncements(response.data || []);
    }
  };

  // Re-fetch notifications whenever user identity or persona changes
  useEffect(() => {
    fetchAnnouncements();
  }, [currentUser]);

  const handleLoginSuccess = (user: UserProfile, token: string) => {
    api.setToken(token);
    setCurrentUser(user);
    setCurrentRole(user.role);
    if (user.role === 'admin') {
      setActiveTab('admin');
    }
  };

  const handleLogout = () => {
    api.setToken(null);
    setCurrentUser(null);
    setCurrentRole('guest');
    if (activeTab === 'admin') {
      setActiveTab('workouts');
    }
  };

  const switchToAdminPersona = async () => {
    const { response, status } = await api.request('POST', '/api/auth/login', {
      email: 'admin@liftit.com',
      password: 'AdminPass123!',
    });
    if (status === 200 && response.success && response.data) {
      api.setToken(response.data.token);
      setCurrentUser(response.data.user);
      setCurrentRole('admin');
      setActiveTab('admin');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        currentRole={currentRole}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
        onOpenAuthModal={(mode) => setAuthModalState({ isOpen: true, mode })}
        announcements={announcements}
      />

      {/* Main Tabs Header */}
      <div className="border-b border-zinc-800/80 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2.5 no-scrollbar">
            <button
              onClick={() => setActiveTab('workouts')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                activeTab === 'workouts'
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
              }`}
            >
              <Dumbbell className="w-4 h-4" />
              <span>Workouts &amp; Overload</span>
            </button>

            <button
              onClick={() => setActiveTab('meals')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                activeTab === 'meals'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
              }`}
            >
              <Utensils className="w-4 h-4" />
              <span>Meals &amp; Macros</span>
            </button>

            <button
              onClick={() => setActiveTab('calculator')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                activeTab === 'calculator'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>Public Tools &amp; BMI</span>
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                activeTab === 'admin'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Admin Panel</span>
              {currentRole !== 'admin' && (
                <span className="text-[9px] bg-rose-500/20 text-rose-400 px-1 rounded">Lock</span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('tester')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                activeTab === 'tester'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>API Explorer &amp; Sandbox</span>
            </button>

            <button
              onClick={() => setActiveTab('architecture')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
                activeTab === 'architecture'
                  ? 'bg-zinc-800 text-white shadow'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Architecture &amp; Schemas</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'workouts' && (
          <WorkoutTab
            currentRole={currentRole}
            onOpenAuth={() => setAuthModalState({ isOpen: true, mode: 'login' })}
          />
        )}

        {activeTab === 'meals' && (
          <MealTab
            currentRole={currentRole}
            onOpenAuth={() => setAuthModalState({ isOpen: true, mode: 'login' })}
          />
        )}

        {activeTab === 'calculator' && <CalculatorTab />}

        {activeTab === 'admin' && (
          <AdminTab
            currentRole={currentRole}
            onSwitchToAdmin={switchToAdminPersona}
            onRefreshAnnouncements={fetchAnnouncements}
          />
        )}

        {activeTab === 'tester' && <ApiTesterTab />}

        {activeTab === 'architecture' && <ArchitectureTab />}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-6 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-300">LIFT IT Backend System</span>
            <span>•</span>
            <span>Node.js Express + Mongoose Schemas + RBAC Architecture</span>
          </div>
          <div className="text-[11px] text-zinc-600">
            JWT Auth (7d expiry) • bcrypt Salt (10 rounds) • WHO Classification • Brzycki 1RM
          </div>
        </div>
      </footer>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalState.isOpen}
        mode={authModalState.mode}
        onClose={() => setAuthModalState({ isOpen: false, mode: 'login' })}
        onSuccess={handleLoginSuccess}
        onSwitchMode={(newMode) => setAuthModalState({ isOpen: true, mode: newMode })}
      />
    </div>
  );
}

export default App;
