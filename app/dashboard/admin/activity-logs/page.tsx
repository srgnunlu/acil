import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminTable, AdminPagination, AdminEmptyState } from '@/components/admin/common'

export default async function AdminActivityLogsPage({
  searchParams,
}: {
  searchParams: { page?: string; activity_type?: string; user_id?: string }
}) {
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

  const page = parseInt(searchParams.page || '1')
  const limit = 50
  const offset = (page - 1) * limit

  // Try activity_logs first, fallback to user_activity_log
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

  if (searchParams.activity_type) {
    query = query.eq('activity_type', searchParams.activity_type)
  }

  if (searchParams.user_id) {
    query = query.eq('user_id', searchParams.user_id)
  }

  const { data: activities, count, error } = await query

  // Fallback to user_activity_log if activity_logs fails
  let finalActivities = activities
  let finalCount = count
  if (error) {
    const { data: userActivities, count: userCount } = await supabase
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

    finalActivities = userActivities
    finalCount = userCount
  }

  // Get statistics (commented out unused variable)
  // const { count: totalActivities } = await supabase
  //   .from('activity_logs')
  //   .select('*', { count: 'exact', head: true })
  //   .catch(() => ({ count: 0 }))

  const todayStart = new Date().toISOString().split('T')[0]
  const { count: todayActivities } = await supabase
    .from('activity_logs')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', todayStart)
    .catch(() => ({ count: 0 }))

  interface ActivityItem {
    id: string
    activity_type: string
    description: string | null
    created_at: string
    user_id: string
    profiles?: {
      full_name: string | null
      avatar_url: string | null
    } | null
  }

  const columns = [
    {
      key: 'user',
      header: 'Kullanıcı',
      render: (item: ActivityItem) => (
        <div className="flex items-center gap-2">
          {item.profiles?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.profiles.avatar_url}
              alt={item.profiles.full_name || ''}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium">
              {(item.profiles?.full_name || item.user_id || 'U')[0].toUpperCase()}
            </div>
          )}
          <span className="text-sm font-medium text-gray-900">
            {item.profiles?.full_name || item.user_id || 'Bilinmeyen'}
          </span>
        </div>
      ),
    },
    {
      key: 'activity_type',
      header: 'Aktivite Tipi',
      render: (item: ActivityItem) => (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
          {item.activity_type || 'unknown'}
        </span>
      ),
    },
    {
      key: 'description',
      header: 'Açıklama',
      render: (item: ActivityItem) => (
        <div className="text-sm text-gray-900">{item.description || item.activity_type || '-'}</div>
      ),
    },
    {
      key: 'created_at',
      header: 'Tarih',
      render: (item: ActivityItem) => (
        <div className="text-sm text-gray-500">
          {new Date(item.created_at).toLocaleString('tr-TR')}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Aktivite Logları</h1>
        <p className="mt-2 text-gray-600">Sistem aktivite loglarını görüntüleyin</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500">Toplam Aktivite</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{finalCount || 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500">Bugünkü Aktivite</h3>
          <p className="mt-2 text-3xl font-bold text-green-600">{todayActivities || 0}</p>
        </div>
      </div>

      {/* Activity Table */}
      {finalActivities && finalActivities.length > 0 ? (
        <>
          <AdminTable
            columns={columns}
            data={finalActivities as ActivityItem[]}
            keyExtractor={(item: ActivityItem) => item.id}
            emptyMessage="Aktivite bulunamadı"
          />
          {finalCount && finalCount > limit && (
            <AdminPagination
              currentPage={page}
              totalPages={Math.ceil((finalCount || 0) / limit)}
              totalItems={finalCount || 0}
              itemsPerPage={limit}
              onPageChange={(newPage) => {
                // This would need to be handled client-side with useRouter
                window.location.href = `/dashboard/admin/activity-logs?page=${newPage}`
              }}
            />
          )}
        </>
      ) : (
        <AdminEmptyState
          title="Aktivite bulunamadı"
          description="Henüz aktivite logu bulunmuyor."
        />
      )}
    </div>
  )
}
