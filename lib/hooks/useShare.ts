'use client'

import { useState } from 'react'
import { triggerHaptic } from '@/lib/utils/haptics'

interface ShareData {
  title?: string
  text?: string
  url?: string
  files?: File[]
}

interface ShareOptions {
  onSuccess?: () => void
  onError?: (error: Error) => void
  fallbackCopy?: boolean // Copy to clipboard as fallback
}

/**
 * Check if Web Share API is supported
 */
export function isShareSupported(): boolean {
  return typeof navigator !== 'undefined' && 'share' in navigator
}

/**
 * Check if file sharing is supported
 */
export function isFileShareSupported(): boolean {
  return (
    isShareSupported() &&
    navigator.canShare !== undefined &&
    navigator.canShare({ files: [new File([], '')] })
  )
}

/**
 * React hook for Web Share API
 */
export function useShare(options: ShareOptions = {}) {
  const [isSharing, setIsSharing] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const share = async (data: ShareData) => {
    setError(null)
    setIsSharing(true)

    try {
      // Check if share is supported
      if (!isShareSupported()) {
        throw new Error('Web Share API is not supported')
      }

      // Validate files if present
      if (data.files && data.files.length > 0) {
        if (!isFileShareSupported()) {
          throw new Error('File sharing is not supported')
        }

        if (!navigator.canShare({ files: data.files })) {
          throw new Error('Cannot share these files')
        }
      }

      // Trigger share
      await navigator.share(data)

      // Haptic feedback on success
      triggerHaptic('success')

      options.onSuccess?.()
    } catch (err) {
      const error = err as Error

      // User cancelled share - not an error
      if (error.name === 'AbortError') {
        return
      }

      setError(error)

      // Try fallback to clipboard if enabled
      if (options.fallbackCopy && (data.text || data.url)) {
        try {
          await copyToClipboard(data.text || data.url || '')
          triggerHaptic('success')
          options.onSuccess?.()
          return
        } catch (clipboardError) {
          // Clipboard fallback also failed
        }
      }

      triggerHaptic('error')
      options.onError?.(error)
    } finally {
      setIsSharing(false)
    }
  }

  return {
    share,
    isSharing,
    error,
    isSupported: isShareSupported(),
    isFileShareSupported: isFileShareSupported(),
  }
}

/**
 * Copy text to clipboard
 */
async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text)
  } else {
    // Fallback for older browsers
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  }
}

/**
 * Share patient data (example utility)
 */
export function sharePatientSummary(patientName: string, summary: string) {
  const { share } = useShare({
    onSuccess: () => console.log('Shared successfully'),
    onError: (err) => console.error('Share failed:', err),
    fallbackCopy: true,
  })

  share({
    title: `${patientName} - Hasta Özeti`,
    text: summary,
    url: window.location.href,
  })
}
