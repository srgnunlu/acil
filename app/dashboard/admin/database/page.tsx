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

  // Check admin access
  const { data: memberships } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .in('role', ['owner', 'admin'])

  if (!memberships || memberships.length === 0) {
    redirect('/dashboard')
  }

  // Fetch table counts
  const [
    { count: profilesCount },
    { count: organizationsCount },
    { count: workspacesCount },
    { count: patientsCount },
    { count: aiLogsCount },
    { count: aiAlertsCount },
    { count: notificationsCount },
    { count: stickyNotesCount },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('organizations').select('*', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('workspaces').select('*', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('patients').select('*', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('ai_usage_logs').select('*', { count: 'exact', head: true }),
    supabase.from('ai_alerts').select('*', { count: 'exact', head: true }),
    supabase.from('notifications').select('*', { count: 'exact', head: true }),
    supabase.from('sticky_notes').select('*', { count: 'exact', head: true }).is('deleted_at', null),
  ])

  const tables = [
    { name: 'profiles', label: 'Kullanıcı Profilleri', count: profilesCount || 0 },
    { name: 'organizations', label: 'Organizasyonlar', count: organizationsCount || 0 },
    { name: 'workspaces', label: 'Workspace\'ler', count: workspacesCount || 0 },
    { name: 'patients', label: 'Hastalar', count: patientsCount || 0 },
    { name: 'ai_usage_logs', label: 'AI Kullanım Logları', count: aiLogsCount || 0 },
    { name: 'ai_alerts', label: 'AI Uyarıları', count: aiAlertsCount || 0 },
    { name: 'notifications', label: 'Bildirimler', count: notificationsCount || 0 },
    { name: 'sticky_notes', label: 'Sticky Notes', count: stickyNotesCount || 0 },
  ]

  const totalRecords = tables.reduce((sum, table) => sum + table.count, 0)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Veritabanı Yönetimi</h1>
        <p className="mt-2 text-gray-600">Veritabanı tablolarını ve istatistiklerini görüntüleyin</p>
      </div>

      {/* Database Stats */}
      <AdminDatabaseStats tables={tables} totalRecords={totalRecords} />

      {/* Database Tables */}
      <AdminDatabaseTables tables={tables} />
    </div>
  )
}
