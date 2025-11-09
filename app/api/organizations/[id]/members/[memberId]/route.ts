// ============================================
// ORGANIZATION MEMBER MANAGEMENT API
// ============================================
// PUT/PATCH: Update organization member (role, workspace access)
// DELETE: Remove member from organization

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireRole, forbiddenResponse, unauthorizedResponse } from '@/lib/permissions/middleware'

// ============================================
// PUT/PATCH /api/organizations/[id]/members/[memberId]
// ============================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  return handleUpdateMember(request, params)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  return handleUpdateMember(request, params)
}

async function handleUpdateMember(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id: organizationId, memberId } = await params
    const supabase = await createClient()

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return unauthorizedResponse()
    }

    // Check if user is admin/owner of organization
    try {
      await requireRole(organizationId, ['owner', 'admin'], 'organization')
    } catch (error) {
      return forbiddenResponse(
        error instanceof Error ? error.message : 'Bu işlem için admin yetkisi gerekli'
      )
    }

    const body = await request.json()
    const { role, workspace_ids, workspace_roles } = body

    // Update organization member role if provided
    if (role) {
      const { error: updateError } = await supabase
        .from('organization_members')
        .update({ role })
        .eq('id', memberId)
        .eq('organization_id', organizationId)

      if (updateError) {
        console.error('Error updating organization member:', updateError)
        return NextResponse.json({ success: false, error: 'Üye güncellenemedi' }, { status: 500 })
      }
    }

    // Update workspace memberships if provided
    if (workspace_ids && Array.isArray(workspace_ids)) {
      // Get member user_id
      const { data: member } = await supabase
        .from('organization_members')
        .select('user_id')
        .eq('id', memberId)
        .single()

      if (!member) {
        return NextResponse.json({ success: false, error: 'Üye bulunamadı' }, { status: 404 })
      }

      // Get organization workspaces
      const { data: orgWorkspaces } = await supabase
        .from('workspaces')
        .select('id')
        .eq('organization_id', organizationId)
        .is('deleted_at', null)

      const validWorkspaceIds = (orgWorkspaces || [])
        .map((w) => w.id)
        .filter((id) => workspace_ids.includes(id))

      // Remove user from workspaces not in the list
      const allWorkspaceIds = (orgWorkspaces || []).map((w) => w.id)
      const workspacesToRemove = allWorkspaceIds.filter((id) => !workspace_ids.includes(id))

      if (workspacesToRemove.length > 0) {
        await supabase
          .from('workspace_members')
          .delete()
          .eq('user_id', member.user_id)
          .in('workspace_id', workspacesToRemove)
      }

      // Add/update user in selected workspaces
      for (let i = 0; i < validWorkspaceIds.length; i++) {
        const workspaceId = validWorkspaceIds[i]
        const workspaceRole = workspace_roles?.[i] || 'doctor'

        // Check if membership exists
        const { data: existingMember } = await supabase
          .from('workspace_members')
          .select('id')
          .eq('workspace_id', workspaceId)
          .eq('user_id', member.user_id)
          .single()

        if (existingMember) {
          // Update existing membership
          await supabase
            .from('workspace_members')
            .update({ role: workspaceRole, status: 'active' })
            .eq('id', existingMember.id)
        } else {
          // Create new membership
          await supabase.from('workspace_members').insert({
            workspace_id: workspaceId,
            user_id: member.user_id,
            role: workspaceRole,
            status: 'active',
            invited_by: user.id,
            joined_at: new Date().toISOString(),
          })
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Organization member update error:', error)
    return NextResponse.json({ success: false, error: 'Bir hata oluştu' }, { status: 500 })
  }
}

// ============================================
// DELETE /api/organizations/[id]/members/[memberId]
// ============================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id: organizationId, memberId } = await params
    const supabase = await createClient()

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return unauthorizedResponse()
    }

    // Check if user is admin/owner of organization
    try {
      await requireRole(organizationId, ['owner', 'admin'], 'organization')
    } catch (error) {
      return forbiddenResponse(
        error instanceof Error ? error.message : 'Bu işlem için admin yetkisi gerekli'
      )
    }

    // Get member to check if they're the last owner
    const { data: targetMember } = await supabase
      .from('organization_members')
      .select('role, user_id')
      .eq('id', memberId)
      .single()

    if (targetMember?.role === 'owner') {
      // Check if there are other owners
      const { count } = await supabase
        .from('organization_members')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('role', 'owner')
        .eq('status', 'active')

      if (count && count <= 1) {
        return NextResponse.json({ error: 'Son owner silinemez' }, { status: 400 })
      }
    }

    // Remove member from organization (set status to inactive or delete)
    const { error: deleteError } = await supabase
      .from('organization_members')
      .update({ status: 'inactive' })
      .eq('id', memberId)
      .eq('organization_id', organizationId)

    if (deleteError) {
      console.error('Error removing organization member:', deleteError)
      return NextResponse.json({ success: false, error: 'Üye kaldırılamadı' }, { status: 500 })
    }

    // Also remove from all organization workspaces
    if (targetMember?.user_id) {
      const { data: orgWorkspaces } = await supabase
        .from('workspaces')
        .select('id')
        .eq('organization_id', organizationId)
        .is('deleted_at', null)

      const workspaceIds = (orgWorkspaces || []).map((w) => w.id)

      if (workspaceIds.length > 0) {
        await supabase
          .from('workspace_members')
          .delete()
          .eq('user_id', targetMember.user_id)
          .in('workspace_id', workspaceIds)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Organization member delete error:', error)
    return NextResponse.json({ success: false, error: 'Bir hata oluştu' }, { status: 500 })
  }
}
