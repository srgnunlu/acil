'use client'

import { useState, useEffect } from 'react'
import { Calculator, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { CALCULATOR_METADATA, type CalculatorType } from '@/types/calculator.types'
import GCSCalculator from '@/components/calculators/GCSCalculator'
import QSOFACalculator from '@/components/calculators/QSOFACalculator'
import CHADS2VAScCalculator from '@/components/calculators/CHADS2VAScCalculator'
import HASBLEDCalculator from '@/components/calculators/HASBLEDCalculator'
import SOFACalculator from '@/components/calculators/SOFACalculator'
import { useCalculatorHistory, useCalculateScore } from '@/lib/hooks/useCalculators'
import { autoFillCalculator, canAutoCalculate } from '@/lib/calculators/auto-fill'
import type { Patient, PatientData, PatientTest } from '@/types'
import { Card } from '@/components/ui/card'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface CalculatorsTabProps {
  patientId: string
  workspaceId: string
  patient: Patient
  patientData: PatientData[]
  tests: PatientTest[]
}

export function CalculatorsTab({
  patientId,
  workspaceId,
  patient,
  patientData,
  tests,
}: CalculatorsTabProps) {
  const [selectedCalculator, setSelectedCalculator] = useState<CalculatorType | null>(null)
  const [autoCalculated, setAutoCalculated] = useState<Set<CalculatorType>>(new Set())
  const [autoCalculating, setAutoCalculating] = useState<Set<CalculatorType>>(new Set())

  const { data: history } = useCalculatorHistory(workspaceId, patientId)
  const calculateMutation = useCalculateScore()

  const calculators = Object.values(CALCULATOR_METADATA)

  // Auto-calculate calculators when data is complete
  useEffect(() => {
    const autoCalculate = async () => {
      for (const calc of calculators) {
        // Skip if already calculated or currently calculating
        if (autoCalculated.has(calc.type) || autoCalculating.has(calc.type)) continue

        // Check if we can auto-calculate
        const { canCalculate } = canAutoCalculate(calc.type, {
          patient,
          patientData,
          tests,
        })

        if (canCalculate) {
          setAutoCalculating((prev) => new Set(prev).add(calc.type))

          try {
            const autoFilledData = autoFillCalculator(calc.type, patient, patientData, tests)

            const result = await calculateMutation.mutateAsync({
              workspace_id: workspaceId,
              patient_id: patientId,
              calculator_type: calc.type,
              input_data: autoFilledData,
            })

            setAutoCalculated((prev) => new Set(prev).add(calc.type))

            // Check if score is critical and create alert
            if (result.risk_category === 'critical' || result.risk_category === 'high') {
              await fetch('/api/ai/alerts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  patient_id: patientId,
                  workspace_id: workspaceId,
                  alert_type: 'calculator_critical_score',
                  severity: result.risk_category === 'critical' ? 'critical' : 'high',
                  title: `${calc.name} - Kritik Skor`,
                  message: `${calc.name} skoru: ${result.score}. ${result.score_interpretation || ''}`,
                  metadata: {
                    calculator_type: calc.type,
                    score: result.score,
                    interpretation: result.score_interpretation,
                    recommendations: result.recommendations,
                  },
                }),
              })
            }
          } catch (error) {
            console.error(`Auto-calculation failed for ${calc.type}:`, error)
          } finally {
            setAutoCalculating((prev) => {
              const next = new Set(prev)
              next.delete(calc.type)
              return next
            })
          }
        }
      }
    }

    autoCalculate()
  }, [patient, patientData, tests, workspaceId, patientId, calculators, autoCalculated, autoCalculating, calculateMutation])

  if (selectedCalculator) {
    return (
      <div className="space-y-6">
        {/* Back Button */}
        <button
          onClick={() => setSelectedCalculator(null)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Tüm Kalkulatörler
        </button>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            💡 <strong>Bilgi:</strong> Yaptığınız hesaplamalar otomatik olarak bu hasta dosyasına kaydedilir ve AI analizinde kullanılır.
          </p>
        </div>

        {/* Render Selected Calculator */}
        {selectedCalculator === 'gcs' && (
          <GCSCalculator
            workspaceId={workspaceId}
            patientId={patientId}
            patient={patient}
            patientData={patientData}
            tests={tests}
          />
        )}
        {selectedCalculator === 'qsofa' && (
          <QSOFACalculator
            workspaceId={workspaceId}
            patientId={patientId}
            patient={patient}
            patientData={patientData}
            tests={tests}
          />
        )}
        {selectedCalculator === 'chads2vasc' && (
          <CHADS2VAScCalculator
            workspaceId={workspaceId}
            patientId={patientId}
            patient={patient}
            patientData={patientData}
            tests={tests}
          />
        )}
        {selectedCalculator === 'hasbled' && (
          <HASBLEDCalculator
            workspaceId={workspaceId}
            patientId={patientId}
            patient={patient}
            patientData={patientData}
            tests={tests}
          />
        )}
        {selectedCalculator === 'sofa' && (
          <SOFACalculator
            workspaceId={workspaceId}
            patientId={patientId}
            patient={patient}
            patientData={patientData}
            tests={tests}
          />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Calculator className="h-8 w-8 text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Klinik Kalkulatörler</h2>
          <p className="text-gray-600 mt-1">
            Hızlı ve doğru klinik karar destek araçları. Tüm hesaplamalar bu hasta dosyasına kaydedilir.
          </p>
        </div>
      </div>

      {/* Auto-calculation Status */}
      {autoCalculating.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <p className="text-sm text-blue-800">
              Hasta verilerinden otomatik hesaplama yapılıyor...
            </p>
          </div>
        </div>
      )}

      {/* Calculator Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {calculators.map((calc) => {
          const { canCalculate, missingFields } = canAutoCalculate(calc.type, {
            patient,
            patientData,
            tests,
          })
          const isAutoCalculated = autoCalculated.has(calc.type)
          const isAutoCalculating = autoCalculating.has(calc.type)

          return (
            <button
              key={calc.type}
              onClick={() => setSelectedCalculator(calc.type)}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all p-6 text-left group border-2 relative"
              style={{
                borderColor: isAutoCalculated
                  ? '#10b981'
                  : canCalculate
                    ? '#3b82f6'
                    : '#e5e7eb',
              }}
            >
              {/* Status Badge */}
              {isAutoCalculated && (
                <div className="absolute top-2 right-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" title="Otomatik hesaplandı" />
                </div>
              )}
              {isAutoCalculating && (
                <div className="absolute top-2 right-2">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                </div>
              )}

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

              {/* Status Info */}
              {canCalculate ? (
                <div className="flex items-center gap-1 text-xs text-green-600 mb-2">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Tüm veriler mevcut - Otomatik hesaplanabilir</span>
                </div>
              ) : missingFields.length > 0 ? (
                <div className="flex items-start gap-1 text-xs text-gray-500 mb-2">
                  <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>
                    Eksik: {missingFields.slice(0, 2).join(', ')}
                    {missingFields.length > 2 ? ` +${missingFields.length - 2}` : ''}
                  </span>
                </div>
              ) : null}

              {/* Category Badge */}
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                {calc.category}
              </div>
            </button>
          )
        })}
      </div>

      {/* Calculation History */}
      {history && history.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Hesaplama Geçmişi</h3>
          <div className="space-y-3">
            {history.slice(0, 10).map((result) => {
              const calcMeta = CALCULATOR_METADATA[result.calculator_type as CalculatorType]
              return (
                <div
                  key={result.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                      style={{ backgroundColor: `${calcMeta?.color || '#3b82f6'}20` }}
                    >
                      {calcMeta?.icon || '🧮'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{calcMeta?.name || result.calculator_type}</p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(result.created_at), 'dd MMMM yyyy, HH:mm', { locale: tr })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg text-gray-900">
                      Skor: {result.score !== null ? result.score : 'N/A'}
                    </p>
                    {result.risk_category && (
                      <p className="text-xs text-gray-600 capitalize">{result.risk_category} risk</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}

