'use client'

import { useEffect, useState } from 'react'
import { PatientStatusChart } from '@/components/charts/PatientStatusChart'
import { TestTypeChart } from '@/components/charts/TestTypeChart'
import { ActivityTrendChart } from '@/components/charts/ActivityTrendChart'
import { DataEntryChart } from '@/components/charts/DataEntryChart'

interface AnalyticsData {
  statusCounts: {
    active: number
    discharged: number
    consultation: number
  }
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
  activityTrend: {
    last7Days: {
      date: string
      admissions: number
      discharges: number
    }[]
    last30Days: {
      date: string
      admissions: number
      discharges: number
    }[]
  }
  summary: {
    totalPatients: number
    totalTests: number
    totalDataEntries: number
    totalAiAnalyses: number
    totalChatMessages: number
  }
}

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [trendPeriod, setTrendPeriod] = useState<'7days' | '30days'>('7days')

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics')
      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }
      const analyticsData = await response.json()
      setData(analyticsData)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        Analiz verileri yüklenirken bir hata oluştu: {error}
      </div>
    )
  }

  const activityData =
    trendPeriod === '7days'
      ? data.activityTrend.last7Days
      : data.activityTrend.last30Days

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <p className="text-sm font-medium text-blue-800 mb-1">Toplam Hasta</p>
          <p className="text-3xl font-bold text-blue-900">{data.summary.totalPatients}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <p className="text-sm font-medium text-green-800 mb-1">Test Sayısı</p>
          <p className="text-3xl font-bold text-green-900">{data.summary.totalTests}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <p className="text-sm font-medium text-purple-800 mb-1">Veri Girişi</p>
          <p className="text-3xl font-bold text-purple-900">{data.summary.totalDataEntries}</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4 border border-indigo-200">
          <p className="text-sm font-medium text-indigo-800 mb-1">AI Analizi</p>
          <p className="text-3xl font-bold text-indigo-900">{data.summary.totalAiAnalyses}</p>
        </div>
        <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-4 border border-pink-200">
          <p className="text-sm font-medium text-pink-800 mb-1">Chat Mesajı</p>
          <p className="text-3xl font-bold text-pink-900">{data.summary.totalChatMessages}</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        <PatientStatusChart
          active={data.statusCounts.active}
          discharged={data.statusCounts.discharged}
          consultation={data.statusCounts.consultation}
        />
        <TestTypeChart testCounts={data.testCounts} />
      </div>

      {/* Activity Trend - Full Width */}
      <div className="relative">
        <div className="absolute top-6 right-6 z-10">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm inline-flex">
            <button
              onClick={() => setTrendPeriod('7days')}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg transition ${
                trendPeriod === '7days'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              7 Gün
            </button>
            <button
              onClick={() => setTrendPeriod('30days')}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg transition ${
                trendPeriod === '30days'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              30 Gün
            </button>
          </div>
        </div>
        <ActivityTrendChart dailyData={activityData} />
      </div>

      {/* Data Entry Chart */}
      <div className="grid lg:grid-cols-2 gap-6">
        <DataEntryChart dataCounts={data.dataCounts} />

        {/* Quick Stats */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Hızlı İstatistikler</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-blue-900">Hasta Başına Ortalama Test</span>
              <span className="text-lg font-bold text-blue-900">
                {data.summary.totalPatients > 0
                  ? (data.summary.totalTests / data.summary.totalPatients).toFixed(1)
                  : '0.0'}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-green-900">Hasta Başına Ortalama Veri</span>
              <span className="text-lg font-bold text-green-900">
                {data.summary.totalPatients > 0
                  ? (data.summary.totalDataEntries / data.summary.totalPatients).toFixed(1)
                  : '0.0'}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <span className="text-sm font-medium text-purple-900">AI Kullanım Oranı</span>
              <span className="text-lg font-bold text-purple-900">
                {data.summary.totalPatients > 0
                  ? `${((data.summary.totalAiAnalyses / data.summary.totalPatients) * 100).toFixed(0)}%`
                  : '0%'}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg">
              <span className="text-sm font-medium text-indigo-900">Chat Aktivitesi</span>
              <span className="text-lg font-bold text-indigo-900">
                {data.summary.totalPatients > 0
                  ? (data.summary.totalChatMessages / data.summary.totalPatients).toFixed(1)
                  : '0.0'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-start space-x-3">
          <svg
            className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              Analiz ve Raporlama
            </h4>
            <p className="text-gray-700 leading-relaxed">
              Bu dashboard, hasta verilerinizi görselleştirerek daha iyi kararlar almanıza yardımcı olur.
              Grafikler gerçek zamanlı verilerinize dayanır ve otomatik olarak güncellenir.
              Detaylı PDF raporları için hasta detay sayfasından export yapabilirsiniz.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
