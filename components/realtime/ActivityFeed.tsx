/**
 * ActivityFeed Component
 *
 * Shows recent activity in workspace
 */

'use client'

import { useRealtimeActivity } from '@/lib/hooks/useRealtimeActivity'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import type { ActivityType } from '@/types/realtime.types'

export interface ActivityFeedProps {
  workspaceId: string
  limit?: number
  className?: string
}

const activityIcons: Record<string, string> = {
  patient_created: '👤',
  patient_updated: '✏️',
  patient_deleted: '🗑️',
  patient_viewed: '👁️',
  patient_assigned: '👨‍⚕️',
  data_added: '📝',
  data_updated: '📝',
  test_added: '🧪',
  ai_analysis_requested: '🤖',
  ai_analysis_completed: '✅',
  chat_message_sent: '💬',
  note_created: '📌',
  note_updated: '📌',
  workspace_joined: '🚪',
  workspace_left: '🚪',
  member_invited: '✉️',
  member_removed: '👋',
  settings_updated: '⚙️'
}

const activityLabels: Record<string, string> = {
  patient_created: 'Hasta ekledi',
  patient_updated: 'Hasta güncelledi',
  patient_deleted: 'Hasta sildi',
  patient_viewed: 'Hastayı görüntüledi',
  patient_assigned: 'Hasta atadı',
  data_added: 'Veri ekledi',
  data_updated: 'Veri güncelledi',
  test_added: 'Test ekledi',
  ai_analysis_requested: 'AI analiz istedi',
  ai_analysis_completed: 'AI analiz tamamlandı',
  chat_message_sent: 'Mesaj gönderdi',
  note_created: 'Not ekledi',
  note_updated: 'Not güncelledi',
  workspace_joined: 'Workspace\'e katıldı',
  workspace_left: 'Workspace\'den ayrıldı',
  member_invited: 'Üye davet etti',
  member_removed: 'Üye çıkardı',
  settings_updated: 'Ayarları güncelledi'
}

export function ActivityFeed({ workspaceId, limit = 50, className = '' }: ActivityFeedProps) {
  const { activities, status, error } = useRealtimeActivity({
    workspaceId,
    limit,
    enabled: true
  })

  if (status === 'connecting') {
    return (
      <div className={`rounded-lg border border-gray-200 bg-white p-4 ${className}`}>
        <h3 className="mb-3 text-sm font-semibold text-gray-700">Son Aktiviteler</h3>
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className={`rounded-lg border border-red-200 bg-red-50 p-4 ${className}`}>
        <h3 className="mb-2 text-sm font-semibold text-red-700">Hata</h3>
        <p className="text-xs text-red-600">{error?.message || 'Aktiviteler yüklenemiyor'}</p>
      </div>
    )
  }

  return (
    <div className={`rounded-lg border border-gray-200 bg-white p-4 ${className}`}>
      <h3 className="mb-3 text-sm font-semibold text-gray-700">Son Aktiviteler</h3>

      <div className="space-y-2">
        {activities.length === 0 ? (
          <p className="py-4 text-center text-xs text-gray-500">
            Henüz aktivite yok
          </p>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 rounded-md border border-gray-100 p-2 hover:bg-gray-50"
            >
              {/* Icon */}
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-lg">
                {activityIcons[activity.activity_type] || '📋'}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-hidden">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    {/* User */}
                    {activity.user && (
                      <p className="text-xs font-medium text-gray-900">
                        {activity.user.full_name || 'İsimsiz Kullanıcı'}
                        {activity.user.title && (
                          <span className="ml-1 text-gray-500">({activity.user.title})</span>
                        )}
                      </p>
                    )}

                    {/* Action */}
                    <p className="text-xs text-gray-600">
                      {activityLabels[activity.activity_type] || activity.activity_type}
                    </p>

                    {/* Description */}
                    {activity.description && (
                      <p className="mt-0.5 text-xs text-gray-500">{activity.description}</p>
                    )}
                  </div>

                  {/* Time */}
                  <span className="flex-shrink-0 text-xs text-gray-400">
                    {formatDistanceToNow(new Date(activity.created_at), {
                      addSuffix: true,
                      locale: tr
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
