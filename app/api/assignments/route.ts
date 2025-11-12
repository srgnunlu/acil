import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/assignments - Get assignments for a patient or user
export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams
    const patientId = searchParams.get('patient_id')
    const userId = searchParams.get('user_id')

    let query = supabase
      .from('patient_assignments')
      .select(`
        *,
        patient:patients!patient_assignments_patient_id_fkey(id, full_name, age, gender),
        assigned_user:profiles!patient_assignments_user_id_fkey(id, full_name, specialty),
        assigned_by_user:profiles!patient_assignments_assigned_by_fkey(id, full_name)
      `)
      .eq('is_active', true)

    if (patientId) {
      query = query.eq('patient_id', patientId)
    }

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: assignments, error } = await query.order('assigned_at', { ascending: false })

    if (error) {
      console.error('Error fetching assignments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch assignments' },
        { status: 500 }
      )
    }

    return NextResponse.json({ assignments })
  } catch (error) {
    console.error('Error in GET /api/assignments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/assignments - Create new assignment
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
    const { patient_id, user_id: assignedUserId, assignment_type, notes } = body

    // Validate required fields
    if (!patient_id || !assignedUserId || !assignment_type) {
      return NextResponse.json(
        { error: 'patient_id, user_id, and assignment_type are required' },
        { status: 400 }
      )
    }

    // Validate assignment_type
    const validTypes = ['primary', 'secondary', 'consultant', 'nurse', 'observer']
    if (!validTypes.includes(assignment_type)) {
      return NextResponse.json(
        { error: `Invalid assignment_type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Check if patient exists and user has access
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('workspace_id')
      .eq('id', patient_id)
      .is('deleted_at', null)
      .single()

    if (patientError || !patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }

    // Check if current user is in the workspace
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

    // If assigning as primary, deactivate existing primary assignment
    if (assignment_type === 'primary') {
      await supabase
        .from('patient_assignments')
        .update({ is_active: false, removed_at: new Date().toISOString() })
        .eq('patient_id', patient_id)
        .eq('assignment_type', 'primary')
        .eq('is_active', true)
    }

    // Check if assignment already exists (same user, same type, active)
    const { data: existingAssignment } = await supabase
      .from('patient_assignments')
      .select('id')
      .eq('patient_id', patient_id)
      .eq('user_id', assignedUserId)
      .eq('assignment_type', assignment_type)
      .eq('is_active', true)
      .single()

    if (existingAssignment) {
      return NextResponse.json(
        { error: 'Assignment already exists' },
        { status: 400 }
      )
    }

    // Create assignment
    const { data: assignment, error } = await supabase
      .from('patient_assignments')
      .insert({
        patient_id,
        user_id: assignedUserId,
        assignment_type,
        notes,
        assigned_by: user.id,
        is_active: true,
      })
      .select(`
        *,
        patient:patients!patient_assignments_patient_id_fkey(id, full_name),
        assigned_user:profiles!patient_assignments_user_id_fkey(id, full_name, specialty),
        assigned_by_user:profiles!patient_assignments_assigned_by_fkey(id, full_name)
      `)
      .single()

    if (error) {
      console.error('Error creating assignment:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to create assignment' },
        { status: 500 }
      )
    }

    // If primary assignment, also update patients.assigned_to
    if (assignment_type === 'primary') {
      await supabase
        .from('patients')
        .update({ assigned_to: assignedUserId })
        .eq('id', patient_id)
    }

    return NextResponse.json({ assignment }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/assignments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
