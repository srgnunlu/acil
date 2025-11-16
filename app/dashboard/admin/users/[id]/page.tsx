import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, Mail, Calendar, Shield } from 'lucide-react'
import { AdminBadge } from '@/components/admin/common'

export default async function AdminUserDetailPage({
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

  // Fetch user profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', id)
    .single()

  if (error || !profile) {
    notFound()
  }

  // Get workspace memberships
  const { data: userMemberships } = await supabase
    .from('workspace_members')
    .select(
      `
      *,
      workspace:workspaces(id, name, slug, organization_id, organizations(id, name))
    `
    )
    .eq('user_id', id)
    .eq('status', 'active')

  // Get auth user email
  const { data: authUser } = await supabase.auth.admin.getUserById(id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/admin/users"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{profile.full_name || 'Kullanıcı'}</h1>
            <p className="mt-1 text-gray-600">{authUser?.user?.email || '-'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/admin/users/${id}/edit`}
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
          <p className="mt-2 text-3xl font-bold text-gray-900">{userMemberships?.length || 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500">Abonelik Seviyesi</h3>
          <p className="mt-2">
            <AdminBadge label={profile.subscription_tier || 'free'} variant="status" />
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500">Hasta Limiti</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{profile.patient_limit || 0}</p>
        </div>
      </div>

      {/* User Details */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Kullanıcı Bilgileri</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </dt>
            <dd className="mt-1 text-sm text-gray-900">{authUser?.user?.email || '-'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Kayıt Tarihi
            </dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(profile.created_at).toLocaleDateString('tr-TR')}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Uzmanlık</dt>
            <dd className="mt-1 text-sm text-gray-900">{profile.specialty || '-'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Kurum</dt>
            <dd className="mt-1 text-sm text-gray-900">{profile.institution || '-'}</dd>
          </div>
        </dl>
      </div>

      {/* Workspace Memberships */}
      {userMemberships && userMemberships.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Workspace Üyelikleri
          </h2>
          <div className="space-y-3">
            {userMemberships.map((membership: {
              id: string
              role: string
              workspace?: {
                name: string
                organizations?: { name: string }
              }
            }) => (
              <div
                key={membership.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {membership.workspace?.name || '-'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {membership.workspace?.organizations?.name || '-'}
                  </p>
                </div>
                <AdminBadge label={membership.role} variant="status" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
