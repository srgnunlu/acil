'use client'

// PWA React Hook
// Phase 12 - PWA Enhancement

import { useEffect, useState, useCallback } from 'react'
import {
  registerServiceWorker,
  skipWaiting,
  checkForUpdates,
  type ServiceWorkerState,
} from '@/lib/pwa/register-sw'
import {
  initInstallPrompt,
  showInstallPrompt,
  isInstallPromptAvailable,
  isPWAInstalled,
  getPWADisplayMode,
  isIOS,
  isAndroid,
} from '@/lib/pwa/install-prompt'

export interface PWAState {
  isSupported: boolean
  isInstalled: boolean
  isInstallable: boolean
  displayMode: 'browser' | 'standalone' | 'fullscreen' | 'minimal-ui'
  platform: 'ios' | 'android' | 'desktop' | 'unknown'
  updateAvailable: boolean
  isRegistering: boolean
}

export function usePWA() {
  const [state, setState] = useState<PWAState>({
    isSupported: false,
    isInstalled: false,
    isInstallable: false,
    displayMode: 'browser',
    platform: 'unknown',
    updateAvailable: false,
    isRegistering: false,
  })

  useEffect(() => {
    // Check if PWA is supported
    const isSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator

    // Determine platform
    let platform: 'ios' | 'android' | 'desktop' | 'unknown' = 'unknown'
    if (isIOS()) {
      platform = 'ios'
    } else if (isAndroid()) {
      platform = 'android'
    } else if (window.matchMedia('(min-width: 1024px)').matches) {
      platform = 'desktop'
    }

    setState((prev) => ({
      ...prev,
      isSupported,
      isInstalled: isPWAInstalled(),
      displayMode: getPWADisplayMode(),
      platform,
    }))

    if (!isSupported) return

    // Register service worker
    setState((prev) => ({ ...prev, isRegistering: true }))

    registerServiceWorker()
      .then(() => {
        setState((prev) => ({ ...prev, isRegistering: false }))
      })
      .catch(() => {
        setState((prev) => ({ ...prev, isRegistering: false }))
      })

    // Initialize install prompt
    initInstallPrompt()

    // Listen for install prompt availability
    const handleInstallAvailable = () => {
      setState((prev) => ({ ...prev, isInstallable: true }))
    }

    // Listen for app installed
    const handleInstalled = () => {
      setState((prev) => ({
        ...prev,
        isInstalled: true,
        isInstallable: false,
        displayMode: getPWADisplayMode(),
      }))
    }

    // Listen for update available
    const handleUpdateAvailable = () => {
      setState((prev) => ({ ...prev, updateAvailable: true }))
    }

    window.addEventListener('pwa-install-available', handleInstallAvailable)
    window.addEventListener('pwa-installed', handleInstalled)
    window.addEventListener('sw-update-available', handleUpdateAvailable)

    // Check if install prompt is already available
    if (isInstallPromptAvailable()) {
      setState((prev) => ({ ...prev, isInstallable: true }))
    }

    return () => {
      window.removeEventListener('pwa-install-available', handleInstallAvailable)
      window.removeEventListener('pwa-installed', handleInstalled)
      window.removeEventListener('sw-update-available', handleUpdateAvailable)
    }
  }, [])

  const install = useCallback(async () => {
    const result = await showInstallPrompt()
    if (result.outcome === 'accepted') {
      setState((prev) => ({
        ...prev,
        isInstalled: true,
        isInstallable: false,
      }))
    }
    return result
  }, [])

  const update = useCallback(async () => {
    await skipWaiting()
    setState((prev) => ({ ...prev, updateAvailable: false }))
  }, [])

  const checkUpdate = useCallback(async () => {
    await checkForUpdates()
  }, [])

  return {
    ...state,
    install,
    update,
    checkUpdate,
  }
}
