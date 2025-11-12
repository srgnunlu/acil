/**
 * AI Comparisons API
 * Phase 7: GET comparisons, CREATE new comparison
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import {
  compareAnalyses,
  getLatestComparison,
  getComparisonHistory,
  autoCompareLatestAnalyses,
} from '@/lib/ai/comparison-service'
import type { ComparisonType } from '@/types/ai-monitoring.types'

// ============================================
// GET: Fetch comparisons
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
    const latest = searchParams.get('latest') === 'true'
    const limit = parseInt(searchParams.get('limit') || '10')

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

    // Get latest comparison only
    if (latest) {
      const comparison = await getLatestComparison(supabase, patientId)
      return NextResponse.json({
        comparison,
        has_comparison: !!comparison,
      })
    }

    // Get comparison history
    const comparisons = await getComparisonHistory(supabase, patientId, limit)

    return NextResponse.json({
      comparisons,
      total: comparisons.length,
      latest_comparison: comparisons[0] || null,
    })
  } catch (error: any) {
    console.error('Error fetching comparisons:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// ============================================
// POST: Create new comparison
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
    const {
      patient_id,
      baseline_analysis_id,
      current_analysis_id,
      comparison_type = 'sequential',
      auto_compare,
    } = body

    // Validate
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

    let comparison

    // Auto-compare latest two analyses
    if (auto_compare) {
      comparison = await autoCompareLatestAnalyses(supabase, patient_id, accessResult.workspaceId!)

      if (!comparison) {
        return NextResponse.json(
          {
            error: 'Unable to auto-compare',
            message: 'At least 2 analyses required for comparison',
          },
          { status: 400 }
        )
      }
    } else {
      // Manual comparison with specified analysis IDs
      if (!baseline_analysis_id || !current_analysis_id) {
        return NextResponse.json(
          {
            error: 'baseline_analysis_id and current_analysis_id required for manual comparison',
          },
          { status: 400 }
        )
      }

      // Verify both analyses exist and belong to the patient
      const { data: analyses } = await supabase
        .from('ai_analyses')
        .select('id, patient_id')
        .in('id', [baseline_analysis_id, current_analysis_id])

      if (!analyses || analyses.length !== 2) {
        return NextResponse.json({ error: 'One or both analyses not found' }, { status: 404 })
      }

      if (analyses.some((a) => a.patient_id !== patient_id)) {
        return NextResponse.json({ error: 'Analyses do not belong to this patient' }, { status: 400 })
      }

      comparison = await compareAnalyses(
        supabase,
        patient_id,
        accessResult.workspaceId!,
        baseline_analysis_id,
        current_analysis_id,
        comparison_type as ComparisonType
      )

      if (!comparison) {
        return NextResponse.json({ error: 'Failed to create comparison' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, comparison }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating comparison:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
