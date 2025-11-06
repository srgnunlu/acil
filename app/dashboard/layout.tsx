import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { logout } from '@/app/(auth)/actions'
import { NotificationBell } from '@/components/ui/NotificationBell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Profil bilgilerini al
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Aktif hasta sayısını al
  const { count: patientCount } = await supabase
    .from('patients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'active')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard/patients" className="text-2xl font-bold text-blue-600">
                ACIL
              </Link>
              <nav className="hidden md:flex space-x-6">
                <Link
                  href="/dashboard/patients"
                  className="text-gray-700 hover:text-blue-600 font-medium transition"
                >
                  Hastalar
                </Link>
                <Link
                  href="/dashboard/statistics"
                  className="text-gray-700 hover:text-blue-600 font-medium transition"
                >
                  İstatistikler
                </Link>
                <Link
                  href="/dashboard/guidelines"
                  className="text-gray-700 hover:text-blue-600 font-medium transition"
                >
                  Kılavuzlar
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="text-gray-700 hover:text-blue-600 font-medium transition"
                >
                  Ayarlar
                </Link>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <NotificationBell />

              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">
                  {profile?.full_name || user.email}
                </p>
                <p className="text-xs text-gray-500">
                  {patientCount || 0}/{profile?.patient_limit || 3} hasta
                  {profile?.subscription_tier === 'free' && (
                    <span className="ml-2 text-blue-600">(Ücretsiz)</span>
                  )}
                </p>
              </div>

              <form action={logout}>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 font-medium"
                >
                  Çıkış
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
