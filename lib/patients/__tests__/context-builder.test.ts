import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildPatientContext, getPatient } from '../context-builder'
import type { SupabaseClient } from '@supabase/supabase-js'

// Mock Supabase client
const createMockSupabaseClient = () => {
  const mockSelect = vi.fn().mockReturnThis()
  const mockEq = vi.fn().mockReturnThis()
  const mockIs = vi.fn().mockReturnThis()
  const mockOrder = vi.fn().mockReturnThis()
  const mockLimit = vi.fn().mockReturnThis()
  const mockSingle = vi.fn()

  return {
    from: vi.fn(() => ({
      select: mockSelect,
      eq: mockEq,
      is: mockIs,
      order: mockOrder,
      limit: mockLimit,
      single: mockSingle,
    })),
    _mocks: {
      select: mockSelect,
      eq: mockEq,
      is: mockIs,
      order: mockOrder,
      limit: mockLimit,
      single: mockSingle,
    },
  } as unknown as SupabaseClient & { _mocks: Record<string, unknown> }
}

describe('Context Builder', () => {
  const mockPatientId = '123e4567-e89b-12d3-a456-426614174000'
  const mockUserId = '223e4567-e89b-12d3-a456-426614174001'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('buildPatientContext', () => {
    it('should build complete patient context', async () => {
      const mockSupabase = createMockSupabaseClient()

      const mockPatient = {
        id: mockPatientId,
        user_id: mockUserId,
        name: 'Test Patient',
        age: 45,
        gender: 'Erkek',
        status: 'active',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      const mockPatientData = [
        {
          id: '1',
          patient_id: mockPatientId,
          data_type: 'anamnesis',
          content: {
            chiefComplaint: 'Göğüs ağrısı',
            historyOfPresentIllness: 'Son 2 saattir devam eden göğüs ağrısı',
          },
          created_at: '2024-01-01T00:00:00Z',
        },
      ]

      const mockTests = [
        {
          id: '1',
          patient_id: mockPatientId,
          test_type: 'EKG',
          results: { rhythm: 'Sinüs ritmi' },
          created_at: '2024-01-01T00:00:00Z',
        },
      ]

      const mockAnalyses = [
        {
          id: '1',
          patient_id: mockPatientId,
          analysis_type: 'initial',
          ai_response: { summary: 'Test summary' },
          created_at: '2024-01-01T00:00:00Z',
        },
      ]

      // Setup mock responses
      mockSupabase._mocks.single.mockResolvedValueOnce({ data: mockPatient, error: null })

      // Mock Promise.all responses
      vi.spyOn(Promise, 'all').mockResolvedValueOnce([
        { data: mockPatientData },
        { data: mockTests },
        { data: mockAnalyses },
        { data: [] }, // calculatorResults
      ])

      const result = await buildPatientContext(mockSupabase, mockPatientId, mockUserId)

      expect(result).not.toBeNull()
      expect(result?.patient).toEqual(mockPatient)
      expect(result?.context.demographics).toEqual({
        name: 'Test Patient',
        age: 45,
        gender: 'Erkek',
      })
      expect(result?.context.anamnesis).toBeDefined()
      expect(result?.context.tests).toHaveLength(1)
      expect(result?.context.previousAnalyses).toHaveLength(1)
    })

    it('should return null for non-existent patient', async () => {
      const mockSupabase = createMockSupabaseClient()

      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Patient not found' },
      })

      const result = await buildPatientContext(mockSupabase, mockPatientId, mockUserId)

      expect(result).toBeNull()
    })

    it('should handle patient without additional data', async () => {
      const mockSupabase = createMockSupabaseClient()

      const mockPatient = {
        id: mockPatientId,
        user_id: mockUserId,
        name: 'Test Patient',
        age: 30,
        gender: 'Kadın',
        status: 'active',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockPatient,
        error: null,
      })

      vi.spyOn(Promise, 'all').mockResolvedValueOnce([
        { data: [] },
        { data: [] },
        { data: [] },
        { data: [] }, // calculatorResults
      ])

      const result = await buildPatientContext(mockSupabase, mockPatientId, mockUserId)

      expect(result).not.toBeNull()
      expect(result?.context.demographics).toBeDefined()
      expect(result?.context.tests).toBeUndefined()
      expect(result?.context.previousAnalyses).toBeUndefined()
    })
  })

  describe('getPatient', () => {
    it('should fetch patient by ID and user ID', async () => {
      const mockSupabase = createMockSupabaseClient()

      const mockPatient = {
        id: mockPatientId,
        user_id: mockUserId,
        name: 'Test Patient',
        age: 45,
        gender: 'Erkek',
        status: 'active',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: mockPatient,
        error: null,
      })

      const result = await getPatient(mockSupabase, mockPatientId, mockUserId)

      expect(result).toEqual(mockPatient)
      expect(mockSupabase.from).toHaveBeenCalledWith('patients')
    })

    it('should return null for unauthorized access', async () => {
      const mockSupabase = createMockSupabaseClient()

      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Unauthorized' },
      })

      const result = await getPatient(mockSupabase, mockPatientId, mockUserId)

      expect(result).toBeNull()
    })
  })
})
