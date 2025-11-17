export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          type: 'hospital' | 'clinic' | 'health_center' | 'private_practice' | null
          logo_url: string | null
          settings: Json
          subscription_tier: 'free' | 'pro' | 'enterprise'
          subscription_status: 'active' | 'inactive' | 'trial' | 'cancelled'
          trial_ends_at: string | null
          max_users: number
          max_workspaces: number
          max_patients_per_workspace: number
          contact_email: string | null
          contact_phone: string | null
          address: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          type?: 'hospital' | 'clinic' | 'health_center' | 'private_practice' | null
          logo_url?: string | null
          settings?: Json
          subscription_tier?: 'free' | 'pro' | 'enterprise'
          subscription_status?: 'active' | 'inactive' | 'trial' | 'cancelled'
          trial_ends_at?: string | null
          max_users?: number
          max_workspaces?: number
          max_patients_per_workspace?: number
          contact_email?: string | null
          contact_phone?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          type?: 'hospital' | 'clinic' | 'health_center' | 'private_practice' | null
          logo_url?: string | null
          settings?: Json
          subscription_tier?: 'free' | 'pro' | 'enterprise'
          subscription_status?: 'active' | 'inactive' | 'trial' | 'cancelled'
          trial_ends_at?: string | null
          max_users?: number
          max_workspaces?: number
          max_patients_per_workspace?: number
          contact_email?: string | null
          contact_phone?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      workspaces: {
        Row: {
          id: string
          organization_id: string
          name: string
          slug: string
          description: string | null
          type:
            | 'emergency'
            | 'icu'
            | 'cardiology'
            | 'surgery'
            | 'internal_medicine'
            | 'pediatrics'
            | 'neurology'
            | 'orthopedics'
            | 'oncology'
            | 'general'
            | 'custom'
          color: string
          icon: string
          settings: Json
          is_active: boolean
          created_by: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          slug: string
          description?: string | null
          type?:
            | 'emergency'
            | 'icu'
            | 'cardiology'
            | 'surgery'
            | 'internal_medicine'
            | 'pediatrics'
            | 'neurology'
            | 'orthopedics'
            | 'oncology'
            | 'general'
            | 'custom'
          color?: string
          icon?: string
          settings?: Json
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          slug?: string
          description?: string | null
          type?:
            | 'emergency'
            | 'icu'
            | 'cardiology'
            | 'surgery'
            | 'internal_medicine'
            | 'pediatrics'
            | 'neurology'
            | 'orthopedics'
            | 'oncology'
            | 'general'
            | 'custom'
          color?: string
          icon?: string
          settings?: Json
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      workspace_members: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          role: 'owner' | 'admin' | 'senior_doctor' | 'doctor' | 'resident' | 'nurse' | 'observer'
          permissions: Json
          status: 'active' | 'inactive' | 'pending'
          invited_by: string | null
          invited_at: string | null
          joined_at: string
          invitation_id: string | null
          last_activity_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id: string
          role?: 'owner' | 'admin' | 'senior_doctor' | 'doctor' | 'resident' | 'nurse' | 'observer'
          permissions?: Json
          status?: 'active' | 'inactive' | 'pending'
          invited_by?: string | null
          invited_at?: string | null
          joined_at?: string
          invitation_id?: string | null
          last_activity_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'senior_doctor' | 'doctor' | 'resident' | 'nurse' | 'observer'
          permissions?: Json
          status?: 'active' | 'inactive' | 'pending'
          invited_by?: string | null
          invited_at?: string | null
          joined_at?: string
          invitation_id?: string | null
          last_activity_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      patient_categories: {
        Row: {
          id: string
          workspace_id: string
          name: string
          slug: string
          color: string
          icon: string | null
          description: string | null
          sort_order: number
          is_default: boolean
          is_system: boolean
          created_by: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          workspace_id: string
          name: string
          slug: string
          color?: string
          icon?: string | null
          description?: string | null
          sort_order?: number
          is_default?: boolean
          is_system?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          workspace_id?: string
          name?: string
          slug?: string
          color?: string
          icon?: string | null
          description?: string | null
          sort_order?: number
          is_default?: boolean
          is_system?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      patient_assignments: {
        Row: {
          id: string
          patient_id: string
          user_id: string
          assignment_type: 'primary' | 'secondary' | 'consultant' | 'nurse' | 'observer'
          is_active: boolean
          assigned_by: string | null
          assigned_at: string
          removed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          user_id: string
          assignment_type?: 'primary' | 'secondary' | 'consultant' | 'nurse' | 'observer'
          is_active?: boolean
          assigned_by?: string | null
          assigned_at?: string
          removed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          user_id?: string
          assignment_type?: 'primary' | 'secondary' | 'consultant' | 'nurse' | 'observer'
          is_active?: boolean
          assigned_by?: string | null
          assigned_at?: string
          removed_at?: string | null
          created_at?: string
        }
      }
      workspace_invitations: {
        Row: {
          id: string
          workspace_id: string
          email: string
          invited_user_id: string | null
          role: 'owner' | 'admin' | 'senior_doctor' | 'doctor' | 'resident' | 'nurse' | 'observer'
          custom_permissions: Json
          invitation_token: string
          invited_by: string
          invited_at: string
          expires_at: string
          status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled'
          accepted_at: string | null
          declined_at: string | null
          message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          email: string
          invited_user_id?: string | null
          role: 'owner' | 'admin' | 'senior_doctor' | 'doctor' | 'resident' | 'nurse' | 'observer'
          custom_permissions?: Json
          invitation_token?: string
          invited_by: string
          invited_at?: string
          expires_at?: string
          status?: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled'
          accepted_at?: string | null
          declined_at?: string | null
          message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          email?: string
          invited_user_id?: string | null
          role?: 'owner' | 'admin' | 'senior_doctor' | 'doctor' | 'resident' | 'nurse' | 'observer'
          custom_permissions?: Json
          invitation_token?: string
          invited_by?: string
          invited_at?: string
          expires_at?: string
          status?: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled'
          accepted_at?: string | null
          declined_at?: string | null
          message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_activity_log: {
        Row: {
          id: string
          user_id: string
          workspace_id: string | null
          organization_id: string | null
          activity_type: string
          entity_type: string | null
          entity_id: string | null
          description: string | null
          metadata: Json
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          workspace_id?: string | null
          organization_id?: string | null
          activity_type: string
          entity_type?: string | null
          entity_id?: string | null
          description?: string | null
          metadata?: Json
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          workspace_id?: string | null
          organization_id?: string | null
          activity_type?: string
          entity_type?: string | null
          entity_id?: string | null
          description?: string | null
          metadata?: Json
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string | null
          specialty: string | null
          institution: string | null
          subscription_tier: 'free' | 'pro'
          patient_limit: number
          current_organization_id: string | null
          avatar_url: string | null
          title: string | null
          phone: string | null
          notification_preferences: Json
          last_seen_at: string | null
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
          current_organization_id?: string | null
          avatar_url?: string | null
          title?: string | null
          phone?: string | null
          notification_preferences?: Json
          last_seen_at?: string | null
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
          current_organization_id?: string | null
          avatar_url?: string | null
          title?: string | null
          phone?: string | null
          notification_preferences?: Json
          last_seen_at?: string | null
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
          workspace_id: string | null
          organization_id: string | null
          category_id: string | null
          assigned_to: string | null
          admission_date: string | null
          discharge_date: string | null
          workflow_state:
            | 'admission'
            | 'assessment'
            | 'diagnosis'
            | 'treatment'
            | 'observation'
            | 'discharge_planning'
            | 'discharged'
            | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          age?: number | null
          gender?: string | null
          workspace_id?: string | null
          organization_id?: string | null
          category_id?: string | null
          assigned_to?: string | null
          admission_date?: string | null
          discharge_date?: string | null
          workflow_state?:
            | 'admission'
            | 'assessment'
            | 'diagnosis'
            | 'treatment'
            | 'observation'
            | 'discharge_planning'
            | 'discharged'
            | null
          created_at?: string
          updated_at?: string
          status?: 'active' | 'discharged' | 'consultation'
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          age?: number | null
          gender?: string | null
          workspace_id?: string | null
          organization_id?: string | null
          category_id?: string | null
          assigned_to?: string | null
          admission_date?: string | null
          discharge_date?: string | null
          workflow_state?:
            | 'admission'
            | 'assessment'
            | 'diagnosis'
            | 'treatment'
            | 'observation'
            | 'discharge_planning'
            | 'discharged'
            | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
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
      tasks: {
        Row: {
          id: string
          workspace_id: string
          patient_id: string | null
          title: string
          description: string | null
          priority: 'urgent' | 'high' | 'medium' | 'low'
          status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold'
          assigned_to: string | null
          assigned_by: string | null
          due_date: string | null
          started_at: string | null
          completed_at: string | null
          category: string | null
          tags: string[] | null
          template_id: string | null
          reminder_enabled: boolean
          reminder_before_minutes: number | null
          reminder_sent_at: string | null
          blocked_by: string | null
          progress_percentage: number
          created_by: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          workspace_id: string
          patient_id?: string | null
          title: string
          description?: string | null
          priority?: 'urgent' | 'high' | 'medium' | 'low'
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold'
          assigned_to?: string | null
          assigned_by?: string | null
          due_date?: string | null
          started_at?: string | null
          completed_at?: string | null
          category?: string | null
          tags?: string[] | null
          template_id?: string | null
          reminder_enabled?: boolean
          reminder_before_minutes?: number | null
          reminder_sent_at?: string | null
          blocked_by?: string | null
          progress_percentage?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          workspace_id?: string
          patient_id?: string | null
          title?: string
          description?: string | null
          priority?: 'urgent' | 'high' | 'medium' | 'low'
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold'
          assigned_to?: string | null
          assigned_by?: string | null
          due_date?: string | null
          started_at?: string | null
          completed_at?: string | null
          category?: string | null
          tags?: string[] | null
          template_id?: string | null
          reminder_enabled?: boolean
          reminder_before_minutes?: number | null
          reminder_sent_at?: string | null
          blocked_by?: string | null
          progress_percentage?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      task_templates: {
        Row: {
          id: string
          workspace_id: string | null
          organization_id: string | null
          name: string
          description: string | null
          category: string | null
          default_priority: 'urgent' | 'high' | 'medium' | 'low'
          default_duration_minutes: number | null
          default_reminder_before_minutes: number | null
          title_template: string
          description_template: string | null
          checklist_items: Json
          default_tags: string[] | null
          is_system: boolean
          is_active: boolean
          usage_count: number
          created_by: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          workspace_id?: string | null
          organization_id?: string | null
          name: string
          description?: string | null
          category?: string | null
          default_priority?: 'urgent' | 'high' | 'medium' | 'low'
          default_duration_minutes?: number | null
          default_reminder_before_minutes?: number | null
          title_template: string
          description_template?: string | null
          checklist_items?: Json
          default_tags?: string[] | null
          is_system?: boolean
          is_active?: boolean
          usage_count?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          workspace_id?: string | null
          organization_id?: string | null
          name?: string
          description?: string | null
          category?: string | null
          default_priority?: 'urgent' | 'high' | 'medium' | 'low'
          default_duration_minutes?: number | null
          default_reminder_before_minutes?: number | null
          title_template?: string
          description_template?: string | null
          checklist_items?: Json
          default_tags?: string[] | null
          is_system?: boolean
          is_active?: boolean
          usage_count?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      task_checklist_items: {
        Row: {
          id: string
          task_id: string
          title: string
          description: string | null
          order_index: number
          is_completed: boolean
          completed_at: string | null
          completed_by: string | null
          assigned_to: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          task_id: string
          title: string
          description?: string | null
          order_index?: number
          is_completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          title?: string
          description?: string | null
          order_index?: number
          is_completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      task_comments: {
        Row: {
          id: string
          task_id: string
          content: string
          mentions: Json
          created_by: string
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          task_id: string
          content: string
          mentions?: Json
          created_by: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          task_id?: string
          content?: string
          mentions?: Json
          created_by?: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      task_attachments: {
        Row: {
          id: string
          task_id: string
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          storage_path: string | null
          uploaded_by: string
          uploaded_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          task_id: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          storage_path?: string | null
          uploaded_by: string
          uploaded_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          task_id?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          storage_path?: string | null
          uploaded_by?: string
          uploaded_at?: string
          deleted_at?: string | null
        }
      }
      task_activity_log: {
        Row: {
          id: string
          task_id: string
          activity_type: string
          field_name: string | null
          old_value: string | null
          new_value: string | null
          metadata: Json
          performed_by: string | null
          performed_at: string
        }
        Insert: {
          id?: string
          task_id: string
          activity_type: string
          field_name?: string | null
          old_value?: string | null
          new_value?: string | null
          metadata?: Json
          performed_by?: string | null
          performed_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          activity_type?: string
          field_name?: string | null
          old_value?: string | null
          new_value?: string | null
          metadata?: Json
          performed_by?: string | null
          performed_at?: string
        }
      }
    }
  }
}
