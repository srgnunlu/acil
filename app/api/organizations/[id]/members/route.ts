// ============================================
// ORGANIZATION MEMBERS API
// ============================================
// GET: List organization members
// POST: Add member to organization (invite or direct add)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { requireRole, forbiddenResponse, unauthorizedResponse } from '@/lib/permissions/middleware'

// ============================================
// GET /api/organizations/[id]/members
// ============================================

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: organizationId } = await params
    const supabase = await createClient()

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return unauthorizedResponse()
    }

    // Check if user is a member of this organization
    const { data: userMembership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!userMembership) {
      return forbiddenResponse('Bu organizasyonun üyesi değilsiniz')
    }

    // Get all organization members
    const { data: members, error } = await supabase
      .from('organization_members')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching organization members:', error)
      return NextResponse.json(
        { success: false, error: 'Organization members yüklenemedi' },
        { status: 500 }
      )
    }

    // Fetch profiles separately
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let membersWithProfiles: any[] = members || []
    if (membersWithProfiles.length > 0) {
      const userIds = membersWithProfiles.map((m) => m.user_id).filter(Boolean)

      if (userIds.length > 0) {
        // Fetch profiles
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, id, full_name, avatar_url, title, specialty')
          .in('user_id', userIds)

        if (profilesError) {
          console.error('[Organization Members API] Error fetching profiles:', profilesError)
        }

        // Fetch emails from auth.users using admin client (optional, fail gracefully)
        const emailMap = new Map<string, string>()
        try {
          const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
          if (serviceRoleKey && process.env.NEXT_PUBLIC_SUPABASE_URL) {
            const supabaseAdmin = createSupabaseClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL,
              serviceRoleKey,
              {
                auth: {
                  autoRefreshToken: false,
                  persistSession: false,
                },
              }
            )

            const {
              data: { users },
              error: usersError,
            } = await supabaseAdmin.auth.admin.listUsers()

            if (!usersError && users) {
              users.forEach((u) => {
                if (u.email && userIds.includes(u.id)) {
                  emailMap.set(u.id, u.email)
                }
              })
            } else if (usersError) {
              console.warn(
                '[Organization Members API] Error fetching emails (non-critical):',
                usersError.message
              )
            }
          } else {
            console.warn(
              '[Organization Members API] Service role key not configured, skipping email fetch'
            )
          }
        } catch (emailError) {
          console.warn(
            '[Organization Members API] Exception fetching emails (non-critical):',
            emailError
          )
          // Continue without emails
        }

        // Create profiles map
        const profilesMap = new Map(profiles?.map((p) => [p.user_id, p]) || [])

        membersWithProfiles = membersWithProfiles.map((member) => {
          const profile = profilesMap.get(member.user_id) || null
          const email = emailMap.get(member.user_id) || null

          return {
            ...member,
            profile: profile
              ? {
                  ...profile,
                  email,
                }
              : null,
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      members: membersWithProfiles,
    })
  } catch (error) {
    console.error('[Organization Members API] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Bir hata oluştu'
    const errorDetails = error instanceof Error ? error.stack : String(error)
    console.error('[Organization Members API] Error details:', errorDetails)
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined,
      },
      { status: 500 }
    )
  }
}

// ============================================
// POST /api/organizations/[id]/members
// ============================================
// Add member to organization (invite or direct add)

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: organizationId } = await params
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
    const { user_id, email, role = 'member', workspace_ids = [] } = body

    // Either user_id or email must be provided
    if (!user_id && !email) {
      return NextResponse.json(
        { success: false, error: 'user_id veya email gerekli' },
        { status: 400 }
      )
    }

    let targetUserId = user_id

    // If email provided, find or create user
    if (email && !user_id) {
      // Check if user exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', email)
        .single()

      if (existingUser) {
        targetUserId = existingUser.user_id
      } else {
        // User doesn't exist, create invitation (TODO: implement organization invitations)
        return NextResponse.json(
          {
            success: false,
            error: 'Kullanıcı bulunamadı. Önce kullanıcının sisteme kayıt olması gerekir.',
          },
          { status: 404 }
        )
      }
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('user_id', targetUserId)
      .single()

    if (existingMember) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı zaten organizasyonun üyesi' },
        { status: 400 }
      )
    }

    // Add member to organization
    const { data: member, error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: organizationId,
        user_id: targetUserId,
        role,
        status: 'active',
        invited_by: user.id,
        joined_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (memberError) {
      console.error('Error adding organization member:', memberError)
      return NextResponse.json({ success: false, error: 'Üye eklenemedi' }, { status: 500 })
    }

    // Add user to selected workspaces
    if (workspace_ids.length > 0) {
      // Verify workspaces belong to this organization
      const { data: orgWorkspaces } = await supabase
        .from('workspaces')
        .select('id')
        .eq('organization_id', organizationId)
        .in('id', workspace_ids)
        .is('deleted_at', null)

      const validWorkspaceIds = (orgWorkspaces || []).map((w) => w.id)

      if (validWorkspaceIds.length > 0) {
        // Add user to workspaces with default role (can be updated later)
        const workspaceMembers = validWorkspaceIds.map((workspaceId) => ({
          workspace_id: workspaceId,
          user_id: targetUserId,
          role: 'doctor' as const, // Default role, can be changed
          status: 'active' as const,
          invited_by: user.id,
          joined_at: new Date().toISOString(),
        }))

        await supabase.from('workspace_members').insert(workspaceMembers)
      }
    }

    return NextResponse.json({
      success: true,
      member,
    })
  } catch (error) {
    console.error('Organization members API error:', error)
    return NextResponse.json({ success: false, error: 'Bir hata oluştu' }, { status: 500 })
  }
}
