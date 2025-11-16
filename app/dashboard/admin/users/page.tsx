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

  // Build query
  let query = supabase
    .from('profiles')
    .select(
      `
      *,
      workspace_members(
        id,
        role,
        status,
        workspace_id,
        workspaces(name, organization_id)
      )
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  // Apply filters
  if (searchParams.search) {
    query = query.or(
      `full_name.ilike.%${searchParams.search}%,user_id.ilike.%${searchParams.search}%`
    )
  }

  const { data: users, error, count } = await query

  // Get stats
  const [
    { count: totalUsers },
    { count: activeUsers },
    { count: inactiveUsers },
    { count: newUsersThisMonth },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('last_seen_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .lt('last_seen_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
  ])

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
