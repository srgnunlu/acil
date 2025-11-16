/**
 * Task Management Types
 * Phase 9: Task & Workflow Management
 */

import { Database } from './database.types'

// =====================================================
// DATABASE TYPES
// =====================================================

export type Task = Database['public']['Tables']['tasks']['Row']
export type TaskInsert = Database['public']['Tables']['tasks']['Insert']
export type TaskUpdate = Database['public']['Tables']['tasks']['Update']

export type TaskTemplate = Database['public']['Tables']['task_templates']['Row']
export type TaskTemplateInsert = Database['public']['Tables']['task_templates']['Insert']
export type TaskTemplateUpdate = Database['public']['Tables']['task_templates']['Update']

export type TaskChecklistItem = Database['public']['Tables']['task_checklist_items']['Row']
export type TaskChecklistItemInsert = Database['public']['Tables']['task_checklist_items']['Insert']
export type TaskChecklistItemUpdate = Database['public']['Tables']['task_checklist_items']['Update']

export type TaskComment = Database['public']['Tables']['task_comments']['Row']
export type TaskCommentInsert = Database['public']['Tables']['task_comments']['Insert']
export type TaskCommentUpdate = Database['public']['Tables']['task_comments']['Update']

export type TaskAttachment = Database['public']['Tables']['task_attachments']['Row']
export type TaskAttachmentInsert = Database['public']['Tables']['task_attachments']['Insert']

export type TaskActivityLog = Database['public']['Tables']['task_activity_log']['Row']

// =====================================================
// ENUMS
// =====================================================

export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low'

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold'

export type TaskCategory =
  | 'clinical'
  | 'administrative'
  | 'lab'
  | 'imaging'
  | 'medication'
  | 'consultation'
  | 'discharge'
  | 'other'

export type TaskActivityType =
  | 'created'
  | 'updated'
  | 'assigned'
  | 'unassigned'
  | 'status_changed'
  | 'priority_changed'
  | 'completed'
  | 'cancelled'
  | 'commented'
  | 'attachment_added'
  | 'checklist_updated'
  | 'due_date_changed'

// =====================================================
// EXTENDED TYPES (with joins)
// =====================================================

export interface TaskWithDetails extends Task {
  assigned_to_user?: {
    id: string
    full_name: string
    avatar_url?: string
  }
  assigned_by_user?: {
    id: string
    full_name: string
  }
  created_by_user?: {
    id: string
    full_name: string
  }
  patient?: {
    id: string
    name: string
  }
  workspace?: {
    id: string
    name: string
    color: string
  }
  checklist_items?: TaskChecklistItem[]
  comments?: TaskCommentWithAuthor[]
  attachments?: TaskAttachment[]
  _count?: {
    checklist_items?: number
    completed_checklist_items?: number
    comments?: number
    attachments?: number
  }
}

export interface TaskCommentWithAuthor extends TaskComment {
  author?: {
    id: string
    full_name: string
    avatar_url?: string
  }
}

export interface TaskTemplateWithStats extends TaskTemplate {
  created_by_user?: {
    id: string
    full_name: string
  }
  workspace?: {
    id: string
    name: string
  }
}

// =====================================================
// CREATE/UPDATE PAYLOADS
// =====================================================

export interface CreateTaskPayload {
  workspace_id: string
  patient_id?: string
  title: string
  description?: string
  priority?: TaskPriority
  status?: TaskStatus
  assigned_to?: string
  due_date?: string
  category?: TaskCategory
  tags?: string[]
  template_id?: string
  reminder_enabled?: boolean
  reminder_before_minutes?: number
  checklist_items?: CreateChecklistItemPayload[]
}

export interface UpdateTaskPayload {
  title?: string
  description?: string
  priority?: TaskPriority
  status?: TaskStatus
  assigned_to?: string
  due_date?: string
  category?: TaskCategory
  tags?: string[]
  reminder_enabled?: boolean
  reminder_before_minutes?: number
  progress_percentage?: number
}

