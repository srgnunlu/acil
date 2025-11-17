'use client'

// Browser Support Guide Component
// Phase 12 - PWA Enhancement - Browser Compatibility

import { useState } from 'react'
import { AlertTriangle, Chrome, Globe, X, ExternalLink } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface BrowserInfo {
  name: string
  version: string
  isSupported: boolean
  features: {
    serviceWorker: boolean
    pushNotifications: boolean
    webRTC: boolean
    speechRecognition: boolean
  }
}

function detectBrowser(): BrowserInfo {
  // Return default values if running on server
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      name: 'Unknown',
      version: 'Unknown',
      isSupported: true,
      features: {
        serviceWorker: false,
        pushNotifications: false,
        webRTC: false,
        speechRecognition: false,
      },
    }
  }

  const ua = navigator.userAgent
  const isChrome = /Chrome/.test(ua) && /Google Inc/.test(navigator.vendor)
  const isSafari = /Safari/.test(ua) && /Apple Computer/.test(navigator.vendor)
  const isFirefox = /Firefox/.test(ua)
  const isEdge = /Edg/.test(ua)

  const features = {
    serviceWorker: 'serviceWorker' in navigator,
    pushNotifications: 'Notification' in window && 'PushManager' in window,
    webRTC: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
    speechRecognition: 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window,
  }

  let name = 'Unknown'
  let version = 'Unknown'
  let isSupported = true

  if (isChrome || isEdge) {
    name = isEdge ? 'Edge' : 'Chrome'
    const match = ua.match(/(Chrome|Edg)\/(\d+)/)
    version = match ? match[2] : 'Unknown'
    isSupported = parseInt(version) >= 88 // Chrome 88+ recommended
  } else if (isSafari) {
    name = 'Safari'
    const match = ua.match(/Version\/(\d+)/)
    version = match ? match[1] : 'Unknown'
    isSupported = parseInt(version) >= 14 // Safari 14+ recommended
  } else if (isFirefox) {
    name = 'Firefox'
    const match = ua.match(/Firefox\/(\d+)/)
    version = match ? match[1] : 'Unknown'
    isSupported = parseInt(version) >= 85 // Firefox 85+ recommended
  } else {
    isSupported = false
  }

  return { name, version, isSupported, features }
}

export function BrowserSupportGuide() {
  const [browserInfo] = useState(detectBrowser())
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('browser-support-dismissed') === 'true'
    }
    return false
  })

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem('browser-support-dismissed', 'true')
  }

  // Only show if browser is not fully supported or missing features
  const missingFeatures = Object.entries(browserInfo.features).filter(
    ([, supported]) => !supported
  )

  if (
    dismissed ||
    (browserInfo.isSupported && missingFeatures.length === 0)
  ) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-16 left-4 right-4 md:left-auto md:right-4 md:w-96 z-40"
        role="alert"
        aria-live="polite"
        aria-labelledby="browser-support-title"
      >
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg shadow-lg p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" aria-hidden="true" />
              <h3 id="browser-support-title" className="font-semibold text-amber-900 dark:text-amber-100">
                Tarayıcı Uyarısı
              </h3>
            </div>
            <button
              onClick={handleDismiss}
              className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200 p-1 rounded transition-colors"
              aria-label="Tarayıcı uyarısını kapat"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-3">
            {!browserInfo.isSupported && (
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>{browserInfo.name}</strong> tarayıcınız eski bir sürümde.
                En iyi deneyim için tarayıcınızı güncelleyin.
              </p>
            )}

            {missingFeatures.length > 0 && (
              <div>
                <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
                  Bazı özellikler tarayıcınızda desteklenmiyor:
                </p>
                <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1 ml-4 list-disc">
                  {!browserInfo.features.serviceWorker && (
                    <li>Offline çalışma desteği (Service Worker)</li>
                  )}
                  {!browserInfo.features.pushNotifications && (
                    <li>Push bildirimleri</li>
                  )}
                  {!browserInfo.features.webRTC && (
                    <li>Kamera erişimi (WebRTC)</li>
                  )}
                  {!browserInfo.features.speechRecognition && (
                    <li>Ses tanıma</li>
                  )}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            <div className="pt-3 border-t border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-800 dark:text-amber-200 mb-2 font-medium">
                Önerilen Tarayıcılar:
              </p>
              <div className="flex gap-2">
                <a
                  href="https://www.google.com/chrome/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-700 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors text-xs"
                  aria-label="Chrome tarayıcısını indir (yeni sekmede açılır)"
                >
                  <Chrome className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
                  <span>Chrome</span>
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
                <a
                  href="https://www.apple.com/safari/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-700 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors text-xs"
                  aria-label="Safari tarayıcısını indir (yeni sekmede açılır)"
                >
                  <Globe className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
                  <span>Safari</span>
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
