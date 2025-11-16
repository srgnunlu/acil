/**
 * Handoff & Communication Types
 * Phase 11: Shift Handoff & Communication System
 */

import { Database } from './database.types'

// =====================================================
// DATABASE TYPES
// =====================================================

export type ShiftDefinition = Database['public']['Tables']['shift_definitions']['Row']
export type ShiftDefinitionInsert = Database['public']['Tables']['shift_definitions']['Insert']
export type ShiftDefinitionUpdate = Database['public']['Tables']['shift_definitions']['Update']

export type ShiftSchedule = Database['public']['Tables']['shift_schedules']['Row']
export type ShiftScheduleInsert = Database['public']['Tables']['shift_schedules']['Insert']
export type ShiftScheduleUpdate = Database['public']['Tables']['shift_schedules']['Update']

export type HandoffTemplate = Database['public']['Tables']['handoff_templates']['Row']
export type HandoffTemplateInsert = Database['public']['Tables']['handoff_templates']['Insert']
export type HandoffTemplateUpdate = Database['public']['Tables']['handoff_templates']['Update']

export type Handoff = Database['public']['Tables']['handoffs']['Row']
export type HandoffInsert = Database['public']['Tables']['handoffs']['Insert']
export type HandoffUpdate = Database['public']['Tables']['handoffs']['Update']

export type HandoffPatient = Database['public']['Tables']['handoff_patients']['Row']
export type HandoffPatientInsert = Database['public']['Tables']['handoff_patients']['Insert']
export type HandoffPatientUpdate = Database['public']['Tables']['handoff_patients']['Update']

export type HandoffChecklistItem = Database['public']['Tables']['handoff_checklist_items']['Row']
export type HandoffChecklistItemInsert = Database['public']['Tables']['handoff_checklist_items']['Insert']
export type HandoffChecklistItemUpdate = Database['public']['Tables']['handoff_checklist_items']['Update']

// =====================================================
// ENUMS
// =====================================================

export type ShiftScheduleStatus = 'scheduled' | 'active' | 'completed' | 'cancelled'

export type HandoffStatus = 'draft' | 'pending_review' | 'completed' | 'archived'

export type ChecklistPriority = 'critical' | 'high' | 'medium' | 'low'

export type ChecklistCategory = 'patient_care' | 'medication' | 'procedure' | 'follow_up' | 'other'

// =====================================================
// EXTENDED TYPES (with joins)
// =====================================================

export interface ShiftDefinitionWithStats extends ShiftDefinition {
  workspace?: {
    id: string
    name: string
  }
  created_by_user?: {
    id: string
    full_name: string
  }
  _count?: {
    scheduled_shifts?: number
    active_shifts?: number
  }
}

export interface ShiftScheduleWithDetails extends ShiftSchedule {
  shift_definition?: ShiftDefinition
  user?: {
    id: string
    full_name: string
    avatar_url?: string
    specialty?: string
  }
  workspace?: {
    id: string
    name: string
    color: string
  }
  handoff?: HandoffWithDetails
}

export interface HandoffTemplateWithSections extends HandoffTemplate {
  workspace?: {
    id: string
    name: string
  }
  created_by_user?: {
    id: string
    full_name: string
  }
  _count?: {
    handoffs_using?: number
  }
}

export interface HandoffWithDetails extends Handoff {
  from_user?: {
    id: string
    full_name: string
    avatar_url?: string
    specialty?: string
  }
  to_user?: {
    id: string
    full_name: string
    avatar_url?: string
    specialty?: string
  }
  shift?: ShiftScheduleWithDetails
  template?: HandoffTemplate
  workspace?: {
    id: string
    name: string
    color: string
  }
  patients?: HandoffPatientWithDetails[]
  checklist_items?: HandoffChecklistItemWithDetails[]
  acknowledged_by_user?: {
    id: string
    full_name: string
  }
  _count?: {
    patients?: number
    checklist_items?: number
    completed_checklist_items?: number
  }
}

export interface HandoffPatientWithDetails extends HandoffPatient {
  patient?: {
    id: string
    name: string
    age?: number
    gender?: string
    category?: {
      id: string
      name: string
      color: string
    }
  }
}

export interface HandoffChecklistItemWithDetails extends HandoffChecklistItem {
  completed_by_user?: {
    id: string
    full_name: string
  }
}

