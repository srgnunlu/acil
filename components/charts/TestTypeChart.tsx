'use client'

import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface TestTypeChartProps {
  testCounts: {
    laboratory: number
    ekg: number
    radiology: number
    consultation: number
    other: number
  }
}

export function TestTypeChart({ testCounts }: TestTypeChartProps) {
  const data = {
    labels: ['Laboratuvar', 'EKG', 'Radyoloji', 'Konsültasyon', 'Diğer'],
    datasets: [
      {
        label: 'Test Sayısı',
        data: [
          testCounts.laboratory,
          testCounts.ekg,
          testCounts.radiology,
          testCounts.consultation,
          testCounts.other,
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',   // blue
          'rgba(239, 68, 68, 0.8)',    // red
          'rgba(168, 85, 247, 0.8)',   // purple
          'rgba(251, 191, 36, 0.8)',   // yellow
          'rgba(156, 163, 175, 0.8)',  // gray
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(168, 85, 247, 1)',
          'rgba(251, 191, 36, 1)',
          'rgba(156, 163, 175, 1)',
        ],
        borderWidth: 2,
      },
    ],
  }

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `${context.parsed.y} test`
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  }

  const total = Object.values(testCounts).reduce((a, b) => a + b, 0)

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Test Türleri Dağılımı</h3>
        <span className="text-sm text-gray-500">Toplam: {total}</span>
      </div>
      <div style={{ height: '300px' }}>
        {total > 0 ? (
          <Bar data={data} options={options} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            Henüz test kaydı bulunmuyor
          </div>
        )}
      </div>
    </div>
  )
}
