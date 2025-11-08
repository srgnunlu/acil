import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import type { InviteMemberInput, UpdateMemberInput } from '@/types'

// GET /api/workspaces/[id]/members - Get workspace members
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check workspace access
    const { data: access } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!access) {
      return NextResponse.json({ error: 'Forbidden - Workspace access required' }, { status: 403 })
    }

    // Get all members with profile data
    const { data: members, error } = await supabase
      .from('workspace_members')
      .select(
        `
        *,
        profile:profiles(
          full_name,
          avatar_url,
          title,
          specialty
        )
      `
      )
      .eq('workspace_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching members:', error)
      return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
    }

    return NextResponse.json({ members })
  } catch (error) {
    console.error('Error in GET /api/workspaces/[id]/members:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/workspaces/[id]/members - Invite/add member to workspace
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerClient()

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

    const body = (await request.json()) as InviteMemberInput

    // Validate required fields
    if (!body.user_id || !body.role) {
      return NextResponse.json({ error: 'User ID and role are required' }, { status: 400 })
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('workspace_members')
      .select('id, status')
      .eq('workspace_id', id)
      .eq('user_id', body.user_id)
      .single()

    if (existingMember) {
      if (existingMember.status === 'active') {
        return NextResponse.json({ error: 'User is already a member' }, { status: 409 })
      }
      // Reactivate if inactive
      const { data: reactivated, error: reactivateError } = await supabase
        .from('workspace_members')
        .update({
          status: 'active',
          role: body.role,
          permissions: body.permissions || [],
        })
        .eq('id', existingMember.id)
        .select()
        .single()

      if (reactivateError) {
        console.error('Error reactivating member:', reactivateError)
        return NextResponse.json({ error: 'Failed to reactivate member' }, { status: 500 })
      }

      return NextResponse.json({ member: reactivated })
    }

    // Add new member
    const { data: newMember, error: insertError } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: id,
        user_id: body.user_id,
        role: body.role,
        permissions: body.permissions || [],
        status: 'active',
        invited_by: user.id,
        invited_at: new Date().toISOString(),
        joined_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error adding member:', insertError)
      return NextResponse.json({ error: 'Failed to add member' }, { status: 500 })
    }

    return NextResponse.json({ member: newMember }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/workspaces/[id]/members:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
