'use client'

import { Users, UserCheck, UserX, UserPlus } from 'lucide-react'
import { AdminStatCard } from '../AdminStatCard'

interface AdminUsersStatsProps {
  totalUsers: number
  activeUsers: number
  inactiveUsers: number
  newUsersThisMonth: number
}

export function AdminUsersStats({
  totalUsers,
  activeUsers,
  inactiveUsers,
  newUsersThisMonth,
}: AdminUsersStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <AdminStatCard
        title="Toplam Kullanıcı"
        value={totalUsers}
        icon={Users}
        color="blue"
      />
      <AdminStatCard
        title="Aktif Kullanıcı (24s)"
        value={activeUsers}
        icon={UserCheck}
        color="green"
      />
      <AdminStatCard
        title="Pasif Kullanıcı (7g)"
        value={inactiveUsers}
        icon={UserX}
        color="red"
      />
      <AdminStatCard
        title="Bu Ay Yeni"
        value={newUsersThisMonth}
        icon={UserPlus}
        color="purple"
      />
    </div>
  )
}
