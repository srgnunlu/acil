import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { CreateWorkspaceInput } from '@/types'

// GET /api/workspaces - Get user's workspaces
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query params
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')

    // Step 1: Get workspace IDs where user is an active member
    const { data: memberships, error: memberError } = await supabase
      .from('workspace_members')
      .select('workspace_id, role')
      .eq('user_id', user.id)
      .eq('status', 'active')

    if (memberError) {
      console.error('Error fetching memberships:', memberError)
      return NextResponse.json({ error: 'Failed to fetch memberships' }, { status: 500 })
    }

    if (!memberships || memberships.length === 0) {
      return NextResponse.json({ workspaces: [] })
    }

    const workspaceIds = memberships.map((m) => m.workspace_id)
    const roleMap = new Map(memberships.map((m) => [m.workspace_id, m.role]))

    // Step 2: Get workspaces with organization data
    let workspacesQuery = supabase
      .from('workspaces')
      .select('*, organization:organizations(*)')
      .in('id', workspaceIds)
      .is('deleted_at', null)

    // Filter by organization if provided
    if (organizationId) {
      workspacesQuery = workspacesQuery.eq('organization_id', organizationId)
    }

    const { data: workspaces, error: workspacesError } = await workspacesQuery.order('created_at', {
      ascending: false,
    })

    if (workspacesError) {
      console.error('Error fetching workspaces:', workspacesError)
      return NextResponse.json({ error: 'Failed to fetch workspaces' }, { status: 500 })
    }

    // Step 3: Get stats for each workspace
    const workspacesWithStats = await Promise.all(
      (workspaces || []).map(async (workspace) => {
        // Get member count
        const { count: memberCount } = await supabase
          .from('workspace_members')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', workspace.id)
          .eq('status', 'active')

        // Get patient count
        const { count: patientCount } = await supabase
          .from('patients')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', workspace.id)
          .is('deleted_at', null)

        // Get category count
        const { count: categoryCount } = await supabase
          .from('patient_categories')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', workspace.id)
          .is('deleted_at', null)

        return {
          ...workspace,
          member_count: memberCount || 0,
          patient_count: patientCount || 0,
          category_count: categoryCount || 0,
          user_role: roleMap.get(workspace.id) || null,
        }
      })
    )

    return NextResponse.json({ workspaces: workspacesWithStats })
  } catch (error) {
    console.error('Error in GET /api/workspaces:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/workspaces - Create new workspace
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as CreateWorkspaceInput

    // Validate required fields
    if (!body.organization_id || !body.name || !body.slug) {
      return NextResponse.json({ error: 'Organization ID, name and slug are required' }, { status: 400 })
    }

    // Check if user has access to create workspace in this organization
    // (user must be admin in another workspace of same organization)
    const { data: existingMembership } = await supabase
      .from('workspace_members')
      .select(
        `
        role,
        workspaces!inner(organization_id)
      `
      )
      .eq('user_id', user.id)
      .eq('workspaces.organization_id', body.organization_id)
      .in('role', ['owner', 'admin'])
      .eq('status', 'active')
      .limit(1)

    // If user doesn't have admin role in org, allow only if it's their first workspace
    if (!existingMembership || existingMembership.length === 0) {
      // Check if this is first workspace in organization
      const { count } = await supabase
        .from('workspaces')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', body.organization_id)

      if (count && count > 0) {
        return NextResponse.json(
          { error: 'Forbidden - Only organization admins can create workspaces' },
          { status: 403 }
        )
      }
    }

    // Create workspace
    const { data: workspace, error: createError } = await supabase
      .from('workspaces')
      .insert({
        organization_id: body.organization_id,
        name: body.name,
        slug: body.slug,
        description: body.description,
        type: body.type || 'general',
        color: body.color || '#3b82f6',
        icon: body.icon || '🏥',
        settings: body.settings || {
          patient_limit: 50,
          require_approval_for_new_patients: false,
          enable_auto_analysis: true,
          enable_notifications: true,
        },
        is_active: true,
        created_by: user.id,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating workspace:', createError)
      if (createError.code === '23505') {
        // Unique violation
        return NextResponse.json(
          { error: 'Workspace slug already exists in this organization' },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 })
    }

    // Note: handle_new_workspace trigger automatically:
    // 1. Creates default categories
    // 2. Adds creator as workspace owner

    return NextResponse.json({ workspace }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/workspaces:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
