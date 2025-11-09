// ============================================
// SINGLE INVITATION API
// ============================================
// GET: Get invitation details
// PATCH: Update invitation (cancel, resend)
// DELETE: Delete invitation

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireRole, forbiddenResponse, unauthorizedResponse } from '@/lib/permissions/middleware'

// ============================================
// GET /api/invitations/[id]
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return unauthorizedResponse()
    }

    // Get invitation
    const { data: invitation, error } = await supabase
      .from('workspace_invitations')
      .select(
        `
        *,
        workspace:workspaces(id, name, slug, type, color, icon),
        inviter:profiles!workspace_invitations_invited_by_fkey(id, full_name, avatar_url, title)
      `
      )
      .eq('id', id)
      .single()

    if (error || !invitation) {
      return NextResponse.json(
        { success: false, error: 'Invitation bulunamadı' },
        { status: 404 }
      )
    }

    // Check if user has permission to view this invitation
    // Either user is admin of the workspace or the invitation is for their email
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', invitation.workspace_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    const isAdmin = membership && ['owner', 'admin'].includes(membership.role)
    const isInvitee = invitation.email === user.email

    if (!isAdmin && !isInvitee) {
      return forbiddenResponse('Bu invitation\'ı görüntüleme yetkiniz yok')
    }

    return NextResponse.json({
      success: true,
      invitation,
    })
  } catch (error) {
    console.error('Get invitation error:', error)
    return NextResponse.json(
      { success: false, error: 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

// ============================================
// PATCH /api/invitations/[id]
// ============================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const body = await request.json()

    const { action } = body // 'cancel' or 'resend'

    if (!action || !['cancel', 'resend'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz action. "cancel" veya "resend" olmalı' },
        { status: 400 }
      )
    }

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return unauthorizedResponse()
    }

    // Get invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('workspace_invitations')
      .select('*')
      .eq('id', id)
      .single()

    if (invitationError || !invitation) {
      return NextResponse.json(
        { success: false, error: 'Invitation bulunamadı' },
        { status: 404 }
      )
    }

    // Check if user is admin of the workspace
    try {
      await requireRole(invitation.workspace_id, ['owner', 'admin'])
    } catch {
      return forbiddenResponse('Bu işlem için yetkiniz yok')
    }

    if (action === 'cancel') {
      // Cancel invitation
      const { error: updateError } = await supabase
        .from('workspace_invitations')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (updateError) {
        return NextResponse.json(
          { success: false, error: 'Invitation iptal edilemedi' },
          { status: 500 }
        )
      }

      // Log activity
      await supabase.from('user_activity_log').insert({
        user_id: user.id,
        workspace_id: invitation.workspace_id,
        activity_type: 'invitation_cancelled',
        entity_type: 'invitation',
        entity_id: invitation.id,
        description: `Cancelled invitation for ${invitation.email}`,
      })

      return NextResponse.json({
        success: true,
        message: 'Invitation iptal edildi',
      })
    } else if (action === 'resend') {
      // Resend invitation (extend expiry and regenerate token)
      const newExpiresAt = new Date()
      newExpiresAt.setDate(newExpiresAt.getDate() + 7)

      const { data: updatedInvitation, error: updateError } = await supabase
        .from('workspace_invitations')
        .update({
          invitation_token: crypto.randomUUID(),
          expires_at: newExpiresAt.toISOString(),
          status: 'pending', // Reset to pending if expired
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        return NextResponse.json(
          { success: false, error: 'Invitation yeniden gönderilemedi' },
          { status: 500 }
        )
      }

      // Log activity
      await supabase.from('user_activity_log').insert({
        user_id: user.id,
        workspace_id: invitation.workspace_id,
        activity_type: 'invitation_resent',
        entity_type: 'invitation',
        entity_id: invitation.id,
        description: `Resent invitation for ${invitation.email}`,
      })

      // TODO: Send invitation email again

      return NextResponse.json({
        success: true,
        invitation: updatedInvitation,
        message: 'Invitation yeniden gönderildi',
      })
    }

    return NextResponse.json(
      { success: false, error: 'Geçersiz action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Update invitation error:', error)
    return NextResponse.json(
      { success: false, error: 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

// ============================================
// DELETE /api/invitations/[id]
// ============================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return unauthorizedResponse()
    }

    // Get invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('workspace_invitations')
      .select('*')
      .eq('id', id)
      .single()

    if (invitationError || !invitation) {
      return NextResponse.json(
        { success: false, error: 'Invitation bulunamadı' },
        { status: 404 }
      )
    }

    // Check if user is admin of the workspace
    try {
      await requireRole(invitation.workspace_id, ['owner', 'admin'])
    } catch {
      return forbiddenResponse('Bu işlem için yetkiniz yok')
    }

    // Delete invitation
    const { error: deleteError } = await supabase
      .from('workspace_invitations')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: 'Invitation silinemedi' },
        { status: 500 }
      )
    }

    // Log activity
    await supabase.from('user_activity_log').insert({
      user_id: user.id,
      workspace_id: invitation.workspace_id,
      activity_type: 'invitation_deleted',
      entity_type: 'invitation',
      entity_id: invitation.id,
      description: `Deleted invitation for ${invitation.email}`,
    })

    return NextResponse.json({
      success: true,
      message: 'Invitation silindi',
    })
  } catch (error) {
    console.error('Delete invitation error:', error)
    return NextResponse.json(
      { success: false, error: 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}
