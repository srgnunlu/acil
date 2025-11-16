import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/protocols/search
 * Full-text search for protocols
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
    const query = searchParams.get('query')
    const categoryId = searchParams.get('category_id')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspace_id is required' }, { status: 400 })
    }

    if (!query) {
      return NextResponse.json({ error: 'query is required' }, { status: 400 })
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

    // Use the search_protocols function from database
    const { data: results, error } = await supabase.rpc('search_protocols', {
      p_workspace_id: workspaceId,
      p_search_query: query,
      p_category_id: categoryId,
      p_limit: limit,
    })

    if (error) {
      console.error('Error searching protocols:', error)
      return NextResponse.json({ error: 'Search failed' }, { status: 500 })
    }

    // Fetch full protocol details for results
    if (results && results.length > 0) {
      const protocolIds = results.map((r: any) => r.id)

      const { data: protocols } = await supabase
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
        .in('id', protocolIds)

      // Merge with rank scores
      const rankedProtocols = protocols?.map((p) => {
        const result = results.find((r: any) => r.id === p.id)
        return {
          ...p,
          rank: result?.rank || 0,
        }
      })

      // Sort by rank
      rankedProtocols?.sort((a, b) => b.rank - a.rank)

      return NextResponse.json({
        results: rankedProtocols || [],
        query,
        count: rankedProtocols?.length || 0,
      })
    }

    return NextResponse.json({
      results: [],
      query,
      count: 0,
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/protocols/search:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
