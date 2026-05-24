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
  privacy_mode?: boolean
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
  rxcui?: string | null
  rxnorm_name?: string | null
  active_ingredients?: Array<{ rxcui?: string | null; name?: string | null }>
  drug_source?: string | null
  drug_knowledge_snapshot?: Record<string, unknown> | null
  knowledge_checked_at?: string | null
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

export type ChatDrugKnowledge = {
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
    level: string
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
  official_sources?: Array<{
    name: string
    type: string
    status: string
    url: string
  }>
  patient_summary: string
  warnings: string[]
  questions_for_doctor: string[]
  source: string
  disclaimer: string
}

export type ChatMessage = {
  id: number
  role: ChatRole
  content: string
  timestamp: string
  risk_flag?: boolean
  requires_urgent_help?: boolean
  suggested_actions?: { id?: string; label: string; action: string }[]
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
  escalation?: {
    triggered: boolean
    severity: "review" | "caution" | "urgent" | "critical" | string
    reason: string
    doctor_notifications: number
    family_notifications: number
    safety_signal_id: number | null
    message: string
  }
  medication_intelligence?: {
    medications_reviewed: number
    adherence_rate_7d: number
    missed_doses_7d: number
    schedule_complexity: {
      active_medications: number
      daily_doses: number
      unique_times: string[]
      level: string
    }
    normalized_medications?: Array<{
      id: number
      name: string
      dosage: string
      times?: string[]
      doses_per_day?: number
      rxcui: string | null
      rxnorm_name: string | null
      ingredients: Array<{ rxcui: string | null; name: string | null }>
      daily_dose_review?: {
        doses_per_day: number | null
        estimated_daily_amount_mg: number | null
        level: string
        message: string
        source: string
      }
      warnings: string[]
      source: string
    }>
    contraindication_flags?: Array<{
      severity: "review" | "caution" | "urgent" | string
      medication_id: number
      medication_name: string
      related_medications: string[]
      patient_context: string
      issue: string
      patient_action: string
      doctor_question: string
      evidence_source: string
    }>
    adherence_patterns?: Array<{
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
        status: DoseStatus | string
      }>
    }>
    schedule_advisor?: {
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
    potential_interactions: Array<{
      severity: string
      medications: string[]
      issue: string
      patient_action: string
      doctor_question: string
      evidence_source: string
    }>
    timing_suggestions: string[]
    adherence_insights: string[]
    questions_for_doctor: string[]
    patient_message: string
    disclaimer: string
  }
  candidate_medication_safety?: {
    candidate: {
      id: number
      name: string
      dosage: string
      frequency: string
      times: string[]
      disease: string | null
      instructions: string | null
    }
    review_required: boolean
    recommendation_level: "ok" | "review" | "caution" | "urgent" | string
    patient_message: string
    drug_knowledge?: ChatDrugKnowledge
    potential_interactions: Array<{
      severity: string
      medications: string[]
      issue: string
      patient_action: string
      doctor_question: string
      evidence_source: string
    }>
    patient_context_interactions?: Array<{
      severity: string
      medications: string[]
      issue: string
      patient_action: string
      doctor_question: string
      evidence_source: string
    }>
    contraindication_flags?: Array<{
      severity: string
      medication_id: number
      medication_name: string
      related_medications: string[]
      patient_context: string
      issue: string
      patient_action: string
      doctor_question: string
      evidence_source: string
    }>
    patient_context_flags?: Array<{
      severity: string
      medication_id: number
      medication_name: string
      related_medications: string[]
      patient_context: string
      issue: string
      patient_action: string
      doctor_question: string
      evidence_source: string
    }>
    schedule_advisor?: {
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
    timing_suggestions: string[]
    questions_for_doctor: string[]
    disclaimer: string
  }
  drug_knowledge?: ChatDrugKnowledge
  daily_guidance?: {
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
  adherence_summary?: {
    adherence_rate_7d: number
    missed_7d: number
    late_7d: number
    today: Array<{
      medication_id: number
      name: string
      dosage: string
      scheduled_time: string
      status: DoseStatus | string
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
  adherence_log_action?: {
    medication_id: number
    medication_name: string
    dosage: string
    scheduled_time: string
    status: "taken" | "late" | "missed" | string
    delay_minutes: number
    log_id: number
    message: string
  } | null
  adherence_log_actions?: Array<{
    medication_id: number
    medication_name: string
    dosage: string
    scheduled_time: string
    status: "taken" | "late" | "missed" | string
    delay_minutes: number
    log_id: number
    message: string
  }>
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
