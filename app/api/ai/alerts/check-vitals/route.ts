/**
 * Check critical vital signs and create alerts
 * Called automatically when vital signs are added
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createVitalSignAlert } from '@/lib/ai/alert-service'
import { checkVitalThresholds, DEFAULT_VITAL_THRESHOLDS } from '@/lib/ai/trend-analysis'

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
    const { patient_id, vital_signs } = body

    if (!patient_id || !vital_signs) {
      return NextResponse.json({ error: 'patient_id and vital_signs required' }, { status: 400 })
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

    const alertsCreated: string[] = []

    console.log('[Alert Check] Checking vital signs:', vital_signs)

    // Check each vital sign for critical values
    for (const [key, value] of Object.entries(vital_signs)) {
      if (typeof value === 'number') {
        console.log(`[Alert Check] Checking ${key}: ${value}`)
        const thresholdCheck = checkVitalThresholds(key, value, DEFAULT_VITAL_THRESHOLDS)
        console.log(`[Alert Check] Threshold check result for ${key}:`, thresholdCheck)

        if (thresholdCheck.is_critical) {
          console.log(`[Alert Check] Critical value detected for ${key}: ${value}`)
          // Determine threshold values
          let threshold: { critical_min?: number; critical_max?: number } = {}
          const metric = key.toLowerCase().replace(/[^a-z_]/g, '_')

          if (metric.includes('heart') || metric.includes('hr')) {
            threshold = {
              critical_min: DEFAULT_VITAL_THRESHOLDS.heart_rate.critical_min,
              critical_max: DEFAULT_VITAL_THRESHOLDS.heart_rate.critical_max,
            }
          } else if (metric.includes('temp')) {
            threshold = {
              critical_min: DEFAULT_VITAL_THRESHOLDS.temperature.critical_min,
              critical_max: DEFAULT_VITAL_THRESHOLDS.temperature.critical_max,
            }
          } else if (metric.includes('resp')) {
            threshold = {
              critical_min: DEFAULT_VITAL_THRESHOLDS.respiratory_rate.critical_min,
              critical_max: DEFAULT_VITAL_THRESHOLDS.respiratory_rate.critical_max,
            }
          } else if (metric.includes('systolic') || metric.includes('sbp')) {
            threshold = {
              critical_min: DEFAULT_VITAL_THRESHOLDS.systolic_bp.critical_min,
              critical_max: DEFAULT_VITAL_THRESHOLDS.systolic_bp.critical_max,
            }
          } else if (metric.includes('diastolic') || metric.includes('dbp')) {
            threshold = {
              critical_min: DEFAULT_VITAL_THRESHOLDS.diastolic_bp.critical_min,
              critical_max: DEFAULT_VITAL_THRESHOLDS.diastolic_bp.critical_max,
            }
          } else if (metric.includes('o2') || metric.includes('spo2') || metric.includes('sat')) {
            threshold = {
              critical_min: DEFAULT_VITAL_THRESHOLDS.oxygen_saturation.critical_min,
              critical_max: DEFAULT_VITAL_THRESHOLDS.oxygen_saturation.critical_max,
            }
          }

          // Create alert for critical value
          const alert = await createVitalSignAlert(
            supabase,
            patient_id,
            accessResult.workspaceId!,
            key,
            value,
            threshold,
            getUnitForKey(key)
          )

          if (alert) {
            alertsCreated.push(alert.id)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      alerts_created: alertsCreated.length,
      alert_ids: alertsCreated,
    })
  } catch (error: any) {
    console.error('Error checking vital signs:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

function getUnitForKey(key: string): string {
  const keyLower = key.toLowerCase()
  if (keyLower.includes('heart') || keyLower.includes('hr')) return 'bpm'
  if (keyLower.includes('temp')) return '°C'
  if (keyLower.includes('resp')) return '/min'
  if (keyLower.includes('pressure') || keyLower.includes('bp')) return 'mmHg'
  if (keyLower.includes('o2') || keyLower.includes('spo2') || keyLower.includes('sat')) return '%'
  return ''
}

