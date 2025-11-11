'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { ChevronDown, Check, Building2, Loader2, Settings, Plus } from 'lucide-react'
import Link from 'next/link'

const typeLabels: Record<string, string> = {
  hospital: 'Hastane',
  clinic: 'Klinik',
  health_center: 'Sağlık Merkezi',
  private_practice: 'Özel Muayenehane',
}

export function OrganizationSwitcher() {
  const { currentOrganization, organizations, switchOrganization, isLoading } = useWorkspace()
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1.5 bg-white border rounded-lg w-full max-w-full min-w-0 overflow-hidden">
        <Loader2 className="w-3 h-3 animate-spin text-gray-400 flex-shrink-0" />
        <span className="text-xs text-gray-500 truncate">Yükleniyor...</span>
      </div>
    )
  }

  if (!currentOrganization) {
    return (
      <div className="px-2 py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg w-full max-w-full min-w-0 overflow-hidden">
        <span className="text-xs text-yellow-700 truncate">Organizasyon bulunamadı</span>
      </div>
    )
  }

  // Only show switcher if user has multiple organizations
  if (organizations.length <= 1) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1.5 bg-white border rounded-lg w-full max-w-full min-w-0 overflow-hidden">
        {currentOrganization.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentOrganization.logo_url}
            alt={currentOrganization.name}
            className="w-5 h-5 rounded flex-shrink-0"
          />
        ) : (
          <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
        )}
        <span className="text-xs font-medium text-gray-900 truncate">
          {currentOrganization.name}
        </span>
      </div>
    )
  }

  return (
    <div className="relative w-full max-w-full">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1.5 bg-white border rounded-lg hover:bg-gray-50 transition-colors w-full max-w-full min-w-0 overflow-hidden"
      >
        <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-hidden">
          {currentOrganization.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentOrganization.logo_url}
              alt={currentOrganization.name}
              className="w-5 h-5 rounded flex-shrink-0"
            />
          ) : (
            <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
          )}
          <div className="flex flex-col items-start min-w-0 flex-1 overflow-hidden">
            <span className="text-xs font-medium text-gray-900 truncate w-full">
              {currentOrganization.name}
            </span>
            <span className="text-[10px] text-gray-500 truncate w-full">
              {typeLabels[currentOrganization.type] || currentOrganization.type}
            </span>
          </div>
        </div>
        <ChevronDown
          className={`w-3 h-3 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* Menu */}
          <div className="absolute top-full left-0 mt-2 w-full min-w-[280px] bg-white border rounded-lg shadow-lg z-20 max-h-[400px] overflow-y-auto">
            {/* Organizations List */}
            <div className="p-2">
              {organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={async () => {
                    setIsOpen(false)
                    // Organization'ı değiştir (cookie set edilir)
                    await switchOrganization(org.id)
                    // Cookie'nin set edilmesi için kısa bir bekleme
                    await new Promise((resolve) => setTimeout(resolve, 150))
                    // Organization değiştiğinde sayfayı yenile (Server Component'leri yeniden render et)
                    router.refresh()
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors ${
                    currentOrganization.id === org.id ? 'bg-blue-50' : ''
                  }`}
                >
                  {/* Logo */}
                  {org.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={org.logo_url} alt={org.name} className="w-8 h-8 rounded" />
                  ) : (
                    <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-white" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 flex flex-col items-start">
                    <span
                      className={`text-sm font-medium ${
                        currentOrganization.id === org.id ? 'text-blue-900' : 'text-gray-900'
                      }`}
                    >
                      {org.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {typeLabels[org.type] || org.type}
                    </span>
                  </div>

                  {/* Check Icon */}
                  {currentOrganization.id === org.id && (
                    <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>

            {/* No Organizations */}
            {organizations.length === 0 && (
              <div className="p-4 text-center text-sm text-gray-500">Organizasyon bulunamadı</div>
            )}

            {/* Organization Settings Link */}
            {currentOrganization && (
              <>
                <div className="border-t my-1" />
                <div className="p-2">
                  <Link
                    href={`/dashboard/organizations/${currentOrganization.id}/settings`}
                    onClick={() => setIsOpen(false)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Organizasyon Ayarları</span>
                  </Link>
                  <Link
                    href="/dashboard/organizations/new"
                    onClick={() => setIsOpen(false)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Yeni Organizasyon</span>
                  </Link>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
