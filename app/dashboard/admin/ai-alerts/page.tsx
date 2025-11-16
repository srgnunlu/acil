import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminAIAlertsPage({
  searchParams,
}: {
  searchParams: { severity?: string; status?: string; page?: string }
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

  // Fetch alerts
  let query = supabase
    .from('ai_alerts')
    .select(
      `
      *,
      patient:patients(id, name),
      workspace:workspaces(id, name, slug)
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (searchParams.severity) {
    query = query.eq('severity', searchParams.severity)
  }

  if (searchParams.status) {
    query = query.eq('status', searchParams.status)
  }

  const { data: alerts, count } = await query

  // Get statistics
  const { count: activeAlerts } = await supabase
    .from('ai_alerts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  const { count: criticalAlerts } = await supabase
    .from('ai_alerts')
    .select('*', { count: 'exact', head: true })
    .eq('severity', 'critical')
    .eq('status', 'active')

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">AI Uyarıları</h1>
        <p className="mt-2 text-gray-600">AI tarafından oluşturulan uyarıları görüntüleyin ve yönetin</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500">Aktif Uyarılar</h3>
          <p className="mt-2 text-3xl font-bold text-yellow-600">{activeAlerts || 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500">Kritik Uyarılar</h3>
          <p className="mt-2 text-3xl font-bold text-red-600">{criticalAlerts || 0}</p>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Uyarı
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hasta
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Önem
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Durum
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tarih
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {alerts && alerts.length > 0 ? (
              alerts.map((alert) => (
                <tr key={alert.id}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{alert.title}</div>
                    <div className="text-sm text-gray-500 line-clamp-1">{alert.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {(alert as any).patient?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        alert.severity === 'critical'
                          ? 'bg-red-100 text-red-800'
                          : alert.severity === 'high'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {alert.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        alert.status === 'active'
                          ? 'bg-yellow-100 text-yellow-800'
                          : alert.status === 'resolved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {alert.status === 'active'
                        ? 'Aktif'
                        : alert.status === 'resolved'
                          ? 'Çözüldü'
                          : alert.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(alert.created_at).toLocaleDateString('tr-TR')}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                  Uyarı bulunamadı
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

