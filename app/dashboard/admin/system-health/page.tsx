import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminSystemHealthPage() {
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

  // Fetch system health from API
  // For now, we'll use the component that fetches from API
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sistem Sağlığı</h1>
        <p className="mt-2 text-gray-600">Gerçek zamanlı sistem durumu ve servis kontrolleri</p>
      </div>

      {/* System Health Component will fetch from API */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-gray-500">Sistem sağlık kontrolleri API'den çekilecek</p>
      </div>
    </div>
  )
}

