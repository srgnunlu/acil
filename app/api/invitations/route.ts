// ============================================
// WORKSPACE INVITATIONS API
// ============================================
// GET: List invitations (for workspace admins or user's own invitations)
// POST: Create new invitation (admin only)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { forbiddenResponse, unauthorizedResponse } from '@/lib/permissions/middleware'
import type { CreateInvitationInput } from '@/types/invitation.types'

// ============================================
// GET /api/invitations
// ============================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams

    // Get query parameters
    const workspaceId = searchParams.get('workspace_id')
    const status = searchParams.get('status')
    const myInvitations = searchParams.get('my_invitations') === 'true'

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return unauthorizedResponse()
    }

    let query = supabase
      .from('workspace_invitations')
      .select('*')
      .order('created_at', { ascending: false })

    if (myInvitations) {
      // Get user's own invitations (by email)
      const { data: authUser } = await supabase.auth.getUser()
      if (authUser?.user?.email) {
        query = query.eq('email', authUser.user.email)
      }
    } else if (workspaceId) {
      // Get invitations for a specific workspace
      // Check if user is admin of this workspace
      const { data: membership } = await supabase
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (!membership || !['owner', 'admin'].includes(membership.role)) {
        return forbiddenResponse('Bu workspace için invitations görüntüleme yetkiniz yok')
      }

      query = query.eq('workspace_id', workspaceId)
    } else {
      // Get all invitations for workspaces where user is admin
      const { data: memberships } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .in('role', ['owner', 'admin'])

      if (!memberships || memberships.length === 0) {
        return NextResponse.json({
          success: true,
          invitations: [],
          total: 0,
        })
      }

      const workspaceIds = memberships.map((m) => m.workspace_id)
      query = query.in('workspace_id', workspaceIds)
    }

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status)
    }

    const { data: invitations, error } = await query

    if (error) {
      console.error('Error fetching invitations:', error)
      return NextResponse.json(
        { success: false, error: 'Invitations yüklenemedi' },
        { status: 500 }
      )
    }

    // Enrich invitations with workspace and inviter data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let enrichedInvitations: any[] = invitations || []
    if (enrichedInvitations.length > 0) {
      // Fetch workspaces
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const workspaceIds: any[] = [
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...new Set(enrichedInvitations.map((i: any) => i.workspace_id).filter(Boolean)),
      ]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let workspaces: any[] = []
      if (workspaceIds.length > 0) {
        const { data: workspacesData } = await supabase
          .from('workspaces')
          .select('id, name, slug, type, color, icon')
          .in('id', workspaceIds)
        workspaces = workspacesData || []
      }

      // Fetch inviter profiles
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const inviterIds: any[] = [
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...new Set(enrichedInvitations.map((i: any) => i.invited_by).filter(Boolean)),
      ]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let profiles: any[] = []
      if (inviterIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, id, full_name, avatar_url, title')
          .in('user_id', inviterIds)
        profiles = profilesData || []
      }

      // Merge data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      enrichedInvitations = enrichedInvitations.map((invitation: any) => ({
        ...invitation,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        workspace: workspaces?.find((w: any) => w.id === invitation.workspace_id) || null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        inviter: profiles?.find((p: any) => p.user_id === invitation.invited_by) || null,
      }))
    }

    return NextResponse.json({
      success: true,
      invitations: enrichedInvitations,
      total: enrichedInvitations.length,
    })
  } catch (error) {
    console.error('Invitations API error:', error)
    return NextResponse.json({ success: false, error: 'Bir hata oluştu' }, { status: 500 })
  }
}

// ============================================
// POST /api/invitations
// ============================================

