'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Filter, Download } from 'lucide-react'
import { useState } from 'react'

const activityTypes = [
  { value: '', label: 'Tüm Aktiviteler' },
  { value: 'user_login', label: 'Kullanıcı Girişi' },
  { value: 'user_register', label: 'Kullanıcı Kaydı' },
  { value: 'patient_create', label: 'Hasta Oluşturma' },
  { value: 'patient_update', label: 'Hasta Güncelleme' },
  { value: 'patient_delete', label: 'Hasta Silme' },
  { value: 'ai_analysis', label: 'AI Analizi' },
  { value: 'workspace_create', label: 'Workspace Oluşturma' },
  { value: 'organization_create', label: 'Organizasyon Oluşturma' },
  { value: 'settings_update', label: 'Ayar Değişikliği' },
]

export function AdminActivityFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [type, setType] = useState(searchParams.get('type') || '')

  const handleTypeChange = (newType: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (newType) {
      params.set('type', newType)
    } else {
      params.delete('type')
    }
    params.set('page', '1')
    setType(newType)
    router.push(`/dashboard/admin/activity-logs?${params.toString()}`)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Activity Type Filter */}
        <div className="flex-1">
          <select
            value={type}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {activityTypes.map((activityType) => (
              <option key={activityType.value} value={activityType.value}>
                {activityType.label}
              </option>
            ))}
          </select>
        </div>

        {/* Export Button */}
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Download className="w-5 h-5" />
          <span>Dışa Aktar</span>
        </button>
      </div>
    </div>
  )
}
