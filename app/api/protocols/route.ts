import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { defineAbilityFor } from '@/lib/permissions/ability'
import type { ProtocolCreate } from '@/types/protocol.types'

/**
 * GET /api/protocols
 * Get protocols for a workspace with optional filtering
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
    const categoryId = searchParams.get('category_id')
    const statusParam = searchParams.get('status')
    const status = statusParam && statusParam !== 'all' ? statusParam : null
    const isFavorited = searchParams.get('is_favorited') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

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

    // Build query
    let query = supabase
      .from('protocols')
      .select(
        `
        *,
        category:protocol_categories(
          id,
          name,
          color,
          icon
        )
      `,
        { count: 'exact' }
      )
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)

    // Apply filters
    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    // Only show active protocols (unless filtering by status)
    if (!status || status === 'published') {
      query = query.eq('is_active', true)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    // Order by updated_at
    query = query.order('updated_at', { ascending: false })

    const { data: protocols, error, count } = await query

    if (error) {
      console.error('Error fetching protocols:', error)
      return NextResponse.json({ error: 'Failed to fetch protocols' }, { status: 500 })
    }

    // If favorites filter is enabled, fetch favorites
    let favoriteProtocolIds: string[] = []
    if (isFavorited) {
      const { data: favorites } = await supabase
        .from('protocol_favorites')
        .select('protocol_id')
        .eq('user_id', user.id)
        .eq('workspace_id', workspaceId)

      favoriteProtocolIds = favorites?.map((f) => f.protocol_id) || []
    }

    // Fetch view and favorite counts
    const protocolIds = protocols?.map((p) => p.id) || []

    let viewCounts: Record<string, number> = {}
    let favoriteCounts: Record<string, number> = {}
    let userFavorites: Set<string> = new Set()

    if (protocolIds.length > 0) {
      // View counts
      const { data: views } = await supabase
        .from('protocol_views')
        .select('protocol_id')
        .in('protocol_id', protocolIds)

      viewCounts = (views || []).reduce(
        (acc, v) => {
          acc[v.protocol_id] = (acc[v.protocol_id] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      )

      // Favorite counts
      const { data: favorites } = await supabase
        .from('protocol_favorites')
        .select('protocol_id, user_id')
        .in('protocol_id', protocolIds)

      favoriteCounts = (favorites || []).reduce(
        (acc, f) => {
          acc[f.protocol_id] = (acc[f.protocol_id] || 0) + 1
          if (f.user_id === user.id) {
            userFavorites.add(f.protocol_id)
          }
          return acc
        },
        {} as Record<string, number>
      )
    }

    // Enrich protocols with stats
    const enrichedProtocols = (protocols || []).map((protocol) => ({
      ...protocol,
      view_count: viewCounts[protocol.id] || 0,
      favorite_count: favoriteCounts[protocol.id] || 0,
      is_favorited: userFavorites.has(protocol.id),
    }))

    // Filter by favorites if requested
    const filteredProtocols = isFavorited
      ? enrichedProtocols.filter((p) => favoriteProtocolIds.includes(p.id))
      : enrichedProtocols

    return NextResponse.json({
      protocols: filteredProtocols,
      total: count || 0,
      page: Math.floor(offset / limit) + 1,
      limit,
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/protocols:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/protocols
 * Create a new protocol
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
    const {
      workspace_id,
      category_id,
      title,
      slug,
      description,
      content,
      content_type = 'markdown',
      tags = [],
      keywords = [],
      status = 'draft',
    } = body as ProtocolCreate

    if (!workspace_id || !title || !content) {
      return NextResponse.json(
        { error: 'workspace_id, title, and content are required' },
        { status: 400 }
      )
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

    if (!ability.can('create', 'Protocol')) {
      return NextResponse.json({ error: 'Insufficient permissions to create protocols' }, { status: 403 })
    }

    // Generate slug if not provided
    const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-')

    // Insert protocol
    const { data: protocol, error } = await supabase
      .from('protocols')
      .insert({
        workspace_id,
        category_id,
        title,
        slug: finalSlug,
        description,
        content,
        content_type,
        tags,
        keywords,
        status,
        version: '1.0',
        version_number: 1,
        created_by: user.id,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        // Unique constraint violation
        return NextResponse.json(
          { error: 'A protocol with this slug already exists in this workspace' },
          { status: 409 }
        )
      }
      console.error('Error creating protocol:', error)
      return NextResponse.json({ error: 'Failed to create protocol' }, { status: 500 })
    }

    return NextResponse.json(protocol, { status: 201 })
  } catch (error) {
    console.error('Unexpected error in POST /api/protocols:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
