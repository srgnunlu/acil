'use client'

import { PatientTest } from '@/types'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Clock, AlertCircle } from 'lucide-react'
import { useState } from 'react'

interface LesionImageCardProps {
  test: PatientTest
}

export function LesionImageCard({ test }: LesionImageCardProps) {
  const [imageExpanded, setImageExpanded] = useState(false)
  const results = test.results as any
  const symptoms = results?.symptoms || 'Belirtilmedi'
  const aiAnalysis = results?.ai_analysis || {}
  const imageUrl = test.images?.[0] || ''

  return (
    <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-lg border-2 border-blue-200 overflow-hidden">
      {/* Header with timestamp */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
        <div className="flex items-center justify-between text-white">
          <h3 className="font-semibold text-lg">Lezyon Görsel Analizi</h3>
          <div className="flex items-center space-x-2 text-sm bg-white/20 px-3 py-1 rounded-full">
            <Clock className="h-4 w-4" />
            <span>
              {format(new Date(test.created_at), 'd MMMM yyyy, HH:mm', { locale: tr })}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Patient Symptoms */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
            <span className="mr-2">📋</span>
            Hasta Şikayetleri ve Semptomlar
          </h4>
          <p className="text-gray-700 text-sm whitespace-pre-wrap">{symptoms}</p>
        </div>

        {/* Image Display */}
        {imageUrl && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <span className="mr-2">📸</span>
              Lezyon Görseli
            </h4>
            <div className="relative">
              <img
                src={imageUrl}
                alt="Lezyon görseli"
                className={`w-full rounded-lg shadow-md border-2 border-gray-300 cursor-pointer transition-all ${
                  imageExpanded ? 'max-h-none' : 'max-h-96 object-contain'
                }`}
                onClick={() => setImageExpanded(!imageExpanded)}
              />
              <button
                onClick={() => setImageExpanded(!imageExpanded)}
                className="absolute bottom-2 right-2 bg-black/70 text-white px-3 py-1 rounded-full text-xs hover:bg-black/90 transition"
              >
                {imageExpanded ? '🔽 Küçült' : '🔼 Büyüt'}
              </button>
            </div>
          </div>
        )}

        {/* AI Analysis */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-sm border-2 border-purple-200 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3">
            <div className="flex items-center text-white">
              <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center mr-3">
                <span className="text-lg">🤖</span>
              </div>
              <div>
                <h4 className="font-semibold">Yapay Zeka Klinik Yorumu</h4>
                <p className="text-xs opacity-90">Gemini Vision API</p>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {Object.keys(aiAnalysis).length > 0 ? (
              Object.entries(aiAnalysis).map(([key, value]) => (
                <div key={key} className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="font-semibold text-purple-900 text-sm uppercase tracking-wide mb-2">
                    {key.replace(/_/g, ' ')}
                  </p>
                  <div className="text-gray-800 text-sm whitespace-pre-wrap">
                    {typeof value === 'object' ? (
                      <pre className="font-mono text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                        {JSON.stringify(value, null, 2)}
                      </pre>
                    ) : (
                      String(value)
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-600 text-sm text-center py-4">
                Analiz bilgisi bulunamadı
              </p>
            )}

            {/* Disclaimer */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-800 leading-relaxed">
                  <strong>Önemli Not:</strong> Bu yapay zeka analizi yalnızca bilgilendirme ve
                  yardımcı karar destek aracı olarak kullanılmalıdır. Kesin tanı ve tedavi
                  planlaması için mutlaka hekim değerlendirmesi gereklidir.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Metadata footer */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-200">
          <span>Kayıt ID: {test.id.slice(0, 8)}...</span>
          <span>Hasta ID: {test.patient_id.slice(0, 8)}...</span>
        </div>
      </div>
    </div>
  )
}
