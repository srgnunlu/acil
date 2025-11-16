import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  Protocol,
  ProtocolWithStats,
  ProtocolCreate,
  ProtocolUpdate,
  ProtocolDetailResponse,
  ProtocolListResponse,
  ProtocolFilters,
  ProtocolSort,
} from '@/types/protocol.types'

/**
 * Fetch protocols for a workspace
 */
export function useProtocols(
  workspaceId: string | null,
  filters?: ProtocolFilters,
  sort?: ProtocolSort
) {
  return useQuery<ProtocolListResponse>({
    queryKey: ['protocols', workspaceId, filters, sort],
    queryFn: async () => {
      if (!workspaceId) throw new Error('Workspace ID is required')

      const params = new URLSearchParams({
        workspace_id: workspaceId,
      })

      if (filters?.category_id) params.append('category_id', filters.category_id)
      if (filters?.status) params.append('status', filters.status)
      if (filters?.is_favorited) params.append('is_favorited', 'true')
      if (filters?.search) params.append('search', filters.search)

      const response = await fetch(`/api/protocols?${params.toString()}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch protocols')
      }

      return response.json()
    },
    enabled: !!workspaceId,
  })
}

/**
 * Fetch a single protocol with details
 */
export function useProtocol(protocolId: string | null) {
  return useQuery<ProtocolDetailResponse>({
    queryKey: ['protocol', protocolId],
    queryFn: async () => {
      if (!protocolId) throw new Error('Protocol ID is required')

      const response = await fetch(`/api/protocols/${protocolId}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch protocol')
      }

      return response.json()
    },
    enabled: !!protocolId,
  })
}

/**
 * Create a new protocol
 */
export function useCreateProtocol() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newProtocol: ProtocolCreate) => {
      const response = await fetch('/api/protocols', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProtocol),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create protocol')
      }

      return response.json() as Promise<Protocol>
    },
    onSuccess: (data) => {
      // Invalidate protocols list
      queryClient.invalidateQueries({ queryKey: ['protocols', data.workspace_id] })
    },
  })
}

/**
 * Update a protocol
 */
export function useUpdateProtocol() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ProtocolUpdate }) => {
      const response = await fetch(`/api/protocols/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update protocol')
      }

      return response.json() as Promise<Protocol>
    },
    onSuccess: (data) => {
      // Invalidate both list and detail
      queryClient.invalidateQueries({ queryKey: ['protocols', data.workspace_id] })
      queryClient.invalidateQueries({ queryKey: ['protocol', data.id] })
    },
  })
}

/**
 * Delete a protocol
 */
export function useDeleteProtocol() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, workspaceId }: { id: string; workspaceId: string }) => {
      const response = await fetch(`/api/protocols/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete protocol')
      }

      return response.json()
    },
    onSuccess: (_, variables) => {
      // Invalidate protocols list
      queryClient.invalidateQueries({ queryKey: ['protocols', variables.workspaceId] })
    },
  })
}

/**
 * Search protocols
 */
export function useProtocolSearch(
  workspaceId: string | null,
  query: string,
  categoryId?: string | null
) {
  return useQuery({
    queryKey: ['protocol-search', workspaceId, query, categoryId],
    queryFn: async () => {
      if (!workspaceId || !query) return { results: [], query: '', count: 0 }

      const params = new URLSearchParams({
        workspace_id: workspaceId,
        query,
      })

      if (categoryId) params.append('category_id', categoryId)

      const response = await fetch(`/api/protocols/search?${params.toString()}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Search failed')
      }

      return response.json() as Promise<{
        results: ProtocolWithStats[]
        query: string
        count: number
      }>
    },
    enabled: !!workspaceId && query.length > 2,
  })
}

/**
 * Get user's favorite protocols
 */
export function useFavoriteProtocols(workspaceId: string | null) {
  return useQuery({
    queryKey: ['protocol-favorites', workspaceId],
    queryFn: async () => {
      if (!workspaceId) throw new Error('Workspace ID is required')

      const response = await fetch(`/api/protocols/favorites?workspace_id=${workspaceId}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch favorites')
      }

      return response.json() as Promise<{
        favorites: Array<{
          id: string
          protocol_id: string
          created_at: string
          protocol: Protocol
        }>
        count: number
      }>
    },
    enabled: !!workspaceId,
  })
}

/**
 * Add protocol to favorites
 */
export function useAddFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ protocolId, workspaceId }: { protocolId: string; workspaceId: string }) => {
      const response = await fetch('/api/protocols/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          protocol_id: protocolId,
          workspace_id: workspaceId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add favorite')
      }

      return response.json()
    },
    onSuccess: (_, variables) => {
      // Invalidate favorites and protocol detail
      queryClient.invalidateQueries({ queryKey: ['protocol-favorites', variables.workspaceId] })
      queryClient.invalidateQueries({ queryKey: ['protocol', variables.protocolId] })
      queryClient.invalidateQueries({ queryKey: ['protocols', variables.workspaceId] })
    },
  })
}

/**
 * Remove protocol from favorites
 */
export function useRemoveFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ protocolId, workspaceId }: { protocolId: string; workspaceId: string }) => {
      const response = await fetch(`/api/protocols/favorites?protocol_id=${protocolId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to remove favorite')
      }

      return response.json()
    },
    onSuccess: (_, variables) => {
      // Invalidate favorites and protocol detail
      queryClient.invalidateQueries({ queryKey: ['protocol-favorites', variables.workspaceId] })
      queryClient.invalidateQueries({ queryKey: ['protocol', variables.protocolId] })
      queryClient.invalidateQueries({ queryKey: ['protocols', variables.workspaceId] })
    },
  })
}
