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
    const alertId = searchParams.get('alert_id')
    const patientId = searchParams.get('patient_id')
    const workspaceId = searchParams.get('workspace_id')
    const alertType = searchParams.get('alert_type')
    const severity = searchParams.get('severity')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Get single alert
    if (alertId) {
      const { data: alert, error } = await supabase
        .from('ai_alerts')
        .select(
          `
          *,
          patient:patients(id, name, workspace_id),
          workspace:workspaces(id, name, slug),
          acknowledged_by_user:profiles!ai_alerts_acknowledged_by_fkey(user_id, full_name),
          resolved_by_user:profiles!ai_alerts_resolved_by_fkey(user_id, full_name)
        `
        )
        .eq('id', alertId)
        .single()

      if (error) {
        logger.error({ error, alertId }, 'Failed to fetch alert')
        return NextResponse.json({ error: 'Failed to fetch alert' }, { status: 500 })
      }

      return NextResponse.json(alert)
    }

    // List all alerts
    let query = supabase
      .from('ai_alerts')
      .select(
        `
        *,
        patient:patients(id, name, workspace_id),
        workspace:workspaces(id, name, slug)
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (patientId) {
      query = query.eq('patient_id', patientId)
    }

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId)
    }

    if (alertType) {
      query = query.eq('alert_type', alertType)
    }

    if (severity) {
      query = query.eq('severity', severity)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: alerts, count, error } = await query

    if (error) {
      logger.error({ error }, 'Failed to fetch alerts')
      return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 })
    }

    // Get statistics
    const { count: totalAlerts } = await supabase
      .from('ai_alerts')
      .select('*', { count: 'exact', head: true })

    const { count: activeAlerts } = await supabase
      .from('ai_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    const { count: criticalAlerts } = await supabase
      .from('ai_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('severity', 'critical')
      .eq('status', 'active')

    const { count: resolvedAlerts } = await supabase
      .from('ai_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'resolved')

    // Get alerts by severity
    const { data: severityData } = await supabase
      .from('ai_alerts')
      .select('severity')
      .eq('status', 'active')

    const bySeverity: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    }

    severityData?.forEach((alert) => {
      if (alert.severity in bySeverity) {
        bySeverity[alert.severity]++
      }
    })

    return NextResponse.json({
      alerts: alerts || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      statistics: {
        total: totalAlerts || 0,
        active: activeAlerts || 0,
        critical: criticalAlerts || 0,
        resolved: resolvedAlerts || 0,
        by_severity: bySeverity,
      },
    })
  } catch (error) {
    logger.error({ error }, 'Admin AI alerts API error')
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
    const { alert_id, ...updates } = body

    if (!alert_id) {
      return NextResponse.json({ error: 'alert_id required' }, { status: 400 })
    }

    // Handle status changes
    if (updates.status === 'acknowledged' && !updates.acknowledged_at) {
      updates.acknowledged_by = authResult.user!.id
      updates.acknowledged_at = new Date().toISOString()
    }

    if (updates.status === 'resolved' && !updates.resolved_at) {
      updates.resolved_by = authResult.user!.id
      updates.resolved_at = new Date().toISOString()
    }

    if (updates.status === 'dismissed' && !updates.dismissed_at) {
      updates.dismissed_by = authResult.user!.id
      updates.dismissed_at = new Date().toISOString()
    }

    // Update alert
    const { data, error } = await supabase
      .from('ai_alerts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', alert_id)
      .select()
      .single()

    if (error) {
      logger.error({ error, alert_id, updates }, 'Failed to update alert')
      return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 })
    }

    logger.info({ alert_id, updates, updatedBy: authResult.user!.id }, 'Alert updated by admin')

    return NextResponse.json(data)
  } catch (error) {
    logger.error({ error }, 'Admin AI alerts PATCH error')
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
    const alertId = searchParams.get('alert_id')

    if (!alertId) {
      return NextResponse.json({ error: 'alert_id required' }, { status: 400 })
    }

    // Delete alert (hard delete for admin)
    const { error } = await supabase.from('ai_alerts').delete().eq('id', alertId)

    if (error) {
      logger.error({ error, alertId }, 'Failed to delete alert')
      return NextResponse.json({ error: 'Failed to delete alert' }, { status: 500 })
    }

    logger.info({ alertId, deletedBy: authResult.user!.id }, 'Alert deleted by admin')

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({ error }, 'Admin AI alerts DELETE error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

