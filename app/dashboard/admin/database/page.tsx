import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminDatabaseTables } from '@/components/admin/database/AdminDatabaseTables'
import { AdminDatabaseStats } from '@/components/admin/database/AdminDatabaseStats'

export default async function AdminDatabasePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get table counts
  const tables = [
    { name: 'profiles', label: 'Profiller' },
    { name: 'organizations', label: 'Organizasyonlar' },
    { name: 'workspaces', label: 'Workspace\'ler' },
    { name: 'workspace_members', label: 'Workspace Üyeleri' },
    { name: 'patients', label: 'Hastalar' },
    { name: 'patient_data', label: 'Hasta Verileri' },
    { name: 'patient_tests', label: 'Hasta Testleri' },
    { name: 'patient_categories', label: 'Hasta Kategorileri' },
    { name: 'patient_assignments', label: 'Hasta Atamaları' },
    { name: 'ai_analyses', label: 'AI Analizleri' },
    { name: 'ai_usage_logs', label: 'AI Kullanım Logları' },
    { name: 'ai_comparisons', label: 'AI Karşılaştırmaları' },
    { name: 'ai_alerts', label: 'AI Uyarıları' },
    { name: 'chat_messages', label: 'Chat Mesajları' },
    { name: 'sticky_notes', label: 'Sticky Notes' },
    { name: 'notifications', label: 'Bildirimler' },
    { name: 'user_activity_log', label: 'Aktivite Logları' },
    { name: 'workspace_invitations', label: 'Davetiyeler' },
    { name: 'reminders', label: 'Hatırlatıcılar' },
  ]

  const tableCounts = await Promise.all(
    tables.map(async (table) => {
      const { count } = await supabase
        .from(table.name as any)
        .select('*', { count: 'exact', head: true })

      return {
        ...table,
        count: count || 0,
      }
    })
  )

  // Calculate total records
  const totalRecords = tableCounts.reduce((sum, table) => sum + table.count, 0)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Veritabanı Yönetimi</h1>
        <p className="mt-2 text-gray-600">
          Tüm veritabanı tablolarını ve kayıtlarını görüntüleyin
        </p>
      </div>

      {/* Stats */}
      <AdminDatabaseStats tables={tableCounts} totalRecords={totalRecords} />

      {/* Tables */}
      <AdminDatabaseTables tables={tableCounts} />
    </div>
  )
}
