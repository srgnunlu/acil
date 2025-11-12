/**
 * Notification System Types
 * Phase 6: Comprehensive Notification System
 */

// ============================================
// NOTIFICATION TYPES
// ============================================

export type NotificationType =
  | 'patient_created'
  | 'patient_updated'
  | 'patient_assigned'
  | 'patient_discharged'
  | 'mention'
  | 'note_added'
  | 'ai_alert'
  | 'ai_analysis_complete'
  | 'critical_value'
  | 'task_assigned'
  | 'task_due'
  | 'task_completed'
  | 'assignment'
  | 'workspace_invite'
  | 'system'

export type NotificationSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info'

export type NotificationStatus = 'pending' | 'sending' | 'sent' | 'failed' | 'cancelled'

// ============================================
// NOTIFICATION INTERFACE
// ============================================

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string | null
  severity: NotificationSeverity
  related_patient_id: string | null
  related_workspace_id: string | null
  related_note_id: string | null
  data: Record<string, unknown>
  action_url: string | null
  is_read: boolean
  read_at: string | null
  sent_push: boolean
  sent_email: boolean
  sent_sms: boolean
  expires_at: string | null
  created_at: string
}

// ============================================
// NOTIFICATION PREFERENCES
// ============================================

export interface NotificationPreferences {
  // Channel preferences
  email: boolean
  push: boolean
  sms: boolean

  // Type preferences
  mention: boolean
  assignment: boolean
  critical_alerts: boolean
  patient_updates: boolean
  ai_alerts: boolean

  // Quiet hours
  quiet_hours_enabled: boolean
  quiet_hours_start: string // HH:mm format
  quiet_hours_end: string // HH:mm format
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  email: true,
  push: true,
  sms: false,
  mention: true,
  assignment: true,
  critical_alerts: true,
  patient_updates: true,
  ai_alerts: true,
  quiet_hours_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
}

// ============================================
// PUSH SUBSCRIPTION
// ============================================

export interface PushSubscription {
  id: string
  user_id: string
  endpoint: string
  p256dh_key: string
  auth_key: string
  user_agent: string | null
  device_type: 'desktop' | 'mobile' | 'tablet' | null
  is_active: boolean
  created_at: string
  updated_at: string
  last_used_at: string | null
}

export interface PushSubscriptionPayload {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

// ============================================
// EMAIL QUEUE
// ============================================

export interface EmailQueue {
  id: string
  to_email: string
  to_name: string | null
  user_id: string | null
  subject: string
  template_name: EmailTemplateName
  template_data: Record<string, unknown>
  status: NotificationStatus
  attempts: number
  max_attempts: number
  last_error: string | null
  scheduled_for: string
  sent_at: string | null
  created_at: string
  updated_at: string
}

export type EmailTemplateName =
  | 'mention'
  | 'assignment'
  | 'critical_alert'
  | 'patient_update'
  | 'ai_alert'
  | 'workspace_invite'
  | 'daily_digest'
  | 'weekly_summary'

// ============================================
// NOTIFICATION CREATION PAYLOAD
// ============================================

export interface CreateNotificationPayload {
  user_id: string
  type: NotificationType
  title: string
  message?: string
  severity?: NotificationSeverity
  related_patient_id?: string
  related_workspace_id?: string
  related_note_id?: string
  data?: Record<string, unknown>
  action_url?: string
  expires_at?: string
}

export interface NotifyWorkspaceMembersPayload {
  workspace_id: string
  type: NotificationType
  title: string
  message?: string
  severity?: NotificationSeverity
  related_patient_id?: string
  related_note_id?: string
  data?: Record<string, unknown>
  action_url?: string
  exclude_user_id?: string
}

// ============================================
// NOTIFICATION CHANNEL OPTIONS
// ============================================

export interface NotificationChannelOptions {
  in_app: boolean // Always true for in-app notifications
  push: boolean // Send push notification
  email: boolean // Send email
  sms: boolean // Send SMS (optional)
}

export const DEFAULT_CHANNEL_OPTIONS: NotificationChannelOptions = {
  in_app: true,
  push: false,
  email: false,
  sms: false,
}

// ============================================
// NOTIFICATION FILTERS
// ============================================

export interface NotificationFilters {
  is_read?: boolean
  severity?: NotificationSeverity | NotificationSeverity[]
  type?: NotificationType | NotificationType[]
  related_patient_id?: string
  related_workspace_id?: string
  created_after?: string
  created_before?: string
  limit?: number
  offset?: number
}

// ============================================
// NOTIFICATION STATS
// ============================================

export interface NotificationStats {
  total: number
  unread: number
  by_severity: Record<NotificationSeverity, number>
  by_type: Record<NotificationType, number>
  today: number
  this_week: number
}

// ============================================
// PUSH NOTIFICATION PAYLOAD
// ============================================

export interface PushNotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  image?: string
  data?: Record<string, unknown>
  tag?: string
  requireInteraction?: boolean
  silent?: boolean
  vibrate?: number[]
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}

// ============================================
// EMAIL TEMPLATE DATA
// ============================================

export interface MentionEmailData {
  mentioned_by_name: string
  note_content: string
  patient_name?: string
  action_url: string
}

export interface AssignmentEmailData {
  assigned_by_name: string
  patient_name: string
  patient_id: string
  action_url: string
}

export interface CriticalAlertEmailData {
  alert_type: string
  patient_name: string
  patient_id: string
  alert_message: string
  action_url: string
}

export interface PatientUpdateEmailData {
  patient_name: string
  patient_id: string
  update_type: string
  updated_by_name: string
  action_url: string
}

export interface AIAlertEmailData {
  patient_name: string
  patient_id: string
  alert_severity: string
  alert_message: string
  recommendations: string[]
  action_url: string
}

export interface DailyDigestEmailData {
  user_name: string
  date: string
  stats: {
    new_patients: number
    critical_alerts: number
    mentions: number
    tasks_due: number
  }
  notifications: Array<{
    title: string
    message: string
    action_url: string
  }>
}

// ============================================
// NOTIFICATION SERVICE RESPONSE
// ============================================

export interface NotificationServiceResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

// ============================================
// NOTIFICATION CONTEXT
// ============================================

export interface NotificationContext {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: Error | null
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  clearAll: () => Promise<void>
  refresh: () => Promise<void>
}
