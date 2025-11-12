import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// PATCH /api/patients/[id]/category - Update patient category
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
    const { category_id } = body

    // Validate category_id
    if (!category_id) {
      return NextResponse.json(
        { error: 'category_id is required' },
        { status: 400 }
      )
    }

    // Check if patient exists and user has access
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('workspace_id')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (patientError || !patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }

    // Verify category exists and belongs to same workspace
    const { data: category, error: categoryError } = await supabase
      .from('patient_categories')
      .select('id, workspace_id')
      .eq('id', category_id)
      .is('deleted_at', null)
      .single()

    if (categoryError || !category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    if (category.workspace_id !== patient.workspace_id) {
      return NextResponse.json(
        { error: 'Category does not belong to patient workspace' },
        { status: 400 }
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

    // Update patient category
    const { data: updatedPatient, error } = await supabase
      .from('patients')
      .update({ category_id })
      .eq('id', id)
      .select(`
        *,
        category:patient_categories!patients_category_id_fkey(id, name, color, icon)
      `)
      .single()

    if (error) {
      console.error('Error updating patient category:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to update patient category' },
        { status: 500 }
      )
    }

    return NextResponse.json({ patient: updatedPatient })
  } catch (error) {
    console.error('Error in PATCH /api/patients/[id]/category:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
