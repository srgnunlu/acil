/**
 * Notification Helper Functions
 * Phase 6: Comprehensive Notification System
 *
 * Helper functions to create specific types of notifications
 */

import { NotificationService } from './notification-service'
import type {
  NotificationType,
  NotificationSeverity,
  CreateNotificationPayload,
} from '@/types/notification.types'

/**
 * Create a patient-related notification
 */
export async function notifyPatientEvent(params: {
  userId: string
  type: NotificationType
  patientId: string
  patientName: string
  workspaceId: string
  message?: string
  severity?: NotificationSeverity
}) {
  const payload: CreateNotificationPayload = {
    user_id: params.userId,
    type: params.type,
    title: getPatientEventTitle(params.type, params.patientName),
    message: params.message || getPatientEventMessage(params.type, params.patientName),
    severity: params.severity || 'info',
    related_patient_id: params.patientId,
    related_workspace_id: params.workspaceId,
    action_url: `/dashboard/patients/${params.patientId}`,
    data: {
      patient_id: params.patientId,
      patient_name: params.patientName,
    },
  }

  return NotificationService.createNotification(payload)
}

/**
 * Create a mention notification
 */
export async function notifyMention(params: {
  mentionedUserId: string
  mentionedByName: string
  noteId: string
  noteContent: string
  patientId?: string
  workspaceId: string
  severity?: NotificationSeverity
}) {
  const actionUrl = params.patientId
    ? `/dashboard/patients/${params.patientId}?tab=notes`
    : `/dashboard/workspace/${params.workspaceId}?tab=notes`

  const payload: CreateNotificationPayload = {
    user_id: params.mentionedUserId,
    type: 'mention',
    title: `${params.mentionedByName} sizi etiketledi`,
    message: params.noteContent.substring(0, 100),
    severity: params.severity || 'medium',
    related_note_id: params.noteId,
    related_patient_id: params.patientId,
    related_workspace_id: params.workspaceId,
    action_url: actionUrl,
    data: {
      mentioned_by: params.mentionedByName,
      note_id: params.noteId,
    },
  }

  return NotificationService.createNotification(payload)
}

/**
 * Create a patient assignment notification
 */
export async function notifyPatientAssignment(params: {
  assignedUserId: string
  assignedByName: string
  patientId: string
  patientName: string
  workspaceId: string
  assignmentType: 'primary' | 'secondary' | 'consultant'
}) {
  const payload: CreateNotificationPayload = {
    user_id: params.assignedUserId,
    type: 'patient_assigned',
    title: 'Hasta Atandı',
    message: `${params.assignedByName} size bir hasta atadı: ${params.patientName}`,
    severity: 'medium',
    related_patient_id: params.patientId,
    related_workspace_id: params.workspaceId,
    action_url: `/dashboard/patients/${params.patientId}`,
    data: {
      patient_id: params.patientId,
      patient_name: params.patientName,
      assigned_by: params.assignedByName,
      assignment_type: params.assignmentType,
    },
  }

  return NotificationService.createNotification(payload)
}

/**
 * Create an AI alert notification
 */
export async function notifyAIAlert(params: {
  userId: string
  patientId: string
  patientName: string
  workspaceId: string
  alertType: string
  alertMessage: string
  severity: NotificationSeverity
  recommendations?: string[]
}) {
  const payload: CreateNotificationPayload = {
    user_id: params.userId,
    type: 'ai_alert',
    title: `AI Uyarısı: ${params.patientName}`,
    message: params.alertMessage,
    severity: params.severity,
    related_patient_id: params.patientId,
    related_workspace_id: params.workspaceId,
    action_url: `/dashboard/patients/${params.patientId}?tab=ai`,
    data: {
      patient_id: params.patientId,
      patient_name: params.patientName,
      alert_type: params.alertType,
      recommendations: params.recommendations || [],
    },
  }

  return NotificationService.createNotification(payload)
}

/**
 * Create a critical value notification
 */
export async function notifyCriticalValue(params: {
  userId: string
  patientId: string
  patientName: string
  workspaceId: string
  valueType: string
  value: string
  normalRange: string
}) {
  const payload: CreateNotificationPayload = {
    user_id: params.userId,
    type: 'critical_value',
    title: `⚠️ Kritik Değer: ${params.patientName}`,
    message: `${params.valueType}: ${params.value} (Normal: ${params.normalRange})`,
    severity: 'critical',
    related_patient_id: params.patientId,
    related_workspace_id: params.workspaceId,
    action_url: `/dashboard/patients/${params.patientId}`,
    data: {
      patient_id: params.patientId,
      patient_name: params.patientName,
      value_type: params.valueType,
      value: params.value,
      normal_range: params.normalRange,
    },
  }

  return NotificationService.createNotification(payload)
}

/**
 * Create a task notification
 */
