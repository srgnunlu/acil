/**
 * @vitest-environment happy-dom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSwipeGesture } from '../useSwipeGesture'
import { act } from 'react'

// Helper to create touch events
function createTouchEvent(type: string, touches: { clientX: number; clientY: number }[]) {
  const touchList = touches.map(
    (touch) =>
      ({
        clientX: touch.clientX,
        clientY: touch.clientY,
        identifier: 0,
        pageX: touch.clientX,
        pageY: touch.clientY,
        screenX: touch.clientX,
        screenY: touch.clientY,
        target: document.createElement('div'),
      }) as Touch
  )

  return new TouchEvent(type, {
    bubbles: true,
    cancelable: true,
    touches: touchList as unknown as TouchList,
    targetTouches: touchList as unknown as TouchList,
    changedTouches: touchList as unknown as TouchList,
  })
}

describe('useSwipeGesture Hook', () => {
  let element: HTMLDivElement

  beforeEach(() => {
    element = document.createElement('div')
    document.body.appendChild(element)
  })

  afterEach(() => {
    document.body.removeChild(element)
    vi.clearAllMocks()
  })

  it('should initialize and attach ref to element', () => {
    const { result } = renderHook(() => useSwipeGesture({}))

    expect(result.current.ref).toBeDefined()
    expect(result.current.ref.current).toBeNull() // Not attached yet
  })

  it('should detect swipe left', () => {
    const onSwipeLeft = vi.fn()
    const { result } = renderHook(() => useSwipeGesture({ onSwipeLeft }))

    // Attach ref to element
    if (result.current.ref.current !== element) {
      Object.defineProperty(result.current.ref, 'current', {
        value: element,
        writable: true,
      })
    }

    // Simulate swipe left (start right, move left)
    act(() => {
      element.dispatchEvent(createTouchEvent('touchstart', [{ clientX: 200, clientY: 100 }]))
    })

    act(() => {
      element.dispatchEvent(createTouchEvent('touchmove', [{ clientX: 50, clientY: 100 }]))
    })

    act(() => {
      element.dispatchEvent(createTouchEvent('touchend', []))
    })

    expect(onSwipeLeft).toHaveBeenCalled()
  })

  it('should detect swipe right', () => {
    const onSwipeRight = vi.fn()
    const { result } = renderHook(() => useSwipeGesture({ onSwipeRight }))

    Object.defineProperty(result.current.ref, 'current', {
      value: element,
      writable: true,
    })

    // Simulate swipe right (start left, move right)
    act(() => {
      element.dispatchEvent(createTouchEvent('touchstart', [{ clientX: 50, clientY: 100 }]))
    })

    act(() => {
      element.dispatchEvent(createTouchEvent('touchmove', [{ clientX: 200, clientY: 100 }]))
    })

    act(() => {
      element.dispatchEvent(createTouchEvent('touchend', []))
    })

    expect(onSwipeRight).toHaveBeenCalled()
  })

  it('should detect swipe up', () => {
    const onSwipeUp = vi.fn()
    const { result } = renderHook(() => useSwipeGesture({ onSwipeUp }))

    Object.defineProperty(result.current.ref, 'current', {
      value: element,
      writable: true,
    })

    // Simulate swipe up (start bottom, move top)
    act(() => {
      element.dispatchEvent(createTouchEvent('touchstart', [{ clientX: 100, clientY: 200 }]))
    })

    act(() => {
      element.dispatchEvent(createTouchEvent('touchmove', [{ clientX: 100, clientY: 50 }]))
    })

    act(() => {
      element.dispatchEvent(createTouchEvent('touchend', []))
    })

    expect(onSwipeUp).toHaveBeenCalled()
  })

  it('should detect swipe down', () => {
    const onSwipeDown = vi.fn()
    const { result } = renderHook(() => useSwipeGesture({ onSwipeDown }))

    Object.defineProperty(result.current.ref, 'current', {
      value: element,
      writable: true,
    })

    // Simulate swipe down (start top, move bottom)
    act(() => {
      element.dispatchEvent(createTouchEvent('touchstart', [{ clientX: 100, clientY: 50 }]))
    })

    act(() => {
      element.dispatchEvent(createTouchEvent('touchmove', [{ clientX: 100, clientY: 200 }]))
    })

    act(() => {
      element.dispatchEvent(createTouchEvent('touchend', []))
    })

    expect(onSwipeDown).toHaveBeenCalled()
  })

  it('should respect threshold configuration', () => {
    const onSwipeLeft = vi.fn()
    const { result } = renderHook(() =>
      useSwipeGesture({
        onSwipeLeft,
        threshold: 200, // Very high threshold
      })
    )

    Object.defineProperty(result.current.ref, 'current', {
      value: element,
      writable: true,
    })

    // Swipe less than threshold
    act(() => {
      element.dispatchEvent(createTouchEvent('touchstart', [{ clientX: 150, clientY: 100 }]))
    })

    act(() => {
      element.dispatchEvent(createTouchEvent('touchmove', [{ clientX: 50, clientY: 100 }]))
    })

    act(() => {
      element.dispatchEvent(createTouchEvent('touchend', []))
    })

    // Should not trigger because 100px < 200px threshold
    expect(onSwipeLeft).not.toHaveBeenCalled()
  })

  it('should detect long press', () => {
    vi.useFakeTimers()
    const onLongPress = vi.fn()
    const { result } = renderHook(() => useSwipeGesture({ onLongPress }))

    Object.defineProperty(result.current.ref, 'current', {
      value: element,
      writable: true,
    })

    act(() => {
      element.dispatchEvent(createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]))
    })

    // Advance time to trigger long press (default 500ms)
    act(() => {
      vi.advanceTimersByTime(600)
    })

    expect(onLongPress).toHaveBeenCalled()

    vi.useRealTimers()
  })

  it('should cancel long press on move', () => {
    vi.useFakeTimers()
    const onLongPress = vi.fn()
    const { result } = renderHook(() => useSwipeGesture({ onLongPress }))

    Object.defineProperty(result.current.ref, 'current', {
      value: element,
      writable: true,
    })

    act(() => {
      element.dispatchEvent(createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]))
    })

    // Move before long press timer
    act(() => {
      vi.advanceTimersByTime(200)
      element.dispatchEvent(createTouchEvent('touchmove', [{ clientX: 150, clientY: 100 }]))
    })

    // Complete the timer
    act(() => {
      vi.advanceTimersByTime(500)
    })

    // Long press should not trigger
    expect(onLongPress).not.toHaveBeenCalled()

    vi.useRealTimers()
  })

  it('should handle multiple touch points gracefully', () => {
    const onSwipeLeft = vi.fn()
    const { result } = renderHook(() => useSwipeGesture({ onSwipeLeft }))

    Object.defineProperty(result.current.ref, 'current', {
      value: element,
      writable: true,
    })

    // Start with two fingers
    act(() => {
      element.dispatchEvent(
        createTouchEvent('touchstart', [
          { clientX: 200, clientY: 100 },
          { clientX: 210, clientY: 110 },
        ])
      )
    })

    act(() => {
      element.dispatchEvent(
        createTouchEvent('touchmove', [
          { clientX: 50, clientY: 100 },
          { clientX: 60, clientY: 110 },
        ])
      )
    })

    act(() => {
      element.dispatchEvent(createTouchEvent('touchend', []))
    })

    // Should use first touch point
    expect(onSwipeLeft).toHaveBeenCalled()
  })

  it('should call onTouchStart callback', () => {
    const onTouchStart = vi.fn()
    const { result } = renderHook(() => useSwipeGesture({ onTouchStart }))

    Object.defineProperty(result.current.ref, 'current', {
      value: element,
      writable: true,
    })

    act(() => {
      element.dispatchEvent(createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]))
    })

    expect(onTouchStart).toHaveBeenCalled()
  })

  it('should call onTouchEnd callback', () => {
    const onTouchEnd = vi.fn()
    const { result } = renderHook(() => useSwipeGesture({ onTouchEnd }))

    Object.defineProperty(result.current.ref, 'current', {
      value: element,
      writable: true,
    })

    act(() => {
      element.dispatchEvent(createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]))
    })

    act(() => {
      element.dispatchEvent(createTouchEvent('touchend', []))
    })

    expect(onTouchEnd).toHaveBeenCalled()
  })

  it('should cleanup event listeners on unmount', () => {
    const { result, unmount } = renderHook(() => useSwipeGesture({}))

    Object.defineProperty(result.current.ref, 'current', {
      value: element,
      writable: true,
    })

    const removeEventListenerSpy = vi.spyOn(element, 'removeEventListener')

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function))
    expect(removeEventListenerSpy).toHaveBeenCalledWith('touchmove', expect.any(Function))
    expect(removeEventListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function))
  })

  it('should not trigger swipe if movement is too small', () => {
    const onSwipeLeft = vi.fn()
    const { result } = renderHook(() => useSwipeGesture({ onSwipeLeft }))

    Object.defineProperty(result.current.ref, 'current', {
      value: element,
      writable: true,
    })

    // Very small movement (less than default threshold of 50px)
    act(() => {
      element.dispatchEvent(createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]))
    })

    act(() => {
      element.dispatchEvent(createTouchEvent('touchmove', [{ clientX: 80, clientY: 100 }]))
    })

    act(() => {
      element.dispatchEvent(createTouchEvent('touchend', []))
    })

    expect(onSwipeLeft).not.toHaveBeenCalled()
  })
})
