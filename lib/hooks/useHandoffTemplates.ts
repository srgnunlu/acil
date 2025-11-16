/**
 * Handoff Template Hooks
 * React Query hooks for handoff template management
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  HandoffTemplateWithSections,
  HandoffTemplateFilters,
  CreateHandoffTemplatePayload,
  UpdateHandoffTemplatePayload,
} from '@/types/handoff.types'

// =====================================================
// QUERY KEYS
// =====================================================

export const templateKeys = {
  all: ['handoff-templates'] as const,
  lists: () => [...templateKeys.all, 'list'] as const,
  list: (filters: HandoffTemplateFilters) => [...templateKeys.lists(), filters] as const,
  details: () => [...templateKeys.all, 'detail'] as const,
  detail: (id: string) => [...templateKeys.details(), id] as const,
  default: (workspaceId: string) => [...templateKeys.all, 'default', workspaceId] as const,
}

// =====================================================
// FETCH TEMPLATES
// =====================================================

async function fetchTemplates(filters: HandoffTemplateFilters): Promise<HandoffTemplateWithSections[]> {
  const params = new URLSearchParams()

  params.append('workspace_id', filters.workspace_id!)
  if (filters.is_default !== undefined) params.append('is_default', String(filters.is_default))
  if (filters.is_system !== undefined) params.append('is_system', String(filters.is_system))
  if (filters.is_active !== undefined) params.append('is_active', String(filters.is_active))
  if (filters.search) params.append('search', filters.search)

  const response = await fetch(`/api/handoffs/templates?${params.toString()}`)

  if (!response.ok) {
    throw new Error('Failed to fetch templates')
  }

  return response.json()
}

export function useHandoffTemplates(filters: HandoffTemplateFilters) {
  return useQuery({
    queryKey: templateKeys.list(filters),
    queryFn: () => fetchTemplates(filters),
    enabled: !!filters.workspace_id,
  })
}

// =====================================================
// FETCH DEFAULT TEMPLATE
// =====================================================

export function useDefaultHandoffTemplate(workspaceId: string) {
  return useQuery({
    queryKey: templateKeys.default(workspaceId),
    queryFn: async () => {
      const templates = await fetchTemplates({
        workspace_id: workspaceId,
        is_default: true,
      })
      return templates[0] || null
    },
    enabled: !!workspaceId,
  })
}

// =====================================================
// CREATE TEMPLATE
// =====================================================

async function createTemplate(payload: CreateHandoffTemplatePayload) {
  const response = await fetch('/api/handoffs/templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create template')
  }

  return response.json()
}

export function useCreateHandoffTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTemplate,
    onSuccess: (data) => {
      // Invalidate template lists
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() })

      // If it's a default template, invalidate default template query
      if (data.is_default) {
        queryClient.invalidateQueries({ queryKey: templateKeys.default(data.workspace_id) })
      }
    },
  })
}

// =====================================================
// UPDATE TEMPLATE
// =====================================================

async function updateTemplate({ templateId, payload }: { templateId: string; payload: UpdateHandoffTemplatePayload }) {
  const response = await fetch(`/api/handoffs/templates/${templateId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update template')
  }

  return response.json()
}

export function useUpdateHandoffTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateTemplate,
    onSuccess: (data, variables) => {
      // Invalidate specific template
      queryClient.invalidateQueries({ queryKey: templateKeys.detail(variables.templateId) })

      // Invalidate template lists
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() })

      // If it's a default template, invalidate default template query
      if (data.is_default) {
        queryClient.invalidateQueries({ queryKey: templateKeys.default(data.workspace_id) })
      }
    },
  })
}

// =====================================================
// DELETE TEMPLATE
// =====================================================

async function deleteTemplate(templateId: string) {
  const response = await fetch(`/api/handoffs/templates/${templateId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete template')
  }

  return response.json()
}

export function useDeleteHandoffTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteTemplate,
    onSuccess: (_, templateId) => {
      // Invalidate template lists
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() })

      // Remove from cache
      queryClient.removeQueries({ queryKey: templateKeys.detail(templateId) })
    },
  })
}
