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
    const patientId = searchParams.get('patient_id')
    const workspaceId = searchParams.get('workspace_id')
    const organizationId = searchParams.get('organization_id')
    const search = searchParams.get('search')
    const categoryId = searchParams.get('category_id')
    const workflowState = searchParams.get('workflow_state')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Get single patient
    if (patientId) {
      const { data: patient, error } = await supabase
        .from('patients')
        .select(
          `
          *,
          category:patient_categories(id, name, color, icon),
          workspace:workspaces(id, name, slug),
          organization:organizations(id, name, slug),
          creator:profiles!patients_user_id_fkey(user_id, full_name, avatar_url),
          assigned_user:profiles!patients_assigned_to_fkey(user_id, full_name, avatar_url)
        `
        )
        .eq('id', patientId)
        .is('deleted_at', null)
        .single()

      if (error) {
        logger.error({ error, patientId }, 'Failed to fetch patient')
        return NextResponse.json({ error: 'Failed to fetch patient' }, { status: 500 })
      }

      return NextResponse.json(patient)
    }

    // List all patients
    let query = supabase
      .from('patients')
      .select(
        `
        *,
        category:patient_categories(id, name, color, icon),
        workspace:workspaces(id, name, slug),
        organization:organizations(id, name, slug)
      `,
        { count: 'exact' }
      )
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId)
    }

    if (organizationId) {
      // Get workspace IDs for this organization
      const { data: workspaces } = await supabase
        .from('workspaces')
        .select('id')
        .eq('organization_id', organizationId)
        .is('deleted_at', null)

      if (workspaces && workspaces.length > 0) {
        const workspaceIds = workspaces.map((w) => w.id)
        query = query.in('workspace_id', workspaceIds)
      } else {
        // No workspaces, return empty
        return NextResponse.json({
          patients: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        })
      }
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,id.ilike.%${search}%`)
    }

    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    if (workflowState) {
      query = query.eq('workflow_state', workflowState)
    }

    const { data: patients, count, error } = await query

    if (error) {
      logger.error({ error }, 'Failed to fetch patients')
      return NextResponse.json({ error: 'Failed to fetch patients' }, { status: 500 })
    }

    // Get statistics
    const { count: totalPatients } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)

    const { count: activePatients } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)
      .is('discharge_date', null)

    const { count: dischargedPatients } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)
      .not('discharge_date', 'is', null)

    return NextResponse.json({
      patients: patients || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      statistics: {
        total: totalPatients || 0,
        active: activePatients || 0,
        discharged: dischargedPatients || 0,
      },
    })
  } catch (error) {
    logger.error({ error }, 'Admin patients API error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAdmin()
    if (authResult.error) {
      return authResult.error
    }

    const supabase = await createClient()
    const body = await request.json()
    const { patient_id, ...updates } = body

    if (!patient_id) {
      return NextResponse.json({ error: 'patient_id required' }, { status: 400 })
    }

    // Update patient
    const { data, error } = await supabase
      .from('patients')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', patient_id)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) {
      logger.error({ error, patient_id, updates }, 'Failed to update patient')
      return NextResponse.json({ error: 'Failed to update patient' }, { status: 500 })
    }

    logger.info({ patient_id, updates, updatedBy: authResult.user!.id }, 'Patient updated by admin')

    return NextResponse.json(data)
  } catch (error) {
    logger.error({ error }, 'Admin patients PATCH error')
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
    const patientId = searchParams.get('patient_id')

    if (!patientId) {
      return NextResponse.json({ error: 'patient_id required' }, { status: 400 })
    }

    // Soft delete patient
    const { error } = await supabase
      .from('patients')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', patientId)

    if (error) {
      logger.error({ error, patientId }, 'Failed to delete patient')
      return NextResponse.json({ error: 'Failed to delete patient' }, { status: 500 })
    }

    logger.info({ patientId, deletedBy: authResult.user!.id }, 'Patient deleted by admin')

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({ error }, 'Admin patients DELETE error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

