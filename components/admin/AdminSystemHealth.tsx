'use client'

import { CheckCircle, AlertTriangle, XCircle, Activity } from 'lucide-react'

const healthChecks = [
  {
    name: 'Database Bağlantısı',
    status: 'healthy',
    message: 'Bağlantı aktif',
  },
  {
    name: 'AI Servisleri',
    status: 'healthy',
    message: 'OpenAI & Gemini aktif',
  },
  {
    name: 'Real-time Sistem',
    status: 'healthy',
    message: 'Supabase Realtime çalışıyor',
  },
  {
    name: 'Email Servisi',
    status: 'warning',
    message: 'Yavaş yanıt süresi',
  },
  {
    name: 'Storage',
    status: 'healthy',
    message: '%78 kullanımda',
  },
]

export function AdminSystemHealth() {
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

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Sistem Sağlığı</h3>
        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
          Tümü Aktif
        </span>
      </div>

      <div className="space-y-3">
        {healthChecks.map((check) => (
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
        ))}
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
