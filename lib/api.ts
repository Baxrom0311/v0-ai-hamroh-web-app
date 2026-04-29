"use client"

import type { User, UserRole } from "./types"

export const AUTH_TOKEN_KEY = "noskipai-token"

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "")

export type ApiSession = {
  user: User
  access_token: string
  token_type: string
}

export type ApiMedication = {
  id: number
  patient_id: number
  name: string
  dosage: string
  frequency: string
  times: string[]
  start_date: string
  end_date: string | null
  instructions: string | null
  disease: string | null
  is_active: boolean
  created_at: string
}

export type TodayDose = {
  medication_id: number
  name: string
  dosage: string
  scheduled_time: string
  status: "upcoming" | "taken" | "late" | "missed" | "skipped"
  instructions: string | null
  is_predictive_alert?: boolean
  minutes_late?: number
  alert_message?: string | null
}

export type SideEffectCalendarCard = {
  medication_id: number
  medication_name: string
  treatment_day: number
  expected_day: number
  date: string
  window_label: string
  title: string
  message: string
  action: string
  severity: "normal" | "watch" | "urgent" | string
  is_today: boolean
}

export type SideEffectCalendar = {
  generated_at: string
  summary: string
  today: SideEffectCalendarCard[]
  upcoming: SideEffectCalendarCard[]
  red_flags: string[]
  patient_message: string
}

export type AdherenceLog = {
  id: number
  medication_id: number
  patient_id: number
  scheduled_time: string
  taken_at: string | null
  status: "taken" | "late" | "missed" | "skipped"
  delay_minutes: number
  notes: string | null
  mood: string | null
  side_effects: string | null
  created_at: string
}

export type AdherenceStats = {
  adherence_rate_7d: number
  adherence_rate_30d: number
  total_doses: number
  taken: number
  missed: number
  late: number
  current_streak: number
  longest_streak: number
  by_medication: Array<{ medication_id: number; name: string; rate: number }>
}

export type PatientAnalytics = {
  today: { scheduled: number; taken: number; upcoming: number; missed: number }
  week: { adherence_rate: number; trend: string; by_day: { date: string; rate: number }[] }
  month: { adherence_rate: number }
  streak: { current: number; longest: number }
  risk: { current_score: number; current_level: RiskLevel }
}

export type RiskLevel = "low" | "medium" | "high" | "critical"

export type ApiRisk = {
  id: number
  patient_id: number
  risk_score: number
  risk_level: RiskLevel
  factors: Array<string | { label?: string; name?: string; description?: string; impact?: number; reason?: string }>
  ai_analysis: string
  created_at: string
}

export type ChatHistoryItem = {
  role: "user" | "assistant"
  content: string
  timestamp: string
}

export type RescuePlan = {
  root_cause:
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
  title: string
  why_it_matters: string
  micro_steps: string[]
  family_task: string
  doctor_note: string
  escalation: "none" | "family" | "doctor" | "emergency" | string
  confidence: number
}

export type ChatReply = {
  reply: string
  risk_flag: boolean
  requires_urgent_help?: boolean
  suggested_actions: string[]
  dialogue_reason?: RescuePlan["root_cause"]
  rescue_plan?: RescuePlan
}

export type CheckInReply = {
  ai_response: string
  suggested_action: string
}

export type FamilyConnection = {
  id: number
  relationship: string
  is_approved: boolean
  notify_on_miss: boolean
  notify_on_high_risk: boolean
  role_in_connection: "patient" | "family"
  patient: User | null
  family_member: User | null
}

export type FamilyPatientStatus = {
  patient_name: string
  today_status: { scheduled: number; taken: number; upcoming: number; missed: number }
  adherence_rate_7d: number
  current_risk_level: RiskLevel
  last_taken_at: string | null
  alerts: string[]
}

export type FamilyObservation = {
  id: number
  family_member_id: number
  patient_id: number
  date: string
  mood_signal: "good" | "tired" | "bad" | string
  took_medication: boolean
  notes: string | null
  created_at: string
}

export type FamilyObservationMismatch = {
  date: string
  has_mismatch: boolean
  signals: string[]
  family_observation_count: number
  patient_taken_logged: boolean
  patient_missed_logged: boolean
  message: string
}

export type FamilyObservationResult = {
  observation: FamilyObservation
  mismatch: FamilyObservationMismatch
}

export type FamilyObservationSummary = {
  observations: FamilyObservation[]
  mismatch: FamilyObservationMismatch
}

export type DoctorPatientRow = {
  patient: User
  latest_risk_level: RiskLevel
  latest_risk_score: number
  adherence_rate_7d: number
  last_seen: string | null
}

export type PublicAppConfig = {
  app_name: string
  gemini_enabled: boolean
  telegram_worker_enabled: boolean
  telegram_bot_username: string | null
  visual_dot_enabled?: boolean
  voice_chat_enabled?: boolean
  family_observation_enabled?: boolean
}

export type TelegramLinkCode = {
  code: string
  expires_at: string
}

