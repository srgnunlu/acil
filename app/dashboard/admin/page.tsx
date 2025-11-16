import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  Users,
  Building2,
  Briefcase,
  UserPlus,
  Activity,
  TrendingUp,
  Database,
  Zap,
  Bell,
  FileText,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'
import { AdminStatCard } from '@/components/admin/AdminStatCard'
import { AdminActivityChart } from '@/components/admin/AdminActivityChart'
import { AdminRecentActivity } from '@/components/admin/AdminRecentActivity'
import { AdminSystemHealth } from '@/components/admin/AdminSystemHealth'
import { AdminQuickActions } from '@/components/admin/AdminQuickActions'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch system statistics
  const [
    { count: totalUsers },
    { count: totalOrganizations },
    { count: totalWorkspaces },
    { count: totalPatients },
    { count: activeUsers },
    { count: todayActivities },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('organizations').select('*', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('workspaces').select('*', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('patients').select('*', { count: 'exact', head: true }).is('deleted_at', null),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('last_seen_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from('user_activity_log')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date().toISOString().split('T')[0]),
  ])

  // Fetch AI usage stats
  const { data: aiStats } = await supabase
    .from('ai_usage_logs')
    .select('total_cost, created_at')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

  const totalAICost = aiStats?.reduce((sum, log) => sum + (log.total_cost || 0), 0) || 0

  // Fetch notifications count
  const { count: unreadNotifications } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false)

  // Fetch recent activity
  const { data: recentActivity } = await supabase
    .from('user_activity_log')
    .select('*, profiles(full_name, avatar_url)')
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Kontrol Paneli</h1>
        <p className="mt-2 text-gray-600">
          Sistemin genel durumunu ve istatistiklerini buradan takip edebilirsiniz
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminStatCard
          title="Toplam Kullanıcı"
          value={totalUsers || 0}
          icon={Users}
          trend={{ value: 12, isPositive: true }}
          color="blue"
        />
        <AdminStatCard
          title="Organizasyonlar"
          value={totalOrganizations || 0}
          icon={Building2}
          trend={{ value: 5, isPositive: true }}
          color="purple"
        />
        <AdminStatCard
          title="Workspace'ler"
          value={totalWorkspaces || 0}
          icon={Briefcase}
          trend={{ value: 8, isPositive: true }}
          color="green"
        />
        <AdminStatCard
          title="Toplam Hasta"
          value={totalPatients || 0}
          icon={UserPlus}
          trend={{ value: 15, isPositive: true }}
          color="orange"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminStatCard
          title="Aktif Kullanıcı (24s)"
          value={activeUsers || 0}
          icon={Activity}
          color="emerald"
        />
        <AdminStatCard
          title="Bugünkü Aktivite"
          value={todayActivities || 0}
          icon={TrendingUp}
          color="cyan"
        />
        <AdminStatCard
          title="AI Maliyeti (30g)"
          value={`$${totalAICost.toFixed(2)}`}
          icon={Zap}
          color="amber"
        />
        <AdminStatCard
          title="Okunmamış Bildirim"
          value={unreadNotifications || 0}
          icon={Bell}
          color="red"
        />
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <div className="lg:col-span-2">
          <AdminActivityChart />
        </div>

        {/* System Health */}
        <div>
          <AdminSystemHealth />
        </div>
      </div>

      {/* Recent Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <AdminRecentActivity activities={recentActivity || []} />
        </div>

        {/* Quick Actions */}
        <div>
          <AdminQuickActions />
        </div>
      </div>
    </div>
  )
}
