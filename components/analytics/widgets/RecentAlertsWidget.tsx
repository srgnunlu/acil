'use client'

import { AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

interface Alert {
  id: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  title: string
  created_at: string
  patient_id: string
}

interface RecentAlertsWidgetProps {
  alerts: Alert[]
}

const severityConfig = {
  critical: {
    icon: AlertTriangle,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    label: 'Kritik',
  },
  high: {
    icon: AlertCircle,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    label: 'Yüksek',
  },
  medium: {
    icon: Info,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    label: 'Orta',
  },
  low: {
    icon: Info,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    label: 'Düşük',
  },
}

export function RecentAlertsWidget({ alerts }: RecentAlertsWidgetProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-200">Son Uyarılar</h3>
        <AlertTriangle className="w-6 h-6 text-red-400" />
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-8">
          <Info className="w-12 h-12 text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Aktif uyarı bulunmuyor</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {alerts.map((alert) => {
            const config = severityConfig[alert.severity]
            const Icon = config.icon

            return (
              <div
                key={alert.id}
                className={`p-3 rounded-lg ${config.bg} border border-gray-700 hover:border-gray-600 transition-colors cursor-pointer`}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`w-5 h-5 mt-0.5 ${config.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(alert.created_at), {
                          addSuffix: true,
                          locale: tr,
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-200 line-clamp-2">{alert.title}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
