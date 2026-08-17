"use client"

import type { PatientNotification, User, UserRole } from "./types"

export const AUTH_TOKEN_KEY = "noskipai-token"
export const USER_CACHE_KEY = "noskipai-user"

function resolveApiBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim()
  if (configured) return configured.replace(/\/$/, "")
  if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    return `${window.location.origin}/api`
  }
  return "http://localhost:8000"
}

const API_BASE_URL = resolveApiBaseUrl()

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
  rxcui?: string | null
  rxnorm_name?: string | null
  active_ingredients?: Array<{ rxcui?: string | null; name?: string | null }>
  drug_source?: string | null
  drug_knowledge_snapshot?: Record<string, unknown> | null
  knowledge_checked_at?: string | null
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

export type ChatEscalation = {
  triggered: boolean
  severity: "review" | "caution" | "urgent" | "critical" | string
  reason: string
  doctor_notifications: number
  family_notifications: number
  safety_signal_id: number | null
  message: string
}

export type SuggestedAction = string | {
  id?: string
  label: string
  message?: string
  payload?: Record<string, unknown>
}

export type DailyGuidance = {
  top_signal_id: number | null
  missed_today: number
  late_today: number
  next_dose: string | null
  weakest_medication_pattern: {
    name: string
    due: number
    taken_or_late: number
    missed: number
    late: number
    rate: number
  } | null
}

export type AdherenceSummary = {
  adherence_rate_7d: number
  missed_7d: number
  late_7d: number
  today: Array<{
    medication_id: number
    name: string
    dosage: string
    scheduled_time: string
    status: "upcoming" | "taken" | "late" | "missed" | "skipped" | string
    action: string
  }>
  medications: Array<{
    medication_id: number
    name: string
    dosage: string
    due: number
    taken: number
    late: number
    missed: number
    skipped: number
    rate: number | null
    advice: string
  }>
  recommendation: string
}

export type AdherenceLogAction = {
  medication_id: number
  medication_name: string
  dosage: string
  scheduled_time: string
  status: "taken" | "late" | "missed" | string
  delay_minutes: number
  log_id: number
  message: string
} | null

export type EvidenceCard = {
  source: string
  title: string
  snippet: string
  url?: string | null
  confidence: number
}

export type ChatReply = {
  reply: string
  risk_flag: boolean
  requires_urgent_help?: boolean
  suggested_actions: SuggestedAction[]
  evidence_cards?: EvidenceCard[]
  safety_level?: "safe" | "caution" | "warning" | "critical"
  intent?: string
  dialogue_reason?: RescuePlan["root_cause"]
  rescue_plan?: RescuePlan
  escalation?: ChatEscalation
  medication_intelligence?: MedicationIntelligence
  candidate_medication_safety?: MedicationSafetyCheck
  drug_knowledge?: DrugKnowledge
  daily_guidance?: DailyGuidance
  adherence_summary?: AdherenceSummary
  adherence_log_action?: AdherenceLogAction
  adherence_log_actions?: NonNullable<AdherenceLogAction>[]
  conversation_state?: {
    intent: string
    stage: string
    status: string
    slots: Record<string, unknown>
    last_question: string | null
    expires_at: string
  } | null
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
  active_safety_signals?: number
  latest_safety_signal?: ClinicalSafetySignal | null
}

export type DoctorSafetySignalRow = {
  patient: User
  signal: ClinicalSafetySignal
}

export type DoctorReviewAction = "confirm" | "dismiss" | "modify" | "request_info"

export type DoctorReviewPayload = {
  action: DoctorReviewAction
  note?: string | null
  modified_action?: string | null
}

export type DoctorReviewResponse = {
  id: number
  signal_id: number
  doctor_id: number
  action: string
  note: string | null
  modified_action: string | null
  created_at: string
}

export type DoctorInboxResponse = {
  data: DoctorSafetySignalRow[]
  pagination: { total: number; limit: number; offset: number }
}