// =====================================================
// TEMPLATE SECTION TYPES
// =====================================================

export interface HandoffTemplateSection {
  title: string
  description?: string
  fields: string[]
  order?: number
  required?: boolean
}

export interface HandoffContentSection {
  section_title: string
  content: string | string[] | Record<string, any>
}

// =====================================================
// CREATE/UPDATE PAYLOADS
// =====================================================

export interface CreateShiftDefinitionPayload {
  workspace_id: string
  name: string
  short_name?: string
  description?: string
  start_time: string // "HH:MM:SS" format
  end_time: string // "HH:MM:SS" format
  color?: string
  is_active?: boolean
  requires_handoff?: boolean
  sort_order?: number
}

export interface UpdateShiftDefinitionPayload {
  name?: string
  short_name?: string
  description?: string
  start_time?: string
  end_time?: string
  color?: string
  is_active?: boolean
  requires_handoff?: boolean
  sort_order?: number
}

export interface CreateShiftSchedulePayload {
  workspace_id: string
  shift_definition_id: string
  user_id: string
  shift_date: string // "YYYY-MM-DD"
  start_time: string // ISO timestamp
  end_time: string // ISO timestamp
  notes?: string
}

export interface UpdateShiftSchedulePayload {
  status?: ShiftScheduleStatus
  notes?: string
  checked_in_at?: string
  checked_out_at?: string
}

export interface CreateHandoffTemplatePayload {
  workspace_id: string
  name: string
  description?: string
  sections: HandoffTemplateSection[]
  is_default?: boolean
}

export interface UpdateHandoffTemplatePayload {
  name?: string
  description?: string
  sections?: HandoffTemplateSection[]
  is_default?: boolean
}

export interface CreateHandoffPayload {
  workspace_id: string
  shift_id?: string
  from_user_id: string
  to_user_id: string
  handoff_date: string // "YYYY-MM-DD"
  handoff_time: string // ISO timestamp
  template_id?: string
  summary?: string
  content?: Record<string, any>
  patient_ids?: string[]
  checklist_items?: CreateHandoffChecklistItemPayload[]
}

export interface UpdateHandoffPayload {
  template_id?: string
  summary?: string
  content?: Record<string, any>
  status?: HandoffStatus
  receiver_notes?: string
}

export interface CreateHandoffPatientPayload {
  handoff_id: string
  patient_id: string
  patient_summary?: string
  critical_items?: string[]
  pending_tasks?: string[]
  recent_changes?: string
  sort_order?: number
}

export interface UpdateHandoffPatientPayload {
  patient_summary?: string
  critical_items?: string[]
  pending_tasks?: string[]
  recent_changes?: string
  sort_order?: number
}

export interface CreateHandoffChecklistItemPayload {
  title: string
  description?: string
  category?: ChecklistCategory
  priority?: ChecklistPriority
  sort_order?: number
}

export interface UpdateHandoffChecklistItemPayload {
  title?: string
  description?: string
  category?: ChecklistCategory
  priority?: ChecklistPriority
  is_completed?: boolean
  sort_order?: number
}

// =====================================================
// AI-GENERATED HANDOFF TYPES
// =====================================================

export interface GenerateHandoffPayload {
  workspace_id: string
  from_user_id: string
  to_user_id: string
  shift_id?: string
  template_id?: string
  patient_ids?: string[]
  include_pending_tasks?: boolean
  include_critical_alerts?: boolean
  include_recent_changes?: boolean
}

export interface AIGeneratedHandoffContent {
  summary: string
  patient_summaries: Array<{
    patient_id: string
    patient_name: string
    summary: string
    critical_items: string[]
    pending_tasks: string[]
    recent_changes: string
  }>
  overall_statistics: {
    total_patients: number
    critical_patients: number
    stable_patients: number
    pending_discharges: number
  }
  critical_alerts: string[]
  pending_tasks: string[]
  medications_due: Array<{
    patient_id: string
    patient_name: string
    medication: string
    due_time: string
  }>
  special_instructions: string[]
  checklist_items: CreateHandoffChecklistItemPayload[]
}

// =====================================================
// FILTER & QUERY TYPES
// =====================================================

