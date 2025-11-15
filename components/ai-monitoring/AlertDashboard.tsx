'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AIAlert, AlertSeverity, AlertStatus } from '@/types/ai-monitoring.types'
import { AlertCircle, CheckCircle, XCircle, Clock, Bell, TrendingUp, Activity } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface AlertDashboardProps {
  patientId?: string
  workspaceId?: string
  showStatistics?: boolean
  onAlertAction?: (alertId: string, action: 'acknowledge' | 'resolve' | 'dismiss') => void
}

export function AlertDashboard({
  patientId,
  workspaceId,
  showStatistics = true,
  onAlertAction,
}: AlertDashboardProps) {
  const [alerts, setAlerts] = useState<AIAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'acknowledged' | 'resolved'>('all')
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | 'all'>('all')

  useEffect(() => {
    fetchAlerts()
  }, [patientId, workspaceId, filter])

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (patientId) params.append('patient_id', patientId)
      if (workspaceId) params.append('workspace_id', workspaceId)
      if (filter !== 'all') params.append('status', filter)

      const response = await fetch(`/api/ai/alerts?${params.toString()}`)
      const data = await response.json()
      setAlerts(data.alerts || [])
    } catch (error) {
      console.error('Failed to fetch alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAlertAction = async (alertId: string, action: 'acknowledge' | 'resolve' | 'dismiss') => {
    try {
      const response = await fetch(`/api/ai/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: action === 'acknowledge' ? 'acknowledged' : action === 'resolve' ? 'resolved' : 'dismissed',
          ...(action === 'acknowledge' && { acknowledged_by: 'current-user-id' }),
          ...(action === 'resolve' && { resolved_by: 'current-user-id' }),
          ...(action === 'dismiss' && { dismissed_by: 'current-user-id' }),
        }),
      })

      if (response.ok) {
        await fetchAlerts()
        onAlertAction?.(alertId, action)
      }
    } catch (error) {
      console.error('Failed to update alert:', error)
    }
  }


  const getSeverityColor = (severity: AlertSeverity) => {
    const colors = {
      critical: 'bg-red-100 text-red-800 border-red-300',
      high: 'bg-orange-100 text-orange-800 border-orange-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      low: 'bg-blue-100 text-blue-800 border-blue-300',
    }
    return colors[severity]
  }

  const getSeverityIcon = (severity: AlertSeverity) => {
    const icons = {
      critical: <AlertCircle className="h-5 w-5 text-red-600" />,
      high: <AlertCircle className="h-5 w-5 text-orange-600" />,
      medium: <Bell className="h-5 w-5 text-yellow-600" />,
      low: <Activity className="h-5 w-5 text-blue-600" />,
    }
    return icons[severity]
  }

  const getStatusIcon = (status: AlertStatus) => {
    switch (status) {
      case 'active':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'acknowledged':
        return <CheckCircle className="h-4 w-4 text-blue-600" />
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'dismissed':
        return <XCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const filteredAlerts = alerts.filter((alert) => {
    if (severityFilter !== 'all' && alert.severity !== severityFilter) return false
    return true
  })

  const statistics = {
    total: alerts.length,
    critical: alerts.filter((a) => a.severity === 'critical' && a.status === 'active').length,
    high: alerts.filter((a) => a.severity === 'high' && a.status === 'active').length,
    active: alerts.filter((a) => a.status === 'active').length,
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
      {/* Statistics */}
      {showStatistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card variant="outlined" size="sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Toplam Alert</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.total}</p>
              </div>
              <Bell className="h-8 w-8 text-gray-400" />
            </div>
          </Card>

          <Card variant="outlined" size="sm" className="border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Kritik</p>
                <p className="text-2xl font-bold text-red-600">{statistics.critical}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
          </Card>

          <Card variant="outlined" size="sm" className="border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Yüksek</p>
                <p className="text-2xl font-bold text-orange-600">{statistics.high}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-400" />
            </div>
          </Card>

          <Card variant="outlined" size="sm" className="border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Aktif</p>
                <p className="text-2xl font-bold text-yellow-600">{statistics.active}</p>
              </div>
              <Activity className="h-8 w-8 text-yellow-400" />
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <Button
          variant={filter === 'all' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          Tümü
        </Button>
        <Button
          variant={filter === 'active' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('active')}
        >
          Aktif
        </Button>
        <Button
          variant={filter === 'acknowledged' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('acknowledged')}
        >
          Onaylanan
        </Button>
        <Button
          variant={filter === 'resolved' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('resolved')}
        >
          Çözülen
        </Button>

        <div className="ml-auto flex gap-2 items-center">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as AlertSeverity | 'all')}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tüm Şiddetler</option>
            <option value="critical">Kritik</option>
            <option value="high">Yüksek</option>
            <option value="medium">Orta</option>
            <option value="low">Düşük</option>
          </select>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Henüz alert bulunmuyor</p>
              <p className="text-sm text-gray-500">
                AI monitoring sistemi kritik durumları tespit ettiğinde alertler burada görünecektir.
              </p>
            </div>
          </Card>
        ) : (
          filteredAlerts.map((alert) => (
            <Card
              key={alert.id}
              variant="outlined"
              className={cn(
                'border-l-4',
                alert.severity === 'critical' && 'border-l-red-500',
                alert.severity === 'high' && 'border-l-orange-500',
                alert.severity === 'medium' && 'border-l-yellow-500',
                alert.severity === 'low' && 'border-l-blue-500'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getSeverityIcon(alert.severity)}
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium',
                          getSeverityColor(alert.severity)
                        )}
                      >
                        {alert.severity === 'critical'
                          ? 'Kritik'
                          : alert.severity === 'high'
                          ? 'Yüksek'
                          : alert.severity === 'medium'
                          ? 'Orta'
                          : 'Düşük'}
                      </span>
                      <span className="flex items-center gap-1 text-sm text-gray-500">
                        {getStatusIcon(alert.status)}
                        {alert.status === 'active'
                          ? 'Aktif'
                          : alert.status === 'acknowledged'
                          ? 'Onaylandı'
                          : alert.status === 'resolved'
                          ? 'Çözüldü'
                          : 'Reddedildi'}
                      </span>
                    </div>
                  </div>

                  <h4 className="text-lg font-semibold text-gray-900 mb-1">{alert.title}</h4>
                  <p className="text-gray-600 mb-3">{alert.description}</p>

                  {alert.ai_reasoning && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                      <p className="text-sm text-blue-900">
                        <span className="font-medium">AI Açıklama:</span> {alert.ai_reasoning}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>
                      {formatDistanceToNow(new Date(alert.created_at), {
                        addSuffix: true,
                        locale: tr,
                      })}
                    </span>
                    {alert.requires_immediate_action && (
                      <span className="text-red-600 font-medium">Acil Müdahale Gerekli</span>
                    )}
                    {alert.confidence_score && (
                      <span>Güven Skoru: %{Math.round(alert.confidence_score * 100)}</span>
                    )}
                  </div>
                </div>

                {alert.status === 'active' && (
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAlertAction(alert.id, 'acknowledge')}
                    >
                      Onayla
                    </Button>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleAlertAction(alert.id, 'resolve')}
                    >
                      Çöz
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAlertAction(alert.id, 'dismiss')}
                    >
                      Reddet
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

