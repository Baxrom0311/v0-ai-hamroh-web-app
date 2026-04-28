export type UserRole = "patient" | "family" | "doctor"
export type Gender = "male" | "female" | "skip"

export type User = {
  id: number
  full_name: string
  phone: string
  role: UserRole
  age?: number
  gender?: Gender
  language: "uz" | "ru" | "en"
  avatar_url?: string
}

export type Disease = "tb" | "hypertension" | "diabetes" | "other"

export type Medication = {
  id: number
  name: string
  dosage: string
  disease: Disease
  instructions?: string
  frequency: 1 | 2 | 3 | 4
  times: string[] // ["08:00", "20:00"]
  start_date: string
  end_date?: string | null
  active: boolean
  adherence_rate_30d: number // 0-100
}

export type DoseStatus = "upcoming" | "taken" | "missed" | "skipped"

export type Dose = {
  id: number
  medication_id: number
  medication_name: string
  dosage: string
  scheduled_time: string // HH:mm
  status: DoseStatus
  taken_at?: string // ISO
  instructions?: string
}

export type RiskLevel = "low" | "medium" | "high" | "critical"

export type RiskAssessment = {
  score: number // 0-100
  level: RiskLevel
  factors: { label: string; impact: number }[]
  updated_at: string
}

export type AdherenceLogEntry = {
  id: number
  medication_id: number
  medication_name: string
  scheduled_time: string
  status: DoseStatus
  taken_at?: string
  late_minutes?: number
  notes?: string
}

export type DailyAdherence = {
  date: string // YYYY-MM-DD
  scheduled: number
  taken: number
  rate: number // 0-100
}

export type ChatRole = "user" | "assistant"

export type ChatMessage = {
  id: number
  role: ChatRole
  content: string
  timestamp: string
  risk_flag?: boolean
  suggested_actions?: { label: string; action: string }[]
}

export type FamilyMember = {
  id: number
  full_name: string
  phone: string
  relationship: string
  avatar?: string
}

export type DoctorPatient = {
  id: number
  full_name: string
  age: number
  disease: Disease
  risk: RiskAssessment
  adherence_rate_30d: number
  adherence_sparkline: number[] // last 30 days, 0-100
  last_seen: string // ISO
  phone: string
}
