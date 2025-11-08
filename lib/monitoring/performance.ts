/**
 * Performance Monitoring System
 * Web Vitals, API response times, cache hit rates
 */

import { onCLS, onFCP, onLCP, onTTFB, onINP } from 'web-vitals'

// Type definitions for performance monitoring
interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp?: number
  tags?: Record<string, string>
}

interface APIMetric {
  endpoint: string
  method: string
  status: number
  duration: number
  cacheHit: boolean
  timestamp?: number
  userId?: string
}

interface CacheMetric {
  key: string
  hitRate: number
  size: number
  evictions: number
  timestamp: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private apiMetrics: APIMetric[] = []
  private cacheMetrics: CacheMetric[] = []
  private observers: (PerformanceObserver | MutationObserver | ResizeObserver)[] = []

  constructor() {
    this.setupWebVitals()
    this.setupAPIMonitoring()
    this.setupMemoryMonitoring()
  }

  /**
   * Web Vitals monitoring
   */
  private setupWebVitals() {
    if (typeof window === 'undefined') return

    // Core Web Vitals
    onCLS((metric: any) => {
      this.recordMetric({
        name: 'CLS',
        value: metric.value,
        unit: 'score',
        tags: { rating: this.getCLSRating(metric.value) }
      })
    })

    onINP((metric: any) => {
      this.recordMetric({
        name: 'INP',
        value: metric.value,
        unit: 'ms',
        tags: { rating: this.getFIDRating(metric.value) }
      })
    })

    onFCP((metric: any) => {
      this.recordMetric({
        name: 'FCP',
        value: metric.value,
        unit: 'ms',
        tags: { rating: this.getFCPRating(metric.value) }
      })
    })

    onLCP((metric: any) => {
      this.recordMetric({
        name: 'LCP',
        value: metric.value,
        unit: 'ms',
        tags: { rating: this.getLCPRating(metric.value) }
      })
    })

    onTTFB((metric: any) => {
      this.recordMetric({
        name: 'TTFB',
        value: metric.value,
        unit: 'ms',
        tags: { rating: this.getTTFBRating(metric.value) }
      })
    })

    // Custom Performance Observer
    if ('PerformanceObserver' in window) {
      // Long Tasks
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric({
            name: 'LongTask',
            value: entry.duration,
            unit: 'ms',
            tags: { 
              startTime: entry.startTime.toFixed(2),
              type: entry.name 
            }
          })
        }
      })

      try {
        longTaskObserver.observe({ entryTypes: ['longtask'] })
        this.observers.push(longTaskObserver)
      } catch (e) {
        console.warn('Long task observer not supported')
      }

      // Resource Timing
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 1000) { // 1s'den uzun süren kaynaklar
            this.recordMetric({
              name: 'SlowResource',
              value: entry.duration,
              unit: 'ms',
              tags: {
                name: entry.name,
                type: this.getResourceType(entry.name),
                size: (entry as any).transferSize ? `${((entry as any).transferSize / 1024).toFixed(2)}KB` : 'unknown'
              }
            })
          }
        }
      })

      try {
        resourceObserver.observe({ entryTypes: ['resource'] })
        this.observers.push(resourceObserver)
      } catch (e) {
        console.warn('Resource observer not supported')
      }
    }
  }

  /**
   * API monitoring setup
   */
  private setupAPIMonitoring() {
    // Global fetch wrapper
    const originalFetch = window.fetch
    const self = this

    window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
      const start = performance.now()
      const url = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : input.url)
      const method = init?.method || 'GET'

      try {
        const response = await originalFetch.call(this, input, init)
        const duration = performance.now() - start

        self.recordAPIMetric({
          endpoint: url,
          method,
          status: response.status,
          duration,
          cacheHit: response.headers.get('X-Cache') === 'HIT'
        })

        return response
      } catch (error) {
        const duration = performance.now() - start
        self.recordAPIMetric({
          endpoint: url,
          method,
          status: 0,
          duration,
          cacheHit: false
        })
        throw error
      }
    }
  }

  /**
   * Memory monitoring
   */
  private setupMemoryMonitoring() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory
        if (memory) {
          this.recordMetric({
            name: 'MemoryUsage',
            value: memory.usedJSHeapSize / 1024 / 1024, // MB
            unit: 'MB',
            tags: {
              limit: (memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2),
              total: (memory.totalJSHeapSize / 1024 / 1024).toFixed(2)
            }
          })
        }
      }, 10000) // Every 10 seconds
    }
  }

  /**
   * Record performance metric
   */
  public recordMetric(metric: PerformanceMetric) {
    metric.timestamp = Date.now()
    this.metrics.push(metric)

    // Keep only last 1000 metrics in memory
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000)
    }

    // Send to analytics endpoint (debounced)
    this.sendMetricsDebounced()
  }

  /**
   * Record API metric
   */
  private recordAPIMetric(metric: APIMetric) {
    metric.timestamp = Date.now()
    this.apiMetrics.push(metric)

    // Keep only last 500 API metrics
    if (this.apiMetrics.length > 500) {
      this.apiMetrics = this.apiMetrics.slice(-500)
    }

    this.sendAPIMetricsDebounced()
  }

  /**
   * Debounced metrics sending
   */
  private sendMetricsDebounced = this.debounce(() => {
    this.sendMetrics()
  }, 5000) // 5 seconds

  private sendAPIMetricsDebounced = this.debounce(() => {
    this.sendAPIMetrics()
  }, 3000) // 3 seconds

  /**
   * Send metrics to server
   */
  private async sendMetrics() {
    if (this.metrics.length === 0) return

    try {
      await fetch('/api/analytics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'web-vitals',
          metrics: this.metrics.slice(-50) // Send last 50 metrics
        })
      })
    } catch (error) {
      console.error('Failed to send performance metrics:', error)
    }
  }

  /**
   * Send API metrics to server
   */
  private async sendAPIMetrics() {
    if (this.apiMetrics.length === 0) return

    try {
      await fetch('/api/analytics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'api-metrics',
          metrics: this.apiMetrics.slice(-100) // Send last 100 API calls
        })
      })
    } catch (error) {
      console.error('Failed to send API metrics:', error)
    }
  }

  /**
   * Rating helpers
   */
  private getCLSRating(cls: number): string {
    if (cls <= 0.1) return 'good'
    if (cls <= 0.25) return 'needs-improvement'
    return 'poor'
  }

  private getFIDRating(fid: number): string {
    if (fid <= 100) return 'good'
    if (fid <= 300) return 'needs-improvement'
    return 'poor'
  }

  private getFCPRating(fcp: number): string {
    if (fcp <= 1800) return 'good'
    if (fcp <= 3000) return 'needs-improvement'
    return 'poor'
  }

  private getLCPRating(lcp: number): string {
    if (lcp <= 2500) return 'good'
    if (lcp <= 4000) return 'needs-improvement'
    return 'poor'
  }

  private getTTFBRating(ttfb: number): string {
    if (ttfb <= 800) return 'good'
    if (ttfb <= 1800) return 'needs-improvement'
    return 'poor'
  }

  private getResourceType(name: string): string {
    if (name.includes('.css')) return 'css'
    if (name.includes('.js')) return 'javascript'
    if (name.includes('.png') || name.includes('.jpg') || name.includes('.webp')) return 'image'
    if (name.includes('.woff') || name.includes('.ttf')) return 'font'
    return 'other'
  }

  /**
   * Get performance summary
   */
  getSummary(): Record<string, any> {
    const recentMetrics = this.metrics.slice(-100)
    const recentAPIMetrics = this.apiMetrics.slice(-50)

    return {
      webVitals: {
        CLS: this.getAverage(recentMetrics, 'CLS'),
        FID: this.getAverage(recentMetrics, 'FID'),
        FCP: this.getAverage(recentMetrics, 'FCP'),
        LCP: this.getAverage(recentMetrics, 'LCP'),
        TTFB: this.getAverage(recentMetrics, 'TTFB'),
      },
      api: {
        averageResponseTime: this.getAPMAverage(recentAPIMetrics),
        slowestEndpoint: this.getSlowestEndpoint(recentAPIMetrics),
        cacheHitRate: this.getCacheHitRate(recentAPIMetrics),
        errorRate: this.getErrorRate(recentAPIMetrics),
      },
      memory: {
        current: this.getLatest(recentMetrics, 'MemoryUsage')?.value || 0,
        peak: this.getMax(recentMetrics, 'MemoryUsage'),
      },
      longTasks: this.getLongTaskCount(recentMetrics),
    }
  }

  private getAverage(metrics: PerformanceMetric[], name: string): number {
    const filtered = metrics.filter(m => m.name === name)
    if (filtered.length === 0) return 0
    return filtered.reduce((sum, m) => sum + m.value, 0) / filtered.length
  }

  private getAPMAverage(metrics: APIMetric[]): number {
    if (metrics.length === 0) return 0
    return metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length
  }

  private getSlowestEndpoint(metrics: APIMetric[]): string | null {
    if (metrics.length === 0) return null
    const slowest = metrics.reduce((max, m) => m.duration > max.duration ? m : max)
    return slowest.endpoint
  }

  private getCacheHitRate(metrics: APIMetric[]): number {
    if (metrics.length === 0) return 0
    const hits = metrics.filter(m => m.cacheHit).length
    return (hits / metrics.length) * 100
  }

  private getErrorRate(metrics: APIMetric[]): number {
    if (metrics.length === 0) return 0
    const errors = metrics.filter(m => m.status >= 400).length
    return (errors / metrics.length) * 100
  }

  private getLatest(metrics: PerformanceMetric[], name: string): PerformanceMetric | null {
    const filtered = metrics.filter(m => m.name === name)
    return filtered.length > 0 ? filtered[filtered.length - 1] : null
  }

  private getMax(metrics: PerformanceMetric[], name: string): number {
    const filtered = metrics.filter(m => m.name === name)
    return filtered.length > 0 ? Math.max(...filtered.map(m => m.value)) : 0
  }

  private getLongTaskCount(metrics: PerformanceMetric[]): number {
    return metrics.filter(m => m.name === 'LongTask').length
  }

  /**
   * Debounce utility
   */
  private debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null

    return (...args: Parameters<T>) => {
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    this.observers.forEach(observer => {
      if ('disconnect' in observer) {
        observer.disconnect()
      }
    })
    this.observers = []
    this.metrics = []
    this.apiMetrics = []
    this.cacheMetrics = []
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor()

// Export utilities
export function trackPageLoad(pageName: string) {
  const startTime = performance.now()
  
  // Track when page becomes interactive
  const checkInteractive = () => {
    if (document.readyState === 'complete') {
      const loadTime = performance.now() - startTime
      performanceMonitor.recordMetric({
        name: 'PageLoad',
        value: loadTime,
        unit: 'ms',
        tags: { page: pageName }
      })
    }
  }

  if (document.readyState === 'complete') {
    checkInteractive()
  } else {
    document.addEventListener('readystatechange', checkInteractive, { once: true })
  }
}

export function trackUserInteraction(action: string, element?: string) {
  performanceMonitor.recordMetric({
    name: 'UserInteraction',
    value: 1,
    unit: 'count',
    tags: { action, ...(element && { element }) }
  })
}

export function trackError(error: Error, context?: string) {
  performanceMonitor.recordMetric({
    name: 'JavaScriptError',
    value: 1,
    unit: 'count',
    tags: {
      message: error.message,
      ...(error.stack && { stack: error.stack.substring(0, 200) }),
      ...(context && { context })
    }
  })
}

// Global error tracking
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    trackError(event.error as Error, 'global')
  })

  window.addEventListener('unhandledrejection', (event) => {
    trackError(new Error((event as any).reason), 'unhandled-promise')
  })
}