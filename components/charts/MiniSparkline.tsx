'use client'

import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  ChartOptions,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip)

interface MiniSparklineProps {
  data: number[]
  color?: 'green' | 'blue' | 'purple' | 'red' | 'indigo' | 'amber'
  height?: number
}

const colorMap = {
  green: {
    line: 'rgb(34, 197, 94)',
    gradient: ['rgba(34, 197, 94, 0.3)', 'rgba(34, 197, 94, 0)'],
  },
  blue: {
    line: 'rgb(59, 130, 246)',
    gradient: ['rgba(59, 130, 246, 0.3)', 'rgba(59, 130, 246, 0)'],
  },
  purple: {
    line: 'rgb(168, 85, 247)',
    gradient: ['rgba(168, 85, 247, 0.3)', 'rgba(168, 85, 247, 0)'],
  },
  red: {
    line: 'rgb(239, 68, 68)',
    gradient: ['rgba(239, 68, 68, 0.3)', 'rgba(239, 68, 68, 0)'],
  },
  indigo: {
    line: 'rgb(99, 102, 241)',
    gradient: ['rgba(99, 102, 241, 0.3)', 'rgba(99, 102, 241, 0)'],
  },
  amber: {
    line: 'rgb(245, 158, 11)',
    gradient: ['rgba(245, 158, 11, 0.3)', 'rgba(245, 158, 11, 0)'],
  },
}

export function MiniSparkline({ data, color = 'blue', height = 48 }: MiniSparklineProps) {
  const colors = colorMap[color]

  const chartData = {
    labels: data.map((_, i) => `${i + 1}`),
    datasets: [
      {
        data,
        borderColor: colors.line,
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx
          const gradient = ctx.createLinearGradient(0, 0, 0, height)
          gradient.addColorStop(0, colors.gradient[0])
          gradient.addColorStop(1, colors.gradient[1])
          return gradient
        },
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: colors.line,
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
      },
    ],
  }

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
        displayColors: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 8,
        titleFont: { size: 11 },
        bodyFont: { size: 11 },
        callbacks: {
          title: () => '',
          label: (context) => `${context.parsed.y}`,
        },
      },
    },
    scales: {
      x: { display: false },
      y: { display: false },
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
  }

  return (
    <div style={{ height: `${height}px` }}>
      <Line data={chartData} options={options} />
    </div>
  )
}
