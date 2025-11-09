'use client'

import { useState, useEffect } from 'react'
import { Users, Edit2, Trash2, Loader2, Check, X } from 'lucide-react'
import type { WorkspaceRole } from '@/types/multi-tenant.types'

interface Member {
  id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  status: string
  profile?: {
    full_name?: string
    avatar_url?: string
    title?: string
    email?: string
  }
}

interface Workspace {
  id: string
  name: string
  icon: string
}

interface OrganizationMembersListProps {
  organizationId: string
  workspaces: Workspace[]
  onRefresh: () => void
}

export function OrganizationMembersList({
  organizationId,
  workspaces,
  onRefresh,
}: OrganizationMembersListProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingMember, setEditingMember] = useState<string | null>(null)
  const [editingWorkspaces, setEditingWorkspaces] = useState<Record<string, string[]>>({})
  const [workspaceRoles, setWorkspaceRoles] = useState<
    Record<string, Record<string, WorkspaceRole>>
  >({})

  useEffect(() => {
    fetchMembers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId])

  const fetchMembers = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/organizations/${organizationId}/members`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Members yüklenemedi')
      }

      console.log('[OrganizationMembersList] Fetched members:', data)
      setMembers(data.members || [])

      // Fetch workspace memberships for each member
      const memberWorkspaceData: Record<string, string[]> = {}
      const memberWorkspaceRoleData: Record<string, Record<string, WorkspaceRole>> = {}

      for (const member of data.members || []) {
        const workspaceIds: string[] = []
        const roles: Record<string, WorkspaceRole> = {}

        for (const workspace of workspaces) {
          const wsResponse = await fetch(`/api/workspaces/${workspace.id}/members`)
          const wsData = await wsResponse.json()

          if (wsData.members) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const wsMember = wsData.members.find((m: any) => m.user_id === member.user_id)
            if (wsMember) {
              workspaceIds.push(workspace.id)
              roles[workspace.id] = wsMember.role
            }
          }
        }

        memberWorkspaceData[member.id] = workspaceIds
        memberWorkspaceRoleData[member.id] = roles
      }

      setEditingWorkspaces(memberWorkspaceData)
      setWorkspaceRoles(memberWorkspaceRoleData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateMember = async (memberId: string) => {
    try {
      const workspaceIds = editingWorkspaces[memberId] || []
      const roles = workspaceRoles[memberId] || {}

      const workspaceRolesArray = workspaceIds.map((wsId) => roles[wsId] || 'doctor')

      const response = await fetch(`/api/organizations/${organizationId}/members/${memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspace_ids: workspaceIds,
          workspace_roles: workspaceRolesArray,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Üye güncellenemedi')
      }

      setEditingMember(null)
      await fetchMembers()
      onRefresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Bir hata oluştu')
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Bu üyeyi organizasyondan çıkarmak istediğinize emin misiniz?')) {
      return
    }

    try {
      const response = await fetch(`/api/organizations/${organizationId}/members/${memberId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Üye kaldırılamadı')
      }

      await fetchMembers()
      onRefresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Bir hata oluştu')
    }
  }

  const toggleWorkspaceAccess = (memberId: string, workspaceId: string) => {
    const currentWorkspaces = editingWorkspaces[memberId] || []
    const currentRoles = workspaceRoles[memberId] || {}

    if (currentWorkspaces.includes(workspaceId)) {
      // Remove workspace access
      setEditingWorkspaces({
        ...editingWorkspaces,
        [memberId]: currentWorkspaces.filter((id) => id !== workspaceId),
      })
      const newRoles = { ...currentRoles }
      delete newRoles[workspaceId]
      setWorkspaceRoles({
        ...workspaceRoles,
        [memberId]: newRoles,
      })
    } else {
      // Add workspace access
      setEditingWorkspaces({
        ...editingWorkspaces,
        [memberId]: [...currentWorkspaces, workspaceId],
      })
      setWorkspaceRoles({
        ...workspaceRoles,
        [memberId]: {
          ...currentRoles,
          [workspaceId]: 'doctor', // Default role
        },
      })
    }
  }

  const updateWorkspaceRole = (memberId: string, workspaceId: string, role: WorkspaceRole) => {
    setWorkspaceRoles({
      ...workspaceRoles,
      [memberId]: {
        ...(workspaceRoles[memberId] || {}),
        [workspaceId]: role,
      },
    })
  }

  const workspaceRoleOptions: WorkspaceRole[] = [
    'doctor',
    'nurse',
    'resident',
    'senior_doctor',
    'admin',
    'observer',
  ]

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

  return (
    <div className="space-y-4">
      {members.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Henüz üye yok</p>
        </div>
      ) : (
        members.map((member) => {
          const isEditing = editingMember === member.id
          const memberWorkspaces = editingWorkspaces[member.id] || []
          const memberRoles = workspaceRoles[member.id] || {}

          return (
            <div key={member.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {member.profile?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={member.profile.avatar_url}
                      alt={member.profile.full_name || ''}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <Users className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">
                      {member.profile?.full_name ||
                        member.profile?.email ||
                        `Kullanıcı ${member.user_id.slice(0, 8)}`}
                    </p>
                    <p className="text-sm text-gray-500">
                      {member.profile?.email || member.profile?.title || member.role || 'Üye'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    {member.role === 'owner' && 'Owner'}
                    {member.role === 'admin' && 'Admin'}
                    {member.role === 'member' && 'Üye'}
                  </span>
                  {!isEditing ? (
                    <>
                      <button
                        onClick={() => setEditingMember(member.id)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Düzenle"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Kaldır"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleUpdateMember(member.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Kaydet"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingMember(null)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="İptal"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-3">Workspace Erişimleri</p>
                  <div className="space-y-2">
                    {workspaces.map((workspace) => {
                      const hasAccess = memberWorkspaces.includes(workspace.id)
                      const role = memberRoles[workspace.id] || 'doctor'

                      return (
                        <div
                          key={workspace.id}
                          className={`flex items-center justify-between p-2 rounded-lg ${
                            hasAccess
                              ? 'bg-blue-50 border border-blue-200'
                              : 'bg-gray-50 border border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={hasAccess}
                              onChange={() => toggleWorkspaceAccess(member.id, workspace.id)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-xl">{workspace.icon}</span>
                            <span className="text-sm font-medium text-gray-900">
                              {workspace.name}
                            </span>
                          </div>
                          {hasAccess && (
                            <select
                              value={role}
                              onChange={(e) =>
                                updateWorkspaceRole(
                                  member.id,
                                  workspace.id,
                                  e.target.value as WorkspaceRole
                                )
                              }
                              className="text-sm rounded-md border border-gray-300 px-2 py-1 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              {workspaceRoleOptions.map((r) => (
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
                      )
                    })}
                  </div>
                </div>
              )}

              {!isEditing && memberWorkspaces.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Erişebildiği Workspace&apos;ler
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {memberWorkspaces.map((wsId) => {
                      const workspace = workspaces.find((w) => w.id === wsId)
                      const role = memberRoles[wsId]
                      return workspace ? (
                        <span
                          key={wsId}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                        >
                          <span>{workspace.icon}</span>
                          <span>{workspace.name}</span>
                          {role && <span className="text-gray-500">({role})</span>}
                        </span>
                      ) : null
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