export type MedicationPhotoVerification = {
  pill_visible: boolean
  medication_match: "yes" | "possible" | "no" | "unknown" | string
  confidence: number
  detected_text: string[]
  observations: string[]
  patient_message: string
  warnings: string[]
}

export type PillBottleAuditResult = {
  audit_id: number
  medication_id: number
  medication_name: string
  starting_count: number
  treatment_days: number
  doses_per_day: number
  expected_taken: number
  expected_remaining: number
  container_visible: boolean
  visible_count: number | null
  count_confidence: number
  medication_match: "yes" | "possible" | "no" | "unknown" | string
  readable_text: string[]
  observations: string[]
  warnings: string[]
  patient_message: string
  signal: "on_track" | "possible_missed" | "possible_extra_taken" | "unknown" | string
  difference: number | null
  risk_flag: boolean
}

export type VisualDotVerification = {
  face_visible: boolean
  pill_visible: boolean
  mouth_or_swallow_visible: boolean
  ingestion_likely: boolean
  medication_match: "yes" | "possible" | "no" | "unknown" | string
  confidence: number
  observations: string[]
  patient_message: string
  warnings: string[]
  verified: boolean
  marked_taken: boolean
  adherence_log: AdherenceLog | null
}

export type VoiceChatResult = {
  transcript: string
  reply: string
  voice_base64: string | null
  voice_mime_type: string | null
}

export type MdrCostCalculator = {
  generated_at: string
  patient_id: number
  treatment_day: number
  adherence_rate_30d: number
  missed_doses_30d: number
  consecutive_missed: number
  risk_percent: number
  risk_level: RiskLevel
  current_course: { remaining_days: number | null; expected_outcome: string }
  mdr_scenario: {
    duration_months: string
    estimated_cost_usd: number
    clinic_visits: string
    family_impact: string[]
  }
  patient_message: string
  disclaimer: string
}

export type SoapNote = {
  generated_at: string
  patient_id: number
  ai_generated: boolean
  subjective: string
  objective: string
  assessment: string
  plan: string[]
  red_flags: string[]
}

export type PrescriptionMedicationSuggestion = {
  name: string | null
  dosage: string | null
  frequency: string | null
  times: string[]
  instructions: string | null
  disease: string | null
  confidence: number
}

export type PrescriptionReadResult = {
  medications: PrescriptionMedicationSuggestion[]
  summary: string
  warnings: string[]
}

type ApiEnvelope<T> = { data: T } | { error: { code?: string; message?: string; details?: unknown } }

function storedToken() {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(AUTH_TOKEN_KEY)
}

