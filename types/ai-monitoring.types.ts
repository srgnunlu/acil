/**
 * TypeScript types for Phase 7: AI Enhancement & Monitoring
 * AI alerts, trends, monitoring configs, comparisons
 */

// ============================================
// AI ALERTS
// ============================================

export type AlertType =
  | 'critical_value'
  | 'deterioration'
  | 'red_flag'
  | 'trend_warning'
  | 'sepsis_risk'
  | 'early_warning'
  | 'lab_critical'
  | 'vital_critical'

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low'

export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'dismissed'

export interface AIAlert {
  id: string
  patient_id: string
  workspace_id: string
  triggered_by_analysis_id?: string

  alert_type: AlertType
  severity: AlertSeverity
  title: string
  description: string

  trigger_data: Record<string, unknown>
  ai_reasoning?: string
  confidence_score?: number

  urgency_level: number // 1-10
  requires_immediate_action: boolean

  status: AlertStatus
  acknowledged_by?: string
  acknowledged_at?: string
  resolved_by?: string
  resolved_at?: string
  resolution_notes?: string
  dismissed_by?: string
  dismissed_at?: string
  dismissal_reason?: string

  notification_sent: boolean
  notification_channels: string[]

  created_at: string
  updated_at: string
  expires_at?: string
}

export interface CreateAlertInput {
  patient_id: string
  workspace_id: string
  alert_type: AlertType
  severity: AlertSeverity
  title: string
  description: string
  trigger_data?: Record<string, unknown>
  ai_reasoning?: string
  confidence_score?: number
  urgency_level?: number
  requires_immediate_action?: boolean
}

export interface UpdateAlertInput {
  status?: AlertStatus
  acknowledged_by?: string
  resolved_by?: string
  resolution_notes?: string
  dismissed_by?: string
  dismissal_reason?: string
}

// ============================================
// AI TRENDS
// ============================================

export type MetricType = 'vital_signs' | 'lab_values' | 'clinical_scores' | 'overall_condition'

export type TrendDirection = 'improving' | 'stable' | 'worsening' | 'fluctuating' | 'insufficient_data'

export interface TrendDataPoint {
  timestamp: string
  value: number
  unit?: string
  context?: Record<string, unknown>
}

export interface StatisticalAnalysis {
  mean: number
  std_dev: number
  min: number
  max: number
  slope: number
  r_squared?: number
  confidence_interval?: {
    lower: number
    upper: number
  }
}

export interface AITrend {
  id: string
  patient_id: string
  workspace_id: string

  metric_type: MetricType
  metric_name: string

  data_points: TrendDataPoint[]
  trend_direction: TrendDirection
  trend_velocity?: number

  statistical_analysis: StatisticalAnalysis

  ai_interpretation?: string
  clinical_significance?: string
  alert_triggered: boolean

  period_start: string
  period_end: string
  data_point_count: number

  calculated_at: string
  created_at: string
}

export interface CalculateTrendInput {
  patient_id: string
  metric_type: MetricType
  metric_name: string
  period_hours?: number // Default: 24
}

// ============================================
// AI MONITORING CONFIGS
// ============================================

export interface AlertThreshold {
  min?: number
  max?: number
  critical_min?: number
  critical_max?: number
  warning_min?: number
  warning_max?: number
}

export interface NotificationRecipient {
  user_id: string
  channels: ('push' | 'email' | 'sms')[]
}

export interface AIMonitoringConfig {
  id: string
  patient_id: string
  workspace_id: string

  auto_analysis_enabled: boolean
  analysis_frequency_minutes: number

  monitored_metrics: string[]

  alert_thresholds: Record<string, AlertThreshold>

  trend_analysis_enabled: boolean
  trend_window_hours: number

  comparison_enabled: boolean
  compare_with_baseline: boolean
  compare_with_previous: boolean

  notify_on_critical: boolean
  notify_on_deterioration: boolean
  notify_on_improvement: boolean

  notification_recipients: NotificationRecipient[]

  is_active: boolean

  last_analysis_at?: string
  last_alert_at?: string

  created_by?: string
  created_at: string
  updated_at: string
}

export interface UpdateMonitoringConfigInput {
  auto_analysis_enabled?: boolean
  analysis_frequency_minutes?: number
  monitored_metrics?: string[]
  alert_thresholds?: Record<string, AlertThreshold>
  trend_analysis_enabled?: boolean
  trend_window_hours?: number
  comparison_enabled?: boolean
  notify_on_critical?: boolean
  notify_on_deterioration?: boolean
  notify_on_improvement?: boolean
  notification_recipients?: NotificationRecipient[]
  is_active?: boolean
}

// ============================================
// AI MONITORING JOBS
// ============================================

