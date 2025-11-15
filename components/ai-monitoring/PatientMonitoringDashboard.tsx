'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MonitoringStatusResponse } from '@/types/ai-monitoring.types'
import { AlertCircle, TrendingUp, Activity, BarChart3, Settings, Bell } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface PatientMonitoringDashboardProps {
  patientId: string
  workspaceId: string
}

export function PatientMonitoringDashboard({
  patientId,
  workspaceId,
}: PatientMonitoringDashboardProps) {
  const [status, setStatus] = useState<MonitoringStatusResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 30000) // Her 30 saniyede bir yenile
    return () => clearInterval(interval)
  }, [patientId])

  const fetchStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/ai/monitoring?patient_id=${patientId}&status=true`)
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error('Failed to fetch monitoring status:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDeteriorationColor = (score: number = 0) => {
    if (score >= 7) return 'text-red-600 bg-red-50 border-red-200'
    if (score >= 4) return 'text-orange-600 bg-orange-50 border-orange-200'
    if (score >= 2) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-green-600 bg-green-50 border-green-200'
  }

  const getDeteriorationText = (score: number = 0) => {
    if (score >= 7) return 'Yüksek Risk'
    if (score >= 4) return 'Orta Risk'
    if (score >= 2) return 'Düşük Risk'
    return 'Normal'
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

  if (!status) {
    return (
      <Card>
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Monitoring durumu yüklenemedi</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Deterioration Score */}
        <Card variant="outlined" size="sm" className={cn('border-l-4', getDeteriorationColor(status.deterioration_score ?? 0).split(' ')[2])}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Kötüleşme Skoru</p>
              <p className={cn('text-2xl font-bold', getDeteriorationColor(status.deterioration_score ?? 0).split(' ')[0])}>
                {(status.deterioration_score ?? 0).toFixed(1)}
              </p>
              <p className={cn('text-xs mt-1', getDeteriorationColor(status.deterioration_score ?? 0).split(' ')[0])}>
                {getDeteriorationText(status.deterioration_score ?? 0)}
              </p>
            </div>
            <Activity className={cn('h-8 w-8', getDeteriorationColor(status.deterioration_score ?? 0).split(' ')[0])} />
          </div>
        </Card>

        {/* Active Alerts */}
        <Card variant="outlined" size="sm" className={(status.active_alerts?.length ?? 0) > 0 ? 'border-l-4 border-l-red-500' : ''}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Aktif Alertler</p>
              <p className="text-2xl font-bold text-gray-900">{status.active_alerts?.length ?? 0}</p>
              {(status.active_alerts?.filter((a) => a.severity === 'critical').length ?? 0) > 0 && (
                <p className="text-xs text-red-600 mt-1">
                  {status.active_alerts?.filter((a) => a.severity === 'critical').length ?? 0} kritik
                </p>
              )}
            </div>
            <Bell className="h-8 w-8 text-gray-400" />
          </div>
        </Card>

        {/* Recent Trends */}
        <Card variant="outlined" size="sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Son Trendler</p>
              <p className="text-2xl font-bold text-gray-900">{status.recent_trends?.length ?? 0}</p>
              {(status.recent_trends?.filter((t) => t.trend_direction === 'worsening').length ?? 0) > 0 && (
                <p className="text-xs text-orange-600 mt-1">
                  {status.recent_trends?.filter((t) => t.trend_direction === 'worsening').length ?? 0} kötüleşiyor
                </p>
              )}
            </div>
            <TrendingUp className="h-8 w-8 text-gray-400" />
          </div>
        </Card>

        {/* Monitoring Status */}
        <Card variant="outlined" size="sm" className={status.config?.is_active ? 'border-l-4 border-l-green-500' : ''}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Monitoring</p>
              <p className={cn('text-lg font-semibold', status.config?.is_active ? 'text-green-600' : 'text-gray-400')}>
                {status.config?.is_active ? 'Aktif' : 'Pasif'}
              </p>
              {status.config?.last_analysis_at && (
                <p className="text-xs text-gray-500 mt-1">
                  {formatDistanceToNow(new Date(status.config.last_analysis_at), {
                    addSuffix: true,
                    locale: tr,
                  })}
                </p>
              )}
            </div>
            <Settings className="h-8 w-8 text-gray-400" />
          </div>
        </Card>
      </div>

      {/* Critical Alerts */}
      {(status.active_alerts?.filter((a) => a.severity === 'critical' || a.severity === 'high').length ?? 0) > 0 && (
        <Card variant="outlined" className="border-l-4 border-l-red-500">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">Kritik Alertler</h3>
          </div>
          <div className="space-y-2">
            {(status.active_alerts ?? [])
              .filter((a) => a.severity === 'critical' || a.severity === 'high')
              .slice(0, 3)
              .map((alert) => (
                <div
                  key={alert.id}
                  className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-red-900">{alert.title}</p>
                    <p className="text-sm text-red-700">{alert.description}</p>
                  </div>
                  <span className="text-xs text-red-600">
                    {formatDistanceToNow(new Date(alert.created_at), {
                      addSuffix: true,
                      locale: tr,
                    })}
                  </span>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* Recent Trends Summary */}
      {(status.recent_trends?.length ?? 0) > 0 && (
        <Card variant="outlined">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Son Trendler</h3>
            <Link href={`/dashboard/patients/${patientId}?tab=monitoring`}>
              <Button variant="ghost" size="sm">
                Tümünü Gör
              </Button>
            </Link>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {(status.recent_trends ?? []).slice(0, 4).map((trend) => (
              <div
                key={trend.id}
                className="p-3 bg-gray-50 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 capitalize">{trend.metric_name}</span>
                  <span
                    className={cn(
                      'px-2 py-1 rounded-full text-xs',
                      trend.trend_direction === 'worsening' && 'bg-red-100 text-red-800',
                      trend.trend_direction === 'improving' && 'bg-green-100 text-green-800',
                      trend.trend_direction === 'stable' && 'bg-blue-100 text-blue-800',
                      trend.trend_direction === 'fluctuating' && 'bg-yellow-100 text-yellow-800'
                    )}
                  >
                    {trend.trend_direction === 'worsening'
                      ? 'Kötüleşiyor'
                      : trend.trend_direction === 'improving'
                      ? 'İyileşiyor'
                      : trend.trend_direction === 'stable'
                      ? 'Stabil'
                      : 'Dalgalı'}
                  </span>
                </div>
                {trend.ai_interpretation && (
                  <p className="text-sm text-gray-600 line-clamp-2">{trend.ai_interpretation}</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Last Comparison */}
      {status.last_comparison && (
        <Card variant="outlined">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Son Karşılaştırma</h3>
            <Link href={`/dashboard/patients/${patientId}?tab=monitoring`}>
              <Button variant="ghost" size="sm">
                Detayları Gör
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            <div
              className={cn(
                'px-3 py-2 rounded-lg inline-flex items-center gap-2',
                status.last_comparison.overall_trend === 'worsening' && 'bg-red-100 text-red-800',
                status.last_comparison.overall_trend === 'improving' && 'bg-green-100 text-green-800',
                status.last_comparison.overall_trend === 'stable' && 'bg-blue-100 text-blue-800'
              )}
            >
              <span className="font-medium">
                Genel Trend:{' '}
                {status.last_comparison.overall_trend === 'worsening'
                  ? 'Kötüleşiyor'
                  : status.last_comparison.overall_trend === 'improving'
                  ? 'İyileşiyor'
                  : 'Stabil'}
              </span>
            </div>
            {status.last_comparison.ai_summary && (
              <p className="text-sm text-gray-600">{status.last_comparison.ai_summary}</p>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}

