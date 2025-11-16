import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { AdminUserForm } from '@/components/admin/users/AdminUserForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function AdminUserEditPage({
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

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href={`/dashboard/admin/users/${params.id}`}
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Kullanıcıya Geri Dön
      </Link>

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Kullanıcı Düzenle</h1>
        <p className="mt-2 text-gray-600">{profile.full_name || profile.user_id}</p>
      </div>

      {/* Form */}
      <div className="max-w-3xl">
        <AdminUserForm user={profile} />
      </div>
    </div>
  )
}
