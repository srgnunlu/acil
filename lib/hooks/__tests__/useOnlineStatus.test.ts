/**
 * @vitest-environment happy-dom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useOnlineStatus } from '../useOnlineStatus'

describe('useOnlineStatus Hook', () => {
  beforeEach(() => {
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    })

    // Mock navigator.connection
    Object.defineProperty(navigator, 'connection', {
      writable: true,
      configurable: true,
      value: {
        effectiveType: '4g',
        downlink: 10,
        rtt: 50,
        saveData: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should detect online status', () => {
    const { result } = renderHook(() => useOnlineStatus())

    expect(result.current.isOnline).toBe(true)
    expect(result.current.isOffline).toBe(false)
    expect(result.current.status).toBe('online')
  })

  it('should detect offline status', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    })

    const { result } = renderHook(() => useOnlineStatus())

    expect(result.current.isOnline).toBe(false)
    expect(result.current.isOffline).toBe(true)
    expect(result.current.status).toBe('offline')
  })

  it('should handle online event', async () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    })

    const { result } = renderHook(() => useOnlineStatus())

    expect(result.current.isOffline).toBe(true)

    // Simulate going online
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    })

    act(() => {
      window.dispatchEvent(new Event('online'))
    })

    await waitFor(() => {
      expect(result.current.isOnline).toBe(true)
      expect(result.current.status).toBe('online')
    })
  })

  it('should handle offline event', async () => {
    const { result } = renderHook(() => useOnlineStatus())

    expect(result.current.isOnline).toBe(true)

    // Simulate going offline
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    })

    act(() => {
      window.dispatchEvent(new Event('offline'))
    })

    await waitFor(() => {
      expect(result.current.isOffline).toBe(true)
      expect(result.current.status).toBe('offline')
    })
  })

  it('should detect slow connection (2g)', () => {
    Object.defineProperty(navigator, 'connection', {
      writable: true,
      configurable: true,
      value: {
        effectiveType: '2g',
        downlink: 0.5,
        rtt: 500,
        saveData: false,
      },
    })

    const { result } = renderHook(() => useOnlineStatus())

    expect(result.current.isSlow).toBe(true)
    expect(result.current.info.effectiveType).toBe('2g')
  })

  it('should detect slow connection (slow-2g)', () => {
    Object.defineProperty(navigator, 'connection', {
      writable: true,
      configurable: true,
      value: {
        effectiveType: 'slow-2g',
        downlink: 0.2,
        rtt: 1000,
        saveData: true,
      },
    })

    const { result } = renderHook(() => useOnlineStatus())

    expect(result.current.isSlow).toBe(true)
    expect(result.current.info.effectiveType).toBe('slow-2g')
  })

  it('should NOT detect slow connection for 4g', () => {
    const { result } = renderHook(() => useOnlineStatus())

    expect(result.current.isSlow).toBe(false)
    expect(result.current.info.effectiveType).toBe('4g')
  })

  it('should provide connection info', () => {
    const { result } = renderHook(() => useOnlineStatus())

    expect(result.current.info).toEqual({
      effectiveType: '4g',
      downlink: 10,
      rtt: 50,
      saveData: false,
    })
  })

  it('should handle missing connection API gracefully', () => {
    Object.defineProperty(navigator, 'connection', {
      writable: true,
      configurable: true,
      value: undefined,
    })

    const { result } = renderHook(() => useOnlineStatus())

    expect(result.current.isOnline).toBe(true) // Still works
    expect(result.current.isSlow).toBe(false) // Defaults to false
    expect(result.current.info).toEqual({
      effectiveType: 'unknown',
      downlink: undefined,
      rtt: undefined,
      saveData: false,
    })
  })

  it('should cleanup event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

    const { unmount } = renderHook(() => useOnlineStatus())

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function))
    expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function))
  })
})
