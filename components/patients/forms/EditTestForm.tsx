'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PatientTest } from '@/types'

interface EditTestFormProps {
  test: PatientTest
  onClose: () => void
}

export function EditTestForm({ test, onClose }: EditTestFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const formConfigs: Record<string, any> = {
    laboratory: {
      title: 'Laboratuvar Sonucunu Düzenle',
      fields: [
        { name: 'hemoglobin', label: 'Hemoglobin (g/dL)', type: 'number', step: '0.1' },
        { name: 'wbc', label: 'Lökosit (10³/µL)', type: 'number', step: '0.1' },
        { name: 'platelet', label: 'Trombosit (10³/µL)', type: 'number', step: '0.1' },
        { name: 'glucose', label: 'Glukoz (mg/dL)', type: 'number', step: '0.1' },
        { name: 'creatinine', label: 'Kreatinin (mg/dL)', type: 'number', step: '0.01' },
        { name: 'sodium', label: 'Sodyum (mEq/L)', type: 'number', step: '0.1' },
        { name: 'potassium', label: 'Potasyum (mEq/L)', type: 'number', step: '0.1' },
        { name: 'alt', label: 'ALT (U/L)', type: 'number', step: '0.1' },
        { name: 'ast', label: 'AST (U/L)', type: 'number', step: '0.1' },
        { name: 'troponin', label: 'Troponin', type: 'text' },
        { name: 'd_dimer', label: 'D-Dimer (ng/mL)', type: 'number', step: '0.01' },
        { name: 'crp', label: 'CRP (mg/L)', type: 'number', step: '0.1' },
        { name: 'other', label: 'Diğer Sonuçlar', type: 'textarea' },
      ],
    },
    ekg: {
      title: 'EKG Sonucunu Düzenle',
      fields: [
        { name: 'rhythm', label: 'Ritim', type: 'text', required: true, placeholder: 'Sinüs ritmi' },
        { name: 'rate', label: 'Kalp Hızı (atım/dk)', type: 'number', required: true },
        { name: 'pr_interval', label: 'PR Aralığı (ms)', type: 'number' },
        { name: 'qrs_duration', label: 'QRS Süresi (ms)', type: 'number' },
        { name: 'qt_qtc', label: 'QT/QTc (ms)', type: 'text' },
        { name: 'axis', label: 'Aks', type: 'text', placeholder: 'Normal aks' },
        { name: 'st_changes', label: 'ST Değişiklikleri', type: 'textarea' },
        { name: 't_wave', label: 'T Dalgası', type: 'text' },
        { name: 'interpretation', label: 'Yorum', type: 'textarea', required: true },
      ],
    },
    xray: {
      title: 'Radyoloji Sonucunu Düzenle',
      fields: [
        { name: 'exam_type', label: 'İnceleme Türü', type: 'select', required: true, options: ['PA Akciğer Grafisi', 'Toraks BT', 'Kranial BT', 'Abdominal USG', 'MR', 'Diğer'] },
        { name: 'technique', label: 'Teknik', type: 'text' },
        { name: 'findings', label: 'Bulgular', type: 'textarea', required: true },
        { name: 'impression', label: 'Kanı/Yorum', type: 'textarea', required: true },
        { name: 'comparison', label: 'Önceki İnceleme ile Karşılaştırma', type: 'textarea' },
      ],
    },
    consultation: {
      title: 'Konsültasyon Sonucunu Düzenle',
      fields: [
        { name: 'department', label: 'Konsülte Edilen Bölüm', type: 'text', required: true },
        { name: 'consulting_physician', label: 'Konsültan Hekim', type: 'text' },
        { name: 'reason', label: 'Konsültasyon Nedeni', type: 'textarea', required: true },
        { name: 'response', label: 'Konsültasyon Yanıtı', type: 'textarea', required: true },
        { name: 'recommendations', label: 'Öneriler', type: 'textarea' },
      ],
    },
    other: {
      title: 'Diğer Tetkik Düzenle',
      fields: [
        { name: 'test_name', label: 'Tetkik Adı', type: 'text', required: true },
        { name: 'results', label: 'Sonuçlar', type: 'textarea', required: true },
        { name: 'interpretation', label: 'Yorum', type: 'textarea' },
      ],
    },
  }

  const config = formConfigs[test.test_type]

  if (!config) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const results: Record<string, any> = {}

    config.fields.forEach((field: any) => {
      const value = formData.get(field.name)
      if (value) {
        results[field.name] = value
      }
    })

    try {
      const supabase = createClient()

      const { error: updateError } = await supabase
        .from('patient_tests')
        .update({ results })
        .eq('id', test.id)

      if (updateError) throw updateError

      router.refresh()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Tetkik güncellenirken bir hata oluştu')
      setLoading(false)
    }
  }

  const getDefaultValue = (fieldName: string) => {
    if (typeof test.results === 'object' && test.results !== null) {
      return (test.results as Record<string, any>)[fieldName] || ''
    }
    return ''
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
                  defaultValue={getDefaultValue(field.name)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder={field.placeholder}
                />
              ) : field.type === 'select' ? (
                <select
                  id={field.name}
                  name={field.name}
                  required={field.required}
                  defaultValue={getDefaultValue(field.name)}
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
                  step={field.step}
                  defaultValue={getDefaultValue(field.name)}
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
              {loading ? 'Güncelleniyor...' : 'Güncelle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
