'use client'

import { Activity, TrendingUp, Users, FileText } from 'lucide-react'
import { AdminStatCard } from '../AdminStatCard'

interface AdminActivityStatsProps {
  totalActivities: number
  todayActivities: number
  userLogins: number
  patientActions: number
}

export function AdminActivityStats({
  totalActivities,
  todayActivities,
  userLogins,
  patientActions,
}: AdminActivityStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <AdminStatCard
        title="Toplam Aktivite"
        value={totalActivities.toLocaleString('tr-TR')}
        icon={Activity}
        color="blue"
      />
      <AdminStatCard
        title="Bugünkü Aktivite"
        value={todayActivities.toLocaleString('tr-TR')}
        icon={TrendingUp}
        color="green"
      />
      <AdminStatCard
        title="Giriş (24s)"
        value={userLogins.toLocaleString('tr-TR')}
        icon={Users}
        color="purple"
      />
      <AdminStatCard
        title="Hasta İşlemleri (Bugün)"
        value={patientActions.toLocaleString('tr-TR')}
        icon={FileText}
        color="orange"
      />
    </div>
  )
}
