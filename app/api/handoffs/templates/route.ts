/**
 * Handoff Templates API Route
 * GET /api/handoffs/templates - List templates
 * POST /api/handoffs/templates - Create template
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import type { CreateHandoffTemplatePayload } from '@/types/handoff.types'

// =====================================================
// GET /api/handoffs/templates - List templates
// =====================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const workspace_id = searchParams.get('workspace_id')
    const is_default = searchParams.get('is_default')
    const is_system = searchParams.get('is_system')

    if (!workspace_id) {
      return NextResponse.json({ error: 'workspace_id is required' }, { status: 400 })
    }

    // 3. Check workspace access
    // Organization'a üye olan kullanıcılar workspace'leri görebilir
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('organization_id')
      .eq('id', workspace_id)
      .is('deleted_at', null)
      .single()

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Check if user is a member of the workspace's organization
    const { data: orgMembership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', workspace.organization_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    // Also check workspace_members for backward compatibility
    const { data: workspaceMembership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!orgMembership && !workspaceMembership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 4. Build query
    let query = supabase
      .from('handoff_templates')
      .select(
        `
        *,
        workspace:workspaces(id, name)
      `
      )
      .eq('workspace_id', workspace_id)
      .is('deleted_at', null)

    if (is_default !== null) {
      query = query.eq('is_default', is_default === 'true')
    }

    if (is_system !== null) {
      query = query.eq('is_system', is_system === 'true')
    }

    query = query.order('is_default', { ascending: false })
    query = query.order('is_system', { ascending: false })
    query = query.order('name', { ascending: true })

    const { data: templates, error: fetchError } = await query

    if (fetchError) {
      logger.error({ error: fetchError }, 'Failed to fetch templates')
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
    }

    // Fetch profiles for created_by
    if (templates && templates.length > 0) {
      const userIds = new Set<string>()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      templates.forEach((t: any) => {
        if (t.created_by) userIds.add(t.created_by)
      })

      if (userIds.size > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', Array.from(userIds))

        const profilesMap = new Map(profiles?.map((p) => [p.user_id, p]) || [])

        // Attach profiles to templates
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        templates.forEach((t: any) => {
          t.created_by_user = t.created_by ? profilesMap.get(t.created_by) || null : null
        })
      }
    }

    return NextResponse.json(templates)
  } catch (error) {
    logger.error({ error }, 'Unexpected error in GET /api/handoffs/templates')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// =====================================================
// POST /api/handoffs/templates - Create template
// =====================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse request body
    const body: CreateHandoffTemplatePayload = await request.json()

    const { workspace_id, name, description, sections, is_default } = body

    if (!workspace_id || !name || !sections) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 3. Check workspace access (only admins can create templates)
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('organization_id')
      .eq('id', workspace_id)
      .is('deleted_at', null)
      .single()

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Check if user is a member of the workspace's organization
    const { data: orgMembership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', workspace.organization_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    // Also check workspace_members for backward compatibility
    const { data: workspaceMembership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!orgMembership && !workspaceMembership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const membership = orgMembership || workspaceMembership
    const isAdmin = membership && ['owner', 'admin', 'senior_doctor'].includes(membership.role)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Only admins can create templates' }, { status: 403 })
    }

    // 4. If setting as default, unset other defaults
    if (is_default) {
      await supabase
        .from('handoff_templates')
        .update({ is_default: false })
        .eq('workspace_id', workspace_id)
        .eq('is_default', true)
    }

    // 5. Create template
    const { data: template, error: createError } = await supabase
      .from('handoff_templates')
      .insert({
        workspace_id,
        name,
        description,
        sections,
        is_default: is_default || false,
        is_system: false,
        created_by: user.id,
      })
      .select()
      .single()

    if (createError) {
      logger.error({ error: createError }, 'Failed to create template')
      return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
    }

    logger.info({ userId: user.id, templateId: template.id }, 'Template created successfully')

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    logger.error({ error }, 'Unexpected error in POST /api/handoffs/templates')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
