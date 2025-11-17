// Service Worker Registration Utility
// Phase 12 - PWA Enhancement

export interface ServiceWorkerState {
  registration: ServiceWorkerRegistration | null
  isSupported: boolean
  isRegistered: boolean
  isUpdating: boolean
  updateAvailable: boolean
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('[PWA] Service Worker not supported')
    return null
  }

  try {
    console.log('[PWA] Registering Service Worker...')

    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none', // Always check for updates
    })

    console.log('[PWA] Service Worker registered successfully:', registration.scope)

    // Check for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      console.log('[PWA] New Service Worker found, installing...')

      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New update available
            console.log('[PWA] New Service Worker installed, update available')

            // Notify user about update
            const event = new CustomEvent('sw-update-available', { detail: { registration } })
            window.dispatchEvent(event)
          }
        })
      }
    })

    // Check for updates every hour
    setInterval(
      () => {
        registration.update()
      },
      60 * 60 * 1000
    )

    // Also check for updates when page becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        registration.update()
      }
    })

    return registration
  } catch (error) {
    console.error('[PWA] Service Worker registration failed:', error)
    return null
  }
}

export async function unregisterServiceWorker(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration) {
      const result = await registration.unregister()
      console.log('[PWA] Service Worker unregistered:', result)
      return result
    }
    return false
  } catch (error) {
    console.error('[PWA] Service Worker unregistration failed:', error)
    return false
  }
}

export async function skipWaiting(): Promise<void> {
  const registration = await navigator.serviceWorker.getRegistration()

  if (registration && registration.waiting) {
    // Send message to waiting service worker to skip waiting
    registration.waiting.postMessage({ type: 'SKIP_WAITING' })

    // Reload page when new service worker takes control
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload()
    })
  }
}

export async function checkForUpdates(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration) {
      await registration.update()
      return true
    }
    return false
  } catch (error) {
    console.error('[PWA] Failed to check for updates:', error)
    return false
  }
}

// Send message to service worker
export async function sendMessageToSW(message: unknown): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return
  }

  const registration = await navigator.serviceWorker.getRegistration()
  if (registration && registration.active) {
    registration.active.postMessage(message)
  }
}

// Clear all caches
export async function clearAllCaches(): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return
  }

  try {
    const cacheNames = await caches.keys()
    await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)))
    console.log('[PWA] All caches cleared')
  } catch (error) {
    console.error('[PWA] Failed to clear caches:', error)
  }
}
