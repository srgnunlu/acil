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
    const protocolId = searchParams.get('protocol_id')
    const workspaceId = searchParams.get('workspace_id')
    const organizationId = searchParams.get('organization_id')
    const categoryId = searchParams.get('category_id')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Get single protocol
    if (protocolId) {
      const { data: protocol, error } = await supabase
        .from('protocols')
        .select(
          `
          *,
          category:protocol_categories(id, name, color, icon),
          workspace:workspaces(id, name, slug),
          organization:organizations(id, name, slug)
        `
        )
        .eq('id', protocolId)
        .is('deleted_at', null)
        .single()

      if (error) {
        logger.error({ error, protocolId }, 'Failed to fetch protocol')
        return NextResponse.json({ error: 'Failed to fetch protocol' }, { status: 500 })
      }

      return NextResponse.json(protocol)
    }

    // List all protocols
    let query = supabase
      .from('protocols')
      .select(
        `
        *,
        category:protocol_categories(id, name, color, icon),
        workspace:workspaces(id, name, slug),
        organization:organizations(id, name, slug)
      `,
        { count: 'exact' }
      )
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId)
    }

    if (organizationId) {
      // Get workspace IDs for this organization
      const { data: workspaces } = await supabase
        .from('workspaces')
        .select('id')
        .eq('organization_id', organizationId)
        .is('deleted_at', null)

      if (workspaces && workspaces.length > 0) {
        const workspaceIds = workspaces.map((w) => w.id)
        query = query.in('workspace_id', workspaceIds)
      } else {
        return NextResponse.json({
          protocols: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        })
      }
    }

    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data: protocols, count, error } = await query

    if (error) {
      logger.error({ error }, 'Failed to fetch protocols')
      return NextResponse.json({ error: 'Failed to fetch protocols' }, { status: 500 })
    }

    // Get statistics
    const { count: totalProtocols } = await supabase
      .from('protocols')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)

    const { count: publishedProtocols } = await supabase
      .from('protocols')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)
      .eq('status', 'published')
      .eq('is_active', true)

    const { count: draftProtocols } = await supabase
      .from('protocols')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)
      .eq('status', 'draft')

    return NextResponse.json({
      protocols: protocols || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      statistics: {
        total: totalProtocols || 0,
        published: publishedProtocols || 0,
        draft: draftProtocols || 0,
      },
    })
  } catch (error) {
    logger.error({ error }, 'Admin protocols API error')
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
      workspace_id,
      category_id,
      title,
      description,
      content,
      status,
      is_active,
      is_favorited,
    } = body

    if (!workspace_id || !title) {
      return NextResponse.json({ error: 'workspace_id and title are required' }, { status: 400 })
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

    // Create protocol
    const { data: protocol, error } = await supabase
      .from('protocols')
      .insert({
        workspace_id,
        category_id: category_id || null,
        title,
        description: description || null,
        content: content || null,
        status: status || 'draft',
        is_active: is_active !== undefined ? is_active : true,
        is_favorited: is_favorited || false,
      })
      .select()
      .single()

    if (error) {
      logger.error({ error, body }, 'Failed to create protocol')
      return NextResponse.json({ error: 'Failed to create protocol' }, { status: 500 })
    }

    logger.info({ protocolId: protocol.id, title, createdBy: authResult.user!.id }, 'Protocol created by admin')

    return NextResponse.json(protocol, { status: 201 })
  } catch (error) {
    logger.error({ error }, 'Admin protocols POST error')
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
    const { protocol_id, ...updates } = body

    if (!protocol_id) {
      return NextResponse.json({ error: 'protocol_id required' }, { status: 400 })
    }

    // Update protocol
    const { data, error } = await supabase
      .from('protocols')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', protocol_id)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) {
      logger.error({ error, protocol_id, updates }, 'Failed to update protocol')
      return NextResponse.json({ error: 'Failed to update protocol' }, { status: 500 })
    }

    logger.info({ protocol_id, updates, updatedBy: authResult.user!.id }, 'Protocol updated by admin')

    return NextResponse.json(data)
  } catch (error) {
    logger.error({ error }, 'Admin protocols PATCH error')
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
    const protocolId = searchParams.get('protocol_id')

    if (!protocolId) {
      return NextResponse.json({ error: 'protocol_id required' }, { status: 400 })
    }

    // Soft delete protocol
    const { error } = await supabase
      .from('protocols')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', protocolId)

    if (error) {
      logger.error({ error, protocolId }, 'Failed to delete protocol')
      return NextResponse.json({ error: 'Failed to delete protocol' }, { status: 500 })
    }

    logger.info({ protocolId, deletedBy: authResult.user!.id }, 'Protocol deleted by admin')

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({ error }, 'Admin protocols DELETE error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

