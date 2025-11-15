'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface AddDataFormProps {
  patientId: string
  dataType: string
  onClose: () => void
}

export function AddDataForm({ patientId, dataType, onClose }: AddDataFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const formConfigs: Record<string, any> = {
    anamnesis: {
      title: 'Anamnez Ekle',
      fields: [
        { name: 'chief_complaint', label: 'Ana Şikayet', type: 'textarea', required: true },
        { name: 'history_present_illness', label: 'Şikayet Öyküsü', type: 'textarea', required: true },
        { name: 'duration', label: 'Süre', type: 'text', placeholder: '2 gündür' },
        { name: 'severity', label: 'Şiddet (1-10)', type: 'number', min: 1, max: 10 },
        { name: 'associated_symptoms', label: 'Eşlik Eden Semptomlar', type: 'textarea' },
        { name: 'aggravating_factors', label: 'Kötüleştiren Faktörler', type: 'text' },
        { name: 'relieving_factors', label: 'Rahatlatıcı Faktörler', type: 'text' },
      ],
    },
    vital_signs: {
      title: 'Vital Bulgular Ekle',
      fields: [
        { name: 'blood_pressure', label: 'Tansiyon Arteriyel', type: 'text', placeholder: '120/80', required: true },
        { name: 'heart_rate', label: 'Nabız (atım/dk)', type: 'number', required: true },
        { name: 'respiratory_rate', label: 'Solunum Sayısı (/dk)', type: 'number' },
        { name: 'temperature', label: 'Ateş (°C)', type: 'number', step: '0.1' },
        { name: 'spo2', label: 'SpO2 (%)', type: 'number', min: 0, max: 100 },
        { name: 'gcs', label: 'GCS', type: 'number', min: 3, max: 15 },
        { name: 'pain_score', label: 'Ağrı Skoru (0-10)', type: 'number', min: 0, max: 10 },
      ],
    },
    medications: {
      title: 'İlaç Kullanımı Ekle',
      fields: [
        { name: 'medication_name', label: 'İlaç Adı', type: 'text', required: true },
        { name: 'dose', label: 'Doz', type: 'text', placeholder: '500 mg' },
        { name: 'frequency', label: 'Sıklık', type: 'text', placeholder: '2x1' },
        { name: 'duration', label: 'Kullanım Süresi', type: 'text', placeholder: '2 yıldır' },
        { name: 'indication', label: 'Kullanım Amacı', type: 'text' },
        { name: 'compliance', label: 'Uyum', type: 'select', options: ['İyi', 'Orta', 'Zayıf', 'Kullanmıyor'] },
      ],
    },
    history: {
      title: 'Özgeçmiş Ekle',
      fields: [
        { name: 'past_medical_history', label: 'Geçmiş Hastalıklar', type: 'textarea' },
        { name: 'past_surgical_history', label: 'Geçmiş Ameliyatlar', type: 'textarea' },
        { name: 'allergies', label: 'Alerjiler', type: 'textarea', placeholder: 'İlaç, besin alerjileri' },
        { name: 'family_history', label: 'Aile Öyküsü', type: 'textarea' },
        { name: 'social_history', label: 'Sosyal Öykü', type: 'textarea', placeholder: 'Sigara, alkol, meslek' },
        { name: 'immunization', label: 'Aşılama Durumu', type: 'text' },
      ],
    },
    demographics: {
      title: 'Demografik Bilgi Ekle',
      fields: [
        { name: 'occupation', label: 'Meslek', type: 'text' },
        { name: 'marital_status', label: 'Medeni Hal', type: 'select', options: ['Bekar', 'Evli', 'Dul', 'Boşanmış'] },
        { name: 'education', label: 'Eğitim Durumu', type: 'text' },
        { name: 'insurance', label: 'Sigorta Durumu', type: 'text' },
        { name: 'blood_type', label: 'Kan Grubu', type: 'select', options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', '0+', '0-', 'Bilinmiyor'] },
        { name: 'contact_number', label: 'İletişim Telefonu', type: 'tel' },
        { name: 'emergency_contact', label: 'Acil Durum İletişim', type: 'text' },
      ],
    },
  }

  const config = formConfigs[dataType]

  if (!config) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const content: Record<string, any> = {}

    config.fields.forEach((field: any) => {
      const value = formData.get(field.name)
      if (value) {
        content[field.name] = value
      }
    })

    try {
      const supabase = createClient()

      const { error: insertError } = await supabase.from('patient_data').insert({
        patient_id: patientId,
        data_type: dataType,
        content,
      })

      if (insertError) throw insertError

      // If vital signs were added, trigger automatic trend analysis and check for critical values
      if (dataType === 'vital_signs') {
        // Check for critical vital signs and create alerts
        fetch('/api/ai/alerts/check-vitals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patient_id: patientId,
            vital_signs: content,
          }),
        })
          .then(async (res) => {
            if (!res.ok) {
              const error = await res.json()
              console.error('Alert check failed:', error)
            } else {
              const data = await res.json()
              console.log('Alert check result:', data)
            }
          })
          .catch((err) => {
            console.error('Alert check error:', err)
          })

        // Trigger trend analysis in background (don't wait for it)
        fetch('/api/ai/trends/auto-create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patient_id: patientId,
            period_hours: 24,
          }),
        })
          .then(async (res) => {
            if (!res.ok) {
              const error = await res.json()
              console.error('Trend auto-create failed:', error)
            } else {
              const data = await res.json()
              console.log('Trend auto-create result:', data)
            }
          })
          .catch((err) => {
            console.error('Trend auto-create error:', err)
          })
      }

      router.refresh()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Veri eklenirken bir hata oluştu')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">{config.title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            type="button"
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {config.fields.map((field: any) => {
              const isFullWidth = field.type === 'textarea' || field.name === 'chief_complaint' ||
                                  field.name === 'history_present_illness' || field.name === 'past_medical_history' ||
                                  field.name === 'past_surgical_history' || field.name === 'allergies' ||
                                  field.name === 'family_history' || field.name === 'social_history' ||
                                  field.name === 'associated_symptoms'

              return (
                <div key={field.name} className={isFullWidth ? 'md:col-span-2' : ''}>
                  <label
                    htmlFor={field.name}
                    className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide"
                  >
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>

                  {field.type === 'textarea' ? (
                    <textarea
                      id={field.name}
                      name={field.name}
                      required={field.required}
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      placeholder={field.placeholder}
                    />
                  ) : field.type === 'select' ? (
                    <select
                      id={field.name}
                      name={field.name}
                      required={field.required}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    >
                      <option value="">Seçiniz</option>
                      {field.options?.map((option: string) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={field.name}
                      name={field.name}
                      type={field.type || 'text'}
                      required={field.required}
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      placeholder={field.placeholder}
                    />
                  )}
                </div>
              )
            })}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <div className="flex space-x-3 pt-4 border-t border-gray-200 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              İptal
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Kaydet
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
