import { describe, it, expect } from 'vitest'
import {
  createPatientSchema,
  chatMessageSchema,
  aiAnalysisRequestSchema,
  patientDataSchema,
  patientTestSchema,
  reminderSchema,
  bulkPatientOperationSchema,
  validateRequest,
} from '../schemas'

describe('Validation Schemas', () => {
  describe('createPatientSchema', () => {
    it('should validate a valid patient', () => {
      const validPatient = {
        name: 'Ahmet Yılmaz',
        age: 45,
        gender: 'Erkek' as const,
        status: 'active' as const,
      }

      const result = createPatientSchema.safeParse(validPatient)
      expect(result.success).toBe(true)
    })

    it('should reject invalid name', () => {
      const invalidPatient = {
        name: 'A', // Too short
        age: 45,
      }

      const result = createPatientSchema.safeParse(invalidPatient)
      expect(result.success).toBe(false)
    })

    it('should reject invalid age', () => {
      const invalidPatient = {
        name: 'Test User',
        age: -5, // Negative age
      }

      const result = createPatientSchema.safeParse(invalidPatient)
      expect(result.success).toBe(false)
    })

    it('should accept optional fields', () => {
      const minimalPatient = {
        name: 'Test User',
      }

      const result = createPatientSchema.safeParse(minimalPatient)
      expect(result.success).toBe(true)
    })
  })

  describe('chatMessageSchema', () => {
    it('should validate a valid chat message', () => {
      const validMessage = {
        patientId: '123e4567-e89b-12d3-a456-426614174000',
        message: 'Bu hastanın risk faktörleri nelerdir?',
      }

      const result = chatMessageSchema.safeParse(validMessage)
      expect(result.success).toBe(true)
    })

    it('should reject empty message', () => {
      const invalidMessage = {
        patientId: '123e4567-e89b-12d3-a456-426614174000',
        message: '',
      }

      const result = chatMessageSchema.safeParse(invalidMessage)
      expect(result.success).toBe(false)
    })

    it('should reject too long message', () => {
      const invalidMessage = {
        patientId: '123e4567-e89b-12d3-a456-426614174000',
        message: 'a'.repeat(2001), // Over 2000 chars
      }

      const result = chatMessageSchema.safeParse(invalidMessage)
      expect(result.success).toBe(false)
    })

    it('should reject invalid UUID', () => {
      const invalidMessage = {
        patientId: 'not-a-uuid',
        message: 'Test message',
      }

      const result = chatMessageSchema.safeParse(invalidMessage)
      expect(result.success).toBe(false)
    })
  })

  describe('aiAnalysisRequestSchema', () => {
    it('should validate initial analysis request', () => {
      const validRequest = {
        patientId: '123e4567-e89b-12d3-a456-426614174000',
        analysisType: 'initial' as const,
      }

      const result = aiAnalysisRequestSchema.safeParse(validRequest)
      expect(result.success).toBe(true)
    })

    it('should validate updated analysis request', () => {
      const validRequest = {
        patientId: '123e4567-e89b-12d3-a456-426614174000',
        analysisType: 'updated' as const,
      }

      const result = aiAnalysisRequestSchema.safeParse(validRequest)
      expect(result.success).toBe(true)
    })

    it('should default to initial when not specified', () => {
      const request = {
        patientId: '123e4567-e89b-12d3-a456-426614174000',
      }

      const result = aiAnalysisRequestSchema.parse(request)
      expect(result.analysisType).toBe('initial')
    })
  })

  describe('patientDataSchema', () => {
    it('should validate demographics data', () => {
      const validData = {
        patientId: '123e4567-e89b-12d3-a456-426614174000',
        data_type: 'demographics' as const,
        content: {
          name: 'Test User',
          age: 45,
        },
      }

      const result = patientDataSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate all data types', () => {
      const dataTypes = ['demographics', 'anamnesis', 'medications', 'vital_signs', 'history'] as const

      dataTypes.forEach((type) => {
        const data = {
          patientId: '123e4567-e89b-12d3-a456-426614174000',
          data_type: type,
          content: { test: 'data' },
        }

        const result = patientDataSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('bulkPatientOperationSchema', () => {
    it('should validate bulk delete operation', () => {
      const validOperation = {
        patientIds: [
          '123e4567-e89b-12d3-a456-426614174000',
          '223e4567-e89b-12d3-a456-426614174001',
        ],
        action: 'delete' as const,
      }

      const result = bulkPatientOperationSchema.safeParse(validOperation)
      expect(result.success).toBe(true)
    })

    it('should reject empty patient list', () => {
      const invalidOperation = {
        patientIds: [],
        action: 'delete' as const,
      }

      const result = bulkPatientOperationSchema.safeParse(invalidOperation)
      expect(result.success).toBe(false)
    })

    it('should reject too many patients', () => {
      const invalidOperation = {
        patientIds: Array(51).fill('123e4567-e89b-12d3-a456-426614174000'),
        action: 'delete' as const,
      }

      const result = bulkPatientOperationSchema.safeParse(invalidOperation)
      expect(result.success).toBe(false)
    })
  })

  describe('validateRequest helper', () => {
    it('should return success for valid data', () => {
      const data = {
        patientId: '123e4567-e89b-12d3-a456-426614174000',
        message: 'Test message',
      }

      const result = validateRequest(chatMessageSchema, data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(data)
      }
    })

    it('should return error for invalid data', () => {
      const data = {
        patientId: 'invalid-uuid',
        message: 'Test message',
      }

      const result = validateRequest(chatMessageSchema, data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeDefined()
        expect(typeof result.error).toBe('string')
      }
    })
  })
})
