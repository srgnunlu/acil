'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AIMonitoringConfig, UpdateMonitoringConfigInput } from '@/types/ai-monitoring.types'
import { Settings, Bell, TrendingUp, Activity, Save, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MonitoringConfigProps {
  patientId: string
  workspaceId: string
}

export function MonitoringConfig({ patientId, workspaceId }: MonitoringConfigProps) {
  const [config, setConfig] = useState<AIMonitoringConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<UpdateMonitoringConfigInput>({})

  useEffect(() => {
    fetchConfig()
  }, [patientId])

  const fetchConfig = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/ai/monitoring?patient_id=${patientId}`)
      const data = await response.json()
      setConfig(data.config)
      if (data.config) {
        setFormData({
          auto_analysis_enabled: data.config.auto_analysis_enabled,
          analysis_frequency_minutes: data.config.analysis_frequency_minutes,
          monitored_metrics: data.config.monitored_metrics,
          alert_thresholds: data.config.alert_thresholds,
          trend_analysis_enabled: data.config.trend_analysis_enabled,
          trend_window_hours: data.config.trend_window_hours,
          comparison_enabled: data.config.comparison_enabled,
          notify_on_critical: data.config.notify_on_critical,
          notify_on_deterioration: data.config.notify_on_deterioration,
          notify_on_improvement: data.config.notify_on_improvement,
          is_active: data.config.is_active,
        })
      }
    } catch (error) {
      console.error('Failed to fetch monitoring config:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/ai/monitoring', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          ...formData,
        }),
      })

      if (response.ok) {
        await fetchConfig()
      }
    } catch (error) {
      console.error('Failed to save monitoring config:', error)
    } finally {
      setSaving(false)
    }
  }

  const updateFormData = (field: keyof UpdateMonitoringConfigInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const toggleMetric = (metric: string) => {
    const currentMetrics = formData.monitored_metrics || config?.monitored_metrics || []
    const newMetrics = currentMetrics.includes(metric)
      ? currentMetrics.filter((m) => m !== metric)
      : [...currentMetrics, metric]
    updateFormData('monitored_metrics', newMetrics)
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

  if (!config) {
    return (
      <Card>
        <div className="text-center py-12">
          <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Monitoring config bulunamadı</p>
        </div>
      </Card>
    )
  }

  const availableMetrics = ['vital_signs', 'lab_values', 'clinical_scores']

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Monitoring Ayarları</h3>
            <p className="text-sm text-gray-600 mt-1">
              Hasta için otomatik izleme ve uyarı ayarlarını yapılandırın
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchConfig} leftIcon={<RefreshCw className="h-4 w-4" />}>
            Yenile
          </Button>
        </div>

        <div className="space-y-6">
          {/* Auto Analysis */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Otomatik Analiz</h4>
              <p className="text-sm text-gray-600">Düzenli aralıklarla otomatik AI analizi yap</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.auto_analysis_enabled ?? config.auto_analysis_enabled}
                onChange={(e) => updateFormData('auto_analysis_enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Analysis Frequency */}
          {(formData.auto_analysis_enabled ?? config.auto_analysis_enabled) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Analiz Sıklığı (dakika)
              </label>
              <input
                type="number"
                min="15"
                max="1440"
                step="15"
                value={formData.analysis_frequency_minutes ?? config.analysis_frequency_minutes}
                onChange={(e) => updateFormData('analysis_frequency_minutes', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Her {formData.analysis_frequency_minutes ?? config.analysis_frequency_minutes} dakikada bir
                otomatik analiz yapılacak
              </p>
            </div>
          )}

          {/* Monitored Metrics */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              İzlenecek Metrikler
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {availableMetrics.map((metric) => {
                const isSelected =
                  (formData.monitored_metrics || config.monitored_metrics || []).includes(metric)
                return (
                  <button
                    key={metric}
                    type="button"
                    onClick={() => toggleMetric(metric)}
                    className={cn(
                      'p-4 rounded-lg border-2 transition-all text-left',
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 capitalize">
                        {metric === 'vital_signs'
                          ? 'Vital Bulgular'
                          : metric === 'lab_values'
                          ? 'Lab Değerleri'
                          : 'Klinik Skorlar'}
                      </span>
                      {isSelected && (
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Trend Analysis */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Trend Analizi</h4>
              <p className="text-sm text-gray-600">Metriklerdeki trend değişikliklerini analiz et</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.trend_analysis_enabled ?? config.trend_analysis_enabled}
                onChange={(e) => updateFormData('trend_analysis_enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Trend Window */}
          {(formData.trend_analysis_enabled ?? config.trend_analysis_enabled) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trend Analiz Penceresi (saat)
              </label>
              <input
                type="number"
                min="6"
                max="168"
                step="6"
                value={formData.trend_window_hours ?? config.trend_window_hours}
                onChange={(e) => updateFormData('trend_window_hours', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Notification Preferences */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Bildirim Tercihleri</h4>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-red-500" />
                <span className="text-sm text-gray-700">Kritik alertlerde bildir</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.notify_on_critical ?? config.notify_on_critical}
                  onChange={(e) => updateFormData('notify_on_critical', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-500" />
                <span className="text-sm text-gray-700">Kötüleşme durumunda bildir</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.notify_on_deterioration ?? config.notify_on_deterioration}
                  onChange={(e) => updateFormData('notify_on_deterioration', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-500" />
                <span className="text-sm text-gray-700">İyileşme durumunda bildir</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.notify_on_improvement ?? config.notify_on_improvement}
                  onChange={(e) => updateFormData('notify_on_improvement', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Monitoring Durumu</h4>
              <p className="text-sm text-gray-600">Monitoring'i aktif/pasif yap</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active ?? config.is_active}
                onChange={(e) => updateFormData('is_active', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <Button variant="primary" onClick={saveConfig} loading={saving} leftIcon={<Save className="h-4 w-4" />}>
              Ayarları Kaydet
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

