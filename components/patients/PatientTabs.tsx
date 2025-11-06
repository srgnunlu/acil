'use client'

import { useState } from 'react'
import { PatientData, PatientTest, AIAnalysis } from '@/types'
import { OverviewTab } from './tabs/OverviewTab'
import { DataTab } from './tabs/DataTab'
import { TestsTab } from './tabs/TestsTab'
import { AIAnalysisTab } from './tabs/AIAnalysisTab'
import { ChatTab } from './tabs/ChatTab'

interface PatientTabsProps {
  patientId: string
  patientName: string
  patientData: PatientData[]
  tests: PatientTest[]
  analyses: AIAnalysis[]
}

type TabType = 'overview' | 'data' | 'tests' | 'ai' | 'chat'

export function PatientTabs({
  patientId,
  patientName,
  patientData,
  tests,
  analyses,
}: PatientTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  const tabs = [
    { id: 'overview' as TabType, label: 'Genel Bakış', icon: '👁️' },
    { id: 'data' as TabType, label: 'Hasta Bilgileri', icon: '📋' },
    { id: 'tests' as TabType, label: 'Tetkikler', icon: '🔬' },
    { id: 'ai' as TabType, label: 'AI Analizi', icon: '🤖' },
    { id: 'chat' as TabType, label: 'AI Chat', icon: '💬' },
  ]

  return (
    <div>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <OverviewTab
            patientId={patientId}
            patientData={patientData}
            tests={tests}
            analyses={analyses}
          />
        )}

        {activeTab === 'data' && (
          <DataTab patientId={patientId} patientData={patientData} />
        )}

        {activeTab === 'tests' && (
          <TestsTab patientId={patientId} tests={tests} />
        )}

        {activeTab === 'ai' && (
          <AIAnalysisTab
            patientId={patientId}
            patientData={patientData}
            tests={tests}
            analyses={analyses}
          />
        )}

        {activeTab === 'chat' && (
          <ChatTab patientId={patientId} patientName={patientName} />
        )}
      </div>
    </div>
  )
}
