/**
 * ActivityFeed Component
 *
 * Shows recent activity in workspace
 */

'use client'

import { useRealtimeActivity } from '@/lib/hooks/useRealtimeActivity'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Activity } from 'lucide-react'

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
  settings_updated: '⚙️',
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
  workspace_joined: "Workspace'e katıldı",
  workspace_left: "Workspace'den ayrıldı",
  member_invited: 'Üye davet etti',
  member_removed: 'Üye çıkardı',
  settings_updated: 'Ayarları güncelledi',
}

export function ActivityFeed({ workspaceId, limit = 50, className = '' }: ActivityFeedProps) {
  const { activities, status, error } = useRealtimeActivity({
    workspaceId,
    limit,
    enabled: true,
  })

  if (status === 'connecting') {
    return (
      <div className={`rounded-lg border border-gray-200 bg-white ${className}`}>
        <div className="p-3 border-b border-gray-100">
          <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
            Son Aktiviteler
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
          <h3 className="text-xs font-semibold text-red-700 uppercase tracking-wide">Hata</h3>
        </div>
        <div className="p-3">
          <p className="text-xs text-red-600">{error?.message || 'Aktiviteler yüklenemiyor'}</p>
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
        <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
          Son Aktiviteler
        </h3>
      </div>

      <div className="p-2">
        {activities.length === 0 ? (
          <div className="py-8 text-center">
            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gray-100 flex items-center justify-center">
              <Activity className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 font-medium">Henüz aktivite yok</p>
          </div>
        ) : (
          <div className="space-y-1">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-2 rounded-lg p-2 hover:bg-gray-50 transition-colors group"
              >
                {/* Icon */}
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-sm group-hover:bg-gray-200 transition-colors">
                  {activityIcons[activity.activity_type] || '📋'}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {/* User */}
                      {activity.user && (
                        <p className="text-xs font-semibold text-gray-900 truncate">
                          {activity.user.full_name || 'İsimsiz Kullanıcı'}
                          {activity.user.title && (
                            <span className="ml-1 text-gray-500 font-normal">
                              ({activity.user.title})
                            </span>
                          )}
                        </p>
                      )}

                      {/* Action */}
                      <p className="text-[11px] text-gray-600 mt-0.5">
                        {activityLabels[activity.activity_type] || activity.activity_type}
                      </p>

                      {/* Description */}
                      {activity.description && (
                        <p className="mt-1 text-[10px] text-gray-500 line-clamp-1">
                          {activity.description}
                        </p>
                      )}
                    </div>

                    {/* Time */}
                    <span className="flex-shrink-0 text-[10px] text-gray-400 whitespace-nowrap">
                      {formatDistanceToNow(new Date(activity.created_at), {
                        addSuffix: true,
                        locale: tr,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
