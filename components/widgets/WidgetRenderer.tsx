'use client'

import { WidgetInstance } from '@/types/widget.types'
import { StatsWidget } from './StatsWidget'
import { PatientQuickGrid } from '@/components/dashboard/PatientQuickGrid'
import { CriticalAlertsPanel, generateDemoAlerts } from '@/components/dashboard/CriticalAlertsPanel'
import { ActivityStreamPanel } from '@/components/dashboard/ActivityStreamPanel'
import { AIInsightsHero, generateDemoInsights } from '@/components/dashboard/AIInsightsHero'
import { WorkspaceNotesPanel } from '@/components/dashboard/WorkspaceNotesPanel'

interface WidgetRendererProps {
  instance: WidgetInstance
  workspaceId: string
  userId: string
}

/**
 * Widget Renderer
 *
 * Renders the appropriate widget component based on widget type
 */
export function WidgetRenderer({ instance, workspaceId, userId }: WidgetRendererProps) {
  switch (instance.type) {
    case 'stats':
      return <StatsWidget instance={instance} workspaceId={workspaceId} userId={userId} />

    case 'patients':
      return (
        <div className="h-full overflow-auto">
          <PatientQuickGrid
            patients={[]} // Will be fetched by the widget
            maxDisplay={instance.settings?.maxDisplay || 6}
          />
        </div>
      )

    case 'alerts':
      return (
        <CriticalAlertsPanel
          alerts={generateDemoAlerts()}
          maxDisplay={instance.settings?.maxDisplay || 5}
        />
      )

    case 'activity':
      return <ActivityStreamPanel workspaceId={workspaceId} maxDisplay={10} />

    case 'ai-insights':
      return (
        <AIInsightsHero
          insights={generateDemoInsights({
            criticalPatients: 3,
            avgStayIncrease: 15,
            aiSuggestions: 2,
            teamPerformance: 120,
          })}
          autoRotate={true}
          rotateInterval={10000}
        />
      )

    case 'charts':
      return (
        <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">Grafik Widget (Yakında)</p>
        </div>
      )

    case 'notes':
      return <WorkspaceNotesPanel workspaceId={workspaceId} currentUserId={userId} />

    case 'quick-actions':
      return (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Hasta Ekle', icon: '➕', link: '/dashboard/patients' },
            { label: 'İstatistikler', icon: '📊', link: '/dashboard/analytics' },
            { label: 'Protokoller', icon: '📚', link: '/dashboard/protocols' },
          ].map((action) => (
            <button
              key={action.label}
              onClick={() => (window.location.href = action.link)}
              className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-center"
            >
              <div className="text-2xl mb-2">{action.icon}</div>
              <p className="text-xs font-medium text-gray-700">{action.label}</p>
            </button>
          ))}
        </div>
      )

    case 'team':
      return (
        <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">Ekip Widget (Yakında)</p>
        </div>
      )

    case 'calendar':
      return (
        <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">Takvim Widget (Yakında)</p>
        </div>
      )

    default:
      return (
        <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-sm text-gray-500">Bilinmeyen widget tipi</p>
        </div>
      )
  }
}
