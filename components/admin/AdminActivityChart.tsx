'use client'

import { useEffect, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

export function AdminActivityChart() {
  const [chartData, setChartData] = useState({
    labels: [] as string[],
    datasets: [
      {
        label: 'Kullanıcı Aktivitesi',
        data: [] as number[],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Hasta Kayıtları',
        data: [] as number[],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'AI Kullanımı',
        data: [] as number[],
        borderColor: 'rgb(245, 158, 11)',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  })

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchChartData() {
      try {
        // Fetch analytics data for last 7 days
        const endDate = new Date()
        const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        
        const response = await fetch(
          `/api/admin/analytics?start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`
        )

        if (!response.ok) {
          throw new Error('Failed to fetch analytics')
        }

        const data = await response.json()
        const trends = data.trends || { activity: [], patients: [] }
        const aiStats = data.breakdown?.ai_usage || { total_requests: 0 }

        // Map trends to chart data
        const labels: string[] = []
        const userActivity: number[] = []
        const patientRecords: number[] = []
        const aiUsage: number[] = []

        // Generate labels for last 7 days
        for (let i = 6; i >= 0; i--) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          const dateStr = date.toISOString().split('T')[0]

          labels.push(
            date.toLocaleDateString('tr-TR', {
              day: 'numeric',
              month: 'short',
            })
          )

          // Find matching data for this date
          const activityData = trends.activity?.find((a: { date: string }) => a.date === dateStr)
          const patientData = trends.patients?.find((p: { date: string }) => p.date === dateStr)

          userActivity.push(activityData?.activities || 0)
          patientRecords.push(patientData?.created || 0)
          
          // Fetch AI usage for this specific day
          try {
            const aiRes = await fetch(
              `/api/admin/ai-costs?start_date=${dateStr}T00:00:00.000Z&end_date=${dateStr}T23:59:59.999Z`
            )
            if (aiRes.ok) {
              const aiData = await aiRes.json()
              aiUsage.push(aiData.summary?.total_requests || 0)
            } else {
              aiUsage.push(0)
            }
          } catch {
            aiUsage.push(0)
          }
        }

        setChartData({
          labels,
          datasets: [
            {
              ...chartData.datasets[0],
              data: userActivity,
            },
            {
              ...chartData.datasets[1],
              data: patientRecords,
            },
            {
              ...chartData.datasets[2],
              data: aiUsage,
            },
          ],
        })
      } catch (error) {
        console.error('Failed to fetch chart data:', error)
        // Fallback to empty data
        setChartData({
          labels: [],
          datasets: chartData.datasets.map((ds) => ({ ...ds, data: [] })),
        })
      } finally {
        setLoading(false)
      }
    }

    fetchChartData()
  }, [])

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Son 7 Gün Aktivite</h3>
        <div className="flex items-center justify-center" style={{ height: '300px' }}>
          <div className="text-gray-500">Yükleniyor...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Son 7 Gün Aktivite</h3>
      <div style={{ height: '300px' }}>
        {chartData.labels.length > 0 ? (
          <Line data={chartData} options={options} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Veri bulunamadı
          </div>
        )}
      </div>
    </div>
  )
}
