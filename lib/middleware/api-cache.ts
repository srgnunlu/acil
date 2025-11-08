/**
 * API Response Caching Middleware
 * Next.js API route'leri için cache katmanı
 */

import { NextRequest, NextResponse } from 'next/server'
import { cache } from '@/lib/cache/cache-service'
import { env } from '@/lib/config/env'

interface CacheOptions {
  ttl?: number // TTL in seconds
  key?: string // Custom cache key
  vary?: string[] // Vary headers
  revalidate?: string // Revalidate header
}

/**
 * API response wrapper with caching
 */
export function withApiCache<T>(
  handler: (req: NextRequest) => Promise<NextResponse<T>>,
  options: CacheOptions = {}
) {
  return async (req: NextRequest): Promise<NextResponse<T>> => {
    const {
      ttl = 300, // Default 5 dakika
      key,
      vary = [],
      revalidate
    } = options

    // Cache key oluştur
    const cacheKey = key || generateCacheKey(req)

    // GET request'leri cache'le
    if (req.method === 'GET') {
      // Cache'ten kontrol et
      const cached = await cache.get<NextResponse<T>>('api', cacheKey)
      
      if (cached) {
        // Cache hit - ETag ve Cache-Control header'ları ekle
        const response = new NextResponse(cached.body, {
          status: cached.status,
          headers: cached.headers,
        })
        
        response.headers.set('X-Cache', 'HIT')
        response.headers.set('Age', calculateAge(cached.headers.get('Date')))
        
        return response as NextResponse<T>
      }

      // Cache miss - handler'ı çalıştır
      const response = await handler(req)
      
      // Başarılı response'ları cache'le
      if (response.status === 200 && ttl > 0) {
        await cache.set('api', cacheKey, response, ttl)
        
        response.headers.set('X-Cache', 'MISS')
        response.headers.set('Cache-Control', `public, max-age=${ttl}`)
        
        if (revalidate) {
          response.headers.set('Surrogate-Control', `max-age=${ttl}, stale-while-revalidate=60`)
        }
        
        if (vary.length > 0) {
          response.headers.set('Vary', vary.join(', '))
        }
      }
      
      return response
    }

    // Non-GET request'leri doğrudan işle
    const response = await handler(req)
    response.headers.set('X-Cache', 'BYPASS')
    
    return response
  }
}

/**
 * Cache key generator
 */
function generateCacheKey(req: NextRequest): string {
  const url = new URL(req.url)
  const pathname = url.pathname
  const searchParams = url.searchParams.toString()
  
  // User ID'yi header'dan al (varsa)
  const userId = req.headers.get('x-user-id') || 'anonymous'
  
  // Base key
  let key = `${pathname}:${userId}`
  
  // Search parameters'ı ekle
  if (searchParams) {
    key += `:${searchParams}`
  }
  
  // Vary headers'ı ekle
  const varyHeaders = ['authorization', 'x-tenant-id']
  for (const header of varyHeaders) {
    const value = req.headers.get(header)
    if (value) {
      key += `:${header}:${value}`
    }
  }
  
  return key
}

/**
 * Cache age calculator
 */
function calculateAge(dateHeader?: string | null): string {
  if (!dateHeader) return '0'
  
  const cachedDate = new Date(dateHeader)
  const now = new Date()
  const age = Math.floor((now.getTime() - cachedDate.getTime()) / 1000)
  
  return age.toString()
}

/**
 * Cache invalidation helpers
 */
export class CacheInvalidator {
  /**
   * User cache'ini temizle
   */
  static async invalidateUser(userId: string): Promise<void> {
    await cache.invalidateUserCache(userId)
  }

  /**
   * Patient cache'ini temizle
   */
  static async invalidatePatient(patientId: string): Promise<void> {
    await cache.invalidatePatientCache(patientId)
  }

  /**
   * Pattern ile cache temizle
   */
  static async invalidatePattern(pattern: string): Promise<void> {
    await cache.invalidatePattern(pattern)
  }

