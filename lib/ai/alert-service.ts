/**
 * AI Alert Service
 * Phase 7: Manages AI-generated alerts and notifications
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  AIAlert,
  CreateAlertInput,
  UpdateAlertInput,
  AlertSeverity,
  AlertType,
} from '@/types/ai-monitoring.types'

// ============================================
// ALERT CREATION
// ============================================

/**
 * Create a new AI alert
 */
export async function createAlert(
  supabase: SupabaseClient,
  input: CreateAlertInput
): Promise<AIAlert | null> {
  try {
    const { data, error } = await supabase
      .from('ai_alerts')
      .insert({
        patient_id: input.patient_id,
        workspace_id: input.workspace_id,
        alert_type: input.alert_type,
        severity: input.severity,
        title: input.title,
        description: input.description,
        trigger_data: input.trigger_data || {},
        ai_reasoning: input.ai_reasoning,
        confidence_score: input.confidence_score,
        urgency_level: input.urgency_level || 5,
        requires_immediate_action: input.requires_immediate_action || false,
        status: 'active',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating alert:', error)
      return null
    }

    // Trigger notification
    if (data) {
      await triggerAlertNotification(supabase, data)
    }

    return data
  } catch (error) {
    console.error('Error in createAlert:', error)
    return null
  }
}

/**
 * Create alert from red flags in AI analysis
 */
export async function createAlertsFromRedFlags(
  supabase: SupabaseClient,
  patientId: string,
  workspaceId: string,
  analysisId: string,
  redFlags: string[],
  aiSummary?: string
): Promise<AIAlert[]> {
  const alerts: AIAlert[] = []

  for (const flag of redFlags) {
    const severity = classifyRedFlagSeverity(flag)

    const alert = await createAlert(supabase, {
      patient_id: patientId,
      workspace_id: workspaceId,
      alert_type: 'red_flag',
      severity,
      title: 'Critical Finding Detected',
      description: flag,
      trigger_data: {
        red_flag: flag,
        analysis_id: analysisId,
      },
      ai_reasoning: aiSummary,
      confidence_score: 0.85,
      requires_immediate_action: severity === 'critical',
    })

    if (alert) {
      alerts.push(alert)
    }
  }

  return alerts
}

/**
 * Create alert from critical vital signs
 */
export async function createVitalSignAlert(
  supabase: SupabaseClient,
  patientId: string,
  workspaceId: string,
  vitalName: string,
  value: number,
  threshold: { critical_min?: number; critical_max?: number },
  unit?: string
): Promise<AIAlert | null> {
  let description = ''
  let severity: AlertSeverity = 'high'

  if (threshold.critical_min && value < threshold.critical_min) {
    description = `${vitalName} critically low: ${value}${unit || ''} (threshold: ${threshold.critical_min}${unit || ''})`
    severity = 'critical'
  } else if (threshold.critical_max && value > threshold.critical_max) {
    description = `${vitalName} critically high: ${value}${unit || ''} (threshold: ${threshold.critical_max}${unit || ''})`
    severity = 'critical'
  }

  return createAlert(supabase, {
    patient_id: patientId,
    workspace_id: workspaceId,
    alert_type: 'critical_value',
    severity,
    title: `Critical ${vitalName}`,
    description,
    trigger_data: {
      vital_name: vitalName,
      value,
      threshold,
      unit,
    },
    requires_immediate_action: true,
    urgency_level: 9,
  })
}

/**
 * Create alert from deteriorating trend
 */
export async function createTrendAlert(
  supabase: SupabaseClient,
  patientId: string,
  workspaceId: string,
  metricName: string,
  trendData: {
    direction: string
    slope: number
    mean: number
    interpretation?: string
  }
): Promise<AIAlert | null> {
  const severity = classifyTrendSeverity(trendData.slope, trendData.direction)

  return createAlert(supabase, {
    patient_id: patientId,
    workspace_id: workspaceId,
    alert_type: 'trend_warning',
    severity,
    title: `Worsening Trend: ${metricName}`,
    description:
      trendData.interpretation ||
      `${metricName} showing ${trendData.direction} trend with slope ${trendData.slope.toFixed(2)}`,
    trigger_data: {
      metric_name: metricName,
      trend_direction: trendData.direction,
      slope: trendData.slope,
      mean: trendData.mean,
    },
    ai_reasoning: trendData.interpretation,
    confidence_score: 0.75,
    urgency_level: severity === 'critical' ? 8 : 6,
  })
}

// ============================================
// ALERT MANAGEMENT
// ============================================

/**
 * Acknowledge an alert
 */
export async function acknowledgeAlert(
  supabase: SupabaseClient,
  alertId: string,
  userId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('ai_alerts')
      .update({
        status: 'acknowledged',
        acknowledged_by: userId,
        acknowledged_at: new Date().toISOString(),
      })
      .eq('id', alertId)

    return !error
  } catch (error) {
    console.error('Error acknowledging alert:', error)
    return false
  }
}

