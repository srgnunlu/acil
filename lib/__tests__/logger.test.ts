import { describe, it, expect, vi, beforeEach } from 'vitest'
import { logger, logApiRequest, logAiOperation, logError, logRateLimit, logAuth } from '../logger'

describe('Logger', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
  })

  describe('logger instance', () => {
    it('should be defined', () => {
      expect(logger).toBeDefined()
    })

    it('should have standard logging methods', () => {
      expect(logger.info).toBeDefined()
      expect(logger.error).toBeDefined()
      expect(logger.warn).toBeDefined()
      expect(logger.debug).toBeDefined()
    })
  })

  describe('logApiRequest', () => {
    it('should log API request without userId', () => {
      const logSpy = vi.spyOn(logger, 'info')

      logApiRequest('GET', '/api/patients', undefined, 100, 200)

      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'api_request',
          method: 'GET',
          path: '/api/patients',
          duration: 100,
          statusCode: 200,
        }),
        expect.stringContaining('GET /api/patients - 200')
      )
    })

    it('should log API request with userId', () => {
      const logSpy = vi.spyOn(logger, 'child')

      logApiRequest('POST', '/api/ai/analyze', 'user-123', 500, 200)

      expect(logSpy).toHaveBeenCalledWith({ userId: 'user-123' })
    })
  })

  describe('logAiOperation', () => {
    it('should log AI operation with all parameters', () => {
      const logSpy = vi.spyOn(logger, 'info')

      logAiOperation('analyze', 'patient-123', 'gpt-4', 1500, 2000)

      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ai_operation',
          operation: 'analyze',
          patientId: 'patient-123',
          model: 'gpt-4',
          tokens: 1500,
          duration: 2000,
        }),
        expect.stringContaining('AI Operation: analyze')
      )
    })

    it('should log AI operation with minimal parameters', () => {
      const logSpy = vi.spyOn(logger, 'info')

      logAiOperation('chat')

      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ai_operation',
          operation: 'chat',
        }),
        expect.stringContaining('AI Operation: chat')
      )
    })
  })

  describe('logError', () => {
    it('should log error with context', () => {
      const logSpy = vi.spyOn(logger, 'error')
      const error = new Error('Test error')

      logError(error, { context: 'test', userId: 'user-123' })

      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          error: expect.objectContaining({
            name: 'Error',
            message: 'Test error',
            stack: expect.any(String),
          }),
          context: 'test',
          userId: 'user-123',
        }),
        expect.stringContaining('Error: Test error')
      )
    })

    it('should log error without context', () => {
      const logSpy = vi.spyOn(logger, 'error')
      const error = new Error('Simple error')

      logError(error)

      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          error: expect.objectContaining({
            message: 'Simple error',
          }),
        }),
        expect.stringContaining('Error: Simple error')
      )
    })
  })

  describe('logRateLimit', () => {
    it('should log blocked rate limit as warning', () => {
      const logSpy = vi.spyOn(logger, 'warn')

      logRateLimit('user:123', '/api/ai/analyze', true)

      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'rate_limit',
          identifier: 'user:123',
          endpoint: '/api/ai/analyze',
          blocked: true,
        }),
        expect.stringContaining('BLOCKED')
      )
    })

    it('should log allowed rate limit as debug', () => {
      const logSpy = vi.spyOn(logger, 'debug')

      logRateLimit('user:123', '/api/ai/analyze', false)

      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'rate_limit',
          identifier: 'user:123',
          endpoint: '/api/ai/analyze',
          blocked: false,
        }),
        expect.stringContaining('checked')
      )
    })
  })

  describe('logAuth', () => {
    it('should log login event', () => {
      const logSpy = vi.spyOn(logger, 'info')

      logAuth('login', 'user-123', 'user@example.com')

      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'auth',
          event: 'login',
          userId: 'user-123',
          email: 'user@example.com',
        }),
        expect.stringContaining('Auth event: login')
      )
    })

    it('should log failed login event', () => {
      const logSpy = vi.spyOn(logger, 'info')

      logAuth('failed_login', undefined, 'wrong@example.com')

      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'auth',
          event: 'failed_login',
          email: 'wrong@example.com',
        }),
        expect.stringContaining('Auth event: failed_login')
      )
    })
  })
})
