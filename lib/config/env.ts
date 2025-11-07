import { z } from 'zod'

/**
 * Environment variable validation schema
 * Bu dosya uygulama başlatıldığında çalışır ve tüm gerekli env değişkenlerini doğrular
 */

// Server-side schema (tüm değişkenler)
const serverEnvSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Geçerli bir Supabase URL gerekli'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key gerekli'),

  // OpenAI (sadece server-side)
  OPENAI_API_KEY: z
    .string()
    .startsWith('sk-', 'OpenAI API key "sk-" ile başlamalı')
    .min(20, 'Geçerli bir OpenAI API key gerekli'),

  // Gemini (sadece server-side)
  GEMINI_API_KEY: z.string().min(1, 'Gemini API key gerekli'),

  // App Configuration
  NEXT_PUBLIC_APP_URL: z
    .preprocess(
      (val) => val || 'http://localhost:3000',
      z.string().url('Geçerli bir uygulama URL gerekli')
    )
    .default('http://localhost:3000'),
  NEXT_PUBLIC_FREE_PATIENT_LIMIT: z.preprocess((val) => {
    if (!val) return 3
    const parsed = parseInt(String(val), 10)
    return isNaN(parsed) ? 3 : parsed
  }, z.number().positive().default(3)),

  // Node Environment
  NODE_ENV: z
    .preprocess((val) => val || 'development', z.enum(['development', 'test', 'production']))
    .default('development'),

  // Monitoring (Optional)
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
})

// Client-side schema (sadece NEXT_PUBLIC_ ile başlayanlar)
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Geçerli bir Supabase URL gerekli'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key gerekli'),
  NEXT_PUBLIC_APP_URL: z
    .preprocess(
      (val) => val || 'http://localhost:3000',
      z.string().url('Geçerli bir uygulama URL gerekli')
    )
    .default('http://localhost:3000'),
  NEXT_PUBLIC_FREE_PATIENT_LIMIT: z.preprocess((val) => {
    if (!val) return 3
    const parsed = parseInt(String(val), 10)
    return isNaN(parsed) ? 3 : parsed
  }, z.number().positive().default(3)),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
})

/**
 * Validate environment variables
 * Server-side'da tüm değişkenleri, client-side'da sadece NEXT_PUBLIC_ ile başlayanları validate eder
 * @throws {ZodError} If validation fails
 */
function validateEnv() {
  const isServer = typeof window === 'undefined'
  const schema = isServer ? serverEnvSchema : clientEnvSchema

  // Debug: Environment variable'ları kontrol et
  if (isServer) {
    console.log('🔍 Environment variables check (Server):')
    console.log(
      '  NEXT_PUBLIC_SUPABASE_URL:',
      process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'
    )
    console.log(
      '  NEXT_PUBLIC_SUPABASE_ANON_KEY:',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'
    )
    console.log('  OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing')
    console.log('  GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Missing')
    console.log(
      '  NEXT_PUBLIC_FREE_PATIENT_LIMIT:',
      process.env.NEXT_PUBLIC_FREE_PATIENT_LIMIT || 'undefined (will use default: 3)'
    )
    console.log(
      '  Raw process.env keys:',
      Object.keys(process.env)
        .filter((k) => k.includes('SUPABASE') || k.includes('OPENAI') || k.includes('GEMINI'))
        .join(', ')
    )
  }

  try {
    return schema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError<unknown>
      // ZodError'un issues property'sini kullan
      const issues = 'issues' in zodError ? (zodError as { issues: z.ZodIssue[] }).issues : []

      if (issues.length > 0) {
        const missingVars = issues.map((err: z.ZodIssue) => {
          const path = Array.isArray(err.path) ? err.path.join('.') : String(err.path || 'unknown')
          return `  ❌ ${path}: ${err.message}`
        })

        const context = isServer ? 'Server' : 'Client'
        console.error(`❌ Environment variable validation failed (${context}):\n`)
        console.error(missingVars.join('\n'))

        if (isServer) {
          console.error('\n📝 Please check your .env.local file')
          console.error('📝 Make sure all required environment variables are set')
          console.error(
            '📝 After updating .env.local, restart the dev server (Ctrl+C then npm run dev)\n'
          )
        } else {
          console.error(
            '\n📝 Client-side: Only NEXT_PUBLIC_ variables are available in the browser'
          )
          console.error(
            '📝 Server-only variables (OPENAI_API_KEY, GEMINI_API_KEY) are not accessible on the client\n'
          )
        }

        throw new Error('Invalid environment variables')
      }
    }
    // Eğer ZodError değilse veya errors yoksa, orijinal hatayı fırlat
    console.error('❌ Unexpected error during environment validation:', error)
    throw error
  }
}

// Lazy validation - sadece ilk erişimde validate et
let cachedEnv: z.infer<typeof serverEnvSchema> | z.infer<typeof clientEnvSchema> | null = null

function getEnv() {
  if (!cachedEnv) {
    cachedEnv = validateEnv()
  }
  return cachedEnv
}

// Validate and export (lazy)
export const env = new Proxy({} as z.infer<typeof serverEnvSchema>, {
  get(_target, prop) {
    const envObj = getEnv()
    return envObj[prop as keyof typeof envObj]
  },
})

// Type-safe environment variables
export type Env = z.infer<typeof serverEnvSchema>
