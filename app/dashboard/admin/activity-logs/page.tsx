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

  // Build query - try activity_logs first, fallback to user_activity_log
  let query = supabase
    .from('activity_logs')
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

  const queryResult = await query
  let activities = queryResult.data
  let count = queryResult.count
  const initialQueryError = queryResult.error

  // Fallback to user_activity_log if activity_logs doesn't exist
  if (initialQueryError) {
    query = supabase
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

    if (searchParams.type) {
      query = query.eq('activity_type', searchParams.type)
    }

    if (searchParams.user) {
      query = query.eq('user_id', searchParams.user)
    }

    const result = await query
    activities = result.data
    count = result.count
  }

  // Get stats - try activity_logs first, fallback to user_activity_log
  // eslint-disable-next-line react-hooks/purity
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const todayStart = new Date().toISOString().split('T')[0]
  const statsQueries = [
    supabase.from('activity_logs').select('*', { count: 'exact', head: true }),
    supabase
      .from('activity_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart),
    supabase
      .from('activity_logs')
      .select('*', { count: 'exact', head: true })
      .eq('activity_type', 'user_login')
      .gte('created_at', oneDayAgo),
    supabase
      .from('activity_logs')
      .select('*', { count: 'exact', head: true })
      .in('activity_type', ['patient_create', 'patient_update', 'patient_delete'])
      .gte('created_at', todayStart),
  ]

  const statsResults = await Promise.all(statsQueries)

  // Check if any query failed and use fallback
  let totalActivities = statsResults[0]?.count || 0
  let todayActivities = statsResults[1]?.count || 0
  let userLogins = statsResults[2]?.count || 0
  let patientActions = statsResults[3]?.count || 0

  if (statsResults[0]?.error) {
    // Use user_activity_log as fallback
    const fallbackStats = await Promise.all([
      supabase.from('user_activity_log').select('*', { count: 'exact', head: true }),
      supabase
        .from('user_activity_log')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart),
      supabase
        .from('user_activity_log')
        .select('*', { count: 'exact', head: true })
        .eq('activity_type', 'user_login')
        .gte('created_at', oneDayAgo),
      supabase
        .from('user_activity_log')
        .select('*', { count: 'exact', head: true })
        .in('activity_type', ['patient_create', 'patient_update', 'patient_delete'])
        .gte('created_at', todayStart),
    ])

    totalActivities = fallbackStats[0]?.count || 0
    todayActivities = fallbackStats[1]?.count || 0
    userLogins = fallbackStats[2]?.count || 0
    patientActions = fallbackStats[3]?.count || 0
  }

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
      <AdminActivityLogsTable activities={activities || []} total={count || 0} currentPage={page} />
    </div>
  )
}
