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

export interface PatientData {
  id: string
  patient_id: string
  data_type: 'demographics' | 'anamnesis' | 'medications' | 'vital_signs' | 'history'
  content: any
  created_at: string
}

export interface PatientTest {
  id: string
  patient_id: string
  test_type: string
  results: any
  images?: string[]
  created_at: string
}

export interface AIAnalysis {
  id: string
  patient_id: string
  analysis_type: 'initial' | 'updated'
  input_data: any
  ai_response: {
    diagnosis?: string[]
    tests?: string[]
    treatment?: string[]
    recommendations?: string[]
    references?: Array<{
      title: string
      source: string
      url?: string
    }>
  }
  references?: any
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
