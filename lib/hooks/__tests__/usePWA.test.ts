/**
 * @vitest-environment happy-dom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { usePWA } from '../usePWA'

// Mock the PWA utilities
vi.mock('@/lib/pwa/register-sw', () => ({
  registerServiceWorker: vi.fn(() => Promise.resolve()),
  skipWaiting: vi.fn(() => Promise.resolve()),
  checkForUpdates: vi.fn(() => Promise.resolve()),
}))

vi.mock('@/lib/pwa/install-prompt', () => ({
  initInstallPrompt: vi.fn(),
  showInstallPrompt: vi.fn(() => Promise.resolve({ outcome: 'accepted', platform: 'android' })),
  isInstallPromptAvailable: vi.fn(() => false),
  isPWAInstalled: vi.fn(() => false),
  getPWADisplayMode: vi.fn(() => 'browser'),
  isIOS: vi.fn(() => false),
  isAndroid: vi.fn(() => true),
}))

describe('usePWA Hook', () => {
  beforeEach(() => {
    // Reset window properties
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query === '(min-width: 1024px)' ? false : true,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })

    // Mock navigator.serviceWorker
    Object.defineProperty(navigator, 'serviceWorker', {
      writable: true,
      value: {
        register: vi.fn(() => Promise.resolve({})),
        ready: Promise.resolve({}),
      },
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => usePWA())

    expect(result.current.isSupported).toBe(true) // Service worker is available
    expect(result.current.isInstalled).toBe(false)
    expect(result.current.isInstallable).toBe(false)
    expect(result.current.displayMode).toBe('browser')
    expect(result.current.platform).toBe('android')
    expect(result.current.updateAvailable).toBe(false)
  })

  it('should detect when PWA is not supported', () => {
    // Remove service worker support
    const originalSW = navigator.serviceWorker
    Object.defineProperty(navigator, 'serviceWorker', {
      writable: true,
      value: undefined,
    })

    const { result } = renderHook(() => usePWA())

    expect(result.current.isSupported).toBe(false)

    // Restore
    Object.defineProperty(navigator, 'serviceWorker', {
      writable: true,
      value: originalSW,
    })
  })

  it('should handle install prompt acceptance', async () => {
    const { result } = renderHook(() => usePWA())

    const installResult = await result.current.install()

    expect(installResult.outcome).toBe('accepted')
    expect(installResult.platform).toBe('android')
  })

  it('should handle update available event', async () => {
    const { result } = renderHook(() => usePWA())

    // Simulate update available event
    const event = new CustomEvent('sw-update-available')
    window.dispatchEvent(event)

    await waitFor(() => {
      expect(result.current.updateAvailable).toBe(true)
    })
  })

  it('should handle install available event', async () => {
    const { result } = renderHook(() => usePWA())

    // Simulate install available event
    const event = new CustomEvent('pwa-install-available')
    window.dispatchEvent(event)

    await waitFor(() => {
      expect(result.current.isInstallable).toBe(true)
    })
  })

  it('should determine correct platform - iOS', () => {
    const { isIOS } = require('@/lib/pwa/install-prompt')
    isIOS.mockReturnValue(true)

    const { result } = renderHook(() => usePWA())

    expect(result.current.platform).toBe('ios')
  })

  it('should determine correct platform - desktop', () => {
    const { isIOS, isAndroid } = require('@/lib/pwa/install-prompt')
    isIOS.mockReturnValue(false)
    isAndroid.mockReturnValue(false)

    // Mock desktop size
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query === '(min-width: 1024px)' ? true : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })

    const { result } = renderHook(() => usePWA())

    expect(result.current.platform).toBe('desktop')
  })

  it('should call skipWaiting when update is applied', async () => {
    const { skipWaiting } = require('@/lib/pwa/register-sw')
    const { result } = renderHook(() => usePWA())

    await result.current.update()

    expect(skipWaiting).toHaveBeenCalled()
  })

  it('should call checkForUpdates when check is requested', async () => {
    const { checkForUpdates } = require('@/lib/pwa/register-sw')
    const { result } = renderHook(() => usePWA())

    await result.current.checkUpdate()

    expect(checkForUpdates).toHaveBeenCalled()
  })
})
