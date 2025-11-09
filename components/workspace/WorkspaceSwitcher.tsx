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
      <div className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg">
        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        <span className="text-sm text-gray-500">Yükleniyor...</span>
      </div>
    )
  }

  // Eğer seçili organization yoksa veya o organization'a ait workspace yoksa
  if (!currentOrganization) {
    return (
      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
        <span className="text-sm text-gray-500">Önce bir organizasyon seçin</span>
      </div>
    )
  }

  if (filteredWorkspaces.length === 0) {
    return (
      <div className="px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
        <span className="text-sm text-yellow-700">Bu organizasyonda workspace bulunamadı</span>
      </div>
    )
  }

  // Eğer current workspace seçili organization'a ait değilse, ilk workspace'i seç
  const validCurrentWorkspace =
    currentWorkspace && filteredWorkspaces.find((w) => w.id === currentWorkspace.id)
      ? currentWorkspace
      : filteredWorkspaces[0]

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg hover:bg-gray-50 transition-colors min-w-[200px]"
      >
        <div className="flex items-center gap-2 flex-1">
          <span className="text-2xl">{validCurrentWorkspace.icon}</span>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium text-gray-900">{validCurrentWorkspace.name}</span>
            <span className="text-xs text-gray-500">Workspace</span>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* Menu */}
          <div className="absolute top-full left-0 mt-2 w-full min-w-[280px] bg-white border rounded-lg shadow-lg z-20 max-h-[400px] overflow-y-auto">
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
