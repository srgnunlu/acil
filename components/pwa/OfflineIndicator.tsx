'use client'

// Offline Indicator Component
// Phase 12 - PWA Enhancement

import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus'
import { WifiOff, Wifi, WifiLow } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function OfflineIndicator() {
  const { isOnline, isOffline, isSlow, info } = useOnlineStatus()

  if (isOnline && !isSlow) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        <div
          className={`${
            isOffline
              ? 'bg-red-500'
              : isSlow
                ? 'bg-yellow-500'
                : 'bg-blue-500'
          } text-white px-4 py-2 shadow-lg`}
        >
          <div className="container mx-auto flex items-center justify-center gap-2">
            {isOffline ? (
              <>
                <WifiOff className="h-4 w-4" />
                <span className="text-sm font-medium">
                  İnternet bağlantısı yok - Offline moddasınız
                </span>
              </>
            ) : isSlow ? (
              <>
                <WifiLow className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Yavaş bağlantı tespit edildi
                  {info.effectiveType && ` (${info.effectiveType})`}
                </span>
              </>
            ) : (
              <>
                <Wifi className="h-4 w-4" />
                <span className="text-sm font-medium">Bağlantı yeniden sağlandı</span>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
