'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Upload, X, Activity } from 'lucide-react'

interface AddEKGFormProps {
  patientId: string
  onClose: () => void
}

export function AddEKGForm({ patientId, onClose }: AddEKGFormProps) {
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string>('')
  const [isDragging, setIsDragging] = useState(false)
  const [formData, setFormData] = useState({
    rhythm: '',
    rate: '',
    pr_interval: '',
    qrs_duration: '',
    qt_qtc: '',
    axis: '',
    st_changes: '',
    t_wave: '',
    interpretation: '',
    clinical_notes: '',
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFileSelect = (file: File) => {
    // Validate file
    if (file.size > 10 * 1024 * 1024) {
      setError('Dosya boyutu çok büyük. Maksimum: 10MB')
      return
    }

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setError('Sadece resim veya PDF dosyaları yüklenebilir')
      return
    }

    handleImageUpload(file)
  }

  const handleImageUpload = async (file: File) => {
    setUploading(true)
    setError(null)

    try {
      // Upload the image with patientId
      const formDataObj = new FormData()
      formDataObj.append('file', file)
      formDataObj.append('patientId', patientId)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataObj,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Yükleme başarısız oldu')
      }

      setImageUrl(data.url)
    } catch (err: unknown) {
      const error = err as Error
      console.error('Upload error:', error)
      setError(error.message || 'Görsel yüklenirken hata oluştu')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      handleFileSelect(files[0])
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!imageUrl && !formData.rhythm && !formData.interpretation) {
      setError('Lütfen en az EKG görseli veya ritim ve yorum bilgisi girin')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Filter out empty values
      const results: Record<string, string> = {}
      Object.entries(formData).forEach(([key, value]) => {
        if (value && value.trim()) {
          results[key] = value
        }
      })

      // Save the EKG data
      const { error: insertError } = await supabase.from('patient_tests').insert({
        patient_id: patientId,
        test_type: 'ekg',
        results,
        images: imageUrl ? [imageUrl] : null,
      })

      if (insertError) throw insertError

      router.refresh()
      onClose()
    } catch (err: unknown) {
      const error = err as Error
      setError(error.message || 'Kayıt sırasında bir hata oluştu')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full p-8 my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Activity className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">EKG Sonucu Ekle</h2>
              <p className="text-sm text-gray-600">Elektrokardiyografi sonuçlarını kaydedin</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition p-2 hover:bg-gray-100 rounded-lg"
            disabled={loading || uploading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload Section */}
          <div className="bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <div className="h-10 w-10 bg-red-600 rounded-full flex items-center justify-center mr-3">
                <span className="text-white text-lg">📊</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">EKG Görseli</h3>
                <p className="text-xs text-gray-600">
                  EKG kaydınızın görselini yükleyin (opsiyonel)
                </p>
              </div>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={handleInputChange}
              className="hidden"
            />

            <div
              className={`relative border-2 border-dashed rounded-lg transition-colors ${
                isDragging ? 'border-red-400 bg-red-100' : 'border-red-200 bg-white'
              }`}
            >
              {imageUrl ? (
                // Image preview
                <div className="p-6 space-y-4">
                  <div className="relative inline-block">
                    {imageUrl.includes('.pdf') ? (
                      <div className="bg-gray-100 p-8 rounded-lg text-center">
                        <p className="text-sm text-gray-600">📄 PDF Yüklendi</p>
                        <p className="text-xs text-gray-500 mt-2">{imageUrl.split('/').pop()}</p>
                      </div>
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={imageUrl}
                        alt="Yüklenen EKG görseli"
                        className="max-h-64 max-w-full rounded-lg shadow-md"
                      />
                    )}

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 shadow-lg transition"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <p className="text-sm text-gray-600">✓ EKG görseli başarıyla yüklendi</p>
                </div>
              ) : (
                // Upload area
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={openFileDialog}
                  className="cursor-pointer p-8"
                >
                  {uploading ? (
                    <div className="space-y-4 text-center">
                      <div className="h-12 w-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto"></div>
                      <p className="text-gray-600">Yükleniyor...</p>
                    </div>
                  ) : (
                    <div className="space-y-4 text-center">
                      <Upload className="h-12 w-12 mx-auto text-red-400" />
                      <div>
                        <p className="text-lg font-medium text-gray-700 mb-2">
                          EKG görselini yüklemek için sürükleyin veya tıklayın
                        </p>
                        <p className="text-sm text-gray-500">
                          Maksimum boyut: 10MB
                          <br />
                          Kabul edilen formatlar: JPEG, PNG, PDF
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800 flex items-start">
                <span className="mr-2">ℹ️</span>
                <span>
                  EKG görseliniz güvenli bir şekilde saklanacaktır. İleride yapay zeka destekli EKG
                  analizi özelliği eklendiğinde, yüklediğiniz görseller otomatik olarak analiz
                  edilebilecektir.
                </span>
              </p>
            </div>
          </div>

          {/* EKG Parameters - Compact Grid */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">⚡</span>
              EKG Parametreleri
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Rhythm */}
              <div>
                <label htmlFor="rhythm" className="block text-sm font-medium text-gray-700 mb-1">
                  Ritim <span className="text-red-500">*</span>
                </label>
                <input
                  id="rhythm"
                  name="rhythm"
                  type="text"
                  value={formData.rhythm}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  placeholder="Örn: Sinüs ritmi"
                  required
                />
              </div>

              {/* Rate */}
              <div>
                <label htmlFor="rate" className="block text-sm font-medium text-gray-700 mb-1">
                  Kalp Hızı (atım/dk) <span className="text-red-500">*</span>
                </label>
                <input
                  id="rate"
                  name="rate"
                  type="number"
                  value={formData.rate}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  placeholder="Örn: 75"
                  required
                />
              </div>

              {/* Axis */}
              <div>
                <label htmlFor="axis" className="block text-sm font-medium text-gray-700 mb-1">
                  Aks
                </label>
                <input
                  id="axis"
                  name="axis"
                  type="text"
                  value={formData.axis}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  placeholder="Örn: Normal aks"
                />
              </div>

              {/* PR Interval */}
              <div>
                <label
                  htmlFor="pr_interval"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  PR Aralığı (ms)
                </label>
                <input
                  id="pr_interval"
                  name="pr_interval"
                  type="number"
                  value={formData.pr_interval}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  placeholder="120-200"
                />
              </div>

              {/* QRS Duration */}
              <div>
                <label
                  htmlFor="qrs_duration"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  QRS Süresi (ms)
                </label>
                <input
                  id="qrs_duration"
                  name="qrs_duration"
                  type="number"
                  value={formData.qrs_duration}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  placeholder="80-120"
                />
              </div>

              {/* QT/QTc */}
              <div>
                <label htmlFor="qt_qtc" className="block text-sm font-medium text-gray-700 mb-1">
                  QT/QTc (ms)
                </label>
                <input
                  id="qt_qtc"
                  name="qt_qtc"
                  type="text"
                  value={formData.qt_qtc}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  placeholder="Örn: 400/420"
                />
              </div>

              {/* T Wave */}
              <div className="md:col-span-3">
                <label htmlFor="t_wave" className="block text-sm font-medium text-gray-700 mb-1">
                  T Dalgası
                </label>
                <input
                  id="t_wave"
                  name="t_wave"
                  type="text"
                  value={formData.t_wave}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  placeholder="Örn: Normal T dalgaları"
                />
              </div>

              {/* ST Changes */}
              <div className="md:col-span-3">
                <label
                  htmlFor="st_changes"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  ST Değişiklikleri
                </label>
                <textarea
                  id="st_changes"
                  name="st_changes"
                  value={formData.st_changes}
                  onChange={handleFormChange}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  placeholder="ST segment değişiklikleri varsa belirtin..."
                />
              </div>
            </div>
          </div>

          {/* Interpretation Section */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">💡</span>
              Değerlendirme ve Notlar
            </h3>

            <div className="space-y-4">
              {/* Interpretation */}
              <div>
                <label
                  htmlFor="interpretation"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  EKG Yorumu <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="interpretation"
                  name="interpretation"
                  value={formData.interpretation}
                  onChange={handleFormChange}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Örn: Normal sinüs ritmi. Patolojik bulgu saptanmadı."
                  required
                />
              </div>

              {/* Clinical Notes */}
              <div>
                <label
                  htmlFor="clinical_notes"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Klinik Notlar
                </label>
                <textarea
                  id="clinical_notes"
                  name="clinical_notes"
                  value={formData.clinical_notes}
                  onChange={handleFormChange}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Ek klinik notlar, önceki EKG ile karşılaştırma..."
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start">
              <span className="mr-2">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
              disabled={loading || uploading}
            >
              İptal
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg font-medium hover:from-red-700 hover:to-pink-700 transition disabled:opacity-50 flex items-center justify-center shadow-lg"
              disabled={loading || uploading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Activity className="h-5 w-5 mr-2" />
                  EKG Sonucunu Kaydet
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
