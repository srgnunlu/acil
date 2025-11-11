import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useRealtimePatients } from '../useRealtimePatients'
import { createClient } from '@/lib/supabase/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn()
}))

describe('useRealtimePatients', () => {
  let mockChannel: {
    on: ReturnType<typeof vi.fn>
    subscribe: ReturnType<typeof vi.fn>
  }
  let mockSupabase: {
    channel: ReturnType<typeof vi.fn>
    removeChannel: ReturnType<typeof vi.fn>
  }
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })

    mockChannel = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockImplementation((callback) => {
        callback('SUBSCRIBED')
        return mockChannel
      })
    }

    mockSupabase = {
      channel: vi.fn().mockReturnValue(mockChannel),
      removeChannel: vi.fn()
    }

    vi.mocked(createClient).mockReturnValue(mockSupabase as never)
  })

  afterEach(() => {
    vi.clearAllMocks()
    queryClient.clear()
  })

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it('should initialize with disconnected status', () => {
    const { result } = renderHook(
      () =>
        useRealtimePatients({
          workspaceId: 'workspace-1',
          enabled: false
        }),
      { wrapper }
    )

    expect(result.current.status).toBe('disconnected')
    expect(result.current.error).toBeNull()
    expect(result.current.channel).toBeNull()
  })

  it('should connect when enabled', async () => {
    const { result } = renderHook(
      () =>
        useRealtimePatients({
          workspaceId: 'workspace-1',
          enabled: true
        }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.status).toBe('connected')
    })

    expect(mockSupabase.channel).toHaveBeenCalledWith('workspace:workspace-1:patients')
    expect(mockChannel.subscribe).toHaveBeenCalled()
  })

  it('should not connect when disabled', () => {
    const { result } = renderHook(
      () =>
        useRealtimePatients({
          workspaceId: 'workspace-1',
          enabled: false
        }),
      { wrapper }
    )

    expect(result.current.status).toBe('disconnected')
    expect(mockSupabase.channel).not.toHaveBeenCalled()
  })

  it('should cleanup on unmount', async () => {
    const { unmount } = renderHook(
      () =>
        useRealtimePatients({
          workspaceId: 'workspace-1',
          enabled: true
        }),
      { wrapper }
    )

    await waitFor(() => {
      expect(mockSupabase.channel).toHaveBeenCalled()
    })

    unmount()

    expect(mockSupabase.removeChannel).toHaveBeenCalled()
  })

  it('should call onInsert callback', async () => {
    const onInsert = vi.fn()
    const mockPatient = { id: 'patient-1', name: 'Test Patient' }

    mockChannel.on = vi.fn().mockImplementation((event, config, callback) => {
      if (config.event === 'INSERT') {
        // Simulate INSERT event
        setTimeout(() => {
          callback({ new: mockPatient })
        }, 100)
      }
      return mockChannel
    })

    renderHook(
      () =>
        useRealtimePatients({
          workspaceId: 'workspace-1',
          enabled: true,
          onInsert
        }),
      { wrapper }
    )

    await waitFor(
      () => {
        expect(onInsert).toHaveBeenCalledWith(mockPatient)
      },
      { timeout: 200 }
    )
  })

  it('should invalidate queries on UPDATE', async () => {
    const mockPatient = { id: 'patient-1', name: 'Updated Patient' }

    mockChannel.on = vi.fn().mockImplementation((event, config, callback) => {
      if (config.event === 'UPDATE') {
        setTimeout(() => {
          callback({ new: mockPatient })
        }, 100)
      }
      return mockChannel
    })

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    renderHook(
      () =>
        useRealtimePatients({
          workspaceId: 'workspace-1',
          enabled: true
        }),
      { wrapper }
    )

    await waitFor(
      () => {
        expect(invalidateSpy).toHaveBeenCalled()
      },
      { timeout: 200 }
    )
  })
})
