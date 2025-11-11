/**
 * useStickyNotes Hook
 * Fetch and manage sticky notes with real-time updates
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  StickyNote,
  StickyNoteWithDetails,
  StickyNotesQuery,
  CreateStickyNoteRequest,
  UpdateStickyNoteRequest,
  StickyNotesResponse,
} from '@/types/sticky-notes.types';
import { useRealtimeStickyNotes } from './useRealtimeStickyNotes';

interface UseStickyNotesOptions {
  workspaceId: string;
  patientId?: string | null;
  filters?: Partial<StickyNotesQuery>;
  realtime?: boolean;
}

export function useStickyNotes({
  workspaceId,
  patientId,
  filters = {},
  realtime = true,
}: UseStickyNotesOptions) {
  const queryClient = useQueryClient();

  // Query key
  const queryKey = ['sticky-notes', workspaceId, patientId, filters];

  // Fetch sticky notes
  const { data, isLoading, error, refetch } = useQuery<StickyNotesResponse>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({
        workspace_id: workspaceId,
        ...filters,
        ...(patientId !== undefined && { patient_id: patientId || 'null' }),
      } as any);

      const response = await fetch(`/api/sticky-notes?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch sticky notes');
      }

      return response.json();
    },
    enabled: !!workspaceId,
  });

  // Real-time subscription handlers
  const handleNoteAdded = useCallback(
    (note: StickyNote) => {
      queryClient.setQueryData<StickyNotesResponse>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          notes: [note as any, ...old.notes],
          total: old.total + 1,
        };
      });
    },
    [queryClient, queryKey]
  );

  const handleNoteUpdated = useCallback(
    (note: StickyNote) => {
      queryClient.setQueryData<StickyNotesResponse>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          notes: old.notes.map((n) => (n.id === note.id ? { ...n, ...note } : n)),
        };
      });
    },
    [queryClient, queryKey]
  );

  const handleNoteDeleted = useCallback(
    (noteId: string) => {
      queryClient.setQueryData<StickyNotesResponse>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          notes: old.notes.filter((n) => n.id !== noteId),
          total: old.total - 1,
        };
      });
    },
    [queryClient, queryKey]
  );

  // Real-time subscription
  const { isConnected: realtimeConnected } = useRealtimeStickyNotes({
    workspaceId,
    patientId,
    enabled: realtime,
    onNoteAdded: handleNoteAdded,
    onNoteUpdated: handleNoteUpdated,
    onNoteDeleted: handleNoteDeleted,
  });

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: async (noteData: CreateStickyNoteRequest) => {
      const response = await fetch('/api/sticky-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create note');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sticky-notes', workspaceId] });
    },
  });

  // Update note mutation
  const updateNoteMutation = useMutation({
    mutationFn: async ({
      noteId,
      updates,
    }: {
      noteId: string;
      updates: UpdateStickyNoteRequest;
    }) => {
      const response = await fetch(`/api/sticky-notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update note');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sticky-notes', workspaceId] });
    },
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const response = await fetch(`/api/sticky-notes/${noteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete note');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sticky-notes', workspaceId] });
    },
  });

  // Toggle pin mutation
  const togglePinMutation = useMutation({
    mutationFn: async ({ noteId, isPinned }: { noteId: string; isPinned: boolean }) => {
      return updateNoteMutation.mutateAsync({
        noteId,
        updates: { is_pinned: isPinned },
      });
    },
  });

  // Toggle resolve mutation
  const toggleResolveMutation = useMutation({
    mutationFn: async ({
      noteId,
      isResolved,
    }: {
      noteId: string;
      isResolved: boolean;
    }) => {
      return updateNoteMutation.mutateAsync({
        noteId,
        updates: { is_resolved: isResolved },
      });
    },
  });

  // Add reaction mutation
  const addReactionMutation = useMutation({
    mutationFn: async ({ noteId, emoji }: { noteId: string; emoji: string }) => {
      const response = await fetch(`/api/sticky-notes/${noteId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add reaction');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sticky-notes', workspaceId] });
    },
  });

  // Remove reaction mutation
  const removeReactionMutation = useMutation({
    mutationFn: async ({ noteId, emoji }: { noteId: string; emoji: string }) => {
      const response = await fetch(`/api/sticky-notes/${noteId}/reactions?emoji=${emoji}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove reaction');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sticky-notes', workspaceId] });
    },
  });

  return {
    // Data
    notes: data?.notes || [],
    total: data?.total || 0,
    hasMore: data?.has_more || false,

    // States
    isLoading,
    error,
    realtimeConnected,

    // Actions
    refetch,
    createNote: createNoteMutation.mutateAsync,
    updateNote: updateNoteMutation.mutateAsync,
    deleteNote: deleteNoteMutation.mutateAsync,
    togglePin: togglePinMutation.mutateAsync,
    toggleResolve: toggleResolveMutation.mutateAsync,
    addReaction: addReactionMutation.mutateAsync,
    removeReaction: removeReactionMutation.mutateAsync,

    // Mutation states
    isCreating: createNoteMutation.isPending,
    isUpdating: updateNoteMutation.isPending,
    isDeleting: deleteNoteMutation.isPending,
  };
}
