/**
 * Dashboard Templates
 *
 * Pre-built dashboard layouts for different use cases
 */

import { DashboardLayout, WidgetInstance } from '@/types/widget.types'

/**
 * Create widget instance helper
 */
function createWidget(
  type: WidgetInstance['type'],
  x: number,
  y: number,
  w: number,
  h: number,
  settings?: Record<string, any>
): WidgetInstance {
  const id = crypto.randomUUID()
  return {
    id,
    type,
    layout: {
      i: id,
      x,
      y,
      w,
      h,
    },
    settings,
  }
}

/**
 * Executive Dashboard Template
 * High-level overview with key metrics
 */
export const EXECUTIVE_TEMPLATE: Omit<DashboardLayout, 'createdAt' | 'updatedAt'> = {
  id: 'executive',
  name: 'Yönetici Dashboard',
  description: 'Üst düzey yöneticiler için özet görünüm',
  widgets: [
    createWidget('ai-insights', 0, 0, 12, 2),
    createWidget('stats', 0, 2, 12, 2),
    createWidget('charts', 0, 4, 6, 3),
    createWidget('activity', 6, 4, 6, 3),
  ],
}

/**
 * Clinical Dashboard Template
 * For doctors and medical staff
 */
export const CLINICAL_TEMPLATE: Omit<DashboardLayout, 'createdAt' | 'updatedAt'> = {
  id: 'clinical',
  name: 'Klinik Dashboard',
  description: 'Doktorlar ve sağlık personeli için',
  widgets: [
    createWidget('alerts', 0, 0, 6, 3),
    createWidget('patients', 6, 0, 6, 4),
    createWidget('stats', 0, 3, 6, 2),
    createWidget('quick-actions', 0, 5, 3, 2),
    createWidget('notes', 3, 5, 3, 2),
    createWidget('calendar', 6, 4, 6, 3),
  ],
}

/**
 * Analytics Dashboard Template
 * For data analysis and reporting
 */
export const ANALYTICS_TEMPLATE: Omit<DashboardLayout, 'createdAt' | 'updatedAt'> = {
  id: 'analytics',
  name: 'Analitik Dashboard',
  description: 'Veri analizi ve raporlama',
  widgets: [
    createWidget('stats', 0, 0, 12, 2),
    createWidget('charts', 0, 2, 6, 4, { chartType: 'line', period: '30d' }),
    createWidget('charts', 6, 2, 6, 4, { chartType: 'pie', period: '30d' }),
    createWidget('activity', 0, 6, 12, 3),
  ],
}

/**
 * Emergency Dashboard Template
 * For emergency departments with critical alerts
 */
export const EMERGENCY_TEMPLATE: Omit<DashboardLayout, 'createdAt' | 'updatedAt'> = {
  id: 'emergency',
  name: 'Acil Servis Dashboard',
  description: 'Acil servis için kritik uyarı odaklı',
  widgets: [
    createWidget('alerts', 0, 0, 12, 3),
    createWidget('patients', 0, 3, 8, 4, { filter: 'critical' }),
    createWidget('stats', 8, 3, 4, 2),
    createWidget('quick-actions', 8, 5, 4, 2),
  ],
}

/**
 * Collaborative Dashboard Template
 * For team collaboration
 */
export const COLLABORATIVE_TEMPLATE: Omit<DashboardLayout, 'createdAt' | 'updatedAt'> = {
  id: 'collaborative',
  name: 'İşbirliği Dashboard',
  description: 'Ekip çalışması için',
  widgets: [
    createWidget('team', 0, 0, 4, 3),
    createWidget('activity', 4, 0, 8, 3),
    createWidget('notes', 0, 3, 6, 4),
    createWidget('patients', 6, 3, 6, 4),
  ],
}

/**
 * Minimal Dashboard Template
 * Clean and simple
 */
export const MINIMAL_TEMPLATE: Omit<DashboardLayout, 'createdAt' | 'updatedAt'> = {
  id: 'minimal',
  name: 'Minimal Dashboard',
  description: 'Sade ve basit görünüm',
  widgets: [
    createWidget('stats', 0, 0, 12, 2),
    createWidget('patients', 0, 2, 12, 4),
  ],
}

/**
 * All templates
 */
export const DASHBOARD_TEMPLATES = [
  EXECUTIVE_TEMPLATE,
  CLINICAL_TEMPLATE,
  ANALYTICS_TEMPLATE,
  EMERGENCY_TEMPLATE,
  COLLABORATIVE_TEMPLATE,
  MINIMAL_TEMPLATE,
]

/**
 * Get template by ID
 */
export function getTemplateById(id: string): DashboardLayout | undefined {
  const template = DASHBOARD_TEMPLATES.find((t) => t.id === id)
  if (!template) return undefined

  return {
    ...template,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Get template categories
 */
export const TEMPLATE_CATEGORIES = [
  { id: 'all', label: 'Tümü', icon: '📊' },
  { id: 'medical', label: 'Medikal', icon: '⚕️' },
  { id: 'analytics', label: 'Analitik', icon: '📈' },
  { id: 'collaboration', label: 'İşbirliği', icon: '🤝' },
]

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string) {
  if (category === 'all') return DASHBOARD_TEMPLATES

  const categoryMap: Record<string, string[]> = {
    medical: ['clinical', 'emergency'],
    analytics: ['analytics', 'executive'],
    collaboration: ['collaborative'],
  }

  const templateIds = categoryMap[category] || []
  return DASHBOARD_TEMPLATES.filter((t) => templateIds.includes(t.id))
}
