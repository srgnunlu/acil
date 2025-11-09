// ============================================
// INVITE MEMBER FORM
// ============================================
// Form component for inviting new members to workspace

'use client'

import { useState } from 'react'
import { getRoleLabel, getRoleDescription, getAllPermissions, getPermissionLabel } from '@/lib/permissions'
import type { WorkspaceRole, Permission } from '@/types/multi-tenant.types'

interface InviteMemberFormProps {
  workspaceId: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function InviteMemberForm({ workspaceId, onSuccess, onCancel }: InviteMemberFormProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<WorkspaceRole>('doctor')
  const [message, setMessage] = useState('')
  const [customPermissions, setCustomPermissions] = useState<Permission[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const roles: WorkspaceRole[] = ['owner', 'admin', 'senior_doctor', 'doctor', 'resident', 'nurse', 'observer']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspace_id: workspaceId,
          email,
          role,
          custom_permissions: customPermissions.length > 0 ? customPermissions : undefined,
          message: message || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Invitation gönderilemedi')
      }

      setSuccess(true)
      setEmail('')
      setMessage('')
      setCustomPermissions([])

      setTimeout(() => {
        onSuccess?.()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const togglePermission = (permission: Permission) => {
    setCustomPermissions((prev) =>
      prev.includes(permission) ? prev.filter((p) => p !== permission) : [...prev, permission]
    )
  }

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

      {/* Role */}
      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700">
          Rol *
        </label>
        <select
          id="role"
          required
          value={role}
          onChange={(e) => setRole(e.target.value as WorkspaceRole)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {roles.map((r) => (
            <option key={r} value={r}>
              {getRoleLabel(r)}
            </option>
          ))}
        </select>
        <p className="mt-1 text-sm text-gray-500">{getRoleDescription(role)}</p>
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700">
          Mesaj (Opsiyonel)
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Workspace'e hoş geldiniz..."
        />
      </div>

      {/* Advanced Options */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          {showAdvanced ? '▼' : '▶'} Gelişmiş İzin Ayarları
        </button>

        {showAdvanced && (
          <div className="mt-4 space-y-2 rounded-lg border border-gray-200 p-4">
            <p className="mb-2 text-sm font-medium text-gray-700">Özel İzinler</p>
            <div className="grid grid-cols-2 gap-2">
              {getAllPermissions().map((permission) => (
                <label key={permission} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={customPermissions.includes(permission)}
                    onChange={() => togglePermission(permission)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{getPermissionLabel(permission)}</span>
                </label>
              ))}
            </div>
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
              <div className="mt-2 text-sm text-green-700">Invitation başarıyla gönderildi.</div>
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
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Gönderiliyor...' : 'Davet Gönder'}
        </button>
      </div>
    </form>
  )
}
