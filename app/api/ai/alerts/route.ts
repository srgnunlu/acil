/**
 * AI Alerts API
 * Phase 7: GET alerts, CREATE alerts
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import {
  getActiveAlertsForPatient,
  getActiveAlertsForWorkspace,
  createAlert,
  getAlertStatistics,
} from '@/lib/ai/alert-service'
import type { CreateAlertInput } from '@/types/ai-monitoring.types'

// ============================================
// GET: Fetch alerts
// ============================================
export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query params
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient_id')
    const workspaceId = searchParams.get('workspace_id')
    const statistics = searchParams.get('statistics') === 'true'
    const statusFilter = searchParams.get('status') // 'all', 'active', 'acknowledged', 'resolved', 'dismissed'

    // Get workspace access
    if (workspaceId) {
      // Check workspace access
      const { data: member } = await supabase
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (!member) {
        return NextResponse.json(
          { error: 'You do not have access to this workspace' },
          { status: 403 }
        )
      }

      // Return statistics if requested
      if (statistics) {
        const stats = await getAlertStatistics(supabase, workspaceId, 24)
        return NextResponse.json({ statistics: stats })
      }

      // Get alerts for workspace
      let query = supabase
        .from('ai_alerts')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('severity', { ascending: false })
        .order('created_at', { ascending: false })

      // Apply status filter
      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data: alerts, error } = await query

      if (error) {
        throw error
      }

      return NextResponse.json({
        alerts: alerts || [],
        total: alerts?.length || 0,
        has_critical: alerts?.some((a) => a.severity === 'critical') || false,
      })
    }

    // Get alerts for patient
    if (patientId) {
      // Verify patient access
      const { requirePatientWorkspaceAccess } = await import(
        '@/lib/permissions/workspace-helpers'
      )
      const accessResult = await requirePatientWorkspaceAccess(supabase, user.id, patientId)

      if (!accessResult.hasAccess) {
        return NextResponse.json(
          { error: 'You do not have access to this patient' },
          { status: 403 }
        )
      }

      // Build query for patient alerts
      let query = supabase
        .from('ai_alerts')
        .select('*')
        .eq('patient_id', patientId)
        .order('severity', { ascending: false })
        .order('created_at', { ascending: false })

      // Apply status filter
      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      } else if (!statusFilter || statusFilter === 'all') {
        // If no filter or 'all', get all alerts (not just active)
        // No additional filter needed
      } else {
        // Default to active if invalid filter
        query = query.eq('status', 'active')
      }

      const { data: alerts, error } = await query

      if (error) {
        throw error
      }

      return NextResponse.json({
        alerts: alerts || [],
        total: alerts?.length || 0,
        has_critical: alerts?.some((a) => a.severity === 'critical') || false,
      })
    }

    return NextResponse.json({ error: 'patient_id or workspace_id required' }, { status: 400 })
  } catch (error: unknown) {
    console.error('Error fetching alerts:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================
// POST: Create alert
// ============================================
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const input: CreateAlertInput = body

    // Validate required fields
    if (!input.patient_id || !input.workspace_id || !input.alert_type || !input.title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify workspace access
    const { data: member } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', input.workspace_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!member) {
      return NextResponse.json(
        { error: 'You do not have access to this workspace' },
        { status: 403 }
      )
    }

    // Verify patient exists and belongs to workspace
    const { data: patient } = await supabase
      .from('patients')
      .select('id, workspace_id')
      .eq('id', input.patient_id)
      .single()

    if (!patient || patient.workspace_id !== input.workspace_id) {
      return NextResponse.json({ error: 'Invalid patient or workspace' }, { status: 400 })
    }

    // Create alert
    const alert = await createAlert(supabase, input)

    if (!alert) {
      return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 })
    }

    return NextResponse.json({ success: true, alert }, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating alert:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
