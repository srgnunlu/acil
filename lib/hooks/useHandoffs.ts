/**
 * Handoff Hooks
 * React Query hooks for handoff management
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type {
  HandoffWithDetails,
  HandoffFilters,
  CreateHandoffPayload,
  UpdateHandoffPayload,
  GenerateHandoffPayload,
  AIGeneratedHandoffContent,
} from '@/types/handoff.types'

const supabase = createClient()

// =====================================================
// QUERY KEYS
// =====================================================

export const handoffKeys = {
  all: ['handoffs'] as const,
  lists: () => [...handoffKeys.all, 'list'] as const,
  list: (filters: HandoffFilters) => [...handoffKeys.lists(), filters] as const,
  details: () => [...handoffKeys.all, 'detail'] as const,
  detail: (id: string) => [...handoffKeys.details(), id] as const,
  pending: (userId: string, workspaceId: string) => [...handoffKeys.all, 'pending', userId, workspaceId] as const,
}

// =====================================================
// FETCH HANDOFFS
// =====================================================

async function fetchHandoffs(filters: HandoffFilters) {
  const params = new URLSearchParams()

  params.append('workspace_id', filters.workspace_id)
  if (filters.from_user_id) params.append('from_user_id', filters.from_user_id)
  if (filters.to_user_id) params.append('to_user_id', filters.to_user_id)
  if (filters.status) {
    const statuses = Array.isArray(filters.status) ? filters.status.join(',') : filters.status
    params.append('status', statuses)
  }
  if (filters.handoff_date_from) params.append('handoff_date_from', filters.handoff_date_from)
  if (filters.handoff_date_to) params.append('handoff_date_to', filters.handoff_date_to)
  if (filters.shift_id) params.append('shift_id', filters.shift_id)
  if (filters.is_ai_generated !== undefined) params.append('is_ai_generated', String(filters.is_ai_generated))
  if (filters.page) params.append('page', String(filters.page))
  if (filters.limit) params.append('limit', String(filters.limit))

  const response = await fetch(`/api/handoffs?${params.toString()}`)

  if (!response.ok) {
    throw new Error('Failed to fetch handoffs')
  }

  return response.json()
}

export function useHandoffs(filters: HandoffFilters) {
  return useQuery({
    queryKey: handoffKeys.list(filters),
    queryFn: () => fetchHandoffs(filters),
    enabled: !!filters.workspace_id,
  })
}

// =====================================================
// FETCH HANDOFF DETAIL
// =====================================================

async function fetchHandoff(handoffId: string): Promise<HandoffWithDetails> {
  const response = await fetch(`/api/handoffs/${handoffId}`)

  if (!response.ok) {
    throw new Error('Failed to fetch handoff')
  }

  return response.json()
}

export function useHandoff(handoffId: string) {
  return useQuery({
    queryKey: handoffKeys.detail(handoffId),
    queryFn: () => fetchHandoff(handoffId),
    enabled: !!handoffId,
  })
}

// =====================================================
// FETCH PENDING HANDOFFS
// =====================================================

export function usePendingHandoffs(userId: string, workspaceId: string) {
  return useQuery({
    queryKey: handoffKeys.pending(userId, workspaceId),
    queryFn: () =>
      fetchHandoffs({
        workspace_id: workspaceId,
        to_user_id: userId,
        status: ['pending_review', 'draft'],
      }),
    enabled: !!userId && !!workspaceId,
    refetchInterval: 30000, // Refetch every 30 seconds
  })
}

// =====================================================
// CREATE HANDOFF
// =====================================================

async function createHandoff(payload: CreateHandoffPayload) {
  const response = await fetch('/api/handoffs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create handoff')
  }

  return response.json()
}

export function useCreateHandoff() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createHandoff,
    onSuccess: (data) => {
      // Invalidate handoff lists
      queryClient.invalidateQueries({ queryKey: handoffKeys.lists() })

      // Invalidate pending handoffs for receiver
      queryClient.invalidateQueries({ queryKey: handoffKeys.pending(data.to_user_id, data.workspace_id) })
    },
  })
}

// =====================================================
// UPDATE HANDOFF
// =====================================================

async function updateHandoff({ handoffId, payload }: { handoffId: string; payload: UpdateHandoffPayload }) {
  const response = await fetch(`/api/handoffs/${handoffId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update handoff')
  }

  return response.json()
}

export function useUpdateHandoff() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateHandoff,
    onSuccess: (data, variables) => {
      // Invalidate specific handoff
      queryClient.invalidateQueries({ queryKey: handoffKeys.detail(variables.handoffId) })

      // Invalidate handoff lists
      queryClient.invalidateQueries({ queryKey: handoffKeys.lists() })

      // Invalidate pending handoffs
      queryClient.invalidateQueries({ queryKey: handoffKeys.pending(data.to_user_id, data.workspace_id) })
    },
  })
}

// =====================================================
// DELETE HANDOFF
// =====================================================

async function deleteHandoff(handoffId: string) {
  const response = await fetch(`/api/handoffs/${handoffId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete handoff')
  }

  return response.json()
}

export function useDeleteHandoff() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteHandoff,
    onSuccess: (_, handoffId) => {
      // Invalidate handoff lists
      queryClient.invalidateQueries({ queryKey: handoffKeys.lists() })

      // Remove from cache
      queryClient.removeQueries({ queryKey: handoffKeys.detail(handoffId) })
    },
  })
}

// =====================================================
// GENERATE AI HANDOFF
// =====================================================

async function generateHandoff(payload: GenerateHandoffPayload): Promise<{
  success: boolean
  content: AIGeneratedHandoffContent
  metadata: any
}> {
  const response = await fetch('/api/handoffs/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to generate handoff')
  }

  return response.json()
}

export function useGenerateHandoff() {
  return useMutation({
    mutationFn: generateHandoff,
  })
}

// =====================================================
// ACKNOWLEDGE HANDOFF
// =====================================================

export function useAcknowledgeHandoff() {
  const updateMutation = useUpdateHandoff()

  return useMutation({
    mutationFn: async (handoffId: string) => {
      return updateMutation.mutateAsync({
        handoffId,
        payload: {
          status: 'completed',
        },
      })
    },
  })
}

// =====================================================
// REALTIME HANDOFF SUBSCRIPTION
// =====================================================

export function useRealtimeHandoffs(workspaceId: string, enabled: boolean = true) {
  const queryClient = useQueryClient()

  useQuery({
    queryKey: ['realtime-handoffs', workspaceId],
    queryFn: () => {
      const channel = supabase
        .channel(`handoffs:${workspaceId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'handoffs',
            filter: `workspace_id=eq.${workspaceId}`,
          },
          (payload) => {
            console.log('Handoff change detected:', payload)

            // Invalidate handoff lists
            queryClient.invalidateQueries({ queryKey: handoffKeys.lists() })

            // If it's an INSERT or UPDATE, invalidate the specific handoff
            if (payload.new && 'id' in payload.new) {
              queryClient.invalidateQueries({ queryKey: handoffKeys.detail(payload.new.id as string) })
            }
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    },
    enabled,
    staleTime: Infinity,
  })
}
