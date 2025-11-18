/**
 * Widget Catalog
 *
 * Defines all available widgets for the customizable dashboard
 */

import { WidgetCatalogEntry } from '@/types/widget.types'

export const WIDGET_CATALOG: WidgetCatalogEntry[] = [
  // Overview Category
  {
    type: 'stats',
    title: 'İstatistikler',
    description: 'Temel metrikler ve KPI\'lar',
    icon: '📊',
    defaultSize: { w: 3, h: 2 },
    minSize: { w: 2, h: 2 },
    maxSize: { w: 6, h: 3 },
    category: 'overview',
    tags: ['metrics', 'stats', 'overview'],
  },
  {
    type: 'ai-insights',
    title: 'AI Öngörüler',
    description: 'Akıllı uyarılar ve öneriler',
    icon: '🤖',
    defaultSize: { w: 6, h: 2 },
    minSize: { w: 4, h: 2 },
    maxSize: { w: 12, h: 3 },
    category: 'overview',
    tags: ['ai', 'insights', 'recommendations'],
  },
  {
    type: 'alerts',
    title: 'Kritik Uyarılar',
    description: 'Acil dikkat gerektiren durumlar',
    icon: '🚨',
    defaultSize: { w: 6, h: 3 },
    minSize: { w: 4, h: 2 },
    category: 'overview',
    tags: ['alerts', 'critical', 'urgent'],
  },

  // Patients Category
  {
    type: 'patients',
    title: 'Hasta Listesi',
    description: 'Aktif hastalar ve risk skorları',
    icon: '👥',
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
    category: 'patients',
    tags: ['patients', 'list', 'grid'],
  },

  // Analytics Category
  {
    type: 'charts',
    title: 'Grafikler',
    description: 'Veri görselleştirme',
    icon: '📈',
    defaultSize: { w: 6, h: 3 },
    minSize: { w: 4, h: 3 },
    category: 'analytics',
    tags: ['charts', 'graphs', 'visualization'],
  },

  // Collaboration Category
  {
    type: 'activity',
    title: 'Aktivite Akışı',
    description: 'Canlı ekip aktiviteleri',
    icon: '📱',
    defaultSize: { w: 4, h: 4 },
    minSize: { w: 3, h: 3 },
    category: 'collaboration',
    tags: ['activity', 'feed', 'realtime'],
  },
  {
    type: 'notes',
    title: 'Workspace Notları',
    description: 'Ekip notları ve iletişim',
    icon: '📝',
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 3, h: 2 },
    category: 'collaboration',
    tags: ['notes', 'collaboration', 'team'],
  },
  {
    type: 'team',
    title: 'Ekip',
    description: 'Online kullanıcılar ve durum',
    icon: '👨‍⚕️',
    defaultSize: { w: 3, h: 3 },
    minSize: { w: 2, h: 2 },
    category: 'collaboration',
    tags: ['team', 'users', 'presence'],
  },

  // Tools Category
  {
    type: 'quick-actions',
    title: 'Hızlı İşlemler',
    description: 'Sık kullanılan aksiyonlar',
    icon: '⚡',
    defaultSize: { w: 3, h: 2 },
    minSize: { w: 2, h: 2 },
    category: 'tools',
    tags: ['actions', 'shortcuts', 'tools'],
  },
  {
    type: 'calendar',
    title: 'Takvim',
    description: 'Hatırlatmalar ve randevular',
    icon: '📅',
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 3, h: 3 },
    category: 'tools',
    tags: ['calendar', 'reminders', 'schedule'],
  },
]

/**
 * Get widget config by type
 */
export function getWidgetConfig(type: string): WidgetCatalogEntry | undefined {
  return WIDGET_CATALOG.find((w) => w.type === type)
}

/**
 * Get widgets by category
 */
export function getWidgetsByCategory(category: string): WidgetCatalogEntry[] {
  return WIDGET_CATALOG.filter((w) => w.category === category)
}

/**
 * Get widgets by tags
 */
export function getWidgetsByTags(tags: string[]): WidgetCatalogEntry[] {
  return WIDGET_CATALOG.filter((w) => tags.some((tag) => w.tags.includes(tag)))
}

/**
 * Search widgets
 */
export function searchWidgets(query: string): WidgetCatalogEntry[] {
  const lowerQuery = query.toLowerCase()
  return WIDGET_CATALOG.filter(
    (w) =>
      w.title.toLowerCase().includes(lowerQuery) ||
      w.description.toLowerCase().includes(lowerQuery) ||
      w.tags.some((tag) => tag.includes(lowerQuery))
  )
}
