'use client'

import { useState } from 'react'
import { AlertDashboard } from '@/components/ai-monitoring/AlertDashboard'
import { TrendVisualization } from '@/components/ai-monitoring/TrendVisualization'
import { ComparisonTimeline } from '@/components/ai-monitoring/ComparisonTimeline'
import { MonitoringConfig } from '@/components/ai-monitoring/MonitoringConfig'
import { PatientMonitoringDashboard } from '@/components/ai-monitoring/PatientMonitoringDashboard'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bell, TrendingUp, GitCompare, Settings, BarChart3 } from 'lucide-react'

interface MonitoringTabProps {
  patientId: string
  workspaceId: string
}

type MonitoringView = 'dashboard' | 'alerts' | 'trends' | 'comparisons' | 'config'

export function MonitoringTab({ patientId, workspaceId }: MonitoringTabProps) {
  const [activeView, setActiveView] = useState<MonitoringView>('dashboard')

  const views = [
    {
      id: 'dashboard' as MonitoringView,
      label: 'Dashboard',
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      id: 'alerts' as MonitoringView,
      label: 'Alertler',
      icon: <Bell className="h-5 w-5" />,
    },
    {
      id: 'trends' as MonitoringView,
      label: 'Trendler',
      icon: <TrendingUp className="h-5 w-5" />,
    },
    {
      id: 'comparisons' as MonitoringView,
      label: 'Karşılaştırmalar',
      icon: <GitCompare className="h-5 w-5" />,
    },
    {
      id: 'config' as MonitoringView,
      label: 'Ayarlar',
      icon: <Settings className="h-5 w-5" />,
    },
  ]

  return (
    <div className="space-y-6">
      {/* View Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4">
        {views.map((view) => (
          <Button
            key={view.id}
            variant={activeView === view.id ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveView(view.id)}
            leftIcon={view.icon}
          >
            {view.label}
          </Button>
        ))}
      </div>

      {/* View Content */}
      <div>
        {activeView === 'dashboard' && (
          <PatientMonitoringDashboard patientId={patientId} workspaceId={workspaceId} />
        )}

        {activeView === 'alerts' && (
          <AlertDashboard patientId={patientId} workspaceId={workspaceId} showStatistics={true} />
        )}

        {activeView === 'trends' && (
          <TrendVisualization 
            patientId={patientId} 
            autoRefresh={true} 
            refreshInterval={30000}
          />
        )}

        {activeView === 'comparisons' && (
          <ComparisonTimeline patientId={patientId} autoCompare={true} />
        )}

        {activeView === 'config' && (
          <MonitoringConfig patientId={patientId} workspaceId={workspaceId} />
        )}
      </div>
    </div>
  )
}