export interface HandoffFilters {
  workspace_id: string
  from_user_id?: string
  to_user_id?: string
  status?: HandoffStatus | HandoffStatus[]
  handoff_date_from?: string
  handoff_date_to?: string
  shift_id?: string
  template_id?: string
  is_ai_generated?: boolean
  search?: string
  page?: number
  limit?: number
  sort_by?: 'handoff_date' | 'created_at' | 'updated_at'
  sort_order?: 'asc' | 'desc'
}

export interface ShiftScheduleFilters {
  workspace_id: string
  user_id?: string
  shift_definition_id?: string
  status?: ShiftScheduleStatus | ShiftScheduleStatus[]
  shift_date_from?: string
  shift_date_to?: string
  is_current?: boolean
  page?: number
  limit?: number
}

export interface HandoffTemplateFilters {
  workspace_id: string
  is_default?: boolean
  is_system?: boolean
  is_active?: boolean
  search?: string
}

// =====================================================
// STATISTICS & SUMMARY TYPES
// =====================================================

export interface HandoffStatistics {
  total_handoffs: number
  pending_handoffs: number
  completed_handoffs: number
  draft_handoffs: number
  ai_generated_count: number
  average_patients_per_handoff: number
  handoffs_this_week: number
  handoffs_this_month: number
  by_status: Record<HandoffStatus, number>
  by_shift: Record<string, number>
}

export interface ShiftStatistics {
  total_shifts: number
  scheduled_shifts: number
  active_shifts: number
  completed_shifts: number
  cancelled_shifts: number
  shifts_this_week: number
  shifts_this_month: number
  by_shift_type: Record<string, number>
}

export interface UserHandoffSummary {
  user_id: string
  total_handoffs_given: number
  total_handoffs_received: number
  pending_handoffs_to_review: number
  completed_handoffs_this_week: number
  average_handoff_time_minutes?: number
}

// =====================================================
// UI STATE TYPES
// =====================================================

export interface HandoffFormState {
  mode: 'create' | 'edit' | 'view'
  handoff?: HandoffWithDetails
  isOpen: boolean
  defaultValues?: Partial<CreateHandoffPayload>
}

export interface HandoffFilterState extends HandoffFilters {
  isActive: boolean
}

export interface HandoffViewPreferences {
  view_mode: 'list' | 'calendar' | 'timeline'
  show_completed: boolean
  show_archived: boolean
  compact_view: boolean
  group_by?: 'date' | 'shift' | 'user' | 'status'
}

export interface ShiftCalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  shift_definition: ShiftDefinition
  user: {
    id: string
    full_name: string
  }
  status: ShiftScheduleStatus
  color: string
}

// =====================================================
// PRINT/EMAIL TYPES
// =====================================================

export interface PrintHandoffOptions {
  handoff_id: string
  include_patients: boolean
  include_checklist: boolean
  include_critical_alerts: boolean
  paper_size?: 'A4' | 'Letter'
  orientation?: 'portrait' | 'landscape'
}

export interface EmailHandoffPayload {
  handoff_id: string
  recipients: string[] // email addresses
  cc?: string[]
  include_pdf?: boolean
  subject?: string
  message?: string
}

export interface EmailHandoffResult {
  success: boolean
  message_id?: string
  sent_to: string[]
  failed_recipients?: string[]
  error?: string
}

// =====================================================
// NOTIFICATION TYPES
// =====================================================

export interface HandoffCreatedNotification {
  handoff_id: string
  from_user_id: string
  to_user_id: string
  workspace_id: string
  handoff_date: string
  patient_count: number
}

export interface HandoffAcknowledgedNotification {
  handoff_id: string
  acknowledged_by: string
  acknowledged_at: string
}

export interface ShiftReminderNotification {
  shift_id: string
  user_id: string
  shift_date: string
  start_time: string
  shift_name: string
}

// =====================================================
// HELPER TYPES
// =====================================================

export interface HandoffStatusConfig {
  value: HandoffStatus
  label: string
  color: string
  icon: string
  description: string
}

export interface ChecklistPriorityConfig {
  value: ChecklistPriority
  label: string
  color: string
  icon: string
  sort_order: number
}

export interface ChecklistCategoryConfig {
  value: ChecklistCategory
  label: string
  icon: string
  color: string
}

// =====================================================
// CONSTANTS
// =====================================================

