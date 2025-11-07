'use client'

import { useState } from 'react'

interface ExportButtonProps {
  patientId: string
  patientName: string
}

type ExportFormat = 'json' | 'pdf'

export function ExportButton({ patientId, patientName }: ExportButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showMenu, setShowMenu] = useState(false)

  const handleExport = async (format: ExportFormat) => {
    setLoading(true)
    setError(null)
    setShowMenu(false)

    try {
      if (format === 'json') {
        const response = await fetch(`/api/patients/${patientId}/export`)

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Export başarısız')
        }

        const data = await response.json()

        // JSON dosyasını indir
        const blob = new Blob([JSON.stringify(data.report, null, 2)], {
          type: 'application/json',
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `patient_${patientName}_${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else if (format === 'pdf') {
        const response = await fetch(`/api/patients/${patientId}/export-pdf`)

        if (!response.ok) {
          throw new Error('PDF export başarısız')
        }

        // PDF dosyasını indir
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `patient_${patientName}_${new Date().toISOString().split('T')[0]}.pdf`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Export hatası'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={loading}
        className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50 flex items-center space-x-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Export ediliyor...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span>Rapor İndir</span>
            <svg
              className={`w-4 h-4 transition-transform ${showMenu ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </>
        )}
      </button>

      {showMenu && !loading && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
          <button
            onClick={() => handleExport('pdf')}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
          >
            <svg
              className="w-5 h-5 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            <span>PDF Rapor</span>
          </button>
          <button
            onClick={() => handleExport('json')}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
          >
            <svg
              className="w-5 h-5 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
              />
            </svg>
            <span>JSON Data</span>
          </button>
        </div>
      )}

      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
    </div>
  )
}
