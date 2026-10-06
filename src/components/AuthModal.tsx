import React, { useState } from 'react';
import { X, Lock, Mail, User, ArrowRight, ShieldCheck, Check } from 'lucide-react';
import { api } from '../services/api';
import { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  mode: 'login' | 'signup';
  onClose: () => void;
  onSuccess: (user: UserProfile, token: string) => void;
  onSwitchMode: (newMode: 'login' | 'signup') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  mode,
  onClose,
  onSuccess,
  onSwitchMode,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [heightCm, setHeightCm] = useState('175');
  const [weightKg, setWeightKg] = useState('75');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const endpoint = mode === 'signup' ? '/api/auth/signup' : '/api/auth/login';
    const payload =
      mode === 'signup'
        ? {
            name,
            email,
            password,
            profile: {
              heightCm: Number(heightCm),
              weightKg: Number(weightKg),
            },
          }
        : { email, password };

    const { response, status } = await api.request('POST', endpoint, payload);

    if (status >= 200 && status < 300 && response.success && response.data) {
      api.setToken(response.data.token);
      onSuccess(response.data.user, response.data.token);
      onClose();
    } else {
      setError(response.error || 'Authentication failed. Please verify credentials.');
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6 text-left">
          <div className="inline-flex p-2.5 rounded-xl bg-orange-500/10 text-orange-400 mb-3 border border-orange-500/20">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {mode === 'signup' ? 'Create Lift It Account' : 'Welcome Back'}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            {mode === 'signup'
              ? 'Role assignment defaults from Guest to Registered Athlete with JWT token issued.'
              : 'Enter your credentials to unlock full progressive overload and macro tracking.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Miller"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="athlete@liftit.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition"
              />
            </div>
            <p className="text-[10px] text-zinc-500 mt-1">Hashed via bcrypt (10 rounds) before persistence</p>
          </div>

          {mode === 'signup' && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Height (cm)</label>
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-sm hover:opacity-95 shadow-lg shadow-orange-500/25 transition flex items-center justify-center gap-2"
          >
            {loading ? (
              'Processing...'
            ) : mode === 'signup' ? (
              <>
                Register &amp; Obtain Token <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                Log In <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-zinc-800 text-center text-xs text-zinc-400">
          {mode === 'signup' ? (
            <span>
              Already have an account?{' '}
              <button
                onClick={() => onSwitchMode('login')}
                className="text-orange-400 font-semibold hover:underline"
              >
                Log In
              </button>
            </span>
          ) : (
            <span>
              Need an account?{' '}
              <button
                onClick={() => onSwitchMode('signup')}
                className="text-orange-400 font-semibold hover:underline"
              >
                Create one now
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
