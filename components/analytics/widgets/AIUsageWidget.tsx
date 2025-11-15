'use client'

import { Brain, Zap, DollarSign, Clock } from 'lucide-react'

interface AIUsageWidgetProps {
  data: {
    total_requests: number
    analyze_count: number
    chat_count: number
    vision_count: number
    total_cost: number
    avg_response_time_ms: number
  }
}

export function AIUsageWidget({ data }: AIUsageWidgetProps) {
  const avgResponseSeconds = (data.avg_response_time_ms / 1000).toFixed(2)

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-200">AI Kullanım İstatistikleri</h3>
        <Brain className="w-6 h-6 text-purple-400" />
      </div>

      <div className="space-y-4">
        {/* Total Requests */}
        <div>
          <p className="text-sm text-gray-400">Toplam İstek</p>
          <p className="text-3xl font-bold text-gray-100">{data.total_requests}</p>
        </div>

        {/* Request Types */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-700">
          <div>
            <p className="text-xs text-gray-400 mb-1">Analiz</p>
            <p className="text-lg font-semibold text-blue-400">{data.analyze_count}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Chat</p>
            <p className="text-lg font-semibold text-green-400">{data.chat_count}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Görsel</p>
            <p className="text-lg font-semibold text-orange-400">{data.vision_count}</p>
          </div>
        </div>

        {/* Cost & Performance */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-yellow-400" />
            <div>
              <p className="text-xs text-gray-400">Maliyet</p>
              <p className="text-sm font-semibold text-yellow-400">${data.total_cost.toFixed(2)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <div>
              <p className="text-xs text-gray-400">Ort. Süre</p>
              <p className="text-sm font-semibold text-blue-400">{avgResponseSeconds}s</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
