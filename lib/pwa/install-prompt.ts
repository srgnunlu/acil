// PWA Install Prompt Utility
// Phase 12 - PWA Enhancement

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null

export function initInstallPrompt(): void {
  if (typeof window === 'undefined') {
    return
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault()

    // Stash the event so it can be triggered later
    deferredPrompt = e as BeforeInstallPromptEvent

    console.log('[PWA] Install prompt ready')

    // Dispatch custom event to notify app
    const event = new CustomEvent('pwa-install-available')
    window.dispatchEvent(event)
  })

  // Listen for app installed event
  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed successfully')
    deferredPrompt = null

    // Dispatch custom event
    const event = new CustomEvent('pwa-installed')
    window.dispatchEvent(event)
  })
}

export async function showInstallPrompt(): Promise<{
  outcome: 'accepted' | 'dismissed' | 'not-available'
  platform?: string
}> {
  if (!deferredPrompt) {
    console.log('[PWA] Install prompt not available')
    return { outcome: 'not-available' }
  }

  try {
    // Show the install prompt
    await deferredPrompt.prompt()

    // Wait for the user to respond to the prompt
    const { outcome, platform } = await deferredPrompt.userChoice

    console.log('[PWA] Install prompt outcome:', outcome)

    // Clear the deferred prompt
    deferredPrompt = null

    return { outcome, platform }
  } catch (error) {
    console.error('[PWA] Failed to show install prompt:', error)
    return { outcome: 'not-available' }
  }
}

export function isInstallPromptAvailable(): boolean {
  return deferredPrompt !== null
}

export function isPWAInstalled(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false
  }

  // Check if running in standalone mode
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && (navigator as Navigator & { standalone?: boolean }).standalone) ||
    document.referrer.includes('android-app://')

  return isStandalone
}

export function getPWADisplayMode(): 'browser' | 'standalone' | 'fullscreen' | 'minimal-ui' {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return 'browser'
  }

  if (window.matchMedia('(display-mode: fullscreen)').matches) {
    return 'fullscreen'
  }

  if (window.matchMedia('(display-mode: standalone)').matches) {
    return 'standalone'
  }

  if (window.matchMedia('(display-mode: minimal-ui)').matches) {
    return 'minimal-ui'
  }

  return 'browser'
}

// Check if device is iOS
export function isIOS(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false
  }

  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as Window & { MSStream?: unknown }).MSStream
  )
}

// Check if device is Android
export function isAndroid(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false
  }

  return /Android/.test(navigator.userAgent)
}

// Get install instructions based on platform
export function getInstallInstructions(): {
  platform: 'ios' | 'android' | 'desktop' | 'unknown'
  instructions: string
} {
  if (isIOS()) {
    return {
      platform: 'ios',
      instructions:
        'Safari menüsünden "Ana Ekrana Ekle" seçeneğini kullanarak uygulamayı yükleyebilirsiniz.',
    }
  }

  if (isAndroid()) {
    return {
      platform: 'android',
      instructions: 'Tarayıcı menüsünden "Ana ekrana ekle" seçeneğini kullanabilirsiniz.',
    }
  }

  if (typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches) {
    return {
      platform: 'desktop',
      instructions: 'Adres çubuğundaki yükleme simgesine tıklayarak uygulamayı yükleyebilirsiniz.',
    }
  }

  return {
    platform: 'unknown',
    instructions: 'Tarayıcınızın menüsünden ana ekrana ekleme seçeneğini kullanabilirsiniz.',
  }
}

declare global {
  interface Navigator {
    standalone?: boolean
  }

  interface Window {
    MSStream?: unknown
  }
}
