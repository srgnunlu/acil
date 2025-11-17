/**
 * useRealtimePresence Hook
 *
 * Tracks user presence in a workspace (who's online, what they're viewing)
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { PresenceStatus } from '@/types/realtime.types'
import type { ConnectionStatus } from '@/types/realtime.types'

export interface PresenceState {
  user_id: string
  workspace_id: string
  viewing_patient_id?: string | null
  status: PresenceStatus
  online_at: string
  // Additional user info
  full_name?: string
  avatar_url?: string
  title?: string
}

export interface UseRealtimePresenceOptions {
  workspaceId: string
  userId: string
  enabled?: boolean
  initialStatus?: PresenceStatus
}

export interface UseRealtimePresenceReturn {
  presenceState: Map<string, PresenceState>
  onlineUsers: PresenceState[]
  status: ConnectionStatus
  error: Error | null
  updatePresence: (
    updates: Partial<Pick<PresenceState, 'status' | 'viewing_patient_id'>>
  ) => Promise<void>
  getUsersViewingPatient: (patientId: string) => PresenceState[]
}

/**
 * Hook to track and manage user presence
 */
export function useRealtimePresence({
  workspaceId,
  userId,
  enabled = true,
  initialStatus = 'online',
}: UseRealtimePresenceOptions): UseRealtimePresenceReturn {
  const [presenceState, setPresenceState] = useState<Map<string, PresenceState>>(new Map())
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [error, setError] = useState<Error | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const currentStateRef = useRef<PresenceState | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const retryCountRef = useRef(0)
  const maxRetries = 5
  const supabaseRef = useRef(createClient())

  // Get online users (excluding offline)
  const onlineUsers = Array.from(presenceState.values()).filter((p) => p.status !== 'offline')

  /**
   * Update local presence state
   */
  const updatePresence = useCallback(
    async (updates: Partial<Pick<PresenceState, 'status' | 'viewing_patient_id'>>) => {
      if (!channelRef.current || !currentStateRef.current) {
        console.warn('[useRealtimePresence] Cannot update presence: channel not ready')
        return
      }

      try {
        const newState: PresenceState = {
          ...currentStateRef.current,
          ...updates,
          online_at: new Date().toISOString(),
        }

        currentStateRef.current = newState

        // Track presence
        const trackResult = await channelRef.current.track(newState)
        if (trackResult !== 'ok') {
          console.warn('[useRealtimePresence] Failed to track presence:', trackResult)
        }

        console.log('[useRealtimePresence] Presence updated:', newState)
      } catch (err) {
        console.error('[useRealtimePresence] Error updating presence:', err)
        setError(err as Error)
      }
    },
    []
  )

  /**
   * Get users viewing a specific patient
   */
  const getUsersViewingPatient = useCallback(
    (patientId: string): PresenceState[] => {
      return Array.from(presenceState.values()).filter(
        (p) => p.viewing_patient_id === patientId && p.status !== 'offline'
      )
    },
    [presenceState]
  )

  useEffect(() => {
    if (!enabled || !workspaceId || !userId) {
      return
    }

    const channelName = `workspace:${workspaceId}:presence`
    retryCountRef.current = 0 // Reset retry count on new setup

    // Fetch user profile info for presence
    const setupPresence = async () => {
      // Set status inside async function to avoid synchronous setState in effect
      setStatus('connecting')
      setError(null)

      try {
        // Get user profile with error handling
        let profileData: {
          full_name: string | null
          avatar_url: string | null
          title: string | null
        } | null = null
        try {
          const { data: profile, error: profileError } = await supabaseRef.current
            .from('profiles')
            .select('full_name, avatar_url, title')
            .eq('user_id', userId)
            .single()

          if (!profileError && profile) {
            profileData = {
              full_name: profile.full_name || null,
              avatar_url: profile.avatar_url || null,
              title: profile.title || null,
            }
          } else if (profileError && profileError.code !== 'PGRST116') {
            // PGRST116 is "no rows returned" which is acceptable
            console.warn(
              '[useRealtimePresence] Profile fetch error (non-critical):',
              profileError.message
            )
          }
        } catch (profileErr) {
          console.warn('[useRealtimePresence] Profile fetch exception (non-critical):', profileErr)
        }

        // Initial presence state with fallback values
        const initialState: PresenceState = {
          user_id: userId,
          workspace_id: workspaceId,
          status: initialStatus,
          viewing_patient_id: null,
          online_at: new Date().toISOString(),
          full_name: profileData?.full_name || undefined,
          avatar_url: profileData?.avatar_url || undefined,
          title: profileData?.title || undefined,
        }

        currentStateRef.current = initialState

        // Create channel with explicit config
        const channel = supabaseRef.current.channel(channelName, {
          config: {
            presence: {
              key: userId,
            },
            broadcast: {
              self: true,
            },
          },
        })
        channelRef.current = channel

        console.log('[useRealtimePresence] Channel created:', channelName, 'for user:', userId)

        // Handle presence sync
        channel.on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState<PresenceState>()
          console.log('[useRealtimePresence] Presence synced:', state)

          // Convert to Map
          const newPresenceMap = new Map<string, PresenceState>()

          Object.entries(state).forEach(([key, presences]) => {
            if (presences && presences.length > 0) {
              const latest = presences[0] as PresenceState
              newPresenceMap.set(key, latest)
            }
          })

          setPresenceState(newPresenceMap)
        })

        // Handle user join
        channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log('[useRealtimePresence] User joined:', key, newPresences)
        })

        // Handle user leave
        channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          console.log('[useRealtimePresence] User left:', key, leftPresences)
        })

        // Handle reconnection with exponential backoff
        const handleReconnect = () => {
          if (retryCountRef.current >= maxRetries) {
            console.error('[useRealtimePresence] Max retries reached, giving up')
            setStatus('error')
            setError(
              new Error(
                'Failed to connect after multiple attempts. Please check Supabase Realtime is enabled.'
              )
            )
            return
          }

          retryCountRef.current += 1
          const delay = Math.min(1000 * Math.pow(2, retryCountRef.current - 1), 30000) // Exponential backoff, max 30s

          console.log(
            `[useRealtimePresence] Retrying connection (attempt ${retryCountRef.current}/${maxRetries}) in ${delay}ms`
          )

          // Clear existing timeout
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
          }

          setStatus('connecting')

          // Schedule reconnect
          reconnectTimeoutRef.current = setTimeout(() => {
            // Clean up old channel
            if (channelRef.current) {
              channelRef.current.untrack().catch(() => {})
              supabaseRef.current.removeChannel(channelRef.current)
              channelRef.current = null
            }
            // Retry setup
            setupPresence()
          }, delay)
        }

        // Subscribe with retry logic
        channel.subscribe(async (subscribeStatus) => {
          console.log('[useRealtimePresence] Status:', subscribeStatus)

          if (subscribeStatus === 'SUBSCRIBED') {
            setStatus('connected')
            retryCountRef.current = 0 // Reset retry count on success
            setError(null)

            // Track initial presence
            try {
              await channel.track(initialState)
              console.log('[useRealtimePresence] Initial presence tracked')
            } catch (trackErr) {
              console.error('[useRealtimePresence] Failed to track initial presence:', trackErr)
            }
          } else if (subscribeStatus === 'CHANNEL_ERROR') {
            console.error('[useRealtimePresence] Channel error')
            handleReconnect()
          } else if (subscribeStatus === 'TIMED_OUT') {
            console.warn('[useRealtimePresence] Subscription timed out, retrying...')
            handleReconnect()
          } else if (subscribeStatus === 'CLOSED') {
            console.log('[useRealtimePresence] Channel closed')
            // Only set disconnected if not retrying
            if (retryCountRef.current === 0) {
              setStatus('disconnected')
            }
          }
        })
      } catch (err) {
        console.error('[useRealtimePresence] Setup error:', err)
        setStatus('error')
        setError(err as Error)
      }
    }

    setupPresence()

    // Set user to offline on unmount
    return () => {
      console.log('[useRealtimePresence] Cleaning up')

      // Clear reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }

      if (channelRef.current) {
        // Untrack presence (set offline)
        channelRef.current
          .untrack()
          .then(() => {
            if (channelRef.current) {
              supabaseRef.current.removeChannel(channelRef.current)
              channelRef.current = null
            }
          })
          .catch(() => {
            // Ignore errors during cleanup
            if (channelRef.current) {
              supabaseRef.current.removeChannel(channelRef.current)
              channelRef.current = null
            }
          })
      }
    }
  }, [workspaceId, userId, enabled, initialStatus])

  // Update presence in database
  useEffect(() => {
    if (!enabled || !workspaceId || !userId || status !== 'connected') {
      return
    }

    // Update database presence
    const updateDbPresence = async () => {
      try {
        await supabaseRef.current.rpc('update_user_presence', {
          p_workspace_id: workspaceId,
          p_status: currentStateRef.current?.status || initialStatus,
          p_viewing_patient_id: currentStateRef.current?.viewing_patient_id || null,
        })
      } catch (err) {
        console.error('[useRealtimePresence] Failed to update DB presence:', err)
      }
    }

    updateDbPresence()

    // Update every 30 seconds
    const interval = setInterval(updateDbPresence, 30000)

    return () => clearInterval(interval)
  }, [workspaceId, userId, enabled, status, initialStatus])

  return {
    presenceState,
    onlineUsers,
    status,
    error,
    updatePresence,
    getUsersViewingPatient,
  }
}
