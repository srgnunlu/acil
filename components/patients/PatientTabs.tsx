'use client'

import { useState } from 'react'
import { PatientData, PatientTest, AIAnalysis } from '@/types'
import { OverviewTab } from './tabs/OverviewTab'
import { DataTab } from './tabs/DataTab'
import { TestsTab } from './tabs/TestsTab'
import { AIAnalysisTab } from './tabs/AIAnalysisTab'
import { ChatTab } from './tabs/ChatTab'
import { NotesTab } from './tabs/NotesTab'
import { MonitoringTab } from './tabs/MonitoringTab'
import { CalculatorsTab } from './tabs/CalculatorsTab'

interface PatientTabsProps {
  patientId: string
  patientName: string
  patientData: PatientData[]
  tests: PatientTest[]
  analyses: AIAnalysis[]
  workspaceId?: string
  currentUserId?: string
  workflowState?: string
  patient?: Patient
}

type TabType = 'overview' | 'data' | 'tests' | 'ai' | 'monitoring' | 'chat' | 'notes' | 'calculators'

export function PatientTabs({
  patientId,
  patientName,
  patientData,
  tests,
  analyses,
  workspaceId,
  currentUserId,
  workflowState,
  patient,
}: PatientTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  const tabs = [
    {
      id: 'overview' as TabType,
      label: 'Genel Bakış',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
      count: null,
    },
    {
      id: 'data' as TabType,
      label: 'Hasta Bilgileri',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      count: patientData.length,
    },
    {
      id: 'tests' as TabType,
      label: 'Tetkikler',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
          />
        </svg>
      ),
      count: tests.length,
    },
    {
      id: 'ai' as TabType,
      label: 'AI Analizi',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
      ),
      count: analyses.length,
    },
    {
      id: 'monitoring' as TabType,
      label: 'Monitoring',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      count: null,
    },
    {
      id: 'chat' as TabType,
      label: 'AI Chat',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      ),
      count: null,
    },
    {
      id: 'notes' as TabType,
      label: 'Notlar',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
          />
        </svg>
      ),
      count: null,
    },
    {
      id: 'calculators' as TabType,
      label: 'Kalkulatörler',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      ),
      count: null,
    },
  ]

  return (
    <div>
      {/* Tab Navigation */}
      <div className="border-b-2 border-gray-200 mb-6">
        <nav className="flex space-x-1 overflow-x-auto scrollbar-hide -mb-0.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                relative pb-4 px-4 pt-2 border-b-4 font-semibold text-sm transition-all duration-200 whitespace-nowrap
                flex items-center space-x-2 group
                ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-700 bg-blue-50 rounded-t-lg'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 hover:bg-gray-50 rounded-t-lg'
                }
              `}
            >
              <span
                className={`transition-transform duration-200 ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-105'}`}
              >
                {tab.icon}
              </span>
              <span>{tab.label}</span>
              {tab.count !== null && tab.count > 0 && (
                <span
                  className={`
                  ml-2 px-2 py-0.5 rounded-full text-xs font-bold
                  ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 group-hover:bg-gray-300'
                  }
                `}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="animate-fadeIn">
        {activeTab === 'overview' && (
          <OverviewTab
            patientData={patientData}
            tests={tests}
            analyses={analyses}
            patientId={patientId}
            workspaceId={workspaceId}
            workflowState={workflowState}
          />
        )}

        {activeTab === 'data' && <DataTab patientId={patientId} patientData={patientData} />}

        {activeTab === 'tests' && <TestsTab patientId={patientId} tests={tests} />}

        {activeTab === 'ai' && (
          <AIAnalysisTab
            patientId={patientId}
            patientData={patientData}
            tests={tests}
            analyses={analyses}
          />
        )}

        {activeTab === 'monitoring' && workspaceId && (
          <MonitoringTab patientId={patientId} workspaceId={workspaceId} />
        )}

        {activeTab === 'chat' && <ChatTab patientId={patientId} patientName={patientName} />}

        {activeTab === 'notes' && workspaceId && currentUserId && (
          <NotesTab patientId={patientId} workspaceId={workspaceId} currentUserId={currentUserId} />
        )}

        {activeTab === 'calculators' && workspaceId && patient && (
          <CalculatorsTab
            patientId={patientId}
            workspaceId={workspaceId}
            patient={patient}
            patientData={patientData}
            tests={tests}
          />
        )}
      </div>
    </div>
  )
}
