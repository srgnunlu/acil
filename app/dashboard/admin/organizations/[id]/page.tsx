import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, Trash2 } from 'lucide-react'

export default async function AdminOrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
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

  const { id } = await params

  // Fetch organization
  const { data: org, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error || !org) {
    notFound()
  }

  // Get workspace count
  const { count: workspaceCount } = await supabase
    .from('workspaces')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', id)
    .is('deleted_at', null)

  // Get member count
  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id')
    .eq('organization_id', id)
    .is('deleted_at', null)

  let totalMembers = 0
  if (workspaces && workspaces.length > 0) {
    const { count } = await supabase
      .from('workspace_members')
      .select('*', { count: 'exact', head: true })
      .in(
        'workspace_id',
        workspaces.map((w) => w.id)
      )
      .eq('status', 'active')

    totalMembers = count || 0
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/admin/organizations"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{org.name}</h1>
            <p className="mt-1 text-gray-600">{org.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/admin/organizations/${id}/edit`}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit className="w-4 h-4" />
            Düzenle
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500">Workspace Sayısı</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{workspaceCount || 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500">Toplam Üye</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{totalMembers}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500">Abonelik Durumu</h3>
          <p className="mt-2">
            <span
              className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${
                org.subscription_status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {org.subscription_status}
            </span>
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Organizasyon Detayları</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Tip</dt>
            <dd className="mt-1 text-sm text-gray-900">{org.type || '-'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Abonelik Seviyesi</dt>
            <dd className="mt-1 text-sm text-gray-900">{org.subscription_tier || '-'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Maksimum Kullanıcı</dt>
            <dd className="mt-1 text-sm text-gray-900">{org.max_users || '-'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Maksimum Workspace</dt>
            <dd className="mt-1 text-sm text-gray-900">{org.max_workspaces || '-'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">İletişim Email</dt>
            <dd className="mt-1 text-sm text-gray-900">{org.contact_email || '-'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">İletişim Telefon</dt>
            <dd className="mt-1 text-sm text-gray-900">{org.contact_phone || '-'}</dd>
          </div>
          <div className="md:col-span-2">
            <dt className="text-sm font-medium text-gray-500">Adres</dt>
            <dd className="mt-1 text-sm text-gray-900">{org.address || '-'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Oluşturulma Tarihi</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(org.created_at).toLocaleDateString('tr-TR')}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
