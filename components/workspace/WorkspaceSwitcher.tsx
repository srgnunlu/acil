'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { ChevronDown, Check, Loader2, Settings } from 'lucide-react'
import Link from 'next/link'

export function WorkspaceSwitcher() {
  const { currentWorkspace, workspaces, currentOrganization, switchWorkspace, isLoading } =
    useWorkspace()
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  // Sadece seçili organization'a bağlı workspaceleri filtrele
  const filteredWorkspaces = currentOrganization
    ? workspaces.filter((w) => w.organization_id === currentOrganization.id)
    : workspaces

  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1.5 bg-white border rounded-lg w-full max-w-full min-w-0 overflow-hidden">
        <Loader2 className="w-3 h-3 animate-spin text-gray-400 flex-shrink-0" />
        <span className="text-xs text-gray-500 truncate">Yükleniyor...</span>
      </div>
    )
  }

  // Eğer seçili organization yoksa veya o organization'a ait workspace yoksa
  if (!currentOrganization) {
    return (
      <div className="px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg w-full max-w-full min-w-0 overflow-hidden">
        <span className="text-xs text-gray-500 truncate">Önce bir organizasyon seçin</span>
      </div>
    )
  }

  if (filteredWorkspaces.length === 0) {
    return (
      <div className="px-2 py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg w-full max-w-full min-w-0 overflow-hidden">
        <span className="text-xs text-yellow-700 truncate">
          Bu organizasyonda workspace bulunamadı
        </span>
      </div>
    )
  }

  // Eğer current workspace seçili organization'a ait değilse, ilk workspace'i seç
  const validCurrentWorkspace =
    currentWorkspace && filteredWorkspaces.find((w) => w.id === currentWorkspace.id)
      ? currentWorkspace
      : filteredWorkspaces[0]

  return (
    <div className="relative w-full max-w-full">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1.5 bg-white border rounded-lg hover:bg-gray-50 transition-colors w-full max-w-full min-w-0 overflow-hidden"
      >
        <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-hidden">
          <span className="text-lg flex-shrink-0">{validCurrentWorkspace.icon}</span>
          <div className="flex flex-col items-start min-w-0 flex-1 overflow-hidden">
            <span className="text-xs font-medium text-gray-900 truncate w-full">
              {validCurrentWorkspace.name}
            </span>
            <span className="text-[10px] text-gray-500">Workspace</span>
          </div>
        </div>
        <ChevronDown
          className={`w-3 h-3 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-50" onClick={() => setIsOpen(false)} />

          {/* Menu */}
          <div className="absolute top-full left-0 mt-2 w-full min-w-[280px] bg-white border rounded-lg shadow-lg z-[60] max-h-[400px] overflow-y-auto">
            {/* Workspaces List - Sadece seçili organization'a ait workspaceler */}
            <div className="p-2">
              {filteredWorkspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  onClick={async () => {
                    setIsOpen(false)
                    // Workspace'i değiştir (cookie set edilir)
                    await switchWorkspace(workspace.id)
                    // Cookie'nin set edilmesi için kısa bir bekleme
                    await new Promise((resolve) => setTimeout(resolve, 100))
                    // Workspace değiştiğinde sayfayı yenile (Server Component'leri yeniden render et)
                    router.refresh()
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors ${
                    validCurrentWorkspace.id === workspace.id ? 'bg-blue-50' : ''
                  }`}
                >
                  {/* Icon */}
                  <span className="text-2xl">{workspace.icon}</span>

                  {/* Info */}
                  <div className="flex-1 flex flex-col items-start">
                    <span
                      className={`text-sm font-medium ${validCurrentWorkspace.id === workspace.id ? 'text-blue-900' : 'text-gray-900'}`}
                    >
                      {workspace.name}
                    </span>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span>{workspace.patient_count || 0} hasta</span>
                      <span>•</span>
                      <span>{workspace.member_count || 0} üye</span>
                    </div>
                  </div>

                  {/* Check Icon */}
                  {validCurrentWorkspace.id === workspace.id && (
                    <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>

            {/* No Workspaces */}
            {filteredWorkspaces.length === 0 && (
              <div className="p-4 text-center text-sm text-gray-500">
                Bu organizasyonda workspace bulunamadı
              </div>
            )}

            {/* Workspace Settings Link */}
            {validCurrentWorkspace && (
              <>
                <div className="border-t my-1" />
                <div className="p-2">
                  <Link
                    href="/dashboard/workspace/settings"
                    onClick={() => setIsOpen(false)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Workspace Ayarları</span>
                  </Link>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
