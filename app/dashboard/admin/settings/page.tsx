import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminSettingsTabs } from '@/components/admin/settings/AdminSettingsTabs'

export default async function AdminSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sistem Ayarları</h1>
        <p className="mt-2 text-gray-600">
          Sistemin genel ayarlarını ve konfigürasyonunu yönetin
        </p>
      </div>

      {/* Settings Tabs */}
      <AdminSettingsTabs />
    </div>
  )
}
