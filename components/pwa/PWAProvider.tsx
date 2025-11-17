'use client'

// PWA Context Provider
// Phase 12 - PWA Enhancement

import React, { createContext, useContext, useEffect } from 'react'
import { usePWA, type PWAState } from '@/lib/hooks/usePWA'
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus'
import { PWAInstallPrompt } from './PWAInstallPrompt'
import { OfflineIndicator } from './OfflineIndicator'
import { UpdatePrompt } from './UpdatePrompt'

interface PWAContextValue extends PWAState {
  install: () => Promise<{ outcome: 'accepted' | 'dismissed' | 'not-available'; platform?: string }>
  update: () => Promise<void>
  checkUpdate: () => Promise<void>
  isOnline: boolean
  isOffline: boolean
  isSlow: boolean
}

const PWAContext = createContext<PWAContextValue | null>(null)

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const pwa = usePWA()
  const { isOnline, isOffline, isSlow } = useOnlineStatus()

  const value: PWAContextValue = {
    ...pwa,
    isOnline,
    isOffline,
    isSlow,
  }

  return (
    <PWAContext.Provider value={value}>
      {children}
      <PWAInstallPrompt />
      <OfflineIndicator />
      <UpdatePrompt />
    </PWAContext.Provider>
  )
}

export function usePWAContext() {
  const context = useContext(PWAContext)
  if (!context) {
    throw new Error('usePWAContext must be used within PWAProvider')
  }
  return context
}
