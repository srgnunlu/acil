import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { requireAdmin } from '@/lib/middleware/admin-auth'

export async function GET() {
  try {
    const authResult = await requireAdmin()
    if (authResult.error) {
      return authResult.error
    }

    const supabase = await createClient()
    const healthChecks: Array<{
      name: string
      status: 'healthy' | 'warning' | 'error'
      message: string
      details?: Record<string, unknown>
    }> = []

    // 1. Database Connection Check
    try {
      const { error: dbError } = await supabase.from('profiles').select('id').limit(1)
      if (dbError) {
        healthChecks.push({
          name: 'Database Bağlantısı',
          status: 'error',
          message: 'Veritabanı bağlantı hatası',
          details: { error: dbError.message },
        })
      } else {
        healthChecks.push({
          name: 'Database Bağlantısı',
          status: 'healthy',
          message: 'Bağlantı aktif',
        })
      }
    } catch (error) {
      healthChecks.push({
        name: 'Database Bağlantısı',
        status: 'error',
        message: 'Veritabanı bağlantı hatası',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      })
    }

    // 2. AI Services Check
    const aiServices = []
    if (process.env.OPENAI_API_KEY) {
      aiServices.push('OpenAI')
    }
    if (process.env.GEMINI_API_KEY) {
      aiServices.push('Gemini')
    }

    healthChecks.push({
      name: 'AI Servisleri',
      status: aiServices.length > 0 ? 'healthy' : 'warning',
      message: aiServices.length > 0 ? `${aiServices.join(' & ')} aktif` : 'AI servisleri yapılandırılmamış',
      details: {
        openai_enabled: !!process.env.OPENAI_API_KEY,
        gemini_enabled: !!process.env.GEMINI_API_KEY,
      },
    })

    // 3. Real-time System Check
    try {
      // Try to create a test channel
      const channel = supabase.channel('health-check')
      await channel.subscribe()
      await channel.unsubscribe()

      healthChecks.push({
        name: 'Real-time Sistem',
        status: 'healthy',
        message: 'Supabase Realtime çalışıyor',
      })
    } catch (error) {
      healthChecks.push({
        name: 'Real-time Sistem',
        status: 'warning',
        message: 'Realtime bağlantı kontrolü başarısız',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      })
    }

    // 4. Email Service Check
    const emailEnabled = !!process.env.RESEND_API_KEY
    healthChecks.push({
      name: 'Email Servisi',
      status: emailEnabled ? 'healthy' : 'warning',
      message: emailEnabled ? 'Resend aktif' : 'Email servisi yapılandırılmamış',
      details: {
        enabled: emailEnabled,
        provider: 'Resend',
      },
    })

    // 5. Storage Check (Supabase Storage)
    try {
      // Check if we can list buckets (this is a lightweight check)
      const { data: buckets, error: storageError } = await supabase.storage.listBuckets()
      if (storageError) {
        healthChecks.push({
          name: 'Storage',
          status: 'warning',
          message: 'Storage erişim kontrolü başarısız',
          details: { error: storageError.message },
        })
      } else {
        // Calculate storage usage (simplified - would need actual file sizes)
        healthChecks.push({
          name: 'Storage',
          status: 'healthy',
          message: `${buckets?.length || 0} bucket mevcut`,
          details: {
            bucket_count: buckets?.length || 0,
          },
        })
      }
    } catch (error) {
      healthChecks.push({
        name: 'Storage',
        status: 'warning',
        message: 'Storage kontrolü başarısız',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      })
    }

    // 6. Rate Limiting Check
    const rateLimitEnabled = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
    healthChecks.push({
      name: 'Rate Limiting',
      status: rateLimitEnabled ? 'healthy' : 'warning',
      message: rateLimitEnabled ? 'Upstash Redis aktif' : 'Rate limiting yapılandırılmamış',
      details: {
        enabled: rateLimitEnabled,
        provider: 'Upstash Redis',
      },
    })

    // 7. Database Performance Check
    try {
      const startTime = Date.now()
      await supabase.from('profiles').select('id').limit(1)
      const responseTime = Date.now() - startTime

      healthChecks.push({
        name: 'Database Performansı',
        status: responseTime < 100 ? 'healthy' : responseTime < 500 ? 'warning' : 'error',
        message: `Yanıt süresi: ${responseTime}ms`,
        details: {
          response_time_ms: responseTime,
        },
      })
    } catch (error) {
      healthChecks.push({
        name: 'Database Performansı',
        status: 'error',
        message: 'Performans kontrolü başarısız',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      })
    }

    // Calculate overall health status
    const healthyCount = healthChecks.filter((check) => check.status === 'healthy').length
    const warningCount = healthChecks.filter((check) => check.status === 'warning').length
    const errorCount = healthChecks.filter((check) => check.status === 'error').length

    const overallStatus =
      errorCount > 0 ? 'error' : warningCount > healthyCount ? 'warning' : 'healthy'

    return NextResponse.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks: healthChecks,
      summary: {
        total: healthChecks.length,
        healthy: healthyCount,
        warnings: warningCount,
        errors: errorCount,
      },
    })
  } catch (error) {
    logger.error({ error }, 'Admin system-health API error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

