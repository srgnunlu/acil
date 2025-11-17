'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Download, RefreshCw, Calendar, TrendingUp } from 'lucide-react'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { PatientCountWidget } from '@/components/analytics/widgets/PatientCountWidget'
import { AIUsageWidget } from '@/components/analytics/widgets/AIUsageWidget'
import { RecentAlertsWidget } from '@/components/analytics/widgets/RecentAlertsWidget'
import { TeamActivityWidget } from '@/components/analytics/widgets/TeamActivityWidget'
import { PieChart } from '@/components/charts/PieChart'
import { LineChart } from '@/components/charts/LineChart'
import { BarChart } from '@/components/charts/BarChart'
import { TestTypeChart } from '@/components/charts/TestTypeChart'
import { DataEntryChart } from '@/components/charts/DataEntryChart'
import { PatientStatusChart } from '@/components/charts/PatientStatusChart'

interface WorkspaceAnalytics {
  overview: {
    patient_stats: {
      total_patients: number
      active_patients: number
      discharged_patients: number
      patients_last_7_days: number
      avg_length_of_stay_days: number
    }
    category_distribution: Array<{
      category_name: string
      category_color: string
      patient_count: number
    }>
    ai_usage: {
      total_ai_requests: number
      analyze_count: number
      chat_count: number
      vision_count: number
      total_cost: number
      avg_response_time_ms: number
    }
    team_summary: {
      total_members: number
      active_today: number
      avg_patients_per_doctor: number
    }
  }
  daily_metrics: Array<{
    metric_date: string
    patients_added: number
    patients_discharged: number
    ai_analyses: number
  }>
}

