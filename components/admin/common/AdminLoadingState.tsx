'use client'

import { Loader2 } from 'lucide-react'

interface AdminLoadingStateProps {
  message?: string
  className?: string
}

export function AdminLoadingState({
  message = 'Yükleniyor...',
  className = '',
}: AdminLoadingStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  )
}

