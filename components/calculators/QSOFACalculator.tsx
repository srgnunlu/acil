'use client'

import { useState } from 'react'
import { useCalculateScore } from '@/lib/hooks/useCalculators'
import type { qSOFAInput } from '@/types/calculator.types'

interface QSOFACalculatorProps {
  workspaceId: string
  patientId?: string
}

export default function QSOFACalculator({ workspaceId, patientId }: QSOFACalculatorProps) {
  const [input, setInput] = useState<qSOFAInput>({
    respiratory_rate: 18,
    altered_mentation: false,
    systolic_bp: 120,
  })

  const calculateMutation = useCalculateScore()

  // Calculate score
  let score = 0
  if (input.respiratory_rate >= 22) score++
  if (input.altered_mentation) score++
  if (input.systolic_bp <= 100) score++

  const handleCalculate = async () => {
    try {
      await calculateMutation.mutateAsync({
        workspace_id: workspaceId,
        patient_id: patientId,
        calculator_type: 'qsofa',
        input_data: input,
      })
    } catch (error) {
      console.error('Calculation failed:', error)
    }
  }

  const getRiskColor = () => {
    if (score >= 2) return 'bg-red-100 text-red-800 border-red-300'
    if (score === 1) return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    return 'bg-green-100 text-green-800 border-green-300'
  }

  const getRiskText = () => {
    if (score >= 2) return 'YÜKSEK RİSK - Acil değerlendirme gerekli'
    if (score === 1) return 'ORTA RİSK - Yakın takip'
    return 'DÜŞÜK RİSK'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">🚨 qSOFA Score (Quick SOFA)</h2>
        <p className="text-gray-600">Sepsis riski hızlı değerlendirme aracı</p>
      </div>

      {/* Criteria */}
      <div className="space-y-4">
        {/* Respiratory Rate */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">Solunum Sayısı (breaths/min)</label>
          <div className="flex items-center gap-4">
            <input
              type="number"
              value={input.respiratory_rate}
              onChange={(e) => setInput({ ...input, respiratory_rate: parseFloat(e.target.value) })}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
              max="60"
            />
            <div
              className={`px-3 py-2 rounded-lg font-medium ${
                input.respiratory_rate >= 22 ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {input.respiratory_rate >= 22 ? '+1 puan (≥22)' : '0 puan (<22)'}
            </div>
          </div>
        </div>

        {/* Altered Mentation */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={input.altered_mentation}
              onChange={(e) => setInput({ ...input, altered_mentation: e.target.checked })}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex-1">
              <span className="block text-sm font-medium text-gray-900">Bilinç Değişikliği (Altered Mentation)</span>
              <span className="block text-xs text-gray-600 mt-1">GCS &lt;15 veya mental durum değişikliği</span>
            </div>
            <div
              className={`px-3 py-2 rounded-lg font-medium ${
                input.altered_mentation ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {input.altered_mentation ? '+1 puan' : '0 puan'}
            </div>
          </label>
        </div>

        {/* Systolic BP */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">Sistolik Kan Basıncı (mmHg)</label>
          <div className="flex items-center gap-4">
            <input
              type="number"
              value={input.systolic_bp}
              onChange={(e) => setInput({ ...input, systolic_bp: parseFloat(e.target.value) })}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
              max="250"
            />
            <div
              className={`px-3 py-2 rounded-lg font-medium ${
                input.systolic_bp <= 100 ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {input.systolic_bp <= 100 ? '+1 puan (≤100)' : '0 puan (>100)'}
            </div>
          </div>
        </div>
      </div>

      {/* Result */}
      <div className={`p-6 rounded-lg border-2 ${getRiskColor()}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-lg font-semibold">qSOFA Skoru</span>
          <span className="text-4xl font-bold">{score}/3</span>
        </div>
        <p className="text-sm font-medium">{getRiskText()}</p>
      </div>

      {/* Clinical Interpretation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Klinik Yorum</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          {score >= 2 && (
            <>
              <li>• Yüksek sepsis riski - Acil sepsis protokolü başlatılmalı</li>
              <li>• Kan kültürü alınmalı ve geniş spektrumlu antibiyotik başlanmalı</li>
              <li>• Laktat ölçümü ve sıvı resüsitasyonu değerlendirilmeli</li>
              <li>• Organ yetmezliği açısından yakın takip gerekli</li>
            </>
          )}
          {score === 1 && (
            <>
              <li>• Orta risk - Yakın klinik takip önerilir</li>
              <li>• Vital bulgular sık kontrol edilmeli</li>
              <li>• Klinik kötüleşme açısından izlem</li>
              <li>• Enfeksiyon odağı araştırılmalı</li>
            </>
          )}
          {score === 0 && (
            <>
              <li>• Düşük sepsis riski</li>
              <li>• Rutin takip yeterli</li>
              <li>• Klinik şüphe devam ederse detaylı değerlendirme</li>
            </>
          )}
        </ul>
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
              respiratory_rate: 18,
              altered_mentation: false,
              systolic_bp: 120,
            })
          }
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          Sıfırla
        </button>
      </div>

      {/* Reference */}
      <div className="text-xs text-gray-500 p-4 bg-gray-50 rounded-lg">
        <strong>Referans:</strong> Singer M, et al. The Third International Consensus Definitions for Sepsis and
        Septic Shock (Sepsis-3). JAMA. 2016;315(8):801-810.
      </div>
    </div>
  )
}