export async function notifyTask(params: {
  userId: string
  taskId: string
  taskTitle: string
  taskType: 'assigned' | 'due' | 'completed'
  patientId?: string
  workspaceId: string
  dueDate?: string
  assignedByName?: string
}) {
  const typeMap = {
    assigned: 'task_assigned',
    due: 'task_due',
    completed: 'task_completed',
  } as const

  const titleMap = {
    assigned: 'Yeni Görev Atandı',
    due: 'Görev Yaklaşan',
    completed: 'Görev Tamamlandı',
  }

  const severityMap: Record<typeof params.taskType, NotificationSeverity> = {
    assigned: 'medium',
    due: 'high',
    completed: 'info',
  }

  const payload: CreateNotificationPayload = {
    user_id: params.userId,
    type: typeMap[params.taskType],
    title: titleMap[params.taskType],
    message: params.taskTitle,
    severity: severityMap[params.taskType],
    related_patient_id: params.patientId,
    related_workspace_id: params.workspaceId,
    action_url: params.patientId
      ? `/dashboard/patients/${params.patientId}?tab=tasks`
      : `/dashboard/workspace/${params.workspaceId}?tab=tasks`,
    data: {
      task_id: params.taskId,
      task_title: params.taskTitle,
      task_type: params.taskType,
      due_date: params.dueDate,
      assigned_by: params.assignedByName,
    },
  }

  return NotificationService.createNotification(payload)
}

/**
 * Create a workspace invitation notification
 */
export async function notifyWorkspaceInvite(params: {
  userId: string
  workspaceId: string
  workspaceName: string
  invitedByName: string
  role: string
}) {
  const payload: CreateNotificationPayload = {
    user_id: params.userId,
    type: 'workspace_invite',
    title: 'Workspace Daveti',
    message: `${params.invitedByName} sizi ${params.workspaceName} workspace'ine davet etti`,
    severity: 'medium',
    related_workspace_id: params.workspaceId,
    action_url: `/dashboard/workspace/${params.workspaceId}/invite`,
    data: {
      workspace_id: params.workspaceId,
      workspace_name: params.workspaceName,
      invited_by: params.invitedByName,
      role: params.role,
    },
  }

  return NotificationService.createNotification(payload)
}

/**
 * Notify workspace members about a patient event
 */
export async function notifyWorkspaceAboutPatient(params: {
  workspaceId: string
  type: NotificationType
  patientId: string
  patientName: string
  message?: string
  severity?: NotificationSeverity
  excludeUserId?: string
}) {
  return NotificationService.notifyWorkspaceMembers({
    workspace_id: params.workspaceId,
    type: params.type,
    title: getPatientEventTitle(params.type, params.patientName),
    message: params.message || getPatientEventMessage(params.type, params.patientName),
    severity: params.severity || 'info',
    related_patient_id: params.patientId,
    action_url: `/dashboard/patients/${params.patientId}`,
    exclude_user_id: params.excludeUserId,
    data: {
      patient_id: params.patientId,
      patient_name: params.patientName,
    },
  })
}

// ============================================
// HELPER FUNCTIONS - TITLES & MESSAGES
// ============================================

function getPatientEventTitle(type: NotificationType, patientName: string): string {
  const titles: Record<string, string> = {
    patient_created: 'Yeni Hasta Eklendi',
    patient_updated: 'Hasta Güncellendi',
    patient_assigned: 'Hasta Atandı',
    patient_discharged: 'Hasta Taburcu Edildi',
  }

  return titles[type] || 'Hasta Bildirimi'
}

function getPatientEventMessage(type: NotificationType, patientName: string): string {
  const messages: Record<string, string> = {
    patient_created: `Yeni hasta eklendi: ${patientName}`,
    patient_updated: `Hasta bilgileri güncellendi: ${patientName}`,
    patient_assigned: `Hasta atandı: ${patientName}`,
    patient_discharged: `Hasta taburcu edildi: ${patientName}`,
  }

  return messages[type] || patientName
}

// ============================================
// NOTIFICATION ICONS & COLORS
// ============================================

export function getNotificationIcon(type: NotificationType): string {
  const icons: Record<NotificationType, string> = {
    patient_created: '🏥',
    patient_updated: '📝',
    patient_assigned: '👨‍⚕️',
    patient_discharged: '✅',
    mention: '💬',
    note_added: '📌',
    ai_alert: '🤖',
    ai_analysis_complete: '✨',
    critical_value: '⚠️',
    task_assigned: '📋',
    task_due: '⏰',
    task_completed: '✅',
    assignment: '👤',
    workspace_invite: '📨',
    system: 'ℹ️',
  }

  return icons[type] || '🔔'
}

export function getNotificationColor(severity: NotificationSeverity): string {
  const colors: Record<NotificationSeverity, string> = {
    critical: 'red',
    high: 'orange',
    medium: 'yellow',
    low: 'blue',
    info: 'gray',
  }

  return colors[severity] || 'gray'
}

export function getSeverityBadgeClass(severity: NotificationSeverity): string {
  const classes: Record<NotificationSeverity, string> = {
    critical: 'bg-red-100 text-red-800 border-red-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-blue-100 text-blue-800 border-blue-200',
    info: 'bg-gray-100 text-gray-800 border-gray-200',
  }

  return classes[severity] || classes.info
}

// ============================================
// TIME FORMATTING
// ============================================

export function formatNotificationTime(createdAt: string): string {
  const now = new Date()
  const created = new Date(createdAt)
  const diffMs = now.getTime() - created.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Şimdi'
  if (diffMins < 60) return `${diffMins} dakika önce`
  if (diffHours < 24) return `${diffHours} saat önce`
  if (diffDays < 7) return `${diffDays} gün önce`

  return created.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: created.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}
