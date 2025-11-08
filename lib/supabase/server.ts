import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { env } from '@/lib/config/env'

export async function createClient() {
  try {
    const cookieStore = await cookies()

    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase URL veya Anon Key eksik')
    }

    return createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component'te cookie set edilemez
          }
        },
      },
    })
  } catch (error) {
    console.error('Supabase client oluşturulurken hata:', error)
    throw error
  }
}
