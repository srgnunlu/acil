import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit } from 'lucide-react'

export default async function AdminProtocolDetailPage({
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

  // Fetch protocol
  const { data: protocol, error } = await supabase
    .from('protocols')
    .select(
      `
      *,
      category:protocol_categories(id, name, color),
      workspace:workspaces(id, name, slug)
    `
    )
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error || !protocol) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/admin/protocols"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{protocol.title}</h1>
            {protocol.description && <p className="mt-1 text-gray-600">{protocol.description}</p>}
          </div>
        </div>
        <Link
          href={`/dashboard/admin/protocols/${id}/edit`}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Edit className="w-4 h-4" />
          Düzenle
        </Link>
      </div>

      {/* Details */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Protokol Detayları</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Workspace</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(protocol as any).workspace?.name || '-'}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Kategori</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(protocol as any).category?.name || '-'}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Durum</dt>
            <dd className="mt-1">
              <span
                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  protocol.status === 'published'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {protocol.status === 'published' ? 'Yayınlandı' : 'Taslak'}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Versiyon</dt>
            <dd className="mt-1 text-sm text-gray-900">{protocol.version || '1.0'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Oluşturulma Tarihi</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(protocol.created_at).toLocaleDateString('tr-TR')}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Güncelleme Tarihi</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(protocol.updated_at).toLocaleDateString('tr-TR')}
            </dd>
          </div>
        </dl>
      </div>

      {/* Content */}
      {protocol.content && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">İçerik</h2>
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: protocol.content }}
          />
        </div>
      )}
    </div>
  )
}

