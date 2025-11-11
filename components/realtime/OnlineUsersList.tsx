/**
 * OnlineUsersList Component
 *
 * Displays list of online users in workspace with presence info
 */

'use client'

import { useMemo } from 'react'
import { useRealtimeContext } from '@/contexts/RealtimeContext'
import type { PresenceStatus } from '@/types/realtime.types'
import { Users } from 'lucide-react'

export interface OnlineUsersListProps {
  className?: string
}

const statusColors: Record<PresenceStatus, string> = {
  online: 'bg-green-500',
  away: 'bg-yellow-500',
  busy: 'bg-red-500',
  offline: 'bg-gray-400',
}

const statusLabels: Record<PresenceStatus, string> = {
  online: 'Çevrimiçi',
  away: 'Uzakta',
  busy: 'Meşgul',
  offline: 'Çevrimdışı',
}

export function OnlineUsersList({ className = '' }: OnlineUsersListProps) {
  const { onlineUsers, status } = useRealtimeContext()

  // Group by status
  const groupedUsers = useMemo(() => {
    const groups: Record<PresenceStatus, typeof onlineUsers> = {
      online: [],
      away: [],
      busy: [],
      offline: [],
    }

    onlineUsers.forEach((user) => {
      groups[user.status].push(user)
    })

    return groups
  }, [onlineUsers])

  if (status === 'connecting') {
    return (
      <div className={`rounded-lg border border-gray-200 bg-white ${className}`}>
        <div className="p-3 border-b border-gray-100">
          <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
            Çevrimiçi Kullanıcılar
          </h3>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className={`rounded-lg border border-red-200 bg-red-50 ${className}`}>
        <div className="p-3 border-b border-red-200">
          <h3 className="text-xs font-semibold text-red-700 uppercase tracking-wide">
            Bağlantı Hatası
          </h3>
        </div>
        <div className="p-3">
          <p className="text-xs text-red-600">Kullanıcı listesi yüklenemiyor.</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white ${className}`}
      onClick={(e) => {
        e.stopPropagation()
      }}
      onMouseDown={(e) => {
        e.stopPropagation()
      }}
    >
      <div className="p-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
            Çevrimiçi Kullanıcılar
          </h3>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 rounded-full">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-semibold text-green-700">{onlineUsers.length}</span>
          </div>
        </div>
      </div>

      <div className="p-2">
        {onlineUsers.length === 0 ? (
          <div className="py-8 text-center">
            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gray-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 font-medium">Şu anda çevrimiçi kimse yok</p>
          </div>
        ) : (
          <div className="space-y-1">
            {groupedUsers.online.length > 0 && (
              <>
                {groupedUsers.online.map((user) => (
                  <UserItem key={user.user_id} user={user} />
                ))}
              </>
            )}

            {groupedUsers.away.length > 0 && (
              <>
                <div className="pt-2 mt-2 border-t border-gray-100">
                  <h4 className="mb-1.5 px-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                    Uzakta
                  </h4>
                </div>
                {groupedUsers.away.map((user) => (
                  <UserItem key={user.user_id} user={user} />
                ))}
              </>
            )}

            {groupedUsers.busy.length > 0 && (
              <>
                <div className="pt-2 mt-2 border-t border-gray-100">
                  <h4 className="mb-1.5 px-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                    Meşgul
                  </h4>
                </div>
                {groupedUsers.busy.map((user) => (
                  <UserItem key={user.user_id} user={user} />
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

interface UserItemProps {
  user: {
    user_id: string
    full_name?: string
    avatar_url?: string
    title?: string
    status: PresenceStatus
    viewing_patient_id?: string | null
  }
}

function UserItem({ user }: UserItemProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg p-2 hover:bg-gray-50 transition-colors group">
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={user.full_name || 'User'}
            className="h-8 w-8 rounded-full object-cover ring-2 ring-white"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-xs font-semibold text-white ring-2 ring-white">
            {(user.full_name || '?').charAt(0).toUpperCase()}
          </div>
        )}

        {/* Status indicator */}
        <div
          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${statusColors[user.status]} shadow-sm`}
          title={statusLabels[user.status]}
        />
      </div>

      {/* User info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-xs font-semibold text-gray-900">
            {user.full_name || 'İsimsiz Kullanıcı'}
          </p>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {user.title && <span className="text-[10px] text-gray-500 truncate">{user.title}</span>}
          {user.viewing_patient_id && (
            <>
              {user.title && <span className="text-gray-300">•</span>}
              <span className="text-[10px] text-blue-600 font-medium flex items-center gap-0.5">
                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path
                    fillRule="evenodd"
                    d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Hasta görüntülüyor
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
