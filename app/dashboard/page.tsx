import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { subDays } from 'date-fns'
import {
  Users,
  Activity,
  TrendingUp,
  Brain,
  AlertTriangle,
  Clock,
  FileText,
  BarChart3,
} from 'lucide-react'
import { DashboardTOC, TOCSection } from '@/components/dashboard/DashboardTOC'
import { AIInsightsHero, generateDemoInsights } from '@/components/dashboard/AIInsightsHero'
import { StatCardWithTrend } from '@/components/dashboard/StatCardWithTrend'
import {
  CriticalAlertsPanel,
  generateDemoAlerts,
} from '@/components/dashboard/CriticalAlertsPanel'
import { PatientQuickGrid } from '@/components/dashboard/PatientQuickGrid'
import { WorkspaceCategoryPanel } from '@/components/dashboard/WorkspaceCategoryPanel'
import { WorkspaceNotesPanel } from '@/components/dashboard/WorkspaceNotesPanel'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function DashboardHome() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Cookie'den current workspace ID ve organization ID'yi al
  const cookieStore = await cookies()
  const currentWorkspaceId = cookieStore.get('currentWorkspaceId')?.value
  const currentOrganizationId = cookieStore.get('currentOrganizationId')?.value

  // Kullanıcının workspace membership'lerini al
  const { data: memberships } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .eq('status', 'active')

  const workspaceMemberIds = (memberships || []).map((m) => m.workspace_id)

  // Organization membership'lerini al
  let organizationWorkspaceIds: string[] = []
  if (currentOrganizationId) {
    const { data: orgWorkspaces } = await supabase
      .from('workspaces')
      .select('id')
      .eq('organization_id', currentOrganizationId)
      .is('deleted_at', null)

    organizationWorkspaceIds = (orgWorkspaces || []).map((w) => w.id)
  }

  // Tüm erişilebilir workspace ID'lerini birleştir
  const allAccessibleWorkspaceIds = [
    ...new Set([...workspaceMemberIds, ...organizationWorkspaceIds]),
  ]

  // Target workspace IDs
  const targetWorkspaceIds =
    currentWorkspaceId && allAccessibleWorkspaceIds.includes(currentWorkspaceId)
      ? [currentWorkspaceId]
      : allAccessibleWorkspaceIds.length > 0
        ? allAccessibleWorkspaceIds
        : ['00000000-0000-0000-0000-000000000000']

  // Hastaları al
  const { data: patients } = await supabase
    .from('patients')
    .select('*, category:patient_categories(slug)')
    .in('workspace_id', targetWorkspaceIds)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  // Active kategorileri bul
  const { data: activeCategories } = await supabase
    .from('patient_categories')
    .select('id')
    .in('workspace_id', targetWorkspaceIds)
    .eq('slug', 'active')
    .is('deleted_at', null)

  const activeCategoryIds = (activeCategories || []).map((c) => c.id)
  const activePatients =
    patients?.filter((p) => p.category_id && activeCategoryIds.includes(p.category_id)) || []

  // Kritik hastalar (örnek: risk score > 70 veya urgency = critical)
  const criticalPatients = activePatients.filter(() => Math.random() > 0.7) // Demo için random

  // Bugünkü hastalar (son 24 saat)
  const yesterday = subDays(new Date(), 1).toISOString()
  const todayPatients = patients?.filter((p) => new Date(p.created_at) > new Date(yesterday)) || []

  // Son 7 günlük hastalar (sparkline için)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i)
    return patients?.filter((p) => {
      const created = new Date(p.created_at)
      return created.toDateString() === date.toDateString()
    }).length || 0
  })

  // Patient ID'lerini al
  const patientIds = patients?.map((p) => p.id) || []

  // AI analiz sayısı
  const { count: aiAnalysisCount } = await supabase
    .from('ai_analyses')
    .select('*', { count: 'exact', head: true })
    .in('patient_id', patientIds)

  // Test sayısı
  const { count: testCount } = await supabase
    .from('tests')
    .select('*', { count: 'exact', head: true })
    .in('patient_id', patientIds)

  // AI kullanım trendi (son 7 gün - demo data)
  const aiUsageTrend = Array.from({ length: 7 }, () => Math.floor(Math.random() * 20) + 10)

  // Test trendi (son 7 gün - demo data)
  const testTrend = Array.from({ length: 7 }, () => Math.floor(Math.random() * 30) + 20)

  // Ortalama kalış süresi hesaplama (demo)
  const avgStayDuration = 2.4 // Örnek değer

  // Taburcu edilen hastalar
  const { data: dischargedCategories } = await supabase
    .from('patient_categories')
    .select('id')
    .in('workspace_id', targetWorkspaceIds)
    .eq('slug', 'discharged')
    .is('deleted_at', null)

  const dischargedCategoryIds = (dischargedCategories || []).map((c) => c.id)
  const dischargedPatients =
    patients?.filter((p) => p.category_id && dischargedCategoryIds.includes(p.category_id)) || []

  // AI Insights oluştur
  const aiInsights = generateDemoInsights({
    criticalPatients: criticalPatients.length,
    avgStayIncrease: 15, // Demo değer
    aiSuggestions: Math.floor(Math.random() * 5) + 1,
    teamPerformance: 120,
  })

  // Critical Alerts oluştur
  const criticalAlerts = generateDemoAlerts()

  // Patient grid için veri hazırla
  const patientsForGrid = (patients || []).slice(0, 12).map((p) => ({
    id: p.id,
    name: p.name,
    age: p.age,
    gender: p.gender as 'male' | 'female' | 'other',
    status: ((p.category as { slug?: string })?.slug || 'active') as any,
    riskScore: Math.floor(Math.random() * 100), // Demo risk score
    admissionDate: p.created_at,
    lastActivity: p.updated_at,
    hasAIAnalysis: Math.random() > 0.5,
    hasChatMessages: Math.random() > 0.5,
    urgency: Math.random() > 0.8 ? ('critical' as const) : ('medium' as const),
  }))

  // TOC Sections
  const tocSections = [
    { id: 'insights', title: 'AI Öngörüler', icon: '🤖' },
    { id: 'metrics', title: 'Temel Metrikler', icon: '📊' },
    { id: 'alerts', title: 'Kritik Uyarılar', icon: '🚨' },
    { id: 'patients', title: 'Hasta Yönetimi', icon: '👥' },
    { id: 'collaboration', title: 'Ekip İşbirliği', icon: '🤝' },
    { id: 'actions', title: 'Hızlı İşlemler', icon: '⚡' },
  ]

  return (
    <div className="flex">
      {/* Table of Contents - Sticky Sidebar */}
      <DashboardTOC sections={tocSections} />

      {/* Main Content */}
      <div className="flex-1 space-y-8 pb-8">
        {/* AI Insights Hero Section */}
        <TOCSection id="insights">
          <AIInsightsHero insights={aiInsights} autoRotate={true} rotateInterval={10000} />
        </TOCSection>

        {/* Key Metrics Grid */}
        <TOCSection id="metrics" title="Temel Metrikler">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCardWithTrend
              title="Aktif Hasta"
              value={activePatients.length}
              subtitle={`Toplam ${patients?.length || 0} hasta`}
              trend={{ direction: 'up', percentage: 8, period: '7 gün' }}
              sparklineData={last7Days}
              color="green"
              icon={Users}
              href="/dashboard/patients"
              realtime={true}
            />

            <StatCardWithTrend
              title="Kritik Vakalar"
              value={criticalPatients.length}
              subtitle="Acil müdahale gerekli"
              trend={{ direction: 'down', percentage: 12, period: '7 gün' }}
              color="red"
              icon={AlertTriangle}
              href="/dashboard/patients?filter=critical"
              realtime={true}
            />

            <StatCardWithTrend
              title="Ort. Kalış Süresi"
              value={avgStayDuration.toFixed(1)}
              unit="gün"
              subtitle="Hasta başına"
              trend={{ direction: 'neutral', percentage: 0, period: '7 gün' }}
              color="blue"
              icon={Clock}
            />

            <StatCardWithTrend
              title="Taburcu"
              value={dischargedPatients.length}
              subtitle="Bu hafta"
              trend={{ direction: 'up', percentage: 15, period: '7 gün' }}
              color="indigo"
              icon={TrendingUp}
            />

            <StatCardWithTrend
              title="AI Kullanımı"
              value={aiAnalysisCount || 0}
              subtitle={`${patients?.length ? Math.round(((aiAnalysisCount || 0) / patients.length) * 100) : 0}% kullanım`}
              trend={{ direction: 'up', percentage: 23, period: '7 gün' }}
              sparklineData={aiUsageTrend}
              color="purple"
              icon={Brain}
              href="/dashboard/analytics"
              realtime={true}
            />

            <StatCardWithTrend
              title="Test Sayısı"
              value={testCount || 0}
              subtitle={`${activePatients.length > 0 ? ((testCount || 0) / activePatients.length).toFixed(1) : 0} test/hasta`}
              sparklineData={testTrend}
              color="amber"
              icon={Activity}
            />
          </div>
        </TOCSection>

        {/* Critical Alerts */}
        <TOCSection id="alerts" title="Kritik Uyarılar">
          <CriticalAlertsPanel
            alerts={criticalAlerts}
            maxDisplay={5}
            onAcknowledge={(id) => console.log('Acknowledged:', id)}
            onDismiss={(id) => console.log('Dismissed:', id)}
            onSnooze={(id, duration) => console.log('Snoozed:', id, duration)}
          />
        </TOCSection>

        {/* Patient Management */}
        <TOCSection id="patients" title="Hasta Yönetimi">
          <PatientQuickGrid
            patients={patientsForGrid}
            maxDisplay={6}
          />
        </TOCSection>

        {/* Team Collaboration */}
        <TOCSection id="collaboration" title="Ekip İşbirliği">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Workspace Categories */}
            <WorkspaceCategoryPanel />

            {/* Workspace Notes */}
            {currentWorkspaceId && (
              <Card
                variant="default"
                header={
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Workspace Notları</h3>
                    <span className="text-sm text-gray-500">Ekip iletişimi</span>
                  </div>
                }
              >
                <WorkspaceNotesPanel workspaceId={currentWorkspaceId} currentUserId={user.id} />
              </Card>
            )}
          </div>
        </TOCSection>

        {/* Quick Actions */}
        <TOCSection id="actions" title="Hızlı İşlemler">
          <Card variant="elevated">
            <div className="grid md:grid-cols-3 gap-4">
              <Link href="/dashboard/patients">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-full flex-col items-center justify-center text-center group hover:border-blue-500 hover:bg-blue-50 w-full py-6"
                >
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                    👤
                  </div>
                  <p className="font-semibold text-gray-900 text-lg mb-1">Yeni Hasta Ekle</p>
                  <p className="text-sm text-gray-500">Hasta kaydı oluştur ve takibe başla</p>
                </Button>
              </Link>

              <Link href="/dashboard/analytics">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-full flex-col items-center justify-center text-center group hover:border-green-500 hover:bg-green-50 w-full py-6"
                >
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                    📊
                  </div>
                  <p className="font-semibold text-gray-900 text-lg mb-1">
                    Detaylı Analizler
                  </p>
                  <p className="text-sm text-gray-500">Grafikler ve performans metrikleri</p>
                </Button>
              </Link>

              <Link href="/dashboard/protocols">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-full flex-col items-center justify-center text-center group hover:border-purple-500 hover:bg-purple-50 w-full py-6"
                >
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                    📚
                  </div>
                  <p className="font-semibold text-gray-900 text-lg mb-1">Protokol Kütüphanesi</p>
                  <p className="text-sm text-gray-500">Klinik kılavuzlar ve algoritmalar</p>
                </Button>
              </Link>
            </div>
          </Card>
        </TOCSection>

        {/* Info Banner */}
        <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-8 border border-indigo-200 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 p-3 bg-white rounded-xl shadow-sm">
              <Brain className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">
                🤖 AI Destekli Hasta Takibi
              </h4>
              <p className="text-gray-700 leading-relaxed mb-4">
                ACIL sistemi, hasta verilerinizi analiz ederek ayırıcı tanı önerileri, test
                tavsiyeleri ve tedavi algoritmaları sunar. Her hasta için detaylı AI analizleri ve
                görsel değerlendirmeler yapabilirsiniz.
              </p>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm">
                  <Brain className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">GPT-4 Powered</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Real-time Analysis</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm">
                  <BarChart3 className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Advanced Analytics</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
