/**
 * OnlineUsersList Component
 *
 * Displays list of online users in workspace with presence info
 */

'use client'

import { useMemo } from 'react'
import { useRealtimePresence } from '@/lib/hooks/useRealtimePresence'
import type { PresenceStatus } from '@/types/realtime.types'

export interface OnlineUsersListProps {
  workspaceId: string
  userId: string
  className?: string
}

const statusColors: Record<PresenceStatus, string> = {
  online: 'bg-green-500',
  away: 'bg-yellow-500',
  busy: 'bg-red-500',
  offline: 'bg-gray-400'
}

const statusLabels: Record<PresenceStatus, string> = {
  online: 'Çevrimiçi',
  away: 'Uzakta',
  busy: 'Meşgul',
  offline: 'Çevrimdışı'
}

export function OnlineUsersList({ workspaceId, userId, className = '' }: OnlineUsersListProps) {
  const { onlineUsers, status } = useRealtimePresence({
    workspaceId,
    userId,
    enabled: true
  })

  // Group by status
  const groupedUsers = useMemo(() => {
    const groups: Record<PresenceStatus, typeof onlineUsers> = {
      online: [],
      away: [],
      busy: [],
      offline: []
    }

    onlineUsers.forEach((user) => {
      groups[user.status].push(user)
    })

    return groups
  }, [onlineUsers])

  if (status === 'connecting') {
    return (
      <div className={`rounded-lg border border-gray-200 bg-white p-4 ${className}`}>
        <h3 className="mb-3 text-sm font-semibold text-gray-700">Çevrimiçi Kullanıcılar</h3>
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className={`rounded-lg border border-red-200 bg-red-50 p-4 ${className}`}>
        <h3 className="mb-2 text-sm font-semibold text-red-700">Bağlantı Hatası</h3>
        <p className="text-xs text-red-600">Kullanıcı listesi yüklenemiyor.</p>
      </div>
    )
  }

  return (
    <div className={`rounded-lg border border-gray-200 bg-white p-4 ${className}`}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Çevrimiçi Kullanıcılar</h3>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-xs text-gray-500">{onlineUsers.length}</span>
        </div>
      </div>

      <div className="space-y-2">
        {onlineUsers.length === 0 ? (
          <p className="py-4 text-center text-xs text-gray-500">
            Şu anda çevrimiçi kimse yok
          </p>
        ) : (
          <>
            {/* Online users */}
            {groupedUsers.online.length > 0 && (
              <div>
                <h4 className="mb-1 text-xs font-medium text-gray-500">Çevrimiçi</h4>
                <div className="space-y-1">
                  {groupedUsers.online.map((user) => (
                    <UserItem key={user.user_id} user={user} />
                  ))}
                </div>
              </div>
            )}

            {/* Away users */}
            {groupedUsers.away.length > 0 && (
              <div>
                <h4 className="mb-1 text-xs font-medium text-gray-500">Uzakta</h4>
                <div className="space-y-1">
                  {groupedUsers.away.map((user) => (
                    <UserItem key={user.user_id} user={user} />
                  ))}
                </div>
              </div>
            )}

            {/* Busy users */}
            {groupedUsers.busy.length > 0 && (
              <div>
                <h4 className="mb-1 text-xs font-medium text-gray-500">Meşgul</h4>
                <div className="space-y-1">
                  {groupedUsers.busy.map((user) => (
                    <UserItem key={user.user_id} user={user} />
                  ))}
                </div>
              </div>
            )}
          </>
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
    <div className="flex items-center gap-2 rounded-md p-2 hover:bg-gray-50">
      {/* Avatar */}
      <div className="relative">
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={user.full_name || 'User'}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
            {(user.full_name || '?').charAt(0).toUpperCase()}
          </div>
        )}

        {/* Status indicator */}
        <div
          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${statusColors[user.status]}`}
          title={statusLabels[user.status]}
        />
      </div>

      {/* User info */}
      <div className="flex-1 overflow-hidden">
        <p className="truncate text-xs font-medium text-gray-900">
          {user.full_name || 'İsimsiz Kullanıcı'}
        </p>
        {user.title && (
          <p className="truncate text-xs text-gray-500">{user.title}</p>
        )}
        {user.viewing_patient_id && (
          <p className="mt-0.5 truncate text-xs text-blue-600">
            Hasta görüntülüyor
          </p>
        )}
      </div>
    </div>
  )
}
