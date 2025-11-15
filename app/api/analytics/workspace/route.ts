import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

/**
 * GET /api/analytics/workspace
 * Get comprehensive workspace analytics
 * Query params: workspace_id (required)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get workspace_id from query
    const searchParams = request.nextUrl.searchParams
    const workspaceId = searchParams.get('workspace_id')

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspace_id is required' }, { status: 400 })
    }

    // Verify workspace membership
    const { data: membership, error: membershipError } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Access denied to this workspace' }, { status: 403 })
    }

    // Call the get_workspace_overview function
    const { data: overview, error: overviewError } = await supabase.rpc('get_workspace_overview', {
      p_workspace_id: workspaceId,
    })

    if (overviewError) {
      logger.error({ error: overviewError, workspaceId }, 'Failed to get workspace overview')
      throw overviewError
    }

    // Get recent activity (last 7 days)
    const { data: dailyMetrics, error: metricsError } = await supabase
      .from('workspace_daily_metrics')
      .select('*')
      .eq('workspace_id', workspaceId)
      .gte('metric_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('metric_date', { ascending: true })

    if (metricsError) {
      logger.error({ error: metricsError, workspaceId }, 'Failed to get daily metrics')
    }

    return NextResponse.json({
      success: true,
      data: {
        overview,
        daily_metrics: dailyMetrics || [],
        generated_at: new Date().toISOString(),
      },
    })
  } catch (error: unknown) {
    const err = error as Error
    logger.error({ error: err }, 'Workspace analytics error')
    return NextResponse.json(
      { error: err.message || 'Failed to get workspace analytics' },
      { status: 500 }
    )
  }
}
