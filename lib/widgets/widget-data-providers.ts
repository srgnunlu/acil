/**
 * Widget Data Provider System
 *
 * Provides data to widgets based on their type and configuration
 */

import { WidgetType, WidgetInstance } from '@/types/widget.types'

export interface WidgetDataContext {
  workspaceId: string
  userId: string
  dateRange?: {
    from: Date
    to: Date
  }
  refreshInterval?: number
}

export interface WidgetDataProvider<T = any> {
  type: WidgetType
  fetchData: (
    instance: WidgetInstance,
    context: WidgetDataContext
  ) => Promise<T>
  transformData?: (raw: any) => T
  getCacheKey: (instance: WidgetInstance, context: WidgetDataContext) => string
  defaultRefreshInterval?: number // milliseconds
}

/**
 * Stats Widget Data Provider
 */
export const statsWidgetProvider: WidgetDataProvider<{
  activePatients: number
  criticalPatients: number
  avgStayDuration: number
  todayAdmissions: number
}> = {
  type: 'stats',
  fetchData: async (instance, context) => {
    const response = await fetch(
      `/api/dashboard?workspace_id=${context.workspaceId}`
    )
    const data = await response.json()
    return {
      activePatients: data.stats.activePatients,
      criticalPatients: data.stats.criticalPatients,
      avgStayDuration: data.stats.avgStayDuration,
      todayAdmissions: data.stats.todayPatients,
    }
  },
  getCacheKey: (instance, context) =>
    `stats-${context.workspaceId}`,
  defaultRefreshInterval: 60000, // 1 minute
}

/**
 * Patients Widget Data Provider
 */
export const patientsWidgetProvider: WidgetDataProvider<any[]> = {
  type: 'patients',
  fetchData: async (instance, context) => {
    const filter = instance.settings?.filter || 'all'
    const response = await fetch(
      `/api/patients?workspace_id=${context.workspaceId}&filter=${filter}`
    )
    const data = await response.json()
    return data
  },
  getCacheKey: (instance, context) =>
    `patients-${context.workspaceId}-${instance.settings?.filter || 'all'}`,
  defaultRefreshInterval: 30000, // 30 seconds
}

/**
 * Alerts Widget Data Provider
 */
export const alertsWidgetProvider: WidgetDataProvider<any[]> = {
  type: 'alerts',
  fetchData: async (instance, context) => {
    // Mock - replace with actual API call
    return [
      {
        id: '1',
        severity: 'critical',
        title: 'Kritik Vital Bulgu',
        message: 'Hastanın sistolik kan basıncı 180 mmHg',
        patientName: 'Test Hasta',
        timestamp: new Date().toISOString(),
      },
    ]
  },
  getCacheKey: (instance, context) =>
    `alerts-${context.workspaceId}`,
  defaultRefreshInterval: 15000, // 15 seconds
}

/**
 * Activity Widget Data Provider
 */
export const activityWidgetProvider: WidgetDataProvider<any[]> = {
  type: 'activity',
  fetchData: async (instance, context) => {
    // This would use the useActivityStream hook data
    // For now, return empty array
    return []
  },
  getCacheKey: (instance, context) =>
    `activity-${context.workspaceId}`,
  defaultRefreshInterval: 5000, // 5 seconds (real-time)
}

/**
 * AI Insights Widget Data Provider
 */
export const aiInsightsWidgetProvider: WidgetDataProvider<any[]> = {
  type: 'ai-insights',
  fetchData: async (instance, context) => {
    const response = await fetch(
      `/api/ai/insights?workspace_id=${context.workspaceId}`
    )
    const data = await response.json()
    return data.insights
  },
  getCacheKey: (instance, context) =>
    `ai-insights-${context.workspaceId}`,
  defaultRefreshInterval: 120000, // 2 minutes
}

/**
 * Charts Widget Data Provider
 */