export interface CreateChecklistItemPayload {
  title: string
  description?: string
  order_index?: number
  assigned_to?: string
}

export interface UpdateChecklistItemPayload {
  title?: string
  description?: string
  order_index?: number
  is_completed?: boolean
  assigned_to?: string
}

export interface CreateTaskCommentPayload {
  task_id: string
  content: string
  mentions?: Array<{
    user_id: string
    full_name: string
  }>
}

export interface CreateTaskTemplatePayload {
  workspace_id: string
  organization_id?: string
  name: string
  description?: string
  category?: TaskCategory
  default_priority?: TaskPriority
  default_duration_minutes?: number
  default_reminder_before_minutes?: number
  title_template: string
  description_template?: string
  checklist_items?: Array<{
    title: string
    order: number
  }>
  default_tags?: string[]
}

// =====================================================
// FILTER & QUERY TYPES
// =====================================================

export interface TaskFilters {
  workspace_id: string
  patient_id?: string
  assigned_to?: string
  created_by?: string
  status?: TaskStatus | TaskStatus[]
  priority?: TaskPriority | TaskPriority[]
  category?: TaskCategory | TaskCategory[]
  tags?: string[]
  due_date_from?: string
  due_date_to?: string
  is_overdue?: boolean
  search?: string
  page?: number
  limit?: number
  sort_by?: 'created_at' | 'updated_at' | 'due_date' | 'priority' | 'status'
  sort_order?: 'asc' | 'desc'
}

export interface TaskTemplateFilters {
  workspace_id?: string
  organization_id?: string
  category?: TaskCategory
  is_active?: boolean
  search?: string
}

// =====================================================
// STATISTICS & SUMMARY TYPES
// =====================================================

export interface TaskStatistics {
  total_tasks: number
  pending_tasks: number
  in_progress_tasks: number
  completed_tasks: number
  cancelled_tasks: number
  overdue_tasks: number
  due_today: number
  due_this_week: number
  high_priority_tasks: number
  by_priority: Record<TaskPriority, number>
  by_status: Record<TaskStatus, number>
  by_category: Record<string, number>
  completion_rate: number
  average_completion_time_hours?: number
}

export interface UserTaskSummary {
  user_id: string
  total_tasks: number
  pending_tasks: number
  in_progress_tasks: number
  completed_today: number
  overdue_tasks: number
  high_priority_tasks: number
}

export interface TasksByDate {
  date: string
  count: number
  completed: number
  created: number
}

// =====================================================
// UI STATE TYPES
// =====================================================

export interface TaskFormState {
  mode: 'create' | 'edit'
  task?: TaskWithDetails
  isOpen: boolean
  defaultValues?: Partial<CreateTaskPayload>
}

export interface TaskFilterState extends TaskFilters {
  isActive: boolean
}

export interface TaskViewPreferences {
  view_mode: 'list' | 'board' | 'calendar'
  group_by?: 'status' | 'priority' | 'assignee' | 'category' | 'patient'
  show_completed: boolean
  show_cancelled: boolean
  compact_view: boolean
}

// =====================================================
// NOTIFICATION TYPES
// =====================================================

export interface TaskReminderPayload {
  task_id: string
  task_title: string
  due_date: string
  assigned_to: string
  workspace_id: string
  patient_id?: string
}

export interface TaskAssignmentNotification {
  task_id: string
  task_title: string
  assigned_to: string
  assigned_by: string
  workspace_id: string
}

export interface TaskMentionNotification {
  task_id: string
  comment_id: string
  mentioned_user_id: string
  mentioned_by: string
  content_preview: string
}

// =====================================================
// TEMPLATE VARIABLES
// =====================================================

export interface TaskTemplateVariables {
  patient_name?: string
  workspace_name?: string
  current_date?: string
  assigned_to_name?: string
  [key: string]: string | undefined
}

// =====================================================
// DRAG & DROP TYPES
// =====================================================

