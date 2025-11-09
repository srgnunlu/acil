// ============================================
// WORKSPACE SETTINGS PAGE
// ============================================
// Workspace içi ayarlar ve bilgiler

'use client'

import { useState } from 'react'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { WorkspaceSettings } from '@/components/workspace/WorkspaceSettings'
import { WorkspaceMembersView } from '@/components/workspace/WorkspaceMembersView'
import { Settings as SettingsIcon, Users, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function WorkspaceSettingsPage() {
  const { currentWorkspace } = useWorkspace()
  const [activeTab, setActiveTab] = useState<'settings' | 'members'>('settings')

  if (!currentWorkspace) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Workspace bulunamadı</h2>
          <p className="mt-2 text-gray-600">Lütfen bir workspace seçin.</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'settings', label: 'Ayarlar', icon: SettingsIcon },
    { id: 'members', label: 'Üyeler', icon: Users },
  ] as const

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard&apos;a Dön
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{currentWorkspace.icon}</span>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{currentWorkspace.name}</h1>
            <p className="mt-1 text-gray-600">Workspace ayarları ve bilgileri</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="rounded-lg bg-white p-6 shadow">
        {activeTab === 'settings' && <WorkspaceSettings workspaceId={currentWorkspace.id} />}
        {activeTab === 'members' && <WorkspaceMembersView workspaceId={currentWorkspace.id} />}
      </div>
    </div>
  )
}
