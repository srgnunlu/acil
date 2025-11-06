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

interface DataEntryChartProps {
  dataCounts: {
    anamnesis: number
    vital_signs: number
    medications: number
    history: number
    demographics: number
  }
}

export function DataEntryChart({ dataCounts }: DataEntryChartProps) {
  const data = {
    labels: ['Anamnez', 'Vital Bulgular', 'İlaçlar', 'Geçmiş', 'Demografik'],
    datasets: [
      {
        label: 'Veri Girişi',
        data: [
          dataCounts.anamnesis,
          dataCounts.vital_signs,
          dataCounts.medications,
          dataCounts.history,
          dataCounts.demographics,
        ],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',    // red
          'rgba(34, 197, 94, 0.8)',    // green
          'rgba(59, 130, 246, 0.8)',   // blue
          'rgba(251, 191, 36, 0.8)',   // yellow
          'rgba(168, 85, 247, 0.8)',   // purple
        ],
        borderColor: [
          'rgba(239, 68, 68, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(251, 191, 36, 1)',
          'rgba(168, 85, 247, 1)',
        ],
        borderWidth: 2,
      },
    ],
  }

  const options: ChartOptions<'bar'> = {
    indexAxis: 'y', // Horizontal bar chart
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
            return `${context.parsed.x} veri`
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  }

  const total = Object.values(dataCounts).reduce((a, b) => a + b, 0)

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Veri Tipi Dağılımı</h3>
        <span className="text-sm text-gray-500">Toplam: {total}</span>
      </div>
      <div style={{ height: '300px' }}>
        {total > 0 ? (
          <Bar data={data} options={options} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            Henüz veri girişi bulunmuyor
          </div>
        )}
      </div>
    </div>
  )
}
