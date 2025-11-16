import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: { start_date?: string; end_date?: string; workspace_id?: string }
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

  // Fetch analytics data from API
  const params = new URLSearchParams()
  if (searchParams.start_date) params.set('start_date', searchParams.start_date)
  if (searchParams.end_date) params.set('end_date', searchParams.end_date)
  if (searchParams.workspace_id) params.set('workspace_id', searchParams.workspace_id)

  // Note: In a real implementation, we would fetch from the API
  // For now, we'll fetch directly from the database
  // eslint-disable-next-line react-hooks/purity
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const startDate = searchParams.start_date ? new Date(searchParams.start_date) : thirtyDaysAgo
  // eslint-disable-next-line react-hooks/purity
  const endDate = searchParams.end_date ? new Date(searchParams.end_date) : new Date()

  // Get overall statistics
  const [
    { count: totalUsers },
    { count: totalOrganizations },
    { count: totalWorkspaces },
    { count: totalPatients },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null),
    supabase.from('workspaces').select('*', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('patients').select('*', { count: 'exact', head: true }).is('deleted_at', null),
  ])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analitik ve Raporlama</h1>
        <p className="mt-2 text-gray-600">Sistem geneli istatistikler ve trend analizi</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500">Toplam Kullanıcı</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{totalUsers || 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500">Organizasyonlar</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{totalOrganizations || 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500">Workspace'ler</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{totalWorkspaces || 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500">Toplam Hasta</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{totalPatients || 0}</p>
        </div>
      </div>

      {/* Placeholder for charts */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Aktivite Trendleri</h2>
        <p className="text-gray-500">Grafikler yakında eklenecek</p>
      </div>
    </div>
  )
}

