'use client'

import { useState } from 'react'
import { Mail, Loader2 } from 'lucide-react'
import type { WorkspaceRole } from '@/types/multi-tenant.types'

interface Workspace {
  id: string
  name: string
  icon: string
}

interface InviteOrganizationMemberFormProps {
  organizationId: string
  workspaces: Workspace[]
  onSuccess?: () => void
  onCancel?: () => void
}

export function InviteOrganizationMemberForm({
  organizationId,
  workspaces,
  onSuccess,
  onCancel,
}: InviteOrganizationMemberFormProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'owner' | 'admin' | 'member'>('member')
  const [selectedWorkspaces, setSelectedWorkspaces] = useState<Record<string, WorkspaceRole>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // First, add user to organization
      const orgResponse = await fetch(`/api/organizations/${organizationId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          role,
          workspace_ids: Object.keys(selectedWorkspaces),
        }),
      })

      if (!orgResponse.ok) {
        const data = await orgResponse.json()
        throw new Error(data.error || 'Üye eklenemedi')
      }

      // Then, send invitations to selected workspaces with specific roles
      const workspaceIds = Object.keys(selectedWorkspaces)
      const invitationPromises = workspaceIds.map((workspaceId) =>
        fetch('/api/invitations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workspace_id: workspaceId,
            email,
            role: selectedWorkspaces[workspaceId],
          }),
        })
      )

      await Promise.all(invitationPromises)

      setSuccess(true)
      setEmail('')
      setSelectedWorkspaces({})

      setTimeout(() => {
        onSuccess?.()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const toggleWorkspace = (workspaceId: string) => {
    setSelectedWorkspaces((prev) => {
      const newState = { ...prev }
      if (newState[workspaceId]) {
        delete newState[workspaceId]
      } else {
        newState[workspaceId] = 'doctor' // Default role
      }
      return newState
    })
  }

  const updateWorkspaceRole = (workspaceId: string, newRole: WorkspaceRole) => {
    setSelectedWorkspaces((prev) => ({
      ...prev,
      [workspaceId]: newRole,
    }))
  }

  const workspaceRoles: WorkspaceRole[] = [
    'doctor',
    'nurse',
    'resident',
    'senior_doctor',
    'admin',
    'observer',
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email Adresi *
        </label>
        <input
          type="email"
          id="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="user@example.com"
        />
      </div>

      {/* Organization Role */}
      <div>
        <label htmlFor="orgRole" className="block text-sm font-medium text-gray-700">
          Organizasyon Rolü *
        </label>
        <select
          id="orgRole"
          required
          value={role}
          onChange={(e) => setRole(e.target.value as 'owner' | 'admin' | 'member')}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="member">Üye</option>
          <option value="admin">Admin</option>
          <option value="owner">Owner</option>
        </select>
        <p className="mt-1 text-sm text-gray-500">
          {role === 'owner' && 'Organizasyonun tam kontrolü'}
          {role === 'admin' && 'Organizasyonu yönetebilir, workspace oluşturabilir'}
          {role === 'member' && 'Organizasyona erişebilir'}
        </p>
      </div>

      {/* Workspace Access */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Workspace Erişimleri</label>
        {workspaces.length === 0 ? (
          <p className="text-sm text-gray-500">Henüz workspace yok</p>
        ) : (
          <div className="space-y-3">
            {workspaces.map((workspace) => {
              const isSelected = !!selectedWorkspaces[workspace.id]
              return (
                <div
                  key={workspace.id}
                  className={`p-3 border rounded-lg ${
                    isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleWorkspace(workspace.id)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-2xl">{workspace.icon}</span>
                      <span className="font-medium text-gray-900">{workspace.name}</span>
                    </div>
                    {isSelected && (
                      <select
                        value={selectedWorkspaces[workspace.id]}
                        onChange={(e) =>
                          updateWorkspaceRole(workspace.id, e.target.value as WorkspaceRole)
                        }
                        className="text-sm rounded-md border border-gray-300 px-2 py-1 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {workspaceRoles.map((r) => (
                          <option key={r} value={r}>
                            {r === 'doctor' && 'Doktor'}
                            {r === 'nurse' && 'Hemşire'}
                            {r === 'resident' && 'Asistan'}
                            {r === 'senior_doctor' && 'Kıdemli Doktor'}
                            {r === 'admin' && 'Admin'}
                            {r === 'observer' && 'Gözlemci'}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Hata</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Başarılı!</h3>
              <div className="mt-2 text-sm text-green-700">
                Üye başarıyla eklendi ve davetler gönderildi.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            İptal
          </button>
        )}
        <button
          type="submit"
          disabled={loading || success}
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Gönderiliyor...
            </>
          ) : (
            <>
              <Mail className="w-4 h-4" />
              Davet Gönder
            </>
          )}
        </button>
      </div>
    </form>
  )
}
