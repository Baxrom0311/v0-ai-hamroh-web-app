"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import type { User, UserRole } from "../types"
import { api, setStoredToken } from "../api"

type AuthContextValue = {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (phone: string, password: string) => Promise<User>
  register: (data: {
    full_name: string
    phone: string
    password: string
    role: UserRole
    age?: number
    gender?: "male" | "female" | "skip"
    language?: "uz" | "ru" | "en"
  }) => Promise<User>
  logout: () => void
  refreshUser: () => Promise<User | null>
  setRole: (role: UserRole) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const STORAGE_KEY = "ai-hamroh-user"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function restoreSession() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        if (raw && !cancelled) setUser(JSON.parse(raw))
        const token = window.localStorage.getItem("ai-hamroh-token")
        if (!token) return
        const profile = await api.me()
        if (!cancelled) {
          setUser(profile)
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
        }
      } catch {
        if (!cancelled) {
          setUser(null)
          setStoredToken(null)
          window.localStorage.removeItem(STORAGE_KEY)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    restoreSession()
    return () => {
      cancelled = true
    }
  }, [])

  const persist = useCallback((u: User | null) => {
    setUser(u)
    try {
      if (u) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
      else window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }, [])

  const persistSession = useCallback(
    (u: User, token: string) => {
      setStoredToken(token)
      persist(u)
    },
    [persist],
  )

  const login = useCallback<AuthContextValue["login"]>(
    async (phone, password) => {
      const session = await api.login(phone, password)
      persistSession(session.user, session.access_token)
      return session.user
    },
    [persistSession],
  )

  const register = useCallback<AuthContextValue["register"]>(
    async (data) => {
      const session = await api.register({
        ...data,
        gender: data.gender === "skip" ? null : data.gender,
      })
      persistSession(session.user, session.access_token)
      return session.user
    },
    [persistSession],
  )

  const logout = useCallback(() => {
    setStoredToken(null)
    persist(null)
  }, [persist])

  const refreshUser = useCallback(async () => {
    try {
      const profile = await api.me()
      persist(profile)
      return profile
    } catch {
      logout()
      return null
    }
  }, [logout, persist])

  const setRole = useCallback((_role: UserRole) => {
    // Demo role switching is intentionally disabled when real backend auth is active.
  }, [])

  const value = useMemo(
    () => ({ user, isAuthenticated: !!user, isLoading, login, register, logout, refreshUser, setRole }),
    [user, isLoading, login, register, logout, refreshUser, setRole],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
