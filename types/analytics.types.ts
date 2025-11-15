export interface WorkspaceAnalytics {
  workspace_id: string
  organization_id: string
  total_patients: number
  active_patients: number
  discharged_patients: number
  patients_last_7_days: number
  patients_last_30_days: number
  avg_length_of_stay_days: number
  last_patient_added: string | null
  refreshed_at: string
}

export interface CategoryStats {
  workspace_id: string
  category_id: string
  category_name: string
  category_slug: string
  category_color: string
  patient_count: number
  new_patients_7d: number
  refreshed_at: string
}

export interface TeamStats {
  workspace_id: string
  user_id: string
  user_name: string | null
  user_role: string
  patients_created: number
  patients_assigned: number
  sticky_notes_created: number
  ai_analyses_run: number
  last_activity: string | null
  refreshed_at: string
}

export interface AIUsageStats {
  workspace_id: string
  total_ai_requests: number
  analyze_count: number
  chat_count: number
  vision_count: number
  compare_count: number
  total_input_tokens: number
  total_output_tokens: number
  total_cost: number
  avg_response_time_ms: number
  error_count: number
  unique_patients_analyzed: number
  refreshed_at: string
}

export interface DailyMetrics {
  workspace_id: string
  metric_date: string
  patients_added: number
  patients_discharged: number
  ai_analyses: number
  sticky_notes_added: number
  refreshed_at: string
}

export interface SavedReport {
  id: string
  workspace_id: string
  name: string
  description: string | null
  report_type: 'workspace_overview' | 'team_performance' | 'clinical_metrics' | 'custom'
  config: Record<string, unknown>
  is_scheduled: boolean
  schedule_frequency: 'daily' | 'weekly' | 'monthly' | null
  schedule_day_of_week: number | null
  schedule_day_of_month: number | null
  schedule_time: string | null
  last_run_at: string | null
  next_run_at: string | null
  is_public: boolean
  shared_with: string[]
  created_by: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface ReportExecution {
  id: string
  report_id: string
  executed_by: string | null
  execution_type: 'manual' | 'scheduled'
  status: 'running' | 'completed' | 'failed'
  result_data: Record<string, unknown> | null
  error_message: string | null
  execution_time_ms: number | null
  exported_format: 'pdf' | 'excel' | 'csv' | null
  export_url: string | null
  created_at: string
  completed_at: string | null
}

export interface DashboardWidget {
  id: string
  workspace_id: string
  user_id: string
  widget_type:
    | 'patient_count'
    | 'category_chart'
    | 'ai_usage'
    | 'team_activity'
    | 'recent_alerts'
    | 'trends'
    | 'custom'
    | 'los_chart'
    | 'workload'
  title: string
  config: Record<string, unknown>
  position_x: number
  position_y: number
  width: number
  height: number
  is_visible: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface TeamPerformanceMetric {
  user_id: string
  user_name: string
  user_role: string
  patients_managed: number
  ai_analyses_count: number
  notes_created: number
  avg_response_time_hours: number
  documentation_score: number
  activity_score: number
}

export interface WorkloadDistribution {
  category_name: string
  category_color: string
  patient_count: number
  assigned_doctors: number
  avg_patients_per_doctor: number
}

export interface ClinicalMetrics {
  diagnosis_distribution: Array<{
    diagnosis: string
    count: number
  }>
  admission_trends: Array<{
    date: string
    count: number
  }>
  discharge_trends: Array<{
    date: string
    count: number
  }>
  avg_los_by_category: Array<{
    category: string
    avg_los_hours: number
  }>
  alert_statistics: {
    total_alerts: number
    critical_alerts: number
    high_alerts: number
    avg_resolution_time_hours: number
    alert_types: Array<{
      type: string
      count: number
    }>
  }
}

export type ExportFormat = 'csv' | 'json' | 'excel' | 'pdf'
export type ReportType = 'workspace_overview' | 'team_performance' | 'clinical_metrics' | 'custom'
