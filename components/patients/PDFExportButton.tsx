'use client'

import { useState } from 'react'
import { Download, FileText } from 'lucide-react'

interface PDFExportButtonProps {
  patientId: string
  patientName: string
}

/**
 * PDF Export Button Component
 */
export function PDFExportButton({ patientId, patientName }: PDFExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    
    try {
      const response = await fetch(`/api/patients/${patientId}/export-pdf`, {
        method: 'GET',
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `patient_${patientName}_${new Date().toISOString().split('T')[0]}.pdf`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      } else {
        throw new Error('PDF export failed')
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('PDF export başarısız oldu')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
    >
      {isExporting ? (
        <>
          <div className="h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full"></div>
          PDF Hazırlanıyor...
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          PDF İndir
        </>
      )}
    </button>
  )
}