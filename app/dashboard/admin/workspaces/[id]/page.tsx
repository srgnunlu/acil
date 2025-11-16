import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, Trash2 } from 'lucide-react'

export default async function AdminWorkspaceDetailPage({
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

  // Fetch workspace
  const { data: workspace, error } = await supabase
    .from('workspaces')
    .select(
      `
      *,
      organization:organizations(id, name, slug)
    `
    )
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error || !workspace) {
    notFound()
  }

  // Get member count
  const { count: memberCount } = await supabase
    .from('workspace_members')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', id)
    .eq('status', 'active')

  // Get patient count
  const { count: patientCount } = await supabase
    .from('patients')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', id)
    .is('deleted_at', null)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/admin/workspaces"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{workspace.name}</h1>
            <p className="mt-1 text-gray-600">{workspace.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/admin/workspaces/${id}/edit`}
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
          <h3 className="text-sm font-medium text-gray-500">Üye Sayısı</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{memberCount || 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500">Hasta Sayısı</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{patientCount || 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500">Durum</h3>
          <p className="mt-2">
            <span
              className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${
                workspace.is_active
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {workspace.is_active ? 'Aktif' : 'Pasif'}
            </span>
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Detaylar</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Organizasyon</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(workspace as any).organization?.name || '-'}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Tip</dt>
            <dd className="mt-1 text-sm text-gray-900">{workspace.type || '-'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Açıklama</dt>
            <dd className="mt-1 text-sm text-gray-900">{workspace.description || '-'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Oluşturulma Tarihi</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(workspace.created_at).toLocaleDateString('tr-TR')}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}

