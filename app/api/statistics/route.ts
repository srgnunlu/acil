import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Toplam hasta sayısı
    const { count: totalPatients } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // Kullanıcının workspace'lerini al
    const { data: workspaces } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .eq('status', 'active')

    const workspaceIds = (workspaces || []).map((w) => w.workspace_id)

    // Kategorileri al (active, discharged, consultation slug'larına sahip)
    let activeCategoryIds: string[] = []
    let dischargedCategoryIds: string[] = []
    let consultationCategoryIds: string[] = []

    if (workspaceIds.length > 0) {
      const { data: categories } = await supabase
        .from('patient_categories')
        .select('id, slug, workspace_id')
        .in('workspace_id', workspaceIds)
        .in('slug', ['active', 'discharged', 'consultation'])
        .is('deleted_at', null)

      if (categories) {
        activeCategoryIds = categories.filter((c) => c.slug === 'active').map((c) => c.id)
        dischargedCategoryIds = categories.filter((c) => c.slug === 'discharged').map((c) => c.id)
        consultationCategoryIds = categories
          .filter((c) => c.slug === 'consultation')
          .map((c) => c.id)
      }
    }

    // Aktif hasta sayısı (category_id ile)
    const { count: activePatients } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in(
        'category_id',
        activeCategoryIds.length > 0 ? activeCategoryIds : ['00000000-0000-0000-0000-000000000000']
      )

    // Taburcu hasta sayısı (category_id ile)
    const { count: dischargedPatients } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in(
        'category_id',
        dischargedCategoryIds.length > 0
          ? dischargedCategoryIds
          : ['00000000-0000-0000-0000-000000000000']
      )

    // Konsültasyonda hasta sayısı (category_id ile)
    const { count: consultationPatients } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in(
        'category_id',
        consultationCategoryIds.length > 0
          ? consultationCategoryIds
          : ['00000000-0000-0000-0000-000000000000']
      )

    // Toplam AI analiz sayısı
    const { count: totalAnalyses } = await supabase
      .from('ai_analyses')
      .select('*', { count: 'exact', head: true })
      .eq('patient_id', { in: await getUserPatientIds(supabase, user.id) })

    // Toplam tetkik sayısı
    const { count: totalTests } = await supabase
      .from('patient_tests')
      .select('*', { count: 'exact', head: true })
      .eq('patient_id', { in: await getUserPatientIds(supabase, user.id) })

    // Son 7 gün hasta aktivitesi
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: recentPatients } = await supabase
      .from('patients')
      .select('created_at')
      .eq('user_id', user.id)
      .gte('created_at', sevenDaysAgo.toISOString())

    // Günlük aktivite
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dailyActivity = (recentPatients || []).reduce((acc: any, patient) => {
      const date = new Date(patient.created_at).toLocaleDateString('tr-TR')
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {})

    // Tetkik tipi dağılımı
    const { data: testsByType } = await supabase
      .from('patient_tests')
      .select('test_type')
      .eq('patient_id', { in: await getUserPatientIds(supabase, user.id) })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const testTypeDistribution = (testsByType || []).reduce((acc: any, test) => {
      acc[test.test_type] = (acc[test.test_type] || 0) + 1
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      statistics: {
        patients: {
          total: totalPatients || 0,
          active: activePatients || 0,
          discharged: dischargedPatients || 0,
          consultation: consultationPatients || 0,
        },
        activity: {
          total_analyses: totalAnalyses || 0,
          total_tests: totalTests || 0,
          daily_activity: dailyActivity,
        },
        distributions: {
          test_types: testTypeDistribution,
        },
      },
    })
  } catch (error: unknown) {
    console.error('Statistics error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'İstatistikler alınamadı' },
      { status: 500 }
    )
  }
}

// Helper function
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getUserPatientIds(supabase: any, userId: string) {
  const { data: patients } = await supabase.from('patients').select('id').eq('user_id', userId)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (patients || []).map((p: any) => p.id)
}
