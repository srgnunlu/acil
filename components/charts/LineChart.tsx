'use client'

import { Line } from 'react-chartjs-2'
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

interface LineChartProps {
  data: {
    labels: string[]
    datasets: {
      label: string
      data: number[]
      borderColor?: string
      backgroundColor?: string
    }[]
  }
  title?: string
  fill?: boolean
}

export function LineChart({ data, title, fill = false }: LineChartProps) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#9ca3af',
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#f3f4f6',
        bodyColor: '#d1d5db',
        borderColor: '#374151',
        borderWidth: 1,
        padding: 12,
      },
    },
    scales: {
      x: {
        grid: {
          color: '#374151',
        },
        ticks: {
          color: '#9ca3af',
        },
        border: {
          color: '#4b5563',
        },
      },
      y: {
        grid: {
          color: '#374151',
        },
        ticks: {
          color: '#9ca3af',
        },
        border: {
          color: '#4b5563',
        },
      },
    },
  }

  const chartData = {
    labels: data.labels,
    datasets: data.datasets.map((dataset, index) => ({
      ...dataset,
      borderColor: dataset.borderColor || ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][index % 4],
      backgroundColor: fill
        ? dataset.backgroundColor || ['rgba(59, 130, 246, 0.1)', 'rgba(16, 185, 129, 0.1)', 'rgba(245, 158, 11, 0.1)', 'rgba(239, 68, 68, 0.1)'][index % 4]
        : 'transparent',
      fill,
      tension: 0.3,
      pointRadius: 3,
      pointHoverRadius: 5,
    })),
  }

  return (
    <div className="w-full h-full">
      {title && <h3 className="text-lg font-semibold mb-4 text-gray-200">{title}</h3>}
      <div className="h-80">
        <Line data={chartData} options={options} />
      </div>
    </div>
  )
}
