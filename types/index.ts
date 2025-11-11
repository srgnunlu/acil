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

import type { WorkflowState } from './multi-tenant.types'

// Re-export all types
export * from './patient.types'
export * from './multi-tenant.types'
export * from './realtime.types'

export interface Patient {
  id: string
  user_id: string
  name: string
  age: number | null
  gender: string | null
  created_at: string
  updated_at: string

  // Legacy (deprecated - replaced by category_id)
  status?: 'active' | 'discharged' | 'consultation'

  // Multi-tenant fields
  workspace_id?: string | null
  organization_id?: string | null
  category_id?: string | null
  assigned_to?: string | null

  // Dates
  admission_date?: string | null
  discharge_date?: string | null

  // Workflow
  workflow_state?: WorkflowState

  // Soft delete
  deleted_at?: string | null
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

export interface NotificationPreferences {
  email: boolean
  push: boolean
  sms: boolean
  mention: boolean
  assignment: boolean
  critical_alerts: boolean
  patient_updates: boolean
  daily_digest: boolean
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

  // Multi-tenant fields
  current_organization_id?: string | null
  avatar_url?: string | null
  title?: string | null
  phone?: string | null
  notification_preferences?: NotificationPreferences
  last_seen_at?: string | null
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
