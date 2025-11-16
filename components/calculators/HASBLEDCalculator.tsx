'use client'

import { useState } from 'react'
import { useCalculateScore } from '@/lib/hooks/useCalculators'
import type { HASBLEDInput } from '@/types/calculator.types'

interface HASBLEDCalculatorProps {
  workspaceId: string
  patientId?: string
}

export default function HASBLEDCalculator({ workspaceId, patientId }: HASBLEDCalculatorProps) {
  const [input, setInput] = useState<HASBLEDInput>({
    hypertension_uncontrolled: false,
    renal_disease: false,
    liver_disease: false,
    stroke_history: false,
    prior_bleeding: false,
    labile_inr: false,
    elderly: false,
    drugs_predisposing: false,
    alcohol_excess: false,
  })

  const calculateMutation = useCalculateScore()

  // Calculate score
  const score = Object.values(input).filter(Boolean).length

  const handleCalculate = async () => {
    try {
      await calculateMutation.mutateAsync({
        workspace_id: workspaceId,
        patient_id: patientId,
        calculator_type: 'hasbled',
        input_data: input,
      })
    } catch (error) {
      console.error('Calculation failed:', error)
    }
  }

  const getRiskColor = () => {
    if (score >= 4) return 'bg-red-100 text-red-800 border-red-300'
    if (score === 3) return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    return 'bg-green-100 text-green-800 border-green-300'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">💉 HAS-BLED Score</h2>
        <p className="text-gray-600">Antikoagülasyon tedavisinde kanama riski</p>
      </div>

      {/* Criteria Checkboxes */}
      <div className="space-y-3">
        {[
          {
            key: 'hypertension_uncontrolled',
            label: 'H - Kontrolsüz Hipertansiyon',
            description: 'Sistolik >160 mmHg',
          },
          {
            key: 'renal_disease',
            label: 'A - Renal Hastalık',
            description: 'Diyaliz, transplant, kreatinin >200 μmol/L',
          },
          {
            key: 'liver_disease',
            label: 'S - Karaciğer Hastalığı',
            description: 'Siroz veya bilirubin >2x ULN + AST/ALT >3x ULN',
          },
          { key: 'stroke_history', label: 'B - Stroke Öyküsü', description: 'Geçirilmiş stroke' },
          {
            key: 'prior_bleeding',
            label: 'L - Kanama Öyküsü',
            description: 'Önceki major kanama veya anemi',
          },
          { key: 'labile_inr', label: 'E - Labil INR', description: 'Terapötik aralıkta <60% zaman' },
          { key: 'elderly', label: 'D - Yaşlı', description: '>65 yaş' },
          {
            key: 'drugs_predisposing',
            label: 'D - İlaç Kullanımı',
            description: 'Antiplatelet veya NSAID',
          },
          { key: 'alcohol_excess', label: 'D - Alkol Kullanımı', description: '≥8 içki/hafta' },
        ].map((item) => (
          <label
            key={item.key}
            className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
          >
            <input
              type="checkbox"
              checked={input[item.key as keyof HASBLEDInput] as boolean}
              onChange={(e) => setInput({ ...input, [item.key]: e.target.checked })}
              className="w-5 h-5 text-blue-600 rounded mt-0.5"
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">{item.label}</div>
              <div className="text-xs text-gray-600 mt-0.5">{item.description}</div>
            </div>
            <span className="text-sm text-gray-600">+1</span>
          </label>
        ))}
      </div>

      {/* Result */}
      <div className={`p-6 rounded-lg border-2 ${getRiskColor()}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-lg font-semibold">HAS-BLED Skoru</span>
          <span className="text-4xl font-bold">{score}/9</span>
        </div>
        <p className="text-sm">
          {score <= 2 && 'Düşük kanama riski - Antikoagülasyon güvenli'}
          {score === 3 && 'Orta kanama riski - Dikkatli antikoagülasyon'}
          {score >= 4 && '⚠️ Yüksek kanama riski - Risk/fayda değerlendirmesi gerekli'}
        </p>
      </div>

      {/* Clinical Interpretation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Klinik Yorum</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          {score >= 4 ? (
            <>
              <li>• Yüksek kanama riski mevcut</li>
              <li>• Antikoagülasyon dikkatle kullanılmalı</li>
              <li>• Modifiye edilebilir risk faktörleri düzeltilmeli</li>
              <li>• Sık INR takibi gerekli</li>
              <li>• Risk/fayda analizi yapılmalı</li>
            </>
          ) : score === 3 ? (
            <>
              <li>• Orta kanama riski</li>
              <li>• Dikkatli antikoagülasyon önerilir</li>
              <li>• Risk faktörlerini azaltmaya çalışın</li>
              <li>• Düzenli takip önemli</li>
            </>
          ) : (
            <>
              <li>• Düşük kanama riski</li>
              <li>• Antikoagülasyon güvenli</li>
              <li>• Rutin takip yeterli</li>
            </>
          )}
        </ul>
      </div>

      {/* Important Note */}
      {score >= 3 && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
          <p className="text-sm text-yellow-900">
            <strong>⚠️ Önemli:</strong> HAS-BLED skoru yüksek olması antikoagülasyon için kontrendikasyon DEĞİLDİR.
            Sadece daha dikkatli takip ve modifiye edilebilir risk faktörlerinin düzeltilmesi gerektiğini gösterir.
          </p>
        </div>
      )}

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
        <button
          onClick={() =>
            setInput({
              hypertension_uncontrolled: false,
              renal_disease: false,
              liver_disease: false,
              stroke_history: false,
              prior_bleeding: false,
              labile_inr: false,
              elderly: false,
              drugs_predisposing: false,
              alcohol_excess: false,
            })
          }
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
        >
          Sıfırla
        </button>
      </div>

      {/* Reference */}
      <div className="text-xs text-gray-500 p-4 bg-gray-50 rounded-lg">
        <strong>Referans:</strong> Pisters R, et al. A novel user-friendly score (HAS-BLED) to assess 1-year risk of
        major bleeding in patients with atrial fibrillation. Chest. 2010;138(5):1093-100.
      </div>
    </div>
  )
}
