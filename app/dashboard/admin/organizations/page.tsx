import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminOrganizationsTable } from '@/components/admin/organizations/AdminOrganizationsTable'
import { AdminOrganizationsStats } from '@/components/admin/organizations/AdminOrganizationsStats'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export default async function AdminOrganizationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch organizations
  const { data: organizations } = await supabase
    .from('organizations')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  // Fetch workspace counts separately
  if (organizations && organizations.length > 0) {
    const orgIds = organizations.map((org) => org.id)
    const { data: workspaceCounts } = await supabase
      .from('workspaces')
      .select('organization_id')
      .in('organization_id', orgIds)
      .is('deleted_at', null)

    // Count workspaces per organization
    const countsByOrg = new Map<string, number>()
    workspaceCounts?.forEach((ws) => {
      countsByOrg.set(ws.organization_id, (countsByOrg.get(ws.organization_id) || 0) + 1)
    })

    // Attach counts to organizations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    organizations.forEach((org: any) => {
      org.workspaces = [{ count: countsByOrg.get(org.id) || 0 }]
    })
  }

  // Get stats
  const [
    { count: totalOrgs },
    { count: activeOrgs },
    { count: trialOrgs },
    { count: enterpriseOrgs },
  ] = await Promise.all([
    supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null),
    supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_status', 'active')
      .is('deleted_at', null),
    supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_status', 'trial')
      .is('deleted_at', null),
    supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_tier', 'enterprise')
      .is('deleted_at', null),
  ])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Organizasyon Yönetimi</h1>
          <p className="mt-2 text-gray-600">Tüm organizasyonları görüntüleyin ve yönetin</p>
        </div>
        <Link
          href="/dashboard/admin/organizations/create"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Yeni Organizasyon
        </Link>
      </div>

      {/* Stats */}
      <AdminOrganizationsStats
        totalOrgs={totalOrgs || 0}
        activeOrgs={activeOrgs || 0}
        trialOrgs={trialOrgs || 0}
        enterpriseOrgs={enterpriseOrgs || 0}
      />

      {/* Organizations Table */}
      <AdminOrganizationsTable organizations={organizations || []} />
    </div>
  )
}