export default function AnalyticsPage() {
  const searchParams = useSearchParams()
  const { currentWorkspace, isLoading: workspaceLoading } = useWorkspace()
  const workspaceIdFromUrl = searchParams.get('workspace_id')
  const workspaceId = workspaceIdFromUrl || currentWorkspace?.id || null

  const [analytics, setAnalytics] = useState<WorkspaceAnalytics | null>(null)
  const [teamData, setTeamData] = useState<any>(null)
  const [clinicalData, setClinicalData] = useState<any>(null)
  const [detailedData, setDetailedData] = useState<{
    statusCounts: { active: number; discharged: number; consultation: number }
    testCounts: {
      laboratory: number
      ekg: number
      radiology: number
      consultation: number
      other: number
    }
    dataCounts: {
      anamnesis: number
      vital_signs: number
      medications: number
      history: number
      demographics: number
    }
    summary: {
      totalPatients: number
      totalTests: number
      totalDataEntries: number
      totalAiAnalyses: number
      totalChatMessages: number
    }
    quickStats: {
      avgTestsPerPatient: string
      avgDataEntriesPerPatient: string
      aiUsageRate: string
      chatActivityPerPatient: string
    }
  } | null>(null)
  const [alerts, setAlerts] = useState<unknown[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadAnalytics = async () => {
    if (!workspaceId) return

    try {
      setRefreshing(true)

      // Workspace analytics
      const workspaceRes = await fetch(`/api/analytics/workspace?workspace_id=${workspaceId}`)
      const workspaceData = await workspaceRes.json()
      if (workspaceData.success) {
        setAnalytics(workspaceData.data)
      }

      // Team analytics
      const teamRes = await fetch(`/api/analytics/team?workspace_id=${workspaceId}`)
      const teamResData = await teamRes.json()
      if (teamResData.success) {
        setTeamData(teamResData.data)
      }

      // Clinical metrics
      const clinicalRes = await fetch(`/api/analytics/clinical?workspace_id=${workspaceId}`)
      const clinicalResData = await clinicalRes.json()
      if (clinicalResData.success) {
        setClinicalData(clinicalResData.data)
      }

      // Recent alerts
      const alertsRes = await fetch(`/api/ai/alerts?workspace_id=${workspaceId}&limit=10`)
      const alertsData = await alertsRes.json()
      if (alertsData.success) {
        setAlerts(alertsData.alerts || [])
      }

      // Detailed analytics (test types, data entry, etc.)
      const detailedRes = await fetch(`/api/analytics/detailed?workspace_id=${workspaceId}`)
      const detailedResData = await detailedRes.json()
      if (detailedResData.success) {
        setDetailedData(detailedResData.data)
      }
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId])

  const handleExport = async (format: 'csv' | 'json' | 'excel') => {
    if (!workspaceId) return

    try {
      const res = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          report_type: 'workspace_overview',
          format,
        }),
      })

      if (format === 'csv') {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `analytics_${new Date().toISOString()}.csv`
        a.click()
      } else {
        const data = await res.json()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `analytics_${new Date().toISOString()}.json`
        a.click()
      }
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  if (workspaceLoading) {
    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <RefreshCw className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Workspace yükleniyor...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!workspaceId) {
    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-400">Lütfen bir workspace seçin</p>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <RefreshCw className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Analitik veriler yükleniyor...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-100 flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-blue-400" />
              Analitik Dashboard
            </h1>
            <p className="text-gray-400 mt-2">Detaylı workspace performans metrikleri</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadAnalytics()}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors border border-gray-700"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Yenile
            </button>

            <div className="relative group">
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Download className="w-4 h-4" />
                Dışa Aktar
              </button>

              <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 rounded-t-lg transition-colors"
                >
                  CSV Formatı
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  JSON Formatı
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700 rounded-b-lg transition-colors"
                >
                  Excel Formatı
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Top Widgets Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {analytics?.overview?.patient_stats && (
            <PatientCountWidget
              data={{
                total: analytics.overview.patient_stats.total_patients || 0,
                active: analytics.overview.patient_stats.active_patients || 0,
                discharged: analytics.overview.patient_stats.discharged_patients || 0,
                new_this_week: analytics.overview.patient_stats.patients_last_7_days || 0,
              }}
            />
          )}

          {analytics?.overview?.ai_usage && (
            <AIUsageWidget
              data={{
                total_requests: analytics.overview.ai_usage.total_ai_requests || 0,
                analyze_count: analytics.overview.ai_usage.analyze_count || 0,
                chat_count: analytics.overview.ai_usage.chat_count || 0,
                vision_count: analytics.overview.ai_usage.vision_count || 0,
                total_cost: analytics.overview.ai_usage.total_cost || 0,
                avg_response_time_ms: analytics.overview.ai_usage.avg_response_time_ms || 0,
              }}
            />
          )}

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-200">Ekip Özeti</h3>
              <Calendar className="w-6 h-6 text-green-400" />
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400">Toplam Üye</p>
                <p className="text-3xl font-bold text-gray-100">
                  {analytics?.overview?.team_summary?.total_members || 0}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Bugün Aktif</p>
                  <p className="text-xl font-semibold text-green-400">
                    {analytics?.overview?.team_summary?.active_today || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Doktor Başına</p>
                  <p className="text-xl font-semibold text-blue-400">
                    {analytics?.overview?.team_summary?.avg_patients_per_doctor?.toFixed(1) || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Patient Status Chart */}
          {detailedData?.statusCounts && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <PatientStatusChart
                active={detailedData.statusCounts.active}
                discharged={detailedData.statusCounts.discharged}
                consultation={detailedData.statusCounts.consultation}
              />
            </div>
          )}

          {/* Category Distribution */}
          {analytics?.overview?.category_distribution &&
            analytics.overview.category_distribution.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <PieChart
                  title="Kategori Dağılımı"
                  data={{
                    labels: analytics.overview.category_distribution.map((c) => c.category_name),
                    values: analytics.overview.category_distribution.map((c) => c.patient_count),
                    colors: analytics.overview.category_distribution.map((c) => c.category_color),
                  }}
                />
              </div>
            )}

          {/* Test Type Chart */}
          {detailedData?.testCounts && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <TestTypeChart testCounts={detailedData.testCounts} />
            </div>
          )}

          {/* Data Entry Chart */}
          {detailedData?.dataCounts && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <DataEntryChart dataCounts={detailedData.dataCounts} />
            </div>
          )}

          {/* Daily Trends */}
          {analytics?.daily_metrics && analytics.daily_metrics.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <LineChart
                title="Günlük Hasta Kabul Trendi"
                data={{
                  labels: analytics.daily_metrics.map((m) =>
                    new Date(m.metric_date).toLocaleDateString('tr-TR', {
                      month: 'short',
                      day: 'numeric',
                    })
                  ),
                  datasets: [
                    {
                      label: 'Kabul Edilen',
                      data: analytics.daily_metrics.map((m) => m.patients_added || 0),
                      borderColor: '#3b82f6',
                    },
                    {
                      label: 'Taburcu',
                      data: analytics.daily_metrics.map((m) => m.patients_discharged || 0),
                      borderColor: '#10b981',
                    },
                  ],
                }}
                fill={false}
              />
            </div>
          )}
        </div>

        {/* Quick Stats Row */}
        {detailedData?.quickStats && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">Hızlı İstatistikler</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex justify-between items-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <span className="text-sm font-medium text-gray-300">
                  Hasta Başına Ortalama Test
                </span>
                <span className="text-xl font-bold text-blue-400">
                  {detailedData.quickStats.avgTestsPerPatient}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <span className="text-sm font-medium text-gray-300">
                  Hasta Başına Ortalama Veri
                </span>
                <span className="text-xl font-bold text-green-400">
                  {detailedData.quickStats.avgDataEntriesPerPatient}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <span className="text-sm font-medium text-gray-300">AI Kullanım Oranı</span>
                <span className="text-xl font-bold text-purple-400">
                  {detailedData.quickStats.aiUsageRate}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                <span className="text-sm font-medium text-gray-300">Chat Aktivitesi</span>
                <span className="text-xl font-bold text-indigo-400">
                  {detailedData.quickStats.chatActivityPerPatient}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Widgets Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentAlertsWidget alerts={alerts as never[]} />
          {teamData && (
            <TeamActivityWidget
              members={(teamData as { team_performance: unknown[] }).team_performance as never[]}
            />
          )}
        </div>

        {/* Team Performance Chart */}
        {teamData && (teamData as { team_performance: unknown[] }).team_performance.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <BarChart
              title="Ekip Performansı"
              data={{
                labels: (
                  teamData as { team_performance: { user_name: string }[] }
                ).team_performance.map((m) => m.user_name),
                datasets: [
                  {
                    label: 'Yönetilen Hasta',
                    data: (
                      teamData as { team_performance: { patients_managed: number }[] }
                    ).team_performance.map((m) => m.patients_managed || 0),
                    backgroundColor: '#3b82f6',
                  },
                  {
                    label: 'AI Analiz',
                    data: (
                      teamData as { team_performance: { ai_analyses_count: number }[] }
                    ).team_performance.map((m) => m.ai_analyses_count || 0),
                    backgroundColor: '#8b5cf6',
                  },
                ],
              }}
              horizontal={false}
            />
          </div>
        )}

        {/* Clinical Metrics */}
        {clinicalData && (clinicalData as { admission_trends: unknown[] }).admission_trends && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <LineChart
              title="Kabul ve Taburcu Trendleri (30 Gün)"
              data={{
                labels: (
                  clinicalData as { admission_trends: { date: string }[] }
                ).admission_trends.map((t) =>
                  new Date(t.date).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })
                ),
                datasets: [
                  {
                    label: 'Kabul',
                    data: (
                      clinicalData as { admission_trends: { count: number }[] }
                    ).admission_trends.map((t) => t.count),
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  },
                  {
                    label: 'Taburcu',
                    data:
                      (
                        clinicalData as { discharge_trends?: { count: number }[] }
                      ).discharge_trends?.map((t) => t.count) || [],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  },
                ],
              }}
              fill={true}
            />
          </div>
        )}
      </div>
    </div>
  )
}
