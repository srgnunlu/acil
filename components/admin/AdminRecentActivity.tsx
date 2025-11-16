'use client'

import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Activity, UserPlus, FileText, Settings, AlertTriangle, CheckCircle } from 'lucide-react'

interface ActivityLog {
  id: string
  activity_type: string
  description: string | null
  created_at: string
  profiles: {
    full_name: string | null
    avatar_url: string | null
  } | null
}

interface AdminRecentActivityProps {
  activities: ActivityLog[]
}

export function AdminRecentActivity({ activities }: AdminRecentActivityProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_login':
      case 'user_register':
        return <UserPlus className="w-4 h-4" />
      case 'patient_create':
      case 'patient_update':
        return <FileText className="w-4 h-4" />
      case 'settings_update':
        return <Settings className="w-4 h-4" />
      case 'ai_analysis':
        return <CheckCircle className="w-4 h-4" />
      default:
        return <Activity className="w-4 h-4" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'user_login':
      case 'user_register':
        return 'bg-blue-100 text-blue-600'
      case 'patient_create':
      case 'patient_update':
        return 'bg-green-100 text-green-600'
      case 'settings_update':
        return 'bg-purple-100 text-purple-600'
      case 'ai_analysis':
        return 'bg-amber-100 text-amber-600'
      case 'error':
        return 'bg-red-100 text-red-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const getActivityLabel = (type: string) => {
    const labels: Record<string, string> = {
      user_login: 'Giriş Yaptı',
      user_register: 'Kayıt Oldu',
      patient_create: 'Hasta Ekledi',
      patient_update: 'Hasta Güncelledi',
      settings_update: 'Ayar Değiştirdi',
      ai_analysis: 'AI Analizi',
      workspace_create: 'Workspace Oluşturdu',
      organization_create: 'Organizasyon Oluşturdu',
    }
    return labels[type] || type
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Son Aktiviteler</h3>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          Tümünü Gör
        </button>
      </div>

      <div className="space-y-4">
        {activities.length > 0 ? (
          activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-4">
              <div
                className={`p-2 rounded-lg ${getActivityColor(activity.activity_type)} flex-shrink-0`}
              >
                {getActivityIcon(activity.activity_type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {activity.profiles?.full_name || 'Bilinmeyen Kullanıcı'}
                </p>
                <p className="text-sm text-gray-600">
                  {activity.description || getActivityLabel(activity.activity_type)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDistanceToNow(new Date(activity.created_at), {
                    addSuffix: true,
                    locale: tr,
                  })}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Henüz aktivite bulunmuyor</p>
          </div>
        )}
      </div>
    </div>
  )
}
