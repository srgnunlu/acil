'use client'

import { useState } from 'react'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { ChevronDown, Check, Building2, Loader2 } from 'lucide-react'

export function WorkspaceSwitcher() {
  const { currentWorkspace, workspaces, switchWorkspace, isLoading } = useWorkspace()
  const [isOpen, setIsOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg">
        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        <span className="text-sm text-gray-500">Yükleniyor...</span>
      </div>
    )
  }

  if (!currentWorkspace) {
    return (
      <div className="px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
        <span className="text-sm text-yellow-700">Workspace bulunamadı</span>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg hover:bg-gray-50 transition-colors min-w-[200px]"
      >
        <div className="flex items-center gap-2 flex-1">
          <span className="text-2xl">{currentWorkspace.icon}</span>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium text-gray-900">{currentWorkspace.name}</span>
            {currentWorkspace.organization && (
              <span className="text-xs text-gray-500">{currentWorkspace.organization.name}</span>
            )}
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* Menu */}
          <div className="absolute top-full left-0 mt-2 w-full min-w-[280px] bg-white border rounded-lg shadow-lg z-20 max-h-[400px] overflow-y-auto">
            {/* Workspaces List */}
            <div className="p-2">
              {workspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  onClick={() => {
                    switchWorkspace(workspace.id)
                    setIsOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors ${
                    currentWorkspace.id === workspace.id ? 'bg-blue-50' : ''
                  }`}
                >
                  {/* Icon */}
                  <span className="text-2xl">{workspace.icon}</span>

                  {/* Info */}
                  <div className="flex-1 flex flex-col items-start">
                    <span className={`text-sm font-medium ${currentWorkspace.id === workspace.id ? 'text-blue-900' : 'text-gray-900'}`}>
                      {workspace.name}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {workspace.organization && (
                        <>
                          <Building2 className="w-3 h-3" />
                          <span>{workspace.organization.name}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span>{workspace.patient_count || 0} hasta</span>
                      <span>•</span>
                      <span>{workspace.member_count || 0} üye</span>
                    </div>
                  </div>

                  {/* Check Icon */}
                  {currentWorkspace.id === workspace.id && <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />}
                </button>
              ))}
            </div>

            {/* No Workspaces */}
            {workspaces.length === 0 && (
              <div className="p-4 text-center text-sm text-gray-500">Workspace bulunamadı</div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
