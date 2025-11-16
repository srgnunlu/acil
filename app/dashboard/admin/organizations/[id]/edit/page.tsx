'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'

export default function AdminEditOrganizationPage() {
  const router = useRouter()
  const params = useParams()
  const orgId = params.id as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    type: 'hospital',
    subscription_tier: 'free',
    subscription_status: 'active',
    max_users: 10,
    max_workspaces: 3,
    max_patients_per_workspace: 50,
    contact_email: '',
    contact_phone: '',
    address: '',
  })

  useEffect(() => {
    async function fetchOrganization() {
      try {
        const response = await fetch(`/api/admin/organizations?org_id=${orgId}`)
        if (response.ok) {
          const data = await response.json()
          setFormData({
            name: data.name || '',
            slug: data.slug || '',
            type: data.type || 'hospital',
            subscription_tier: data.subscription_tier || 'free',
            subscription_status: data.subscription_status || 'active',
            max_users: data.max_users || 10,
            max_workspaces: data.max_workspaces || 3,
            max_patients_per_workspace: data.max_patients_per_workspace || 50,
            contact_email: data.contact_email || '',
            contact_phone: data.contact_phone || '',
            address: data.address || '',
          })
        }
      } catch (error) {
        console.error('Failed to fetch organization:', error)
      } finally {
        setLoading(false)
      }
    }

    if (orgId) {
      fetchOrganization()
    }
  }, [orgId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch('/api/admin/organizations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: orgId,
          ...formData,
        }),
      })

      if (response.ok) {
        router.push(`/dashboard/admin/organizations/${orgId}`)
      } else {
        const error = await response.json()
        alert(error.error || 'Organizasyon güncellenemedi')
      }
    } catch (error) {
      console.error('Failed to update organization:', error)
      alert('Organizasyon güncellenemedi')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/admin/organizations/${orgId}`}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Organizasyon Düzenle</h1>
          <p className="mt-1 text-gray-600">Organizasyon bilgilerini güncelleyin</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Organizasyon Adı <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Slug <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tip</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="hospital">Hastane</option>
              <option value="clinic">Klinik</option>
              <option value="health_center">Sağlık Merkezi</option>
              <option value="private_practice">Özel Muayenehane</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Abonelik Seviyesi</label>
            <select
              value={formData.subscription_tier}
              onChange={(e) => setFormData({ ...formData, subscription_tier: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="free">Ücretsiz</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Kurumsal</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Maksimum Kullanıcı</label>
            <input
              type="number"
              value={formData.max_users}
              onChange={(e) => setFormData({ ...formData, max_users: parseInt(e.target.value) || 10 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Maksimum Workspace</label>
            <input
              type="number"
              value={formData.max_workspaces}
              onChange={(e) =>
                setFormData({ ...formData, max_workspaces: parseInt(e.target.value) || 3 })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">İletişim Email</label>
          <input
            type="email"
            value={formData.contact_email}
            onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">İletişim Telefon</label>
          <input
            type="tel"
            value={formData.contact_phone}
            onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Adres</label>
          <textarea
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
        </div>

        <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
          <Link
            href={`/dashboard/admin/organizations/${orgId}`}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            İptal
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Kaydet
          </button>
        </div>
      </form>
    </div>
  )
}
