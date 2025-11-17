'use client'

// PWA Install Prompt Component
// Phase 12 - PWA Enhancement

import { useState, useEffect } from 'react'
import { X, Download, Smartphone, Monitor } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePWA } from '@/lib/hooks/usePWA'
import { getInstallInstructions } from '@/lib/pwa/install-prompt'

export function PWAInstallPrompt() {
  const { isInstallable, isInstalled, platform, install } = usePWA()
  const [showPrompt, setShowPrompt] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if user already dismissed the prompt
    const isDismissed = localStorage.getItem('pwa-install-dismissed') === 'true'
    setDismissed(isDismissed)

    // Show prompt after 10 seconds if installable and not dismissed
    if (isInstallable && !isDismissed && !isInstalled) {
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 10000)

      return () => clearTimeout(timer)
    }
  }, [isInstallable, isInstalled])

  const handleInstall = async () => {
    const result = await install()
    if (result.outcome === 'accepted') {
      setShowPrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setDismissed(true)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  const handleRemindLater = () => {
    setShowPrompt(false)
    // Don't set dismissed, so it can show again later
  }

  if (!isInstallable || isInstalled || dismissed || !showPrompt) {
    return null
  }

  const instructions = getInstallInstructions()
  const Icon = platform === 'desktop' ? Monitor : Smartphone

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 right-4 left-4 md:left-auto md:w-96 z-50"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Icon className="h-5 w-5" />
              <span className="font-semibold">ACIL Uygulamasını Yükle</span>
            </div>
            <button
              onClick={handleDismiss}
              className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
              aria-label="Kapat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              ACIL uygulamasını cihazınıza yükleyerek daha hızlı erişim sağlayabilir ve offline
              çalışabilirsiniz.
            </p>

            {/* Features */}
            <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2 mb-4">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Offline çalışma desteği</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Hızlı başlatma</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Push bildirimleri</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Tam ekran deneyim</span>
              </li>
            </ul>

            {/* Platform specific instructions */}
            {platform === 'ios' && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-4">
                <p className="text-xs text-blue-800 dark:text-blue-300">{instructions.instructions}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-2">
              {platform !== 'ios' && (
                <button
                  onClick={handleInstall}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Yükle
                </button>
              )}
              <button
                onClick={handleRemindLater}
                className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {platform === 'ios' ? 'Tamam' : 'Daha Sonra'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
