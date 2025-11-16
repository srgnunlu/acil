import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { AdminTable, AdminPagination, AdminEmptyState, AdminBadge } from '@/components/admin/common'
import { AdminWorkspacesSearch } from '@/components/admin/workspaces/AdminWorkspacesSearch'

export default async function AdminWorkspacesPage({
  searchParams,
}: {
  searchParams: { organization_id?: string; search?: string; page?: string }
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

  // Fetch workspaces
  let query = supabase
    .from('workspaces')
    .select(
      `
      *,
      organization:organizations(id, name, slug)
    `,
      { count: 'exact' }
    )
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (searchParams.organization_id) {
    query = query.eq('organization_id', searchParams.organization_id)
  }

  if (searchParams.search) {
    query = query.or(`name.ilike.%${searchParams.search}%,slug.ilike.%${searchParams.search}%`)
  }

  const { data: workspaces, count } = await query

  // Get member and patient counts
  if (workspaces && workspaces.length > 0) {
    const workspaceIds = workspaces.map((w) => w.id)

    const { data: memberCounts } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .in('workspace_id', workspaceIds)
      .eq('status', 'active')

    const { data: patientCounts } = await supabase
      .from('patients')
      .select('workspace_id')
      .in('workspace_id', workspaceIds)
      .is('deleted_at', null)

    const memberCountMap = new Map<string, number>()
    const patientCountMap = new Map<string, number>()

    memberCounts?.forEach((m) => {
      memberCountMap.set(m.workspace_id, (memberCountMap.get(m.workspace_id) || 0) + 1)
    })

    patientCounts?.forEach((p) => {
      patientCountMap.set(p.workspace_id, (patientCountMap.get(p.workspace_id) || 0) + 1)
    })

    workspaces.forEach((workspace) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(workspace as any).member_count = memberCountMap.get(workspace.id) || 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(workspace as any).patient_count = patientCountMap.get(workspace.id) || 0
    })
  }

  interface WorkspaceItem {
    id: string
    name: string
    slug: string
    type: string
    is_active: boolean
    created_at: string
    organization?: { name: string }
    member_count?: number
    patient_count?: number
  }

  const columns = [
    {
      key: 'name',
      header: 'Workspace',
      render: (item: WorkspaceItem) => (
        <div>
          <Link
            href={`/dashboard/admin/workspaces/${item.id}`}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            {item.name}
          </Link>
          <p className="text-xs text-gray-500">{item.slug}</p>
        </div>
      ),
    },
    {
      key: 'organization',
      header: 'Organizasyon',
      render: (item: WorkspaceItem) => (
        <div className="text-sm text-gray-900">{item.organization?.name || '-'}</div>
      ),
    },
    {
      key: 'type',
      header: 'Tip',
      render: (item: WorkspaceItem) => <AdminBadge label={item.type || '-'} variant="status" />,
    },
    {
      key: 'member_count',
      header: 'Üyeler',
      render: (item: WorkspaceItem) => <div className="text-sm text-gray-900">{item.member_count || 0}</div>,
    },
    {
      key: 'patient_count',
      header: 'Hastalar',
      render: (item: WorkspaceItem) => <div className="text-sm text-gray-900">{item.patient_count || 0}</div>,
    },
    {
      key: 'is_active',
      header: 'Durum',
      render: (item: WorkspaceItem) => (
        <AdminBadge
          label={item.is_active ? 'Aktif' : 'Pasif'}
          variant="status"
          customColor={item.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
        />
      ),
    },
    {
      key: 'created_at',
      header: 'Oluşturulma',
      render: (item: WorkspaceItem) => (
        <div className="text-sm text-gray-500">
          {new Date(item.created_at).toLocaleDateString('tr-TR')}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Workspace Yönetimi</h1>
          <p className="mt-2 text-gray-600">Tüm workspace'leri görüntüleyin ve yönetin</p>
        </div>
        <Link
          href="/dashboard/admin/workspaces/create"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Yeni Workspace
        </Link>
      </div>

      {/* Search Bar */}
      <AdminWorkspacesSearch initialSearch={searchParams.search} />

      {/* Workspaces Table */}
      {workspaces && workspaces.length > 0 ? (
        <>
          <AdminTable
            columns={columns}
            data={workspaces}
            keyExtractor={(item: any) => item.id}
            onRowClick={(item: WorkspaceItem) => {
              if (typeof window !== 'undefined') {
                window.location.href = `/dashboard/admin/workspaces/${item.id}`
              }
            }}
            emptyMessage="Workspace bulunamadı"
          />
          {count && count > limit && (
            <AdminPagination
              currentPage={page}
              totalPages={Math.ceil(count / limit)}
              totalItems={count}
              itemsPerPage={limit}
              onPageChange={(newPage) => {
                if (typeof window !== 'undefined') {
                  const params = new URLSearchParams()
                  if (searchParams.organization_id) params.set('organization_id', searchParams.organization_id)
                  if (searchParams.search) params.set('search', searchParams.search)
                  params.set('page', newPage.toString())
                  window.location.href = `/dashboard/admin/workspaces?${params.toString()}`
                }
              }}
            />
          )}
        </>
      ) : (
        <AdminEmptyState
          title="Workspace bulunamadı"
          description="Henüz workspace oluşturulmamış."
          action={
            <Link
              href="/dashboard/admin/workspaces/create"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              İlk Workspace&apos;i Oluştur
            </Link>
          }
        />
      )}
    </div>
  )
}
