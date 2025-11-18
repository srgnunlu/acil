import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkPermission, requirePermission, requireRole } from '../middleware'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Permission, WorkspaceRole } from '@/types/multi-tenant.types'

// Mock Supabase client
const mockGetUser = vi.fn()
const mockSingle = vi.fn()
const mockEq = vi.fn()
const mockSelect = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: vi.fn(() => ({
      select: mockSelect,
    })),
  })),
}))

// Setup mock chain properly
mockSelect.mockReturnValue({
  eq: mockEq,
})

const chainMethods = {
  eq: mockEq,
  single: mockSingle,
}

mockEq.mockReturnValue(chainMethods)

describe('Permission Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('checkPermission', () => {
    it('should return allowed: false if user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const result = await checkPermission('workspace-id', 'patients.create')

      expect(result.allowed).toBe(false)
      expect(result.error).toBe('Kimlik doğrulama gerekli')
    })

    it('should return allowed: false if user is not a workspace member', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      })

      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      })

      const result = await checkPermission('workspace-id', 'patients.create')

      expect(result.allowed).toBe(false)
      expect(result.error).toBe('Workspace üyeliği bulunamadı')
    })

    it('should return allowed: true if user has permission', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      })

      mockSingle.mockResolvedValue({
        data: {
          role: 'owner',
          permissions: [],
        },
        error: null,
      })

      const result = await checkPermission('workspace-id', 'patients.create')

      expect(result.allowed).toBe(true)
      expect(result.user).toBeDefined()
      expect(result.user?.role).toBe('owner')
    })
  })

  describe('requirePermission', () => {
    it('should throw error if user does not have permission', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      })

      mockSingle.mockResolvedValue({
        data: {
          role: 'nurse',
          permissions: [],
        },
        error: null,
      })

      await expect(requirePermission('workspace-id', 'patients.create')).rejects.toThrow()
    })

    it('should return user info if user has permission', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      })

      mockSingle.mockResolvedValue({
        data: {
          role: 'owner',
          permissions: [],
        },
        error: null,
      })

      const result = await requirePermission('workspace-id', 'patients.create')

      expect(result.user).toBeDefined()
      expect(result.user.role).toBe('owner')
    })
  })

  describe('requireRole', () => {
    it('should throw error if user does not have required role', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      })

      mockSingle.mockResolvedValue({
        data: {
          role: 'nurse',
          permissions: [],
        },
        error: null,
      })

      await expect(requireRole('workspace-id', ['owner', 'admin'])).rejects.toThrow(
        'Yeterli rol yok'
      )
    })

    it('should return user info if user has required role', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      })

      mockSingle.mockResolvedValue({
        data: {
          role: 'admin',
          permissions: [],
        },
        error: null,
      })

      const result = await requireRole('workspace-id', ['owner', 'admin'])

      expect(result.user).toBeDefined()
      expect(result.user.role).toBe('admin')
    })
  })
})
