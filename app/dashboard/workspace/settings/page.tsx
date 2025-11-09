// ============================================
// WORKSPACE SETTINGS PAGE
// ============================================
// Complete workspace settings with members and invitations management

'use client'

import { useState } from 'react'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { InviteMemberForm } from '@/components/invitations/InviteMemberForm'
import { InvitationsList } from '@/components/invitations/InvitationsList'
import { WorkspaceMembersList } from '@/components/workspace/WorkspaceMembersList'
import { Protected } from '@/lib/permissions'
import { AbilityProvider } from '@/lib/permissions/ability-context'

export default function WorkspaceSettingsPage() {
  const { currentWorkspace } = useWorkspace()
  const [activeTab, setActiveTab] = useState<'members' | 'invitations' | 'invite'>('members')

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
    { id: 'members', label: 'Üyeler', permission: 'workspace.settings' },
    { id: 'invitations', label: 'Davetler', permission: 'users.invite' },
    { id: 'invite', label: 'Yeni Davet', permission: 'users.invite' },
  ] as const

  // Provide a default role for now (should be fetched from user's workspace membership)
  return (
    <AbilityProvider role="owner">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Workspace Ayarları</h1>
          <p className="mt-2 text-gray-600">
            {currentWorkspace.name} workspace&apos;inin üye ve davet yönetimi
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <Protected key={tab.id} permission={tab.permission}>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              </Protected>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="rounded-lg bg-white p-6 shadow">
          {activeTab === 'members' && (
            <div>
              <h2 className="mb-6 text-xl font-semibold text-gray-900">Workspace Üyeleri</h2>
              <WorkspaceMembersList workspaceId={currentWorkspace.id} />
            </div>
          )}

          {activeTab === 'invitations' && (
            <Protected permission="users.invite">
              <div>
                <h2 className="mb-6 text-xl font-semibold text-gray-900">Bekleyen Davetler</h2>
                <InvitationsList workspaceId={currentWorkspace.id} />
              </div>
            </Protected>
          )}

          {activeTab === 'invite' && (
            <Protected permission="users.invite">
              <div>
                <h2 className="mb-6 text-xl font-semibold text-gray-900">Yeni Üye Davet Et</h2>
                <div className="mx-auto max-w-2xl">
                  <InviteMemberForm
                    workspaceId={currentWorkspace.id}
                    onSuccess={() => setActiveTab('invitations')}
                    onCancel={() => setActiveTab('members')}
                  />
                </div>
              </div>
            </Protected>
          )}
        </div>
      </div>
    </AbilityProvider>
  )
}
