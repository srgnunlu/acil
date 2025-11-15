/**
 * AI Alert by ID API
 * Phase 7: UPDATE alert (acknowledge, resolve, dismiss)
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { acknowledgeAlert, resolveAlert, dismissAlert } from '@/lib/ai/alert-service'

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

// ============================================
// PATCH: Update alert status
// ============================================
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const alertId = params.id

    // Parse request body
    const body = await request.json()
    const { action, resolution_notes, dismissal_reason } = body

    // Validate action
    if (!['acknowledge', 'resolve', 'dismiss'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Get alert to verify access
    const { data: alert } = await supabase
      .from('ai_alerts')
      .select('workspace_id, patient_id')
      .eq('id', alertId)
      .single()

    if (!alert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
    }

    // Verify workspace access
    const { data: member } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', alert.workspace_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!member) {
      return NextResponse.json(
        { error: 'You do not have access to this alert' },
        { status: 403 }
      )
    }

    // Perform action
    let success = false

    if (action === 'acknowledge') {
      success = await acknowledgeAlert(supabase, alertId, user.id)
    } else if (action === 'resolve') {
      success = await resolveAlert(supabase, alertId, user.id, resolution_notes)
    } else if (action === 'dismiss') {
      success = await dismissAlert(supabase, alertId, user.id, dismissal_reason)
    }

    if (!success) {
      return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 })
    }

    // Get updated alert
    const { data: updatedAlert } = await supabase
      .from('ai_alerts')
      .select('*')
      .eq('id', alertId)
      .single()

    return NextResponse.json({ success: true, alert: updatedAlert })
  } catch (error: any) {
    console.error('Error updating alert:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// ============================================
// DELETE: Delete alert (admin only)
// ============================================
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const alertId = params.id

    // Get alert to verify access
    const { data: alert } = await supabase
      .from('ai_alerts')
      .select('workspace_id')
      .eq('id', alertId)
      .single()

    if (!alert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
    }

    // Verify admin access
    const { data: member } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', alert.workspace_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!member || !['owner', 'admin'].includes(member.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Delete alert
    const { error } = await supabase.from('ai_alerts').delete().eq('id', alertId)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting alert:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
