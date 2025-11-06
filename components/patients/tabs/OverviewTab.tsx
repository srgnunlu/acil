'use client'

import { PatientData, PatientTest, AIAnalysis } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

interface OverviewTabProps {
  patientId: string
  patientData: PatientData[]
  tests: PatientTest[]
  analyses: AIAnalysis[]
}

export function OverviewTab({
  patientId,
  patientData,
  tests,
  analyses,
}: OverviewTabProps) {
  const latestAnalysis = analyses[0]

  // Son vital bulguları al
  const latestVitals = patientData.find((d) => d.data_type === 'vital_signs')

  // Son anamnezi al
  const latestAnamnesis = patientData.find((d) => d.data_type === 'anamnesis')

  return (
    <div className="space-y-6">
      {/* Timeline */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Hasta Zaman Çizelgesi
        </h2>

        {patientData.length === 0 && tests.length === 0 && analyses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Henüz hasta verisi eklenmedi.</p>
            <p className="text-sm mt-2">
              "Hasta Bilgileri" sekmesinden veri eklemeye başlayın.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Combine all events and sort by date */}
            {[
              ...patientData.map((d) => ({
                type: 'data',
                data: d,
                date: d.created_at,
              })),
              ...tests.map((t) => ({
                type: 'test',
                data: t,
                date: t.created_at,
              })),
              ...analyses.map((a) => ({
                type: 'analysis',
                data: a,
                date: a.created_at,
              })),
            ]
              .sort(
                (a, b) =>
                  new Date(b.date).getTime() - new Date(a.date).getTime()
              )
              .slice(0, 10)
              .map((event, idx) => (
                <div key={idx} className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      {event.type === 'data' && '📋'}
                      {event.type === 'test' && '🔬'}
                      {event.type === 'analysis' && '🤖'}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {event.type === 'data' &&
                        `${
                          {
                            anamnesis: 'Anamnez',
                            medications: 'İlaçlar',
                            vital_signs: 'Vital Bulgular',
                            demographics: 'Demografik Bilgi',
                            history: 'Özgeçmiş',
                          }[
                            (event.data as PatientData).data_type as string
                          ]
                        } eklendi`}
                      {event.type === 'test' &&
                        `${(event.data as PatientTest).test_type} sonucu eklendi`}
                      {event.type === 'analysis' && 'AI Analizi yapıldı'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(event.date), {
                        addSuffix: true,
                        locale: tr,
                      })}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Quick Info Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Vital Signs */}
        {latestVitals && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Son Vital Bulgular
            </h3>
            <div className="space-y-2">
              {Object.entries(latestVitals.content as Record<string, any>).map(
                ([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-600">{key}:</span>
                    <span className="font-medium text-gray-900">{value}</span>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* Latest Analysis Summary */}
        {latestAnalysis && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Son AI Analizi
            </h3>
            <div className="space-y-3">
              {latestAnalysis.ai_response.summary && (
                <p className="text-sm text-gray-700">
                  {latestAnalysis.ai_response.summary}
                </p>
              )}
              <div className="pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(latestAnalysis.created_at), {
                    addSuffix: true,
                    locale: tr,
                  })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Chief Complaint */}
        {latestAnamnesis && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Başvuru Şikayeti
            </h3>
            <p className="text-gray-700">
              {(latestAnamnesis.content as any)?.chief_complaint ||
                (latestAnamnesis.content as any)?.complaint ||
                'Belirtilmemiş'}
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            İstatistikler
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Toplam Veri:</span>
              <span className="font-semibold text-gray-900">
                {patientData.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tetkik Sayısı:</span>
              <span className="font-semibold text-gray-900">
                {tests.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">AI Analiz:</span>
              <span className="font-semibold text-gray-900">
                {analyses.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
