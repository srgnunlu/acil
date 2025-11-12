/**
 * AI Monitoring Config API
 * Phase 7: GET/UPDATE monitoring configuration for patients
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { UpdateMonitoringConfigInput } from '@/types/ai-monitoring.types'

// ============================================
// GET: Fetch monitoring config
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

    // Get monitoring config
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
