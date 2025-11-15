'use client'

import { Users, TrendingUp, TrendingDown } from 'lucide-react'

interface PatientCountWidgetProps {
  data: {
    total: number
    active: number
    discharged: number
    new_this_week: number
  }
}

export function PatientCountWidget({ data }: PatientCountWidgetProps) {
  const activePercentage = data.total > 0 ? ((data.active / data.total) * 100).toFixed(1) : 0

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-200">Hasta İstatistikleri</h3>
        <Users className="w-6 h-6 text-blue-400" />
      </div>

      <div className="space-y-4">
        {/* Total Patients */}
        <div>
          <p className="text-sm text-gray-400">Toplam Hasta</p>
          <p className="text-3xl font-bold text-gray-100">{data.total}</p>
        </div>

        {/* Grid Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
          <div>
            <p className="text-xs text-gray-400 mb-1">Aktif</p>
            <div className="flex items-center gap-2">
              <p className="text-xl font-semibold text-green-400">{data.active}</p>
              <span className="text-xs text-gray-500">({activePercentage}%)</span>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-400 mb-1">Taburcu</p>
            <p className="text-xl font-semibold text-gray-400">{data.discharged}</p>
          </div>

          <div className="col-span-2 pt-2 border-t border-gray-700">
            <p className="text-xs text-gray-400 mb-1">Bu Hafta</p>
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold text-blue-400">{data.new_this_week}</p>
              {data.new_this_week > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-gray-500" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