function errorMessage(body: unknown, fallback: string) {
  if (body && typeof body === "object") {
    const maybe = body as { error?: { message?: string }; detail?: { message?: string } | string }
    if (maybe.error?.message) return maybe.error.message
    if (typeof maybe.detail === "string") return maybe.detail
    if (maybe.detail?.message) return maybe.detail.message
  }
  return fallback
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  const hasBody = init.body !== undefined && init.body !== null
  if (hasBody && !headers.has("Content-Type")) headers.set("Content-Type", "application/json")
  const token = storedToken()
  if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`)

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
    })
  } catch {
    throw new Error("Backendga ulanib bo'lmadi. Avval ./run_demo.sh ni ishga tushiring.")
  }

  const text = await response.text()
  const body = text ? (JSON.parse(text) as ApiEnvelope<T>) : ({} as ApiEnvelope<T>)
  if (!response.ok) {
    throw new Error(errorMessage(body, `HTTP ${response.status}`))
  }
  if ("data" in body) return body.data
  return body as T
}

function jsonBody(value: unknown) {
  return JSON.stringify(value)
}

export function setStoredToken(token: string | null) {
  if (typeof window === "undefined") return
  if (token) window.localStorage.setItem(AUTH_TOKEN_KEY, token)
  else window.localStorage.removeItem(AUTH_TOKEN_KEY)
}

export const api = {
  login(phone: string, password: string) {
    return apiFetch<ApiSession>("/auth/login", {
      method: "POST",
      body: jsonBody({ phone, password }),
    })
  },

  register(payload: {
    full_name: string
    phone: string
    password: string
    role: UserRole
    age?: number
    gender?: "male" | "female" | null
    language?: "uz" | "ru" | "en"
  }) {
    return apiFetch<ApiSession>("/auth/register", {
      method: "POST",
      body: jsonBody({ ...payload, timezone: "Asia/Tashkent" }),
    })
  },

  me() {
    return apiFetch<User>("/users/me")
  },

  updateMe(payload: Partial<Pick<User, "full_name" | "age" | "gender" | "language" | "timezone" | "privacy_mode">>) {
    return apiFetch<User>("/users/me", {
      method: "PUT",
      body: jsonBody(payload),
    })
  },

  appConfig() {
    return apiFetch<PublicAppConfig>("/public/app-config")
  },

  medications() {
    return apiFetch<ApiMedication[]>("/medications")
  },

  createMedication(payload: {
    name: string
    dosage: string
    frequency: string
    times: string[]
    start_date: string
    end_date?: string | null
    instructions?: string | null
    disease?: string | null
  }) {
    return apiFetch<ApiMedication>("/medications", {
      method: "POST",
      body: jsonBody(payload),
    })
  },

  deleteMedication(id: number) {
    return apiFetch<{ deleted: boolean; id: number }>(`/medications/${id}`, { method: "DELETE" })
  },

  todayDoses() {
    return apiFetch<TodayDose[]>("/medications/today")
  },

  sideEffectCalendar() {
    return apiFetch<SideEffectCalendar>("/medications/side-effect-calendar")
  },

  logDoseTaken(payload: {
    medication_id: number
    scheduled_time: string
    taken_at: string
    mood?: "good" | "tired" | "sick" | null
    notes?: string | null
  }) {
    return apiFetch<AdherenceLog>("/adherence/log", {
      method: "POST",
      body: jsonBody(payload),
    })
  },

  markDoseMissed(payload: { medication_id: number; scheduled_time: string; notes?: string | null }) {
    return apiFetch<AdherenceLog>("/adherence/missed", {
      method: "POST",
      body: jsonBody(payload),
    })
  },

  adherenceStats() {
    return apiFetch<AdherenceStats>("/adherence/stats")
  },

  adherenceHistory(days = 30) {
    return apiFetch<AdherenceLog[]>(`/adherence/history?days=${days}`)
  },

  patientAnalytics() {
    return apiFetch<PatientAnalytics>("/analytics/patient/me")
  },

  currentRisk() {
    return apiFetch<ApiRisk>("/risk/current")
  },

  assessRisk() {
    return apiFetch<ApiRisk>("/risk/assess", { method: "POST" })
  },

  chat(message: string) {
    return apiFetch<ChatReply>("/ai/chat", {
      method: "POST",
      body: jsonBody({ message }),
    })
  },

  chatHistory(limit = 50) {
    return apiFetch<ChatHistoryItem[]>(`/ai/chat/history?limit=${limit}`)
  },

  checkIn(mood: "good" | "tired" | "sick", feelings?: string) {
    return apiFetch<CheckInReply>("/ai/check-in", {
      method: "POST",
      body: jsonBody({ mood, feelings }),
    })
  },

  verifyMedicationPhoto(payload: {
    image_base64: string
    mime_type: string
    medication_id?: number
  }) {
    return apiFetch<MedicationPhotoVerification>("/ai/verify-medication-photo", {
      method: "POST",
      body: jsonBody(payload),
    })
  },

  auditPillBottle(
    medicationId: number,
    payload: {
      image_base64: string
      mime_type: string
      starting_count?: number
    },
  ) {
    return apiFetch<PillBottleAuditResult>(`/medications/${medicationId}/pill-audit`, {
      method: "POST",
      body: jsonBody(payload),
    })
  },

  readPrescription(payload: { image_base64: string; mime_type: string }) {
    return apiFetch<PrescriptionReadResult>("/ai/read-prescription", {
      method: "POST",
      body: jsonBody(payload),
    })
  },

  verifyDoseVideo(payload: {
    frames: Array<{ image_base64: string; mime_type: string }>
    medication_id?: number
    scheduled_time?: string
  }) {
    return apiFetch<VisualDotVerification>("/adherence/visual-confirm", {
      method: "POST",
      body: jsonBody(payload),
    })
  },

  voiceChat(payload: { audio_base64: string; mime_type: string }) {
    return apiFetch<VoiceChatResult>("/ai/voice-chat", {
      method: "POST",
      body: jsonBody(payload),
    })
  },

  mdrCostCalculator() {
    return apiFetch<MdrCostCalculator>("/ai/mdr-cost-calculator")
  },

  familyList() {
    return apiFetch<FamilyConnection[]>("/family/list")
  },

  familyPatientStatus(patientId?: number) {
    const suffix = patientId ? `?patient_id=${patientId}` : ""
    return apiFetch<FamilyPatientStatus>(`/family/patient-status${suffix}`)
  },

  createFamilyObservation(payload: {
    patient_id: number
    mood_signal: "good" | "tired" | "bad"
    took_medication: boolean
    notes?: string | null
    date?: string
  }) {
    return apiFetch<FamilyObservationResult>("/family/observations", {
      method: "POST",
      body: jsonBody(payload),
    })
  },

  familyObservations(patientId: number, limit = 14) {
    return apiFetch<FamilyObservationSummary>(`/family/observations/${patientId}?limit=${limit}`)
  },

  doctorPatients() {
    return apiFetch<DoctorPatientRow[]>("/doctor/patients")
  },

  doctorSoapNote(patientId: number) {
    return apiFetch<SoapNote>(`/doctor/patient/${patientId}/soap-note`)
  },

  doctorHighRiskPatients() {
    return apiFetch<DoctorPatientRow[]>("/doctor/high-risk-patients")
  },

  telegramLinkCode() {
    return apiFetch<TelegramLinkCode>("/users/me/telegram-link-code", { method: "POST" })
  },
}
