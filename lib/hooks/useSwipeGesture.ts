'use client'

// Touch Gesture Hook - Swipe Detection
// Phase 12 - PWA Enhancement

import { useEffect, useRef, useState } from 'react'

export type SwipeDirection = 'left' | 'right' | 'up' | 'down'

export interface SwipeOptions {
  minSwipeDistance?: number
  maxSwipeTime?: number
  onSwipe?: (direction: SwipeDirection) => void
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
}

interface TouchPosition {
  x: number
  y: number
  time: number
}

export function useSwipeGesture<T extends HTMLElement>(options: SwipeOptions = {}) {
  const {
    minSwipeDistance = 50,
    maxSwipeTime = 300,
    onSwipe,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
  } = options

  const ref = useRef<T>(null)
  const touchStart = useRef<TouchPosition | null>(null)
  const [isSwiping, setIsSwiping] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      touchStart.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      }
      setIsSwiping(false)
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStart.current) return

      const touch = e.touches[0]
      const deltaX = Math.abs(touch.clientX - touchStart.current.x)
      const deltaY = Math.abs(touch.clientY - touchStart.current.y)

      // If moved more than 10px, consider it a swipe
      if (deltaX > 10 || deltaY > 10) {
        setIsSwiping(true)
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStart.current) return

      const touch = e.changedTouches[0]
      const deltaX = touch.clientX - touchStart.current.x
      const deltaY = touch.clientY - touchStart.current.y
      const deltaTime = Date.now() - touchStart.current.time

      // Reset
      touchStart.current = null
      setIsSwiping(false)

      // Check if it was a valid swipe
      const absX = Math.abs(deltaX)
      const absY = Math.abs(deltaY)

      if (
        (absX >= minSwipeDistance || absY >= minSwipeDistance) &&
        deltaTime <= maxSwipeTime
      ) {
        // Determine direction (prioritize the axis with more movement)
        let direction: SwipeDirection

        if (absX > absY) {
          // Horizontal swipe
          direction = deltaX > 0 ? 'right' : 'left'
        } else {
          // Vertical swipe
          direction = deltaY > 0 ? 'down' : 'up'
        }

        // Call callbacks
        onSwipe?.(direction)

        switch (direction) {
          case 'left':
            onSwipeLeft?.()
            break
          case 'right':
            onSwipeRight?.()
            break
          case 'up':
            onSwipeUp?.()
            break
          case 'down':
            onSwipeDown?.()
            break
        }
      }
    }

    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: true })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [minSwipeDistance, maxSwipeTime, onSwipe, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown])

  return { ref, isSwiping }
}

// Hook for long press detection
export function useLongPress<T extends HTMLElement>(
  onLongPress: () => void,
  options: { delay?: number } = {}
) {
  const { delay = 500 } = options
  const ref = useRef<T>(null)
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const [isPressed, setIsPressed] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const handleStart = () => {
      setIsPressed(true)
      timerRef.current = setTimeout(() => {
        onLongPress()
        setIsPressed(false)
      }, delay)
    }

    const handleEnd = () => {
      setIsPressed(false)
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }

    element.addEventListener('touchstart', handleStart, { passive: true })
    element.addEventListener('touchend', handleEnd, { passive: true })
    element.addEventListener('touchcancel', handleEnd, { passive: true })
    element.addEventListener('mousedown', handleStart)
    element.addEventListener('mouseup', handleEnd)
    element.addEventListener('mouseleave', handleEnd)

    return () => {
      element.removeEventListener('touchstart', handleStart)
      element.removeEventListener('touchend', handleEnd)
      element.removeEventListener('touchcancel', handleEnd)
      element.removeEventListener('mousedown', handleStart)
      element.removeEventListener('mouseup', handleEnd)
      element.removeEventListener('mouseleave', handleEnd)

      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [onLongPress, delay])

  return { ref, isPressed }
}
