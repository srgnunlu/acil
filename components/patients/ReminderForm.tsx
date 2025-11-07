'use client'

import { useState } from 'react'

interface ReminderFormProps {
  patientId: string
  patientName: string
  onClose: () => void
  onSuccess?: () => void
}

export function ReminderForm({ patientId, patientName, onClose, onSuccess }: ReminderFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reminderTypes = [
    { value: 'lab_result', label: 'Laboratuvar Sonucu', suggestedMinutes: 120 },
    { value: 'ekg_result', label: 'EKG Sonucu', suggestedMinutes: 30 },
    { value: 'xray_result', label: 'Radyoloji Sonucu', suggestedMinutes: 60 },
    { value: 'consultation', label: 'Konsültasyon', suggestedMinutes: 30 },
    { value: 'vital_signs', label: 'Vital Bulgular', suggestedMinutes: 60 },
    { value: 'medication', label: 'İlaç', suggestedMinutes: 240 },
    { value: 'follow_up', label: 'Takip', suggestedMinutes: 480 },
  ]

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const reminderType = formData.get('reminderType') as string
    const minutes = parseInt(formData.get('minutes') as string)

    const scheduledTime = new Date()
    scheduledTime.setMinutes(scheduledTime.getMinutes() + minutes)

    try {
      const response = await fetch('/api/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId,
          reminderType,
          scheduledTime: scheduledTime.toISOString(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Hatırlatma oluşturulamadı')
      }

      onSuccess?.()
      onClose()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Hatırlatıcı eklenirken hata oluştu'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Hatırlatma Oluştur</h2>

        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-700">
            <span className="font-medium">{patientName}</span> için hatırlatma oluşturuyorsunuz
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="reminderType" className="block text-sm font-medium text-gray-700 mb-2">
              Hatırlatma Tipi
            </label>
            <select
              id="reminderType"
              name="reminderType"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              onChange={(e) => {
                const type = reminderTypes.find((t) => t.value === e.target.value)
                if (type) {
                  const minutesInput = document.getElementById('minutes') as HTMLInputElement
                  if (minutesInput) {
                    minutesInput.value = type.suggestedMinutes.toString()
                  }
                }
              }}
            >
              <option value="">Seçiniz</option>
              {reminderTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="minutes" className="block text-sm font-medium text-gray-700 mb-2">
              Kaç dakika sonra hatırlat?
            </label>
            <input
              id="minutes"
              name="minutes"
              type="number"
              min="1"
              required
              defaultValue="60"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">Örnek: Lab sonucu için 120 dakika (2 saat)</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
              disabled={loading}
            >
              İptal
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Oluşturuluyor...' : 'Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
