import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'

// Rate limit yapılandırması
const rateLimitConfig = {
  // API endpoints için farklı limitler
  ai: {
    requests: 10,
    window: '1 m' as const, // 1 dakikada 10 istek
  },
  chat: {
    requests: 100,
    window: '1 m' as const, // 1 dakikada 100 istek
  },
  upload: {
    requests: 5,
    window: '1 m' as const, // 1 dakikada 5 upload
  },
  default: {
    requests: 30,
    window: '1 m' as const, // 1 dakikada 30 istek
  },
}

/**
 * Rate limiter instance
 * Development'ta UPSTASH_REDIS_REST_URL yoksa in-memory cache kullanır
 */
function createRateLimiter(type: keyof typeof rateLimitConfig = 'default') {
  const config = rateLimitConfig[type]

  // Upstash Redis varsa kullan, yoksa development için basit cache
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })

    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.requests, config.window),
      analytics: true,
      prefix: `acil:ratelimit:${type}`,
    })
  }

  // Development için rate limiting'i devre dışı bırak
  console.warn('⚠️  UPSTASH_REDIS not configured, rate limiting disabled in development')

  // Development modunda sınırsız izin ver
  return {
    limit: async () => ({
      success: true,
      limit: config.requests,
      remaining: config.requests,
      reset: Date.now() + 60000,
    }),
  } as any
}

/**
 * Rate limit checker for API routes
 * @param identifier - Unique identifier (usually IP or user ID)
 * @param type - Rate limit type
 */
export async function checkRateLimit(
  identifier: string,
  type: keyof typeof rateLimitConfig = 'default'
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  try {
    const ratelimit = createRateLimiter(type)
    const { success, limit, remaining, reset } = await ratelimit.limit(identifier)

    return {
      success,
      limit,
      remaining,
      reset,
    }
  } catch (error) {
    // Rate limit hata verirse, güvenli tarafta kal (izin ver ama log tut)
    console.error('Rate limit error:', error)

    // Development'ta rate limit yoksa geçiş izni ver
    if (process.env.NODE_ENV === 'development') {
      return { success: true, limit: 0, remaining: 0, reset: 0 }
    }

    // Production'da hata varsa güvenli taraftan fail
    return { success: false, limit: 0, remaining: 0, reset: 0 }
  }
}

/**
 * Rate limit response helper
 */
export function rateLimitResponse(remaining: number, reset: number) {
  return NextResponse.json(
    {
      error: 'Too many requests',
      message: 'Çok fazla istek gönderdiniz. Lütfen bir süre bekleyin.',
      retryAfter: Math.ceil((reset - Date.now()) / 1000),
    },
    {
      status: 429,
      headers: {
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': reset.toString(),
        'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
      },
    }
  )
}

/**
 * Get client identifier from request
 * Priority: User ID > IP Address > Generic fallback
 */
export function getClientIdentifier(request: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`
  }

  // IP address'i header'lardan çek
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown'

  return `ip:${ip}`
}
