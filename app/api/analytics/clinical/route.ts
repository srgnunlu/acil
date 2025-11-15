import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

/**
 * GET /api/analytics/clinical
 * Get clinical outcome metrics
 * Query params: workspace_id (required), start_date, end_date
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

    // Get params
    const searchParams = request.nextUrl.searchParams
    const workspaceId = searchParams.get('workspace_id')
    const startDate = searchParams.get('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const endDate = searchParams.get('end_date') || new Date().toISOString()

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

    // Call clinical metrics function
    const { data: clinicalMetrics, error: clinicalError } = await supabase.rpc('get_clinical_metrics', {
      p_workspace_id: workspaceId,
      p_start_date: startDate,
      p_end_date: endDate,
    })

    if (clinicalError) {
      logger.error({ error: clinicalError, workspaceId }, 'Failed to get clinical metrics')
      throw clinicalError
    }

    return NextResponse.json({
      success: true,
      data: {
        ...clinicalMetrics,
        period: {
          start: startDate,
          end: endDate,
        },
        generated_at: new Date().toISOString(),
      },
    })
  } catch (error: unknown) {
    const err = error as Error
    logger.error({ error: err }, 'Clinical analytics error')
    return NextResponse.json(
      { error: err.message || 'Failed to get clinical analytics' },
      { status: 500 }
    )
  }
}
