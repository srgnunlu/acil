/**
 * Notification Service
 * Phase 6: Comprehensive Notification System
 *
 * Handles creating, sending, and managing notifications across all channels
 */

import { createClient } from '@/lib/supabase/client'
import type {
  Notification,
  CreateNotificationPayload,
  NotifyWorkspaceMembersPayload,
  NotificationFilters,
  NotificationStats,
  NotificationServiceResponse,
} from '@/types/notification.types'

/**
 * Notification Service Class
 */
export class NotificationService {
  /**
   * Create a single notification
   */
  static async createNotification(
    payload: CreateNotificationPayload
  ): Promise<NotificationServiceResponse<Notification>> {
    try {
      const supabase = createClient()

      const { data, error } = await supabase.rpc('create_notification', {
        p_user_id: payload.user_id,
        p_type: payload.type,
        p_title: payload.title,
        p_message: payload.message || null,
        p_severity: payload.severity || 'info',
        p_related_patient_id: payload.related_patient_id || null,
        p_related_workspace_id: payload.related_workspace_id || null,
        p_related_note_id: payload.related_note_id || null,
        p_data: payload.data || {},
        p_action_url: payload.action_url || null,
        p_expires_at: payload.expires_at || null,
      })

      if (error) {
        console.error('[NotificationService] Create error:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: data as Notification }
    } catch (error) {
      console.error('[NotificationService] Create exception:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Notify all workspace members
   */
  static async notifyWorkspaceMembers(
    payload: NotifyWorkspaceMembersPayload
  ): Promise<NotificationServiceResponse<number>> {
    try {
      const supabase = createClient()

      const { data, error } = await supabase.rpc('notify_workspace_members', {
        p_workspace_id: payload.workspace_id,
        p_type: payload.type,
        p_title: payload.title,
        p_message: payload.message || null,
        p_severity: payload.severity || 'info',
        p_related_patient_id: payload.related_patient_id || null,
        p_related_note_id: payload.related_note_id || null,
        p_data: payload.data || {},
        p_action_url: payload.action_url || null,
        p_exclude_user_id: payload.exclude_user_id || null,
      })

      if (error) {
        console.error('[NotificationService] Notify workspace error:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: data as number }
    } catch (error) {
      console.error('[NotificationService] Notify workspace exception:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Get notifications for current user
   */
  static async getNotifications(
    filters?: NotificationFilters
  ): Promise<NotificationServiceResponse<Notification[]>> {
    try {
      const supabase = createClient()

      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters?.is_read !== undefined) {
        query = query.eq('is_read', filters.is_read)
      }

      if (filters?.severity) {
        if (Array.isArray(filters.severity)) {
          query = query.in('severity', filters.severity)
        } else {
          query = query.eq('severity', filters.severity)
        }
      }

      if (filters?.type) {
        if (Array.isArray(filters.type)) {
          query = query.in('type', filters.type)
        } else {
          query = query.eq('type', filters.type)
        }
      }

      if (filters?.related_patient_id) {
        query = query.eq('related_patient_id', filters.related_patient_id)
      }

      if (filters?.related_workspace_id) {
        query = query.eq('related_workspace_id', filters.related_workspace_id)
      }

      if (filters?.created_after) {
        query = query.gte('created_at', filters.created_after)
      }

      if (filters?.created_before) {
        query = query.lte('created_at', filters.created_before)
      }

      if (filters?.limit) {
        query = query.limit(filters.limit)
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
      }

      const { data, error } = await query

      if (error) {
        console.error('[NotificationService] Get notifications error:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: (data as Notification[]) || [] }
    } catch (error) {
      console.error('[NotificationService] Get notifications exception:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<NotificationServiceResponse<void>> {
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', notificationId)

      if (error) {
        console.error('[NotificationService] Mark as read error:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('[NotificationService] Mark as read exception:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(): Promise<NotificationServiceResponse<void>> {
    try {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        return { success: false, error: 'User not authenticated' }
      }

      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) {
        console.error('[NotificationService] Mark all as read error:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('[NotificationService] Mark all as read exception:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(notificationId: string): Promise<NotificationServiceResponse<void>> {
    try {
      const supabase = createClient()

      const { error } = await supabase.from('notifications').delete().eq('id', notificationId)

      if (error) {
        console.error('[NotificationService] Delete error:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('[NotificationService] Delete exception:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Clear all notifications
   */
  static async clearAll(): Promise<NotificationServiceResponse<void>> {
    try {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        return { success: false, error: 'User not authenticated' }
      }

      const { error } = await supabase.from('notifications').delete().eq('user_id', user.id)

      if (error) {
        console.error('[NotificationService] Clear all error:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('[NotificationService] Clear all exception:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Get notification statistics
   */
  static async getStats(): Promise<NotificationServiceResponse<NotificationStats>> {
    try {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        return { success: false, error: 'User not authenticated' }
      }

      // Get all notifications
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)

      if (error) {
        console.error('[NotificationService] Get stats error:', error)
        return { success: false, error: error.message }
      }

      const notifs = (notifications as Notification[]) || []

      // Calculate stats
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      const stats: NotificationStats = {
        total: notifs.length,
        unread: notifs.filter((n) => !n.is_read).length,
        by_severity: {
          critical: notifs.filter((n) => n.severity === 'critical').length,
          high: notifs.filter((n) => n.severity === 'high').length,
          medium: notifs.filter((n) => n.severity === 'medium').length,
          low: notifs.filter((n) => n.severity === 'low').length,
          info: notifs.filter((n) => n.severity === 'info').length,
        },
        by_type: notifs.reduce(
          (acc, n) => {
            acc[n.type] = (acc[n.type] || 0) + 1
            return acc
          },
          {} as Record<string, number>
        ),
        today: notifs.filter((n) => new Date(n.created_at) >= today).length,
        this_week: notifs.filter((n) => new Date(n.created_at) >= weekAgo).length,
      }

      return { success: true, data: stats }
    } catch (error) {
      console.error('[NotificationService] Get stats exception:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Check if user should receive notification based on preferences
   */
  static async shouldNotify(
    userId: string,
    notificationType: string,
    severity: string = 'info'
  ): Promise<boolean> {
    try {
      const supabase = createClient()

      const { data, error } = await supabase.rpc('check_notification_preferences', {
        p_user_id: userId,
        p_notification_type: notificationType,
        p_severity: severity,
      })

      if (error) {
        console.error('[NotificationService] Check preferences error:', error)
        return true // Default to sending notification on error
      }

      return data as boolean
    } catch (error) {
      console.error('[NotificationService] Check preferences exception:', error)
      return true // Default to sending notification on error
    }
  }
}
