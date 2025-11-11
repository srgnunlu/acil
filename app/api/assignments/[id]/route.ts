import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// PATCH /api/assignments/[id] - Update assignment
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
    const { assignment_type, notes, is_active } = body

    // Fetch assignment to check permissions
    const { data: assignment, error: fetchError } = await supabase
      .from('patient_assignments')
      .select('patient_id, user_id, assignment_type, assigned_by')
      .eq('id', id)
      .single()

    if (fetchError || !assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }

    // Check if patient exists and user has access
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('workspace_id')
      .eq('id', assignment.patient_id)
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

    const isAssigner = assignment.assigned_by === user.id
    const isAdmin = membership && ['owner', 'admin', 'senior_doctor'].includes(membership.role)

    if (!isAssigner && !isAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {}
    if (assignment_type !== undefined) updateData.assignment_type = assignment_type
    if (notes !== undefined) updateData.notes = notes
    if (is_active !== undefined) {
      updateData.is_active = is_active
      if (!is_active) {
        updateData.removed_at = new Date().toISOString()
      }
    }

    // Update assignment
    const { data: updatedAssignment, error } = await supabase
      .from('patient_assignments')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        patient:patients!patient_assignments_patient_id_fkey(id, full_name),
        assigned_user:profiles!patient_assignments_user_id_fkey(id, full_name, specialty),
        assigned_by_user:profiles!patient_assignments_assigned_by_fkey(id, full_name)
      `)
      .single()

    if (error) {
      console.error('Error updating assignment:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to update assignment' },
        { status: 500 }
      )
    }

    return NextResponse.json({ assignment: updatedAssignment })
  } catch (error) {
    console.error('Error in PATCH /api/assignments/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/assignments/[id] - Remove assignment
export async function DELETE(
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

    // Fetch assignment to check permissions
    const { data: assignment, error: fetchError } = await supabase
      .from('patient_assignments')
      .select('patient_id, user_id, assignment_type, assigned_by')
      .eq('id', id)
      .single()

    if (fetchError || !assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }

    // Check if patient exists and user has access
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('workspace_id')
      .eq('id', assignment.patient_id)
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

    const isAssigner = assignment.assigned_by === user.id
    const isAdmin = membership && ['owner', 'admin', 'senior_doctor'].includes(membership.role)

    if (!isAssigner && !isAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Delete assignment (hard delete)
    const { error } = await supabase
      .from('patient_assignments')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting assignment:', error)
      return NextResponse.json(
        { error: 'Failed to delete assignment' },
        { status: 500 }
      )
    }

    // If this was a primary assignment, clear patients.assigned_to
    if (assignment.assignment_type === 'primary') {
      await supabase
        .from('patients')
        .update({ assigned_to: null })
        .eq('id', assignment.patient_id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/assignments/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
