/**
 * Performance Monitoring Utilities
 *
 * Web Vitals tracking and performance metrics
 */

/**
 * Measure component render time
 */
export function measureRenderTime(componentName: string, callback: () => void): void {
  const start = performance.now()
  callback()
  const end = performance.now()
  const duration = end - start

  if (process.env.NODE_ENV === 'development') {
    console.log(`[Performance] ${componentName} rendered in ${duration.toFixed(2)}ms`)
  }

  // Report to analytics in production
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'timing_complete', {
      name: componentName,
      value: Math.round(duration),
      event_category: 'Component Render',
    })
  }
}

/**
 * Debounce function for performance
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function for performance
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * Lazy load image with Intersection Observer
 */
export function lazyLoadImage(img: HTMLImageElement): void {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const image = entry.target as HTMLImageElement
          if (image.dataset.src) {
            image.src = image.dataset.src
            image.removeAttribute('data-src')
            observer.unobserve(image)
          }
        }
      })
    })

    observer.observe(img)
  } else {
    // Fallback for browsers without IntersectionObserver
    if (img.dataset.src) {
      img.src = img.dataset.src
    }
  }
}

/**
 * Preload critical resources
 */
export function preloadResource(url: string, type: 'script' | 'style' | 'image'): void {
  const link = document.createElement('link')
  link.rel = 'preload'
  link.href = url

  switch (type) {
    case 'script':
      link.as = 'script'
      break
    case 'style':
      link.as = 'style'
      break
    case 'image':
      link.as = 'image'
      break
  }

  document.head.appendChild(link)
}

/**
 * Get Web Vitals metrics
 */
export function reportWebVitals(metric: any): void {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Web Vital]', metric)
  }

  // Report to analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_label: metric.id,
      non_interaction: true,
    })
  }
}

/**
 * Measure API call duration
 */
export async function measureApiCall<T>(
  apiName: string,
  apiCall: () => Promise<T>
): Promise<T> {
  const start = performance.now()

  try {
    const result = await apiCall()
    const duration = performance.now() - start

    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] ${apiName} completed in ${duration.toFixed(2)}ms`)
    }

    return result
  } catch (error) {
    const duration = performance.now() - start
    console.error(`[API] ${apiName} failed after ${duration.toFixed(2)}ms`, error)
    throw error
  }
}

/**
 * Check if device is low-end (for performance optimization)
 */
export function isLowEndDevice(): boolean {
  if (typeof navigator === 'undefined') return false

  // Check device memory (if available)
  const memory = (navigator as any).deviceMemory
  if (memory && memory < 4) return true

  // Check hardware concurrency (CPU cores)
  const cores = navigator.hardwareConcurrency
  if (cores && cores < 4) return true

  // Check connection type
  const connection = (navigator as any).connection
  if (connection) {
    const slowConnections = ['slow-2g', '2g', '3g']
    if (slowConnections.includes(connection.effectiveType)) return true
  }

  return false
}

/**
 * Enable/disable animations based on device performance
 */
export function shouldReduceMotion(): boolean {
  if (typeof window === 'undefined') return false

  // Check user preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReducedMotion) return true

  // Check if low-end device
  return isLowEndDevice()
}
