import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminUsersTable } from '@/components/admin/users/AdminUsersTable'
import { AdminUsersFilters } from '@/components/admin/users/AdminUsersFilters'
import { AdminUsersStats } from '@/components/admin/users/AdminUsersStats'

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { search?: string; status?: string; page?: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const page = parseInt(searchParams.page || '1')
  const limit = 20
  const offset = (page - 1) * limit

  // Build query - fetch profiles first, then workspace_members separately
  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  // Apply filters
  if (searchParams.search) {
    query = query.or(
      `full_name.ilike.%${searchParams.search}%,user_id.ilike.%${searchParams.search}%`
    )
  }

  const { data: users, count } = await query

  // Fetch workspace_members separately for each user
  if (users && users.length > 0) {
    const userIds = users.map((u) => u.user_id)
    const { data: memberships } = await supabase
      .from('workspace_members')
      .select('id, role, status, workspace_id, user_id, workspaces(name, organization_id)')
      .in('user_id', userIds)
      .eq('status', 'active')

    // Group memberships by user_id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const membershipsByUser = new Map<string, any[]>()
    memberships?.forEach((m) => {
      if (!membershipsByUser.has(m.user_id)) {
        membershipsByUser.set(m.user_id, [])
      }
      membershipsByUser.get(m.user_id)!.push(m)
    })

    // Attach memberships to users
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    users.forEach((user: any) => {
      user.workspace_members = membershipsByUser.get(user.user_id) || []
    })
  }

  // Get stats
  // eslint-disable-next-line react-hooks/purity
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  // eslint-disable-next-line react-hooks/purity
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  const [
    { count: totalUsers },
    activeUsersResult,
    inactiveUsersResult,
    { count: newUsersThisMonth },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    // Try last_seen_at first, fallback to updated_at
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('last_seen_at', oneDayAgo),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .lt('last_seen_at', sevenDaysAgo),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', firstDayOfMonth),
  ])

  // Handle last_seen_at fallback
  let activeUsers = activeUsersResult?.count || 0
  let inactiveUsers = inactiveUsersResult?.count || 0

  if (activeUsersResult?.error) {
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('updated_at', oneDayAgo)
    activeUsers = count || 0
  }

  if (inactiveUsersResult?.error) {
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .lt('updated_at', sevenDaysAgo)
    inactiveUsers = count || 0
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kullanıcı Yönetimi</h1>
          <p className="mt-2 text-gray-600">Tüm kullanıcıları görüntüleyin ve yönetin</p>
        </div>
      </div>

      {/* Stats */}
      <AdminUsersStats
        totalUsers={totalUsers || 0}
        activeUsers={activeUsers || 0}
        inactiveUsers={inactiveUsers || 0}
        newUsersThisMonth={newUsersThisMonth || 0}
      />

      {/* Filters */}
      <AdminUsersFilters />

      {/* Users Table */}
      <AdminUsersTable users={users || []} total={count || 0} currentPage={page} />
    </div>
  )
}