export interface TaskDragItem {
  id: string
  type: 'task'
  task: TaskWithDetails
}

export interface TaskDropResult {
  destination_status?: TaskStatus
  destination_priority?: TaskPriority
  destination_assignee?: string
}

// =====================================================
// BULK OPERATIONS
// =====================================================

export interface BulkTaskOperation {
  task_ids: string[]
  operation: 'update_status' | 'update_priority' | 'assign' | 'delete' | 'add_tag' | 'remove_tag'
  params?: {
    status?: TaskStatus
    priority?: TaskPriority
    assigned_to?: string
    tag?: string
  }
}

export interface BulkOperationResult {
  success: boolean
  updated_count: number
  failed_ids?: string[]
  errors?: Record<string, string>
}

// =====================================================
// HELPER TYPES
// =====================================================

export interface TaskStatusConfig {
  value: TaskStatus
  label: string
  color: string
  icon: string
  description: string
}

export interface TaskPriorityConfig {
  value: TaskPriority
  label: string
  color: string
  icon: string
  sort_order: number
}

export interface TaskCategoryConfig {
  value: TaskCategory
  label: string
  icon: string
  color: string
  description: string
}

// =====================================================
// CONSTANTS
// =====================================================

export const TASK_STATUS_CONFIG: Record<TaskStatus, TaskStatusConfig> = {
  pending: {
    value: 'pending',
    label: 'Bekliyor',
    color: 'gray',
    icon: 'Clock',
    description: 'Henüz başlanmadı',
  },
  in_progress: {
    value: 'in_progress',
    label: 'Devam Ediyor',
    color: 'blue',
    icon: 'PlayCircle',
    description: 'Üzerinde çalışılıyor',
  },
  completed: {
    value: 'completed',
    label: 'Tamamlandı',
    color: 'green',
    icon: 'CheckCircle',
    description: 'Görev tamamlandı',
  },
  cancelled: {
    value: 'cancelled',
    label: 'İptal Edildi',
    color: 'red',
    icon: 'XCircle',
    description: 'Görev iptal edildi',
  },
  on_hold: {
    value: 'on_hold',
    label: 'Beklemede',
    color: 'yellow',
    icon: 'PauseCircle',
    description: 'Geçici olarak durduruldu',
  },
}

export const TASK_PRIORITY_CONFIG: Record<TaskPriority, TaskPriorityConfig> = {
  urgent: {
    value: 'urgent',
    label: 'Acil',
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

export const TASK_CATEGORY_CONFIG: Record<TaskCategory, TaskCategoryConfig> = {
  clinical: {
    value: 'clinical',
    label: 'Klinik',
    icon: 'Stethoscope',
    color: 'blue',
    description: 'Klinik işlemler ve muayene',
  },
  administrative: {
    value: 'administrative',
    label: 'İdari',
    icon: 'FileText',
    color: 'gray',
    description: 'İdari işlemler ve evrak',
  },
  lab: {
    value: 'lab',
    label: 'Laboratuvar',
    icon: 'TestTube',
    color: 'purple',
    description: 'Laboratuvar tetkikleri',
  },
  imaging: {
    value: 'imaging',
    label: 'Görüntüleme',
    icon: 'Scan',
    color: 'indigo',
    description: 'Radyolojik görüntülemeler',
  },
  medication: {
    value: 'medication',
    label: 'İlaç',
    icon: 'Pill',
    color: 'green',
    description: 'İlaç tedavisi ve reçete',
  },
  consultation: {
    value: 'consultation',
    label: 'Konsültasyon',
    icon: 'Users',
    color: 'cyan',
    description: 'Konsültasyon istemi',
  },
  discharge: {
    value: 'discharge',
    label: 'Taburcu',
    icon: 'LogOut',
    color: 'teal',
    description: 'Taburcu işlemleri',
  },
  other: {
    value: 'other',
    label: 'Diğer',
    icon: 'MoreHorizontal',
    color: 'gray',
    description: 'Diğer görevler',
  },
}