export const chartsWidgetProvider: WidgetDataProvider<any> = {
  type: 'charts',
  fetchData: async (instance, context) => {
    const chartType = instance.settings?.chartType || 'line'
    const period = instance.settings?.period || '7d'

    const response = await fetch(
      `/api/dashboard?workspace_id=${context.workspaceId}`
    )
    const data = await response.json()

    return {
      type: chartType,
      data: data.trends,
    }
  },
  getCacheKey: (instance, context) =>
    `charts-${context.workspaceId}-${instance.settings?.chartType}-${instance.settings?.period}`,
  defaultRefreshInterval: 60000, // 1 minute
}

/**
 * Notes Widget Data Provider
 */
export const notesWidgetProvider: WidgetDataProvider<any[]> = {
  type: 'notes',
  fetchData: async (instance, context) => {
    const response = await fetch(
      `/api/sticky-notes?workspace_id=${context.workspaceId}`
    )
    const data = await response.json()
    return data
  },
  getCacheKey: (instance, context) =>
    `notes-${context.workspaceId}`,
  defaultRefreshInterval: 30000, // 30 seconds
}

/**
 * Quick Actions Widget Data Provider
 */
export const quickActionsWidgetProvider: WidgetDataProvider<any[]> = {
  type: 'quick-actions',
  fetchData: async (instance, context) => {
    // Return static quick actions
    return [
      { id: '1', label: 'Yeni Hasta Ekle', icon: '➕', link: '/dashboard/patients' },
      { id: '2', label: 'İstatistikler', icon: '📊', link: '/dashboard/analytics' },
      { id: '3', label: 'Protokoller', icon: '📚', link: '/dashboard/protocols' },
    ]
  },
  getCacheKey: (instance, context) =>
    `quick-actions-${context.workspaceId}`,
  defaultRefreshInterval: Infinity, // Static data
}

/**
 * Team Widget Data Provider
 */
export const teamWidgetProvider: WidgetDataProvider<any[]> = {
  type: 'team',
  fetchData: async (instance, context) => {
    const response = await fetch(
      `/api/workspaces/${context.workspaceId}/members`
    )
    const data = await response.json()
    return data
  },
  getCacheKey: (instance, context) =>
    `team-${context.workspaceId}`,
  defaultRefreshInterval: 30000, // 30 seconds
}

/**
 * Calendar Widget Data Provider
 */
export const calendarWidgetProvider: WidgetDataProvider<any[]> = {
  type: 'calendar',
  fetchData: async (instance, context) => {
    // Fetch reminders/appointments
    const response = await fetch(
      `/api/reminders?user_id=${context.userId}&workspace_id=${context.workspaceId}`
    )
    const data = await response.json()
    return data
  },
  getCacheKey: (instance, context) =>
    `calendar-${context.userId}-${context.workspaceId}`,
  defaultRefreshInterval: 60000, // 1 minute
}

/**
 * Widget Data Provider Registry
 */
export const WIDGET_DATA_PROVIDERS: Record<WidgetType, WidgetDataProvider> = {
  stats: statsWidgetProvider,
  patients: patientsWidgetProvider,
  alerts: alertsWidgetProvider,
  activity: activityWidgetProvider,
  'ai-insights': aiInsightsWidgetProvider,
  charts: chartsWidgetProvider,
  notes: notesWidgetProvider,
  'quick-actions': quickActionsWidgetProvider,
  team: teamWidgetProvider,
  calendar: calendarWidgetProvider,
}

/**
 * Get data provider for widget type
 */
export function getWidgetDataProvider(type: WidgetType): WidgetDataProvider | undefined {
  return WIDGET_DATA_PROVIDERS[type]
}

/**
 * Fetch widget data
 */
export async function fetchWidgetData(
  instance: WidgetInstance,
  context: WidgetDataContext
): Promise<any> {
  const provider = getWidgetDataProvider(instance.type)
  if (!provider) {
    throw new Error(`No data provider found for widget type: ${instance.type}`)
  }

  return provider.fetchData(instance, context)
}
