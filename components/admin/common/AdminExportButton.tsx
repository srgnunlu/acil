'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'

interface AdminExportButtonProps {
  onExport: () => Promise<void> | void
  filename?: string
  className?: string
}

export function AdminExportButton({
  onExport,
  filename = 'export',
  className = '',
}: AdminExportButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    try {
      await onExport()
    } catch (error) {
      console.error('Export failed:', error)
      alert('Dışa aktarma başarısız oldu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      {loading ? 'Dışa Aktarılıyor...' : 'Dışa Aktar'}
    </button>
  )
}