export type MonitoringJobType =
  | 'auto_reanalysis'
  | 'trend_calculation'
  | 'periodic_check'
  | 'alert_generation'

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

export interface AIMonitoringJob {
  id: string
  job_type: MonitoringJobType
  patient_id?: string
  workspace_id?: string

  status: JobStatus
  priority: number

  scheduled_for: string
  started_at?: string
  completed_at?: string

  result_data: Record<string, unknown>
  error_message?: string
  retry_count: number
  max_retries: number

  created_at: string
  updated_at: string
}

export interface CreateMonitoringJobInput {
  job_type: MonitoringJobType
  patient_id?: string
  workspace_id?: string
  priority?: number
  scheduled_for?: string
}

// ============================================
// AI COMPARISONS
// ============================================

export type ComparisonType = 'baseline_vs_current' | 'sequential' | 'temporal'

export type OverallTrend = 'improving' | 'stable' | 'worsening' | 'mixed' | 'insufficient_data'

export interface ChangesDetected {
  improved: string[]
  worsened: string[]
  new_findings: string[]
  resolved: string[]
}

export interface AIComparison {
  id: string
  patient_id: string
  workspace_id: string

  baseline_analysis_id?: string
  current_analysis_id?: string

  comparison_type: ComparisonType
  changes_detected: ChangesDetected
  overall_trend: OverallTrend
  significance_score?: number

  ai_summary?: string
  clinical_implications?: string
  recommendations?: string[]

  time_interval_hours?: number

  compared_at: string
  created_at: string
}

export interface CreateComparisonInput {
  patient_id: string
  baseline_analysis_id: string
  current_analysis_id: string
  comparison_type?: ComparisonType
}

// ============================================
// CLINICAL SCORES
// ============================================

export type ScoreType =
  | 'sofa'
  | 'qsofa'
  | 'news'
  | 'news2'
  | 'apache_ii'
  | 'glasgow_coma_scale'
  | 'nihss'
  | 'mews'
  | 'sirs'
  | 'curb65'
  | 'chadsvasc'
  | 'hasbled'
  | 'wells_dvt'
  | 'wells_pe'
  | 'centor'

export type RiskCategory = 'low' | 'medium' | 'high' | 'very_high' | 'unknown'

export type CalculationMethod = 'manual' | 'auto' | 'ai_assisted'

export interface ClinicalScore {
  id: string
  patient_id: string
  workspace_id: string

  score_type: ScoreType
  score_value: number
  max_score?: number

  score_components: Record<string, number | string>

  interpretation?: string
  risk_category?: RiskCategory
  clinical_significance?: string

  calculated_by?: string
  calculation_method: CalculationMethod
  source_data: Record<string, unknown>

  measured_at: string
  created_at: string
}

export interface CalculateScoreInput {
  patient_id: string
  score_type: ScoreType
  score_components: Record<string, number | string>
  source_data?: Record<string, unknown>
  measured_at?: string
}

// ============================================
// DASHBOARD & AGGREGATED DATA
// ============================================

export interface PatientMonitoringDashboard {
  patient_id: string
  patient_name: string
  workspace_id: string

  active_alerts: number
  critical_alerts: number

  last_analysis_at?: string
  auto_analysis_enabled: boolean
  last_auto_analysis?: string

  deterioration_score: number
}

export interface WorkspaceMonitoringSummary {
  workspace_id: string
  total_patients: number
  monitored_patients: number

  total_active_alerts: number
  critical_alerts: number
  high_alerts: number

  patients_with_worsening_trends: number
  patients_requiring_attention: number

  last_updated: string
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface AlertsResponse {
  alerts: AIAlert[]
  total: number
  has_critical: boolean
}

export interface TrendsResponse {
  trends: AITrend[]
  total: number
}

export interface ComparisonsResponse {
  comparisons: AIComparison[]
  latest_comparison?: AIComparison
}

export interface MonitoringStatusResponse {
  config: AIMonitoringConfig | null
  active_alerts: AIAlert[]
  recent_trends: AITrend[]
  deterioration_score: number
  last_comparison?: AIComparison
}

// ============================================
// HELPER TYPES
// ============================================

export interface TrendVisualizationData {
  metric_name: string
  data_points: Array<{
    x: string // timestamp
    y: number // value
    label?: string
  }>
  trend_line?: Array<{
    x: string
    y: number
  }>
  thresholds?: {
    critical_max?: number
    critical_min?: number
    warning_max?: number
    warning_min?: number
  }
}

export interface AlertSummary {
  total: number
  by_severity: Record<AlertSeverity, number>
  by_status: Record<AlertStatus, number>
  most_recent?: AIAlert
}
