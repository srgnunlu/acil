'use client'

import { useState, useRef, ChangeEvent } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'

interface ImageUploadProps {
  onUpload: (imageUrl: string) => void
  onRemove?: () => void
  imageUrl?: string
  accept?: string
  maxSize?: number // MB
  className?: string
}

/**
 * Image Upload Component
 */
export function ImageUpload({ 
  onUpload, 
  onRemove, 
  imageUrl, 
  accept = 'image/*',
  maxSize = 10,
  className = ''
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    if (file.size > maxSize * 1024 * 1024) {
      alert(`Dosya boyutu çok büyük. Maksimum: ${maxSize}MB`)
      return
    }

    if (!file.type.startsWith('image/')) {
      alert('Sadece resim dosyaları yüklenebilir')
      return
    }

    setIsUploading(true)
    
    const formData = new FormData()
    formData.append('file', file)

    fetch('/api/upload', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        onUpload(data.url)
      } else {
        alert('Yükleme başarısız oldu')
      }
    })
    .catch(error => {
      console.error('Upload error:', error)
      alert('Yükleme sırasında hata oluştu')
    })
    .finally(() => {
      setIsUploading(false)
    })
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

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      handleFileSelect(files[0])
    }
  }

  const handleRemove = () => {
    onRemove?.()
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={`relative border-2 border-dashed border-gray-300 rounded-lg p-8 text-center transition-colors ${
      isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
    } ${className}`}>
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
      />

      {imageUrl ? (
        // Image preview
        <div className="space-y-4">
          <div className="relative inline-block">
            <img
              src={imageUrl}
              alt="Yüklenen resim"
              className="max-h-64 max-w-full rounded-lg shadow-md"
            />
            
            {/* Remove button */}
            <button
              onClick={handleRemove}
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
          {isUploading ? (
            <div className="space-y-4">
              <div className="h-12 w-12 border-4 border-blue-200 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-600">Yükleniyor...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="h-12 w-12 mx-auto text-gray-400" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                Resim yüklemek için sürükleyin veya tıklayın
              </p>
              <p className="text-sm text-gray-500">
                Maksimum boyut: {maxSize}MB
                <br />
                Kabul edilen formatlar: JPEG, PNG, WebP
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
