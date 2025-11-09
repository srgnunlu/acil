'use client'

import { Building2, Users, Briefcase, MoreVertical, Settings, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import type { Organization } from '@/types/multi-tenant.types'

interface OrganizationCardProps {
  organization: Organization
  workspaceCount?: number
  memberCount?: number
  onSelect?: (id: string) => void
  onDelete?: (id: string) => void
}

const typeLabels: Record<string, string> = {
  hospital: 'Hastane',
  clinic: 'Klinik',
  health_center: 'Sağlık Merkezi',
  private_practice: 'Özel Muayenehane',
}

const tierLabels: Record<string, string> = {
  free: 'Ücretsiz',
  pro: 'Pro',
  enterprise: 'Kurumsal',
}

export function OrganizationCard({
  organization,
  workspaceCount = 0,
  memberCount = 0,
  onSelect,
  onDelete,
}: OrganizationCardProps) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1">
          {/* Logo */}
          <div className="flex-shrink-0">
            {organization.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={organization.logo_url}
                alt={organization.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">{organization.name}</h3>
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                {tierLabels[organization.subscription_tier] || organization.subscription_tier}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {typeLabels[organization.type] || organization.type}
            </p>

            {/* Stats */}
            <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Briefcase className="w-4 h-4" />
                <span>{workspaceCount} Workspace</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{memberCount} Üye</span>
              </div>
            </div>

            {/* Contact Info */}
            {(organization.contact_email || organization.contact_phone) && (
              <div className="mt-3 text-xs text-gray-500">
                {organization.contact_email && <div>{organization.contact_email}</div>}
                {organization.contact_phone && <div>{organization.contact_phone}</div>}
              </div>
            )}
          </div>
        </div>

        {/* Actions Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                <Link
                  href={`/dashboard/organizations/${organization.id}/settings`}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg"
                  onClick={() => setShowMenu(false)}
                >
                  <Settings className="w-4 h-4" />
                  Ayarlar
                </Link>
                {onSelect && (
                  <button
                    onClick={() => {
                      onSelect(organization.id)
                      setShowMenu(false)
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Seç
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => {
                      if (confirm('Bu organization&apos;ı silmek istediğinize emin misiniz?')) {
                        onDelete(organization.id)
                      }
                      setShowMenu(false)
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 last:rounded-b-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                    Sil
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
