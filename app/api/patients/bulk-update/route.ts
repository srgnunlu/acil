import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/patients/bulk-update - Bulk update patients
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { patient_ids, operation, data: updateData } = body

    // Validate required fields
    if (!patient_ids || !Array.isArray(patient_ids) || patient_ids.length === 0) {
      return NextResponse.json(
        { error: 'patient_ids array is required and must not be empty' },
        { status: 400 }
      )
    }

    if (!operation) {
      return NextResponse.json(
        { error: 'operation is required' },
        { status: 400 }
      )
    }

    // Validate operation types
    const validOperations = [
      'update_category',
      'update_workflow',
      'assign_doctor',
      'unassign_doctor'
    ]

    if (!validOperations.includes(operation)) {
      return NextResponse.json(
        { error: `Invalid operation. Must be one of: ${validOperations.join(', ')}` },
        { status: 400 }
      )
    }

    // Verify all patients exist and user has access
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id, workspace_id')
      .in('id', patient_ids)
      .is('deleted_at', null)

    if (patientsError) {
      return NextResponse.json(
        { error: 'Failed to verify patients' },
        { status: 500 }
      )
    }

    if (!patients || patients.length !== patient_ids.length) {
      return NextResponse.json(
        { error: 'Some patients not found or deleted' },
        { status: 404 }
      )
    }

    // Get unique workspace IDs
    const workspaceIds = [...new Set(patients.map(p => p.workspace_id))]

    // Verify user has access to all workspaces
    const { data: memberships } = await supabase
      .from('workspace_members')
      .select('workspace_id, role')
      .in('workspace_id', workspaceIds)
      .eq('user_id', user.id)
      .eq('status', 'active')

    if (!memberships || memberships.length !== workspaceIds.length) {
      return NextResponse.json(
        { error: 'You do not have access to all selected patients workspaces' },
        { status: 403 }
      )
    }

    // Check if user has sufficient permissions (doctor or above)
    const hasPermission = memberships.every(m =>
      ['owner', 'admin', 'senior_doctor', 'doctor'].includes(m.role)
    )

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    let updateCount = 0

    // Perform bulk operation
    switch (operation) {
      case 'update_category': {
        if (!updateData?.category_id) {
          return NextResponse.json(
            { error: 'category_id is required for update_category operation' },
            { status: 400 }
          )
        }

        // Verify category exists
        const { data: category } = await supabase
          .from('patient_categories')
          .select('id')
          .eq('id', updateData.category_id)
          .is('deleted_at', null)
          .single()

        if (!category) {
          return NextResponse.json(
            { error: 'Category not found' },
            { status: 404 }
          )
        }

        const { count } = await supabase
          .from('patients')
          .update({ category_id: updateData.category_id })
          .in('id', patient_ids)
          .select('id', { count: 'exact', head: true })

        updateCount = count || 0
        break
      }

      case 'update_workflow': {
        if (!updateData?.workflow_state) {
          return NextResponse.json(
            { error: 'workflow_state is required for update_workflow operation' },
            { status: 400 }
          )
        }

        const validStates = [
          'admission',
          'assessment',
          'diagnosis',
          'treatment',
          'observation',
          'discharge_planning',
          'discharged'
        ]

        if (!validStates.includes(updateData.workflow_state)) {
          return NextResponse.json(
            { error: `Invalid workflow_state. Must be one of: ${validStates.join(', ')}` },
            { status: 400 }
          )
        }

        const updatePayload: Record<string, unknown> = {
          workflow_state: updateData.workflow_state
        }

        // If transitioning to discharged, set discharge_date
        if (updateData.workflow_state === 'discharged') {
          updatePayload.discharge_date = new Date().toISOString()
        }

        const { count } = await supabase
          .from('patients')
          .update(updatePayload)
          .in('id', patient_ids)
          .select('id', { count: 'exact', head: true })

        updateCount = count || 0
        break
      }

      case 'assign_doctor': {
        if (!updateData?.doctor_id || !updateData?.assignment_type) {
          return NextResponse.json(
            { error: 'doctor_id and assignment_type are required for assign_doctor operation' },
            { status: 400 }
          )
        }

        // Create assignments for each patient
        const assignments = patient_ids.map(patientId => ({
          patient_id: patientId,
          user_id: updateData.doctor_id,
          assignment_type: updateData.assignment_type,
          assigned_by: user.id,
          is_active: true
        }))

        const { count } = await supabase
          .from('patient_assignments')
          .insert(assignments)
          .select('id', { count: 'exact', head: true })

        updateCount = count || 0

        // If primary assignment, also update patients.assigned_to
        if (updateData.assignment_type === 'primary') {
          await supabase
            .from('patients')
            .update({ assigned_to: updateData.doctor_id })
            .in('id', patient_ids)
        }

        break
      }

      case 'unassign_doctor': {
        if (!updateData?.doctor_id) {
          return NextResponse.json(
            { error: 'doctor_id is required for unassign_doctor operation' },
            { status: 400 }
          )
        }

        const { count } = await supabase
          .from('patient_assignments')
          .update({
            is_active: false,
            removed_at: new Date().toISOString()
          })
          .in('patient_id', patient_ids)
          .eq('user_id', updateData.doctor_id)
          .eq('is_active', true)
          .select('id', { count: 'exact', head: true })

        updateCount = count || 0

        // Clear assigned_to if it was a primary assignment
        await supabase
          .from('patients')
          .update({ assigned_to: null })
          .in('id', patient_ids)
          .eq('assigned_to', updateData.doctor_id)

        break
      }
    }

    return NextResponse.json({
      success: true,
      operation,
      updated_count: updateCount,
      message: `Successfully updated ${updateCount} patient(s)`
    })
  } catch (error) {
    console.error('Error in POST /api/patients/bulk-update:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
