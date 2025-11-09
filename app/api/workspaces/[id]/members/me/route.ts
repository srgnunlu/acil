// ============================================
// CURRENT USER MEMBERSHIP API
// ============================================
// GET: Get current user's membership in a workspace
// This endpoint returns the current authenticated user's
// membership details including role and custom permissions

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { forbiddenResponse, unauthorizedResponse } from '@/lib/permissions/middleware'

// ============================================
// GET /api/workspaces/[id]/members/me
// ============================================

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: workspaceId } = await params
    const supabase = await createClient()

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return unauthorizedResponse()
    }

    // Get current user's membership in this workspace
    console.log('[GET /api/workspaces/[id]/members/me] Fetching membership:', {
      workspaceId,
      userId: user.id,
    })

    // Önce workspace'in organization_id'sini al
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('organization_id')
      .eq('id', workspaceId)
      .single()

    if (workspaceError || !workspace) {
      console.error('[GET /api/workspaces/[id]/members/me] Workspace not found')
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Organization membership kontrolü
    let hasOrgAccess = false
    if (workspace.organization_id) {
      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('id, role')
        .eq('organization_id', workspace.organization_id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (orgMember) {
        hasOrgAccess = true
        console.log('[GET /api/workspaces/[id]/members/me] User has organization access')
      }
    }

    // Workspace membership'i çek (profile join olmadan)
    const { data: membership, error } = await supabase
      .from('workspace_members')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    // Eğer workspace membership yoksa ama organization membership varsa,
    // organization üyesi olarak erişim sağlayabilir
    if (!membership && !hasOrgAccess) {
      console.warn('[GET /api/workspaces/[id]/members/me] No membership found')
      return forbiddenResponse("Bu workspace'in üyesi değilsiniz")
    }

    // Eğer workspace membership yoksa ama organization membership varsa,
    // organization üyesi olarak bir "virtual" membership döndür
    if (!membership && hasOrgAccess) {
      console.log(
        '[GET /api/workspaces/[id]/members/me] User has organization access but no workspace membership'
      )
      // Organization üyesi olarak erişim var ama workspace'te direkt üyelik yok
      // Bu durumda null role ile erişim sağlayabilir
      const { data: orgMember } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', workspace.organization_id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      // Profile bilgisini ayrı bir query ile çek
      let profile = null
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, user_id, full_name, avatar_url, title, specialty')
          .eq('user_id', user.id)
          .single()

        if (!profileError && profileData) {
          profile = profileData
        }
      } catch (profileErr) {
        console.warn(
          '[GET /api/workspaces/[id]/members/me] Profile fetch exception (non-critical):',
          profileErr
        )
      }

      return NextResponse.json({
        success: true,
        member: {
          id: null,
          workspace_id: workspaceId,
          user_id: user.id,
          role: null, // Organization üyesi ama workspace'te direkt üyelik yok
          permissions: [],
          status: 'active',
          invited_by: null,
          invited_at: null,
          joined_at: null,
          last_activity_at: null,
          created_at: null,
          updated_at: null,
          profile: profile,
          organization_role: orgMember?.role || null,
        },
      })
    }

    if (error) {
      console.error('[GET /api/workspaces/[id]/members/me] Error fetching membership:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      })

      // RLS policy hatası olabilir
      if (error.code === 'PGRST116' || error.message?.includes('policy')) {
        console.error(
          '[GET /api/workspaces/[id]/members/me] RLS policy error - user may not have access'
        )
      }

      // Eğer organization erişimi varsa devam et
      if (!hasOrgAccess) {
        return forbiddenResponse("Bu workspace'in üyesi değilsiniz veya erişim yetkiniz yok")
      }
    }

    // Eğer membership hala null ise ve organization erişimi yoksa hata döndür
    if (!membership && !hasOrgAccess) {
      return forbiddenResponse("Bu workspace'in üyesi değilsiniz")
    }

    // Eğer membership varsa devam et
    if (membership) {
      console.log('[GET /api/workspaces/[id]/members/me] Membership found:', {
        id: membership.id,
        role: membership.role,
        status: membership.status,
      })
    }

    // Profile bilgisini ayrı bir query ile çek (RLS policy sorunlarını önlemek için)
    let profile = null
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, avatar_url, title, specialty')
        .eq('user_id', user.id)
        .single()

      if (!profileError && profileData) {
        profile = profileData
      } else if (profileError) {
        console.warn(
          '[GET /api/workspaces/[id]/members/me] Profile fetch error (non-critical):',
          profileError.message
        )
      }
    } catch (profileErr) {
      console.warn(
        '[GET /api/workspaces/[id]/members/me] Profile fetch exception (non-critical):',
        profileErr
      )
    }

    // Eğer membership varsa parse et ve döndür
    if (membership) {
      // Parse permissions from JSONB
      const customPermissions = Array.isArray(membership.permissions)
        ? membership.permissions
        : membership.permissions
          ? JSON.parse(JSON.stringify(membership.permissions))
          : []

      return NextResponse.json({
        success: true,
        member: {
          id: membership.id,
          workspace_id: membership.workspace_id,
          user_id: membership.user_id,
          role: membership.role,
          permissions: customPermissions,
          status: membership.status,
          invited_by: membership.invited_by,
          invited_at: membership.invited_at,
          joined_at: membership.joined_at,
          last_activity_at: membership.last_activity_at,
          created_at: membership.created_at,
          updated_at: membership.updated_at,
          profile: profile,
        },
      })
    }

    // Buraya gelmemeli ama yine de kontrol
    return forbiddenResponse("Bu workspace'in üyesi değilsiniz")
  } catch (error) {
    console.error('Current user membership API error:', error)
    return NextResponse.json({ success: false, error: 'Bir hata oluştu' }, { status: 500 })
  }
}
