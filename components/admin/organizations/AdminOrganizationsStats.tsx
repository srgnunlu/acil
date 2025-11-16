'use client'

import { Building2, CheckCircle, Clock, Crown } from 'lucide-react'
import { AdminStatCard } from '../AdminStatCard'

interface AdminOrganizationsStatsProps {
  totalOrgs: number
  activeOrgs: number
  trialOrgs: number
  enterpriseOrgs: number
}

export function AdminOrganizationsStats({
  totalOrgs,
  activeOrgs,
  trialOrgs,
  enterpriseOrgs,
}: AdminOrganizationsStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <AdminStatCard
        title="Toplam Organizasyon"
        value={totalOrgs}
        icon={Building2}
        color="blue"
      />
      <AdminStatCard
        title="Aktif Abonelik"
        value={activeOrgs}
        icon={CheckCircle}
        color="green"
      />
      <AdminStatCard
        title="Deneme Sürümü"
        value={trialOrgs}
        icon={Clock}
        color="amber"
      />
      <AdminStatCard
        title="Enterprise"
        value={enterpriseOrgs}
        icon={Crown}
        color="purple"
      />
    </div>
  )
}
