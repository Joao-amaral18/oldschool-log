import React, { createContext, useContext, useMemo, useEffect } from 'react'
import type { UserSession } from '@/types'
import { supabase } from '@/lib/supabase'

interface AuthContextValue {
  session: UserSession | null
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, username: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = React.useState<UserSession | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user
      if (user) setCurrent({ userId: user.id, username: user.user_metadata?.username || 'Guest' })
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const user = session?.user
      setCurrent(user ? { userId: user.id, username: user.user_metadata?.username || 'Guest' } : null)
    })
    return () => { sub.subscription.unsubscribe() }
  }, [])

  const session = useMemo<UserSession | null>(() => current, [current])

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    const user = data.user
    setCurrent(user ? { userId: user.id, username: user.user_metadata?.username || 'Guest' } : null)
  }

  const signup = async (email: string, password: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username }
      }
    })
    if (error) throw error
    const user = data.user
    setCurrent(user ? { userId: user.id, username } : null)
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setCurrent(null)
  }

  return <AuthContext.Provider value={{ session, login, signup, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}


