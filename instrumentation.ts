/**
 * Instrumentation
 * Initializes monitoring and observability tools
 * This file is automatically loaded by Next.js
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side instrumentation
    await import('./sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime instrumentation
    await import('./sentry.edge.config')
  }
}

export const onRequestError = async (
  err: unknown,
  request: {
    path: string
    method: string
    headers: Headers
  }
) => {
  // Log the error
  console.error('Request error:', {
    path: request.path,
    method: request.method,
    error: err,
  })

  // Additional error handling can be added here
  // For example, sending to custom logging service
}
