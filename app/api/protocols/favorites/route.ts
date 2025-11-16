import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/protocols/favorites
 * Get user's favorite protocols
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

    // Fetch user's favorites
    const { data: favorites, error } = await supabase
      .from('protocol_favorites')
      .select(
        `
        id,
        protocol_id,
        created_at,
        protocol:protocols(
          *,
          category:protocol_categories(
            id,
            name,
            color,
            icon
          )
        )
      `
      )
      .eq('user_id', user.id)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching favorites:', error)
      return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 })
    }

    return NextResponse.json({
      favorites: favorites || [],
      count: favorites?.length || 0,
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/protocols/favorites:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/protocols/favorites
 * Add a protocol to favorites
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
    const { protocol_id, workspace_id } = body

    if (!protocol_id || !workspace_id) {
      return NextResponse.json({ error: 'protocol_id and workspace_id are required' }, { status: 400 })
    }

    // Check workspace membership
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'You are not a member of this workspace' }, { status: 403 })
    }

    // Verify protocol exists and belongs to workspace
    const { data: protocol } = await supabase
      .from('protocols')
      .select('id')
      .eq('id', protocol_id)
      .eq('workspace_id', workspace_id)
      .single()

    if (!protocol) {
      return NextResponse.json({ error: 'Protocol not found' }, { status: 404 })
    }

    // Add to favorites
    const { data: favorite, error } = await supabase
      .from('protocol_favorites')
      .insert({
        protocol_id,
        user_id: user.id,
        workspace_id,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        // Already favorited
        return NextResponse.json({ error: 'Protocol already in favorites' }, { status: 409 })
      }
      console.error('Error adding favorite:', error)
      return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 })
    }

    return NextResponse.json(favorite, { status: 201 })
  } catch (error) {
    console.error('Unexpected error in POST /api/protocols/favorites:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/protocols/favorites
 * Remove a protocol from favorites
 */
export async function DELETE(request: NextRequest) {
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
    const protocolId = searchParams.get('protocol_id')

    if (!protocolId) {
      return NextResponse.json({ error: 'protocol_id is required' }, { status: 400 })
    }

    // Delete favorite
    const { error } = await supabase
      .from('protocol_favorites')
      .delete()
      .eq('protocol_id', protocolId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error removing favorite:', error)
      return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Favorite removed successfully' })
  } catch (error) {
    console.error('Unexpected error in DELETE /api/protocols/favorites:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
