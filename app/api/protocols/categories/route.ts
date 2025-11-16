import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { defineAbilityFor } from '@/lib/permissions/ability'
import type { ProtocolCategoryCreate } from '@/types/protocol.types'

/**
 * GET /api/protocols/categories
 * Get protocol categories for a workspace
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const workspaceId = searchParams.get('workspace_id')

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspace_id is required' }, { status: 400 })
    }

    // Check workspace membership
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'You are not a member of this workspace' }, { status: 403 })
    }

    // Fetch categories
    const { data: categories, error } = await supabase
      .from('protocol_categories')
      .select('*')
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching protocol categories:', error)
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }

    // Get protocol count for each category
    const categoryIds = categories?.map((c) => c.id) || []
    let protocolCounts: Record<string, number> = {}

    if (categoryIds.length > 0) {
      const { data: protocols } = await supabase
        .from('protocols')
        .select('category_id')
        .in('category_id', categoryIds)
        .eq('status', 'published')
        .eq('is_active', true)
        .is('deleted_at', null)

      protocolCounts = (protocols || []).reduce(
        (acc, p) => {
          if (p.category_id) {
            acc[p.category_id] = (acc[p.category_id] || 0) + 1
          }
          return acc
        },
        {} as Record<string, number>
      )
    }

    // Enrich categories with protocol counts
    const enrichedCategories = (categories || []).map((category) => ({
      ...category,
      protocol_count: protocolCounts[category.id] || 0,
    }))

    return NextResponse.json(enrichedCategories)
  } catch (error) {
    console.error('Unexpected error in GET /api/protocols/categories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/protocols/categories
 * Create a new protocol category
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { workspace_id, name, slug, description, color, icon, sort_order } = body as ProtocolCategoryCreate

    if (!workspace_id || !name) {
      return NextResponse.json({ error: 'workspace_id and name are required' }, { status: 400 })
    }

    // Check workspace membership and permissions
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role, permissions')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'You are not a member of this workspace' }, { status: 403 })
    }

    // Check permissions
    const ability = defineAbilityFor({
      role: membership.role,
      customPermissions: membership.permissions || [],
    })

    if (!ability.can('create', 'ProtocolCategory')) {
      return NextResponse.json({ error: 'Insufficient permissions to create categories' }, { status: 403 })
    }

    // Generate slug if not provided
    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

    // Insert category
    const { data: category, error } = await supabase
      .from('protocol_categories')
      .insert({
        workspace_id,
        name,
        slug: finalSlug,
        description,
        color: color || '#3b82f6',
        icon,
        sort_order: sort_order || 0,
        is_system: false,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A category with this slug already exists in this workspace' },
          { status: 409 }
        )
      }
      console.error('Error creating protocol category:', error)
      return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
    }

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Unexpected error in POST /api/protocols/categories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
