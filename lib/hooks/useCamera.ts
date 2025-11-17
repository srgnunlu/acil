'use client'

// Camera/Photo Capture Hook
// Phase 12 - PWA Enhancement - Mobile Features

import { useState, useRef, useCallback } from 'react'

export interface CameraOptions {
  facingMode?: 'user' | 'environment' // front or back camera
  width?: number
  height?: number
}

export function useCamera(options: CameraOptions = {}) {
  const { facingMode = 'environment', width = 1280, height = 720 } = options

  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const startCamera = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Kameranız desteklenmiyor')
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: width },
          height: { ideal: height },
        },
        audio: false,
      })

      setStream(mediaStream)
      setIsActive(true)
      setError(null)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Kamera erişimi reddedildi'
      setError(errorMessage)
      setIsActive(false)
    }
  }, [facingMode, width, height])

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
      setIsActive(false)

      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    }
  }, [stream])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !stream) {
      setError('Kamera aktif değil')
      return null
    }

    try {
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight

      const context = canvas.getContext('2d')
      if (!context) {
        throw new Error('Canvas context alınamadı')
      }

      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)

      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9)
      setCapturedImage(imageDataUrl)

      return imageDataUrl
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Fotoğraf çekilemedi'
      setError(errorMessage)
      return null
    }
  }, [stream])

  const clearCapturedImage = useCallback(() => {
    setCapturedImage(null)
  }, [])

  // Convert data URL to File
  const dataURLtoFile = useCallback((dataUrl: string, filename: string): File | null => {
    try {
      const arr = dataUrl.split(',')
      const mimeMatch = arr[0].match(/:(.*?);/)
      if (!mimeMatch) return null

      const mime = mimeMatch[1]
      const bstr = atob(arr[1])
      let n = bstr.length
      const u8arr = new Uint8Array(n)

      while (n--) {
        u8arr[n] = bstr.charCodeAt(n)
      }

      return new File([u8arr], filename, { type: mime })
    } catch (err) {
      console.error('File conversion error:', err)
      return null
    }
  }, [])

  return {
    videoRef,
    stream,
    isActive,
    error,
    capturedImage,
    startCamera,
    stopCamera,
    capturePhoto,
    clearCapturedImage,
    dataURLtoFile,
  }
}
