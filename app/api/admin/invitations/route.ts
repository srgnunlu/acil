import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { requireAdmin } from '@/lib/middleware/admin-auth'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin()
    if (authResult.error) {
      return authResult.error
    }

    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const invitationId = searchParams.get('invitation_id')
    const workspaceId = searchParams.get('workspace_id')
    const status = searchParams.get('status')
    const email = searchParams.get('email')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Get single invitation
    if (invitationId) {
      const { data: invitation, error } = await supabase
        .from('workspace_invitations')
        .select(
          `
          *,
          workspace:workspaces(id, name, slug, organization_id),
          inviter:profiles!workspace_invitations_invited_by_fkey(user_id, full_name, avatar_url)
        `
        )
        .eq('id', invitationId)
        .single()

      if (error) {
        logger.error({ error, invitationId }, 'Failed to fetch invitation')
        return NextResponse.json({ error: 'Failed to fetch invitation' }, { status: 500 })
      }

      return NextResponse.json(invitation)
    }

    // List all invitations
    let query = supabase
      .from('workspace_invitations')
      .select(
        `
        *,
        workspace:workspaces(id, name, slug, organization_id),
        inviter:profiles!workspace_invitations_invited_by_fkey(user_id, full_name, avatar_url)
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (email) {
      query = query.ilike('email', `%${email}%`)
    }

    const { data: invitations, count, error } = await query

    if (error) {
      logger.error({ error }, 'Failed to fetch invitations')
      return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 })
    }

    // Get statistics
    const { count: pendingCount } = await supabase
      .from('workspace_invitations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    const { count: acceptedCount } = await supabase
      .from('workspace_invitations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'accepted')

    const { count: rejectedCount } = await supabase
      .from('workspace_invitations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'rejected')

    return NextResponse.json({
      invitations: invitations || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      statistics: {
        pending: pendingCount || 0,
        accepted: acceptedCount || 0,
        rejected: rejectedCount || 0,
        total: count || 0,
      },
    })
  } catch (error) {
    logger.error({ error }, 'Admin invitations API error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin()
    if (authResult.error) {
      return authResult.error
    }

    const supabase = await createClient()
    const body = await request.json()
    const { workspace_id, email, role, message } = body

    if (!workspace_id || !email || !role) {
      return NextResponse.json(
        { error: 'workspace_id, email, and role are required' },
        { status: 400 }
      )
    }

    // Verify workspace exists
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id, name')
      .eq('id', workspace_id)
      .is('deleted_at', null)
      .single()

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Check if user already exists
    const { data: existingUser } = await supabase.auth.admin.listUsers()
    const userExists = existingUser?.users?.some((u) => u.email === email)

    // Check if user is already a member
    if (userExists) {
      const { data: member } = await supabase
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', workspace_id)
        .eq('user_id', existingUser.users.find((u) => u.email === email)?.id)
        .eq('status', 'active')
        .single()

      if (member) {
        return NextResponse.json(
          { error: 'User is already a member of this workspace' },
          { status: 400 }
        )
      }
    }

    // Check if pending invitation already exists
    const { data: existingInvitation } = await supabase
      .from('workspace_invitations')
      .select('id')
      .eq('workspace_id', workspace_id)
      .eq('email', email)
      .eq('status', 'pending')
      .single()

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'Pending invitation already exists for this email' },
        { status: 400 }
      )
    }

    // Create invitation
    const { data: invitation, error } = await supabase
      .from('workspace_invitations')
      .insert({
        workspace_id,
        email,
        role,
        message: message || null,
        invited_by: authResult.user!.id,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      })
      .select()
      .single()

    if (error) {
      logger.error({ error, body }, 'Failed to create invitation')
      return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 })
    }

    logger.info(
      { invitationId: invitation.id, workspace_id, email, createdBy: authResult.user!.id },
      'Invitation created by admin'
    )

    return NextResponse.json(invitation, { status: 201 })
  } catch (error) {
    logger.error({ error }, 'Admin invitations POST error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAdmin()
    if (authResult.error) {
      return authResult.error
    }

    const supabase = await createClient()
    const body = await request.json()
    const { invitation_id, ...updates } = body

    if (!invitation_id) {
      return NextResponse.json({ error: 'invitation_id required' }, { status: 400 })
    }

    // Update invitation
    const { data, error } = await supabase
      .from('workspace_invitations')
      .update(updates)
      .eq('id', invitation_id)
      .select()
      .single()

    if (error) {
      logger.error({ error, invitation_id, updates }, 'Failed to update invitation')
      return NextResponse.json({ error: 'Failed to update invitation' }, { status: 500 })
    }

    logger.info({ invitation_id, updates, updatedBy: authResult.user!.id }, 'Invitation updated by admin')

    return NextResponse.json(data)
  } catch (error) {
    logger.error({ error }, 'Admin invitations PATCH error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAdmin()
    if (authResult.error) {
      return authResult.error
    }

    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const invitationId = searchParams.get('invitation_id')

    if (!invitationId) {
      return NextResponse.json({ error: 'invitation_id required' }, { status: 400 })
    }

    // Delete invitation
    const { error } = await supabase.from('workspace_invitations').delete().eq('id', invitationId)

    if (error) {
      logger.error({ error, invitationId }, 'Failed to delete invitation')
      return NextResponse.json({ error: 'Failed to delete invitation' }, { status: 500 })
    }

    logger.info({ invitationId, deletedBy: authResult.user!.id }, 'Invitation deleted by admin')

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({ error }, 'Admin invitations DELETE error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

