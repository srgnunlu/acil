'use client'

import { useEffect, useState } from 'react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Pie } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

interface AILog {
  id: string
  model: string | null
  total_cost: number | null
  operation: string
}

export function AdminAICostBreakdown({ logs }: { logs: AILog[] }) {
  const [chartData, setChartData] = useState({
    labels: [] as string[],
    datasets: [
      {
        data: [] as number[],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(139, 92, 246, 1)',
        ],
        borderWidth: 1,
      },
    ],
  })

  useEffect(() => {
    // Calculate cost by model
    const costByModel: Record<string, number> = {}

    logs.forEach((log) => {
      const model = log.model || 'Unknown'
      costByModel[model] = (costByModel[model] || 0) + (log.total_cost || 0)
    })

    const labels = Object.keys(costByModel)
    const data = Object.values(costByModel)

    setChartData({
      labels,
      datasets: [
        {
          ...chartData.datasets[0],
          data,
        },
      ],
    })
  }, [logs])

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      title: {
        display: false,
      },
    },
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Maliyet Dağılımı (Model)</h3>
      <div style={{ height: '300px' }}>
        <Pie data={chartData} options={options} />
      </div>
    </div>
  )
}
