'use client'

import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import {
  UserPlus,
  FileText,
  Settings,
  Trash2,
  Edit,
  Eye,
  Activity,
  Building2,
  Briefcase,
} from 'lucide-react'
import Link from 'next/link'

interface ActivityLog {
  id: string
  user_id: string
  activity_type: string
  entity_type: string | null
  entity_id: string | null
  description: string | null
  metadata: any
  ip_address: string | null
  user_agent: string | null
  created_at: string
  profiles?: {
    full_name: string | null
    avatar_url: string | null
  } | null
}

interface AdminActivityLogsTableProps {
  activities: ActivityLog[]
  total: number
  currentPage: number
}

export function AdminActivityLogsTable({ activities, total, currentPage }: AdminActivityLogsTableProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_login':
      case 'user_register':
        return <UserPlus className="w-4 h-4" />
      case 'patient_create':
      case 'patient_update':
        return <FileText className="w-4 h-4" />
      case 'patient_delete':
        return <Trash2 className="w-4 h-4" />
      case 'settings_update':
        return <Settings className="w-4 h-4" />
      case 'organization_create':
        return <Building2 className="w-4 h-4" />
      case 'workspace_create':
        return <Briefcase className="w-4 h-4" />
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
        return 'bg-green-100 text-green-600'
      case 'patient_update':
        return 'bg-yellow-100 text-yellow-600'
      case 'patient_delete':
        return 'bg-red-100 text-red-600'
      case 'settings_update':
        return 'bg-purple-100 text-purple-600'
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
      patient_delete: 'Hasta Sildi',
      settings_update: 'Ayar Değiştirdi',
      ai_analysis: 'AI Analizi Yaptı',
      workspace_create: 'Workspace Oluşturdu',
      organization_create: 'Organizasyon Oluşturdu',
    }
    return labels[type] || type
  }

  const totalPages = Math.ceil(total / 50)

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Table Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Aktiviteler ({total})</h3>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kullanıcı
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aktivite
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Açıklama
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Entity
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                IP Adresi
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Zaman
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {activities.map((activity) => (
              <tr key={activity.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                      {(activity.profiles?.full_name || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {activity.profiles?.full_name || 'Bilinmeyen'}
                      </p>
                      <p className="text-xs text-gray-500">{activity.user_id.slice(0, 8)}...</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded ${getActivityColor(activity.activity_type)}`}>
                      {getActivityIcon(activity.activity_type)}
                    </div>
                    <span className="text-sm text-gray-900">
                      {getActivityLabel(activity.activity_type)}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm text-gray-600">
                    {activity.description || '-'}
                  </span>
                </td>
                <td className="px-4 py-4">
                  {activity.entity_type && (
                    <div className="text-xs">
                      <div className="text-gray-900 font-medium">{activity.entity_type}</div>
                      <div className="text-gray-500">
                        {activity.entity_id?.slice(0, 8)}...
                      </div>
                    </div>
                  )}
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm text-gray-600">
                    {activity.ip_address || '-'}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm text-gray-600">
                    {formatDistanceToNow(new Date(activity.created_at), {
                      addSuffix: true,
                      locale: tr,
                    })}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Sayfa {currentPage} / {totalPages}
          </div>
          <div className="flex gap-2">
            <Link
              href={`/dashboard/admin/activity-logs?page=${currentPage - 1}`}
              className={`px-3 py-1 border border-gray-300 rounded-lg ${
                currentPage === 1
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-gray-50'
              }`}
            >
              Önceki
            </Link>
            <Link
              href={`/dashboard/admin/activity-logs?page=${currentPage + 1}`}
              className={`px-3 py-1 border border-gray-300 rounded-lg ${
                currentPage === totalPages
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-gray-50'
              }`}
            >
              Sonraki
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
