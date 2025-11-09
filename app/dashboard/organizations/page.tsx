import { createClient } from '@/lib/supabase/server'
import { OrganizationCard } from '@/components/organizations/OrganizationCard'
import { Building2, Plus } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function OrganizationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch organizations from organization_members (yeni iki seviyeli sistem)
  const { data: orgMemberships, error: orgMemberError } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .eq('status', 'active')

  if (orgMemberError) {
    console.error('[OrganizationsPage] Error fetching organization memberships:', orgMemberError)
  }

  // Extract organization IDs
  const orgIds = new Set<string>()
  if (orgMemberships && orgMemberships.length > 0) {
    orgMemberships.forEach((m) => {
      if (m.organization_id) {
        orgIds.add(m.organization_id)
      }
    })
  }

  // Also check profile for backward compatibility
  const { data: profile } = await supabase
    .from('profiles')
    .select('current_organization_id')
    .eq('user_id', user.id)
    .single()

  if (profile?.current_organization_id) {
    orgIds.add(profile.current_organization_id)
  }

  // Get organizations
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let organizations: any[] = []
  if (orgIds.size > 0) {
    const orgIdsArray = Array.from(orgIds)
    const { data: orgs } = await supabase
      .from('organizations')
      .select('*')
      .in('id', orgIdsArray)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    organizations = orgs || []
  }

  // Fetch stats for each organization
  const organizationsWithStats = await Promise.all(
    organizations.map(async (org) => {
      // Get workspace count
      const { count: workspaceCount } = await supabase
        .from('workspaces')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', org.id)
        .is('deleted_at', null)

      // Get member count (unique users across all workspaces)
      const { data: memberships } = await supabase
        .from('workspace_members')
        .select('user_id')
        .eq('status', 'active')
        .in(
          'workspace_id',
          (
            await supabase
              .from('workspaces')
              .select('id')
              .eq('organization_id', org.id)
              .is('deleted_at', null)
          ).data?.map((w) => w.id) || []
        )

      const uniqueMemberIds = new Set(memberships?.map((m) => m.user_id) || [])
      const memberCount = uniqueMemberIds.size

      return {
        ...org,
        workspaceCount: workspaceCount || 0,
        memberCount,
      }
    })
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Organizasyonlar</h1>
          <p className="mt-2 text-gray-600">Organizasyonlarınızı yönetin ve görüntüleyin</p>
        </div>
        <Link
          href="/dashboard/organizations/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Yeni Organizasyon
        </Link>
      </div>

      {/* Organizations List */}
      {organizationsWithStats.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz organizasyon yok</h3>
          <p className="text-gray-600 mb-6">İlk organizasyonunuzu oluşturarak başlayın</p>
          <Link
            href="/dashboard/organizations/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Yeni Organizasyon Oluştur
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizationsWithStats.map((org) => (
            <OrganizationCard
              key={org.id}
              organization={org}
              workspaceCount={org.workspaceCount}
              memberCount={org.memberCount}
            />
          ))}
        </div>
      )}
    </div>
  )
}
