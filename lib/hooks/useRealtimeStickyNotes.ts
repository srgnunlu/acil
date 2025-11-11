/**
 * useRealtimeStickyNotes Hook
 * Real-time subscription for sticky notes using Supabase Realtime
 */

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  StickyNote,
  StickyNoteWithDetails,
  RealtimeStickyNoteEvent,
} from '@/types/sticky-notes.types';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeStickyNotesOptions {
  workspaceId: string;
  patientId?: string | null;
  enabled?: boolean;
  onNoteAdded?: (note: StickyNote) => void;
  onNoteUpdated?: (note: StickyNote) => void;
  onNoteDeleted?: (noteId: string) => void;
}

export function useRealtimeStickyNotes({
  workspaceId,
  patientId,
  enabled = true,
  onNoteAdded,
  onNoteUpdated,
  onNoteDeleted,
}: UseRealtimeStickyNotesOptions) {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !workspaceId) {
      return;
    }

    const supabase = createClient();

    // Create channel for this workspace
    const channelName = patientId
      ? `sticky-notes:workspace:${workspaceId}:patient:${patientId}`
      : `sticky-notes:workspace:${workspaceId}`;

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
          console.log('Sticky note inserted:', payload);
          const note = payload.new as StickyNote;
          onNoteAdded?.(note);
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
          console.log('Sticky note updated:', payload);
          const note = payload.new as StickyNote;
          onNoteUpdated?.(note);
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
          console.log('Sticky note deleted:', payload);
          const note = payload.old as StickyNote;
          onNoteDeleted?.(note.id);
        }
      )
      .subscribe((status) => {
        console.log('Sticky notes subscription status:', status);
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setError(null);
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false);
          setError('Failed to connect to realtime channel');
        } else if (status === 'TIMED_OUT') {
          setIsConnected(false);
          setError('Connection timed out');
        }
      });

    setChannel(realtimeChannel);

    // Cleanup
    return () => {
      console.log('Unsubscribing from sticky notes channel');
      realtimeChannel.unsubscribe();
      setChannel(null);
      setIsConnected(false);
    };
  }, [workspaceId, patientId, enabled, onNoteAdded, onNoteUpdated, onNoteDeleted]);

  return {
    isConnected,
    error,
    channel,
  };
}
