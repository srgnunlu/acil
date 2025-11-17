/**
 * Widget System Types
 *
 * Defines the widget architecture for customizable dashboards
 */

export type WidgetType =
  | 'stats'
  | 'patients'
  | 'alerts'
  | 'activity'
  | 'ai-insights'
  | 'charts'
  | 'notes'
  | 'calendar'
  | 'quick-actions'
  | 'team'

export type WidgetSize = 'small' | 'medium' | 'large' | 'xlarge'

export interface WidgetLayout {
  i: string // Widget instance ID
  x: number // Grid column position (0-11)
  y: number // Grid row position
  w: number // Width in grid units
  h: number // Height in grid units
  minW?: number // Minimum width
  minH?: number // Minimum height
  maxW?: number // Maximum width
  maxH?: number // Maximum height
  static?: boolean // Cannot be moved/resized
}

export interface WidgetConfig {
  type: WidgetType
  title: string
  description: string
  icon: string // Emoji or Lucide icon name
  defaultSize: {
    w: number
    h: number
  }
  minSize: {
    w: number
    h: number
  }
  maxSize?: {
    w: number
    h: number
  }
  category: 'overview' | 'patients' | 'analytics' | 'collaboration' | 'tools'
  tags: string[]
  permissions?: string[] // Required permissions to use this widget
}

export interface WidgetInstance {
  id: string // Unique instance ID
  type: WidgetType
  layout: WidgetLayout
  settings?: Record<string, any> // Widget-specific settings
  data?: any // Widget data (cached or live)
  lastUpdated?: string
}

export interface DashboardLayout {
  id: string
  name: string
  description?: string
  widgets: WidgetInstance[]
  isDefault?: boolean
  createdAt: string
  updatedAt: string
}

export interface UserDashboardPreferences {
  userId: string
  workspaceId: string
  currentLayoutId: string
  layouts: DashboardLayout[]
  theme?: 'light' | 'dark' | 'system'
  density?: 'compact' | 'comfortable' | 'spacious'
  autoRefresh?: boolean
  refreshInterval?: number // seconds
}

// Widget-specific settings types
export interface StatsWidgetSettings {
  metrics: string[]
  showTrends: boolean
  showSparklines: boolean
}

export interface PatientsWidgetSettings {
  filter: 'all' | 'critical' | 'active' | 'recent'
  sortBy: 'name' | 'date' | 'risk'
  maxDisplay: number
}

export interface ChartsWidgetSettings {
  chartType: 'line' | 'bar' | 'pie' | 'doughnut'
  dataSource: string
  period: '7d' | '30d' | '90d' | 'custom'
}

export interface ActivityWidgetSettings {
  activityTypes: string[]
  maxDisplay: number
  showFilters: boolean
}

// Widget catalog entry
export interface WidgetCatalogEntry extends WidgetConfig {
  preview?: string // Screenshot or preview URL
  isNew?: boolean
  isPro?: boolean // Requires pro subscription
}

// Grid configuration
export interface GridConfig {
  cols: number // Number of columns (default 12)
  rowHeight: number // Height of one row in pixels
  margin: [number, number] // [x, y] margin between items
  containerPadding: [number, number] // [x, y] padding around container
  breakpoints: {
    lg: number
    md: number
    sm: number
    xs: number
  }
}

export const DEFAULT_GRID_CONFIG: GridConfig = {
  cols: 12,
  rowHeight: 80,
  margin: [16, 16],
  containerPadding: [16, 16],
  breakpoints: {
    lg: 1200,
    md: 996,
    sm: 768,
    xs: 480,
  },
}

export const DEFAULT_LAYOUTS: DashboardLayout[] = [
  {
    id: 'default',
    name: 'Varsayılan',
    description: 'Standart dashboard görünümü',
    isDefault: true,
    widgets: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]