export const HANDOFF_STATUS_CONFIG: Record<HandoffStatus, HandoffStatusConfig> = {
  draft: {
    value: 'draft',
    label: 'Taslak',
    color: 'gray',
    icon: 'FileEdit',
    description: 'Handoff hazırlanıyor',
  },
  pending_review: {
    value: 'pending_review',
    label: 'İnceleme Bekliyor',
    color: 'yellow',
    icon: 'Clock',
    description: 'Alıcı tarafından incelenmesi bekleniyor',
  },
  completed: {
    value: 'completed',
    label: 'Tamamlandı',
    color: 'green',
    icon: 'CheckCircle',
    description: 'Handoff tamamlandı ve onaylandı',
  },
  archived: {
    value: 'archived',
    label: 'Arşivlendi',
    color: 'gray',
    icon: 'Archive',
    description: 'Handoff arşivlendi',
  },
}

export const SHIFT_SCHEDULE_STATUS_CONFIG: Record<ShiftScheduleStatus, { label: string; color: string; icon: string }> = {
  scheduled: {
    label: 'Planlandı',
    color: 'blue',
    icon: 'Calendar',
  },
  active: {
    label: 'Aktif',
    color: 'green',
    icon: 'Activity',
  },
  completed: {
    label: 'Tamamlandı',
    color: 'gray',
    icon: 'CheckCircle',
  },
  cancelled: {
    label: 'İptal Edildi',
    color: 'red',
    icon: 'XCircle',
  },
}

export const CHECKLIST_PRIORITY_CONFIG: Record<ChecklistPriority, ChecklistPriorityConfig> = {
  critical: {
    value: 'critical',
    label: 'Kritik',
    color: 'red',
    icon: 'AlertTriangle',
    sort_order: 1,
  },
  high: {
    value: 'high',
    label: 'Yüksek',
    color: 'orange',
    icon: 'ArrowUp',
    sort_order: 2,
  },
  medium: {
    value: 'medium',
    label: 'Orta',
    color: 'yellow',
    icon: 'Minus',
    sort_order: 3,
  },
  low: {
    value: 'low',
    label: 'Düşük',
    color: 'gray',
    icon: 'ArrowDown',
    sort_order: 4,
  },
}

export const CHECKLIST_CATEGORY_CONFIG: Record<ChecklistCategory, ChecklistCategoryConfig> = {
  patient_care: {
    value: 'patient_care',
    label: 'Hasta Bakımı',
    icon: 'Heart',
    color: 'blue',
  },
  medication: {
    value: 'medication',
    label: 'İlaç Tedavisi',
    icon: 'Pill',
    color: 'green',
  },
  procedure: {
    value: 'procedure',
    label: 'Prosedür',
    icon: 'Activity',
    color: 'purple',
  },
  follow_up: {
    value: 'follow_up',
    label: 'Takip',
    icon: 'Clock',
    color: 'orange',
  },
  other: {
    value: 'other',
    label: 'Diğer',
    icon: 'MoreHorizontal',
    color: 'gray',
  },
}

// =====================================================
// DEFAULT HANDOFF TEMPLATE SECTIONS
// =====================================================

export const DEFAULT_HANDOFF_SECTIONS: HandoffTemplateSection[] = [
  {
    title: 'Hasta Özeti',
    description: 'Genel hasta durumu ve sayıları',
    fields: ['total_patients', 'critical_patients', 'stable_patients', 'new_admissions'],
    order: 1,
    required: true,
  },
  {
    title: 'Kritik Uyarılar',
    description: 'Acil dikkat gerektiren durumlar',
    fields: ['critical_vitals', 'pending_labs', 'imaging_results', 'code_status'],
    order: 2,
    required: true,
  },
  {
    title: 'Bekleyen İşlemler',
    description: 'Yapılması gereken işlemler',
    fields: ['medication_orders', 'procedures', 'consultations', 'pending_discharges'],
    order: 3,
    required: true,
  },
  {
    title: 'Önemli Notlar',
    description: 'Özel dikkat gerektiren notlar',
    fields: ['family_communication', 'special_instructions', 'isolation_precautions'],
    order: 4,
    required: false,
  },
  {
    title: 'Takip Gereken Konular',
    description: 'Sonraki vardiyada yapılacaklar',
    fields: ['next_day_tasks', 'scheduled_procedures', 'follow_up_results'],
    order: 5,
    required: false,
  },
]
