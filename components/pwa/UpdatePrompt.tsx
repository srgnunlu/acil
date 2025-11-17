'use client'

// PWA Update Prompt Component
// Phase 12 - PWA Enhancement

import { RefreshCw, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePWA } from '@/lib/hooks/usePWA'
import { useState } from 'react'

export function UpdatePrompt() {
  const { updateAvailable, update } = usePWA()
  const [dismissed, setDismissed] = useState(false)

  const handleUpdate = async () => {
    await update()
    // Page will reload automatically
  }

  const handleDismiss = () => {
    setDismissed(true)
  }

  if (!updateAvailable || dismissed) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-4 right-4 left-4 md:left-auto md:w-96 z-50"
        role="alert"
        aria-live="assertive"
        aria-labelledby="update-prompt-title"
        aria-describedby="update-prompt-description"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-teal-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <RefreshCw className="h-5 w-5" aria-hidden="true" />
              <span id="update-prompt-title" className="font-semibold">Güncelleme Mevcut</span>
            </div>
            <button
              onClick={handleDismiss}
              className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
              aria-label="Güncelleme bildirimini kapat"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            <p id="update-prompt-description" className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              ACIL uygulamasının yeni bir sürümü mevcut. Güncellemek için sayfayı yenileyin.
            </p>

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleUpdate}
                className="flex-1 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                aria-label="Güncellemeyi uygula ve sayfayı yenile"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Güncelle ve Yenile
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                aria-label="Güncellemeyi daha sonra yap"
              >
                Daha Sonra
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
