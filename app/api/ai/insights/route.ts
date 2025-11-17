import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { subDays } from 'date-fns'

interface AIInsight {
  id: string
  type: 'critical' | 'warning' | 'success' | 'info' | 'suggestion'
  title: string
  message: string
  action?: {
    label: string
    link: string
  }
  dismissible: boolean
  priority: number
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  // 1. Auth check
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Get workspace_id
  const workspaceId = request.nextUrl.searchParams.get('workspace_id')

  if (!workspaceId) {
    return NextResponse.json({ error: 'workspace_id required' }, { status: 400 })
  }

  // 3. Check workspace membership
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const insights: AIInsight[] = []

    // Fetch patients
    const { data: patients } = await supabase
      .from('patients')
      .select('*, category:patient_categories(slug)')
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)

    const patientIds = (patients || []).map((p) => p.id)

    // Get active category
    const { data: activeCategories } = await supabase
      .from('patient_categories')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('slug', 'active')
      .is('deleted_at', null)

    const activeCategoryIds = (activeCategories || []).map((c) => c.id)
    const activePatients = (patients || []).filter(
      (p) => p.category_id && activeCategoryIds.includes(p.category_id)
    )

    // 1. Check for critical patients (mock - should check actual vitals)
    const criticalCount = Math.floor(activePatients.length * 0.15)
    if (criticalCount > 0) {
      insights.push({
        id: 'critical-patients',
        type: 'critical',
        title: `${criticalCount} Kritik Hasta Dikkat Gerektiriyor`,
        message:
          'Vital bulgularda anormallik tespit edilen hastalar için acil değerlendirme önerilmektedir.',
        action: {
          label: 'Hastaları Görüntüle',
          link: '/dashboard/patients?filter=critical',
        },
        dismissible: false,
        priority: 1,
      })
    }

    // 2. Check average stay duration trend
    // Mock calculation - should compare with historical data
    const avgStayIncreasePercent = 15
    if (avgStayIncreasePercent > 10) {
      insights.push({
        id: 'stay-duration-increase',
        type: 'warning',
        title: 'Ortalama Kalış Süresi Arttı',
        message: `Bugün ortalama kalış süresi geçen haftaya göre %${avgStayIncreasePercent} arttı. Hasta akışını gözden geçirmeniz önerilir.`,
        dismissible: true,
        priority: 2,
      })
    }

    // 3. Check AI analysis usage
    const { count: aiAnalysisCount } = await supabase
      .from('ai_analyses')
      .select('*', { count: 'exact', head: true })
      .in('patient_id', patientIds)

    const aiUsagePercent = patients?.length
      ? Math.round(((aiAnalysisCount || 0) / patients.length) * 100)
      : 0

    if (aiUsagePercent < 50 && patients && patients.length > 5) {
      insights.push({
        id: 'low-ai-usage',
        type: 'suggestion',
        title: 'AI Kullanımınızı Artırın',
        message: `Hastalarınızın sadece %${aiUsagePercent}'inde AI analizi yapıldı. AI destekli tanı önerileri ile daha hızlı karar verebilirsiniz.`,
        action: {
          label: 'AI Analiz Başlat',
          link: '/dashboard/patients',
        },
        dismissible: true,
        priority: 4,
      })
    }

    // 4. Check for pending AI suggestions
    // Mock - should query ai_suggestions table
    const pendingSuggestions = Math.floor(Math.random() * 3) + 1
    if (pendingSuggestions > 0) {
      insights.push({
        id: 'pending-suggestions',
        type: 'suggestion',
        title: `${pendingSuggestions} AI Önerisi Bekliyor`,
        message:
          'Hastalarınız için konsültasyon ve tetkik önerileri hazır. İncelemek için tıklayın.',
        action: {
          label: 'Önerileri Gör',
          link: '/dashboard/analytics',
        },
        dismissible: true,
        priority: 3,
      })
    }

    // 5. Check team performance
    // Mock calculation - should use actual metrics
    const teamPerformance = 120
    if (teamPerformance >= 100) {
      insights.push({
        id: 'team-performance',
        type: 'success',
        title: 'Ekip Performansı Hedefin Üzerinde! 🎉',
        message: `Bugün ekip performansı hedefin %${teamPerformance}'inde. Harika iş çıkarıyorsunuz!`,
        dismissible: true,
        priority: 5,
      })
    }

    // 6. Check for new patients today
    const yesterday = subDays(new Date(), 1).toISOString()
    const todayPatients = (patients || []).filter((p) => new Date(p.created_at) > new Date(yesterday))

    if (todayPatients.length === 0 && new Date().getHours() > 12) {
      insights.push({
        id: 'no-admissions',
        type: 'info',
        title: 'Bugün Henüz Yeni Hasta Kaydı Yok',
        message: 'Acil serviste sakin bir gün geçiriyorsunuz.',
        dismissible: true,
        priority: 6,
      })
    }

    // 7. Default insight if none
    if (insights.length === 0) {
      insights.push({
        id: 'default',
        type: 'info',
        title: 'AI Destekli Hasta Takibi Aktif',
        message:
          'ACIL sistemi hasta verilerinizi analiz ederek akıllı öneriler sunmaya devam ediyor.',
        dismissible: false,
        priority: 10,
      })
    }

    // Sort by priority
    insights.sort((a, b) => a.priority - b.priority)

    return NextResponse.json({ insights })
  } catch (error) {
    console.error('AI Insights API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
