// ============================================
// WORKSPACE MEMBERS LIST
// ============================================
// Display workspace members with role management

'use client'

import { useState, useEffect } from 'react'
import {
  getRoleLabel,
  getRoleDescription,
  getAllPermissions,
  getPermissionLabel,
  getPermissionsForRole,
} from '@/lib/permissions'
import type { WorkspaceMemberWithProfile } from '@/types/multi-tenant.types'
import type { WorkspaceRole, Permission } from '@/types/multi-tenant.types'

interface WorkspaceMembersListProps {
  workspaceId: string
  currentUserRole?: WorkspaceRole
  onUpdate?: () => void
}

export function WorkspaceMembersList({
  workspaceId,
  currentUserRole,
  onUpdate,
}: WorkspaceMembersListProps) {
  const [members, setMembers] = useState<WorkspaceMemberWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingMember, setEditingMember] = useState<string | null>(null)
  const [newRole, setNewRole] = useState<WorkspaceRole>('doctor')
  const [editingPermissions, setEditingPermissions] = useState<string | null>(null)
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>([])

  const canManageMembers = currentUserRole && ['owner', 'admin'].includes(currentUserRole)

  useEffect(() => {
    fetchMembers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId])

  const fetchMembers = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/workspaces/${workspaceId}/members`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Members yüklenemedi')
      }

      setMembers(data.members || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateRole = async (memberId: string, role: WorkspaceRole) => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          member_id: memberId,
          role,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Rol güncellenemedi')
      }

      setEditingMember(null)
      await fetchMembers()
      onUpdate?.()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Bir hata oluştu')
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Bu üyeyi workspace'ten çıkarmak istediğinize emin misiniz?")) {
      return
    }

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/members?member_id=${memberId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Üye çıkarılamadı')
      }

      await fetchMembers()
      onUpdate?.()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Bir hata oluştu')
    }
  }

  const handleEditPermissions = (member: WorkspaceMemberWithProfile) => {
    setEditingPermissions(member.id)
    // Mevcut custom permissions'ı al veya boş array
    const currentPermissions = Array.isArray(member.permissions)
      ? (member.permissions as Permission[])
      : []
    setSelectedPermissions([...currentPermissions])
  }

  const handleSavePermissions = async (memberId: string) => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/members/${memberId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          permissions: selectedPermissions,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'İzinler güncellenemedi')
      }

      setEditingPermissions(null)
      setSelectedPermissions([])
      await fetchMembers()
      onUpdate?.()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Bir hata oluştu')
    }
  }

  const togglePermission = (permission: Permission) => {
    if (selectedPermissions.includes(permission)) {
      setSelectedPermissions(selectedPermissions.filter((p) => p !== permission))
    } else {
      setSelectedPermissions([...selectedPermissions, permission])
    }
  }

  const isRolePermission = (
    member: WorkspaceMemberWithProfile,
    permission: Permission
  ): boolean => {
    const rolePermissions = getPermissionsForRole(member.role)
    return rolePermissions.includes(permission)
  }

  const getRoleBadgeColor = (role: WorkspaceRole): string => {
    const colors: Record<WorkspaceRole, string> = {
      owner: 'bg-purple-100 text-purple-800',
      admin: 'bg-blue-100 text-blue-800',
      senior_doctor: 'bg-green-100 text-green-800',
      doctor: 'bg-teal-100 text-teal-800',
      resident: 'bg-yellow-100 text-yellow-800',
      nurse: 'bg-pink-100 text-pink-800',
      observer: 'bg-gray-100 text-gray-800',
    }
    return colors[role] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <p className="text-sm text-red-700">{error}</p>
      </div>
    )
  }

  if (members.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">Henüz üye bulunmuyor.</p>
      </div>
    )
  }

  const roles: WorkspaceRole[] = [
    'owner',
    'admin',
    'senior_doctor',
    'doctor',
    'resident',
    'nurse',
    'observer',
  ]

  return (
    <div className="space-y-4">
      {/* Members Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => (
          <div key={member.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            {/* Member Header */}
            <div className="mb-3 flex items-start justify-between">
              <div className="flex items-center space-x-3">
                {/* Avatar */}
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {member.profile?.full_name
                    ? member.profile.full_name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)
                    : '?'}
                </div>

                {/* Info */}
                <div>
                  <h3 className="font-medium text-gray-900">
                    {member.profile?.full_name || 'Unknown'}
                  </h3>
                  {member.profile?.title && (
                    <p className="text-sm text-gray-500">{member.profile.title}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Role Badge */}
            <div className="mb-3">
              {editingMember === member.id ? (
                <div className="space-y-2">
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as WorkspaceRole)}
                    className="w-full rounded-md border border-gray-300 px-3 py-1 text-sm"
                  >
                    {roles.map((r) => (
                      <option key={r} value={r}>
                        {getRoleLabel(r)}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500">{getRoleDescription(newRole)}</p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleUpdateRole(member.id, newRole)}
                      className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
                    >
                      Kaydet
                    </button>
                    <button
                      onClick={() => setEditingMember(null)}
                      className="rounded bg-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-300"
                    >
                      İptal
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getRoleBadgeColor(member.role)}`}
                  >
                    {getRoleLabel(member.role)}
                  </span>
                </div>
              )}
            </div>

            {/* Member Stats */}
            <div className="mb-3 space-y-1 text-sm text-gray-500">
              {member.profile?.specialty && (
                <div>
                  <span className="font-medium">Uzmanlık:</span> {member.profile.specialty}
                </div>
              )}
              <div>
                <span className="font-medium">Katılma:</span>{' '}
                {new Date(member.joined_at).toLocaleDateString('tr-TR')}
              </div>
              <div>
                <span className="font-medium">Durum:</span>{' '}
                <span className={member.status === 'active' ? 'text-green-600' : 'text-gray-400'}>
                  {member.status === 'active' ? 'Aktif' : 'İnaktif'}
                </span>
              </div>
            </div>

            {/* Custom Permissions Section */}
            {editingPermissions === member.id ? (
              <div className="mt-3 space-y-3 border-t pt-3">
                <div className="text-sm font-medium text-gray-700">Özel İzinler</div>
                <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-3">
                  {getAllPermissions().map((permission) => {
                    const isRoleBased = isRolePermission(member, permission)
                    const isSelected = selectedPermissions.includes(permission)
                    const isDisabled = isRoleBased // Role-based permissions disabled

                    return (
                      <label
                        key={permission}
                        className={`flex items-center space-x-2 rounded px-2 py-1 text-sm ${
                          isDisabled
                            ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                            : 'cursor-pointer hover:bg-gray-100'
                        } ${isSelected && !isDisabled ? 'bg-green-50 text-green-700' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected || isRoleBased}
                          disabled={isDisabled}
                          onChange={() => !isDisabled && togglePermission(permission)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
                        />
                        <span className={isDisabled ? 'line-through' : ''}>
                          {getPermissionLabel(permission)}
                        </span>
                        {isRoleBased && (
                          <span className="ml-auto text-xs text-gray-400">(Rol)</span>
                        )}
                      </label>
                    )
                  })}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleSavePermissions(member.id)}
                    className="flex-1 rounded bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700"
                  >
                    Kaydet
                  </button>
                  <button
                    onClick={() => {
                      setEditingPermissions(null)
                      setSelectedPermissions([])
                    }}
                    className="flex-1 rounded bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-300"
                  >
                    İptal
                  </button>
                </div>
              </div>
            ) : (
              /* Actions */
              canManageMembers &&
              member.role !== 'owner' && (
                <div className="flex flex-col space-y-2 border-t pt-3">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setEditingMember(member.id)
                        setNewRole(member.role)
                      }}
                      className="flex-1 rounded bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100"
                    >
                      Rolü Değiştir
                    </button>
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="flex-1 rounded bg-red-50 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                    >
                      Çıkar
                    </button>
                  </div>
                  <button
                    onClick={() => handleEditPermissions(member)}
                    className="w-full rounded bg-purple-50 px-3 py-1 text-xs font-medium text-purple-600 hover:bg-purple-100"
                  >
                    Özel İzinler
                  </button>
                  {/* Custom permissions indicator */}
                  {member.permissions &&
                    Array.isArray(member.permissions) &&
                    (member.permissions as Permission[]).length > 0 && (
                      <div className="text-xs text-purple-600">
                        {(member.permissions as Permission[]).length} özel izin aktif
                      </div>
                    )}
                </div>
              )
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h4 className="mb-2 font-medium text-gray-900">Özet</h4>
        <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <div>
            <p className="text-gray-500">Toplam Üye</p>
            <p className="text-lg font-semibold text-gray-900">{members.length}</p>
          </div>
          <div>
            <p className="text-gray-500">Aktif</p>
            <p className="text-lg font-semibold text-green-600">
              {members.filter((m) => m.status === 'active').length}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Admin/Owner</p>
            <p className="text-lg font-semibold text-blue-600">
              {members.filter((m) => ['owner', 'admin'].includes(m.role)).length}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Doktorlar</p>
            <p className="text-lg font-semibold text-teal-600">
              {
                members.filter((m) => ['senior_doctor', 'doctor', 'resident'].includes(m.role))
                  .length
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
