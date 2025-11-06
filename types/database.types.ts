export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
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
        Insert: {
          id?: string
          user_id: string
          full_name?: string | null
          specialty?: string | null
          institution?: string | null
          subscription_tier?: 'free' | 'pro'
          patient_limit?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string | null
          specialty?: string | null
          institution?: string | null
          subscription_tier?: 'free' | 'pro'
          patient_limit?: number
          created_at?: string
          updated_at?: string
        }
      }
      patients: {
        Row: {
          id: string
          user_id: string
          name: string
          age: number | null
          gender: string | null
          created_at: string
          updated_at: string
          status: 'active' | 'discharged' | 'consultation'
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          age?: number | null
          gender?: string | null
          created_at?: string
          updated_at?: string
          status?: 'active' | 'discharged' | 'consultation'
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          age?: number | null
          gender?: string | null
          created_at?: string
          updated_at?: string
          status?: 'active' | 'discharged' | 'consultation'
        }
      }
      patient_data: {
        Row: {
          id: string
          patient_id: string
          data_type: 'demographics' | 'anamnesis' | 'medications' | 'vital_signs' | 'history'
          content: Json
          created_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          data_type: 'demographics' | 'anamnesis' | 'medications' | 'vital_signs' | 'history'
          content: Json
          created_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          data_type?: 'demographics' | 'anamnesis' | 'medications' | 'vital_signs' | 'history'
          content?: Json
          created_at?: string
        }
      }
      patient_tests: {
        Row: {
          id: string
          patient_id: string
          test_type: string
          results: Json
          images: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          test_type: string
          results: Json
          images?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          test_type?: string
          results?: Json
          images?: string[] | null
          created_at?: string
        }
      }
      ai_analyses: {
        Row: {
          id: string
          patient_id: string
          analysis_type: 'initial' | 'updated'
          input_data: Json
          ai_response: Json
          references: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          analysis_type: 'initial' | 'updated'
          input_data: Json
          ai_response: Json
          references?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          analysis_type?: 'initial' | 'updated'
          input_data?: Json
          ai_response?: Json
          references?: Json | null
          created_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          patient_id: string
          user_id: string
          role: 'user' | 'assistant'
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          user_id: string
          role: 'user' | 'assistant'
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          user_id?: string
          role?: 'user' | 'assistant'
          content?: string
          created_at?: string
        }
      }
      reminders: {
        Row: {
          id: string
          user_id: string
          patient_id: string
          reminder_type: string
          scheduled_time: string
          status: 'pending' | 'sent' | 'dismissed'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          patient_id: string
          reminder_type: string
          scheduled_time: string
          status?: 'pending' | 'sent' | 'dismissed'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          patient_id?: string
          reminder_type?: string
          scheduled_time?: string
          status?: 'pending' | 'sent' | 'dismissed'
          created_at?: string
        }
      }
    }
  }
}
