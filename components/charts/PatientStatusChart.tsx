'use client'

import { Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

interface PatientStatusChartProps {
  active: number
  discharged: number
  consultation: number
}

export function PatientStatusChart({
  active,
  discharged,
  consultation,
}: PatientStatusChartProps) {
  const data = {
    labels: ['Aktif', 'Taburcu', 'Konsültasyon'],
    datasets: [
      {
        label: 'Hasta Sayısı',
        data: [active, discharged, consultation],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',   // green for active
          'rgba(156, 163, 175, 0.8)',  // gray for discharged
          'rgba(251, 191, 36, 0.8)',   // yellow for consultation
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(156, 163, 175, 1)',
          'rgba(251, 191, 36, 1)',
        ],
        borderWidth: 2,
      },
    ],
  }

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || ''
            const value = context.parsed || 0
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0'
            return `${label}: ${value} hasta (${percentage}%)`
          },
        },
      },
    },
  }

  const total = active + discharged + consultation

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Hasta Durumu Dağılımı</h3>
        <span className="text-sm text-gray-500">Toplam: {total}</span>
      </div>
      <div style={{ height: '300px' }}>
        {total > 0 ? (
          <Doughnut data={data} options={options} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            Henüz hasta kaydı bulunmuyor
          </div>
        )}
      </div>
    </div>
  )
}