export async function POST(request: NextRequest) {
  console.log('🔥 POST /api/invitations started')
  try {
    const supabase = await createClient()
    const body: CreateInvitationInput = await request.json()
    console.log('📝 Request body:', body)

    const {
      workspace_id,
      email,
      role,
      custom_permissions = [],
      message,
      expires_in_days = 7,
    } = body

    // Validate input
    if (!workspace_id || !email || !role) {
      return NextResponse.json(
        { success: false, error: 'workspace_id, email ve role gerekli' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, error: 'Geçersiz email formatı' }, { status: 400 })
    }

    // Get workspace to find organization
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('organization_id')
      .eq('id', workspace_id)
      .single()

    if (workspaceError || !workspace) {
      return NextResponse.json({ success: false, error: 'Workspace bulunamadı' }, { status: 404 })
    }

    // Check if user is organization admin/owner
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { data: orgMembership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', workspace.organization_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!orgMembership || !['owner', 'admin'].includes(orgMembership.role)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Bu organizasyonda workspace'e üye eklemek için admin veya owner yetkisine sahip olmalısınız",
        },
        { status: 403 }
      )
    }

    // Check if invited email is already a member
    // Get workspace members first
    const { data: existingMembers } = await supabase
      .from('workspace_members')
      .select('user_id')
      .eq('workspace_id', workspace_id)
      .eq('status', 'active')

    if (existingMembers && existingMembers.length > 0) {
      // Get user emails for these members using admin client
      const {
        data: { users },
        error: usersError,
      } = await supabase.auth.admin.listUsers()

      if (!usersError && users) {
        const memberUserIds = existingMembers.map((m) => m.user_id)
        const memberEmails = users
          .filter((u) => memberUserIds.includes(u.id))
          .map((u) => u.email)
          .filter(Boolean)

        if (memberEmails.includes(email)) {
          return NextResponse.json(
            { success: false, error: 'Bu kullanıcı zaten workspace üyesi' },
            { status: 400 }
          )
        }
      }
    }

    // Check if there's already a pending invitation
    const { data: existingInvitation } = await supabase
      .from('workspace_invitations')
      .select('id, status')
      .eq('workspace_id', workspace_id)
      .eq('email', email)
      .eq('status', 'pending')
      .single()

    if (existingInvitation) {
      return NextResponse.json(
        { success: false, error: 'Bu email için zaten bekleyen bir invitation var' },
        { status: 400 }
      )
    }

    // Calculate expiration date
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expires_in_days)

    // Create invitation
    console.log('💾 Creating invitation with data:', {
      workspace_id,
      email,
      role,
      custom_permissions,
      message,
      invited_by: user.id,
      expires_at: expiresAt.toISOString(),
    })

    const { data: invitation, error: invitationError } = await supabase
      .from('workspace_invitations')
      .insert({
        workspace_id,
        email,
        role,
        custom_permissions,
        invited_by: user.id,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (invitationError) {
      console.error('❌ Error creating invitation:', invitationError)
      return NextResponse.json(
        { success: false, error: 'Invitation oluşturulamadı' },
        { status: 500 }
      )
    }

    console.log('✅ Invitation created successfully:', invitation)

    // Log activity
    await supabase.from('user_activity_log').insert({
      user_id: user.id,
      workspace_id,
      activity_type: 'invitation_sent',
      entity_type: 'invitation',
      entity_id: invitation.id,
      description: `Invited ${email} as ${role}`,
      metadata: {
        email,
        role,
        invitation_id: invitation.id,
      },
    })

    // Send invitation email
    try {
      const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${invitation.invitation_token}`

      // Get workspace details
      const { data: workspaceDetails } = await supabase
        .from('workspaces')
        .select('name')
        .eq('id', workspace_id)
        .single()

      // Get inviter details
      const { data: inviterProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single()

      const inviterName = inviterProfile?.full_name || 'Bir kullanıcı'
      const workspaceName = workspaceDetails?.name || 'Workspace'

      // Import email service (dynamic import to avoid bundling issues)
      const { sendInvitationEmail } = await import('@/lib/email/send-invitation')

      const emailResult = await sendInvitationEmail(email, {
        inviterName,
        workspaceName,
        role,
        invitationUrl,
        expiresInDays: expires_in_days,
        message: message || undefined,
      })

      if (emailResult.success) {
        console.log(`📧 Invitation email sent to ${email}`)
      } else {
        console.error('⚠️ Failed to send invitation email:', emailResult.error)
        // Don't fail the invitation creation if email fails
      }
    } catch (emailError) {
      console.error('⚠️ Failed to send invitation email:', emailError)
      // Don't fail the invitation creation if email fails
    }

    return NextResponse.json({
      success: true,
      invitation,
    })
  } catch (error) {
    console.error('Create invitation error:', error)
    if (error instanceof Error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: false, error: 'Bir hata oluştu' }, { status: 500 })
  }
}
