/**
 * useRealtimeActivity Hook
 *
 * Subscribes to real-time activity log in a workspace
 */

import { useEffect, useRef, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { ActivityLog, ActivityLogWithUser } from '@/types/realtime.types'
import type { ConnectionStatus } from '@/types/realtime.types'

export interface UseRealtimeActivityOptions {
  workspaceId: string
  enabled?: boolean
  limit?: number
  onActivity?: (activity: ActivityLogWithUser) => void
}

export interface UseRealtimeActivityReturn {
  activities: ActivityLogWithUser[]
  status: ConnectionStatus
  error: Error | null
  clearActivities: () => void
}

/**
 * Hook to subscribe to real-time activity log
 */
export function useRealtimeActivity({
  workspaceId,
  enabled = true,
  limit = 50,
  onActivity
}: UseRealtimeActivityOptions): UseRealtimeActivityReturn {
  const [activities, setActivities] = useState<ActivityLogWithUser[]>([])
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [error, setError] = useState<Error | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabase = createClient()

  const clearActivities = () => {
    setActivities([])
  }

  // Load initial activities
  useEffect(() => {
    if (!enabled || !workspaceId) {
      return
    }

    async function loadActivities() {
      try {
        const { data, error } = await supabase
          .from('activity_log')
          .select(
            `
            *,
            user:user_id (
              full_name:profiles!inner(full_name),
              avatar_url:profiles!inner(avatar_url),
              title:profiles!inner(title)
            )
          `
          )
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: false })
          .limit(limit)

        if (error) throw error

        // Transform data
        const transformedData = (data || []).map((item) => ({
          ...item,
          user: item.user
            ? {
                full_name: item.user.full_name || null,
                avatar_url: item.user.avatar_url || null,
                title: item.user.title || null
              }
            : null
        })) as ActivityLogWithUser[]

        setActivities(transformedData)
      } catch (err) {
        console.error('[useRealtimeActivity] Failed to load:', err)
      }
    }

    loadActivities()
  }, [workspaceId, enabled, limit, supabase])

  // Subscribe to real-time activity
  useEffect(() => {
    if (!enabled || !workspaceId) {
      return
    }

    const channelName = `workspace:${workspaceId}:activity`
    setStatus('connecting')
    setError(null)

    try {
      // Create channel
      const channel = supabase.channel(channelName)
      channelRef.current = channel

      // Subscribe to new activity
      channel
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'activity_log',
            filter: `workspace_id=eq.${workspaceId}`
          },
          async (payload) => {
            console.log('[useRealtimeActivity] New activity:', payload.new)

            const newActivity = payload.new as ActivityLog

            // Fetch user info
            let userInfo = null
            if (newActivity.user_id) {
              const { data } = await supabase
                .from('profiles')
                .select('full_name, avatar_url, title')
                .eq('user_id', newActivity.user_id)
                .single()

              userInfo = data || null
            }

            const activityWithUser: ActivityLogWithUser = {
              ...newActivity,
              user: userInfo
            }

            // Add to state (keep only last {limit} items)
            setActivities((prev) => [activityWithUser, ...prev].slice(0, limit))

            // Call callback
            if (onActivity) {
              onActivity(activityWithUser)
            }
          }
        )
        .subscribe((status) => {
          console.log('[useRealtimeActivity] Status:', status)

          if (status === 'SUBSCRIBED') {
            setStatus('connected')
          } else if (status === 'CHANNEL_ERROR') {
            setStatus('error')
            setError(new Error('Activity channel error'))
          } else if (status === 'TIMED_OUT') {
            setStatus('error')
            setError(new Error('Activity subscription timed out'))
          } else if (status === 'CLOSED') {
            setStatus('disconnected')
          }
        })
    } catch (err) {
      console.error('[useRealtimeActivity] Error:', err)
      setStatus('error')
      setError(err as Error)
    }

    // Cleanup
    return () => {
      console.log('[useRealtimeActivity] Cleaning up channel')
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [workspaceId, enabled, limit, onActivity, supabase])

  return {
    activities,
    status,
    error,
    clearActivities
  }
}
