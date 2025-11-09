// ============================================
// WORKSPACE MEMBERS LIST
// ============================================
// Display workspace members with role management

'use client'

import { useState, useEffect } from 'react'
import { getRoleLabel, getRoleDescription } from '@/lib/permissions'
import type { WorkspaceMemberWithProfile } from '@/types/multi-tenant.types'
import type { WorkspaceRole } from '@/types/multi-tenant.types'

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

  const canManageMembers = currentUserRole && ['owner', 'admin'].includes(currentUserRole)

  useEffect(() => {
    fetchMembers()
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
    if (!confirm('Bu üyeyi workspace\'ten çıkarmak istediğinize emin misiniz?')) {
      return
    }

    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/members?member_id=${memberId}`,
        {
          method: 'DELETE',
        }
      )

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
          <div
            key={member.id}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
          >
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
                <span
                  className={
                    member.status === 'active' ? 'text-green-600' : 'text-gray-400'
                  }
                >
                  {member.status === 'active' ? 'Aktif' : 'İnaktif'}
                </span>
              </div>
            </div>

            {/* Actions */}
            {canManageMembers && member.role !== 'owner' && (
              <div className="flex space-x-2 border-t pt-3">
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
                members.filter((m) =>
                  ['senior_doctor', 'doctor', 'resident'].includes(m.role)
                ).length
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
