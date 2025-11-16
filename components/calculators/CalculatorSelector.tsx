'use client'

import { useState } from 'react'
import { Calculator } from 'lucide-react'
import { CALCULATOR_METADATA, type CalculatorType } from '@/types/calculator.types'
import GCSCalculator from './GCSCalculator'
import QSOFACalculator from './QSOFACalculator'
import CHADS2VAScCalculator from './CHADS2VAScCalculator'
import HASBLEDCalculator from './HASBLEDCalculator'

interface CalculatorSelectorProps {
  workspaceId: string
  patientId?: string
  initialCalculator?: CalculatorType
}

export default function CalculatorSelector({
  workspaceId,
  patientId,
  initialCalculator,
}: CalculatorSelectorProps) {
  const [selectedCalculator, setSelectedCalculator] = useState<CalculatorType | null>(
    initialCalculator || null
  )

  const calculators = Object.values(CALCULATOR_METADATA)

  if (selectedCalculator) {
    return (
      <div className="space-y-4">
        {/* Back Button */}
        <button
          onClick={() => setSelectedCalculator(null)}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          ← Tüm Kalkulatörler
        </button>

        {/* Render Selected Calculator */}
        {selectedCalculator === 'gcs' && (
          <GCSCalculator workspaceId={workspaceId} patientId={patientId} />
        )}
        {selectedCalculator === 'qsofa' && (
          <QSOFACalculator workspaceId={workspaceId} patientId={patientId} />
        )}
        {selectedCalculator === 'chads2vasc' && (
          <CHADS2VAScCalculator workspaceId={workspaceId} patientId={patientId} />
        )}
        {selectedCalculator === 'hasbled' && (
          <HASBLEDCalculator workspaceId={workspaceId} patientId={patientId} />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Calculator className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Klinik Kalkulatörler</h1>
      </div>

      <p className="text-gray-600">
        Hızlı ve doğru klinik karar destek araçları. Skorları hesaplayın ve sonuçları kaydedin.
      </p>

      {/* Calculator Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {calculators.map((calc) => (
          <button
            key={calc.type}
            onClick={() => setSelectedCalculator(calc.type)}
            className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all p-6 text-left group"
          >
            {/* Icon */}
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl mb-4"
              style={{ backgroundColor: `${calc.color}20` }}
            >
              {calc.icon}
            </div>

            {/* Name */}
            <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
              {calc.name}
            </h3>

            {/* Description */}
            <p className="text-sm text-gray-600 mb-3">{calc.description}</p>

            {/* Category Badge */}
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
              {calc.category}
            </div>
          </button>
        ))}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 <strong>İpucu:</strong> Tüm hesaplamalar otomatik olarak kaydedilir ve hasta dosyasına eklenir.
          Hesaplama geçmişine erişmek için hasta detay sayfasını ziyaret edin.
        </p>
      </div>
    </div>
  )
}
