import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { CreateWorkspaceInput } from '@/types'

// GET /api/workspaces - Get user's workspaces
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[/api/workspaces] Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[/api/workspaces] User authenticated:', { id: user.id, email: user.email })

    // Get query params
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')

    // Step 1: Get organization IDs where user is a member
    console.log('[/api/workspaces] Step 1: Fetching organization_members...')
    const { data: orgMemberships, error: orgMemberError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('status', 'active')

    if (orgMemberError) {
      console.error('[/api/workspaces] Error fetching organization memberships:', {
        error: orgMemberError,
        code: orgMemberError.code,
        message: orgMemberError.message,
        details: orgMemberError.details,
        hint: orgMemberError.hint,
      })
      return NextResponse.json(
        {
          error: 'Failed to fetch organization memberships',
          details: orgMemberError.message,
          code: orgMemberError.code,
        },
        { status: 500 }
      )
    }

    const orgIds = orgMemberships?.map((m) => m.organization_id).filter(Boolean) || []

    if (orgIds.length === 0) {
      console.log(
        '[/api/workspaces] No organization memberships found for user, returning empty array'
      )
      return NextResponse.json({ workspaces: [] })
    }

    console.log('[/api/workspaces] User is member of organizations:', orgIds)

    // Step 2: Get workspace memberships for role mapping
    console.log('[/api/workspaces] Step 2: Fetching workspace_members for role mapping...')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { data: memberships, error: memberError } = await supabase
      .from('workspace_members')
      .select('workspace_id, role')
      .eq('user_id', user.id)
      .eq('status', 'active')

    const roleMap = new Map(memberships?.map((m) => [m.workspace_id, m.role]) || [])

    console.log('[/api/workspaces] Step 3: Fetching workspaces for organizations:', orgIds)

    // Step 3: Get workspaces from user's organizations (RLS will filter)
    // Organization'a üye olan kullanıcılar o organization'ın tüm workspace'lerini görebilir
    // NOT: Organization join'i RLS sorunlarına neden olabilir, bu yüzden ayrı çekiyoruz
    let workspacesQuery = supabase
      .from('workspaces')
      .select('*')
      .in('organization_id', orgIds)
      .is('deleted_at', null)

    // Filter by organization if provided
    if (organizationId) {
      // Verify user is member of this organization
      if (!orgIds.includes(organizationId)) {
        return NextResponse.json({ error: 'Bu organizasyona erişim yetkiniz yok' }, { status: 403 })
      }
      workspacesQuery = workspacesQuery.eq('organization_id', organizationId)
    }

    const { data: workspaces, error: workspacesError } = await workspacesQuery.order('created_at', {
      ascending: false,
    })

    // Step 4: Get organizations separately (RLS sorunlarını önlemek için)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const organizationsMap = new Map<string, any>()
    if (workspaces && workspaces.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const uniqueOrgIds = [
        ...new Set(workspaces.map((w: any) => w.organization_id).filter(Boolean)),
      ]
      if (uniqueOrgIds.length > 0) {
        const { data: organizations, error: orgsError } = await supabase
          .from('organizations')
          .select('*')
          .in('id', uniqueOrgIds)

        if (orgsError) {
          console.warn('[/api/workspaces] Warning: Failed to fetch organizations:', orgsError)
          // Devam et, organization bilgisi olmadan da workspace'leri döndürebiliriz
        } else if (organizations) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          organizations.forEach((org: any) => {
            organizationsMap.set(org.id, org)
          })
        }
      }
    }

    console.log('[/api/workspaces] Workspaces query result:', {
      count: workspaces?.length || 0,
      error: workspacesError,
    })

    if (workspacesError) {
      console.error('[/api/workspaces] Error fetching workspaces:', {
        error: workspacesError,
        code: workspacesError.code,
        message: workspacesError.message,
        details: workspacesError.details,
        hint: workspacesError.hint,
      })
      return NextResponse.json(
        {
          error: 'Failed to fetch workspaces',
          details: workspacesError.message,
          code: workspacesError.code,
        },
        { status: 500 }
      )
    }

    // Step 3: Get stats for each workspace
    if (!workspaces || workspaces.length === 0) {
      console.log('[/api/workspaces] No workspaces found, returning empty array')
      return NextResponse.json({ workspaces: [] })
    }

    const workspacesWithStats = await Promise.all(
      workspaces.map(async (workspace) => {
        // Get member count
        const { count: memberCount } = await supabase
          .from('workspace_members')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', workspace.id)
          .eq('status', 'active')

        // Get patient count
        const { count: patientCount } = await supabase
          .from('patients')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', workspace.id)
          .is('deleted_at', null)

        // Get category count
        const { count: categoryCount } = await supabase
          .from('patient_categories')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', workspace.id)
          .is('deleted_at', null)

        return {
          ...workspace,
          organization: organizationsMap.get(workspace.organization_id) || null,
          member_count: memberCount || 0,
          patient_count: patientCount || 0,
          category_count: categoryCount || 0,
          user_role: roleMap.get(workspace.id) || null,
        }
      })
    )

    return NextResponse.json({ workspaces: workspacesWithStats })
  } catch (error) {
    console.error('Error in GET /api/workspaces:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// POST /api/workspaces - Create new workspace
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as CreateWorkspaceInput

    // Validate required fields
    if (!body.organization_id || !body.name || !body.slug) {
      return NextResponse.json(
        { error: 'Organization ID, name and slug are required' },
        { status: 400 }
      )
    }

    // Check if user is member of organization and has admin/owner role
    const { data: orgMembership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', body.organization_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    // User must be organization admin/owner to create workspace
    if (!orgMembership || !['owner', 'admin'].includes(orgMembership.role)) {
      return NextResponse.json(
        {
          error:
            'Bu organizasyonda workspace oluşturmak için admin veya owner yetkisine sahip olmalısınız',
        },
        { status: 403 }
      )
    }

    // Create workspace
    const { data: workspace, error: createError } = await supabase
      .from('workspaces')
      .insert({
        organization_id: body.organization_id,
        name: body.name,
        slug: body.slug,
        description: body.description,
        type: body.type || 'general',
        color: body.color || '#3b82f6',
        icon: body.icon || '🏥',
        settings: body.settings || {
          patient_limit: 50,
          require_approval_for_new_patients: false,
          enable_auto_analysis: true,
          enable_notifications: true,
        },
        is_active: true,
        created_by: user.id,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating workspace:', createError)
      if (createError.code === '23505') {
        // Unique violation
        return NextResponse.json(
          { error: 'Workspace slug already exists in this organization' },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 })
    }

    // Note: handle_new_workspace trigger automatically:
    // 1. Creates default categories
    // 2. Adds creator as workspace owner

    return NextResponse.json({ workspace }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/workspaces:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
