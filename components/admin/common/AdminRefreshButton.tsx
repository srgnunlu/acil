'use client'

import { RefreshCw } from 'lucide-react'
import { useState } from 'react'

interface AdminRefreshButtonProps {
  onRefresh: () => Promise<void> | void
  className?: string
}

export function AdminRefreshButton({ onRefresh, className = '' }: AdminRefreshButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleRefresh = async () => {
    setLoading(true)
    try {
      await onRefresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleRefresh}
      disabled={loading}
      className={`flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title="Yenile"
    >
      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
      Yenile
    </button>
  )
}

