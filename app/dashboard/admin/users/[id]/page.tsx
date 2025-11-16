import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ArrowLeft, Edit, Trash2, User, Calendar, Shield, Briefcase, Activity } from 'lucide-react'
import Link from 'next/link'
import { AdminUserDeleteButton } from '@/components/admin/users/AdminUserDeleteButton'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

export default async function AdminUserDetailPage({
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

  // Fetch user profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', params.id)
    .single()

  if (error || !profile) {
    notFound()
  }

  // Fetch workspace memberships
  const { data: userMemberships } = await supabase
    .from('workspace_members')
    .select('id, role, status, joined_at, workspaces(name, type, organization_id, organizations(name))')
    .eq('user_id', params.id)

  // Fetch activity logs
  const { data: recentActivity } = await supabase
    .from('user_activity_log')
    .select('*')
    .eq('user_id', params.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const activeWorkspaces = userMemberships?.filter((m) => m.status === 'active').length || 0

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href="/dashboard/admin/users"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Kullanıcılara Geri Dön
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {(profile.full_name || 'U')[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {profile.full_name || 'İsimsiz Kullanıcı'}
            </h1>
            <p className="mt-1 text-gray-600">{profile.specialty || 'Uzmanlık belirtilmemiş'}</p>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  profile.subscription_tier === 'pro'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {profile.subscription_tier === 'pro' ? 'Pro' : 'Free'}
              </span>
              {profile.last_seen_at && (
                <span className="flex items-center gap-1 text-xs text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  {formatDistanceToNow(new Date(profile.last_seen_at), {
                    addSuffix: true,
                    locale: tr,
                  })}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/admin/users/${params.id}/edit`}
            className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit className="w-4 h-4" />
            Düzenle
          </Link>
          <AdminUserDeleteButton userId={params.id} />
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
              <p className="text-sm text-gray-600">Aktif Workspace</p>
              <p className="text-2xl font-bold text-gray-900">{activeWorkspaces}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Hasta Limiti</p>
              <p className="text-2xl font-bold text-gray-900">{profile.patient_limit || 100}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Aktivite</p>
              <p className="text-2xl font-bold text-gray-900">{recentActivity?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Kayıt Tarihi</p>
              <p className="text-sm font-semibold text-gray-900">
                {new Date(profile.created_at).toLocaleDateString('tr-TR')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Kullanıcı Bilgileri</h3>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-gray-600">User ID</dt>
              <dd className="text-sm font-mono text-gray-900">{profile.user_id}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">İsim</dt>
              <dd className="text-sm font-medium text-gray-900">
                {profile.full_name || '-'}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">Uzmanlık</dt>
              <dd className="text-sm font-medium text-gray-900">{profile.specialty || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">Kurum</dt>
              <dd className="text-sm font-medium text-gray-900">{profile.institution || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">Son Görülme</dt>
              <dd className="text-sm font-medium text-gray-900">
                {profile.last_seen_at
                  ? new Date(profile.last_seen_at).toLocaleString('tr-TR')
                  : 'Hiç'}
              </dd>
            </div>
          </dl>
        </div>

        {/* Workspaces */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Workspace Üyelikleri ({userMemberships?.length || 0})
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {userMemberships && userMemberships.length > 0 ? (
              userMemberships.map((membership) => (
                <div
                  key={membership.id}
                  className={`p-3 rounded-lg ${
                    membership.status === 'active' ? 'bg-green-50' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {(membership.workspaces as any)?.name || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-600">
                        {(membership.workspaces as any)?.organizations?.name || 'Unknown Org'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          membership.role === 'owner'
                            ? 'bg-purple-100 text-purple-800'
                            : membership.role === 'admin'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {membership.role}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {membership.status === 'active' ? 'Aktif' : 'İnaktif'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">Henüz workspace üyeliği yok</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {recentActivity && recentActivity.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Son Aktiviteler</h3>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Activity className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.description || activity.activity_type}</p>
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(activity.created_at), {
                      addSuffix: true,
                      locale: tr,
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
