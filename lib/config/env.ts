import { z } from 'zod'

/**
 * Environment variable validation schema
 * Bu dosya uygulama başlatıldığında çalışır ve tüm gerekli env değişkenlerini doğrular
 */
const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Geçerli bir Supabase URL gerekli'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key gerekli'),

  // OpenAI
  OPENAI_API_KEY: z
    .string()
    .startsWith('sk-', 'OpenAI API key "sk-" ile başlamalı')
    .min(20, 'Geçerli bir OpenAI API key gerekli'),

  // Gemini
  GEMINI_API_KEY: z.string().min(1, 'Gemini API key gerekli'),

  // App Configuration
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url('Geçerli bir uygulama URL gerekli')
    .default('http://localhost:3000'),
  NEXT_PUBLIC_FREE_PATIENT_LIMIT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive().default(3)),

  // Node Environment
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  // Monitoring (Optional)
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
})

/**
 * Validate environment variables
 * @throws {ZodError} If validation fails
 */
function validateEnv() {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((err) => {
        return `  ❌ ${err.path.join('.')}: ${err.message}`
      })

      console.error('❌ Environment variable validation failed:\n')
      console.error(missingVars.join('\n'))
      console.error('\n📝 Please check your .env.local file\n')

      throw new Error('Invalid environment variables')
    }
    throw error
  }
}

// Validate and export
export const env = validateEnv()

// Type-safe environment variables
export type Env = z.infer<typeof envSchema>
