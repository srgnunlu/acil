'use client'

import { useState } from 'react'
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react'

interface ExportOption {
  format: 'csv' | 'json' | 'xlsx'
  label: string
  icon: React.ReactNode
}

interface AdminDataExportProps {
  data: unknown[]
  filename?: string
  onExport?: (format: 'csv' | 'json' | 'xlsx') => Promise<void> | void
}

const exportOptions: ExportOption[] = [
  { format: 'csv', label: 'CSV', icon: <FileText className="w-4 h-4" /> },
  { format: 'json', label: 'JSON', icon: <FileText className="w-4 h-4" /> },
  { format: 'xlsx', label: 'Excel', icon: <FileSpreadsheet className="w-4 h-4" /> },
]

export function AdminDataExport({ data, filename = 'export', onExport }: AdminDataExportProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleExport = async (format: 'csv' | 'json' | 'xlsx') => {
    if (onExport) {
      setLoading(format)
      try {
        await onExport(format)
      } finally {
        setLoading(null)
      }
      return
    }

    // Default export implementation
    setLoading(format)
    try {
      if (format === 'json') {
        const json = JSON.stringify(data, null, 2)
        const blob = new Blob([json], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${filename}.json`
        a.click()
        URL.revokeObjectURL(url)
      } else if (format === 'csv') {
        if (data.length === 0) return

        const headers = Object.keys(data[0] as Record<string, unknown>)
        const csvRows = [
          headers.join(','),
          ...data.map((row) =>
            headers
              .map((header) => {
                const value = (row as Record<string, unknown>)[header]
                return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
              })
              .join(',')
          ),
        ]

        const csv = csvRows.join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${filename}.csv`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {exportOptions.map((option) => (
        <button
          key={option.format}
          onClick={() => handleExport(option.format)}
          disabled={loading !== null || data.length === 0}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={`${option.label} olarak dışa aktar`}
        >
          {loading === option.format ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            option.icon
          )}
          {option.label}
        </button>
      ))}
    </div>
  )
}

