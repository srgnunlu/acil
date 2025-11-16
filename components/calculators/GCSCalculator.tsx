'use client'

import { useState, useEffect } from 'react'
import { useCalculateScore } from '@/lib/hooks/useCalculators'
import { autoFillCalculator } from '@/lib/calculators/auto-fill'
import type { GCSInput, GCSEyeResponse, GCSVerbalResponse, GCSMotorResponse } from '@/types/calculator.types'
import type { Patient, PatientData, PatientTest } from '@/types'

interface GCSCalculatorProps {
  workspaceId: string
  patientId?: string
  patient?: Patient
  patientData?: PatientData[]
  tests?: PatientTest[]
}

export default function GCSCalculator({
  workspaceId,
  patientId,
  patient,
  patientData = [],
  tests = [],
}: GCSCalculatorProps) {
  const [input, setInput] = useState<GCSInput>({
    eye_response: 4,
    verbal_response: 5,
    motor_response: 6,
  })

  // Auto-fill from patient data
  useEffect(() => {
    if (patient && patientData.length > 0) {
      const autoFilled = autoFillCalculator('gcs', patient, patientData, tests) as Partial<GCSInput>
      if (autoFilled.eye_response || autoFilled.verbal_response || autoFilled.motor_response) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setInput((prev) => ({
          ...prev,
          ...autoFilled,
        }))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient, patientData, tests])

  const calculateMutation = useCalculateScore()

  const totalScore = input.eye_response + input.verbal_response + input.motor_response

  const handleCalculate = async () => {
    try {
      await calculateMutation.mutateAsync({
        workspace_id: workspaceId,
        patient_id: patientId,
        calculator_type: 'gcs',
        input_data: input,
      })
    } catch (error) {
      console.error('Calculation failed:', error)
    }
  }

  const getSeverityColor = () => {
    if (totalScore <= 8) return 'bg-red-100 text-red-800 border-red-300'
    if (totalScore <= 12) return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    return 'bg-green-100 text-green-800 border-green-300'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">🧠 Glasgow Coma Scale (GCS)</h2>
        <p className="text-gray-600">Bilinç düzeyi değerlendirme skalası</p>
      </div>

      {/* Eye Response */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">Göz Açma (Eye Response)</label>
        <div className="grid grid-cols-1 gap-2">
          {[
            { value: 4, label: '4 - Spontan (Spontaneous)' },
            { value: 3, label: '3 - Sözel uyarana (To verbal command)' },
            { value: 2, label: '2 - Ağrılı uyarana (To pain)' },
            { value: 1, label: '1 - Yok (None)' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setInput({ ...input, eye_response: option.value as GCSEyeResponse })}
              className={`p-3 rounded-lg border-2 text-left transition-colors ${
                input.eye_response === option.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Verbal Response */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">Sözel Yanıt (Verbal Response)</label>
        <div className="grid grid-cols-1 gap-2">
          {[
            { value: 5, label: '5 - Oryante (Oriented)' },
            { value: 4, label: '4 - Konfüze (Confused)' },
            { value: 3, label: '3 - İlgisiz kelimeler (Inappropriate words)' },
            { value: 2, label: '2 - Anlaşılmaz sesler (Incomprehensible sounds)' },
            { value: 1, label: '1 - Yok (None)' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setInput({ ...input, verbal_response: option.value as GCSVerbalResponse })}
              className={`p-3 rounded-lg border-2 text-left transition-colors ${
                input.verbal_response === option.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Motor Response */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">Motor Yanıt (Motor Response)</label>
        <div className="grid grid-cols-1 gap-2">
          {[
            { value: 6, label: '6 - Komuta uyar (Obeys commands)' },
            { value: 5, label: '5 - Ağrıyı lokalize eder (Localizes pain)' },
            { value: 4, label: '4 - Ağrıdan kaçınır (Withdrawal from pain)' },
            { value: 3, label: '3 - Fleksiyon (Flexion to pain)' },
            { value: 2, label: '2 - Ekstansiyon (Extension to pain)' },
            { value: 1, label: '1 - Yok (None)' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setInput({ ...input, motor_response: option.value as GCSMotorResponse })}
              className={`p-3 rounded-lg border-2 text-left transition-colors ${
                input.motor_response === option.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Result */}
      <div className={`p-6 rounded-lg border-2 ${getSeverityColor()}`}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-lg font-semibold">Toplam GCS Skoru</span>
          <span className="text-4xl font-bold">{totalScore}</span>
        </div>
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span>Göz Açma:</span>
            <span className="font-medium">{input.eye_response}</span>
          </div>
          <div className="flex justify-between">
            <span>Sözel Yanıt:</span>
            <span className="font-medium">{input.verbal_response}</span>
          </div>
          <div className="flex justify-between">
            <span>Motor Yanıt:</span>
            <span className="font-medium">{input.motor_response}</span>
          </div>
        </div>
      </div>

      {/* Calculation Result */}
      {calculateMutation.isSuccess && calculateMutation.data && (
        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
          <h3 className="font-semibold text-green-900 mb-2">✓ Hesaplama Kaydedildi</h3>
          <p className="text-sm text-green-800 mb-2">
            <strong>Yorum:</strong> {calculateMutation.data.calculation_details.interpretation}
          </p>
          <p className="text-sm text-green-800">
            <strong>Öneriler:</strong> {calculateMutation.data.calculation_details.recommendations}
          </p>
        </div>
      )}

      {/* Error */}
      {calculateMutation.isError && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
          <p className="text-sm text-red-800">
            ⚠️ Hesaplama kaydedilemedi: {(calculateMutation.error as Error).message}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleCalculate}
          disabled={calculateMutation.isPending}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {calculateMutation.isPending ? 'Kaydediliyor...' : 'Hesapla ve Kaydet'}
        </button>
        <button
          onClick={() =>
            setInput({
              eye_response: 4,
              verbal_response: 5,
              motor_response: 6,
            })
          }
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          Sıfırla
        </button>
      </div>

      {/* Reference */}
      <div className="text-xs text-gray-500 p-4 bg-gray-50 rounded-lg">
        <strong>Referans:</strong> Teasdale G, Jennett B. Assessment of coma and impaired consciousness. Lancet.
        1974;2(7872):81-84.
      </div>
    </div>
  )
}
