import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminActivityLogsTable } from '@/components/admin/activity/AdminActivityLogsTable'
import { AdminActivityStats } from '@/components/admin/activity/AdminActivityStats'
import { AdminActivityFilters } from '@/components/admin/activity/AdminActivityFilters'

export default async function AdminActivityLogsPage({
  searchParams,
}: {
  searchParams: { type?: string; user?: string; page?: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const page = parseInt(searchParams.page || '1')
  const limit = 50
  const offset = (page - 1) * limit

  // Build query
  let query = supabase
    .from('user_activity_log')
    .select(
      `
      *,
      profiles(full_name, avatar_url)
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  // Apply filters
  if (searchParams.type) {
    query = query.eq('activity_type', searchParams.type)
  }

  if (searchParams.user) {
    query = query.eq('user_id', searchParams.user)
  }

  const { data: activities, count } = await query

  // Get stats
  const [
    { count: totalActivities },
    { count: todayActivities },
    { count: userLogins },
    { count: patientActions },
  ] = await Promise.all([
    supabase.from('user_activity_log').select('*', { count: 'exact', head: true }),
    supabase
      .from('user_activity_log')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date().toISOString().split('T')[0]),
    supabase
      .from('user_activity_log')
      .select('*', { count: 'exact', head: true })
      .eq('activity_type', 'user_login')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from('user_activity_log')
      .select('*', { count: 'exact', head: true })
      .in('activity_type', ['patient_create', 'patient_update', 'patient_delete'])
      .gte('created_at', new Date().toISOString().split('T')[0]),
  ])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Aktivite Logları</h1>
        <p className="mt-2 text-gray-600">
          Tüm kullanıcı aktivitelerini ve sistem olaylarını görüntüleyin
        </p>
      </div>

      {/* Stats */}
      <AdminActivityStats
        totalActivities={totalActivities || 0}
        todayActivities={todayActivities || 0}
        userLogins={userLogins || 0}
        patientActions={patientActions || 0}
      />

      {/* Filters */}
      <AdminActivityFilters />

      {/* Activity Table */}
      <AdminActivityLogsTable
        activities={activities || []}
        total={count || 0}
        currentPage={page}
      />
    </div>
  )
}
