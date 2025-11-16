'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, AlertTriangle, XCircle, Activity, Loader2 } from 'lucide-react'

interface HealthCheck {
  name: string
  status: 'healthy' | 'warning' | 'error'
  message: string
  details?: Record<string, unknown>
}

export function AdminSystemHealth() {
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([])
  const [loading, setLoading] = useState(true)
  const [overallStatus, setOverallStatus] = useState<'healthy' | 'warning' | 'error'>('healthy')

  useEffect(() => {
    async function fetchHealthData() {
      try {
        const response = await fetch('/api/admin/system-health')
        if (response.ok) {
          const data = await response.json()
          setHealthChecks(data.checks || [])
          setOverallStatus(data.status || 'healthy')
        } else {
          // Fallback to default checks if API fails
          setHealthChecks([
            {
              name: 'Sistem Sağlık API',
              status: 'error',
              message: 'API erişilemiyor',
            },
          ])
        }
      } catch (error) {
        console.error('Failed to fetch health data:', error)
        setHealthChecks([
          {
            name: 'Sistem Sağlık API',
            status: 'error',
            message: 'Bağlantı hatası',
          },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchHealthData()
    // Refresh every 30 seconds
    const interval = setInterval(fetchHealthData, 30000)
    return () => clearInterval(interval)
  }, [])
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <Activity className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }

  const healthyCount = healthChecks.filter((check) => check.status === 'healthy').length
  const totalCount = healthChecks.length

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Sistem Sağlığı</h3>
        <span
          className={`px-3 py-1 text-xs font-medium rounded-full ${
            overallStatus === 'healthy'
              ? 'bg-green-100 text-green-800'
              : overallStatus === 'warning'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
          }`}
        >
          {healthyCount}/{totalCount} Aktif
        </span>
      </div>

      <div className="space-y-3">
        {healthChecks.length > 0 ? (
          healthChecks.map((check) => (
            <div key={check.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(check.status)}
                <div>
                  <p className="text-sm font-medium text-gray-900">{check.name}</p>
                  <p className="text-xs text-gray-500">{check.message}</p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(check.status)}`}>
                {check.status === 'healthy'
                  ? 'Sağlıklı'
                  : check.status === 'warning'
                    ? 'Uyarı'
                    : 'Hata'}
              </span>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-sm text-gray-500">Sağlık verisi yükleniyor...</div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Son Kontrol:</span>
          <span className="font-medium text-gray-900">{new Date().toLocaleTimeString('tr-TR')}</span>
        </div>
      </div>
    </div>
  )
}
