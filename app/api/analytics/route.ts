import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { subDays, format } from 'date-fns'
import { tr } from 'date-fns/locale'

export async function GET() {
  try {
    const supabase = await createClient()

    // Kullanıcı authentication kontrolü
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Hasta durum dağılımı (category_id ile)
    const { data: patients } = await supabase
      .from('patients')
      .select('id, category_id, admission_date, workspace_id')
      .eq('user_id', user.id)

    // Kategorileri al
    const workspaceIds = [...new Set(patients?.map((p) => p.workspace_id).filter(Boolean) || [])]
    const { data: categories } = await supabase
      .from('patient_categories')
      .select('id, slug')
      .in('workspace_id', workspaceIds)
      .in('slug', ['active', 'discharged', 'consultation'])
      .is('deleted_at', null)

    const statusCounts = {
      active: 0,
      discharged: 0,
      consultation: 0,
    }

    patients?.forEach((patient) => {
      if (!patient.category_id) return
      const category = categories?.find((c) => c.id === patient.category_id)
      if (category && category.slug in statusCounts) {
        statusCounts[category.slug as keyof typeof statusCounts]++
      }
    })

    // Test türleri dağılımı
    const { data: tests } = await supabase
      .from('tests')
      .select('test_type, patient_id')
      .in('patient_id', patients?.map((p) => p.id) || [])

    const testCounts = {
      laboratory: 0,
      ekg: 0,
      radiology: 0,
      consultation: 0,
      other: 0,
    }

    tests?.forEach((test) => {
      if (test.test_type in testCounts) {
        testCounts[test.test_type as keyof typeof testCounts]++
      }
    })

    // Veri tipi dağılımı
    const { data: patientData } = await supabase
      .from('patient_data')
      .select('data_type, patient_id')
      .in('patient_id', patients?.map((p) => p.id) || [])

    const dataCounts = {
      anamnesis: 0,
      vital_signs: 0,
      medications: 0,
      history: 0,
      demographics: 0,
    }

    patientData?.forEach((data) => {
      if (data.data_type in dataCounts) {
        dataCounts[data.data_type as keyof typeof dataCounts]++
      }
    })

    // Son 7 gün aktivite trendi
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i)
      return {
        date: format(date, 'dd MMM', { locale: tr }),
        fullDate: format(date, 'yyyy-MM-dd'),
        admissions: 0,
        discharges: 0,
      }
    })

    patients?.forEach((patient) => {
      const admissionDate = format(new Date(patient.admission_date), 'yyyy-MM-dd')
      const dayData = last7Days.find((d) => d.fullDate === admissionDate)
      if (dayData) {
        dayData.admissions++
      }
    })

    // Taburcu tarihleri için ayrı bir sorgu gerekebilir
    // Şu an için sadece admission'ları gösteriyoruz
    // Gelecekte patients tablosuna discharge_date eklenebilir

    // Son 30 gün aktivite trendi (opsiyonel, daha detaylı analiz için)
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i)
      return {
        date: format(date, 'dd MMM', { locale: tr }),
        fullDate: format(date, 'yyyy-MM-dd'),
        admissions: 0,
        discharges: 0,
      }
    })

    patients?.forEach((patient) => {
      const admissionDate = format(new Date(patient.admission_date), 'yyyy-MM-dd')
      const dayData = last30Days.find((d) => d.fullDate === admissionDate)
      if (dayData) {
        dayData.admissions++
      }
    })

    // AI analiz sayıları
    const { count: aiAnalysisCount } = await supabase
      .from('ai_analyses')
      .select('*', { count: 'exact', head: true })
      .in('patient_id', patients?.map((p) => p.id) || [])

    // Chat mesaj sayıları
    const { count: chatMessageCount } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .in('patient_id', patients?.map((p) => p.id) || [])

    return NextResponse.json({
      statusCounts,
      testCounts,
      dataCounts,
      activityTrend: {
        last7Days: last7Days.map((d) => ({
          date: d.date,
          admissions: d.admissions,
          discharges: d.discharges,
        })),
        last30Days: last30Days.map((d) => ({
          date: d.date,
          admissions: d.admissions,
          discharges: d.discharges,
        })),
      },
      summary: {
        totalPatients: patients?.length || 0,
        totalTests: tests?.length || 0,
        totalDataEntries: patientData?.length || 0,
        totalAiAnalyses: aiAnalysisCount || 0,
        totalChatMessages: chatMessageCount || 0,
      },
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
