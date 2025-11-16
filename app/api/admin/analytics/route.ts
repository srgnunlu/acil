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
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const workspaceId = searchParams.get('workspace_id')
    const organizationId = searchParams.get('organization_id')

    // Calculate date range
    const end = endDate ? new Date(endDate) : new Date()
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Default: last 30 days

    // Get overall statistics
    const [
      { count: totalUsers },
      { count: totalOrganizations },
      { count: totalWorkspaces },
      { count: totalPatients },
      { count: activeUsers },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null),
      supabase.from('workspaces').select('*', { count: 'exact', head: true }).is('deleted_at', null),
      supabase.from('patients').select('*', { count: 'exact', head: true }).is('deleted_at', null),
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', start.toISOString()),
    ])

    // Get activity trends (last 7 days)
    const activityTrends = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStart = new Date(date.setHours(0, 0, 0, 0)).toISOString()
      const dateEnd = new Date(date.setHours(23, 59, 59, 999)).toISOString()

      // Try activity_logs first, fallback to user_activity_log
      const { count: activities } = await supabase
        .from('activity_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', dateStart)
        .lte('created_at', dateEnd)

      const { count: newPatients } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', dateStart)
        .lte('created_at', dateEnd)
        .is('deleted_at', null)

      const { count: aiRequests } = await supabase
        .from('ai_usage_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', dateStart)
        .lte('created_at', dateEnd)
        .eq('success', true)

      activityTrends.push({
        date: date.toISOString().split('T')[0],
        activities: activities || 0,
        new_patients: newPatients || 0,
        ai_requests: aiRequests || 0,
      })
    }

    // Get user activity breakdown
    const { data: userActivity } = await supabase
      .from('activity_logs')
      .select('user_id, activity_type')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())

    const activityByType: Record<string, number> = {}
    userActivity?.forEach((activity) => {
      const type = activity.activity_type || 'unknown'
      activityByType[type] = (activityByType[type] || 0) + 1
    })

    // Get patient trends
    const patientTrends = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStart = new Date(date.setHours(0, 0, 0, 0)).toISOString()
      const dateEnd = new Date(date.setHours(23, 59, 59, 999)).toISOString()

      const { count: created } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', dateStart)
        .lte('created_at', dateEnd)
        .is('deleted_at', null)

      const { count: discharged } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .gte('discharge_date', dateStart)
        .lte('discharge_date', dateEnd)
        .is('deleted_at', null)

      patientTrends.push({
        date: date.toISOString().split('T')[0],
        created: created || 0,
        discharged: discharged || 0,
      })
    }

    // Get workspace statistics
    let workspaceQuery = supabase
      .from('workspaces')
      .select('id, name, organization_id')
      .is('deleted_at', null)

    if (organizationId) {
      workspaceQuery = workspaceQuery.eq('organization_id', organizationId)
    }

    if (workspaceId) {
      workspaceQuery = workspaceQuery.eq('id', workspaceId)
    }

    const { data: workspaces } = await workspaceQuery

    const workspaceStats = []
    if (workspaces) {
      for (const workspace of workspaces) {
        const { count: members } = await supabase
          .from('workspace_members')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', workspace.id)
          .eq('status', 'active')

        const { count: patients } = await supabase
          .from('patients')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', workspace.id)
          .is('deleted_at', null)

        workspaceStats.push({
          workspace_id: workspace.id,
          workspace_name: workspace.name,
          member_count: members || 0,
          patient_count: patients || 0,
        })
      }
    }

    // Get AI usage statistics
    const { data: aiLogs } = await supabase
      .from('ai_usage_logs')
      .select('model, operation, success, total_cost')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())

    const aiStats = {
      total_requests: aiLogs?.length || 0,
      successful_requests: aiLogs?.filter((log) => log.success).length || 0,
      total_cost: aiLogs?.reduce((sum, log) => sum + (log.total_cost || 0), 0) || 0,
      by_model: {} as Record<string, number>,
      by_operation: {} as Record<string, number>,
    }

    aiLogs?.forEach((log) => {
      const model = log.model || 'unknown'
      const operation = log.operation || 'unknown'
      aiStats.by_model[model] = (aiStats.by_model[model] || 0) + 1
      aiStats.by_operation[operation] = (aiStats.by_operation[operation] || 0) + 1
    })

    return NextResponse.json({
      summary: {
        total_users: totalUsers || 0,
        total_organizations: totalOrganizations || 0,
        total_workspaces: totalWorkspaces || 0,
        total_patients: totalPatients || 0,
        active_users: activeUsers || 0,
        date_range: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
      },
      trends: {
        activity: activityTrends,
        patients: patientTrends,
      },
      breakdown: {
        activity_by_type: activityByType,
        workspace_stats: workspaceStats,
        ai_usage: aiStats,
      },
    })
  } catch (error) {
    logger.error({ error }, 'Admin analytics API error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

