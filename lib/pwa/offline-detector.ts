// Offline/Online Detection Utility
// Phase 12 - PWA Enhancement

export type ConnectionStatus = 'online' | 'offline' | 'slow'

export interface ConnectionInfo {
  status: ConnectionStatus
  effectiveType?: string
  downlink?: number
  rtt?: number
  saveData?: boolean
}

export function getConnectionInfo(): ConnectionInfo {
  if (typeof window === 'undefined') {
    return { status: 'online' }
  }

  const isOnline = navigator.onLine
  const connection =
    (navigator as Navigator & { connection?: NetworkInformation }).connection ||
    (navigator as Navigator & { mozConnection?: NetworkInformation }).mozConnection ||
    (navigator as Navigator & { webkitConnection?: NetworkInformation }).webkitConnection

  if (!connection) {
    return {
      status: isOnline ? 'online' : 'offline',
    }
  }

  // Determine if connection is slow
  const isSlow =
    connection.effectiveType === 'slow-2g' ||
    connection.effectiveType === '2g' ||
    (connection.downlink !== undefined && connection.downlink < 0.5) ||
    (connection.rtt !== undefined && connection.rtt > 500)

  return {
    status: isOnline ? (isSlow ? 'slow' : 'online') : 'offline',
    effectiveType: connection.effectiveType,
    downlink: connection.downlink,
    rtt: connection.rtt,
    saveData: connection.saveData,
  }
}

export function isOnline(): boolean {
  return typeof window !== 'undefined' && navigator.onLine
}

export function isOffline(): boolean {
  return typeof window !== 'undefined' && !navigator.onLine
}

export function isSlowConnection(): boolean {
  const info = getConnectionInfo()
  return info.status === 'slow'
}

// Listen for online/offline events
export function addConnectionListener(
  callback: (status: ConnectionStatus, info: ConnectionInfo) => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const handleOnline = () => {
    const info = getConnectionInfo()
    callback(info.status, info)
  }

  const handleOffline = () => {
    callback('offline', getConnectionInfo())
  }

  const handleConnectionChange = () => {
    const info = getConnectionInfo()
    callback(info.status, info)
  }

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  const connection =
    (navigator as Navigator & { connection?: NetworkInformation }).connection ||
    (navigator as Navigator & { mozConnection?: NetworkInformation }).mozConnection ||
    (navigator as Navigator & { webkitConnection?: NetworkInformation }).webkitConnection

  if (connection) {
    connection.addEventListener('change', handleConnectionChange)
  }

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
    if (connection) {
      connection.removeEventListener('change', handleConnectionChange)
    }
  }
}

// Network Information API types
interface NetworkInformation extends EventTarget {
  readonly effectiveType: 'slow-2g' | '2g' | '3g' | '4g'
  readonly downlink: number
  readonly rtt: number
  readonly saveData: boolean
}

declare global {
  interface Navigator {
    connection?: NetworkInformation
    mozConnection?: NetworkInformation
    webkitConnection?: NetworkInformation
  }
}
