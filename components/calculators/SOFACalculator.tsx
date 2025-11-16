'use client'

import { useState, useEffect } from 'react'
import { useCalculateScore } from '@/lib/hooks/useCalculators'
import { autoFillCalculator } from '@/lib/calculators/auto-fill'
import type { SOFAInput } from '@/types/calculator.types'
import type { Patient, PatientData, PatientTest } from '@/types'

interface SOFACalculatorProps {
  workspaceId: string
  patientId?: string
  patient?: Patient
  patientData?: PatientData[]
  tests?: PatientTest[]
}

export default function SOFACalculator({
  workspaceId,
  patientId,
  patient,
  patientData = [],
  tests = [],
}: SOFACalculatorProps) {
  const [input, setInput] = useState<SOFAInput>({
    pao2_fio2_ratio: null,
    mechanical_ventilation: false,
    platelets: 200,
    bilirubin: 1.0,
    mean_arterial_pressure: 80,
    vasopressors: false,
    dopamine_dose: null,
    dobutamine_dose: null,
    epinephrine_dose: null,
    norepinephrine_dose: null,
    glasgow_coma_scale: 15,
    creatinine: 1.0,
    urine_output: null,
  })

  // Auto-fill from patient data
  useEffect(() => {
    if (patient && patientData.length > 0) {
      const autoFilled = autoFillCalculator('sofa', patient, patientData, tests) as Partial<SOFAInput>
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInput((prev) => ({
        ...prev,
        // Only update fields that are actually provided, preserving existing values for undefined
        ...Object.fromEntries(
          Object.entries(autoFilled).filter(([, value]) => value !== undefined)
        ),
      }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient, patientData, tests])

  const calculateMutation = useCalculateScore()

  // Calculate score (simplified client-side calculation)
  let totalScore = 0
  let respScore = 0
  let coagScore = 0
  let liverScore = 0
  let cvScore = 0
  let cnsScore = 0
  let renalScore = 0

  if (input.pao2_fio2_ratio) {
    if (input.pao2_fio2_ratio < 100) respScore = 4
    else if (input.pao2_fio2_ratio < 200) respScore = input.mechanical_ventilation ? 3 : 2
    else if (input.pao2_fio2_ratio < 300) respScore = 2
    else if (input.pao2_fio2_ratio < 400) respScore = 1
  }
  totalScore += respScore

  if (input.platelets < 20) coagScore = 4
  else if (input.platelets < 50) coagScore = 3
  else if (input.platelets < 100) coagScore = 2
  else if (input.platelets < 150) coagScore = 1
  totalScore += coagScore

  if (input.bilirubin >= 12) liverScore = 4
  else if (input.bilirubin >= 6) liverScore = 3
  else if (input.bilirubin >= 2) liverScore = 2
  else if (input.bilirubin >= 1.2) liverScore = 1
  totalScore += liverScore

  if (input.mean_arterial_pressure < 70) {
    if (input.vasopressors) cvScore = 3
    else cvScore = 1
  }
  totalScore += cvScore

  const gcs = input.glasgow_coma_scale
  if (gcs < 6) cnsScore = 4
  else if (gcs < 10) cnsScore = 3
  else if (gcs < 13) cnsScore = 2
  else if (gcs < 15) cnsScore = 1
  totalScore += cnsScore

  if (input.creatinine >= 5) renalScore = 4
  else if (input.creatinine >= 3.5) renalScore = 3
  else if (input.creatinine >= 2) renalScore = 2
  else if (input.creatinine >= 1.2) renalScore = 1
  totalScore += renalScore

  const handleCalculate = async () => {
    try {
      await calculateMutation.mutateAsync({
        workspace_id: workspaceId,
        patient_id: patientId,
        calculator_type: 'sofa',
        input_data: input,
      })
    } catch (error) {
      console.error('Calculation failed:', error)
    }
  }

  const getRiskColor = () => {
    if (totalScore >= 15) return 'bg-red-100 text-red-800 border-red-300'
    if (totalScore >= 10) return 'bg-orange-100 text-orange-800 border-orange-300'
    if (totalScore >= 6) return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    return 'bg-green-100 text-green-800 border-green-300'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">🫁 SOFA Score (Sequential Organ Failure Assessment)</h2>
        <p className="text-gray-600">Organ yetmezliği değerlendirme skalası</p>
      </div>

      {/* Respiration */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">Solunum Sistemi</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">PaO₂/FiO₂ Oranı</label>
            <input
              type="number"
              value={input.pao2_fio2_ratio ?? ''}
              onChange={(e) =>
                setInput({ ...input, pao2_fio2_ratio: e.target.value ? parseFloat(e.target.value) : null })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Örn: 300"
            />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              checked={input.mechanical_ventilation}
              onChange={(e) => setInput({ ...input, mechanical_ventilation: e.target.checked })}
              className="w-4 h-4"
            />
            <label className="text-sm text-gray-700">Mekanik Ventilasyon</label>
          </div>
        </div>
        <div className="text-xs text-gray-500">Skor: {respScore}</div>
      </div>

      {/* Coagulation */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">Koagülasyon</label>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Trombosit (x1000/mm³)</label>
            <input
              type="number"
              value={input.platelets ?? ''}
              onChange={(e) => setInput({ ...input, platelets: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        <div className="text-xs text-gray-500">Skor: {coagScore}</div>
      </div>

      {/* Liver */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">Karaciğer</label>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Bilirubin (mg/dL)</label>
            <input
              type="number"
              step="0.1"
              value={input.bilirubin ?? ''}
              onChange={(e) => setInput({ ...input, bilirubin: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        <div className="text-xs text-gray-500">Skor: {liverScore}</div>
      </div>

      {/* Cardiovascular */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">Kardiyovasküler Sistem</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Ortalama Arteriyel Basınç (mmHg)</label>
            <input
              type="number"
              value={input.mean_arterial_pressure ?? ''}
              onChange={(e) => setInput({ ...input, mean_arterial_pressure: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              checked={input.vasopressors}
              onChange={(e) => setInput({ ...input, vasopressors: e.target.checked })}
              className="w-4 h-4"
            />
            <label className="text-sm text-gray-700">Vazopressor Kullanımı</label>
          </div>
        </div>
        <div className="text-xs text-gray-500">Skor: {cvScore}</div>
      </div>

      {/* CNS */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">Santral Sinir Sistemi</label>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Glasgow Coma Scale</label>
            <input
              type="number"
              min="3"
              max="15"
              value={input.glasgow_coma_scale ?? ''}
              onChange={(e) => setInput({ ...input, glasgow_coma_scale: parseInt(e.target.value) || 15 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        <div className="text-xs text-gray-500">Skor: {cnsScore}</div>
      </div>

      {/* Renal */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">Böbrek</label>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Kreatinin (mg/dL)</label>
            <input
              type="number"
              step="0.1"
              value={input.creatinine ?? ''}
              onChange={(e) => setInput({ ...input, creatinine: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        <div className="text-xs text-gray-500">Skor: {renalScore}</div>
      </div>

      {/* Result */}
      <div className={`rounded-lg border-2 p-6 ${getRiskColor()}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Toplam SOFA Skoru</h3>
          <span className="text-3xl font-bold">{totalScore}</span>
        </div>
        <div className="text-sm">
          <p>
            <strong>Solunum:</strong> {respScore} | <strong>Koagülasyon:</strong> {coagScore} |{' '}
            <strong>Karaciğer:</strong> {liverScore}
          </p>
          <p>
            <strong>Kardiyovasküler:</strong> {cvScore} | <strong>CNS:</strong> {cnsScore} |{' '}
            <strong>Böbrek:</strong> {renalScore}
          </p>
        </div>
        {totalScore >= 15 && (
          <p className="mt-2 font-semibold">⚠️ Yüksek mortalite riski - Acil değerlendirme gerekli</p>
        )}
        {totalScore >= 10 && totalScore < 15 && (
          <p className="mt-2 font-semibold">⚠️ Orta-yüksek mortalite riski - YBÜ takibi önerilir</p>
        )}
      </div>

      {/* Calculate Button */}
      <button
        onClick={handleCalculate}
        disabled={calculateMutation.isPending}
        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
      >
        {calculateMutation.isPending ? 'Kaydediliyor...' : 'Hesapla ve Kaydet'}
      </button>
    </div>
  )
}

