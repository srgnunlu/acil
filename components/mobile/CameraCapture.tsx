'use client'

// Camera Capture Component
// Phase 12 - PWA Enhancement - Mobile Features

import { useCamera } from '@/lib/hooks/useCamera'
import { Camera, X, RotateCcw, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface CameraCaptureProps {
  onCapture: (imageDataUrl: string) => void
  onClose: () => void
  facingMode?: 'user' | 'environment'
}

export function CameraCapture({ onCapture, onClose, facingMode = 'environment' }: CameraCaptureProps) {
  const {
    videoRef,
    isActive,
    error,
    capturedImage,
    startCamera,
    stopCamera,
    capturePhoto,
    clearCapturedImage,
  } = useCamera({ facingMode })

  const handleCapture = () => {
    const imageUrl = capturePhoto()
    if (imageUrl) {
      // Don't close yet, show preview
    }
  }

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage)
      stopCamera()
      onClose()
    }
  }

  const handleRetake = () => {
    clearCapturedImage()
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/50 to-transparent z-10">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold">Fotoğraf Çek</h2>
          <button
            onClick={() => {
              stopCamera()
              onClose()
            }}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Camera View */}
      <div className="relative w-full h-full flex items-center justify-center">
        {!isActive && !capturedImage && (
          <div className="text-center text-white p-8">
            {error ? (
              <>
                <p className="text-red-400 mb-4">{error}</p>
                <button
                  onClick={startCamera}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Tekrar Dene
                </button>
              </>
            ) : (
              <>
                <Camera className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="mb-4">Kamerayı kullanmak için izin verin</p>
                <button
                  onClick={startCamera}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
                >
                  <Camera className="h-4 w-4" />
                  Kamerayı Başlat
                </button>
              </>
            )}
          </div>
        )}

        {isActive && !capturedImage && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        )}

        {capturedImage && (
          <img
            src={capturedImage}
            alt="Captured"
            className="w-full h-full object-contain"
          />
        )}
      </div>

      {/* Controls */}
      {isActive && (
        <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/50 to-transparent">
          <AnimatePresence mode="wait">
            {!capturedImage ? (
              <motion.div
                key="capture"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="flex justify-center"
              >
                <button
                  onClick={handleCapture}
                  className="w-20 h-20 bg-white rounded-full border-4 border-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center"
                >
                  <div className="w-16 h-16 bg-transparent border-2 border-blue-600 rounded-full" />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="flex items-center justify-center gap-4"
              >
                <button
                  onClick={handleRetake}
                  className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Yeniden Çek
                </button>
                <button
                  onClick={handleConfirm}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Kullan
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
