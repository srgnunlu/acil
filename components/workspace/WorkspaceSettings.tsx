'use client'

import { useState, useEffect } from 'react'
import { Settings, Users, Activity, Loader2, Edit2, Save, X } from 'lucide-react'

interface WorkspaceSettingsProps {
  workspaceId: string
}

export function WorkspaceSettings({ workspaceId }: WorkspaceSettingsProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [workspace, setWorkspace] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    color: '#3b82f6',
  })

  useEffect(() => {
    fetchWorkspace()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId])

  const fetchWorkspace = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/workspaces/${workspaceId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Workspace yüklenemedi')
      }

      setWorkspace(data.workspace)
      setFormData({
        name: data.workspace.name || '',
        description: data.workspace.description || '',
        icon: data.workspace.icon || '🏥',
        color: data.workspace.color || '#3b82f6',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setError(null)
      const response = await fetch(`/api/workspaces/${workspaceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Workspace güncellenemedi')
      }

      setWorkspace(data.workspace)
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-800">{error}</p>
      </div>
    )
  }

  if (!workspace) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">Workspace bulunamadı</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Genel Bilgiler */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Genel Bilgiler</h3>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Düzenle
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                Kaydet
              </button>
              <button
                onClick={() => {
                  setIsEditing(false)
                  setFormData({
                    name: workspace.name || '',
                    description: workspace.description || '',
                    icon: workspace.icon || '🏥',
                    color: workspace.color || '#3b82f6',
                  })
                }}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                İptal
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Workspace Adı</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-900">{workspace.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
            {isEditing ? (
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-600">{workspace.description || 'Açıklama yok'}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">İkon</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  maxLength={2}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="🏥"
                />
              ) : (
                <p className="text-2xl">{workspace.icon}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Renk</label>
              {isEditing ? (
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full h-10 rounded-md border border-gray-300"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded" style={{ backgroundColor: workspace.color }} />
                  <span className="text-sm text-gray-600">{workspace.color}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* İstatistikler */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">İstatistikler</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Üye Sayısı</p>
                <p className="text-2xl font-bold text-gray-900">{workspace.member_count || 0}</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Hasta Sayısı</p>
                <p className="text-2xl font-bold text-gray-900">{workspace.patient_count || 0}</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Settings className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Kategori Sayısı</p>
                <p className="text-2xl font-bold text-gray-900">{workspace.category_count || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
