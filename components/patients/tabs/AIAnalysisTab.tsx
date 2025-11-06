'use client'

import { useState } from 'react'
import { PatientData, PatientTest, AIAnalysis } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { useRouter } from 'next/navigation'

interface AIAnalysisTabProps {
  patientId: string
  patientData: PatientData[]
  tests: PatientTest[]
  analyses: AIAnalysis[]
}

export function AIAnalysisTab({
  patientId,
  patientData,
  tests,
  analyses,
}: AIAnalysisTabProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const latestAnalysis = analyses[0]

  const handleAnalyze = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId,
          analysisType: analyses.length > 0 ? 'updated' : 'initial',
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Analiz yapılırken bir hata oluştu')
      }

      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const canAnalyze = patientData.length > 0 || tests.length > 0

  return (
    <div className="space-y-6">
      {/* Analyze Button */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              AI Destekli Hasta Analizi
            </h2>
            <p className="text-gray-600 mb-4">
              {canAnalyze
                ? analyses.length > 0
                  ? 'Hasta verilerinde değişiklik oldu. Yeni bir analiz yaparak güncellenmiş öneriler alın.'
                  : 'Hasta verilerini analiz ederek tanı önerileri, tetkik önerileri ve tedavi algoritması alın.'
                : 'Analiz yapabilmek için önce hasta bilgileri veya tetkik sonuçları eklemelisiniz.'}
            </p>
            {canAnalyze && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>📋 {patientData.length} veri</span>
                <span>•</span>
                <span>🔬 {tests.length} tetkik</span>
                {analyses.length > 0 && (
                  <>
                    <span>•</span>
                    <span>🤖 {analyses.length} analiz</span>
                  </>
                )}
              </div>
            )}
          </div>
          <button
            onClick={handleAnalyze}
            disabled={!canAnalyze || loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analiz Yapılıyor...
              </span>
            ) : (
              <span className="flex items-center">
                🤖 {analyses.length > 0 ? 'Yeniden Analiz Et' : 'Analiz Başlat'}
              </span>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Latest Analysis Results */}
      {latestAnalysis ? (
        <div className="space-y-6">
          {/* Analysis Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {latestAnalysis.analysis_type === 'initial'
                    ? 'İlk Değerlendirme'
                    : 'Güncellenmiş Analiz'}
                </h3>
                <p className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(latestAnalysis.created_at), {
                    addSuffix: true,
                    locale: tr,
                  })}
                </p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                AI Analizi
              </span>
            </div>

            {latestAnalysis.ai_response.summary && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <p className="text-gray-800">{latestAnalysis.ai_response.summary}</p>
              </div>
            )}
          </div>

          {/* Differential Diagnosis */}
          {latestAnalysis.ai_response.differential_diagnosis && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">🎯</span>
                Ayırıcı Tanılar
              </h3>
              <ul className="space-y-2">
                {latestAnalysis.ai_response.differential_diagnosis.map(
                  (diagnosis: string, idx: number) => (
                    <li
                      key={idx}
                      className="flex items-start p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="text-blue-600 font-semibold mr-3">
                        {idx + 1}.
                      </span>
                      <span className="text-gray-800">{diagnosis}</span>
                    </li>
                  )
                )}
              </ul>
            </div>
          )}

          {/* Red Flags */}
          {latestAnalysis.ai_response.red_flags &&
            latestAnalysis.ai_response.red_flags.length > 0 && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center">
                  <span className="mr-2">⚠️</span>
                  Dikkat! Kritik Bulgular
                </h3>
                <ul className="space-y-2">
                  {latestAnalysis.ai_response.red_flags.map(
                    (flag: string, idx: number) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-red-600 mr-2">•</span>
                        <span className="text-red-800 font-medium">{flag}</span>
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}

          {/* Recommended Tests */}
          {latestAnalysis.ai_response.recommended_tests && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">🔬</span>
                Önerilen Tetkikler
              </h3>
              <div className="space-y-3">
                {latestAnalysis.ai_response.recommended_tests.map(
                  (test: any, idx: number) => (
                    <div
                      key={idx}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-900">
                          {test.test || test}
                        </h4>
                        {test.priority && (
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              test.priority === 'urgent'
                                ? 'bg-red-100 text-red-800'
                                : test.priority === 'high'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {test.priority === 'urgent'
                              ? 'Acil'
                              : test.priority === 'high'
                              ? 'Yüksek'
                              : 'Rutin'}
                          </span>
                        )}
                      </div>
                      {test.rationale && (
                        <p className="text-sm text-gray-600">{test.rationale}</p>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Treatment Algorithm */}
          {latestAnalysis.ai_response.treatment_algorithm && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">💊</span>
                Tedavi Algoritması
              </h3>
              <div className="space-y-4">
                {latestAnalysis.ai_response.treatment_algorithm.immediate && (
                  <div>
                    <h4 className="font-semibold text-red-700 mb-2">
                      Acil Müdahale:
                    </h4>
                    <ul className="space-y-1">
                      {latestAnalysis.ai_response.treatment_algorithm.immediate.map(
                        (item: string, idx: number) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-red-600 mr-2">→</span>
                            <span className="text-gray-800">{item}</span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {latestAnalysis.ai_response.treatment_algorithm.monitoring && (
                  <div>
                    <h4 className="font-semibold text-blue-700 mb-2">
                      İzlem Parametreleri:
                    </h4>
                    <ul className="space-y-1">
                      {latestAnalysis.ai_response.treatment_algorithm.monitoring.map(
                        (item: string, idx: number) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-blue-600 mr-2">→</span>
                            <span className="text-gray-800">{item}</span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {latestAnalysis.ai_response.treatment_algorithm.medications && (
                  <div>
                    <h4 className="font-semibold text-green-700 mb-2">
                      İlaç Önerileri:
                    </h4>
                    <ul className="space-y-1">
                      {latestAnalysis.ai_response.treatment_algorithm.medications.map(
                        (item: string, idx: number) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-green-600 mr-2">→</span>
                            <span className="text-gray-800">{item}</span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Consultation */}
          {latestAnalysis.ai_response.consultation && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">👨‍⚕️</span>
                Konsültasyon Önerisi
              </h3>
              <div className="space-y-3">
                {latestAnalysis.ai_response.consultation.required && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="font-semibold text-yellow-900 mb-2">
                      Konsültasyon gerekli:{' '}
                      {latestAnalysis.ai_response.consultation.urgency ===
                      'urgent'
                        ? '⚡ ACİL'
                        : '📋 Rutin'}
                    </p>
                    {latestAnalysis.ai_response.consultation.departments && (
                      <p className="text-yellow-800 mb-2">
                        Bölümler:{' '}
                        {latestAnalysis.ai_response.consultation.departments.join(
                          ', '
                        )}
                      </p>
                    )}
                    {latestAnalysis.ai_response.consultation.reason && (
                      <p className="text-yellow-800">
                        Neden: {latestAnalysis.ai_response.consultation.reason}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Disposition */}
          {latestAnalysis.ai_response.disposition && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">🏥</span>
                Hasta Yönlendirme
              </h3>
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <p className="font-semibold text-indigo-900 mb-2">
                  Öneri:{' '}
                  {latestAnalysis.ai_response.disposition.recommendation ===
                  'hospitalize'
                    ? '🏥 Yatış'
                    : latestAnalysis.ai_response.disposition.recommendation ===
                      'observe'
                    ? '👁️ Gözlem'
                    : '🏠 Taburcu'}
                </p>
                {latestAnalysis.ai_response.disposition.criteria && (
                  <p className="text-indigo-800">
                    {latestAnalysis.ai_response.disposition.criteria}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* References */}
          {latestAnalysis.ai_response.references && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">📚</span>
                Akademik Kaynaklar
              </h3>
              <div className="space-y-3">
                {latestAnalysis.ai_response.references.map(
                  (ref: any, idx: number) => (
                    <div
                      key={idx}
                      className="border-l-4 border-gray-300 pl-4 py-2"
                    >
                      <p className="font-medium text-gray-900">{ref.title}</p>
                      <p className="text-sm text-gray-600">
                        {ref.source}
                        {ref.year && ` (${ref.year})`}
                      </p>
                      {ref.key_point && (
                        <p className="text-sm text-gray-700 mt-1">
                          → {ref.key_point}
                        </p>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">🤖</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Henüz AI analizi yapılmadı
          </h3>
          <p className="text-gray-600 mb-6">
            Hasta verilerini ekledikten sonra AI analizi yaparak kanıta dayalı
            öneriler alın
          </p>
        </div>
      )}

      {/* Previous Analyses */}
      {analyses.length > 1 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Önceki Analizler ({analyses.length - 1})
          </h3>
          <div className="space-y-2">
            {analyses.slice(1).map((analysis) => (
              <div
                key={analysis.id}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {analysis.analysis_type === 'initial'
                      ? 'İlk Değerlendirme'
                      : 'Güncellenmiş Analiz'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(analysis.created_at), {
                      addSuffix: true,
                      locale: tr,
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
