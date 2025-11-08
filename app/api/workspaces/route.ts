import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import type { CreateWorkspaceInput } from '@/types'

// GET /api/workspaces - Get user's workspaces
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

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

    // Build query
    let query = supabase
      .from('workspaces')
      .select(
        `
        *,
        organization:organizations(*),
        workspace_members!inner(
          id,
          user_id,
          role,
          status
        )
      `
      )
      .eq('workspace_members.user_id', user.id)
      .eq('workspace_members.status', 'active')
      .is('deleted_at', null)

    // Filter by organization if provided
    if (organizationId) {
      query = query.eq('organization_id', organizationId)
    }

    const { data: workspaces, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching workspaces:', error)
      return NextResponse.json({ error: 'Failed to fetch workspaces' }, { status: 500 })
    }

    // Get stats for each workspace
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

        // Get user's role
        const userMember = Array.isArray(workspace.workspace_members)
          ? workspace.workspace_members.find((m: { user_id: string }) => m.user_id === user.id)
          : null

        return {
          ...workspace,
          member_count: memberCount || 0,
          patient_count: patientCount || 0,
          category_count: categoryCount || 0,
          user_role: userMember?.role || null,
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
    const supabase = await createServerClient()

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
