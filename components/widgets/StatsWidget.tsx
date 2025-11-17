'use client'

import { useQuery } from '@tanstack/react-query'
import { WidgetInstance } from '@/types/widget.types'
import { fetchWidgetData } from '@/lib/widgets/widget-data-providers'
import { StatCardWithTrend } from '@/components/dashboard/StatCardWithTrend'
import { Users, AlertTriangle, Clock, TrendingUp } from 'lucide-react'

interface StatsWidgetProps {
  instance: WidgetInstance
  workspaceId: string
  userId: string
}

export function StatsWidget({ instance, workspaceId, userId }: StatsWidgetProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['widget', instance.id, workspaceId],
    queryFn: () =>
      fetchWidgetData(instance, {
        workspaceId,
        userId,
      }),
    refetchInterval: 60000, // 1 minute
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-lg" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-32 text-red-600">
        <p className="text-sm">Veri yüklenirken hata oluştu</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCardWithTrend
        title="Aktif Hasta"
        value={data?.activePatients || 0}
        color="green"
        icon={Users}
        trend={{ direction: 'up', percentage: 8, period: '7g' }}
        realtime={true}
      />
      <StatCardWithTrend
        title="Kritik Vakalar"
        value={data?.criticalPatients || 0}
        color="red"
        icon={AlertTriangle}
        trend={{ direction: 'down', percentage: 5, period: '7g' }}
        realtime={true}
      />
      <StatCardWithTrend
        title="Ort. Kalış"
        value={data?.avgStayDuration?.toFixed(1) || '0'}
        unit="gün"
        color="blue"
        icon={Clock}
      />
      <StatCardWithTrend
        title="Bugün"
        value={data?.todayAdmissions || 0}
        color="indigo"
        icon={TrendingUp}
      />
    </div>
  )
}
