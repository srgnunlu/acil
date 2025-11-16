import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminInvitationsPage({
  searchParams,
}: {
  searchParams: { status?: string; workspace_id?: string; page?: string }
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

  // Fetch invitations
  let query = supabase
    .from('workspace_invitations')
    .select(
      `
      *,
      workspace:workspaces(id, name, slug)
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (searchParams.status) {
    query = query.eq('status', searchParams.status)
  }

  if (searchParams.workspace_id) {
    query = query.eq('workspace_id', searchParams.workspace_id)
  }

  const { data: invitations, count } = await query

  // Get statistics
  const { count: pendingCount } = await supabase
    .from('workspace_invitations')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  const { count: acceptedCount } = await supabase
    .from('workspace_invitations')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'accepted')

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Davetiye Yönetimi</h1>
        <p className="mt-2 text-gray-600">Tüm workspace davetiyelerini görüntüleyin ve yönetin</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500">Toplam Davetiye</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{count || 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500">Bekleyen</h3>
          <p className="mt-2 text-3xl font-bold text-yellow-600">{pendingCount || 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500">Kabul Edilen</h3>
          <p className="mt-2 text-3xl font-bold text-green-600">{acceptedCount || 0}</p>
        </div>
      </div>

      {/* Invitations Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Workspace
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rol
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
            {invitations && invitations.length > 0 ? (
              invitations.map((invitation) => (
                <tr key={invitation.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {invitation.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {(invitation as any).workspace?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invitation.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        invitation.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : invitation.status === 'accepted'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {invitation.status === 'pending'
                        ? 'Bekliyor'
                        : invitation.status === 'accepted'
                          ? 'Kabul Edildi'
                          : invitation.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(invitation.created_at).toLocaleDateString('tr-TR')}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                  Davetiye bulunamadı
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

