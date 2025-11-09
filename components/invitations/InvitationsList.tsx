// ============================================
// INVITATIONS LIST
// ============================================
// Display list of pending invitations with actions

'use client'

import { useState, useEffect } from 'react'
import { getRoleLabel } from '@/lib/permissions'
import type { WorkspaceInvitationWithDetails, InvitationStatus } from '@/types/invitation.types'

interface InvitationsListProps {
  workspaceId: string
  onUpdate?: () => void
}

export function InvitationsList({ workspaceId, onUpdate }: InvitationsListProps) {
  const [invitations, setInvitations] = useState<WorkspaceInvitationWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchInvitations()
  }, [workspaceId])

  const fetchInvitations = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/invitations?workspace_id=${workspaceId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Invitations yüklenemedi')
      }

      setInvitations(data.invitations || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (invitationId: string) => {
    if (!confirm('Bu invitation\'ı iptal etmek istediğinize emin misiniz?')) {
      return
    }

    try {
      setActionLoading(invitationId)
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'cancel',
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Invitation iptal edilemedi')
      }

      await fetchInvitations()
      onUpdate?.()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setActionLoading(null)
    }
  }

  const handleResend = async (invitationId: string) => {
    try {
      setActionLoading(invitationId)
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'resend',
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Invitation yeniden gönderilemedi')
      }

      await fetchInvitations()
      alert('Invitation başarıyla yeniden gönderildi')
      onUpdate?.()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (invitationId: string) => {
    if (!confirm('Bu invitation\'ı silmek istediğinize emin misiniz?')) {
      return
    }

    try {
      setActionLoading(invitationId)
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Invitation silinemedi')
      }

      await fetchInvitations()
      onUpdate?.()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (status: InvitationStatus) => {
    const styles: Record<InvitationStatus, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      declined: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-gray-100 text-gray-800',
    }

    const labels: Record<InvitationStatus, string> = {
      pending: 'Bekliyor',
      accepted: 'Kabul Edildi',
      declined: 'Reddedildi',
      expired: 'Süresi Doldu',
      cancelled: 'İptal Edildi',
    }

    return (
      <span className={`inline-flex rounded-full px-2 text-xs font-semibold ${styles[status]}`}>
        {labels[status]}
      </span>
    )
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

  if (invitations.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">Henüz invitation bulunmuyor.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Rol
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Durum
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Gönderen
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Tarih
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              İşlemler
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {invitations.map((invitation) => (
            <tr key={invitation.id}>
              <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                {invitation.email}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {getRoleLabel(invitation.role)}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {getStatusBadge(invitation.status)}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {invitation.inviter?.full_name || 'Unknown'}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {new Date(invitation.invited_at).toLocaleDateString('tr-TR')}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                <div className="flex space-x-2">
                  {invitation.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleResend(invitation.id)}
                        disabled={actionLoading === invitation.id}
                        className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                      >
                        Yeniden Gönder
                      </button>
                      <button
                        onClick={() => handleCancel(invitation.id)}
                        disabled={actionLoading === invitation.id}
                        className="text-yellow-600 hover:text-yellow-900 disabled:opacity-50"
                      >
                        İptal
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(invitation.id)}
                    disabled={actionLoading === invitation.id}
                    className="text-red-600 hover:text-red-900 disabled:opacity-50"
                  >
                    Sil
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
