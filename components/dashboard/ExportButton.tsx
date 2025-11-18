'use client'

import { useState } from 'react'
import { Download, FileJson, FileSpreadsheet, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { triggerHaptic } from '@/lib/utils/haptics'

type ExportFormat = 'csv' | 'json' | 'excel'

interface ExportButtonProps {
  onExport: (format: ExportFormat) => void | Promise<void>
  label?: string
  disabled?: boolean
}

export function ExportButton({ onExport, label = 'Dışa Aktar', disabled }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true)
    triggerHaptic('light')

    try {
      await onExport(format)
      triggerHaptic('success')
    } catch (error) {
      console.error('Export failed:', error)
      triggerHaptic('error')
    } finally {
      setIsExporting(false)
      setIsOpen(false)
    }
  }

  const formats = [
    {
      type: 'csv' as ExportFormat,
      label: 'CSV',
      icon: FileSpreadsheet,
      description: 'Virgülle ayrılmış değerler',
      color: 'green',
    },
    {
      type: 'json' as ExportFormat,
      label: 'JSON',
      icon: FileJson,
      description: 'JSON formatı',
      color: 'blue',
    },
    {
      type: 'excel' as ExportFormat,
      label: 'Excel',
      icon: FileText,
      description: 'Microsoft Excel',
      color: 'emerald',
    },
  ]

  return (
    <div className="relative">
      {/* Main Button */}
      <Button
        variant="outline"
        size="sm"
        leftIcon={<Download className="w-4 h-4" />}
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || isExporting}
      >
        {isExporting ? 'Dışa aktarılıyor...' : label}
      </Button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden"
            >
              <div className="p-2">
                <p className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">
                  Format Seçin
                </p>
                {formats.map((format) => {
                  const Icon = format.icon
                  return (
                    <button
                      key={format.type}
                      onClick={() => handleExport(format.type)}
                      disabled={isExporting}
                      className={`
                        w-full flex items-start gap-3 px-3 py-2.5 rounded-lg
                        hover:bg-gray-50 transition-colors text-left
                        ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      <div
                        className={`flex-shrink-0 p-2 bg-${format.color}-100 rounded-lg`}
                      >
                        <Icon className={`w-4 h-4 text-${format.color}-600`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900">{format.label}</p>
                        <p className="text-xs text-gray-500">{format.description}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
