import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/patients - Get patients for a workspace
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const workspaceId = searchParams.get('workspace_id')

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspace_id is required' }, { status: 400 })
    }

    // Check if user is a member of this workspace
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'You are not a member of this workspace' }, { status: 403 })
    }

    // Fetch patients with category relationship
    const { data: patients, error } = await supabase
      .from('patients')
      .select(
        `
        id,
        name,
        age,
        gender,
        workflow_state,
        admission_date,
        discharge_date,
        category_id,
        assigned_to,
        created_at,
        category:patient_categories(
          id,
          name,
          color,
          icon
        )
      `
      )
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching patients:', error)
      return NextResponse.json({ error: 'Failed to fetch patients' }, { status: 500 })
    }

    // Fetch assigned user profiles separately
    const assignedUserIds = [
      ...new Set(
        (patients || []).map((p) => p.assigned_to).filter((id): id is string => id !== null)
      ),
    ]

    let assignedUsersMap: Record<string, { id: string; full_name: string }> = {}
    if (assignedUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', assignedUserIds)

      if (profiles) {
        assignedUsersMap = profiles.reduce(
          (acc, profile) => {
            acc[profile.user_id] = { id: profile.user_id, full_name: profile.full_name }
            return acc
          },
          {} as Record<string, { id: string; full_name: string }>
        )
      }
    }

    // Enrich patients with assigned_user data
    const enrichedPatients = (patients || []).map((patient) => ({
      ...patient,
      assigned_user: patient.assigned_to ? assignedUsersMap[patient.assigned_to] : undefined,
    }))

    return NextResponse.json({ patients: enrichedPatients })
  } catch (error) {
    console.error('Error in GET /api/patients:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
