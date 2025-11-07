import { onCLS, onFID, onFCP, onLCP, onTTFB, onINP, Metric } from 'web-vitals'
import { logger } from '@/lib/logger'

/**
 * Web Vitals monitoring
 * Tracks Core Web Vitals for performance monitoring
 */

function sendToAnalytics(metric: Metric) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Web Vitals]', {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
    })
  }

  // Log using structured logger
  logger.info({
    type: 'web_vitals',
    metric: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
  }, `Web Vital: ${metric.name} = ${metric.value}`)

  // Send to analytics service (e.g., Google Analytics, Vercel Analytics)
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', metric.name, {
      event_category: 'Web Vitals',
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_label: metric.id,
      non_interaction: true,
    })
  }
}

/**
 * Initialize Web Vitals monitoring
 * Call this function in your root layout or app component
 */
export function initWebVitals() {
  try {
    // Core Web Vitals
    onCLS(sendToAnalytics) // Cumulative Layout Shift
    onFID(sendToAnalytics) // First Input Delay (deprecated, use INP)
    onFCP(sendToAnalytics) // First Contentful Paint
    onLCP(sendToAnalytics) // Largest Contentful Paint
    onTTFB(sendToAnalytics) // Time to First Byte
    onINP(sendToAnalytics) // Interaction to Next Paint (new metric)
  } catch (error) {
    logger.error({
      type: 'web_vitals_error',
      error,
    }, 'Failed to initialize Web Vitals monitoring')
  }
}

/**
 * Get performance thresholds
 * Based on Google's Web Vitals thresholds
 */
export const VITALS_THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 }, // ms
  FID: { good: 100, needsImprovement: 300 }, // ms
  CLS: { good: 0.1, needsImprovement: 0.25 }, // score
  FCP: { good: 1800, needsImprovement: 3000 }, // ms
  TTFB: { good: 800, needsImprovement: 1800 }, // ms
  INP: { good: 200, needsImprovement: 500 }, // ms
} as const

/**
 * Determine performance rating
 */
export function getPerformanceRating(
  metric: keyof typeof VITALS_THRESHOLDS,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = VITALS_THRESHOLDS[metric]

  if (value <= thresholds.good) return 'good'
  if (value <= thresholds.needsImprovement) return 'needs-improvement'
  return 'poor'
}
