'use client'

import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { CheckCircle, XCircle, Zap, MessageSquare, Eye, Search } from 'lucide-react'

interface AILog {
  id: string
  user_id: string | null
  operation: string
  model: string | null
  input_tokens: number | null
  output_tokens: number | null
  total_cost: number | null
  response_time_ms: number | null
  success: boolean
  error: string | null
  created_at: string
  profiles?: {
    full_name: string | null
    avatar_url: string | null
  } | null
}

export function AdminAIRecentLogs({ logs }: { logs: AILog[] }) {
  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'analyze':
        return <Search className="w-4 h-4" />
      case 'chat':
        return <MessageSquare className="w-4 h-4" />
      case 'vision':
        return <Eye className="w-4 h-4" />
      default:
        return <Zap className="w-4 h-4" />
    }
  }

  const getOperationLabel = (operation: string) => {
    const labels: Record<string, string> = {
      analyze: 'Analiz',
      chat: 'Chat',
      vision: 'Görsel Analiz',
      compare: 'Karşılaştırma',
      trends: 'Trend Analizi',
    }
    return labels[operation] || operation
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Son AI İstekleri ({logs.length})</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kullanıcı
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                İşlem
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Model
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Token
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Maliyet
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Süre
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Durum
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Zaman
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    {log.profiles?.full_name || 'Bilinmeyen'}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded">
                      {getOperationIcon(log.operation)}
                    </div>
                    <span className="text-sm text-gray-900">{getOperationLabel(log.operation)}</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm text-gray-600">{log.model || '-'}</span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm text-gray-900">
                    {((log.input_tokens || 0) + (log.output_tokens || 0)).toLocaleString('tr-TR')}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm font-medium text-gray-900">
                    ${(log.total_cost || 0).toFixed(4)}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm text-gray-600">{log.response_time_ms || 0}ms</span>
                </td>
                <td className="px-4 py-4">
                  {log.success ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-xs">Başarılı</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-red-600" title={log.error || ''}>
                      <XCircle className="w-4 h-4" />
                      <span className="text-xs">Hata</span>
                    </div>
                  )}
                </td>
                <td className="px-4 py-4">
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(log.created_at), {
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
    </div>
  )
}
