import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserSession } from '@/types';
import { supabase } from '@/lib/supabase';
import { saveAuthSessionForSync } from '@/lib/offlineQueue';

interface AuthContextValue {
  session: UserSession | null;
  initialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, username: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<UserSession | null>(() => {
    try {
      const raw = localStorage.getItem('auth:session')
      if (!raw) return null

      const parsed = JSON.parse(raw) as UserSession
      // Basic validation of session structure
      if (!parsed.userId || !parsed.username || typeof parsed.userId !== 'string' || typeof parsed.username !== 'string') {
        localStorage.removeItem('auth:session')
        return null
      }
      return parsed
    } catch (error) {
      console.warn('Invalid session data in localStorage:', error)
      localStorage.removeItem('auth:session')
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
      // 2) Mirror to localStorage for quick boot and IndexedDB for service worker
      try {
        localStorage.setItem('auth:session', next ? JSON.stringify(next) : '')
        if (next) {
          saveAuthSessionForSync(next).catch(console.error)
        }
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
        if (next) {
          saveAuthSessionForSync(next).catch(console.error)
        }
      } catch { }
      setInitialized(true)
    })

    return () => subscription.unsubscribe()
  }, []);

  // Hydrate: we already seeded from localStorage synchronously above

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      // Handle specific Supabase error messages
      if (error.message?.includes('Email not confirmed')) {
        throw new Error('EMAIL_NOT_CONFIRMED');
      }
      if (error.message?.includes('Invalid login credentials')) {
        throw new Error('INVALID_CREDENTIALS');
      }
      // Re-throw other errors as they are
      throw error;
    }
    const user = data.user;
    const next = user ? { userId: user.id, username: user.user_metadata?.username || 'Guest' } : null
    setSession(next);
    try {
      localStorage.setItem('auth:session', next ? JSON.stringify(next) : '')
      if (next) {
        saveAuthSessionForSync(next).catch(console.error)
      }
    } catch { }
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

    // Don't set session immediately if email confirmation is required
    // The user needs to confirm their email first
    if (data.user && !data.user.email_confirmed_at) {
      throw new Error('EMAIL_CONFIRMATION_REQUIRED');
    }

    const user = data.user;
    const next = user ? { userId: user.id, username } : null
    setSession(next);
    try {
      localStorage.setItem('auth:session', next ? JSON.stringify(next) : '')
      if (next) {
        saveAuthSessionForSync(next).catch(console.error)
      }
    } catch { }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) throw error;
  };

  const resendConfirmation = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    try { localStorage.removeItem('auth:session') } catch { }
  };

  return <AuthContext.Provider value={{ session, initialized, login, signup, resetPassword, resendConfirmation, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
