'use client'

import { useEffect, useRef } from 'react'
import { createChart, IChartApi, ISeriesApi, LineData } from 'lightweight-charts'

interface TrendChartProps {
  data: LineData[]
  title?: string
  color?: string
  height?: number
}

export function TrendChart({ data, title, color = '#3b82f6', height = 300 }: TrendChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Line'> | null>(null)

  useEffect(() => {
    if (!chartContainerRef.current) return

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height,
      layout: {
        background: { color: 'transparent' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: '#374151' },
        horzLines: { color: '#374151' },
      },
      timeScale: {
        borderColor: '#4b5563',
        timeVisible: true,
      },
      rightPriceScale: {
        borderColor: '#4b5563',
      },
    })

    chartRef.current = chart

    // Create line series
    const lineSeries = chart.addSeries({
      color,
      lineWidth: 2,
    } as any)

    seriesRef.current = lineSeries as any
    lineSeries.setData(data)

    // Fit content
    chart.timeScale().fitContent()

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [data, color, height])

  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold mb-4 text-gray-200">{title}</h3>}
      <div ref={chartContainerRef} className="w-full" />
    </div>
  )
}
