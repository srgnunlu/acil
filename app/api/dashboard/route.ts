import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { subDays, format } from 'date-fns'

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
    // Fetch patients
    const { data: patients } = await supabase
      .from('patients')
      .select('*, category:patient_categories(slug)')
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    const patientIds = (patients || []).map((p) => p.id)

    // Get category IDs
    const { data: activeCategories } = await supabase
      .from('patient_categories')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('slug', 'active')
      .is('deleted_at', null)

    const { data: dischargedCategories } = await supabase
      .from('patient_categories')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('slug', 'discharged')
      .is('deleted_at', null)

    const activeCategoryIds = (activeCategories || []).map((c) => c.id)
    const dischargedCategoryIds = (dischargedCategories || []).map((c) => c.id)

    // Calculate stats
    const activePatients = (patients || []).filter(
      (p) => p.category_id && activeCategoryIds.includes(p.category_id)
    )

    const dischargedPatients = (patients || []).filter(
      (p) => p.category_id && dischargedCategoryIds.includes(p.category_id)
    )

    const yesterday = subDays(new Date(), 1).toISOString()
    const todayPatients = (patients || []).filter((p) => new Date(p.created_at) > new Date(yesterday))

    // AI analysis count
    const { count: aiAnalysisCount } = await supabase
      .from('ai_analyses')
      .select('*', { count: 'exact', head: true })
      .in('patient_id', patientIds)

    // Test count
    const { count: testCount } = await supabase
      .from('tests')
      .select('*', { count: 'exact', head: true })
      .in('patient_id', patientIds)

    // Calculate trends (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i)
      return {
        date: format(date, 'yyyy-MM-dd'),
        count:
          patients?.filter((p) => {
            const created = new Date(p.created_at)
            return created.toDateString() === date.toDateString()
          }).length || 0,
      }
    })

    // AI usage trend (mock - should come from ai_usage_logs)
    const aiUsageTrend = last7Days.map(() => Math.floor(Math.random() * 20) + 10)

    // Test trend (mock - calculate from actual test data)
    const testTrend = last7Days.map(() => Math.floor(Math.random() * 30) + 20)

    // Average stay duration (mock - calculate from actual admission/discharge dates)
    const avgStayDuration = 2.4

    // Critical patients (mock - should come from AI risk scores)
    const criticalPatients = Math.floor(activePatients.length * 0.15)

    // Build response
    const dashboardData = {
      stats: {
        activePatients: activePatients.length,
        criticalPatients,
        avgStayDuration,
        dischargedPatients: dischargedPatients.length,
        aiAnalysisCount: aiAnalysisCount || 0,
        testCount: testCount || 0,
        todayPatients: todayPatients.length,
        totalPatients: patients?.length || 0,
      },
      trends: {
        last7Days: last7Days.map((d) => d.count),
        aiUsageTrend,
        testTrend,
        admissionTrend: last7Days,
      },
      patients: (patients || []).slice(0, 12).map((p) => ({
        id: p.id,
        name: p.name,
        age: p.age,
        gender: p.gender,
        status: (p.category as { slug?: string })?.slug || 'active',
        admissionDate: p.created_at,
        lastActivity: p.updated_at,
      })),
      recentActivity: [], // TODO: Implement activity log
    }

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
