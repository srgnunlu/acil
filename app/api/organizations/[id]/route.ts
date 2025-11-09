import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { UpdateOrganizationInput } from '@/types'

// GET /api/organizations/[id] - Get organization by ID
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

    // Get organization with stats
    const { data: organization, error } = await supabase
      .from('organizations')
      .select(
        `
        *,
        workspaces (
          id,
          name,
          type,
          workspace_members!inner (
            user_id
          )
        )
      `
      )
      .eq('id', id)
      .eq('workspaces.workspace_members.user_id', user.id)
      .eq('workspaces.workspace_members.status', 'active')
      .is('deleted_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
      }
      console.error('Error fetching organization:', error)
      return NextResponse.json({ error: 'Failed to fetch organization' }, { status: 500 })
    }

    return NextResponse.json({ organization })
  } catch (error) {
    console.error('Error in GET /api/organizations/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/organizations/[id] - Update organization
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

    // Check if user has admin access to this organization
    const { data: access } = await supabase
      .from('workspaces')
      .select('id, workspace_members!inner(role)')
      .eq('organization_id', id)
      .eq('workspace_members.user_id', user.id)
      .in('workspace_members.role', ['owner', 'admin'])
      .eq('workspace_members.status', 'active')
      .limit(1)

    if (!access || access.length === 0) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const body = (await request.json()) as UpdateOrganizationInput

    // Build update object
    const updates: Partial<UpdateOrganizationInput> = {}
    if (body.name !== undefined) updates.name = body.name
    if (body.logo_url !== undefined) updates.logo_url = body.logo_url
    if (body.settings !== undefined) updates.settings = body.settings
    if (body.contact_email !== undefined) updates.contact_email = body.contact_email
    if (body.contact_phone !== undefined) updates.contact_phone = body.contact_phone
    if (body.address !== undefined) updates.address = body.address
    if (body.subscription_tier !== undefined) updates.subscription_tier = body.subscription_tier
    if (body.subscription_status !== undefined) updates.subscription_status = body.subscription_status
    if (body.max_users !== undefined) updates.max_users = body.max_users
    if (body.max_workspaces !== undefined) updates.max_workspaces = body.max_workspaces
    if (body.max_patients_per_workspace !== undefined)
      updates.max_patients_per_workspace = body.max_patients_per_workspace

    // Update organization
    const { data: organization, error: updateError } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating organization:', updateError)
      return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 })
    }

    return NextResponse.json({ organization })
  } catch (error) {
    console.error('Error in PUT /api/organizations/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/organizations/[id] - Soft delete organization
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

    // Check if user is owner of this organization
    const { data: access } = await supabase
      .from('workspaces')
      .select('id, workspace_members!inner(role)')
      .eq('organization_id', id)
      .eq('workspace_members.user_id', user.id)
      .eq('workspace_members.role', 'owner')
      .eq('workspace_members.status', 'active')
      .limit(1)

    if (!access || access.length === 0) {
      return NextResponse.json({ error: 'Forbidden - Owner access required' }, { status: 403 })
    }

    // Soft delete organization (CASCADE will soft delete workspaces)
    const { error: deleteError } = await supabase
      .from('organizations')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting organization:', deleteError)
      return NextResponse.json({ error: 'Failed to delete organization' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/organizations/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
