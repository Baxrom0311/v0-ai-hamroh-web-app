import type {
  AdherenceLogEntry,
  ChatMessage,
  DailyAdherence,
  DoctorPatient,
  Dose,
  FamilyMember,
  Medication,
  RiskAssessment,
  User,
} from "./types"

export const MOCK_PATIENT: User = {
  id: 1,
  full_name: "Aziza Karimova",
  phone: "+998901111111",
  role: "patient",
  age: 45,
  gender: "female",
  language: "uz",
}

export const MOCK_FAMILY_USER: User = {
  id: 2,
  full_name: "Bobur Karimov",
  phone: "+998902222222",
  role: "family",
  age: 48,
  gender: "male",
  language: "uz",
}

export const MOCK_DOCTOR_USER: User = {
  id: 3,
  full_name: "Dr. Sanjar Aliyev",
  phone: "+998903333333",
  role: "doctor",
  age: 52,
  gender: "male",
  language: "uz",
}

const today = new Date().toISOString().slice(0, 10)
const start = new Date()
start.setDate(start.getDate() - 28)
const startISO = start.toISOString().slice(0, 10)

export const MOCK_MEDICATIONS: Medication[] = [
  {
    id: 1,
    name: "Изониазид",
    dosage: "300 mg",
    disease: "tb",
    instructions: "Ovqatdan oldin",
    frequency: 2,
    times: ["08:00", "20:00"],
    start_date: startISO,
    end_date: null,
    active: true,
    adherence_rate_30d: 92,
  },
  {
    id: 2,
    name: "Рифампицин",
    dosage: "600 mg",
    disease: "tb",
    instructions: "Ovqatdan keyin",
    frequency: 1,
    times: ["08:00"],
    start_date: startISO,
    end_date: null,
    active: true,
    adherence_rate_30d: 88,
  },
  {
    id: 3,
    name: "Pyrazinamide",
    dosage: "1500 mg",
    disease: "tb",
    instructions: "Ko'p suv bilan",
    frequency: 1,
    times: ["14:00"],
    start_date: startISO,
    end_date: null,
    active: true,
    adherence_rate_30d: 76,
  },
]

// 5 doses today with realistic statuses (3 taken, 2 upcoming)
export const MOCK_TODAY_DOSES: Dose[] = [
  {
    id: 101,
    medication_id: 1,
    medication_name: "Изониазид",
    dosage: "300 mg",
    scheduled_time: "08:00",
    status: "taken",
    taken_at: `${today}T08:05:00Z`,
    instructions: "Ovqatdan oldin",
  },
  {
    id: 102,
    medication_id: 2,
    medication_name: "Рифампицин",
    dosage: "600 mg",
    scheduled_time: "08:00",
    status: "taken",
    taken_at: `${today}T08:05:00Z`,
    instructions: "Ovqatdan keyin",
  },
  {
    id: 103,
    medication_id: 3,
    medication_name: "Pyrazinamide",
    dosage: "1500 mg",
    scheduled_time: "14:00",
    status: "taken",
    taken_at: `${today}T14:12:00Z`,
    instructions: "Ko'p suv bilan",
  },
  {
    id: 104,
    medication_id: 1,
    medication_name: "Изониазид",
    dosage: "300 mg",
    scheduled_time: "20:00",
    status: "upcoming",
    instructions: "Ovqatdan oldin",
  },
  {
    id: 105,
    medication_id: 2,
    medication_name: "Рифампицин",
    dosage: "600 mg",
    scheduled_time: "20:00",
    status: "upcoming",
    instructions: "Ovqatdan keyin",
  },
]

export const MOCK_RISK: RiskAssessment = {
  score: 67,
  level: "high",
  factors: [
    { label: "So'nggi 7 kunda 3 dozani o'tkazib yubordi", impact: 30 },
    { label: "AI suhbatlarda charchoq belgilari", impact: 18 },
    { label: "Davolanishning 4-haftasi (kritik davr)", impact: 12 },
    { label: "Yon ta'sirlar haqida xabar", impact: 7 },
  ],
  updated_at: new Date().toISOString(),
}

// Generate 30 days of adherence with a recent decline
export function generateAdherenceHistory(): DailyAdherence[] {
  const out: DailyAdherence[] = []
  const todayDate = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(todayDate)
    d.setDate(d.getDate() - i)
    const date = d.toISOString().slice(0, 10)
    const scheduled = 5
    // High adherence early, declining last 7 days
    let rate: number
    if (i > 7) {
      rate = 90 + Math.floor(Math.random() * 11) // 90-100
    } else if (i > 3) {
      rate = 60 + Math.floor(Math.random() * 30) // 60-90
    } else if (i === 0) {
      rate = 60 // today: 3/5 taken so far
    } else {
      rate = 40 + Math.floor(Math.random() * 40) // 40-80
    }
    const taken = Math.round((rate / 100) * scheduled)
    out.push({ date, scheduled, taken, rate: Math.round((taken / scheduled) * 100) })
  }
  return out
}

