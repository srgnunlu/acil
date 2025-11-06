import pino from 'pino'
import { env } from './config/env'

/**
 * Structured logger using Pino
 * Automatically redacts sensitive information
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || (env.NODE_ENV === 'production' ? 'info' : 'debug'),

  // Redact sensitive fields
  redact: {
    paths: [
      'password',
      'apiKey',
      'api_key',
      'token',
      'authorization',
      'cookie',
      'OPENAI_API_KEY',
      'GEMINI_API_KEY',
      'SUPABASE_ANON_KEY',
      '*.password',
      '*.apiKey',
      '*.token',
      'req.headers.authorization',
      'req.headers.cookie',
    ],
    remove: true,
  },

  // Format for development
  ...(env.NODE_ENV === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  }),

  // Base fields
  base: {
    env: env.NODE_ENV,
  },

  // Timestamp
  timestamp: pino.stdTimeFunctions.isoTime,
})

/**
 * Create a child logger with additional context
 */
export function createLogger(context: Record<string, unknown>) {
  return logger.child(context)
}

/**
 * Log API request/response
 */
export function logApiRequest(
  method: string,
  path: string,
  userId?: string,
  duration?: number,
  statusCode?: number
) {
  const log = userId ? logger.child({ userId }) : logger

  log.info({
    type: 'api_request',
    method,
    path,
    duration,
    statusCode,
  }, `${method} ${path} ${statusCode ? `- ${statusCode}` : ''}`)
}

/**
 * Log AI operations
 */
export function logAiOperation(
  operation: string,
  patientId?: string,
  model?: string,
  tokens?: number,
  duration?: number
) {
  logger.info({
    type: 'ai_operation',
    operation,
    patientId,
    model,
    tokens,
    duration,
  }, `AI Operation: ${operation}`)
}

/**
 * Log errors with context
 */
export function logError(
  error: Error,
  context?: Record<string, unknown>
) {
  logger.error({
    type: 'error',
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    ...context,
  }, `Error: ${error.message}`)
}

/**
 * Log database operations
 */
export function logDbOperation(
  operation: string,
  table: string,
  duration?: number,
  recordCount?: number
) {
  logger.debug({
    type: 'db_operation',
    operation,
    table,
    duration,
    recordCount,
  }, `DB ${operation}: ${table}`)
}

/**
 * Log rate limit events
 */
export function logRateLimit(
  identifier: string,
  endpoint: string,
  blocked: boolean
) {
  const level = blocked ? 'warn' : 'debug'

  logger[level]({
    type: 'rate_limit',
    identifier,
    endpoint,
    blocked,
  }, `Rate limit ${blocked ? 'BLOCKED' : 'checked'}: ${identifier} on ${endpoint}`)
}

/**
 * Log authentication events
 */
export function logAuth(
  event: 'login' | 'logout' | 'register' | 'failed_login',
  userId?: string,
  email?: string
) {
  logger.info({
    type: 'auth',
    event,
    userId,
    email,
  }, `Auth event: ${event}`)
}

/**
 * Export for backward compatibility
 */
export default logger
