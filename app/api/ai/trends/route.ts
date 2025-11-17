/**
 * AI Trends API
 * Phase 7: GET trends, CALCULATE new trends
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import {
  calculateStatistics,
  determineTrendDirection,
  generateTrendInterpretation,
  extractTrendDataPoints,
} from '@/lib/ai/trend-analysis'
import type { MetricType, CalculateTrendInput } from '@/types/ai-monitoring.types'

// ============================================
// GET: Fetch trends
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
    const metricType = searchParams.get('metric_type') as MetricType | null
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

    // Build query
    let query = supabase
      .from('ai_trends')
      .select('*')
      .eq('patient_id', patientId)
      .order('calculated_at', { ascending: false })
      .limit(limit)

    if (metricType) {
      query = query.eq('metric_type', metricType)
    }

    const { data: trends, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({
      trends: trends || [],
      total: trends?.length || 0,
    })
  } catch (error: unknown) {
    console.error('Error fetching trends:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================
// POST: Calculate new trend
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
    let body: CalculateTrendInput
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }
    
    const { patient_id, metric_type, metric_name, period_hours = 24 } = body

    // Validate required fields
    if (!patient_id || !metric_type || !metric_name) {
      const missingFields = []
      if (!patient_id) missingFields.push('patient_id')
      if (!metric_type) missingFields.push('metric_type')
      if (!metric_name) missingFields.push('metric_name')
      
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          message: `Eksik alanlar: ${missingFields.join(', ')}`,
          missing_fields: missingFields,
          received: { 
            patient_id: patient_id || null, 
            metric_type: metric_type || null, 
            metric_name: metric_name || null 
          }
        }, 
        { status: 400 }
      )
    }

    // Validate metric_type is a valid MetricType
    const validMetricTypes: MetricType[] = ['vital_signs', 'lab_values', 'clinical_scores', 'overall_condition']
    if (!validMetricTypes.includes(metric_type as MetricType)) {
      return NextResponse.json(
        {
          error: 'Invalid metric_type',
          message: `metric_type geçersiz. Geçerli değerler: ${validMetricTypes.join(', ')}`,
          received: metric_type,
          valid_types: validMetricTypes
        },
        { status: 400 }
      )
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

    // Extract data points
    const dataPoints = await extractTrendDataPoints(supabase, patient_id, metric_name, period_hours)

    console.log(`[Trend API] Extracted ${dataPoints.length} data points for ${metric_name} (patient: ${patient_id}, period: ${period_hours}h)`)

    if (dataPoints.length < 2) {
      return NextResponse.json(
        {
          error: 'Insufficient data points for trend analysis',
          message: `Trend analizi için en az 2 veri noktası gereklidir. Son ${period_hours} saat içinde ${dataPoints.length} veri noktası bulundu. Lütfen önce hasta verilerine vital bulgular ekleyin.`,
          data_points_found: dataPoints.length,
          period_hours,
          metric_name,
        },
        { status: 400 }
      )
    }

    // Calculate statistics
    const stats = calculateStatistics(dataPoints)

    // Determine trend direction
    const trendDirection = determineTrendDirection(stats, dataPoints.length)

    // Fetch patient information for AI interpretation context
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id, name, age, gender')
      .eq('id', patient_id)
      .single()

    if (patientError) {
      console.error('[Trend API] Failed to fetch patient info:', patientError)
    }

    // Build comprehensive patient context for AI interpretation
    const patientContext = patient
      ? {
          demographics: {
            name: patient.name,
            age: patient.age,
            gender: patient.gender as 'Erkek' | 'Kadın' | 'Diğer' | null,
          },
        }
      : undefined

    // Log patient context for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('[Trend API] Patient context:', patientContext)
    }

    // Generate AI interpretation with patient context
    const interpretation = await generateTrendInterpretation(
      metric_type,
      metric_name,
      stats,
      trendDirection,
      dataPoints,
      patientContext
    )

    // Calculate period dates
    const periodEnd = new Date()
    const periodStart = new Date(periodEnd.getTime() - period_hours * 60 * 60 * 1000)

    // Save trend to database
    const { data: trend, error } = await supabase
      .from('ai_trends')
      .insert({
        patient_id,
        workspace_id: accessResult.workspaceId,
        metric_type,
        metric_name,
        data_points: dataPoints,
        trend_direction: trendDirection,
        trend_velocity: stats.slope,
        statistical_analysis: stats,
        ai_interpretation: interpretation.ai_interpretation,
        clinical_significance: interpretation.clinical_significance,
        alert_triggered: interpretation.should_alert,
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
        data_point_count: dataPoints.length,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // Create alert if needed
    if (interpretation.should_alert) {
      const { createTrendAlert } = await import('@/lib/ai/alert-service')
      await createTrendAlert(supabase, patient_id, accessResult.workspaceId!, metric_name, {
        direction: trendDirection,
        slope: stats.slope,
        mean: stats.mean,
        interpretation: interpretation.ai_interpretation,
      })
    }

    return NextResponse.json({ success: true, trend }, { status: 201 })
  } catch (error: unknown) {
    console.error('Error calculating trend:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
