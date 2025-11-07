import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Client-side'da doğrudan process.env kullan
  // Çünkü env.ts validation'ı client-side'da çalışmaz
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Supabase environment variables are missing. Please check your .env.local file.'
    )
  }

  return createBrowserClient(supabaseUrl, supabaseKey)
}
