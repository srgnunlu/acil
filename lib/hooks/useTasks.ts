/**
 * Task Management Hooks
 * Custom hooks for task CRUD operations
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type {
  TaskWithDetails,
  CreateTaskPayload,
  UpdateTaskPayload,
  TaskFilters,
  TaskStatistics,
} from '@/types/task.types'

const supabase = createClient()

// =====================================================
// QUERY KEYS
// =====================================================

export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters: TaskFilters) => [...taskKeys.lists(), filters] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
  statistics: (workspaceId: string) => [...taskKeys.all, 'statistics', workspaceId] as const,
}

// =====================================================
// FETCH FUNCTIONS
// =====================================================

async function fetchTasks(filters: TaskFilters) {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        params.append(key, value.join(','))
      } else {
        params.append(key, String(value))
      }
    }
  })

  const response = await fetch(`/api/tasks?${params.toString()}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch tasks')
  }

  return response.json()
}

async function fetchTaskById(id: string): Promise<{ task: TaskWithDetails }> {
  const response = await fetch(`/api/tasks/${id}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch task')
  }

  return response.json()
}

async function createTask(data: CreateTaskPayload) {
  const response = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create task')
  }

  return response.json()
}

async function updateTask({ id, data }: { id: string; data: UpdateTaskPayload }) {
  const response = await fetch(`/api/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update task')
  }

  return response.json()
}

async function deleteTask(id: string) {
  const response = await fetch(`/api/tasks/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete task')
  }

  return response.json()
}

// =====================================================
// HOOKS
// =====================================================

/**
 * Fetch tasks with filters
 */
export function useTasks(filters: TaskFilters, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: () => fetchTasks(filters),
    enabled: options?.enabled !== false && !!filters.workspace_id,
    staleTime: 30000, // 30 seconds
  })
}

/**
 * Fetch task by ID
 */
export function useTask(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => fetchTaskById(id),
    enabled: options?.enabled !== false && !!id,
    staleTime: 30000,
  })
}

/**
 * Create task mutation
 */
export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTask,
    onSuccess: (data) => {
      // Invalidate task lists
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })

      // Invalidate workspace statistics
      if (data.task.workspace_id) {
        queryClient.invalidateQueries({
          queryKey: taskKeys.statistics(data.task.workspace_id),
        })
      }
    },
  })
}

/**
 * Update task mutation
 */
export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateTask,
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.detail(id) })

      // Snapshot previous value
      const previousTask = queryClient.getQueryData(taskKeys.detail(id))

      // Optimistically update
      queryClient.setQueryData(taskKeys.detail(id), (old: any) => {
        if (!old) return old
        return {
          ...old,
          task: {
            ...old.task,
            ...data,
          },
        }
      })

      return { previousTask }
    },
    onError: (_err, { id }, context) => {
      // Rollback on error
      if (context?.previousTask) {
        queryClient.setQueryData(taskKeys.detail(id), context.previousTask)
      }
    },
    onSettled: (_data, _error, { id }) => {
      // Refetch task detail
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(id) })
      // Refetch task lists
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
    },
  })
}

/**
 * Delete task mutation
 */
export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteTask,
    onSuccess: (_data, id) => {
      // Remove task from cache
      queryClient.removeQueries({ queryKey: taskKeys.detail(id) })

      // Invalidate task lists
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
    },
  })
}

/**
 * Fetch task statistics
 */
export function useTaskStatistics(workspaceId: string, options?: { enabled?: boolean }) {
  return useQuery<TaskStatistics>({
    queryKey: taskKeys.statistics(workspaceId),
    queryFn: async () => {
      const response = await fetch(`/api/tasks/statistics?workspace_id=${workspaceId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch task statistics')
      }

      return response.json()
    },
    enabled: options?.enabled !== false && !!workspaceId,
    staleTime: 60000, // 1 minute
  })
}

/**
 * Quick task status update
 */
export function useUpdateTaskStatus() {
  const updateMutation = useUpdateTask()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateMutation.mutateAsync({ id, data: { status: status as any } }),
  })
}

/**
 * Quick task priority update
 */
export function useUpdateTaskPriority() {
  const updateMutation = useUpdateTask()

  return useMutation({
    mutationFn: ({ id, priority }: { id: string; priority: string }) =>
      updateMutation.mutateAsync({ id, data: { priority: priority as any } }),
  })
}

/**
 * Toggle checklist item completion
 */
export function useToggleChecklistItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ itemId, isCompleted }: { itemId: string; isCompleted: boolean }) => {
      const { data, error } = await supabase
        .from('task_checklist_items')
        .update({
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
          completed_by: isCompleted ? (await supabase.auth.getUser()).data.user?.id : null,
        })
        .eq('id', itemId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      // Invalidate task detail to refresh checklist
      if (data.task_id) {
        queryClient.invalidateQueries({ queryKey: taskKeys.detail(data.task_id) })
      }
    },
  })
}

/**
 * Subscribe to task changes (real-time)
 */
export function useRealtimeTask(taskId: string) {
  const queryClient = useQueryClient()

  useQuery({
    queryKey: ['realtime-task', taskId],
    queryFn: () => {
      const channel = supabase
        .channel(`task:${taskId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tasks',
            filter: `id=eq.${taskId}`,
          },
          (payload) => {
            // Invalidate task detail on any change
            queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) })
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'task_checklist_items',
            filter: `task_id=eq.${taskId}`,
          },
          () => {
            // Invalidate task detail when checklist changes
            queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) })
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'task_comments',
            filter: `task_id=eq.${taskId}`,
          },
          () => {
            // Invalidate task detail when new comment added
            queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) })
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    },
    enabled: !!taskId,
    staleTime: Infinity,
    gcTime: 0,
  })
}
