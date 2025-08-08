import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserSession } from '@/types';
import { supabase } from '@/lib/supabase';

interface AuthContextValue {
  session: UserSession | null;
  initialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<UserSession | null>(() => {
    try {
      const raw = localStorage.getItem('auth:session')
      return raw ? (JSON.parse(raw) as UserSession) : null
    } catch {
      return null
    }
  });
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    // 1) Load from Supabase persisted session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user
      const next = user ? { userId: user.id, username: user.user_metadata?.username || 'Guest' } : null
      setSession(next)
      // 2) Mirror to localStorage for quick boot
      try {
        localStorage.setItem('auth:session', next ? JSON.stringify(next) : '')
      } catch { }
      setInitialized(true)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user
      const next = user ? { userId: user.id, username: user.user_metadata?.username || 'Guest' } : null
      setSession(next)
      try {
        localStorage.setItem('auth:session', next ? JSON.stringify(next) : '')
      } catch { }
      setInitialized(true)
    })

    return () => subscription.unsubscribe()
  }, []);

  // Hydrate: we already seeded from localStorage synchronously above

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const user = data.user;
    const next = user ? { userId: user.id, username: user.user_metadata?.username || 'Guest' } : null
    setSession(next);
    try { localStorage.setItem('auth:session', next ? JSON.stringify(next) : '') } catch { }
  };

  const signup = async (email: string, password: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });
    if (error) throw error;
    const user = data.user;
    const next = user ? { userId: user.id, username } : null
    setSession(next);
    try { localStorage.setItem('auth:session', next ? JSON.stringify(next) : '') } catch { }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    try { localStorage.removeItem('auth:session') } catch { }
  };

  return <AuthContext.Provider value={{ session, initialized, login, signup, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
