import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Loader2, TrendingUp, Camera, Bot } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const { showToast } = useToast();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter email and password', 'error');
      return;
    }
    if (mode === 'signup' && password.length < 8) {
      showToast('Password must be at least 8 characters with a mix of letters, numbers, and symbols', 'error');
      return;
    }
    setLoading(true);
    const result = mode === 'login' ? await signIn(email, password) : await signUp(email, password);
    setLoading(false);
    if (result.error) {
      const msg = result.error;
      if (msg.includes('weak_password') || msg.includes('pwned')) {
        showToast('That password is too common. Please choose a stronger one with a mix of letters, numbers, and symbols.', 'error');
      } else if (msg.includes('invalid_credentials')) {
        showToast('Incorrect email or password. Please try again or sign up first.', 'error');
      } else if (msg.includes('already_registered') || msg.includes('already been registered')) {
        showToast('An account with this email already exists. Try signing in instead.', 'error');
        setMode('login');
      } else {
        showToast(msg, 'error');
      }
    } else {
      if (mode === 'signup') {
        showToast('Account created! Welcome to LeanMorph.', 'success');
      } else {
        showToast('Welcome back!', 'success');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-100 via-white to-zinc-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 p-4 relative overflow-hidden">
      {/* Ambient background blobs */}
      <div className="absolute top-0 left-0 w-72 h-72 rounded-full bg-brand-400/20 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-zinc-400/15 blur-3xl" />
      <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-accent-400/10 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mb-4"
          >
            <BrandLogo size="lg" />
          </motion.div>
          <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-white">LeanMorph</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Transform your body with smart nutrition tracking</p>
        </div>

        {/* Feature pills */}
        <div className="flex justify-center gap-2 mb-6">
          {[
            { icon: TrendingUp, label: 'Track' },
            { icon: Camera, label: 'Scan' },
            { icon: Bot, label: 'AI Coach' },
          ].map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              className="flex items-center gap-1.5 rounded-full bg-white/60 dark:bg-zinc-800/60 backdrop-blur-sm border border-zinc-200/60 dark:border-zinc-700/60 px-3 py-1.5"
            >
              <f.icon className="w-3.5 h-3.5 text-brand-500" />
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{f.label}</span>
            </motion.div>
          ))}
        </div>

        <div className="glass-panel rounded-3xl p-6 shadow-card dark:shadow-card-dark">
          <div className="flex gap-2 mb-6 p-1 rounded-xl bg-zinc-100/80 dark:bg-zinc-800/80">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'login' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-soft' : 'text-zinc-500'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'signup' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-soft' : 'text-zinc-500'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-field pl-11"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? '8+ chars, mix letters & numbers' : 'Enter your password'}
                  className="input-field pl-11 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Please wait...</>
              ) : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
          <p className="text-xs text-center text-zinc-400 mt-4">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-brand-500 font-medium hover:underline"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