/**
 * Resolve an alert
 */
export async function resolveAlert(
  supabase: SupabaseClient,
  alertId: string,
  userId: string,
  resolutionNotes?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('ai_alerts')
      .update({
        status: 'resolved',
        resolved_by: userId,
        resolved_at: new Date().toISOString(),
        resolution_notes: resolutionNotes,
      })
      .eq('id', alertId)

    return !error
  } catch (error) {
    console.error('Error resolving alert:', error)
    return false
  }
}

/**
 * Dismiss an alert
 */
export async function dismissAlert(
  supabase: SupabaseClient,
  alertId: string,
  userId: string,
  dismissalReason?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('ai_alerts')
      .update({
        status: 'dismissed',
        dismissed_by: userId,
        dismissed_at: new Date().toISOString(),
        dismissal_reason: dismissalReason,
      })
      .eq('id', alertId)

    return !error
  } catch (error) {
    console.error('Error dismissing alert:', error)
    return false
  }
}

/**
 * Get active alerts for a patient
 */
export async function getActiveAlertsForPatient(
  supabase: SupabaseClient,
  patientId: string
): Promise<AIAlert[]> {
  try {
    const { data, error } = await supabase
      .from('ai_alerts')
      .select('*')
      .eq('patient_id', patientId)
      .eq('status', 'active')
      .order('severity', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching alerts:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getActiveAlertsForPatient:', error)
    return []
  }
}

/**
 * Get active alerts for a workspace
 */
export async function getActiveAlertsForWorkspace(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<AIAlert[]> {
  try {
    const { data, error } = await supabase
      .from('ai_alerts')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('status', 'active')
      .order('severity', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching workspace alerts:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getActiveAlertsForWorkspace:', error)
    return []
  }
}

/**
 * Get critical alerts count for workspace
 */
export async function getCriticalAlertsCount(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('ai_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('status', 'active')
      .in('severity', ['critical', 'high'])

    if (error) {
      console.error('Error counting critical alerts:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('Error in getCriticalAlertsCount:', error)
    return 0
  }
}

// ============================================
// ALERT CLASSIFICATION
// ============================================

/**
 * Classify red flag severity
 */
function classifyRedFlagSeverity(redFlag: string): AlertSeverity {
  const flag = redFlag.toLowerCase()

  // Critical keywords
  const criticalKeywords = [
    'cardiac arrest',
    'respiratory arrest',
    'shock',
    'stroke',
    'myocardial infarction',
    'sepsis',
    'anaphylaxis',
    'intracranial',
    'hemodynamic',
    'life-threatening',
    'unstable',
  ]

  // High severity keywords
  const highKeywords = [
    'acute',
    'severe',
    'emergency',
    'urgent',
    'critical',
    'deteriorating',
    'abnormal',
    'elevated',
  ]

  if (criticalKeywords.some((keyword) => flag.includes(keyword))) {
    return 'critical'
  }

  if (highKeywords.some((keyword) => flag.includes(keyword))) {
    return 'high'
  }

  return 'medium'
}

/**
 * Classify trend severity based on slope and direction
 */
function classifyTrendSeverity(slope: number, direction: string): AlertSeverity {
  if (direction !== 'worsening') return 'low'

  const absSlope = Math.abs(slope)

  if (absSlope > 0.2) return 'critical' // >20% change per time unit
  if (absSlope > 0.1) return 'high' // >10% change per time unit
  if (absSlope > 0.05) return 'medium' // >5% change per time unit

  return 'low'
}

// ============================================
// NOTIFICATION TRIGGERING
// ============================================

/**
 * Trigger notification for an alert
 */
async function triggerAlertNotification(
  supabase: SupabaseClient,
  alert: AIAlert
): Promise<void> {
  try {
    // Get monitoring config to determine notification recipients
    const { data: config } = await supabase
      .from('ai_monitoring_configs')
      .select('notification_recipients, notify_on_critical')
      .eq('patient_id', alert.patient_id)
      .single()

    if (!config) return

    // Skip if notifications disabled for this type
    if (alert.severity === 'critical' && !config.notify_on_critical) {
      return
    }

    // Get patient info for notification
    const { data: patient } = await supabase
      .from('patients')
      .select('name, assigned_to')
      .eq('id', alert.patient_id)
      .single()

    if (!patient) return

    // Determine recipients
    const recipients: string[] = []

    // Always notify assigned doctor
    if (patient.assigned_to) {
      recipients.push(patient.assigned_to)
    }

    // Add configured recipients
    if (config.notification_recipients) {
      config.notification_recipients.forEach((recipient: { user_id: string }) => {
        if (!recipients.includes(recipient.user_id)) {
          recipients.push(recipient.user_id)
        }
      })
    }

    // Create notifications
    const notifications = recipients.map((userId) => ({
      user_id: userId,
      type: 'ai_alert',
      title: alert.title,
      message: alert.description,
      severity: alert.severity,
      related_patient_id: alert.patient_id,
      related_workspace_id: alert.workspace_id,
      data: {
        alert_id: alert.id,
        alert_type: alert.alert_type,
        patient_name: patient.name,
      },
    }))

    if (notifications.length > 0) {
      await supabase.from('notifications').insert(notifications)

      // Update alert notification status
      await supabase
        .from('ai_alerts')
        .update({
          notification_sent: true,
          notification_channels: ['push', 'in_app'],
        })
        .eq('id', alert.id)
    }
  } catch (error) {
    console.error('Error triggering alert notification:', error)
  }
}

// ============================================
// ALERT STATISTICS
// ============================================

/**
 * Get alert statistics for a workspace
 */
export async function getAlertStatistics(
  supabase: SupabaseClient,
  workspaceId: string,
  periodHours: number = 24
): Promise<{
  total: number
  by_severity: Record<AlertSeverity, number>
  by_type: Record<AlertType, number>
  by_status: Record<string, number>
  resolution_rate: number
}> {
  const periodStart = new Date(Date.now() - periodHours * 60 * 60 * 1000).toISOString()

  try {
    const { data: alerts, error } = await supabase
      .from('ai_alerts')
      .select('*')
      .eq('workspace_id', workspaceId)
      .gte('created_at', periodStart)

    if (error || !alerts) {
      return {
        total: 0,
        by_severity: { critical: 0, high: 0, medium: 0, low: 0 },
        by_type: {} as Record<AlertType, number>,
        by_status: {},
        resolution_rate: 0,
      }
    }

    const stats = {
      total: alerts.length,
      by_severity: { critical: 0, high: 0, medium: 0, low: 0 },
      by_type: {} as Record<string, number>,
      by_status: {} as Record<string, number>,
      resolution_rate: 0,
    }

    alerts.forEach((alert) => {
      // Count by severity
      stats.by_severity[alert.severity as AlertSeverity] =
        (stats.by_severity[alert.severity as AlertSeverity] || 0) + 1

      // Count by type
      stats.by_type[alert.alert_type] = (stats.by_type[alert.alert_type] || 0) + 1

      // Count by status
      stats.by_status[alert.status] = (stats.by_status[alert.status] || 0) + 1
    })

    // Calculate resolution rate
    const resolvedCount = stats.by_status['resolved'] || 0
    stats.resolution_rate = stats.total > 0 ? resolvedCount / stats.total : 0

    return stats
  } catch (error) {
    console.error('Error getting alert statistics:', error)
    return {
      total: 0,
      by_severity: { critical: 0, high: 0, medium: 0, low: 0 },
      by_type: {} as Record<AlertType, number>,
      by_status: {},
      resolution_rate: 0,
    }
  }
}
