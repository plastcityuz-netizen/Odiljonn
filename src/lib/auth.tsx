// BALANS AI — Demo authentication (localStorage-based, backend-ready architecture)
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { DEMO_USERS } from './demoData'
import type { Role, User } from './types'

const AUTH_KEY = 'balans_ai_auth_v1'

interface AuthState {
  user: User | null
  onboarded: boolean
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string, role?: Role) => { ok: boolean; error?: string }
  register: (name: string, email: string, password: string) => { ok: boolean; error?: string }
  logout: () => void
  completeOnboarding: () => void
  demoLogin: (role: Role) => void
  updateUser: (u: Partial<User>) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function load(): AuthState {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { user: null, onboarded: false }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(load)

  useEffect(() => {
    try { localStorage.setItem(AUTH_KEY, JSON.stringify(state)) } catch { /* ignore */ }
  }, [state])

  const value = useMemo<AuthContextValue>(() => ({
    ...state,
    login: (email, password, role) => {
      const normalized = email.trim().toLowerCase()
      if (password.length < 4) return { ok: false, error: 'Parol kamida 4 belgidan iborat bo‘lishi kerak.' }
      const demo = DEMO_USERS.find((u) => u.email === normalized)
      if (demo && password === 'balans2026') {
        setState({ user: { id: demo.id, name: demo.name, email: demo.email, role: demo.role, phone: demo.phone, position: demo.position }, onboarded: true })
        return { ok: true }
      }
      // any registered-style account (demo auth): role selectable at login
      const user: User = {
        id: 'usr_me',
        name: normalized.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Foydalanuvchi',
        email: normalized,
        role: role ?? 'OWNER',
      }
      setState({ user, onboarded: true })
      return { ok: true }
    },
    register: (name, email, password) => {
      if (name.trim().length < 2) return { ok: false, error: 'Ismingizni kiriting.' }
      if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, error: "To'g'ri email kiriting." }
      if (password.length < 6) return { ok: false, error: 'Parol kamida 6 belgidan iborat bo‘lishi kerak.' }
      setState({ user: { id: 'usr_me', name: name.trim(), email: email.trim().toLowerCase(), role: 'OWNER' }, onboarded: false })
      return { ok: true }
    },
    logout: () => setState({ user: null, onboarded: false }),
    completeOnboarding: () => setState((s) => ({ ...s, onboarded: true })),
    demoLogin: (role) => {
      const demo = DEMO_USERS.find((u) => u.role === role) ?? DEMO_USERS[0]
      setState({ user: { id: demo.id, name: demo.name, email: demo.email, role: demo.role, phone: demo.phone, position: demo.position }, onboarded: true })
    },
    updateUser: (u) => setState((s) => (s.user ? { ...s, user: { ...s.user, ...u } } : s)),
  }), [state])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
