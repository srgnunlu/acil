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
  onActivity,
}: UseRealtimeActivityOptions): UseRealtimeActivityReturn {
  const [activities, setActivities] = useState<ActivityLogWithUser[]>([])
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [error, setError] = useState<Error | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabase = createClient()

  // Store callback in ref to avoid re-subscribing on every render
  const onActivityRef = useRef(onActivity)

  // Update callback ref when it changes
  useEffect(() => {
    onActivityRef.current = onActivity
  }, [onActivity])

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
        // First, get activities
        const { data: activitiesData, error: activitiesError } = await supabase
          .from('activity_log')
          .select('*')
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: false })
          .limit(limit)

        if (activitiesError) throw activitiesError

        if (!activitiesData || activitiesData.length === 0) {
          setActivities([])
          return
        }

        // Get unique user IDs
        const userIds = [
          ...new Set(
            activitiesData.map((a) => a.user_id).filter((id): id is string => id !== null)
          ),
        ]

        // Fetch user profiles
        const profilesMap = new Map<
          string,
          { full_name: string | null; avatar_url: string | null; title: string | null }
        >()
        if (userIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('user_id, full_name, avatar_url, title')
            .in('user_id', userIds)

          if (profilesData) {
            profilesData.forEach((profile) => {
              profilesMap.set(profile.user_id, {
                full_name: profile.full_name || null,
                avatar_url: profile.avatar_url || null,
                title: profile.title || null,
              })
            })
          }
        }

        // Transform data
        const transformedData = activitiesData.map((item) => ({
          ...item,
          user: item.user_id ? profilesMap.get(item.user_id) || null : null,
        })) as ActivityLogWithUser[]

        setActivities(transformedData)
      } catch (err) {
        console.error('[useRealtimeActivity] Failed to load:', err)
        setError(err as Error)
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
            filter: `workspace_id=eq.${workspaceId}`,
          },
          async (payload) => {
            try {
              console.log('[useRealtimeActivity] New activity:', payload.new)

              const newActivity = payload.new as ActivityLog

              // Fetch user info
              let userInfo = null
              if (newActivity.user_id) {
                try {
                  const { data } = await supabase
                    .from('profiles')
                    .select('full_name, avatar_url, title')
                    .eq('user_id', newActivity.user_id)
                    .single()

                  userInfo = data || null
                } catch (profileErr) {
                  console.warn('[useRealtimeActivity] Failed to fetch user profile:', profileErr)
                  // Continue without user info
                }
              }

              const activityWithUser: ActivityLogWithUser = {
                ...newActivity,
                user: userInfo,
              }

              // Add to state (keep only last {limit} items)
              setActivities((prev) => [activityWithUser, ...prev].slice(0, limit))

              // Call callback
              if (onActivityRef.current) {
                try {
                  onActivityRef.current(activityWithUser)
                } catch (callbackErr) {
                  console.error('[useRealtimeActivity] Callback error:', callbackErr)
                }
              }
            } catch (err) {
              console.error('[useRealtimeActivity] Error processing activity:', err)
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
  }, [workspaceId, enabled, limit, supabase])

  return {
    activities,
    status,
    error,
    clearActivities,
  }
}
