'use client'

import { AdminStatCard } from '../AdminStatCard'

interface TableInfo {
  name: string
  label: string
  count: number
}

interface AdminDatabaseStatsProps {
  tables: TableInfo[]
  totalRecords: number
}

export function AdminDatabaseStats({ tables, totalRecords }: AdminDatabaseStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <AdminStatCard
        title="Toplam Tablo"
        value={tables.length}
        icon="Database"
        color="blue"
      />
      <AdminStatCard
        title="Toplam Kayıt"
        value={totalRecords.toLocaleString('tr-TR')}
        icon="FileText"
        color="green"
      />
      <AdminStatCard
        title="En Büyük Tablo"
        value={tables.length > 0 ? Math.max(...tables.map((t) => t.count)).toLocaleString('tr-TR') : '0'}
        icon="Table"
        color="purple"
      />
      <AdminStatCard
        title="Aktif Tablolar"
        value={tables.filter((t) => t.count > 0).length}
        icon="Activity"
        color="orange"
      />
    </div>
  )
}
