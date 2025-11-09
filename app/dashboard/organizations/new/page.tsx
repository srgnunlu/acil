'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { OrganizationForm } from '@/components/organizations/OrganizationForm'
import { Building2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { CreateOrganizationInput } from '@/types/multi-tenant.types'

export default function NewOrganizationPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (data: CreateOrganizationInput) => {
    try {
      setError(null)
      console.log('[NewOrganization] Submitting organization data:', data)

      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      console.log('[NewOrganization] Response status:', response.status, response.statusText)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('[NewOrganization] API error:', errorData)
        throw new Error(errorData.error || `Organizasyon oluşturulamadı (${response.status})`)
      }

      const result = await response.json()
      console.log('[NewOrganization] Success, organization created:', result.organization?.id)

      if (!result.organization?.id) {
        throw new Error('Organizasyon oluşturuldu ancak ID alınamadı')
      }

      // Refresh the page to show the new organization in the list
      // Use router.refresh() to trigger a server-side refresh
      router.refresh()

      // Navigate to settings page
      router.push(`/dashboard/organizations/${result.organization.id}/settings`)
    } catch (err) {
      console.error('[NewOrganization] Error in handleSubmit:', err)
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/organizations"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Organizasyonlara Dön
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Yeni Organizasyon</h1>
            <p className="mt-1 text-gray-600">Yeni bir organizasyon oluşturun</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <OrganizationForm onSubmit={handleSubmit} onCancel={() => router.back()} />
      </div>
    </div>
  )
}
