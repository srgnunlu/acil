'use client'

import { useState } from 'react'
import { Briefcase, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface Workspace {
  id: string
  name: string
  slug: string
  icon: string
  type: string
  patient_count?: number
  member_count?: number
}

interface WorkspaceManagementProps {
  organizationId: string
  workspaces: Workspace[]
  onRefresh: () => void
}

export function WorkspaceManagement({
  organizationId,
  workspaces,
  onRefresh,
}: WorkspaceManagementProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async (workspaceId: string) => {
    if (!confirm('Bu workspace&apos;i silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
      return
    }

    try {
      setIsDeleting(workspaceId)
      setError(null)

      const response = await fetch(`/api/workspaces/${workspaceId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Workspace silinemedi')
      }

      onRefresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setIsDeleting(null)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Workspace&apos;ler</h2>
        <Link
          href={`/dashboard/organizations/${organizationId}/workspaces/new`}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Yeni Workspace
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {workspaces.length === 0 ? (
        <div className="text-center py-12">
          <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Henüz workspace&apos;e yok</p>
          <Link
            href={`/dashboard/organizations/${organizationId}/workspaces/new`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            İlk Workspace&apos;i Oluştur
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map((workspace) => (
            <div
              key={workspace.id}
              className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <Link
                  href={`/dashboard/workspace/settings?workspace=${workspace.id}`}
                  className="flex-1 flex items-center gap-3"
                >
                  <span className="text-2xl">{workspace.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{workspace.name}</h3>
                    <p className="text-sm text-gray-500">{workspace.type}</p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                      <span>{workspace.patient_count || 0} hasta</span>
                      <span>•</span>
                      <span>{workspace.member_count || 0} üye</span>
                    </div>
                  </div>
                </Link>
                <button
                  onClick={() => handleDelete(workspace.id)}
                  disabled={isDeleting === workspace.id}
                  className="ml-2 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Workspace'i Sil"
                >
                  {isDeleting === workspace.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
