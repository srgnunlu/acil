'use client'

import { AlertCircle, RefreshCw } from 'lucide-react'

interface AdminErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
}

export function AdminErrorState({
  title = 'Bir hata oluştu',
  message = 'Veriler yüklenirken bir sorun yaşandı. Lütfen tekrar deneyin.',
  onRetry,
  className = '',
}: AdminErrorStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-red-600" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 text-center max-w-md mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Tekrar Dene
        </button>
      )}
    </div>
  )
}

