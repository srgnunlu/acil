import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin/owner
    const { data: memberships } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .in('role', ['owner', 'admin'])

    if (!memberships || memberships.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const orgId = searchParams.get('org_id')

    // Get single organization
    if (orgId) {
      const { data: org, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .is('deleted_at', null)
        .single()

      if (error) {
        logger.error({ error, orgId }, 'Failed to fetch organization')
        return NextResponse.json({ error: 'Failed to fetch organization' }, { status: 500 })
      }

      // Get workspaces count
      const { count: workspaceCount } = await supabase
        .from('workspaces')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .is('deleted_at', null)

      // Get members count
      const { data: workspaces } = await supabase
        .from('workspaces')
        .select('id')
        .eq('organization_id', orgId)
        .is('deleted_at', null)

      let totalMembers = 0
      if (workspaces) {
        const { count } = await supabase
          .from('workspace_members')
          .select('*', { count: 'exact', head: true })
          .in(
            'workspace_id',
            workspaces.map((w) => w.id)
          )
          .eq('status', 'active')

        totalMembers = count || 0
      }

      return NextResponse.json({
        ...org,
        workspace_count: workspaceCount || 0,
        member_count: totalMembers,
      })
    }

    // List handled by page
    return NextResponse.json({ message: 'Use page for listing' })
  } catch (error) {
    logger.error({ error }, 'Admin organizations API error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin/owner
    const { data: memberships } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .in('role', ['owner', 'admin'])

    if (!memberships || memberships.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, slug, type, subscription_tier, max_users, max_workspaces, max_patients_per_workspace } = body

    if (!name || !slug) {
      return NextResponse.json({ error: 'name and slug are required' }, { status: 400 })
    }

    // Check if slug already exists
    const { data: existing } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .is('deleted_at', null)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 400 })
    }

    // Create organization
    const { data: org, error } = await supabase
      .from('organizations')
      .insert({
        name,
        slug,
        type: type || 'hospital',
        subscription_tier: subscription_tier || 'free',
        subscription_status: 'active',
        max_users: max_users || 50,
        max_workspaces: max_workspaces || 10,
        max_patients_per_workspace: max_patients_per_workspace || 100,
      })
      .select()
      .single()

    if (error) {
      logger.error({ error, body }, 'Failed to create organization')
      return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 })
    }

    logger.info({ orgId: org.id, name, createdBy: user.id }, 'Organization created by admin')

    return NextResponse.json(org, { status: 201 })
  } catch (error) {
    logger.error({ error }, 'Admin organizations POST error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin/owner
    const { data: memberships } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .in('role', ['owner', 'admin'])

    if (!memberships || memberships.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { org_id, ...updates } = body

    if (!org_id) {
      return NextResponse.json({ error: 'org_id required' }, { status: 400 })
    }

    // Update organization
    const { data, error } = await supabase
      .from('organizations')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', org_id)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) {
      logger.error({ error, org_id, updates }, 'Failed to update organization')
      return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 })
    }

    logger.info({ org_id, updates, updatedBy: user.id }, 'Organization updated by admin')

    return NextResponse.json(data)
  } catch (error) {
    logger.error({ error }, 'Admin organizations PATCH error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin/owner
    const { data: memberships } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .in('role', ['owner', 'admin'])

    if (!memberships || memberships.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const orgId = searchParams.get('org_id')

    if (!orgId) {
      return NextResponse.json({ error: 'org_id required' }, { status: 400 })
    }

    // Soft delete organization
    const { error } = await supabase
      .from('organizations')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', orgId)

    if (error) {
      logger.error({ error, orgId }, 'Failed to delete organization')
      return NextResponse.json({ error: 'Failed to delete organization' }, { status: 500 })
    }

    // Also soft delete related workspaces
    await supabase
      .from('workspaces')
      .update({ deleted_at: new Date().toISOString() })
      .eq('organization_id', orgId)

    logger.info({ orgId, deletedBy: user.id }, 'Organization deleted by admin')

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({ error }, 'Admin organizations DELETE error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
