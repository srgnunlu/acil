/**
 * Auto-create missing trends for a patient
 * Called automatically when vital signs are added
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { extractTrendDataPoints } from '@/lib/ai/trend-analysis'

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

    const body = await request.json()
    const { patient_id, period_hours = 24, update_existing = false } = body

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

    // Get existing trends with their calculation times
    const { data: existingTrends } = await supabase
      .from('ai_trends')
      .select('metric_name, calculated_at')
      .eq('patient_id', patient_id)
      .gte('calculated_at', new Date(Date.now() - period_hours * 60 * 60 * 1000).toISOString())

    const existingMetrics = new Set(existingTrends?.map(t => t.metric_name) || [])
    const trendTimesByMetric = new Map(
      existingTrends?.map(t => [t.metric_name, new Date(t.calculated_at).getTime()]) || []
    )

    // Get latest vital signs timestamp to check if there's new data
    const { data: latestVitals } = await supabase
      .from('patient_data')
      .select('created_at')
      .eq('patient_id', patient_id)
      .eq('data_type', 'vital_signs')
      .is('deleted_at', null) // Only get non-deleted records
      .order('created_at', { ascending: false })
      .limit(1)

    const latestVitalTime = latestVitals && latestVitals.length > 0 && latestVitals[0]?.created_at
      ? new Date(latestVitals[0].created_at).getTime() 
      : 0

    // All available metrics
    const allMetrics = [
      'heartRate',
      'temperature',
      'respiratoryRate',
      'oxygenSaturation',
      'bloodPressureSystolic',
      'bloodPressureDiastolic',
      'painScore',
    ]

    // Find missing metrics or metrics that need updating
    const missingMetrics = allMetrics.filter(m => !existingMetrics.has(m))
    const metricsToUpdate = update_existing && latestVitalTime > 0
      ? allMetrics.filter(m => {
          const trendTime = trendTimesByMetric.get(m) || 0
          return latestVitalTime > trendTime
        })
      : []

    // Combine missing and metrics that need updating
    const metricsToProcess = [...new Set([...missingMetrics, ...metricsToUpdate])]

    if (metricsToProcess.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'All trends already exist and are up to date',
        created: 0 
      })
    }

    // Fetch patient information once for all trends
    const { data: patient } = await supabase
      .from('patients')
      .select('id, name, age, gender')
      .eq('id', patient_id)
      .single()

    // Build patient context for AI interpretation
    const patientContext = patient
      ? {
          demographics: {
            name: patient.name,
            age: patient.age,
            gender: patient.gender as 'Erkek' | 'Kadın' | 'Diğer' | null,
          },
        }
      : undefined

    // Create/update trends for metrics
    const created = []
    const updated = []
    const failed = []

    for (const metricName of metricsToProcess) {
      try {
        // Extract data points
        const dataPoints = await extractTrendDataPoints(
          supabase,
          patient_id,
          metricName,
          period_hours
        )

        // Need at least 2 data points
        if (dataPoints.length < 2) {
          continue // Skip if insufficient data
        }

        // Import trend analysis functions
        const {
          calculateStatistics,
          determineTrendDirection,
          generateTrendInterpretation,
        } = await import('@/lib/ai/trend-analysis')

        // Calculate statistics
        const stats = calculateStatistics(dataPoints)

        // Determine trend direction
        const trendDirection = determineTrendDirection(stats, dataPoints.length)

        // Generate AI interpretation with patient context
        const interpretation = await generateTrendInterpretation(
          'vital_signs',
          metricName,
          stats,
          trendDirection,
          dataPoints,
          patientContext
        )

        // Calculate period dates
        const periodEnd = new Date()
        const periodStart = new Date(periodEnd.getTime() - period_hours * 60 * 60 * 1000)

        const isUpdate = existingMetrics.has(metricName)
        
        // Check if existing trend needs update
        if (isUpdate) {
          // Update existing trend
          const { data: trend, error } = await supabase
            .from('ai_trends')
            .update({
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
              calculated_at: new Date().toISOString(),
            })
            .eq('patient_id', patient_id)
            .eq('metric_name', metricName)
            .select()
            .single()

          if (error) {
            failed.push({ metric: metricName, error: error.message })
          } else {
            updated.push(metricName)

            // Create alert if needed
            if (interpretation.should_alert) {
              const { createTrendAlert } = await import('@/lib/ai/alert-service')
              await createTrendAlert(supabase, patient_id, accessResult.workspaceId!, metricName, {
                direction: trendDirection,
                slope: stats.slope,
                mean: stats.mean,
                interpretation: interpretation.ai_interpretation,
              })
            }
          }
        } else {
          // Insert new trend
          const { data: trend, error } = await supabase
            .from('ai_trends')
            .insert({
              patient_id,
              workspace_id: accessResult.workspaceId,
              metric_type: 'vital_signs',
              metric_name: metricName,
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
            failed.push({ metric: metricName, error: error.message })
          } else {
            created.push(metricName)

            // Create alert if needed
            if (interpretation.should_alert) {
              const { createTrendAlert } = await import('@/lib/ai/alert-service')
              await createTrendAlert(supabase, patient_id, accessResult.workspaceId!, metricName, {
                direction: trendDirection,
                slope: stats.slope,
                mean: stats.mean,
                interpretation: interpretation.ai_interpretation,
              })
            }
          }
        }
      } catch (error: unknown) {
        failed.push({
          metric: metricName,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    return NextResponse.json({
      success: true,
      created: created.length,
      updated: updated.length,
      failed: failed.length,
      created_metrics: created,
      updated_metrics: updated,
      failed_metrics: failed,
    })
  } catch (error: unknown) {
    console.error('Error auto-creating trends:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

