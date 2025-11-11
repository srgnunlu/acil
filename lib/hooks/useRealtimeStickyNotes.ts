/**
 * useRealtimeStickyNotes Hook
 * Real-time subscription for sticky notes using Supabase Realtime
 */

'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { StickyNote } from '@/types/sticky-notes.types'
import { RealtimeChannel } from '@supabase/supabase-js'

interface UseRealtimeStickyNotesOptions {
  workspaceId: string
  patientId?: string | null
  enabled?: boolean
  onNoteAdded?: (note: StickyNote) => void
  onNoteUpdated?: (note: StickyNote) => void
  onNoteDeleted?: (noteId: string) => void
}

export function useRealtimeStickyNotes({
  workspaceId,
  patientId,
  enabled = true,
  onNoteAdded,
  onNoteUpdated,
  onNoteDeleted,
}: UseRealtimeStickyNotesOptions) {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Store callbacks in refs to avoid re-subscribing when they change
  const callbacksRef = useRef({
    onNoteAdded,
    onNoteUpdated,
    onNoteDeleted,
  })

  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = {
      onNoteAdded,
      onNoteUpdated,
      onNoteDeleted,
    }
  }, [onNoteAdded, onNoteUpdated, onNoteDeleted])

  useEffect(() => {
    if (!enabled || !workspaceId) {
      return
    }

    let isMounted = true
    const supabase = createClient()

    // Create channel for this workspace
    const channelName = patientId
      ? `sticky-notes:workspace:${workspaceId}:patient:${patientId}`
      : `sticky-notes:workspace:${workspaceId}`

    const realtimeChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sticky_notes',
          filter: patientId
            ? `workspace_id=eq.${workspaceId},patient_id=eq.${patientId}`
            : `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          if (!isMounted) return
          try {
            const note = payload.new as StickyNote
            callbacksRef.current.onNoteAdded?.(note)
          } catch {
            // Silently ignore callback errors
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sticky_notes',
          filter: patientId
            ? `workspace_id=eq.${workspaceId},patient_id=eq.${patientId}`
            : `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          if (!isMounted) return
          try {
            const note = payload.new as StickyNote
            callbacksRef.current.onNoteUpdated?.(note)
          } catch {
            // Silently ignore callback errors
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'sticky_notes',
          filter: patientId
            ? `workspace_id=eq.${workspaceId},patient_id=eq.${patientId}`
            : `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          if (!isMounted) return
          try {
            const note = payload.old as StickyNote
            callbacksRef.current.onNoteDeleted?.(note.id)
          } catch {
            // Silently ignore callback errors
          }
        }
      )
      .subscribe((status) => {
        if (!isMounted) return
        try {
          if (status === 'SUBSCRIBED') {
            setIsConnected(true)
            setError(null)
          } else if (status === 'CHANNEL_ERROR') {
            setIsConnected(false)
            setError('Failed to connect to realtime channel')
          } else if (status === 'TIMED_OUT') {
            setIsConnected(false)
            setError('Connection timed out')
          }
        } catch (error) {
          // Silently ignore state update errors
        }
      })

    setChannel(realtimeChannel)

    // Cleanup
    return () => {
      isMounted = false
      try {
        realtimeChannel.unsubscribe()
        setChannel(null)
        setIsConnected(false)
      } catch (error) {
        // Silently ignore cleanup errors
      }
    }
  }, [workspaceId, patientId, enabled]) // Removed callbacks from dependencies

  return {
    isConnected,
    error,
    channel,
  }
}
