'use client'

import { useState } from 'react'
import { useCalculateScore } from '@/lib/hooks/useCalculators'
import type { CHADS2VAScInput } from '@/types/calculator.types'

interface CHADS2VAScCalculatorProps {
  workspaceId: string
  patientId?: string
}

export default function CHADS2VAScCalculator({ workspaceId, patientId }: CHADS2VAScCalculatorProps) {
  const [input, setInput] = useState<CHADS2VAScInput>({
    congestive_heart_failure: false,
    hypertension: false,
    age: 65,
    diabetes: false,
    prior_stroke_tia: false,
    vascular_disease: false,
    sex: 'male',
  })

  const calculateMutation = useCalculateScore()

  // Calculate score
  let score = 0
  if (input.congestive_heart_failure) score += 1
  if (input.hypertension) score += 1
  if (input.diabetes) score += 1
  if (input.prior_stroke_tia) score += 2
  if (input.vascular_disease) score += 1
  if (input.sex === 'female') score += 1
  if (input.age >= 75) score += 2
  else if (input.age >= 65) score += 1

  const handleCalculate = async () => {
    try {
      await calculateMutation.mutateAsync({
        workspace_id: workspaceId,
        patient_id: patientId,
        calculator_type: 'chads2vasc',
        input_data: input,
      })
    } catch (error) {
      console.error('Calculation failed:', error)
    }
  }

  const getRiskColor = () => {
    if (score >= 4) return 'bg-red-100 text-red-800 border-red-300'
    if (score >= 2) return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    return 'bg-green-100 text-green-800 border-green-300'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">❤️ CHA₂DS₂-VASc Score</h2>
        <p className="text-gray-600">Atrial fibrilasyonda stroke riski değerlendirmesi</p>
      </div>

      {/* Age Input */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-2">Yaş (Age)</label>
        <input
          type="number"
          value={input.age}
          onChange={(e) => setInput({ ...input, age: parseInt(e.target.value) || 0 })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          min="18"
          max="120"
        />
        <p className="text-xs text-gray-500 mt-1">65-74 yaş: +1 puan | ≥75 yaş: +2 puan</p>
      </div>

      {/* Sex */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-2">Cinsiyet (Sex)</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={input.sex === 'male'}
              onChange={() => setInput({ ...input, sex: 'male' })}
              className="w-4 h-4 text-blue-600"
            />
            <span>Erkek (0 puan)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={input.sex === 'female'}
              onChange={() => setInput({ ...input, sex: 'female' })}
              className="w-4 h-4 text-blue-600"
            />
            <span>Kadın (+1 puan)</span>
          </label>
        </div>
      </div>

      {/* Checkboxes */}
      <div className="space-y-3">
        {[
          { key: 'congestive_heart_failure', label: 'Kalp Yetmezliği (Congestive HF)', points: 1 },
          { key: 'hypertension', label: 'Hipertansiyon', points: 1 },
          { key: 'diabetes', label: 'Diyabet', points: 1 },
          { key: 'prior_stroke_tia', label: 'Önceki Stroke/TIA', points: 2 },
          { key: 'vascular_disease', label: 'Vasküler Hastalık (MI, PAD, aortik plak)', points: 1 },
        ].map((item) => (
          <label
            key={item.key}
            className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
          >
            <input
              type="checkbox"
              checked={input[item.key as keyof CHADS2VAScInput] as boolean}
              onChange={(e) => setInput({ ...input, [item.key]: e.target.checked })}
              className="w-5 h-5 text-blue-600 rounded"
            />
            <span className="flex-1 text-sm font-medium text-gray-900">{item.label}</span>
            <span className="text-sm text-gray-600">+{item.points} puan</span>
          </label>
        ))}
      </div>

      {/* Result */}
      <div className={`p-6 rounded-lg border-2 ${getRiskColor()}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-lg font-semibold">CHA₂DS₂-VASc Skoru</span>
          <span className="text-4xl font-bold">{score}/9</span>
        </div>
        <p className="text-sm">
          {score === 0 && 'Çok düşük risk - Antikoagülasyon önerilmez'}
          {score === 1 && 'Düşük risk - Antikoagülasyon düşünülebilir'}
          {score >= 2 && score < 4 && 'Orta risk - Antikoagülasyon önerilir'}
          {score >= 4 && 'Yüksek risk - Antikoagülasyon şiddetle önerilir'}
        </p>
      </div>

      {/* Calculation Result */}
      {calculateMutation.isSuccess && calculateMutation.data && (
        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
          <h3 className="font-semibold text-green-900 mb-2">✓ Hesaplama Kaydedildi</h3>
          <p className="text-sm text-green-800 mb-2">
            {calculateMutation.data.calculation_details.interpretation}
          </p>
          <p className="text-sm text-green-800">{calculateMutation.data.calculation_details.recommendations}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleCalculate}
          disabled={calculateMutation.isPending}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {calculateMutation.isPending ? 'Kaydediliyor...' : 'Hesapla ve Kaydet'}
        </button>
      </div>
    </div>
  )
}
