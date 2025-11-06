'use client'

import { useState, useCallback } from 'react'

interface ImageUploadProps {
  patientId: string
  onUploadComplete: (url: string, path: string) => void
  onAnalyze?: (url: string, type: 'ekg' | 'skin_lesion' | 'xray' | 'other') => void
  maxSize?: number // MB
}

export function ImageUpload({
  patientId,
  onUploadComplete,
  onAnalyze,
  maxSize = 10,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<'ekg' | 'skin_lesion' | 'xray' | 'other'>('other')

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        await handleFile(e.dataTransfer.files[0])
      }
    },
    [patientId]
  )

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      await handleFile(e.target.files[0])
    }
  }

  const handleFile = async (file: File) => {
    setError(null)

    // Dosya tipi kontrolü
    if (!file.type.startsWith('image/')) {
      setError('Lütfen bir resim dosyası seçin')
      return
    }

    // Boyut kontrolü
    if (file.size > maxSize * 1024 * 1024) {
      setError(`Dosya boyutu ${maxSize}MB'dan küçük olmalı`)
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('patientId', patientId)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Yükleme başarısız')
      }

      const data = await response.json()
      setUploadedImage(data.url)
      onUploadComplete(data.url, data.path)
    } catch (err: any) {
      setError(err.message || 'Yükleme başarısız oldu')
    } finally {
      setUploading(false)
    }
  }

  const handleAnalyze = async () => {
    if (!uploadedImage || !onAnalyze) return
    onAnalyze(uploadedImage, selectedType)
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {!uploadedImage && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept="image/*"
            onChange={handleChange}
            disabled={uploading}
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <div className="text-6xl mb-4">
              {uploading ? '⏳' : '📤'}
            </div>
            <p className="text-lg font-medium text-gray-900 mb-2">
              {uploading ? 'Yükleniyor...' : 'Görsel Yükle'}
            </p>
            <p className="text-sm text-gray-600">
              Sürükle bırak veya tıkla
            </p>
            <p className="text-xs text-gray-500 mt-2">
              JPEG, PNG, WebP (Max {maxSize}MB)
            </p>
          </label>
        </div>
      )}

      {/* Uploaded Image */}
      {uploadedImage && (
        <div className="space-y-4">
          <div className="relative rounded-lg overflow-hidden border border-gray-200">
            <img
              src={uploadedImage}
              alt="Uploaded"
              className="w-full h-auto"
            />
            <button
              onClick={() => {
                setUploadedImage(null)
                setError(null)
              }}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition"
            >
              ✕
            </button>
          </div>

          {/* Analysis Options */}
          {onAnalyze && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">
                AI Analizi Yap
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Görsel Tipi:
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value as any)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="ekg">EKG</option>
                    <option value="xray">Radyoloji (Grafi, BT, MR)</option>
                    <option value="skin_lesion">Cilt Lezyonu</option>
                    <option value="other">Diğer</option>
                  </select>
                </div>
                <button
                  onClick={handleAnalyze}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  🤖 AI ile Analiz Et
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
    </div>
  )
}
