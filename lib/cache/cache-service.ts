/**
 * Cache Service - Redis ve Memory cache yönetimi
 * Development'da memory, production'da Redis kullanır
 */

import { env } from '@/lib/config/env'

// Cache interface
interface CacheEntry<T = any> {
  data: T
  timestamp: number
  ttl: number
}

// Memory cache (development için)
class MemoryCache {
  private cache = new Map<string, CacheEntry>()
  private timers = new Map<string, NodeJS.Timeout>()

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key) as CacheEntry<T>
    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.delete(key)
      return null
    }

    return entry.data
  }

  async set<T>(key: string, value: T, ttl: number = 300000): Promise<void> {
    // TTL milliseconds cinsinden (default 5 dakika)
    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      ttl,
    }

    this.cache.set(key, entry)

    // Auto-delete timer
    const existingTimer = this.timers.get(key)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    const timer = setTimeout(() => {
      this.delete(key)
    }, ttl)

    this.timers.set(key, timer)
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key)
    const timer = this.timers.get(key)
    if (timer) {
      clearTimeout(timer)
      this.timers.delete(key)
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'))
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        await this.delete(key)
      }
    }
  }

  async clear(): Promise<void> {
    this.cache.clear()
    for (const timer of this.timers.values()) {
      clearTimeout(timer)
    }
    this.timers.clear()
  }
}

// Redis cache (production için)
class RedisCache {
  private client: any = null
  private isConnected = false

  private async connect() {
    if (this.isConnected || !this.client) return

    try {
      // Redis client initialization
      // Not: Bu kısım Redis kurulumuna göre değişecek
      // Şimdilik placeholder olarak kalacak
      this.isConnected = true
    } catch (error) {
      console.error('Redis connection failed:', error)
      this.isConnected = false
    }
  }

  async get<T>(key: string): Promise<T | null> {
    await this.connect()
    if (!this.isConnected) return null

    try {
      const value = await this.client.get(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error('Redis get error:', error)
      return null
    }
  }

  async set<T>(key: string, value: T, ttl: number = 300): Promise<void> {
    await this.connect()
    if (!this.isConnected) return

    try {
      await this.client.setex(key, ttl, JSON.stringify(value))
    } catch (error) {
      console.error('Redis set error:', error)
    }
  }

  async delete(key: string): Promise<void> {
    await this.connect()
    if (!this.isConnected) return

    try {
      await this.client.del(key)
    } catch (error) {
      console.error('Redis delete error:', error)
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    await this.connect()
    if (!this.isConnected) return

    try {
      const keys = await this.client.keys(pattern)
      if (keys.length > 0) {
        await this.client.del(...keys)
      }
    } catch (error) {
      console.error('Redis invalidate pattern error:', error)
    }
  }

  async clear(): Promise<void> {
    await this.connect()
    if (!this.isConnected) return

    try {
      await this.client.flushdb()
    } catch (error) {
      console.error('Redis clear error:', error)
    }
  }
}

// Cache service factory
class CacheService {
  private cache: MemoryCache | RedisCache

  constructor() {
    // Production'da Redis, development'da Memory cache
    if (env.NODE_ENV === 'production' && process.env.REDIS_URL) {
      this.cache = new RedisCache()
    } else {
      this.cache = new MemoryCache()
    }
  }

  // Cache key generator
  private generateKey(prefix: string, identifier: string): string {
    return `${prefix}:${identifier}`
  }

  // Get cached data
  async get<T>(
    prefix: string,
    identifier: string,
    defaultValue?: T
  ): Promise<T | null> {
    const key = this.generateKey(prefix, identifier)
    const cached = await this.cache.get<T>(key)
    
    if (cached) {
      console.log(`🎯 Cache HIT: ${key}`)
      return cached
    }
    
    console.log(`❌ Cache MISS: ${key}`)
    return defaultValue || null
  }

  // Set cache data
  async set<T>(
    prefix: string,
    identifier: string,
    value: T,
    ttlSeconds: number = 300
  ): Promise<void> {
    const key = this.generateKey(prefix, identifier)
    await this.cache.set(key, value, ttlSeconds * 1000)
    console.log(`💾 Cache SET: ${key} (TTL: ${ttlSeconds}s)`)
  }

  // Delete cache
  async delete(prefix: string, identifier: string): Promise<void> {
    const key = this.generateKey(prefix, identifier)
    await this.cache.delete(key)
    console.log(`🗑️ Cache DELETE: ${key}`)
  }

  // Invalidate by pattern
  async invalidatePattern(pattern: string): Promise<void> {
    await this.cache.invalidatePattern(pattern)
    console.log(`🧹 Cache INVALIDATE: ${pattern}`)
  }

  // User-specific cache invalidation
  async invalidateUserCache(userId: string): Promise<void> {
    const patterns = [
      `patients:${userId}:*`,
      `statistics:${userId}:*`,
      `reminders:${userId}:*`,
      `analytics:${userId}:*`,
    ]

    for (const pattern of patterns) {
      await this.invalidatePattern(pattern)
    }
  }

  // Patient-specific cache invalidation
  async invalidatePatientCache(patientId: string): Promise<void> {
    const patterns = [
      `patient:${patientId}:*`,
      `patientData:${patientId}:*`,
      `patientTests:${patientId}:*`,
      `patientAnalyses:${patientId}:*`,
      `chat:${patientId}:*`,
    ]

    for (const pattern of patterns) {
      await this.invalidatePattern(pattern)
    }
  }
}

// Singleton instance
export const cache = new CacheService()

// Cache decorators for API routes
export function withCache<T>(
  prefix: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 300,
  identifier: string = ''
) {
  return async (): Promise<T> => {
    const cacheKey = identifier || `${prefix}:${Date.now()}`
    
    // Try to get from cache
    const cached = await cache.get<T>(prefix, cacheKey)
    if (cached) return cached

    // Fetch fresh data
    const data = await fetcher()
    
    // Cache the result
    await cache.set(prefix, cacheKey, data, ttlSeconds)
    
    return data
  }
}

// Export types
export type { CacheEntry }