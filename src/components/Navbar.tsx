import React, { useState, useEffect } from 'react';
import { Dumbbell, Shield, User, Bell, LogIn, UserPlus, LogOut, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { UserProfile, Announcement, UserRole } from '../types';
import { api } from '../services/api';

interface NavbarProps {
  currentUser: UserProfile | null;
  currentRole: UserRole;
  onLoginSuccess: (user: UserProfile, token: string) => void;
  onLogout: () => void;
  onOpenAuthModal: (mode: 'login' | 'signup') => void;
  announcements: Announcement[];
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currentRole,
  onLoginSuccess,
  onLogout,
  onOpenAuthModal,
  announcements,
}) => {
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [switchingRole, setSwitchingRole] = useState<'registered' | 'admin' | null>(null);

  const quickLogin = async (role: 'registered' | 'admin') => {
    setSwitchingRole(role);
    const credentials =
      role === 'admin'
        ? { email: 'admin@liftit.com', password: 'AdminPass123!' }
        : { email: 'sarah.lifter@liftit.com', password: 'LiftStrong2026!' };

    console.log(`[Navbar] Quick login initiated for persona "${role}" (${credentials.email})...`);

    try {
      const { response, status } = await api.request('POST', '/api/auth/login', credentials);
      if (status === 200 && response.success && response.data) {
        console.log(`[Navbar] Quick login succeeded for role "${role}":`, response.data.user);
        api.setToken(response.data.token);
        onLoginSuccess(response.data.user, response.data.token);
      } else {
        console.error(
          `[Navbar] Quick login failed for role "${role}" with status ${status}:`,
          response?.error || response?.message || response
        );
      }
    } catch (err: any) {
      console.error(`[Navbar] Exception during quickLogin for role "${role}":`, err?.message || err);
    } finally {
      setSwitchingRole(null);
    }
  };

  const getRoleBadge = () => {
    if (currentRole === 'admin') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
          <Shield className="w-3.5 h-3.5" />
          ADMIN PRIVILEGE
        </span>
      );
    }
    if (currentRole === 'registered') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <User className="w-3.5 h-3.5" />
          REGISTERED ATHLETE
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        GUEST (UNAUTHENTICATED)
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800 isolate">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20 text-white font-black text-xl tracking-tighter shrink-0">
              <Dumbbell className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-wider text-white">LIFT IT</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                  BACKEND V2.4
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/80 items-center gap-1 hidden xl:flex">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  SUPABASE POSTGRES
                </span>
              </div>
              <p className="text-xs text-zinc-400 hidden lg:block">
                RBAC Fitness &amp; Nutrition System
              </p>
            </div>
          </div>

          {/* Quick RBAC Switcher (Desktop) */}
          <div className="hidden md:flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-1 gap-1 relative z-30 shrink-0 pointer-events-auto select-none shadow-sm">
            <button
              type="button"
              onClick={() => onLogout()}
              className={`relative z-30 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer pointer-events-auto flex items-center gap-1.5 ${
                currentRole === 'guest'
                  ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-zinc-700 font-bold'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-850'
              }`}
              title="Switch to unauthenticated guest preview"
            >
              <span className={`w-2 h-2 rounded-full ${currentRole === 'guest' ? 'bg-amber-400 animate-pulse' : 'bg-zinc-600'}`} />
              Guest View
            </button>

            <button
              type="button"
              disabled={switchingRole !== null}
              onClick={() => quickLogin('registered')}
              className={`relative z-30 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer pointer-events-auto flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-wait ${
                currentRole === 'registered'
                  ? 'bg-emerald-600/25 text-emerald-300 border border-emerald-500/40 shadow-sm font-bold ring-1 ring-emerald-500/20'
                  : 'text-zinc-400 hover:text-emerald-300 hover:bg-zinc-850'
              }`}
              title="Switch to registered athlete (Sarah Lifter)"
            >
              {switchingRole === 'registered' ? (
                <RefreshCw className="w-3 h-3 text-emerald-400 animate-spin" />
              ) : (
                <span className={`w-2 h-2 rounded-full ${currentRole === 'registered' ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
              )}
              Demo Athlete (Sarah)
            </button>

            <button
              type="button"
              disabled={switchingRole !== null}
              onClick={() => quickLogin('admin')}
              className={`relative z-30 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer pointer-events-auto flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-wait ${
                currentRole === 'admin'
                  ? 'bg-rose-600/25 text-rose-300 border border-rose-500/40 shadow-sm font-bold ring-1 ring-rose-500/20'
                  : 'text-zinc-400 hover:text-rose-300 hover:bg-zinc-850'
              }`}
              title="Switch to system administrator (Marcus Vance)"
            >
              {switchingRole === 'admin' ? (
                <RefreshCw className="w-3 h-3 text-rose-400 animate-spin" />
              ) : (
                <span className={`w-2 h-2 rounded-full ${currentRole === 'admin' ? 'bg-rose-400' : 'bg-zinc-600'}`} />
              )}
              Demo Admin (Marcus)
            </button>
          </div>

          {/* User & Actions */}
          <div className="flex items-center gap-3 shrink-0 relative z-20">
            {getRoleBadge()}

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setShowAnnouncements(!showAnnouncements)}
                className="relative p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
                title="System Broadcasts"
              >
                <Bell className="w-4 h-4" />
                {announcements.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center">
                    {announcements.length}
                  </span>
                )}
              </button>

              {/* Announcements Dropdown */}
              {showAnnouncements && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-4 z-50">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-orange-400" />
                      Global Announcements
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                      Live Push
                    </span>
                  </div>

                  <div className="mt-3 space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {announcements.length === 0 ? (
                      <p className="text-xs text-zinc-500 text-center py-4">No active broadcasts.</p>
                    ) : (
                      announcements.map((anc) => (
                        <div
                          key={anc._id || anc.id}
                          className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 text-left"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-zinc-200">
                              {anc.title}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {anc.targetType === 'specific' ? (
                                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                  🎯 Targeted
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                                  🌐 Global
                                </span>
                              )}
                              <span
                                className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                  anc.priority === 'urgent'
                                    ? 'bg-rose-500/20 text-rose-400'
                                    : anc.priority === 'high'
                                    ? 'bg-orange-500/20 text-orange-400'
                                    : 'bg-zinc-800 text-zinc-400'
                                }`}
                              >
                                {anc.priority}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-zinc-400 leading-relaxed">{anc.message}</p>
                          <div className="mt-2 text-[10px] text-zinc-500 flex justify-between">
                            <span>From: {anc.createdByEmail}</span>
                            <span>{new Date(anc.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Auth Buttons */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-300 font-medium hidden lg:inline">
                  {currentUser.name}
                </span>
                <button
                  onClick={onLogout}
                  className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-rose-400 hover:border-rose-900/50 transition"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onOpenAuthModal('login')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-200 hover:bg-zinc-800 hover:text-white transition"
                >
                  Log In
                </button>
                <button
                  onClick={() => onOpenAuthModal('signup')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:opacity-95 shadow-md shadow-orange-500/20 transition"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Quick Switcher */}
        <div className="md:hidden py-2 flex items-center justify-between border-t border-zinc-900">
          <span className="text-[11px] text-zinc-400 font-medium">Quick Persona:</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onLogout()}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer transition ${
                currentRole === 'guest' ? 'bg-zinc-800 text-white font-bold ring-1 ring-zinc-700' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Guest
            </button>
            <button
              type="button"
              disabled={switchingRole !== null}
              onClick={() => quickLogin('registered')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer transition flex items-center gap-1 disabled:opacity-50 ${
                currentRole === 'registered' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold' : 'text-zinc-400 hover:text-emerald-300'
              }`}
            >
              {switchingRole === 'registered' && <RefreshCw className="w-2.5 h-2.5 animate-spin" />}
              Athlete
            </button>
            <button
              type="button"
              disabled={switchingRole !== null}
              onClick={() => quickLogin('admin')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer transition flex items-center gap-1 disabled:opacity-50 ${
                currentRole === 'admin' ? 'bg-rose-950 text-rose-300 border border-rose-800 font-bold' : 'text-zinc-400 hover:text-rose-300'
              }`}
            >
              {switchingRole === 'admin' && <RefreshCw className="w-2.5 h-2.5 animate-spin" />}
              Admin
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
