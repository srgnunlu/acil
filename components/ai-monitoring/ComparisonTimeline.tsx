'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AIComparison, OverallTrend, ChangesDetected } from '@/types/ai-monitoring.types'
import { TrendingUp, TrendingDown, Minus, GitCompare, ArrowRight, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface ComparisonTimelineProps {
  patientId: string
  autoCompare?: boolean
}

export function ComparisonTimeline({ patientId, autoCompare = false }: ComparisonTimelineProps) {
  const [comparisons, setComparisons] = useState<AIComparison[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchComparisons()
  }, [patientId])

  const fetchComparisons = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/ai/comparisons?patient_id=${patientId}&limit=10`)
      const data = await response.json()
      setComparisons(data.comparisons || [])
    } catch (error) {
      console.error('Failed to fetch comparisons:', error)
    } finally {
      setLoading(false)
    }
  }

  const createComparison = async (auto: boolean = false) => {
    try {
      setCreating(true)
      const response = await fetch('/api/ai/comparisons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          auto_compare: auto,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Failed to create comparison:', errorData)
        alert(errorData.message || errorData.error || 'Karşılaştırma oluşturulamadı')
        return
      }

      await fetchComparisons()
    } catch (error) {
      console.error('Failed to create comparison:', error)
      alert('Karşılaştırma oluşturulurken bir hata oluştu')
    } finally {
      setCreating(false)
    }
  }

  const getTrendIcon = (trend: OverallTrend) => {
    switch (trend) {
      case 'improving':
        return <TrendingDown className="h-5 w-5 text-green-600" />
      case 'worsening':
        return <TrendingUp className="h-5 w-5 text-red-600" />
      case 'stable':
        return <Minus className="h-5 w-5 text-blue-600" />
      case 'mixed':
        return <GitCompare className="h-5 w-5 text-yellow-600" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />
    }
  }

  const getTrendColor = (trend: OverallTrend) => {
    switch (trend) {
      case 'improving':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'worsening':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'stable':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'mixed':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getTrendText = (trend: OverallTrend) => {
    switch (trend) {
      case 'improving':
        return 'İyileşiyor'
      case 'worsening':
        return 'Kötüleşiyor'
      case 'stable':
        return 'Stabil'
      case 'mixed':
        return 'Karışık'
      default:
        return 'Yetersiz Veri'
    }
  }

  const renderChanges = (changes: ChangesDetected) => {
    return (
      <div className="space-y-3">
        {changes.improved && changes.improved.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-900">İyileşen Bulgular</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-sm text-green-800">
              {changes.improved.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {changes.worsened && changes.worsened.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="font-medium text-red-900">Kötüleşen Bulgular</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-sm text-red-800">
              {changes.worsened.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {changes.new_findings && changes.new_findings.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">Yeni Bulgular</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
              {changes.new_findings.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {changes.resolved && changes.resolved.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-gray-600" />
              <span className="font-medium text-gray-900">Çözülen Bulgular</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-800">
              {changes.resolved.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Analiz Karşılaştırmaları</h3>
          <p className="text-sm text-gray-600 mt-1">
            Hasta durumundaki değişiklikleri takip edin
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => createComparison(true)}
          loading={creating}
          leftIcon={<GitCompare className="h-4 w-4" />}
        >
          Otomatik Karşılaştır
        </Button>
      </div>

      {/* Comparisons Timeline */}
      <div className="space-y-4">
        {comparisons.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <GitCompare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Henüz karşılaştırma bulunmuyor</p>
              <Button variant="primary" onClick={() => createComparison(true)} loading={creating}>
                İlk Karşılaştırmayı Oluştur
              </Button>
            </div>
          </Card>
        ) : (
          comparisons.map((comparison, index) => (
            <Card
              key={comparison.id}
              variant="outlined"
              className={cn(
                'relative',
                index === 0 && 'ring-2 ring-blue-500'
              )}
            >
              {/* Timeline connector */}
              {index < comparisons.length - 1 && (
                <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-gray-200" />
              )}

              <div className="flex gap-4">
                {/* Timeline dot */}
                <div className="flex-shrink-0">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center border-2',
                      comparison.overall_trend === 'improving' && 'bg-green-50 border-green-300',
                      comparison.overall_trend === 'worsening' && 'bg-red-50 border-red-300',
                      comparison.overall_trend === 'stable' && 'bg-blue-50 border-blue-300',
                      comparison.overall_trend === 'mixed' && 'bg-yellow-50 border-yellow-300'
                    )}
                  >
                    {getTrendIcon(comparison.overall_trend)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'px-3 py-1 rounded-full text-sm font-medium inline-flex items-center gap-2',
                          getTrendColor(comparison.overall_trend)
                        )}
                      >
                        {getTrendIcon(comparison.overall_trend)}
                        {getTrendText(comparison.overall_trend)}
                      </span>
                      {comparison.significance_score && (
                        <span className="text-sm text-gray-600">
                          Önem Skoru: %{Math.round(comparison.significance_score * 100)}
                        </span>
                      )}
                      {comparison.time_interval_hours && (
                        <span className="text-sm text-gray-500">
                          {comparison.time_interval_hours.toFixed(1)} saat aralık
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(comparison.compared_at), {
                        addSuffix: true,
                        locale: tr,
                      })}
                    </span>
                  </div>

                  {/* Comparison Type */}
                  <div className="mb-3">
                    <span className="text-xs font-medium text-gray-500 uppercase">
                      {comparison.comparison_type === 'baseline_vs_current'
                        ? 'Baseline vs Mevcut'
                        : comparison.comparison_type === 'sequential'
                        ? 'Sıralı Karşılaştırma'
                        : 'Zaman Bazlı'}
                    </span>
                  </div>

                  {/* Changes */}
                  {renderChanges(comparison.changes_detected)}

                  {/* AI Summary */}
                  {comparison.ai_summary && (
                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-900">
                        <span className="font-medium">AI Özeti:</span> {comparison.ai_summary}
                      </p>
                    </div>
                  )}

                  {/* Clinical Implications */}
                  {comparison.clinical_implications && (
                    <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <p className="text-sm text-purple-900">
                        <span className="font-medium">Klinik Etkiler:</span>{' '}
                        {comparison.clinical_implications}
                      </p>
                    </div>
                  )}

                  {/* Recommendations */}
                  {comparison.recommendations && comparison.recommendations.length > 0 && (
                    <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="font-medium text-green-900 mb-2">Öneriler:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-green-800">
                        {comparison.recommendations.map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

