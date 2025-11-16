'use client'

import { useEffect, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend)

interface AILog {
  id: string
  operation: string
  created_at: string
  success: boolean
}

export function AdminAIUsageChart({ logs }: { logs: AILog[] }) {
  const [chartData, setChartData] = useState({
    labels: [] as string[],
    datasets: [
      {
        label: 'Analiz',
        data: [] as number[],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
      },
      {
        label: 'Chat',
        data: [] as number[],
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
      },
      {
        label: 'Vision',
        data: [] as number[],
        backgroundColor: 'rgba(245, 158, 11, 0.8)',
      },
      {
        label: 'Diğer',
        data: [] as number[],
        backgroundColor: 'rgba(107, 114, 128, 0.8)',
      },
    ],
  })

  useEffect(() => {
    // Group logs by day and operation
    const last7Days = []
    const analyzeData = []
    const chatData = []
    const visionData = []
    const otherData = []

    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      last7Days.push(
        date.toLocaleDateString('tr-TR', {
          day: 'numeric',
          month: 'short',
        })
      )

      const dayLogs = logs.filter((log) => log.created_at.startsWith(dateStr))

      analyzeData.push(dayLogs.filter((log) => log.operation === 'analyze').length)
      chatData.push(dayLogs.filter((log) => log.operation === 'chat').length)
      visionData.push(dayLogs.filter((log) => log.operation === 'vision').length)
      otherData.push(
        dayLogs.filter((log) => !['analyze', 'chat', 'vision'].includes(log.operation)).length
      )
    }

    setChartData({
      labels: last7Days,
      datasets: [
        { ...chartData.datasets[0], data: analyzeData },
        { ...chartData.datasets[1], data: chatData },
        { ...chartData.datasets[2], data: visionData },
        { ...chartData.datasets[3], data: otherData },
      ],
    })
  }, [logs])

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
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
        beginAtZero: true,
      },
    },
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Son 7 Gün AI Kullanımı</h3>
      <div style={{ height: '300px' }}>
        <Bar data={chartData} options={options} />
      </div>
    </div>
  )
}
