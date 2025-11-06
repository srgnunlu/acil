import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN
const ENVIRONMENT = process.env.NODE_ENV || 'development'

/**
 * Sentry Server Configuration
 * Handles error tracking on the server side
 */
Sentry.init({
  dsn: SENTRY_DSN,
  environment: ENVIRONMENT,

  // Adjust the sample rate to control how many events are sent
  tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,

  // Enable debugging in development
  debug: ENVIRONMENT === 'development',

  // Configure integrations
  integrations: [Sentry.httpIntegration()],

  // Filter out sensitive data
  beforeSend(event) {
    // Remove sensitive environment variables
    if (event.contexts?.runtime?.env) {
      const env = event.contexts.runtime.env as Record<string, unknown>
      delete env.OPENAI_API_KEY
      delete env.GEMINI_API_KEY
      delete env.SUPABASE_SERVICE_ROLE_KEY
      delete env.UPSTASH_REDIS_REST_TOKEN
      // Remove all API keys and secrets
      Object.keys(env).forEach((key) => {
        if (
          key.includes('KEY') ||
          key.includes('SECRET') ||
          key.includes('TOKEN') ||
          key.includes('PASSWORD')
        ) {
          delete env[key]
        }
      })
    }

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
    // Supabase auth errors (expected)
    'AuthApiError',
    'AuthRetryableFetchError',
    // Rate limit errors (expected)
    'RateLimitError',
    // Validation errors (expected)
    'ZodError',
  ],
})
