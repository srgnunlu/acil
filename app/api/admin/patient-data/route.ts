import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { requireAdmin } from '@/lib/middleware/admin-auth'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin()
    if (authResult.error) {
      return authResult.error
    }

    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const dataId = searchParams.get('data_id')
    const patientId = searchParams.get('patient_id')
    const dataType = searchParams.get('data_type')
    const workspaceId = searchParams.get('workspace_id')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Get single patient data entry
    if (dataId) {
      const { data: patientData, error } = await supabase
        .from('patient_data')
        .select(
          `
          *,
          patient:patients(id, name, workspace_id, workspace:workspaces(id, name, slug))
        `
        )
        .eq('id', dataId)
        .single()

      if (error) {
        logger.error({ error, dataId }, 'Failed to fetch patient data')
        return NextResponse.json({ error: 'Failed to fetch patient data' }, { status: 500 })
      }

      return NextResponse.json(patientData)
    }

    // List patient data
    let query = supabase
      .from('patient_data')
      .select(
        `
        *,
        patient:patients(id, name, workspace_id, workspace:workspaces(id, name, slug))
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (patientId) {
      query = query.eq('patient_id', patientId)
    }

    if (dataType) {
      query = query.eq('data_type', dataType)
    }

    if (workspaceId) {
      // Get patient IDs for this workspace
      const { data: patients } = await supabase
        .from('patients')
        .select('id')
        .eq('workspace_id', workspaceId)
        .is('deleted_at', null)

      if (patients && patients.length > 0) {
        const patientIds = patients.map((p) => p.id)
        query = query.in('patient_id', patientIds)
      } else {
        // No patients, return empty
        return NextResponse.json({
          patient_data: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        })
      }
    }

    const { data: patientData, count, error } = await query

    if (error) {
      logger.error({ error }, 'Failed to fetch patient data')
      return NextResponse.json({ error: 'Failed to fetch patient data' }, { status: 500 })
    }

    // Get statistics by data type
    const { data: statsData } = await supabase
      .from('patient_data')
      .select('data_type')

    const stats: Record<string, number> = {
      demographics: 0,
      anamnesis: 0,
      medications: 0,
      vital_signs: 0,
      history: 0,
    }

    statsData?.forEach((item) => {
      if (item.data_type in stats) {
        stats[item.data_type]++
      }
    })

    return NextResponse.json({
      patient_data: patientData || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      statistics: {
        by_type: stats,
        total: count || 0,
      },
    })
  } catch (error) {
    logger.error({ error }, 'Admin patient-data API error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAdmin()
    if (authResult.error) {
      return authResult.error
    }

    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const dataId = searchParams.get('data_id')

    if (!dataId) {
      return NextResponse.json({ error: 'data_id required' }, { status: 400 })
    }

    // Delete patient data
    const { error } = await supabase.from('patient_data').delete().eq('id', dataId)

    if (error) {
      logger.error({ error, dataId }, 'Failed to delete patient data')
      return NextResponse.json({ error: 'Failed to delete patient data' }, { status: 500 })
    }

    logger.info({ dataId, deletedBy: authResult.user!.id }, 'Patient data deleted by admin')

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({ error }, 'Admin patient-data DELETE error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

