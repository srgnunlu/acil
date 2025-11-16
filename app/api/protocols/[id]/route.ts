import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { defineAbilityFor } from '@/lib/permissions/ability'
import type { ProtocolUpdate } from '@/types/protocol.types'

/**
 * GET /api/protocols/[id]
 * Get a specific protocol with details
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    const protocolId = params.id

    // Fetch protocol with category
    const { data: protocol, error } = await supabase
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
      `
      )
      .eq('id', protocolId)
      .is('deleted_at', null)
      .single()

    if (error || !protocol) {
      return NextResponse.json({ error: 'Protocol not found' }, { status: 404 })
    }

    // Check workspace membership
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', protocol.workspace_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'You are not a member of this workspace' }, { status: 403 })
    }

    // Fetch attachments
    const { data: attachments } = await supabase
      .from('protocol_attachments')
      .select('*')
      .eq('protocol_id', protocolId)
      .order('created_at', { ascending: false })

    // Fetch view count
    const { count: viewCount } = await supabase
      .from('protocol_views')
      .select('*', { count: 'exact', head: true })
      .eq('protocol_id', protocolId)

    // Fetch favorite count
    const { count: favoriteCount } = await supabase
      .from('protocol_favorites')
      .select('*', { count: 'exact', head: true })
      .eq('protocol_id', protocolId)

    // Check if user has favorited
    const { data: userFavorite } = await supabase
      .from('protocol_favorites')
      .select('id')
      .eq('protocol_id', protocolId)
      .eq('user_id', user.id)
      .single()

    // Fetch related protocols (same category)
    let relatedProtocols: any[] = []
    if (protocol.category_id) {
      const { data: related } = await supabase
        .from('protocols')
        .select('id, title, description, slug')
        .eq('workspace_id', protocol.workspace_id)
        .eq('category_id', protocol.category_id)
        .eq('status', 'published')
        .eq('is_active', true)
        .is('deleted_at', null)
        .neq('id', protocolId)
        .limit(5)

      relatedProtocols = related || []
    }

    // Record protocol view
    await supabase.from('protocol_views').insert({
      protocol_id: protocolId,
      user_id: user.id,
      workspace_id: protocol.workspace_id,
    })

    return NextResponse.json({
      protocol,
      attachments: attachments || [],
      is_favorited: !!userFavorite,
      view_count: viewCount || 0,
      favorite_count: favoriteCount || 0,
      related_protocols: relatedProtocols,
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/protocols/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/protocols/[id]
 * Update a protocol
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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

    const protocolId = params.id
    const updates = (await request.json()) as ProtocolUpdate

    // Fetch existing protocol
    const { data: existingProtocol, error: fetchError } = await supabase
      .from('protocols')
      .select('*, workspace_id, created_by, status')
      .eq('id', protocolId)
      .is('deleted_at', null)
      .single()

    if (fetchError || !existingProtocol) {
      return NextResponse.json({ error: 'Protocol not found' }, { status: 404 })
    }

    // Check workspace membership and permissions
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role, permissions')
      .eq('workspace_id', existingProtocol.workspace_id)
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

    // Admins can update any protocol, authors can update draft protocols
    const canUpdate =
      ability.can('update', 'Protocol') ||
      (existingProtocol.created_by === user.id && existingProtocol.status === 'draft')

    if (!canUpdate) {
      return NextResponse.json({ error: 'Insufficient permissions to update this protocol' }, { status: 403 })
    }

    // Update protocol
    const { data: protocol, error } = await supabase
      .from('protocols')
      .update({
        ...updates,
        updated_by: user.id,
        published_at: updates.status === 'published' ? new Date().toISOString() : existingProtocol.published_at,
      })
      .eq('id', protocolId)
      .select()
      .single()

    if (error) {
      console.error('Error updating protocol:', error)
      return NextResponse.json({ error: 'Failed to update protocol' }, { status: 500 })
    }

    return NextResponse.json(protocol)
  } catch (error) {
    console.error('Unexpected error in PATCH /api/protocols/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/protocols/[id]
 * Soft delete a protocol
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    const protocolId = params.id

    // Fetch existing protocol
    const { data: existingProtocol, error: fetchError } = await supabase
      .from('protocols')
      .select('workspace_id')
      .eq('id', protocolId)
      .is('deleted_at', null)
      .single()

    if (fetchError || !existingProtocol) {
      return NextResponse.json({ error: 'Protocol not found' }, { status: 404 })
    }

    // Check workspace membership and permissions
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role, permissions')
      .eq('workspace_id', existingProtocol.workspace_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'You are not a member of this workspace' }, { status: 403 })
    }

    // Check permissions (only admins can delete)
    const ability = defineAbilityFor({
      role: membership.role,
      customPermissions: membership.permissions || [],
    })

    if (!ability.can('delete', 'Protocol')) {
      return NextResponse.json({ error: 'Insufficient permissions to delete protocols' }, { status: 403 })
    }

    // Soft delete protocol
    const { error } = await supabase
      .from('protocols')
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq('id', protocolId)

    if (error) {
      console.error('Error deleting protocol:', error)
      return NextResponse.json({ error: 'Failed to delete protocol' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Protocol deleted successfully' })
  } catch (error) {
    console.error('Unexpected error in DELETE /api/protocols/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
