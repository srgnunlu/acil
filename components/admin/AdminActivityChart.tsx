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

  useEffect(() => {
    // Generate last 7 days data
    const labels = []
    const userActivity = []
    const patientRecords = []
    const aiUsage = []

    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      labels.push(
        date.toLocaleDateString('tr-TR', {
          day: 'numeric',
          month: 'short',
        })
      )

      // Mock data - replace with real data
      userActivity.push(Math.floor(Math.random() * 100) + 50)
      patientRecords.push(Math.floor(Math.random() * 50) + 20)
      aiUsage.push(Math.floor(Math.random() * 80) + 30)
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

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Son 7 Gün Aktivite</h3>
      <div style={{ height: '300px' }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  )
}
