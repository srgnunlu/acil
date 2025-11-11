/**
 * useRealtimePatients Hook
 *
 * Subscribes to real-time patient updates in a workspace
 */

import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { Patient } from '@/types'
import type { ConnectionStatus } from '@/types/realtime.types'

export interface UseRealtimePatientsOptions {
  workspaceId: string
  enabled?: boolean
  onInsert?: (patient: Patient) => void
  onUpdate?: (patient: Patient) => void
  onDelete?: (patientId: string) => void
}

export interface UseRealtimePatientsReturn {
  status: ConnectionStatus
  error: Error | null
  channel: RealtimeChannel | null
}

/**
 * Hook to subscribe to real-time patient changes
 */
export function useRealtimePatients({
  workspaceId,
  enabled = true,
  onInsert,
  onUpdate,
  onDelete,
}: UseRealtimePatientsOptions): UseRealtimePatientsReturn {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [error, setError] = useState<Error | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const queryClient = useQueryClient()
  const supabase = createClient()

  // Store callbacks in refs to avoid re-subscribing on every render
  const callbacksRef = useRef({ onInsert, onUpdate, onDelete })

  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = { onInsert, onUpdate, onDelete }
  }, [onInsert, onUpdate, onDelete])

  useEffect(() => {
    if (!enabled || !workspaceId) {
      return
    }

    const channelName = `workspace:${workspaceId}:patients`

    // Set status inside async operation to avoid synchronous setState in effect
    const setupChannel = () => {
      setStatus('connecting')
      setError(null)

      try {
        // Create channel
        const channel = supabase.channel(channelName)
        channelRef.current = channel

        // Subscribe to postgres changes
        channel
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'patients',
              filter: `workspace_id=eq.${workspaceId}`,
            },
            (payload: RealtimePostgresChangesPayload<Patient>) => {
              try {
                console.log('[useRealtimePatients] INSERT:', payload.new)

                // Invalidate queries
                queryClient.invalidateQueries({ queryKey: ['patients', workspaceId] })

                // Call callback
                if (callbacksRef.current.onInsert) {
                  try {
                    callbacksRef.current.onInsert(payload.new)
                  } catch (callbackErr) {
                    console.error('[useRealtimePatients] Insert callback error:', callbackErr)
                  }
                }
              } catch (err) {
                console.error('[useRealtimePatients] Error processing INSERT:', err)
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'patients',
              filter: `workspace_id=eq.${workspaceId}`,
            },
            (payload: RealtimePostgresChangesPayload<Patient>) => {
              try {
                console.log('[useRealtimePatients] UPDATE:', payload.new)

                // Invalidate queries
                queryClient.invalidateQueries({ queryKey: ['patients', workspaceId] })
                queryClient.invalidateQueries({ queryKey: ['patient', payload.new.id] })

                // Call callback
                if (callbacksRef.current.onUpdate) {
                  try {
                    callbacksRef.current.onUpdate(payload.new)
                  } catch (callbackErr) {
                    console.error('[useRealtimePatients] Update callback error:', callbackErr)
                  }
                }
              } catch (err) {
                console.error('[useRealtimePatients] Error processing UPDATE:', err)
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'DELETE',
              schema: 'public',
              table: 'patients',
              filter: `workspace_id=eq.${workspaceId}`,
            },
            (payload: RealtimePostgresChangesPayload<Patient>) => {
              try {
                console.log('[useRealtimePatients] DELETE:', payload.old)

                // Invalidate queries
                queryClient.invalidateQueries({ queryKey: ['patients', workspaceId] })

                // Call callback
                if (callbacksRef.current.onDelete && payload.old.id) {
                  try {
                    callbacksRef.current.onDelete(payload.old.id)
                  } catch (callbackErr) {
                    console.error('[useRealtimePatients] Delete callback error:', callbackErr)
                  }
                }
              } catch (err) {
                console.error('[useRealtimePatients] Error processing DELETE:', err)
              }
            }
          )
          .subscribe((status) => {
            console.log('[useRealtimePatients] Status:', status)

            if (status === 'SUBSCRIBED') {
              setStatus('connected')
            } else if (status === 'CHANNEL_ERROR') {
              setStatus('error')
              setError(new Error('Channel subscription error'))
            } else if (status === 'TIMED_OUT') {
              setStatus('error')
              setError(new Error('Subscription timed out'))
            } else if (status === 'CLOSED') {
              setStatus('disconnected')
            }
          })
      } catch (err) {
        console.error('[useRealtimePatients] Error:', err)
        setStatus('error')
        setError(err as Error)
      }
    }

    setupChannel()

    // Cleanup
    return () => {
      console.log('[useRealtimePatients] Cleaning up channel')
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [workspaceId, enabled, queryClient, supabase])

  // Don't return ref value during render - return null instead
  // Components can access channel through a separate mechanism if needed
  return {
    status,
    error,
    channel: null,
  }
}
