'use client'

import { useState } from 'react'
import { PatientData, PatientTest, AIAnalysis } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

interface OverviewTabProps {
  patientId: string
  patientData: PatientData[]
  tests: PatientTest[]
  analyses: AIAnalysis[]
}

export function OverviewTab({ patientId, patientData, tests, analyses }: OverviewTabProps) {
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'data' | 'test' | 'analysis'>('all')
  const [showAllTimeline, setShowAllTimeline] = useState(false)

  const latestAnalysis = analyses[0]

  // Son vital bulguları al
  const latestVitals = patientData.find((d) => d.data_type === 'vital_signs')

  // Son anamnezi al
  const latestAnamnesis = patientData.find((d) => d.data_type === 'anamnesis')

  // Timeline event color mapping
  const getEventColor = (type: string) => {
    const colors = {
      anamnesis: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      medications: 'bg-purple-100 text-purple-800 border-purple-300',
      vital_signs: 'bg-red-100 text-red-800 border-red-300',
      demographics: 'bg-gray-100 text-gray-800 border-gray-300',
      history: 'bg-blue-100 text-blue-800 border-blue-300',
      test: 'bg-blue-100 text-blue-800 border-blue-300',
      analysis: 'bg-green-100 text-green-800 border-green-300',
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-300'
  }

  // Get icon for event type
  const getEventIcon = (type: string, subtype?: string) => {
    if (type === 'data') {
      const icons = {
        anamnesis: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
        medications: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        ),
        vital_signs: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        ),
        demographics: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        ),
        history: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        ),
      }
      return icons[subtype as keyof typeof icons] || icons.history
    } else if (type === 'test') {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      )
    } else {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    }
  }

  // Combine and filter timeline events
  const allEvents = [
    ...patientData.map((d) => ({
      type: 'data',
      subtype: d.data_type,
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
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const filteredEvents = timelineFilter === 'all'
    ? allEvents
    : allEvents.filter(e => e.type === timelineFilter)

  const displayedEvents = showAllTimeline ? filteredEvents : filteredEvents.slice(0, 10)

  return (
    <div className="space-y-6">
      {/* Enhanced Timeline */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Hasta Zaman Çizelgesi</h2>

          {/* Timeline Filters */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setTimelineFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                timelineFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Tümü ({allEvents.length})
            </button>
            <button
              onClick={() => setTimelineFilter('data')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                timelineFilter === 'data'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Veri ({patientData.length})
            </button>
            <button
              onClick={() => setTimelineFilter('test')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                timelineFilter === 'test'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Test ({tests.length})
            </button>
            <button
              onClick={() => setTimelineFilter('analysis')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                timelineFilter === 'analysis'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              AI ({analyses.length})
            </button>
          </div>
        </div>

        {displayedEvents.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Henüz veri eklenmedi
            </h3>
            <p className="text-gray-600 text-sm">
              &quot;Hasta Bilgileri&quot; sekmesinden veri eklemeye başlayın
            </p>
          </div>
        ) : (
          <>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-indigo-500 to-purple-500"></div>

              {/* Timeline events */}
              <div className="space-y-6">
                {displayedEvents.map((event, idx) => (
                  <div key={idx} className="relative flex items-start space-x-4 group">
                    {/* Timeline dot */}
                    <div className={`relative z-10 flex-shrink-0 w-12 h-12 rounded-full border-4 border-white shadow-lg flex items-center justify-center ${
                      getEventColor(event.type === 'data' ? ('subtype' in event ? event.subtype : event.type) : event.type)
                    }`}>
                      {getEventIcon(event.type, 'subtype' in event ? event.subtype : undefined)}
                    </div>

                    {/* Event card */}
                    <div className="flex-1 bg-gray-50 rounded-lg p-4 border border-gray-200 group-hover:shadow-md group-hover:border-blue-300 transition-all">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">
                            {event.type === 'data' && 'subtype' in event &&
                              `${
                                {
                                  anamnesis: 'Anamnez',
                                  medications: 'İlaçlar',
                                  vital_signs: 'Vital Bulgular',
                                  demographics: 'Demografik Bilgi',
                                  history: 'Özgeçmiş',
                                }[event.subtype as string]
                              } eklendi`}
                            {event.type === 'test' &&
                              `${(event.data as PatientTest).test_type} sonucu eklendi`}
                            {event.type === 'analysis' && 'AI Analizi tamamlandı'}
                          </h4>

                          {/* Event preview */}
                          <div className="text-sm text-gray-600">
                            {event.type === 'data' && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {Object.entries((event.data as PatientData).content as Record<string, any>).slice(0, 2).map(([key, value]) => (
                                  <span key={key} className="inline-flex items-center px-2 py-1 bg-white rounded text-xs border border-gray-200">
                                    <span className="font-medium text-gray-700">{key}:</span>
                                    <span className="ml-1 text-gray-900">{String(value).slice(0, 30)}{String(value).length > 30 ? '...' : ''}</span>
                                  </span>
                                ))}
                              </div>
                            )}
                            {event.type === 'analysis' && (event.data as AIAnalysis).ai_response.summary && (
                              <p className="mt-2 text-gray-700 line-clamp-2">
                                {(event.data as AIAnalysis).ai_response.summary}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Timestamp badge */}
                        <span className="ml-4 flex-shrink-0 px-3 py-1 bg-white rounded-full text-xs font-medium text-gray-600 border border-gray-200">
                          {formatDistanceToNow(new Date(event.date), {
                            addSuffix: true,
                            locale: tr,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Show More/Less Button */}
            {filteredEvents.length > 10 && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => setShowAllTimeline(!showAllTimeline)}
                  className="px-6 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors"
                >
                  {showAllTimeline ? (
                    <>
                      <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                      Daha az göster
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      Tüm geçmişi göster ({filteredEvents.length - 10} daha fazla)
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Quick Info Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Enhanced Vital Signs */}
        {latestVitals && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Son Vital Bulgular
              </h3>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(latestVitals.created_at), {
                  addSuffix: true,
                  locale: tr,
                })}
              </span>
            </div>

            <div className="space-y-3">
              {Object.entries(latestVitals.content as Record<string, unknown>).map(
                ([key, value]) => {
                  // Define normal ranges and get status
                  const getVitalStatus = (vitalKey: string, vitalValue: any) => {
                    const numValue = typeof vitalValue === 'number' ? vitalValue : parseFloat(String(vitalValue))

                    if (isNaN(numValue)) {
                      return { status: 'unknown', color: 'bg-gray-100 text-gray-700 border-gray-300' }
                    }

                    const ranges: Record<string, { min: number; max: number; warningMin?: number; warningMax?: number }> = {
                      heart_rate: { min: 60, max: 100, warningMin: 50, warningMax: 110 },
                      spo2: { min: 95, max: 100, warningMin: 90, warningMax: 100 },
                      temperature: { min: 36.1, max: 37.2, warningMin: 35.5, warningMax: 38.0 },
                      gcs: { min: 15, max: 15, warningMin: 13, warningMax: 15 },
                      pain_score: { min: 0, max: 3, warningMin: 0, warningMax: 5 },
                    }

                    const range = ranges[vitalKey.toLowerCase()]
                    if (!range) {
                      return { status: 'unknown', color: 'bg-gray-100 text-gray-700 border-gray-300' }
                    }

                    if (numValue >= range.min && numValue <= range.max) {
                      return {
                        status: 'normal',
                        color: 'bg-green-50 text-green-700 border-green-300',
                        icon: '✓'
                      }
                    } else if (
                      (range.warningMin && numValue >= range.warningMin && numValue < range.min) ||
                      (range.warningMax && numValue > range.max && numValue <= range.warningMax)
                    ) {
                      return {
                        status: 'warning',
                        color: 'bg-yellow-50 text-yellow-700 border-yellow-300',
                        icon: '⚠️'
                      }
                    } else {
                      return {
                        status: 'critical',
                        color: 'bg-red-50 text-red-700 border-red-300 animate-pulse',
                        icon: '❌'
                      }
                    }
                  }

                  const vitalStatus = getVitalStatus(key, value)

                  return (
                    <div
                      key={key}
                      className={`flex items-center justify-between p-3 rounded-lg border-2 ${vitalStatus.color} transition-all`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-medium capitalize">
                          {key.replace(/_/g, ' ')}:
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-lg">
                          {String(value)}
                        </span>
                        {vitalStatus.icon && (
                          <span className="text-sm">{vitalStatus.icon}</span>
                        )}
                      </div>
                    </div>
                  )
                }
              )}
            </div>
          </div>
        )}

        {/* Enhanced AI Analysis */}
        {latestAnalysis && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm border border-green-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AI Klinik Değerlendirme
              </h3>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                AI
              </span>
            </div>

            <div className="space-y-4">
              {/* Risk Score (if available in analysis) */}
              {(latestAnalysis.ai_response as any).risk_score !== undefined && (
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Risk Skoru</span>
                    <span className={`text-lg font-bold ${
                      (latestAnalysis.ai_response as any).risk_score > 7 ? 'text-red-600' :
                      (latestAnalysis.ai_response as any).risk_score > 4 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {(latestAnalysis.ai_response as any).risk_score}/10
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all ${
                        (latestAnalysis.ai_response as any).risk_score > 7 ? 'bg-red-600' :
                        (latestAnalysis.ai_response as any).risk_score > 4 ? 'bg-yellow-600' :
                        'bg-green-600'
                      }`}
                      style={{ width: `${((latestAnalysis.ai_response as any).risk_score / 10) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* AI Summary */}
              {latestAnalysis.ai_response.summary && (
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <div className="flex items-start space-x-2">
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {latestAnalysis.ai_response.summary}
                    </p>
                  </div>
                </div>
              )}

              {/* Key Findings (if available) */}
              {(latestAnalysis.ai_response as any).findings && Array.isArray((latestAnalysis.ai_response as any).findings) && (latestAnalysis.ai_response as any).findings.length > 0 && (
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-1 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Öne Çıkan Bulgular
                  </h4>
                  <ul className="space-y-1 text-sm">
                    {(latestAnalysis.ai_response as any).findings.slice(0, 3).map((finding: string, idx: number) => (
                      <li key={idx} className="flex items-start text-gray-700">
                        <span className="text-green-600 mr-2">•</span>
                        <span>{finding}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations (if available) */}
              {(latestAnalysis.ai_response as any).recommendations && Array.isArray((latestAnalysis.ai_response as any).recommendations) && (latestAnalysis.ai_response as any).recommendations.length > 0 && (
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-1 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Öneriler
                  </h4>
                  <ul className="space-y-1 text-sm">
                    {(latestAnalysis.ai_response as any).recommendations.slice(0, 3).map((rec: string, idx: number) => (
                      <li key={idx} className="flex items-start text-gray-700">
                        <span className="text-blue-600 mr-2">→</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Timestamp and action */}
              <div className="flex items-center justify-between pt-3 border-t border-green-200">
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(latestAnalysis.created_at), {
                    addSuffix: true,
                    locale: tr,
                  })}
                </p>
                <button className="text-xs text-green-700 hover:text-green-800 font-medium flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  Detaylı Görüntüle
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Chief Complaint */}
        {latestAnamnesis && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Başvuru Şikayeti</h3>
            <p className="text-gray-700">
              {((latestAnamnesis.content as Record<string, unknown>)?.chief_complaint as string) ||
                ((latestAnamnesis.content as Record<string, unknown>)?.complaint as string) ||
                'Belirtilmemiş'}
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">İstatistikler</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Toplam Veri:</span>
              <span className="font-semibold text-gray-900">{patientData.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tetkik Sayısı:</span>
              <span className="font-semibold text-gray-900">{tests.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">AI Analiz:</span>
              <span className="font-semibold text-gray-900">{analyses.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