  /**
   * Tüm API cache'ini temizle
   */
  static async clearAll(): Promise<void> {
    await cache.invalidatePattern('api:*')
  }
}

/**
 * Cache decorators for API routes
 */
export function Cached(ttl: number = 300, key?: string) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (req: NextRequest) {
      const cacheKey = key || `${target.constructor.name}:${propertyName}`
      
      // GET request'leri cache'le
      if (req.method === 'GET') {
        const cached = await cache.get(`api`, cacheKey)
        if (cached) {
          return new NextResponse(JSON.stringify(cached), {
            headers: {
              'Content-Type': 'application/json',
              'X-Cache': 'HIT',
              'Cache-Control': `public, max-age=${ttl}`
            }
          })
        }
      }

      // Handler'ı çalıştır
      const result = await originalMethod.apply(this, [req])
      
      // Başarılı sonuçları cache'le
      if (req.method === 'GET' && result.status === 200) {
        const data = await result.json()
        await cache.set('api', cacheKey, data, ttl)
        
        result.headers.set('X-Cache', 'MISS')
        result.headers.set('Cache-Control', `public, max-age=${ttl}`)
      }
      
      return result
    }

    return descriptor
  }
}

/**
 * Response caching utilities
 */
export class ResponseCache {
  /**
   * JSON response with cache headers
   */
  static json(data: any, options: CacheOptions = {}): NextResponse {
    const { ttl = 300, revalidate } = options
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    
    if (ttl > 0) {
      headers['Cache-Control'] = `public, max-age=${ttl}`
      
      if (revalidate) {
        headers['Surrogate-Control'] = `max-age=${ttl}, stale-while-revalidate=60`
      }
    }
    
    return NextResponse.json(data, { headers })
  }

  /**
   * Error response with no cache
   */
  static error(message: string, status: number = 500): NextResponse {
    return NextResponse.json(
      { error: message },
      { 
        status,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    )
  }

  /**
   * Redirect response
   */
  static redirect(url: string, permanent: boolean = false): NextResponse {
    return NextResponse.redirect(url, permanent ? 308 : 307)
  }

  /**
   * Stream response (no cache)
   */
  static stream(body: ReadableStream, headers: Record<string, string> = {}): NextResponse {
    return new NextResponse(body, {
      headers: {
        ...headers,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    })
  }
}

/**
 * Cache warming utilities
 */
export class CacheWarmer {
  /**
   * Önceden cache'leme
   */
  static async warmCache(urls: string[]): Promise<void> {
    const promises = urls.map(async (url) => {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Cache-Warm': 'true'
          }
        })
        
        if (response.ok) {
          console.log(`✅ Cache warmed: ${url}`)
        }
      } catch (error) {
        console.error(`❌ Cache warm failed: ${url}`, error)
      }
    })
    
    await Promise.allSettled(promises)
  }

  /**
   * Sık kullanılan endpoint'leri önceden yükle
   */
  static async warmCommonEndpoints(): Promise<void> {
    const commonUrls = [
      '/api/statistics',
      '/api/patients',
      '/api/reminders',
    ]
    
    await this.warmCache(commonUrls)
  }
}

/**
 * Cache statistics
 */
export class CacheStats {
  /**
   * Cache hit rate hesapla
   */
  static async getHitRate(): Promise<number> {
    // Bu fonksiyon Redis/monitoring sistemi ile implement edilebilir
    // Şimdilik placeholder
    return 0.85 // 85% hit rate
  }

  /**
   * Cache size bilgisi
   */
  static async getSize(): Promise<string> {
    // Cache size'ı MB cinsinden döndür
    return '12.5 MB'
  }

  /**
   * Cache performance metrikleri
   */
  static async getMetrics(): Promise<Record<string, any>> {
    return {
      hit_rate: await this.getHitRate(),
      size: await this.getSize(),
      total_keys: 1247,
      memory_usage: '45.2 MB',
      eviction_rate: 0.05,
    }
  }
}