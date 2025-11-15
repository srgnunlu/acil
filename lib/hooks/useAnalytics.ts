'use client'

import { useQuery } from '@tanstack/react-query'

interface WorkspaceAnalyticsData {
  overview: {
    patient_stats: {
      total_patients: number
      active_patients: number
      discharged_patients: number
      patients_last_7_days: number
      avg_length_of_stay_days: number
    }
    category_distribution: Array<{
      category_name: string
      category_color: string
      patient_count: number
    }>
    ai_usage: {
      total_ai_requests: number
      analyze_count: number
      chat_count: number
      vision_count: number
      total_cost: number
      avg_response_time_ms: number
    }
    team_summary: {
      total_members: number
      active_today: number
      avg_patients_per_doctor: number
    }
  }
  daily_metrics: Array<{
    metric_date: string
    patients_added: number
    patients_discharged: number
    ai_analyses: number
  }>
}

interface TeamAnalyticsData {
  team_performance: Array<{
    user_id: string
    user_name: string
    user_role: string
    patients_managed: number
    ai_analyses_count: number
    notes_created: number
    avg_response_time_hours: number
    documentation_score: number
    activity_score: number
  }>
  workload_distribution: Array<{
    category_name: string
    category_color: string
    patient_count: number
    assigned_doctors: number
    avg_patients_per_doctor: number
  }>
}

interface ClinicalAnalyticsData {
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

export function useWorkspaceAnalytics(workspaceId: string | null) {
  return useQuery({
    queryKey: ['analytics', 'workspace', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return null

      const res = await fetch(`/api/analytics/workspace?workspace_id=${workspaceId}`)
      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch workspace analytics')
      }

      return data.data as WorkspaceAnalyticsData
    },
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  })
}

export function useTeamAnalytics(workspaceId: string | null, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['analytics', 'team', workspaceId, startDate, endDate],
    queryFn: async () => {
      if (!workspaceId) return null

      let url = `/api/analytics/team?workspace_id=${workspaceId}`
      if (startDate) url += `&start_date=${startDate}`
      if (endDate) url += `&end_date=${endDate}`

      const res = await fetch(url)
      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch team analytics')
      }

      return data.data as TeamAnalyticsData
    },
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useClinicalAnalytics(workspaceId: string | null, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['analytics', 'clinical', workspaceId, startDate, endDate],
    queryFn: async () => {
      if (!workspaceId) return null

      let url = `/api/analytics/clinical?workspace_id=${workspaceId}`
      if (startDate) url += `&start_date=${startDate}`
      if (endDate) url += `&end_date=${endDate}`

      const res = await fetch(url)
      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch clinical analytics')
      }

      return data as ClinicalAnalyticsData
    },
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useAnalyticsExport() {
  const exportData = async (
    workspaceId: string,
    reportType: 'workspace_overview' | 'team_performance' | 'clinical_metrics',
    format: 'csv' | 'json' | 'excel',
    startDate?: string,
    endDate?: string
  ) => {
    const res = await fetch('/api/analytics/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspace_id: workspaceId,
        report_type: reportType,
        format,
        start_date: startDate,
        end_date: endDate,
      }),
    })

    if (format === 'csv') {
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${reportType}_${new Date().toISOString()}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } else {
      const data = await res.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${reportType}_${new Date().toISOString()}.json`
      a.click()
      window.URL.revokeObjectURL(url)
    }
  }

  return { exportData }
}
