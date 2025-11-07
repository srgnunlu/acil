import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN
const ENVIRONMENT = process.env.NODE_ENV || 'development'

/**
 * Sentry Edge Runtime Configuration
 * Handles error tracking in Edge Runtime (middleware, edge functions)
 */
Sentry.init({
  dsn: SENTRY_DSN,
  environment: ENVIRONMENT,

  // Adjust the sample rate to control how many events are sent
  tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,

  // Enable debugging in development
  debug: ENVIRONMENT === 'development',

  // Filter out sensitive data
  beforeSend(event) {
    // Remove sensitive request data
    if (event.request) {
      delete event.request.cookies
      if (event.request.headers) {
        delete event.request.headers.cookie
        delete event.request.headers.authorization
      }
    }

    return event
  },

  // Configure error grouping
  ignoreErrors: [
    // Rate limit errors (expected)
    'RateLimitError',
    // Auth errors (expected)
    'AuthApiError',
  ],
})
