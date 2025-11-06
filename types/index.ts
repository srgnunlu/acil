import type {
  Demographics,
  Anamnesis,
  Medication,
  VitalSigns,
  MedicalHistory,
  LabResults,
  ImagingResult,
  AIAnalysisResponse,
} from './patient.types'

// Re-export all patient types
export * from './patient.types'

export interface Patient {
  id: string
  user_id: string
  name: string
  age: number | null
  gender: string | null
  created_at: string
  updated_at: string
  status: 'active' | 'discharged' | 'consultation'
}

export type PatientDataContent =
  | Demographics
  | Anamnesis
  | Medication[]
  | VitalSigns
  | MedicalHistory

export interface PatientData {
  id: string
  patient_id: string
  data_type: 'demographics' | 'anamnesis' | 'medications' | 'vital_signs' | 'history'
  content: PatientDataContent
  created_at: string
}

export type TestResults = LabResults | ImagingResult | Record<string, unknown>

export interface PatientTest {
  id: string
  patient_id: string
  test_type: string
  results: TestResults
  images?: string[]
  created_at: string
}

export interface AIAnalysis {
  id: string
  patient_id: string
  analysis_type: 'initial' | 'updated'
  input_data: Record<string, unknown>
  ai_response: AIAnalysisResponse
  references?: AIAnalysisResponse['references']
  created_at: string
}

export interface ChatMessage {
  id: string
  patient_id: string
  user_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface Profile {
  id: string
  user_id: string
  full_name: string | null
  specialty: string | null
  institution: string | null
  subscription_tier: 'free' | 'pro'
  patient_limit: number
  created_at: string
  updated_at: string
}

export interface Reminder {
  id: string
  user_id: string
  patient_id: string
  reminder_type: string
  scheduled_time: string
  status: 'pending' | 'sent' | 'dismissed'
  created_at: string
}
