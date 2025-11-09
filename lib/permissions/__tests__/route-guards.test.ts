import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  checkRoutePermission,
  getUserWorkspaceInfo,
  checkAnyRoutePermission,
} from '../route-guards'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Permission } from '@/types/multi-tenant.types'

// Mock Next.js redirect
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`Redirect to ${url}`)
  }),
}))

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            limit: vi.fn(() => ({
              single: vi.fn(),
            })),
            single: vi.fn(),
          })),
        })),
      })),
    })),
  })),
}))

describe('Route Guards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('checkRoutePermission', () => {
    it('should redirect if user is not authenticated', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { redirect } = await import('next/navigation')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockClient = createClient() as any

      mockClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      await expect(
        checkRoutePermission({
          permission: 'patients.create',
          redirectTo: '/login',
        })
      ).rejects.toThrow('Redirect to /login')
    })

    it('should redirect to setup if workspace is required but not found', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { redirect } = await import('next/navigation')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockClient = createClient() as any

      mockClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      })

      const mockFrom = mockClient.from('workspace_members')
      mockFrom.select.mockReturnValue({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            limit: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Not found' },
              }),
            })),
          })),
        })),
      })

      await expect(
        checkRoutePermission({
          permission: 'patients.create',
          requireWorkspace: true,
        })
      ).rejects.toThrow('Redirect to /setup')
    })

    it('should return allowed: true if user has permission', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockClient = createClient() as any

      mockClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      })

      const mockFrom = mockClient.from('workspace_members')
      mockFrom.select.mockReturnValue({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            limit: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: {
                  workspace_id: 'workspace-id',
                  role: 'owner',
                  permissions: [],
                },
                error: null,
              }),
            })),
          })),
        })),
      })

      const result = await checkRoutePermission({
        permission: 'patients.create',
      })

      expect(result.allowed).toBe(true)
      expect(result.workspaceId).toBe('workspace-id')
    })

    it('should return allowed: false if user does not have permission', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockClient = createClient() as any

      mockClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      })

      const mockFrom = mockClient.from('workspace_members')
      mockFrom.select.mockReturnValue({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            limit: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: {
                  workspace_id: 'workspace-id',
                  role: 'nurse',
                  permissions: [],
                },
                error: null,
              }),
            })),
          })),
        })),
      })

      const result = await checkRoutePermission({
        permission: 'patients.create',
      })

      expect(result.allowed).toBe(false)
      expect(result.error).toBe('Yeterli izin yok')
    })
  })

  describe('getUserWorkspaceInfo', () => {
    it('should return null if user is not authenticated', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockClient = createClient() as any

      mockClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const result = await getUserWorkspaceInfo()
      expect(result).toBeNull()
    })

    it('should return workspace info if user is authenticated and has workspace', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockClient = createClient() as any

      mockClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      })

      const mockFrom = mockClient.from('workspace_members')
      mockFrom.select.mockReturnValue({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            limit: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: {
                  workspace_id: 'workspace-id',
                  role: 'owner',
                  permissions: ['patients.create'],
                },
                error: null,
              }),
            })),
          })),
        })),
      })

      const result = await getUserWorkspaceInfo()

      expect(result).not.toBeNull()
      expect(result?.workspaceId).toBe('workspace-id')
      expect(result?.role).toBe('owner')
      expect(result?.permissions).toContain('patients.create')
    })
  })

  describe('checkAnyRoutePermission', () => {
    it('should return allowed: true if user has any of the permissions', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockClient = createClient() as any

      mockClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      })

      const mockFrom = mockClient.from('workspace_members')
      mockFrom.select.mockReturnValue({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            limit: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: {
                  workspace_id: 'workspace-id',
                  role: 'nurse',
                  permissions: [],
                },
                error: null,
              }),
            })),
          })),
        })),
      })

      const result = await checkAnyRoutePermission(['patients.create', 'patients.read'])

      expect(result.allowed).toBe(true) // Nurse has patients.read
      expect(result.workspaceId).toBe('workspace-id')
    })

    it('should return allowed: false if user has none of the permissions', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockClient = createClient() as any

      mockClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      })

      const mockFrom = mockClient.from('workspace_members')
      mockFrom.select.mockReturnValue({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            limit: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: {
                  workspace_id: 'workspace-id',
                  role: 'observer',
                  permissions: [],
                },
                error: null,
              }),
            })),
          })),
        })),
      })

      const result = await checkAnyRoutePermission(['patients.create', 'patients.delete'])

      expect(result.allowed).toBe(false)
    })
  })
})
