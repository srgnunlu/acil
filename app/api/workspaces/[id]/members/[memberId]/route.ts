import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { UpdateMemberInput } from '@/types'

// PUT /api/workspaces/[id]/members/[memberId] - Update member
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id, memberId } = await params
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
    const { data: adminCheck } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', id)
      .eq('user_id', user.id)
      .in('role', ['owner', 'admin'])
      .eq('status', 'active')
      .single()

    if (!adminCheck) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const body = (await request.json()) as UpdateMemberInput

    // Build update object
    const updates: Partial<UpdateMemberInput> = {}
    if (body.role !== undefined) updates.role = body.role
    if (body.permissions !== undefined) updates.permissions = body.permissions
    if (body.status !== undefined) updates.status = body.status

    // Update member
    const { data: member, error: updateError } = await supabase
      .from('workspace_members')
      .update(updates)
      .eq('id', memberId)
      .eq('workspace_id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating member:', updateError)
      return NextResponse.json({ error: 'Failed to update member' }, { status: 500 })
    }

    return NextResponse.json({ member })
  } catch (error) {
    console.error('Error in PUT /api/workspaces/[id]/members/[memberId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/workspaces/[id]/members/[memberId] - Remove member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id, memberId } = await params
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
    const { data: adminCheck } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', id)
      .eq('user_id', user.id)
      .in('role', ['owner', 'admin'])
      .eq('status', 'active')
      .single()

    if (!adminCheck) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Get member to check if they're the last owner
    const { data: targetMember } = await supabase
      .from('workspace_members')
      .select('role, user_id')
      .eq('id', memberId)
      .single()

    if (targetMember?.role === 'owner') {
      // Check if there are other owners
      const { count } = await supabase
        .from('workspace_members')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', id)
        .eq('role', 'owner')
        .eq('status', 'active')

      if (count && count <= 1) {
        return NextResponse.json({ error: 'Cannot remove the last owner' }, { status: 400 })
      }
    }

    // Delete member (hard delete or set status to inactive)
    const { error: deleteError } = await supabase.from('workspace_members').delete().eq('id', memberId).eq('workspace_id', id)

    if (deleteError) {
      console.error('Error removing member:', deleteError)
      return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/workspaces/[id]/members/[memberId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
