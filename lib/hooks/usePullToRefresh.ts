'use client'

import { useEffect, useRef, useState } from 'react'

interface PullToRefreshOptions {
  threshold?: number // Distance in pixels to trigger refresh
  onRefresh: () => Promise<void>
  enabled?: boolean
}

export function usePullToRefresh({
  threshold = 80,
  onRefresh,
  enabled = true,
}: PullToRefreshOptions) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const startY = useRef(0)
  const currentY = useRef(0)

  useEffect(() => {
    if (!enabled) return

    let rafId: number

    const handleTouchStart = (e: TouchEvent) => {
      // Only trigger at top of page
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (window.scrollY > 0 || isRefreshing) return

      currentY.current = e.touches[0].clientY
      const distance = currentY.current - startY.current

      if (distance > 0) {
        // Prevent default scroll behavior when pulling down
        e.preventDefault()

        // Update pull distance with resistance effect
        rafId = requestAnimationFrame(() => {
          const resistanceFactor = Math.min(distance / threshold, 1)
          const resistedDistance = distance * (1 - resistanceFactor * 0.5)
          setPullDistance(Math.min(resistedDistance, threshold * 1.5))
        })
      }
    }

    const handleTouchEnd = async () => {
      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true)
        try {
          await onRefresh()
        } finally {
          setIsRefreshing(false)
        }
      }
      setPullDistance(0)
      startY.current = 0
      currentY.current = 0
    }

    // Add event listeners
    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      cancelAnimationFrame(rafId)
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [enabled, threshold, onRefresh, pullDistance, isRefreshing])

  return {
    pullDistance,
    isRefreshing,
    shouldTrigger: pullDistance >= threshold,
  }
}
