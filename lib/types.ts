export type UserRole = "patient" | "family" | "doctor"
export type Gender = "male" | "female" | "skip"

export type User = {
  id: number
  full_name: string
  phone: string
  telegram_id?: string | null
  role: UserRole
  age?: number | null
  gender?: Gender | null
  language: "uz" | "ru" | "en"
  timezone?: string
  created_at?: string
  avatar_url?: string
}

export type Disease = "tb" | "hypertension" | "diabetes" | "other" | string

export type Medication = {
  id: number
  name: string
  dosage: string
  disease: Disease | null
  instructions?: string | null
  frequency: 1 | 2 | 3 | 4 | string
  times: string[] // ["08:00", "20:00"]
  start_date: string
  end_date?: string | null
  active?: boolean
  is_active?: boolean
  adherence_rate_30d?: number // 0-100
}

export type DoseStatus = "upcoming" | "taken" | "late" | "missed" | "skipped"

export type Dose = {
  id: number
  medication_id: number
  medication_name: string
  dosage: string
  scheduled_time: string // HH:mm
  scheduled_at?: string // ISO
  status: DoseStatus
  taken_at?: string // ISO
  instructions?: string
  is_predictive_alert?: boolean
  minutes_late?: number
  alert_message?: string | null
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
  requires_urgent_help?: boolean
  suggested_actions?: { label: string; action: string }[]
  dialogue_reason?:
    | "side_effect"
    | "fatigue"
    | "money"
    | "depression"
    | "stigma"
    | "asymptomatic"
    | "forgetfulness"
    | "confusion"
    | "family_support"
    | "unknown"
    | string
  rescue_plan?: {
    root_cause: string
    title: string
    why_it_matters: string
    micro_steps: string[]
    family_task: string
    doctor_note: string
    escalation: "none" | "family" | "doctor" | "emergency" | string
    confidence: number
  }
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