export type DoctorReviewResult = {
  data: {
    review: DoctorReviewResponse
    signal: ClinicalSafetySignal
    patient: User | null
  }
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

export type ClinicalProfile = {
  id: number
  patient_id: number
  conditions: string[]
  allergies: string[]
  kidney_disease: boolean
  liver_disease: boolean
  pregnancy_status: "not_applicable" | "not_pregnant" | "pregnant" | "planning" | "unknown" | string | null
  alcohol_use: "none" | "rare" | "weekly" | "daily" | "unknown" | string | null
  weight_kg: number | null
  notes: string | null
  created_at: string | null
  updated_at: string | null
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

export type MedicationInteractionFlag = {
  severity: "review" | "caution" | "urgent" | string
  medications: string[]
  issue: string
  patient_action: string
  doctor_question: string
  evidence_source: string
}

export type MedicationContextSafetyFlag = {
  severity: "review" | "caution" | "urgent" | string
  medication_id: number
  medication_name: string
  related_medications: string[]
  patient_context: string
  issue: string
  patient_action: string
  doctor_question: string
  evidence_source: string
}

export type NormalizedMedication = {
  id: number
  name: string
  dosage: string
  times?: string[]
  doses_per_day?: number
  rxcui: string | null
  rxnorm_name: string | null
  ingredients: Array<{ rxcui: string | null; name: string | null }>
  daily_dose_review?: DrugKnowledge["daily_dose_review"]
  warnings: string[]
  source: string
}

export type MedicationAdherencePattern = {
  medication_id: number
  medication_name: string
  dosage: string
  total_due: number
  taken: number
  late: number
  missed: number
  skipped: number
  upcoming: number
  adherence_rate: number | null
  problem_level: "low" | "medium" | "high" | string
  action_hint: string
  recent_statuses: Array<{
    scheduled_time: string
    local_date: string
    status: "upcoming" | "taken" | "late" | "missed" | "skipped" | string
  }>
}

export type MedicationScheduleAdvisor = {
  safety_level: "ok" | "review" | "caution" | string
  time_blocks: Array<{
    time: string
    medications: Array<{
      id: number
      name: string
      dosage: string
      meal_timing: string
    }>
    level: "ok" | "review" | "caution" | string
    issues: string[]
    doctor_questions: string[]
    patient_action: string
  }>
  medication_rules: Array<{
    medication_id: number
    medication_name: string
    dosage: string
    times: string[]
    meal_timing: string
    timing_message: string
    daily_dose_level: "ok" | "review" | "caution" | "unknown" | string
    daily_dose_message: string
    doctor_questions: string[]
    source: string
  }>
  timing_gap_rules?: Array<{
    severity: "review" | "caution" | string
    medications: string[]
    issue: string
    patient_action: string
    doctor_question: string
    evidence_source: string
    observed_gap_minutes: number | null
    suggested_gap_minutes: number
  }>
  optimization_steps: string[]
  patient_message: string
}

export type MedicationIntelligence = {
  generated_at: string
  patient_id: number
  medications_reviewed: number
  adherence_rate_7d: number
  missed_doses_7d: number
  clinical_profile: ClinicalProfile & { risk_context?: string[] }
  schedule_complexity: {
    active_medications: number
    daily_doses: number
    unique_times: string[]
    level: "low" | "medium" | "high" | string
  }
  normalized_medications: NormalizedMedication[]
  contraindication_flags: MedicationContextSafetyFlag[]
  adherence_patterns: MedicationAdherencePattern[]
  schedule_advisor: MedicationScheduleAdvisor
  potential_interactions: MedicationInteractionFlag[]
  timing_suggestions: string[]
  adherence_insights: string[]
  questions_for_doctor: string[]
  patient_message: string
  stored_safety_signals?: ClinicalSafetySignal[]
  data_sources: string[]
  disclaimer: string
}

export type MedicationSafetyCheckPayload = {
  name: string
  dosage: string
  frequency?: string | null
  times: string[]
  instructions?: string | null
  disease?: string | null
}

export type DrugKnowledge = {
  query: string
  normalized_query: string
  rxcui: string | null
  rxnorm_name: string | null
  term_type: string | null
  ingredients: Array<{ rxcui: string | null; name: string | null }>
  dose_review: {
    raw: string
    amounts: string[]
    units: string[]
    estimated_single_dose_amount_mg: number | null
    dose_count: number | null
    needs_review: boolean
    message: string
  }
  daily_dose_review: {
    doses_per_day: number | null
    estimated_daily_amount_mg: number | null
    level: "ok" | "review" | "caution" | "unknown" | string
    message: string
    source: string
  }
  administration_review: {
    found: boolean
    meal_timing: string
    timing_message: string
    timing_suggestions: string[]
    questions_for_doctor: string[]
    source: string
  }
  label_evidence: {
    found: boolean
    found_by: { field: string; term: string } | null
    set_id: string | null
    effective_time: string | null
    has_boxed_warning: boolean
    has_active_ingredient?: boolean
    has_dosage_and_administration?: boolean
    has_contraindications: boolean
    has_drug_interactions: boolean
    has_warnings: boolean
    snippets: Array<{ section: string; text: string }>
    source: string
  }
  official_sources: Array<{
    name: string
    type: string
    status: "found" | "not_found" | string
    url: string
  }>
  patient_summary: string
  warnings: string[]
  questions_for_doctor: string[]
  source: string
  disclaimer: string
}

export type DrugSearchResult = {
  name: string | null
  rxcui: string | null
  term_type: string | null
  ingredients: Array<{ rxcui: string | null; name: string | null }>
  score: number | null
  source: string
  matched_text: string | null
  official_sources: DrugKnowledge["official_sources"]
}

export type DrugSearchResponse = {
  query: string
  normalized_query: string
  results: DrugSearchResult[]
}

export type MedicationSafetyCheck = Omit<
  MedicationIntelligence,
  "adherence_rate_7d" | "missed_doses_7d" | "adherence_patterns" | "data_sources"
> & {
  candidate: {
    id: number
    name: string
    dosage: string
    frequency: string
    times: string[]
    disease: string | null
    instructions: string | null
  }
  drug_knowledge: DrugKnowledge
  current_medications: Array<{
    id: number
    name: string
    dosage: string
    frequency: string
    times: string[]
    disease: string | null
    instructions: string | null
  }>
  review_required: boolean
  recommendation_level: "ok" | "review" | "caution" | "urgent" | string
  patient_context_interactions?: MedicationInteractionFlag[]
  patient_context_flags?: MedicationContextSafetyFlag[]
}

export type ClinicalSafetySignal = {
  id: number | null
  patient_id: number
  rule_code: string
  source: string
  severity: "info" | "review" | "caution" | "urgent" | "critical" | string
  title: string
  message: string
  action: string
  related_data: Record<string, unknown>
  status: string
  created_at: string | null
  updated_at?: string | null
}

export type ClinicalEvaluation = {
  generated_at: string
  patient_id: number
  live_signals: ClinicalSafetySignal[]
  stored_signals: ClinicalSafetySignal[]
  summary: string
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

export type ChatImageMedicationCard = {
  suggestion: PrescriptionMedicationSuggestion
  drug_knowledge: DrugKnowledge
  medication_safety: MedicationSafetyCheck | null
}

export type ChatImageReply = {
  reply: string
  risk_flag: boolean
  suggested_actions: SuggestedAction[]
  prescription: PrescriptionReadResult
  medication_cards: ChatImageMedicationCard[]
}

type ApiEnvelope<T> = { data: T } | { error: { code?: string; message?: string; details?: unknown } }

function storedToken() {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(AUTH_TOKEN_KEY)
}

function handleSessionExpired() {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(AUTH_TOKEN_KEY)
  window.localStorage.removeItem(USER_CACHE_KEY)
  if (window.location.pathname !== "/login") {
    window.location.href = "/login"
  }
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
  let body: ApiEnvelope<T>
  try {
    body = text ? (JSON.parse(text) as ApiEnvelope<T>) : ({} as ApiEnvelope<T>)
  } catch {
    const contentType = response.headers.get("content-type") || "unknown"
    throw new Error(`Backend JSON qaytarmadi (${response.status}, ${contentType}). API URL noto'g'ri bo'lishi mumkin: ${API_BASE_URL}${path}`)
  }
  if (!response.ok) {
    const isAuthEndpoint = path.startsWith("/auth/login") || path.startsWith("/auth/register")
    if (response.status === 401 && !isAuthEndpoint) {
      handleSessionExpired()
    }
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

  clinicalProfile() {
    return apiFetch<ClinicalProfile>("/users/me/clinical-profile")
  },

  updateClinicalProfile(
    payload: Partial<
      Pick<
        ClinicalProfile,
        | "conditions"
        | "allergies"
        | "kidney_disease"
        | "liver_disease"
        | "pregnancy_status"
        | "alcohol_use"
        | "weight_kg"
        | "notes"
      >
    >,
  ) {
    return apiFetch<ClinicalProfile>("/users/me/clinical-profile", {
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

  medicationDrugKnowledge(id: number) {
    return apiFetch<DrugKnowledge>(`/medications/${id}/drug-knowledge`, { method: "POST" })
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

  chatImage(payload: { image_base64: string; mime_type: string; message?: string | null }) {
    return apiFetch<ChatImageReply>("/ai/chat-image", {
      method: "POST",
      body: jsonBody(payload),
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

  medicationIntelligence(persistSafety = false) {
    const suffix = persistSafety ? "?persist_safety=true" : ""
    return apiFetch<MedicationIntelligence>(`/ai/medication-intelligence${suffix}`)
  },

  medicationSafetyCheck(payload: MedicationSafetyCheckPayload) {
    return apiFetch<MedicationSafetyCheck>("/ai/medication-safety-check", {
      method: "POST",
      body: jsonBody(payload),
    })
  },

  clinicalSafetySignals(persist = false) {
    return persist
      ? apiFetch<ClinicalEvaluation>("/clinical/safety-signals/evaluate", { method: "POST" })
      : apiFetch<ClinicalEvaluation>("/clinical/safety-signals")
  },

  drugKnowledge(name: string, dosage?: string, dosesPerDay?: number) {
    const params = new URLSearchParams({ name })
    if (dosage) params.set("dosage", dosage)
    if (dosesPerDay) params.set("doses_per_day", String(dosesPerDay))
    return apiFetch<DrugKnowledge>(`/ai/drug-knowledge?${params.toString()}`)
  },

  drugSearch(query: string, limit = 6) {
    const params = new URLSearchParams({ query, limit: String(limit) })
    return apiFetch<DrugSearchResponse>(`/ai/drug-search?${params.toString()}`)
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

  doctorSafetySignals(statusValue = "active", limit = 50) {
    return apiFetch<DoctorSafetySignalRow[]>(
      `/doctor/safety-signals?status_value=${encodeURIComponent(statusValue)}&limit=${limit}`,
    )
  },

  resolveDoctorSafetySignal(signalId: number) {
    return apiFetch<DoctorSafetySignalRow>(`/doctor/safety-signals/${signalId}/resolve`, { method: "POST" })
  },

  doctorInbox(limit = 20, offset = 0) {
    return apiFetch<DoctorInboxResponse>(`/doctor/inbox?limit=${limit}&offset=${offset}`)
  },

  doctorReviewSignal(signalId: number, payload: DoctorReviewPayload) {
    return apiFetch<DoctorReviewResult>(`/doctor/review/${signalId}`, {
      method: "POST",
      body: jsonBody(payload),
    })
  },

  doctorReviewHistory(limit = 50) {
    return apiFetch<{ data: Array<{ review: DoctorReviewResponse; signal: ClinicalSafetySignal | null }> }>(`/doctor/reviews?limit=${limit}`)
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

  aiFeedback(payload: { message_content: string; rating: "up" | "down"; comment?: string }) {
    return apiFetch<{ id: number; status: string }>("/ai/feedback", {
      method: "POST",
      body: jsonBody(payload),
    })
  },

  notifications(unreadOnly = false) {
    const params = unreadOnly ? "?unread_only=true" : ""
    return apiFetch<{ notifications: PatientNotification[]; unread_count: number }>(`/users/me/notifications${params}`)
  },

  markNotificationRead(id: number) {
    return apiFetch<{ id: number; is_read: boolean }>(`/users/me/notifications/${id}/read`, { method: "PUT" })
  },

  markAllNotificationsRead() {
    return apiFetch<{ status: string }>("/users/me/notifications/read-all", { method: "PUT" })
  },
}
