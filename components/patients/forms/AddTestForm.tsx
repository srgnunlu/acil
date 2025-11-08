'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface AddTestFormProps {
  patientId: string
  testType: string
  onClose: () => void
}

interface FormField {
  name: string
  label: string
  type?: string
  required?: boolean
  placeholder?: string
  step?: string
  options?: string[]
}

interface FormConfig {
  title: string
  fields: FormField[]
}

export function AddTestForm({ patientId, testType, onClose }: AddTestFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analyzingImage, setAnalyzingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const formConfigs: Record<string, FormConfig> = {
    laboratory: {
      title: 'Laboratuvar Sonucu Ekle',
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
      title: 'EKG Sonucu Ekle',
      fields: [
        {
          name: 'rhythm',
          label: 'Ritim',
          type: 'text',
          required: true,
          placeholder: 'Sinüs ritmi',
        },
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
      title: 'Radyoloji Sonucu Ekle',
      fields: [
        {
          name: 'exam_type',
          label: 'İnceleme Türü',
          type: 'select',
          required: true,
          options: [
            'PA Akciğer Grafisi',
            'Toraks BT',
            'Kranial BT',
            'Abdominal USG',
            'MR',
            'Diğer',
          ],
        },
        { name: 'technique', label: 'Teknik', type: 'text' },
        { name: 'findings', label: 'Bulgular', type: 'textarea', required: true },
        { name: 'impression', label: 'Kanı/Yorum', type: 'textarea', required: true },
        { name: 'comparison', label: 'Önceki İnceleme ile Karşılaştırma', type: 'textarea' },
      ],
    },
    consultation: {
      title: 'Konsültasyon Sonucu Ekle',
      fields: [
        { name: 'department', label: 'Konsülte Edilen Bölüm', type: 'text', required: true },
        { name: 'consulting_physician', label: 'Konsültan Hekim', type: 'text' },
        { name: 'reason', label: 'Konsültasyon Nedeni', type: 'textarea', required: true },
        { name: 'response', label: 'Konsültasyon Yanıtı', type: 'textarea', required: true },
        { name: 'recommendations', label: 'Öneriler', type: 'textarea' },
      ],
    },
    other: {
      title: 'Diğer Tetkik Ekle',
      fields: [
        { name: 'test_name', label: 'Tetkik Adı', type: 'text', required: true },
        { name: 'results', label: 'Sonuçlar', type: 'textarea', required: true },
        { name: 'interpretation', label: 'Yorum', type: 'textarea' },
      ],
    },
  }

  const config = formConfigs[testType]

  if (!config) {
    return null
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      setError('Sadece JPG, PNG veya PDF dosyaları yükleyebilirsiniz')
      return
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("Dosya boyutu 10MB'dan küçük olmalıdır")
      return
    }

    setAnalyzingImage(true)
    setError(null)

    try {
      // Convert to base64
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64 = reader.result as string
        setImagePreview(base64)

        // Call AI vision API
        const response = await fetch('/api/ai/vision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64,
            analysisType: 'lab_results',
            context: 'Laboratuvar sonuç görselinden değerleri çıkar',
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Görsel analizi başarısız')
        }

        // Auto-fill form with extracted values
        if (data.analysis?.values) {
          const newFormData: Record<string, string> = {}
          const unmatchedValues: Record<string, string> = {}

          // Form field'larının isimlerini al
          const formFieldNames = config.fields.map((f) => f.name)

          // AI'dan gelen değerleri eşleştir
          Object.entries(data.analysis.values).forEach(([key, value]) => {
            if (value !== null && value !== undefined && String(value).trim() !== '') {
              const stringValue = String(value)

              // Eğer bu alan formda varsa, direkt ekle
              if (formFieldNames.includes(key)) {
                newFormData[key] = stringValue
              } else {
                // Eşleşmeyen değerleri "other" için sakla
                // Test adını daha okunabilir yap
                const readableKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
                unmatchedValues[readableKey] = stringValue
              }
            }
          })

          // Eşleşmeyen değerleri "other" alanına düzenli şekilde ekle
          if (Object.keys(unmatchedValues).length > 0) {
            const otherText = Object.entries(unmatchedValues)
              .map(([key, value]) => `${key}: ${value}`)
              .join('\n')
            newFormData['other'] = otherText
          }

          // Not: Tarih ve detected_tests bilgileri artık AI tarafından gönderilmiyor

          setFormData(newFormData)
        }

        setAnalyzingImage(false)
      }

      reader.onerror = () => {
        setError('Dosya okunamadı')
        setAnalyzingImage(false)
      }

      reader.readAsDataURL(file)
    } catch (err: unknown) {
      const error = err as Error
      setError(error.message || 'Görsel analizi yapılırken hata oluştu')
      setAnalyzingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const results: Record<string, string> = {}

    // Use formData state (which is always up-to-date with controlled components)
    // Filter out empty values
    Object.entries(formData).forEach(([key, value]) => {
      if (value && value.trim()) {
        results[key] = value.trim()
      }
    })

    try {
      const supabase = createClient()

      const { error: insertError } = await supabase.from('patient_tests').insert({
        patient_id: patientId,
        test_type: testType,
        results,
      })

      if (insertError) throw insertError

      router.refresh()
      onClose()
    } catch (err: unknown) {
      const error = err as Error
      setError(error.message || 'Tetkik eklenirken bir hata oluştu')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">{config.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
            disabled={loading || analyzingImage}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Upload for Laboratory Tests */}
          {testType === 'laboratory' && (
            <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 border-dashed rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-blue-900 text-sm mb-1">
                    🤖 Yapay Zeka ile Otomatik Doldur
                  </h3>
                  <p className="text-xs text-blue-700">
                    Laboratuvar sonucu görselinizi veya PDF&apos;inizi yükleyin, AI değerleri
                    otomatik çıkarsın
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={analyzingImage}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {analyzingImage ? '⏳ Analiz ediliyor...' : '📁 Dosya Seç'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,application/pdf"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              {imagePreview && (
                <div className="mt-3">
                  {imagePreview.startsWith('data:application/pdf') ? (
                    <div className="bg-gray-100 p-4 rounded-lg text-center">
                      <p className="text-sm text-gray-600">📄 PDF Yüklendi</p>
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imagePreview}
                      alt="Lab result preview"
                      className="max-h-40 rounded-lg mx-auto"
                    />
                  )}
                </div>
              )}

              {analyzingImage && (
                <div className="mt-3 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
                  <p className="text-sm text-blue-700 mt-2">AI değerleri çıkarıyor...</p>
                </div>
              )}
            </div>
          )}

          {/* Form Fields - Compact Grid Layout */}
          <div className="grid grid-cols-2 gap-3">
            {config.fields.map(
              (field: {
                name: string
                label: string
                type?: string
                required?: boolean
                placeholder?: string
                step?: string
                options?: string[]
              }) => (
                <div
                  key={field.name}
                  className={field.type === 'textarea' ? 'col-span-2' : 'col-span-1'}
                >
                  <label
                    htmlFor={field.name}
                    className="block text-xs font-medium text-gray-700 mb-1"
                  >
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>

                  {field.type === 'textarea' ? (
                    <textarea
                      id={field.name}
                      name={field.name}
                      required={field.required}
                      rows={2}
                      value={formData[field.name] || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder={field.placeholder}
                    />
                  ) : field.type === 'select' ? (
                    <select
                      id={field.name}
                      name={field.name}
                      required={field.required}
                      value={formData[field.name] || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
                      value={formData[field.name] || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder={field.placeholder}
                    />
                  )}
                </div>
              )
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex space-x-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
              disabled={loading || analyzingImage}
            >
              İptal
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
              disabled={loading || analyzingImage}
            >
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
