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
      <div className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg">
        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        <span className="text-sm text-gray-500">Yükleniyor...</span>
      </div>
    )
  }

  if (!currentOrganization) {
    return (
      <div className="px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
        <span className="text-sm text-yellow-700">Organizasyon bulunamadı</span>
      </div>
    )
  }

  // Only show switcher if user has multiple organizations
  if (organizations.length <= 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg">
        {currentOrganization.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentOrganization.logo_url}
            alt={currentOrganization.name}
            className="w-6 h-6 rounded"
          />
        ) : (
          <Building2 className="w-5 h-5 text-gray-400" />
        )}
        <span className="text-sm font-medium text-gray-900">{currentOrganization.name}</span>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg hover:bg-gray-50 transition-colors min-w-[200px]"
      >
        <div className="flex items-center gap-2 flex-1">
          {currentOrganization.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentOrganization.logo_url}
              alt={currentOrganization.name}
              className="w-6 h-6 rounded"
            />
          ) : (
            <Building2 className="w-5 h-5 text-gray-400" />
          )}
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium text-gray-900">{currentOrganization.name}</span>
            <span className="text-xs text-gray-500">
              {typeLabels[currentOrganization.type] || currentOrganization.type}
            </span>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
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
