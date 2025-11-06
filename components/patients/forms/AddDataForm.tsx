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

      router.refresh()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Veri eklenirken bir hata oluştu')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-8 my-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{config.title}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {config.fields.map((field: any) => (
            <div key={field.name}>
              <label
                htmlFor={field.name}
                className="block text-sm font-medium text-gray-700 mb-2"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder={field.placeholder}
                />
              ) : field.type === 'select' ? (
                <select
                  id={field.name}
                  name={field.name}
                  required={field.required}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder={field.placeholder}
                />
              )}
            </div>
          ))}

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
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
