"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import type { User, UserRole } from "../types"
import { MOCK_DOCTOR_USER, MOCK_FAMILY_USER, MOCK_PATIENT } from "../mock-data"

type AuthContextValue = {
  user: User | null
  isAuthenticated: boolean
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
  setRole: (role: UserRole) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const STORAGE_KEY = "ai-hamroh-user"

function pickMockUser(role: UserRole): User {
  if (role === "family") return MOCK_FAMILY_USER
  if (role === "doctor") return MOCK_DOCTOR_USER
  return MOCK_PATIENT
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) setUser(JSON.parse(raw))
    } catch {
      // ignore
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

  const login = useCallback<AuthContextValue["login"]>(
    async (phone) => {
      // Mock: detect role from phone (demo)
      let role: UserRole = "patient"
      if (phone.includes("222")) role = "family"
      else if (phone.includes("333")) role = "doctor"
      const u = pickMockUser(role)
      await new Promise((r) => setTimeout(r, 600))
      persist(u)
      return u
    },
    [persist],
  )

  const register = useCallback<AuthContextValue["register"]>(
    async (data) => {
      const base = pickMockUser(data.role)
      const u: User = {
        ...base,
        id: Math.floor(Math.random() * 10000) + 100,
        full_name: data.full_name,
        phone: data.phone,
        role: data.role,
        age: data.age ?? base.age,
        gender: data.gender ?? base.gender,
        language: data.language ?? "uz",
      }
      await new Promise((r) => setTimeout(r, 800))
      persist(u)
      return u
    },
    [persist],
  )

  const logout = useCallback(() => persist(null), [persist])

  const setRole = useCallback(
    (role: UserRole) => {
      const u = pickMockUser(role)
      persist(u)
    },
    [persist],
  )

  const value = useMemo(
    () => ({ user, isAuthenticated: !!user, login, register, logout, setRole }),
    [user, login, register, logout, setRole],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
