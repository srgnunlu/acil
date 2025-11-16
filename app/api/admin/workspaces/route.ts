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
    const workspaceId = searchParams.get('workspace_id')
    const organizationId = searchParams.get('organization_id')
    const search = searchParams.get('search')
    const isActive = searchParams.get('is_active')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Get single workspace
    if (workspaceId) {
      const { data: workspace, error } = await supabase
        .from('workspaces')
        .select(
          `
          *,
          organization:organizations(id, name, slug),
          workspace_members(count),
          patients(count)
        `
        )
        .eq('id', workspaceId)
        .is('deleted_at', null)
        .single()

      if (error) {
        logger.error({ error, workspaceId }, 'Failed to fetch workspace')
        return NextResponse.json({ error: 'Failed to fetch workspace' }, { status: 500 })
      }

      // Get member count
      const { count: memberCount } = await supabase
        .from('workspace_members')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .eq('status', 'active')

      // Get patient count
      const { count: patientCount } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .is('deleted_at', null)

      return NextResponse.json({
        ...workspace,
        member_count: memberCount || 0,
        patient_count: patientCount || 0,
      })
    }

    // List all workspaces
    let query = supabase
      .from('workspaces')
      .select(
        `
        *,
        organization:organizations(id, name, slug)
      `,
        { count: 'exact' }
      )
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (organizationId) {
      query = query.eq('organization_id', organizationId)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (isActive !== null && isActive !== undefined) {
      query = query.eq('is_active', isActive === 'true')
    }

    const { data: workspaces, count, error } = await query

    if (error) {
      logger.error({ error }, 'Failed to fetch workspaces')
      return NextResponse.json({ error: 'Failed to fetch workspaces' }, { status: 500 })
    }

    // Get member and patient counts for each workspace
    if (workspaces && workspaces.length > 0) {
      const workspaceIds = workspaces.map((w) => w.id)

      // Get member counts
      const { data: memberCounts } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .in('workspace_id', workspaceIds)
        .eq('status', 'active')

      // Get patient counts
      const { data: patientCounts } = await supabase
        .from('patients')
        .select('workspace_id')
        .in('workspace_id', workspaceIds)
        .is('deleted_at', null)

      const memberCountMap = new Map<string, number>()
      const patientCountMap = new Map<string, number>()

      memberCounts?.forEach((m) => {
        memberCountMap.set(m.workspace_id, (memberCountMap.get(m.workspace_id) || 0) + 1)
      })

      patientCounts?.forEach((p) => {
        patientCountMap.set(p.workspace_id, (patientCountMap.get(p.workspace_id) || 0) + 1)
      })

      // Attach counts to workspaces
      workspaces.forEach((workspace) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(workspace as any).member_count = memberCountMap.get(workspace.id) || 0
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(workspace as any).patient_count = patientCountMap.get(workspace.id) || 0
      })
    }

    return NextResponse.json({
      workspaces: workspaces || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    logger.error({ error }, 'Admin workspaces API error')
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
    const {
      organization_id,
      name,
      slug,
      description,
      type,
      color,
      icon,
      settings,
      is_active,
    } = body

    if (!organization_id || !name || !slug) {
      return NextResponse.json(
        { error: 'organization_id, name, and slug are required' },
        { status: 400 }
      )
    }

    // Verify organization exists
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', organization_id)
      .is('deleted_at', null)
      .single()

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Check if slug already exists for this organization
    const { data: existing } = await supabase
      .from('workspaces')
      .select('id')
      .eq('organization_id', organization_id)
      .eq('slug', slug)
      .is('deleted_at', null)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Workspace with this slug already exists in this organization' },
        { status: 400 }
      )
    }

    // Create workspace
    const { data: workspace, error } = await supabase
      .from('workspaces')
      .insert({
        organization_id,
        name,
        slug,
        description: description || null,
        type: type || 'general',
        color: color || '#3b82f6',
        icon: icon || '🏥',
        settings: settings || {
          patient_limit: 50,
          require_approval_for_new_patients: false,
          enable_auto_analysis: true,
          enable_notifications: true,
        },
        is_active: is_active !== undefined ? is_active : true,
        created_by: authResult.user!.id,
      })
      .select()
      .single()

    if (error) {
      logger.error({ error, body }, 'Failed to create workspace')
      return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 })
    }

    logger.info({ workspaceId: workspace.id, name, createdBy: authResult.user!.id }, 'Workspace created by admin')

    return NextResponse.json(workspace, { status: 201 })
  } catch (error) {
    logger.error({ error }, 'Admin workspaces POST error')
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
    const { workspace_id, ...updates } = body

    if (!workspace_id) {
      return NextResponse.json({ error: 'workspace_id required' }, { status: 400 })
    }

    // If slug is being updated, check for conflicts
    if (updates.slug) {
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('organization_id')
        .eq('id', workspace_id)
        .single()

      if (workspace) {
        const { data: existing } = await supabase
          .from('workspaces')
          .select('id')
          .eq('organization_id', workspace.organization_id)
          .eq('slug', updates.slug)
          .neq('id', workspace_id)
          .is('deleted_at', null)
          .single()

        if (existing) {
          return NextResponse.json(
            { error: 'Workspace with this slug already exists in this organization' },
            { status: 400 }
          )
        }
      }
    }

    // Update workspace
    const { data, error } = await supabase
      .from('workspaces')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', workspace_id)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) {
      logger.error({ error, workspace_id, updates }, 'Failed to update workspace')
      return NextResponse.json({ error: 'Failed to update workspace' }, { status: 500 })
    }

    logger.info({ workspace_id, updates, updatedBy: authResult.user!.id }, 'Workspace updated by admin')

    return NextResponse.json(data)
  } catch (error) {
    logger.error({ error }, 'Admin workspaces PATCH error')
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
    const workspaceId = searchParams.get('workspace_id')

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspace_id required' }, { status: 400 })
    }

    // Soft delete workspace
    const { error } = await supabase
      .from('workspaces')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', workspaceId)

    if (error) {
      logger.error({ error, workspaceId }, 'Failed to delete workspace')
      return NextResponse.json({ error: 'Failed to delete workspace' }, { status: 500 })
    }

    logger.info({ workspaceId, deletedBy: authResult.user!.id }, 'Workspace deleted by admin')

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({ error }, 'Admin workspaces DELETE error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

