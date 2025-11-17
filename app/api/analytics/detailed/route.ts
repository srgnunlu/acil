import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

/**
 * GET /api/analytics/detailed
 * Get detailed analytics including test types, data entry types, etc.
 * Query params: workspace_id (required)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get workspace_id from query
    const searchParams = request.nextUrl.searchParams
    const workspaceId = searchParams.get('workspace_id')

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspace_id is required' }, { status: 400 })
    }

    // Verify workspace membership
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Access denied to this workspace' }, { status: 403 })
    }

    // Get patients in workspace
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id, category_id, discharge_date')
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)

    if (patientsError) {
      logger.error({ error: patientsError, workspaceId }, 'Failed to fetch patients')
      throw patientsError
    }

    const patientIds = patients?.map((p) => p.id) || []

    // Get patient status counts (from categories)
    const { data: categories } = await supabase
      .from('patient_categories')
      .select('id, slug')
      .eq('workspace_id', workspaceId)
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
      // Also check discharge_date
      if (patient.discharge_date && !statusCounts.discharged) {
        // This is already counted in category, but we can use it as fallback
      }
    })

    // Get test type distribution
    const { data: tests } = await supabase
      .from('patient_tests')
      .select('test_type')
      .in('patient_id', patientIds)

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
      } else {
        testCounts.other++
      }
    })

    // Get data entry type distribution
    const { data: patientData } = await supabase
      .from('patient_data')
      .select('data_type')
      .in('patient_id', patientIds)

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

    // Get AI analyses count
    const { count: aiAnalysisCount } = await supabase
      .from('ai_analyses')
      .select('*', { count: 'exact', head: true })
      .in('patient_id', patientIds)

    // Get chat messages count
    const { count: chatMessageCount } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .in('patient_id', patientIds)

    // Calculate quick stats
    const totalPatients = patients?.length || 0
    const totalTests = tests?.length || 0
    const totalDataEntries = patientData?.length || 0
    const totalAiAnalyses = aiAnalysisCount || 0
    const totalChatMessages = chatMessageCount || 0

    return NextResponse.json({
      success: true,
      data: {
        statusCounts,
        testCounts,
        dataCounts,
        summary: {
          totalPatients,
          totalTests,
          totalDataEntries,
          totalAiAnalyses,
          totalChatMessages,
        },
        quickStats: {
          avgTestsPerPatient: totalPatients > 0 ? (totalTests / totalPatients).toFixed(1) : '0.0',
          avgDataEntriesPerPatient:
            totalPatients > 0 ? (totalDataEntries / totalPatients).toFixed(1) : '0.0',
          aiUsageRate:
            totalPatients > 0 ? `${((totalAiAnalyses / totalPatients) * 100).toFixed(0)}%` : '0%',
          chatActivityPerPatient:
            totalPatients > 0 ? (totalChatMessages / totalPatients).toFixed(1) : '0.0',
        },
        generated_at: new Date().toISOString(),
      },
    })
  } catch (error: unknown) {
    const err = error as Error
    logger.error({ error: err }, 'Detailed analytics error')
    return NextResponse.json(
      { error: err.message || 'Failed to get detailed analytics' },
      { status: 500 }
    )
  }
}
