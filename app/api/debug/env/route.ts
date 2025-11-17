import { NextResponse } from 'next/server'
import { env } from '@/lib/config/env'

export async function GET() {
  try {
    // Sadece development ortamında çalışsın
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Debug endpoint only available in development' }, { status: 403 })
    }

    // Environment variable'ları kontrol et (güvenlik için key'leri maskele)
    const debugInfo = {
      node_env: process.env.NODE_ENV,
      openai_key_set: !!process.env.OPENAI_API_KEY,
      openai_key_prefix: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 10) + '...' : 'not set',
      openai_key_length: process.env.OPENAI_API_KEY?.length || 0,
      gemini_key_set: !!process.env.GEMINI_API_KEY,
      supabase_url_set: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      env_openai_key_set: !!env.OPENAI_API_KEY,
      env_openai_key_prefix: env.OPENAI_API_KEY ? env.OPENAI_API_KEY.substring(0, 10) + '...' : 'not set',
      env_openai_key_length: env.OPENAI_API_KEY?.length || 0,
      raw_env_keys: Object.keys(process.env).filter(key => key.includes('OPENAI') || key.includes('GEMINI')),
    }

    console.log('🔍 Environment Debug Info:', debugInfo)

    return NextResponse.json(debugInfo)
  } catch (error: unknown) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Debug error' },
      { status: 500 }
    )
  }
}