/**
 * useStickyNotes Hook
 * Fetch and manage sticky notes with real-time updates
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  StickyNote,
  StickyNoteWithDetails,
  StickyNotesQuery,
  CreateStickyNoteRequest,
  UpdateStickyNoteRequest,
  StickyNotesResponse,
} from '@/types/sticky-notes.types'
import { useRealtimeStickyNotes } from './useRealtimeStickyNotes'

interface UseStickyNotesOptions {
  workspaceId: string
  patientId?: string | null
  filters?: Partial<StickyNotesQuery>
  realtime?: boolean
}

export function useStickyNotes({
  workspaceId,
  patientId,
  filters = {},
  realtime = true,
}: UseStickyNotesOptions) {
  const queryClient = useQueryClient()

  // Query key
  const queryKey = ['sticky-notes', workspaceId, patientId, filters]

  // Fetch sticky notes with optimized cache settings
  const { data, isLoading, error, refetch } = useQuery<StickyNotesResponse>({
    queryKey,
    queryFn: async ({ signal }) => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      // Combine signals
      const abortSignal = signal || controller.signal

      try {
        const params = new URLSearchParams({
          workspace_id: workspaceId,
          ...filters,
          ...(patientId !== undefined && { patient_id: patientId || 'null' }),
        } as any)

        const response = await fetch(`/api/sticky-notes?${params}`, {
          signal: abortSignal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error('Failed to fetch sticky notes')
        }

        return response.json()
      } catch (error: unknown) {
        clearTimeout(timeoutId)
        const err = error as { name?: string }
        if (err.name === 'AbortError') {
          throw new Error('Request cancelled')
        }
        throw error
      }
    },
    enabled: !!workspaceId,
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes (formerly cacheTime)
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on mount if data exists
  })

  // Real-time subscription handlers
  const handleNoteAdded = useCallback(
    (note: StickyNote) => {
      queryClient.setQueryData<StickyNotesResponse>(queryKey, (old) => {
        if (!old) return old
        return {
          ...old,
          notes: [note as StickyNoteWithDetails, ...old.notes],
          total: old.total + 1,
        }
      })
    },
    [queryClient, queryKey]
  )

  const handleNoteUpdated = useCallback(
    (note: StickyNote) => {
      queryClient.setQueryData<StickyNotesResponse>(queryKey, (old) => {
        if (!old) return old
        return {
          ...old,
          notes: old.notes.map((n) => (n.id === note.id ? { ...n, ...note } : n)),
        }
      })
    },
    [queryClient, queryKey]
  )

  const handleNoteDeleted = useCallback(
    (noteId: string) => {
      queryClient.setQueryData<StickyNotesResponse>(queryKey, (old) => {
        if (!old) return old
        return {
          ...old,
          notes: old.notes.filter((n) => n.id !== noteId),
          total: old.total - 1,
        }
      })
    },
    [queryClient, queryKey]
  )

  // Real-time subscription
  const { isConnected: realtimeConnected } = useRealtimeStickyNotes({
    workspaceId,
    patientId,
    enabled: realtime,
    onNoteAdded: handleNoteAdded,
    onNoteUpdated: handleNoteUpdated,
    onNoteDeleted: handleNoteDeleted,
  })

  // Create note mutation with optimistic update
  const createNoteMutation = useMutation({
    mutationFn: async (noteData: CreateStickyNoteRequest) => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout

      try {
        const response = await fetch('/api/sticky-notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(noteData),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to create note')
        }

        return response.json()
      } catch (error: unknown) {
        clearTimeout(timeoutId)
        const err = error as { name?: string }
        if (err.name === 'AbortError') {
          throw new Error('Request timeout')
        }
        throw error
      }
    },
    onMutate: async (newNote) => {
      try {
        // Cancel outgoing refetches (safely handle cancellation)
        await queryClient.cancelQueries({ queryKey })
      } catch (cancelError) {
        // Ignore cancellation errors - component might be unmounting
      }

      // Snapshot previous value
      const previousNotes = queryClient.getQueryData<StickyNotesResponse>(queryKey)

      // Optimistically update
      if (previousNotes) {
        queryClient.setQueryData<StickyNotesResponse>(queryKey, {
          ...previousNotes,
          notes: [
            {
              ...newNote,
              id: `temp-${Date.now()}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              author: null,
              author_id: '',
              mentions: [],
              reactions: [],
              replies: [],
              replies_count: 0,
              position_x: null,
              position_y: null,
              sort_order: 0,
              is_pinned: false,
              is_resolved: false,
              resolved_at: null,
              resolved_by: null,
              deleted_at: null,
            } as StickyNoteWithDetails,
            ...previousNotes.notes,
          ],
          total: previousNotes.total + 1,
        })
      }

      return { previousNotes }
    },
    onError: (err, newNote, context) => {
      // Rollback on error
      try {
        if (context?.previousNotes) {
          queryClient.setQueryData(queryKey, context.previousNotes)
        }
      } catch (rollbackError) {
        // Ignore rollback errors - component might be unmounting
      }
    },
    onSuccess: () => {
      // Invalidate to refetch and get server data
      queryClient.invalidateQueries({ queryKey: ['sticky-notes', workspaceId] })
    },
  })

  // Update note mutation
  const updateNoteMutation = useMutation({
    mutationFn: async ({
      noteId,
      updates,
    }: {
      noteId: string
      updates: UpdateStickyNoteRequest
    }) => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      try {
        const response = await fetch(`/api/sticky-notes/${noteId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to update note')
        }

        return response.json()
      } catch (error: unknown) {
        clearTimeout(timeoutId)
        const err = error as { name?: string }
        if (err.name === 'AbortError') {
          throw new Error('Request timeout')
        }
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sticky-notes', workspaceId] })
    },
  })

  // Delete note mutation with optimistic update
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      try {
        const response = await fetch(`/api/sticky-notes/${noteId}`, {
          method: 'DELETE',
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to delete note')
        }

        return response.json()
      } catch (error: unknown) {
        clearTimeout(timeoutId)
        const err = error as { name?: string }
        if (err.name === 'AbortError') {
          throw new Error('Request timeout')
        }
        throw error
      }
    },
    onMutate: async (noteId) => {
      try {
        await queryClient.cancelQueries({ queryKey })
      } catch (cancelError) {
        // Ignore cancellation errors
      }

      const previousNotes = queryClient.getQueryData<StickyNotesResponse>(queryKey)

      if (previousNotes) {
        queryClient.setQueryData<StickyNotesResponse>(queryKey, {
          ...previousNotes,
          notes: previousNotes.notes.filter((n) => n.id !== noteId),
          total: previousNotes.total - 1,
        })
      }

      return { previousNotes }
    },
    onError: (err, noteId, context) => {
      try {
        if (context?.previousNotes) {
          queryClient.setQueryData(queryKey, context.previousNotes)
        }
      } catch (rollbackError) {
        // Ignore rollback errors
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sticky-notes', workspaceId] })
    },
  })

  // Toggle pin mutation with optimistic update
  const togglePinMutation = useMutation({
    mutationFn: async ({ noteId, isPinned }: { noteId: string; isPinned: boolean }) => {
      return updateNoteMutation.mutateAsync({
        noteId,
        updates: { is_pinned: isPinned },
      })
    },
    onMutate: async ({ noteId, isPinned }) => {
      try {
        await queryClient.cancelQueries({ queryKey })
      } catch (cancelError) {
        // Ignore cancellation errors
      }

      const previousNotes = queryClient.getQueryData<StickyNotesResponse>(queryKey)

      if (previousNotes) {
        queryClient.setQueryData<StickyNotesResponse>(queryKey, {
          ...previousNotes,
          notes: previousNotes.notes.map((n) =>
            n.id === noteId ? { ...n, is_pinned: isPinned } : n
          ),
        })
      }

      return { previousNotes }
    },
    onError: (err, variables, context) => {
      try {
        if (context?.previousNotes) {
          queryClient.setQueryData(queryKey, context.previousNotes)
        }
      } catch (rollbackError) {
        // Ignore rollback errors
      }
    },
  })

  // Toggle resolve mutation with optimistic update
  const toggleResolveMutation = useMutation({
    mutationFn: async ({ noteId, isResolved }: { noteId: string; isResolved: boolean }) => {
      return updateNoteMutation.mutateAsync({
        noteId,
        updates: { is_resolved: isResolved },
      })
    },
    onMutate: async ({ noteId, isResolved }) => {
      try {
        await queryClient.cancelQueries({ queryKey })
      } catch (cancelError) {
        // Ignore cancellation errors
      }

      const previousNotes = queryClient.getQueryData<StickyNotesResponse>(queryKey)

      if (previousNotes) {
        queryClient.setQueryData<StickyNotesResponse>(queryKey, {
          ...previousNotes,
          notes: previousNotes.notes.map((n) =>
            n.id === noteId
              ? {
                  ...n,
                  is_resolved: isResolved,
                  resolved_at: isResolved ? new Date().toISOString() : null,
                }
              : n
          ),
        })
      }

      return { previousNotes }
    },
    onError: (err, variables, context) => {
      try {
        if (context?.previousNotes) {
          queryClient.setQueryData(queryKey, context.previousNotes)
        }
      } catch (rollbackError) {
        // Ignore rollback errors
      }
    },
  })

  // Add reaction mutation
  const addReactionMutation = useMutation({
    mutationFn: async ({ noteId, emoji }: { noteId: string; emoji: string }) => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      try {
        const response = await fetch(`/api/sticky-notes/${noteId}/reactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emoji }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to add reaction')
        }

        return response.json()
      } catch (error: unknown) {
        clearTimeout(timeoutId)
        const err = error as { name?: string }
        if (err.name === 'AbortError') {
          throw new Error('Request timeout')
        }
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sticky-notes', workspaceId] })
    },
  })

  // Remove reaction mutation
  const removeReactionMutation = useMutation({
    mutationFn: async ({ noteId, emoji }: { noteId: string; emoji: string }) => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      try {
        const response = await fetch(`/api/sticky-notes/${noteId}/reactions?emoji=${emoji}`, {
          method: 'DELETE',
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to remove reaction')
        }

        return response.json()
      } catch (error: unknown) {
        clearTimeout(timeoutId)
        const err = error as { name?: string }
        if (err.name === 'AbortError') {
          throw new Error('Request timeout')
        }
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sticky-notes', workspaceId] })
    },
  })

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
  }
}
