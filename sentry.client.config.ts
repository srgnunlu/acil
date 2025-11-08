import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN
const ENVIRONMENT = process.env.NODE_ENV || 'development'

/**
 * Sentry Client Configuration
 * Handles error tracking in the browser
 */
// Only initialize Sentry if DSN is provided
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,

  // Adjust the sample rate to control how many events are sent
  // 1.0 = 100% of errors, 0.1 = 10% of errors
  tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,

  // Session Replay
  replaysOnErrorSampleRate: ENVIRONMENT === 'production' ? 1.0 : 0,
  replaysSessionSampleRate: ENVIRONMENT === 'production' ? 0.1 : 0,

  // Enable debugging in development
  debug: ENVIRONMENT === 'development',

  // Configure integrations
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
    Sentry.browserTracingIntegration(),
  ],

  // Filter out sensitive data
  beforeSend(event, hint) {
    // Filter out errors from browser extensions
    if (event.exception) {
      const error = hint.originalException
      if (
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof error.message === 'string'
      ) {
        if (
          error.message.includes('chrome-extension://') ||
          error.message.includes('moz-extension://')
        ) {
          return null
        }
      }
    }

    // Remove sensitive headers and cookies
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
    // Browser errors
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
    // Network errors
    'NetworkError',
    'Failed to fetch',
    'Load failed',
    // Aborted requests
    'AbortError',
    'Request aborted',
  ],
  })
}
