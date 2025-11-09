import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { UpdateMemberInput, Permission } from '@/types'
import { getAllPermissions } from '@/lib/permissions'
import { requireRole, forbiddenResponse, unauthorizedResponse } from '@/lib/permissions/middleware'

// PUT /api/workspaces/[id]/members/[memberId] - Update member
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  return handleUpdateMember(request, params)
}

// PATCH /api/workspaces/[id]/members/[memberId] - Update member (alias for PUT)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  return handleUpdateMember(request, params)
}

async function handleUpdateMember(
  request: NextRequest,
  params: Promise<{ id: string; memberId: string }>
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
      return unauthorizedResponse()
    }

    // Check if user has admin access using middleware
    try {
      await requireRole(id, ['owner', 'admin'])
    } catch (error) {
      return forbiddenResponse(
        error instanceof Error ? error.message : 'Bu işlem için admin yetkisi gerekli'
      )
    }

    const body = (await request.json()) as UpdateMemberInput

    // Validate permissions if provided
    if (body.permissions !== undefined) {
      if (!Array.isArray(body.permissions)) {
        return NextResponse.json({ error: 'Permissions must be an array' }, { status: 400 })
      }

      // Validate each permission
      const validPermissions = getAllPermissions()
      const invalidPermissions = body.permissions.filter(
        (p) => !validPermissions.includes(p as Permission)
      )

      if (invalidPermissions.length > 0) {
        return NextResponse.json(
          { error: `Invalid permissions: ${invalidPermissions.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Build update object
    const updates: Record<string, unknown> = {}
    if (body.role !== undefined) updates.role = body.role
    if (body.permissions !== undefined) {
      // Ensure permissions is stored as JSONB array
      updates.permissions = Array.isArray(body.permissions) ? body.permissions : []
    }
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
    console.error('Error in update member:', error)
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
      return unauthorizedResponse()
    }

    // Check if user has admin access using middleware
    try {
      await requireRole(id, ['owner', 'admin'])
    } catch (error) {
      return forbiddenResponse(
        error instanceof Error ? error.message : 'Bu işlem için admin yetkisi gerekli'
      )
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
    const { error: deleteError } = await supabase
      .from('workspace_members')
      .delete()
      .eq('id', memberId)
      .eq('workspace_id', id)

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
