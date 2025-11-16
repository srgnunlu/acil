'use client'

import { useState, useEffect } from 'react'
import { Calculator, User, X } from 'lucide-react'
import { CALCULATOR_METADATA, type CalculatorType } from '@/types/calculator.types'
import GCSCalculator from './GCSCalculator'
import QSOFACalculator from './QSOFACalculator'
import CHADS2VAScCalculator from './CHADS2VAScCalculator'
import HASBLEDCalculator from './HASBLEDCalculator'
import { createClient } from '@/lib/supabase/client'
import type { Patient } from '@/types'

interface CalculatorSelectorProps {
  workspaceId: string
  patientId?: string
  initialCalculator?: CalculatorType
}

export default function CalculatorSelector({
  workspaceId,
  patientId: initialPatientId,
  initialCalculator,
}: CalculatorSelectorProps) {
  const [selectedCalculator, setSelectedCalculator] = useState<CalculatorType | null>(
    initialCalculator || null
  )
  const [selectedPatientId, setSelectedPatientId] = useState<string | undefined>(initialPatientId)
  const [patients, setPatients] = useState<Patient[]>([])
  const [loadingPatients, setLoadingPatients] = useState(false)

  const calculators = Object.values(CALCULATOR_METADATA)

  // Load patients for this workspace
  useEffect(() => {
    const loadPatients = async () => {
      setLoadingPatients(true)
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('patients')
          .select('id, name, age, gender')
          .eq('workspace_id', workspaceId)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(100)

        if (error) throw error
        setPatients(data || [])
      } catch (error) {
        console.error('Failed to load patients:', error)
      } finally {
        setLoadingPatients(false)
      }
    }

    if (workspaceId) {
      loadPatients()
    }
  }, [workspaceId])

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

        {/* Patient Selector */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              <User className="inline h-4 w-4 mr-1" />
              Hasta Seçimi (Opsiyonel)
            </label>
            {selectedPatientId && (
              <button
                onClick={() => setSelectedPatientId(undefined)}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                Temizle
              </button>
            )}
          </div>
          {selectedPatientId ? (
            <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-blue-300">
              <span className="text-sm font-medium text-gray-900">
                {patients.find((p) => p.id === selectedPatientId)?.name || 'Bilinmeyen Hasta'}
              </span>
              <span className="text-xs text-gray-500">
                Hesaplama bu hastaya kaydedilecek
              </span>
            </div>
          ) : (
            <select
              value={selectedPatientId || ''}
              onChange={(e) => setSelectedPatientId(e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="">Hasta seçin (opsiyonel)</option>
              {loadingPatients ? (
                <option disabled>Yükleniyor...</option>
              ) : patients.length === 0 ? (
                <option disabled>Hasta bulunamadı</option>
              ) : (
                patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name} {patient.age ? `(${patient.age} yaş)` : ''}
                  </option>
                ))
              )}
            </select>
          )}
          <p className="text-xs text-gray-600 mt-2">
            💡 Hasta seçmezseniz, hesaplama sadece workspace geçmişine kaydedilir.
            Hasta seçerseniz, hesaplama hasta dosyasına da eklenir.
          </p>
        </div>

        {/* Render Selected Calculator */}
        {selectedCalculator === 'gcs' && (
          <GCSCalculator workspaceId={workspaceId} patientId={selectedPatientId} />
        )}
        {selectedCalculator === 'qsofa' && (
          <QSOFACalculator workspaceId={workspaceId} patientId={selectedPatientId} />
        )}
        {selectedCalculator === 'chads2vasc' && (
          <CHADS2VAScCalculator workspaceId={workspaceId} patientId={selectedPatientId} />
        )}
        {selectedCalculator === 'hasbled' && (
          <HASBLEDCalculator workspaceId={workspaceId} patientId={selectedPatientId} />
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
          💡 <strong>İpucu:</strong> Hesaplamalar otomatik olarak kaydedilir. 
          Hasta seçerseniz, hesaplama hasta dosyasına eklenir ve AI analizinde kullanılır.
          Hasta seçmezseniz, hesaplama sadece workspace geçmişine kaydedilir.
          <br />
          <strong>Öneri:</strong> Hesaplamaları hasta dosyasına kaydetmek için hasta detay sayfasındaki &quot;Kalkulatörler&quot; sekmesini kullanın.
        </p>
      </div>
    </div>
  )
}
