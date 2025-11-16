import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { AdminOrganizationForm } from '@/components/admin/organizations/AdminOrganizationForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function AdminOrganizationEditPage({
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
  const { data: org, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', params.id)
    .is('deleted_at', null)
    .single()

  if (error || !org) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href={`/dashboard/admin/organizations/${params.id}`}
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Organizasyona Geri Dön
      </Link>

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Organizasyon Düzenle</h1>
        <p className="mt-2 text-gray-600">{org.name}</p>
      </div>

      {/* Form */}
      <div className="max-w-3xl">
        <AdminOrganizationForm organization={org} />
      </div>
    </div>
  )
}
