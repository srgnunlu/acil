'use client'

import { useState } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'
import { tr } from 'date-fns/locale'

export interface DateRange {
  from: Date
  to: Date
  label?: string
}

interface DateRangeSelectorProps {
  value: DateRange
  onChange: (range: DateRange) => void
  presets?: DateRangePreset[]
}

export interface DateRangePreset {
  label: string
  getValue: () => DateRange
}

const DEFAULT_PRESETS: DateRangePreset[] = [
  {
    label: 'Bugün',
    getValue: () => ({
      from: new Date(),
      to: new Date(),
      label: 'Bugün',
    }),
  },
  {
    label: 'Dün',
    getValue: () => ({
      from: subDays(new Date(), 1),
      to: subDays(new Date(), 1),
      label: 'Dün',
    }),
  },
  {
    label: 'Son 7 Gün',
    getValue: () => ({
      from: subDays(new Date(), 6),
      to: new Date(),
      label: 'Son 7 Gün',
    }),
  },
  {
    label: 'Son 30 Gün',
    getValue: () => ({
      from: subDays(new Date(), 29),
      to: new Date(),
      label: 'Son 30 Gün',
    }),
  },
  {
    label: 'Bu Hafta',
    getValue: () => ({
      from: startOfWeek(new Date(), { locale: tr }),
      to: endOfWeek(new Date(), { locale: tr }),
      label: 'Bu Hafta',
    }),
  },
  {
    label: 'Bu Ay',
    getValue: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
      label: 'Bu Ay',
    }),
  },
  {
    label: 'Bu Yıl',
    getValue: () => ({
      from: startOfYear(new Date()),
      to: endOfYear(new Date()),
      label: 'Bu Yıl',
    }),
  },
]

export function DateRangeSelector({
  value,
  onChange,
  presets = DEFAULT_PRESETS,
}: DateRangeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [customMode, setCustomMode] = useState(false)
  const [customFrom, setCustomFrom] = useState(format(value.from, 'yyyy-MM-dd'))
  const [customTo, setCustomTo] = useState(format(value.to, 'yyyy-MM-dd'))

  const handlePresetClick = (preset: DateRangePreset) => {
    onChange(preset.getValue())
    setCustomMode(false)
    setIsOpen(false)
  }

  const handleCustomApply = () => {
    onChange({
      from: new Date(customFrom),
      to: new Date(customTo),
      label: 'Özel',
    })
    setIsOpen(false)
  }

  const displayLabel =
    value.label ||
    `${format(value.from, 'dd MMM', { locale: tr })} - ${format(value.to, 'dd MMM', { locale: tr })}`

  return (
    <div className="relative">
      {/* Trigger Button */}
      <Button
        variant="outline"
        size="sm"
        leftIcon={<Calendar className="w-4 h-4" />}
        rightIcon={<ChevronDown className="w-4 h-4" />}
        onClick={() => setIsOpen(!isOpen)}
        className="min-w-[200px] justify-between"
      >
        {displayLabel}
      </Button>

      {/* Dropdown */}
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
              className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden"
            >
              {!customMode ? (
                // Preset Mode
                <div className="p-2">
                  <p className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">
                    Hızlı Seçim
                  </p>
                  <div className="space-y-1">
                    {presets.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => handlePresetClick(preset)}
                        className={`
                          w-full text-left px-3 py-2 rounded-lg text-sm
                          transition-colors
                          ${
                            value.label === preset.label
                              ? 'bg-blue-50 text-blue-700 font-medium'
                              : 'hover:bg-gray-50 text-gray-700'
                          }
                        `}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-gray-200 mt-2 pt-2">
                    <button
                      onClick={() => setCustomMode(true)}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      📅 Özel Tarih Aralığı
                    </button>
                  </div>
                </div>
              ) : (
                // Custom Mode
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Özel Tarih Aralığı</h3>
                    <button
                      onClick={() => setCustomMode(false)}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      ← Geri
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Başlangıç
                      </label>
                      <input
                        type="date"
                        value={customFrom}
                        onChange={(e) => setCustomFrom(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bitiş
                      </label>
                      <input
                        type="date"
                        value={customTo}
                        onChange={(e) => setCustomTo(e.target.value)}
                        min={customFrom}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleCustomApply}
                      className="w-full"
                    >
                      Uygula
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
