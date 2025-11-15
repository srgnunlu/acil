/**
 * useRealtimeNotifications Hook
 *
 * Subscribes to real-time notifications for a user
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { ConnectionStatus } from '@/types/realtime.types'
import type { Notification } from '@/types/notification.types'

export interface UseRealtimeNotificationsOptions {
  userId: string
  enabled?: boolean
  onNotification?: (notification: Notification) => void
}

export interface UseRealtimeNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  status: ConnectionStatus
  error: Error | null
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  clearNotifications: () => void
}

/**
 * Hook to subscribe to real-time notifications
 */
export function useRealtimeNotifications({
  userId,
  enabled = true,
  onNotification,
}: UseRealtimeNotificationsOptions): UseRealtimeNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [error, setError] = useState<Error | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabase = createClient()

  // Store callback in ref to avoid re-subscribing on every render
  const onNotificationRef = useRef(onNotification)

  // Update callback ref when it changes
  useEffect(() => {
    onNotificationRef.current = onNotification
  }, [onNotification])

  // Calculate unread count
  const unreadCount = notifications.filter((n) => !n.is_read).length

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        const { error } = await supabase
          .from('notifications')
          .update({
            is_read: true,
            read_at: new Date().toISOString(),
          })
          .eq('id', notificationId)

        if (error) throw error

        // Update local state
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
          )
        )
      } catch (err) {
        console.error('[useRealtimeNotifications] Failed to mark as read:', err)
        throw err
      }
    },
    [supabase]
  )

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('is_read', false)

      if (error) throw error

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      )
    } catch (err) {
      console.error('[useRealtimeNotifications] Failed to mark all as read:', err)
      throw err
    }
  }, [userId, supabase])

  /**
   * Clear all notifications from state
   */
  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  // Load initial notifications
  useEffect(() => {
    if (!enabled || !userId) {
      return
    }

    async function loadNotifications() {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) throw error

        setNotifications((data as Notification[]) || [])
        setError(null)
      } catch (err) {
        console.error('[useRealtimeNotifications] Failed to load:', err)
        setError(err as Error)
        setNotifications([]) // Set empty array on error
      }
    }

    loadNotifications()
  }, [userId, enabled, supabase])

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!enabled || !userId) {
      return
    }

    const channelName = `user:${userId}:notifications`
    setStatus('connecting')
    setError(null)

    try {
      // Create channel
      const channel = supabase.channel(channelName)
      channelRef.current = channel

      // Subscribe to new notifications
      channel
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            try {
              console.log('[useRealtimeNotifications] New notification:', payload.new)

              const newNotification = payload.new as Notification

              // Add to state
              setNotifications((prev) => [newNotification, ...prev])

              // Call callback
              if (onNotificationRef.current) {
                try {
                  onNotificationRef.current(newNotification)
                } catch (callbackErr) {
                  console.error('[useRealtimeNotifications] Callback error:', callbackErr)
                }
              }

              // Show browser notification if supported and permission granted
              if (
                'Notification' in window &&
                Notification.permission === 'granted' &&
                newNotification.severity === 'critical'
              ) {
                try {
                  new Notification(newNotification.title, {
                    body: newNotification.message || undefined,
                    icon: '/icon-192.png',
                    badge: '/icon-192.png',
                    tag: newNotification.id,
                  })
                } catch (notifErr) {
                  console.warn('[useRealtimeNotifications] Browser notification error:', notifErr)
                }
              }
            } catch (err) {
              console.error('[useRealtimeNotifications] Error processing notification:', err)
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            console.log('[useRealtimeNotifications] Notification updated:', payload.new)

            const updated = payload.new as Notification

            // Update in state
            setNotifications((prev) => prev.map((n) => (n.id === updated.id ? updated : n)))
          }
        )
        .subscribe((status) => {
          console.log('[useRealtimeNotifications] Status:', status)

          if (status === 'SUBSCRIBED') {
            setStatus('connected')
          } else if (status === 'CHANNEL_ERROR') {
            setStatus('error')
            setError(new Error('Notifications channel error'))
          } else if (status === 'TIMED_OUT') {
            setStatus('error')
            setError(new Error('Notifications subscription timed out'))
          } else if (status === 'CLOSED') {
            setStatus('disconnected')
          }
        })
    } catch (err) {
      console.error('[useRealtimeNotifications] Error:', err)
      setStatus('error')
      setError(err as Error)
    }

    // Cleanup
    return () => {
      console.log('[useRealtimeNotifications] Cleaning up channel')
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [userId, enabled, supabase])

  return {
    notifications,
    unreadCount,
    status,
    error,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  }
}
