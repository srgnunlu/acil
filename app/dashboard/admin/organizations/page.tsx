import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminOrganizationsTable } from '@/components/admin/organizations/AdminOrganizationsTable'
import { AdminOrganizationsStats } from '@/components/admin/organizations/AdminOrganizationsStats'
import { Building2, Plus } from 'lucide-react'
import Link from 'next/link'

export default async function AdminOrganizationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch organizations with workspace count
  const { data: organizations, error } = await supabase
    .from('organizations')
    .select(
      `
      *,
      workspaces(count)
    `
    )
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  // Get stats
  const [
    { count: totalOrgs },
    { count: activeOrgs },
    { count: trialOrgs },
    { count: enterpriseOrgs },
  ] = await Promise.all([
    supabase.from('organizations').select('*', { count: 'exact', head: true }).is('deleted_at', null),
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
