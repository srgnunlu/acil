/**
 * Shift Hooks
 * React Query hooks for shift management
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type {
  ShiftScheduleWithDetails,
  ShiftScheduleFilters,
  CreateShiftSchedulePayload,
  UpdateShiftSchedulePayload,
} from '@/types/handoff.types'

const supabase = createClient()

// =====================================================
// QUERY KEYS
// =====================================================

export const shiftKeys = {
  all: ['shifts'] as const,
  lists: () => [...shiftKeys.all, 'list'] as const,
  list: (filters: ShiftScheduleFilters) => [...shiftKeys.lists(), filters] as const,
  details: () => [...shiftKeys.all, 'detail'] as const,
  detail: (id: string) => [...shiftKeys.details(), id] as const,
  current: (userId: string, workspaceId: string) => [...shiftKeys.all, 'current', userId, workspaceId] as const,
}

// =====================================================
// FETCH SHIFTS
// =====================================================

async function fetchShifts(filters: ShiftScheduleFilters) {
  const params = new URLSearchParams()

  params.append('workspace_id', filters.workspace_id)
  if (filters.user_id) params.append('user_id', filters.user_id)
  if (filters.shift_definition_id) params.append('shift_definition_id', filters.shift_definition_id)
  if (filters.status) {
    const statuses = Array.isArray(filters.status) ? filters.status.join(',') : filters.status
    params.append('status', statuses)
  }
  if (filters.shift_date_from) params.append('shift_date_from', filters.shift_date_from)
  if (filters.shift_date_to) params.append('shift_date_to', filters.shift_date_to)
  if (filters.is_current) params.append('is_current', 'true')
  if (filters.page) params.append('page', String(filters.page))
  if (filters.limit) params.append('limit', String(filters.limit))

  const response = await fetch(`/api/shifts?${params.toString()}`)

  if (!response.ok) {
    throw new Error('Failed to fetch shifts')
  }

  return response.json()
}

export function useShifts(filters: ShiftScheduleFilters) {
  return useQuery({
    queryKey: shiftKeys.list(filters),
    queryFn: () => fetchShifts(filters),
    enabled: !!filters.workspace_id,
  })
}

// =====================================================
// FETCH CURRENT SHIFT
// =====================================================

export function useCurrentShift(userId: string, workspaceId: string) {
  return useQuery({
    queryKey: shiftKeys.current(userId, workspaceId),
    queryFn: () =>
      fetchShifts({
        workspace_id: workspaceId,
        user_id: userId,
        is_current: true,
      }),
    enabled: !!userId && !!workspaceId,
    refetchInterval: 60000, // Refetch every minute
  })
}

// =====================================================
// CREATE SHIFT
// =====================================================

async function createShift(payload: CreateShiftSchedulePayload) {
  const response = await fetch('/api/shifts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create shift')
  }

  return response.json()
}

export function useCreateShift() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createShift,
    onSuccess: (data) => {
      // Invalidate shift lists
      queryClient.invalidateQueries({ queryKey: shiftKeys.lists() })

      // Invalidate current shift for user
      queryClient.invalidateQueries({ queryKey: shiftKeys.current(data.user_id, data.workspace_id) })
    },
  })
}

// =====================================================
// UPDATE SHIFT
// =====================================================

async function updateShift({ shiftId, payload }: { shiftId: string; payload: UpdateShiftSchedulePayload }) {
  const response = await fetch(`/api/shifts/${shiftId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update shift')
  }

  return response.json()
}

export function useUpdateShift() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateShift,
    onSuccess: (data, variables) => {
      // Invalidate specific shift
      queryClient.invalidateQueries({ queryKey: shiftKeys.detail(variables.shiftId) })

      // Invalidate shift lists
      queryClient.invalidateQueries({ queryKey: shiftKeys.lists() })

      // Invalidate current shift
      queryClient.invalidateQueries({ queryKey: shiftKeys.current(data.user_id, data.workspace_id) })
    },
  })
}

// =====================================================
// CHECK IN/OUT SHIFT
// =====================================================

export function useCheckInShift() {
  const updateMutation = useUpdateShift()

  return useMutation({
    mutationFn: async (shiftId: string) => {
      return updateMutation.mutateAsync({
        shiftId,
        payload: {
          status: 'active',
          checked_in_at: new Date().toISOString(),
        },
      })
    },
  })
}

export function useCheckOutShift() {
  const updateMutation = useUpdateShift()

  return useMutation({
    mutationFn: async (shiftId: string) => {
      return updateMutation.mutateAsync({
        shiftId,
        payload: {
          status: 'completed',
          checked_out_at: new Date().toISOString(),
        },
      })
    },
  })
}

// =====================================================
// REALTIME SHIFT SUBSCRIPTION
// =====================================================

export function useRealtimeShifts(workspaceId: string, enabled: boolean = true) {
  const queryClient = useQueryClient()

  useQuery({
    queryKey: ['realtime-shifts', workspaceId],
    queryFn: () => {
      const channel = supabase
        .channel(`shifts:${workspaceId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'shift_schedules',
            filter: `workspace_id=eq.${workspaceId}`,
          },
          (payload) => {
            console.log('Shift change detected:', payload)

            // Invalidate shift lists
            queryClient.invalidateQueries({ queryKey: shiftKeys.lists() })

            // If it's an INSERT or UPDATE, invalidate the specific shift
            if (payload.new && 'id' in payload.new) {
              queryClient.invalidateQueries({ queryKey: shiftKeys.detail(payload.new.id as string) })

              // Invalidate current shift for the user
              if ('user_id' in payload.new) {
                queryClient.invalidateQueries({
                  queryKey: shiftKeys.current(payload.new.user_id as string, workspaceId),
                })
              }
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