export const MOCK_ADHERENCE_HISTORY = generateAdherenceHistory()

export const MOCK_RECENT_LOGS: AdherenceLogEntry[] = [
  {
    id: 1,
    medication_id: 3,
    medication_name: "Pyrazinamide",
    scheduled_time: "14:00",
    status: "taken",
    taken_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    late_minutes: 12,
  },
  {
    id: 2,
    medication_id: 1,
    medication_name: "Изониазид",
    scheduled_time: "08:00",
    status: "taken",
    taken_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    late_minutes: 5,
  },
  {
    id: 3,
    medication_id: 2,
    medication_name: "Рифампицин",
    scheduled_time: "08:00",
    status: "taken",
    taken_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 4,
    medication_id: 1,
    medication_name: "Изониазид",
    scheduled_time: "20:00",
    status: "missed",
    taken_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    notes: "Ishda qoldim",
  },
  {
    id: 5,
    medication_id: 3,
    medication_name: "Pyrazinamide",
    scheduled_time: "14:00",
    status: "taken",
    taken_at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
  },
]

export const MOCK_FAMILY: FamilyMember[] = [
  { id: 1, full_name: "Bobur Karimov", phone: "+998902222222", relationship: "Er" },
  { id: 2, full_name: "Olim Karimov", phone: "+998904444444", relationship: "O'g'il" },
]

export const MOCK_CHAT_HISTORY: ChatMessage[] = [
  {
    id: 1,
    role: "assistant",
    content:
      "Salom Aziza opa! Men sizning AI Hamrohingizman. Davolanishingiz haqida har qanday savol bera olasiz.",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    role: "user",
    content: "Bugun ozgina charchadim, davolanmasam bo'ladimi?",
    timestamp: new Date(Date.now() - 23.5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    role: "assistant",
    content:
      "Sizni tushunaman, Aziza opa. Charchoq — TB davolanishida tez-tez uchrab turadi va bu butunlay normal. Lekin dorini o'tkazib yuborish davolanishni 6 oydan 9 oygacha cho'zishi mumkin va kasallik qaytishi xavfini oshiradi. Bugun atigi bitta dozani o'tkazib yubormaylik. Stakanga suv quying — men sizga 3 daqiqa kutib turaman.",
    timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
    suggested_actions: [
      { label: "Dorini ichdim", action: "log_taken" },
      { label: "Shifokorga aytish", action: "contact_doctor" },
    ],
  },
]

export const MOCK_DOCTOR_PATIENTS: DoctorPatient[] = [
  {
    id: 1,
    full_name: "Aziza Karimova",
    age: 45,
    disease: "tb",
    risk: MOCK_RISK,
    adherence_rate_30d: 67,
    adherence_sparkline: MOCK_ADHERENCE_HISTORY.map((d) => d.rate),
    last_seen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    phone: "+998901111111",
  },
  {
    id: 2,
    full_name: "Rustam Yusupov",
    age: 58,
    disease: "hypertension",
    risk: { score: 82, level: "critical", factors: [], updated_at: new Date().toISOString() },
    adherence_rate_30d: 41,
    adherence_sparkline: Array.from({ length: 30 }, () => 30 + Math.floor(Math.random() * 50)),
    last_seen: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    phone: "+998905555555",
  },
  {
    id: 3,
    full_name: "Malika Tashkentova",
    age: 62,
    disease: "diabetes",
    risk: { score: 54, level: "medium", factors: [], updated_at: new Date().toISOString() },
    adherence_rate_30d: 78,
    adherence_sparkline: Array.from({ length: 30 }, () => 65 + Math.floor(Math.random() * 30)),
    last_seen: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    phone: "+998906666666",
  },
  {
    id: 4,
    full_name: "Jamshid Ergashev",
    age: 41,
    disease: "hypertension",
    risk: { score: 28, level: "low", factors: [], updated_at: new Date().toISOString() },
    adherence_rate_30d: 95,
    adherence_sparkline: Array.from({ length: 30 }, () => 85 + Math.floor(Math.random() * 15)),
    last_seen: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    phone: "+998907777777",
  },
  {
    id: 5,
    full_name: "Dilnoza Abdullaeva",
    age: 36,
    disease: "tb",
    risk: { score: 19, level: "low", factors: [], updated_at: new Date().toISOString() },
    adherence_rate_30d: 98,
    adherence_sparkline: Array.from({ length: 30 }, () => 92 + Math.floor(Math.random() * 8)),
    last_seen: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    phone: "+998908888888",
  },
  {
    id: 6,
    full_name: "Sherzod Mirzaev",
    age: 50,
    disease: "diabetes",
    risk: { score: 47, level: "medium", factors: [], updated_at: new Date().toISOString() },
    adherence_rate_30d: 71,
    adherence_sparkline: Array.from({ length: 30 }, () => 60 + Math.floor(Math.random() * 30)),
    last_seen: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    phone: "+998909999999",
  },
]
