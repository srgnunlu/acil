'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { OrganizationForm } from '@/components/organizations/OrganizationForm'
import { WorkspaceManagement } from '@/components/organizations/WorkspaceManagement'
import { InviteOrganizationMemberForm } from '@/components/organizations/InviteOrganizationMemberForm'
import { OrganizationMembersList } from '@/components/organizations/OrganizationMembersList'
import {
  Building2,
  ArrowLeft,
  Loader2,
  Briefcase,
  Users,
  Settings as SettingsIcon,
  Trash2,
  Plus,
} from 'lucide-react'
import Link from 'next/link'
import type { Organization, UpdateOrganizationInput } from '@/types/multi-tenant.types'

export default function OrganizationSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const organizationId = params.id as string

  const [organization, setOrganization] = useState<Organization | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [workspaces, setWorkspaces] = useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  const [members, setMembers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'general' | 'workspaces' | 'members'>('general')
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showInviteForm, setShowInviteForm] = useState(false)

  useEffect(() => {
    fetchOrganization()

    // Check for tab parameter in URL
    const urlParams = new URLSearchParams(window.location.search)
    const tab = urlParams.get('tab')
    if (tab && ['general', 'workspaces', 'members'].includes(tab)) {
      setActiveTab(tab as 'general' | 'workspaces' | 'members')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId])

  const fetchOrganization = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch organization
      const response = await fetch(`/api/organizations/${organizationId}`)
      if (!response.ok) {
        throw new Error('Organizasyon bulunamadı')
      }
      const data = await response.json()
      setOrganization(data.organization)

      // Fetch workspaces
      const workspacesResponse = await fetch(`/api/workspaces?organization_id=${organizationId}`)
      if (workspacesResponse.ok) {
        const workspacesData = await workspacesResponse.json()
        const fetchedWorkspaces = workspacesData.workspaces || []
        setWorkspaces(fetchedWorkspaces)

        // Fetch organization members directly
        const membersResponse = await fetch(`/api/organizations/${organizationId}/members`)
        if (membersResponse.ok) {
          const membersData = await membersResponse.json()
          setMembers(membersData.members || [])
        } else {
          setMembers([])
        }
      } else {
        console.error('Failed to fetch workspaces:', workspacesResponse.statusText)
        setWorkspaces([])
        setMembers([])
      }
    } catch (err) {
      console.error('Error fetching organization:', err)
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdate = async (data: UpdateOrganizationInput) => {
    try {
      setError(null)
      const response = await fetch(`/api/organizations/${organizationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Güncelleme başarısız')
      }

      const result = await response.json()
      setOrganization(result.organization)
      alert('Organizasyon başarıyla güncellendi')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Bu organizasyonu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
      return
    }

    try {
      setIsDeleting(true)
      const response = await fetch(`/api/organizations/${organizationId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Silme başarısız')
      }

      router.push('/dashboard/organizations')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Organizasyon bulunamadı</h2>
          <Link href="/dashboard/organizations" className="mt-4 text-blue-600 hover:text-blue-700">
            Organizasyonlara Dön
          </Link>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'general', label: 'Genel', icon: SettingsIcon },
    { id: 'workspaces', label: "Workspace'ler", icon: Briefcase },
    { id: 'members', label: 'Üyeler', icon: Users },
  ] as const

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/organizations"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Organizasyonlara Dön
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {organization.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={organization.logo_url}
                alt={organization.name}
                className="w-12 h-12 rounded-lg"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{organization.name}</h1>
              <p className="mt-1 text-gray-600">Organizasyon ayarları ve yönetimi</p>
            </div>
          </div>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Siliniyor...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Sil
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="rounded-lg bg-white p-6 shadow">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {activeTab === 'general' && (
          <div>
            <h2 className="mb-6 text-xl font-semibold text-gray-900">Genel Bilgiler</h2>
            <OrganizationForm organization={organization} onSubmit={handleUpdate} />
          </div>
        )}

        {activeTab === 'workspaces' && (
          <WorkspaceManagement
            organizationId={organizationId}
            workspaces={workspaces}
            onRefresh={fetchOrganization}
          />
        )}

        {activeTab === 'members' && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Üyeler</h2>
              {!showInviteForm && (
                <button
                  onClick={() => setShowInviteForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Üye Davet Et
                </button>
              )}
            </div>

            {showInviteForm ? (
              <div className="mb-6">
                <InviteOrganizationMemberForm
                  organizationId={organizationId}
                  workspaces={workspaces}
                  onSuccess={() => {
                    setShowInviteForm(false)
                    fetchOrganization()
                  }}
                  onCancel={() => setShowInviteForm(false)}
                />
              </div>
            ) : (
              <OrganizationMembersList
                organizationId={organizationId}
                workspaces={workspaces}
                onRefresh={fetchOrganization}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
