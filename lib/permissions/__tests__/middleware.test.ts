import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkPermission, requirePermission, requireRole } from '../middleware'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Permission, WorkspaceRole } from '@/types/multi-tenant.types'

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
            single: vi.fn(),
          })),
        })),
      })),
    })),
  })),
}))

describe('Permission Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('checkPermission', () => {
    it('should return allowed: false if user is not authenticated', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockClient = createClient() as any

      mockClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const result = await checkPermission('workspace-id', 'patients.create')

      expect(result.allowed).toBe(false)
      expect(result.error).toBe('Kimlik doğrulama gerekli')
    })

    it('should return allowed: false if user is not a workspace member', async () => {
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
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Not found' },
              }),
            })),
          })),
        })),
      })

      const result = await checkPermission('workspace-id', 'patients.create')

      expect(result.allowed).toBe(false)
      expect(result.error).toBe('Workspace üyeliği bulunamadı')
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
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: {
                  role: 'owner',
                  permissions: [],
                },
                error: null,
              }),
            })),
          })),
        })),
      })

      const result = await checkPermission('workspace-id', 'patients.create')

      expect(result.allowed).toBe(true)
      expect(result.user).toBeDefined()
      expect(result.user?.role).toBe('owner')
    })
  })

  describe('requirePermission', () => {
    it('should throw error if user does not have permission', async () => {
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
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: {
                  role: 'nurse',
                  permissions: [],
                },
                error: null,
              }),
            })),
          })),
        })),
      })

      await expect(requirePermission('workspace-id', 'patients.create')).rejects.toThrow()
    })

    it('should return user info if user has permission', async () => {
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
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: {
                  role: 'owner',
                  permissions: [],
                },
                error: null,
              }),
            })),
          })),
        })),
      })

      const result = await requirePermission('workspace-id', 'patients.create')

      expect(result.user).toBeDefined()
      expect(result.user.role).toBe('owner')
    })
  })

  describe('requireRole', () => {
    it('should throw error if user does not have required role', async () => {
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
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: {
                  role: 'nurse',
                  permissions: [],
                },
                error: null,
              }),
            })),
          })),
        })),
      })

      await expect(requireRole('workspace-id', ['owner', 'admin'])).rejects.toThrow(
        'Yeterli rol yok'
      )
    })

    it('should return user info if user has required role', async () => {
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
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: {
                  role: 'admin',
                  permissions: [],
                },
                error: null,
              }),
            })),
          })),
        })),
      })

      const result = await requireRole('workspace-id', ['owner', 'admin'])

      expect(result.user).toBeDefined()
      expect(result.user.role).toBe('admin')
    })
  })
})
