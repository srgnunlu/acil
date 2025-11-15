/**
 * AI Monitoring Config API
 * Phase 7: GET/UPDATE monitoring configuration for patients
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { UpdateMonitoringConfigInput } from '@/types/ai-monitoring.types'
import { getActiveAlertsForPatient } from '@/lib/ai/alert-service'
import { getLatestComparison } from '@/lib/ai/comparison-service'

// ============================================
// GET: Fetch monitoring config or status
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
    const status = searchParams.get('status') === 'true'

    if (!patientId) {
      return NextResponse.json({ error: 'patient_id required' }, { status: 400 })
    }

    // Verify patient access
    const { requirePatientWorkspaceAccess } = await import('@/lib/permissions/workspace-helpers')
    const accessResult = await requirePatientWorkspaceAccess(supabase, user.id, patientId)

    if (!accessResult.hasAccess) {
      return NextResponse.json(
        { error: 'You do not have access to this patient' },
        { status: 403 }
      )
    }

    // If status=true, return full monitoring status
    if (status) {
      // Get monitoring config (or create default if doesn't exist)
      let { data: config } = await supabase
        .from('ai_monitoring_configs')
        .select('*')
        .eq('patient_id', patientId)
        .single()

      // If config doesn't exist, create a default one
      if (!config) {
        const { data: newConfig, error: createError } = await supabase
          .from('ai_monitoring_configs')
          .insert({
            patient_id: patientId,
            workspace_id: accessResult.workspaceId,
            created_by: user.id,
            is_active: false,
            auto_analysis_enabled: false,
            analysis_frequency_minutes: 60,
            trend_analysis_enabled: false,
            comparison_enabled: false,
          })
          .select()
          .single()

        if (createError && createError.code !== '23505') {
          console.error('Error creating default config:', createError)
        } else {
          config = newConfig
        }
      }

      // Get active alerts
      const activeAlerts = await getActiveAlertsForPatient(supabase, patientId)

      // Get recent trends (last 10)
      const { data: recentTrends } = await supabase
        .from('ai_trends')
        .select('*')
        .eq('patient_id', patientId)
        .order('calculated_at', { ascending: false })
        .limit(10)

      // Calculate deterioration score using database function
      const { data: scoreData, error: scoreError } = await supabase.rpc(
        'calculate_deterioration_score',
        { p_patient_id: patientId }
      )

      const deteriorationScore = scoreError ? 0 : (scoreData || 0)

      // Get last comparison
      const lastComparison = await getLatestComparison(supabase, patientId)

      return NextResponse.json({
        config: config || null,
        active_alerts: activeAlerts || [],
        recent_trends: recentTrends || [],
        deterioration_score: Number(deteriorationScore),
        last_comparison: lastComparison || undefined,
      })
    }

    // Otherwise, just return config
    const { data: config, error } = await supabase
      .from('ai_monitoring_configs')
      .select('*')
      .eq('patient_id', patientId)
      .single()

    if (error) {
      // Config might not exist yet - that's okay
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          config: null,
          message: 'Monitoring config not set up for this patient',
        })
      }
      throw error
    }

    return NextResponse.json({ config })
  } catch (error: any) {
    console.error('Error fetching monitoring config:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// ============================================
// PATCH: Update monitoring config
// ============================================
export async function PATCH(request: Request) {
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
    const { patient_id, ...updates }: UpdateMonitoringConfigInput & { patient_id: string } = body

    if (!patient_id) {
      return NextResponse.json({ error: 'patient_id required' }, { status: 400 })
    }

    // Verify patient access
    const { requirePatientWorkspaceAccess } = await import('@/lib/permissions/workspace-helpers')
    const accessResult = await requirePatientWorkspaceAccess(supabase, user.id, patient_id)

    if (!accessResult.hasAccess) {
      return NextResponse.json(
        { error: 'You do not have access to this patient' },
        { status: 403 }
      )
    }

    // Update monitoring config
    const { data: config, error } = await supabase
      .from('ai_monitoring_configs')
      .update(updates)
      .eq('patient_id', patient_id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, config })
  } catch (error: any) {
    console.error('Error updating monitoring config:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// ============================================
// POST: Create monitoring config
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
    const { patient_id, ...configData } = body

    if (!patient_id) {
      return NextResponse.json({ error: 'patient_id required' }, { status: 400 })
    }

    // Verify patient access
    const { requirePatientWorkspaceAccess } = await import('@/lib/permissions/workspace-helpers')
    const accessResult = await requirePatientWorkspaceAccess(supabase, user.id, patient_id)

    if (!accessResult.hasAccess) {
      return NextResponse.json(
        { error: 'You do not have access to this patient' },
        { status: 403 }
      )
    }

    // Create monitoring config
    const { data: config, error } = await supabase
      .from('ai_monitoring_configs')
      .insert({
        patient_id,
        workspace_id: accessResult.workspaceId,
        created_by: user.id,
        ...configData,
      })
      .select()
      .single()

    if (error) {
      // Handle duplicate
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Monitoring config already exists for this patient' },
          { status: 409 }
        )
      }
      throw error
    }

    return NextResponse.json({ success: true, config }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating monitoring config:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
