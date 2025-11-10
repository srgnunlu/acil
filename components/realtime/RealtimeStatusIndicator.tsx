/**
 * RealtimeStatusIndicator Component
 *
 * Shows real-time connection status
 */

'use client'

import type { ConnectionStatus } from '@/types/realtime.types'

export interface RealtimeStatusIndicatorProps {
  status: ConnectionStatus
  className?: string
  showLabel?: boolean
}

const statusConfig: Record<ConnectionStatus, { color: string; label: string; icon: string }> = {
  connected: {
    color: 'bg-green-500',
    label: 'Bağlı',
    icon: '✓'
  },
  connecting: {
    color: 'bg-yellow-500',
    label: 'Bağlanıyor...',
    icon: '⟳'
  },
  disconnected: {
    color: 'bg-gray-400',
    label: 'Bağlantı Yok',
    icon: '✕'
  },
  error: {
    color: 'bg-red-500',
    label: 'Hata',
    icon: '!'
  }
}

export function RealtimeStatusIndicator({
  status,
  className = '',
  showLabel = true
}: RealtimeStatusIndicatorProps) {
  const config = statusConfig[status]

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <div className={`h-2.5 w-2.5 rounded-full ${config.color}`} />
        {status === 'connected' && (
          <div className={`absolute inset-0 animate-ping rounded-full ${config.color} opacity-75`} />
        )}
      </div>

      {showLabel && (
        <span className="text-xs text-gray-600">{config.label}</span>
      )}
    </div>
  )
}
