import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ArrowLeft, Edit, Trash2, Building2, Users, Briefcase, Calendar, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { AdminOrganizationDeleteButton } from '@/components/admin/organizations/AdminOrganizationDeleteButton'

export default async function AdminOrganizationDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user is admin/owner
  const { data: memberships } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .in('role', ['owner', 'admin'])

  if (!memberships || memberships.length === 0) {
    redirect('/dashboard')
  }

  // Fetch organization
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/admin/organizations?org_id=${params.id}`,
    {
      headers: {
        Cookie: (await import('next/headers')).cookies().toString(),
      },
    }
  )

  if (!response.ok) {
    notFound()
  }

  const org = await response.json()

  // Fetch workspaces
  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id, name, type, created_at, workspace_members(count)')
    .eq('organization_id', params.id)
    .is('deleted_at', null)

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href="/dashboard/admin/organizations"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Organizasyonlara Geri Dön
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{org.name}</h1>
            <p className="mt-1 text-gray-600">{org.slug}</p>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  org.subscription_tier === 'enterprise'
                    ? 'bg-purple-100 text-purple-800'
                    : org.subscription_tier === 'pro'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                }`}
              >
                {org.subscription_tier === 'enterprise'
                  ? 'Enterprise'
                  : org.subscription_tier === 'pro'
                    ? 'Pro'
                    : 'Free'}
              </span>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  org.subscription_status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : org.subscription_status === 'trial'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                }`}
              >
                {org.subscription_status === 'active'
                  ? 'Aktif'
                  : org.subscription_status === 'trial'
                    ? 'Deneme'
                    : 'İnaktif'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/admin/organizations/${params.id}/edit`}
            className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit className="w-4 h-4" />
            Düzenle
          </Link>
          <AdminOrganizationDeleteButton orgId={params.id} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Workspace</p>
              <p className="text-2xl font-bold text-gray-900">{org.workspace_count}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Toplam Üye</p>
              <p className="text-2xl font-bold text-gray-900">{org.member_count}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Kullanıcı Limiti</p>
              <p className="text-2xl font-bold text-gray-900">{org.max_users}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Oluşturulma</p>
              <p className="text-sm font-semibold text-gray-900">
                {new Date(org.created_at).toLocaleDateString('tr-TR')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detay Bilgiler</h3>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-gray-600">Organizasyon Tipi</dt>
              <dd className="text-sm font-medium text-gray-900 capitalize">
                {org.type?.replace('_', ' ') || '-'}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">Maksimum Workspace</dt>
              <dd className="text-sm font-medium text-gray-900">{org.max_workspaces}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">Workspace Başına Hasta Limiti</dt>
              <dd className="text-sm font-medium text-gray-900">{org.max_patients_per_workspace}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">Son Güncelleme</dt>
              <dd className="text-sm font-medium text-gray-900">
                {new Date(org.updated_at).toLocaleString('tr-TR')}
              </dd>
            </div>
          </dl>
        </div>

        {/* Workspaces */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Workspace'ler ({workspaces?.length || 0})
          </h3>
          <div className="space-y-2">
            {workspaces && workspaces.length > 0 ? (
              workspaces.map((workspace) => (
                <div
                  key={workspace.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{workspace.name}</p>
                    <p className="text-xs text-gray-500 capitalize">
                      {workspace.type?.replace('_', ' ')}
                    </p>
                  </div>
                  <span className="text-xs text-gray-600">
                    {new Date(workspace.created_at).toLocaleDateString('tr-TR')}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">Henüz workspace oluşturulmamış</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
