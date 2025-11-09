import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { UpdateWorkspaceInput } from '@/types'

// GET /api/workspaces/[id] - Get workspace by ID with details
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get workspace with organization and user's membership
    const { data: workspace, error } = await supabase
      .from('workspaces')
      .select(
        `
        *,
        organization:organizations(*),
        workspace_members!inner(
          id,
          user_id,
          role,
          status,
          permissions
        )
      `
      )
      .eq('id', id)
      .eq('workspace_members.user_id', user.id)
      .eq('workspace_members.status', 'active')
      .is('deleted_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Workspace not found or access denied' }, { status: 404 })
      }
      console.error('Error fetching workspace:', error)
      return NextResponse.json({ error: 'Failed to fetch workspace' }, { status: 500 })
    }

    // Get stats
    const { count: memberCount } = await supabase
      .from('workspace_members')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', id)
      .eq('status', 'active')

    const { count: patientCount } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', id)
      .is('deleted_at', null)

    const { count: categoryCount } = await supabase
      .from('patient_categories')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', id)
      .is('deleted_at', null)

    // Get user's role
    const userMember = Array.isArray(workspace.workspace_members)
      ? workspace.workspace_members.find((m: { user_id: string }) => m.user_id === user.id)
      : null

    const workspaceWithStats = {
      ...workspace,
      member_count: memberCount || 0,
      patient_count: patientCount || 0,
      category_count: categoryCount || 0,
      user_role: userMember?.role || null,
    }

    return NextResponse.json({ workspace: workspaceWithStats })
  } catch (error) {
    console.error('Error in GET /api/workspaces/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/workspaces/[id] - Update workspace
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin access
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', id)
      .eq('user_id', user.id)
      .in('role', ['owner', 'admin'])
      .eq('status', 'active')
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const body = (await request.json()) as UpdateWorkspaceInput

    // Build update object
    const updates: Partial<UpdateWorkspaceInput> = {}
    if (body.name !== undefined) updates.name = body.name
    if (body.description !== undefined) updates.description = body.description
    if (body.color !== undefined) updates.color = body.color
    if (body.icon !== undefined) updates.icon = body.icon
    if (body.settings !== undefined) updates.settings = body.settings
    if (body.is_active !== undefined) updates.is_active = body.is_active

    // Update workspace
    const { data: workspace, error: updateError } = await supabase
      .from('workspaces')
      .update(updates)
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating workspace:', updateError)
      return NextResponse.json({ error: 'Failed to update workspace' }, { status: 500 })
    }

    return NextResponse.json({ workspace })
  } catch (error) {
    console.error('Error in PUT /api/workspaces/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/workspaces/[id] - Soft delete workspace
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is owner
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', id)
      .eq('user_id', user.id)
      .eq('role', 'owner')
      .eq('status', 'active')
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden - Owner access required' }, { status: 403 })
    }

    // Soft delete workspace
    const { error: deleteError } = await supabase
      .from('workspaces')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting workspace:', deleteError)
      return NextResponse.json({ error: 'Failed to delete workspace' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/workspaces/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
