import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ProtocolCategory, ProtocolCategoryCreate } from '@/types/protocol.types'

interface ProtocolCategoryWithCount extends ProtocolCategory {
  protocol_count: number
}

/**
 * Fetch protocol categories for a workspace
 */
export function useProtocolCategories(workspaceId: string | null) {
  return useQuery<ProtocolCategoryWithCount[]>({
    queryKey: ['protocol-categories', workspaceId],
    queryFn: async () => {
      if (!workspaceId) throw new Error('Workspace ID is required')

      const response = await fetch(`/api/protocols/categories?workspace_id=${workspaceId}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch protocol categories')
      }

      return response.json()
    },
    enabled: !!workspaceId,
  })
}

/**
 * Create a new protocol category
 */
export function useCreateProtocolCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newCategory: ProtocolCategoryCreate) => {
      const response = await fetch('/api/protocols/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCategory),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create category')
      }

      return response.json() as Promise<ProtocolCategory>
    },
    onSuccess: (data) => {
      // Invalidate categories list
      queryClient.invalidateQueries({ queryKey: ['protocol-categories', data.workspace_id] })
    },
  })
}
