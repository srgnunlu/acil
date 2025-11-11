import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { logout } from '@/app/(auth)/actions'
import { NotificationBell } from '@/components/ui/NotificationBell'
import { DashboardNav } from '@/components/dashboard/DashboardNav'
import { UserMenu } from '@/components/dashboard/UserMenu'
import { WorkspaceProvider } from '@/contexts/WorkspaceContext'
import { WorkspaceSwitcher } from '@/components/workspace/WorkspaceSwitcher'
import { OrganizationSwitcher } from '@/components/organizations/OrganizationSwitcher'
import { DashboardAbilityProvider } from '@/components/providers/DashboardAbilityProvider'
import { RealtimeProvider } from '@/contexts/RealtimeContext'
import { RealtimeSidebarToggle } from '@/components/dashboard/RealtimeSidebar'
import { RealtimeStatusHeader } from '@/components/dashboard/RealtimeStatusHeader'

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

  // Aktif hasta sayısını al (workspace bazlı olmalı ama şimdilik eski yöntemle)
  const { count: patientCount } = await supabase
    .from('patients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('deleted_at', null)

  const patientLimit = profile?.patient_limit || 3
  const usagePercentage = ((patientCount || 0) / patientLimit) * 100

  return (
    <WorkspaceProvider>
      <RealtimeProvider>
        <DashboardAbilityProvider>
          <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-40 backdrop-blur-sm bg-white/95">
              <div className="w-full max-w-full mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16 gap-2 lg:gap-4 min-w-0">
                  {/* Left side */}
                  <div className="flex items-center gap-2 lg:gap-4 flex-shrink-0 min-w-0 flex-1">
                    <Link
                      href="/dashboard"
                      className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-indigo-700 transition-all flex-shrink-0"
                    >
                      ACIL
                    </Link>

                    {/* Organization ve Workspace switcher'ları - hidden on small screens */}
                    <div className="hidden md:flex items-center gap-1.5 lg:gap-2 flex-shrink min-w-0">
                      <div className="w-[120px] lg:w-[150px] min-w-0 flex-shrink-0 overflow-visible">
                        <OrganizationSwitcher />
                      </div>
                      <div className="w-[120px] lg:w-[150px] min-w-0 flex-shrink-0 overflow-visible">
                        <WorkspaceSwitcher />
                      </div>
                    </div>

                    {/* Navigation - hidden on small screens */}
                    <div className="hidden lg:block flex-shrink min-w-0 overflow-hidden">
                      <DashboardNav />
                    </div>
                  </div>

                  {/* Right side */}
                  <div className="flex items-center gap-1.5 lg:gap-2 flex-shrink-0 min-w-0">
                    {/* Realtime Status - compact on mobile */}
                    <div className="hidden sm:block flex-shrink-0">
                      <RealtimeStatusHeader />
                    </div>

                    {/* Notification Bell */}
                    <div className="flex-shrink-0">
                      <NotificationBell />
                    </div>

                    {/* User Menu - compact */}
                    <div className="hidden md:block flex-shrink-0 min-w-0 max-w-[140px] lg:max-w-[180px]">
                      <UserMenu
                        user={user}
                        profile={profile}
                        patientCount={patientCount || 0}
                        patientLimit={patientLimit}
                        usagePercentage={usagePercentage}
                      />
                    </div>

                    {/* Logout button - compact */}
                    <form action={logout} className="flex-shrink-0">
                      <button
                        type="submit"
                        className="px-2 lg:px-3 py-2 text-xs lg:text-sm text-gray-700 hover:text-gray-900 font-medium transition-colors whitespace-nowrap"
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
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="flex-1">{children}</div>
            </main>

            {/* Floating Realtime Sidebar Toggle */}
            <RealtimeSidebarToggle />
          </div>
        </DashboardAbilityProvider>
      </RealtimeProvider>
    </WorkspaceProvider>
  )
}
