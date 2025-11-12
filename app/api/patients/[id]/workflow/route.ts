import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// PATCH /api/patients/[id]/workflow - Update patient workflow state
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

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
    const { workflow_state } = body

    // Validate workflow_state
    const validStates = [
      'admission',
      'assessment',
      'diagnosis',
      'treatment',
      'observation',
      'discharge_planning',
      'discharged'
    ]

    if (!workflow_state || !validStates.includes(workflow_state)) {
      return NextResponse.json(
        { error: `Invalid workflow_state. Must be one of: ${validStates.join(', ')}` },
        { status: 400 }
      )
    }

    // Check if patient exists and user has access
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('workspace_id, workflow_state')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (patientError || !patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }

    // Check if current user has permission
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', patient.workspace_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!membership || !['owner', 'admin', 'senior_doctor', 'doctor'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      workflow_state
    }

    // If transitioning to discharged, set discharge_date
    if (workflow_state === 'discharged' && patient.workflow_state !== 'discharged') {
      updateData.discharge_date = new Date().toISOString()
    }

    // Update patient workflow state
    const { data: updatedPatient, error } = await supabase
      .from('patients')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating workflow state:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to update workflow state' },
        { status: 500 }
      )
    }

    return NextResponse.json({ patient: updatedPatient })
  } catch (error) {
    console.error('Error in PATCH /api/patients/[id]/workflow:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
