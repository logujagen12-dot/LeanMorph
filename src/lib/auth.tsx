import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { UserProfile } from './types';

interface AuthContextValue {
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  setLocalProfile: (profile: UserProfile | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }
    setProfile(data as UserProfile | null);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        (async () => {
          setSession(newSession);
          if (newSession?.user) {
            await fetchProfile(newSession.user.id);
          } else {
            setProfile(null);
          }
          setLoading(false);
        })();
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  };

  const refreshProfile = async () => {
    if (session?.user) {
      await fetchProfile(session.user.id);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!session?.user) return;
    const { error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', session.user.id);
    if (error) throw error;
    setProfile((prev) => (prev ? { ...prev, ...updates } : prev));
  };

  const setLocalProfile = (p: UserProfile | null) => {
    setProfile(p);
  };

  return (
    <AuthContext.Provider
      value={{ session, profile, loading, signUp, signIn, signOut, refreshProfile, updateProfile, setLocalProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
