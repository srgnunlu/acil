/**
 * PresenceIndicator Component
 *
 * Shows who is viewing a specific patient
 */

'use client'

import { useRealtimeContext } from '@/contexts/RealtimeContext'

export interface PresenceIndicatorProps {
  patientId: string
  className?: string
}

export function PresenceIndicator({ patientId, className = '' }: PresenceIndicatorProps) {
  const { getUsersViewingPatient } = useRealtimeContext()

  const viewers = getUsersViewingPatient(patientId)

  // Don't show if no one is viewing
  if (viewers.length === 0) {
    return null
  }

  // Show first 3 viewers
  const displayViewers = viewers.slice(0, 3)
  const extraCount = viewers.length - 3

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex -space-x-2">
        {displayViewers.map((viewer) => (
          <div
            key={viewer.user_id}
            className="relative inline-block"
            title={viewer.full_name || 'İsimsiz Kullanıcı'}
          >
            {viewer.avatar_url ? (
              <img
                src={viewer.avatar_url}
                alt={viewer.full_name || 'User'}
                className="h-6 w-6 rounded-full border-2 border-white object-cover"
              />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-blue-100 text-xs font-semibold text-blue-700">
                {(viewer.full_name || '?').charAt(0).toUpperCase()}
              </div>
            )}

            {/* Animated pulse */}
            <div className="absolute inset-0 animate-ping rounded-full bg-green-500 opacity-25" />
          </div>
        ))}

        {extraCount > 0 && (
          <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-gray-200 text-xs font-semibold text-gray-700">
            +{extraCount}
          </div>
        )}
      </div>

      <span className="text-xs text-gray-600">
        {viewers.length === 1 ? 'görüntülüyor' : 'görüntülüyor'}
      </span>
    </div>
  )
}
