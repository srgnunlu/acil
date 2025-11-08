'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Upload, X } from 'lucide-react'

interface AddLesionImageFormProps {
  patientId: string
  onClose: () => void
}

export function AddLesionImageForm({ patientId, onClose }: AddLesionImageFormProps) {
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string>('')
  const [symptoms, setSymptoms] = useState('')
  const [aiAnalysis, setAiAnalysis] = useState<any>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFileSelect = (file: File) => {
    // Validate file
    if (file.size > 10 * 1024 * 1024) {
      setError('Dosya boyutu çok büyük. Maksimum: 10MB')
      return
    }

    if (!file.type.startsWith('image/')) {
      setError('Sadece resim dosyaları yüklenebilir')
      return
    }

    handleImageUpload(file)
  }

  const handleImageUpload = async (file: File) => {
    setUploading(true)
    setError(null)

    try {
      // Upload the image with patientId
      const formData = new FormData()
      formData.append('file', file)
      formData.append('patientId', patientId)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Yükleme başarısız oldu')
      }

      setImageUrl(data.url)

      // Automatically trigger AI analysis when image is uploaded
      await analyzeImage(data.url)
    } catch (err: any) {
      console.error('Upload error:', err)
      setError(err.message || 'Görsel yüklenirken hata oluştu')
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

  const analyzeImage = async (url: string) => {
    setAnalyzing(true)
    setError(null)

    try {
      // Get patient data for context
      const supabase = createClient()
      const { data: patient } = await supabase
        .from('patients')
        .select('name, age, gender')
        .eq('id', patientId)
        .single()

      // Build context string
      let context = ''
      if (patient) {
        context = `Hasta: ${patient.name}, ${patient.age} yaş, ${patient.gender === 'male' ? 'Erkek' : 'Kadın'}`
      }
      if (symptoms) {
        context += `\nSemptomlar: ${symptoms}`
      }

      const response = await fetch('/api/ai/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: url,
          analysisType: 'skin_lesion',
          patientId: patientId,
          context: context || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Analiz yapılırken hata oluştu')
      }

      setAiAnalysis(data.analysis)
    } catch (err: any) {
      console.error('AI analysis error:', err)
      setError(err.message || 'Yapay zeka analizi başarısız oldu')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!imageUrl) {
      setError('Lütfen bir görsel yükleyin')
      return
    }

    if (!aiAnalysis) {
      setError('Yapay zeka analizi tamamlanmadı')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Save the lesion image with AI analysis
      const { error: insertError } = await supabase.from('patient_tests').insert({
        patient_id: patientId,
        test_type: 'lesion_image',
        results: {
          symptoms: symptoms || 'Belirtilmedi',
          ai_analysis: aiAnalysis,
        },
        images: [imageUrl],
      })

      if (insertError) throw insertError

      router.refresh()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Kayıt sırasında bir hata oluştu')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-8 my-8 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Lezyon Görseli Ekle ve Analiz Et
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Symptoms Input */}
          <div>
            <label htmlFor="symptoms" className="block text-sm font-medium text-gray-700 mb-2">
              Hasta Şikayetleri ve Semptomlar
            </label>
            <textarea
              id="symptoms"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Örn: Kaşıntı, yanma hissi, 2 haftadır var, büyüme gözlendi..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Yapay zeka analizini iyileştirmek için semptomları belirtin
            </p>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lezyon Görseli <span className="text-red-500">*</span>
            </label>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleInputChange}
              className="hidden"
            />

            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
              }`}
            >
              {imageUrl ? (
                // Image preview
                <div className="space-y-4">
                  <div className="relative inline-block">
                    <img
                      src={imageUrl}
                      alt="Yüklenen lezyon görseli"
                      className="max-h-64 max-w-full rounded-lg shadow-md"
                    />

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => {
                        setImageUrl('')
                        setAiAnalysis(null)
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <p className="text-sm text-gray-600">
                    Resim başarıyla yüklendi. Değiştirmek için yeniden seçin.
                  </p>
                </div>
              ) : (
                // Upload area
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={openFileDialog}
                  className="cursor-pointer"
                >
                  {uploading ? (
                    <div className="space-y-4">
                      <div className="h-12 w-12 border-4 border-blue-200 border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <p className="text-gray-600">Yükleniyor...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="h-12 w-12 mx-auto text-gray-400" />
                      <p className="text-lg font-medium text-gray-700 mb-2">
                        Lezyon görselini yüklemek için sürükleyin veya tıklayın
                      </p>
                      <p className="text-sm text-gray-500">
                        Maksimum boyut: 10MB
                        <br />
                        Kabul edilen formatlar: JPEG, PNG, WebP
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* AI Analysis Progress */}
          {analyzing && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center justify-center space-x-3">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <p className="text-blue-700 font-medium">
                  Yapay zeka görseli analiz ediyor...
                </p>
              </div>
            </div>
          )}

          {/* AI Analysis Result */}
          {aiAnalysis && !analyzing && (
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 bg-purple-600 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white text-lg">🤖</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Yapay Zeka Analizi
                  </h3>
                  <p className="text-xs text-gray-600">
                    Gemini Vision API tarafından oluşturuldu
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                {typeof aiAnalysis === 'object' ? (
                  Object.entries(aiAnalysis).map(([key, value]) => (
                    <div key={key} className="bg-white rounded-lg p-3">
                      <p className="font-semibold text-gray-700 capitalize mb-1">
                        {key.replace(/_/g, ' ')}:
                      </p>
                      <p className="text-gray-900 whitespace-pre-wrap">
                        {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-gray-900 whitespace-pre-wrap">
                      {String(aiAnalysis)}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800">
                  ⚠️ Bu analiz yalnızca bilgilendirme amaçlıdır. Kesin tanı için hekim değerlendirmesi gereklidir.
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
              disabled={loading || analyzing}
            >
              İptal
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center"
              disabled={loading || analyzing || !imageUrl || !aiAnalysis}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Kaydediliyor...
                </>
              ) : (
                'Kaydet'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
