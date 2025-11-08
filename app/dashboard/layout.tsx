import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { logout } from '@/app/(auth)/actions'
import { NotificationBell } from '@/components/ui/NotificationBell'
import { DashboardNav } from '@/components/dashboard/DashboardNav'
import { UserMenu } from '@/components/dashboard/UserMenu'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
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

  const patientLimit = profile?.patient_limit || 3
  const usagePercentage = ((patientCount || 0) / patientLimit) * 100

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-40 backdrop-blur-sm bg-white/95 dark:bg-slate-800/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link
                href="/dashboard/patients"
                className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-indigo-700 transition-all"
              >
                ACIL
              </Link>
              <DashboardNav />
            </div>

            <div className="flex items-center space-x-3">
              <NotificationBell />

              <UserMenu
                user={user}
                profile={profile}
                patientCount={patientCount || 0}
                patientLimit={patientLimit}
                usagePercentage={usagePercentage}
              />

              <form action={logout}>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 font-medium transition-colors"
                  aria-label="Çıkış yap"
                >
                  Çıkış
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  )
}
