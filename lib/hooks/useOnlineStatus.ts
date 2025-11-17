'use client'

// Online/Offline Status Hook
// Phase 12 - PWA Enhancement

import { useEffect, useState, useCallback } from 'react'
import {
  getConnectionInfo,
  isOnline,
  isOffline,
  addConnectionListener,
  type ConnectionStatus,
  type ConnectionInfo,
} from '@/lib/pwa/offline-detector'

export function useOnlineStatus() {
  const [status, setStatus] = useState<ConnectionStatus>('online')
  const [info, setInfo] = useState<ConnectionInfo>({ status: 'online' })

  useEffect(() => {
    // Set initial status
    const initialInfo = getConnectionInfo()
    setStatus(initialInfo.status)
    setInfo(initialInfo)

    // Listen for changes
    const cleanup = addConnectionListener((newStatus, newInfo) => {
      setStatus(newStatus)
      setInfo(newInfo)
    })

    return cleanup
  }, [])

  const refresh = useCallback(() => {
    const currentInfo = getConnectionInfo()
    setStatus(currentInfo.status)
    setInfo(currentInfo)
  }, [])

  return {
    status,
    info,
    isOnline: status === 'online',
    isOffline: status === 'offline',
    isSlow: status === 'slow',
    refresh,
  }
}

export function useIsOnline(): boolean {
  const [online, setOnline] = useState(true)

  useEffect(() => {
    setOnline(isOnline())

    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return online
}

export function useIsOffline(): boolean {
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    setOffline(isOffline())

    const handleOnline = () => setOffline(false)
    const handleOffline = () => setOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return offline
}
