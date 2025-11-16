'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Loader2 } from 'lucide-react'

interface AdminOrganizationFormProps {
  organization?: {
    id: string
    name: string
    slug: string
    type: string
    subscription_tier: string
    subscription_status: string
    max_users: number
    max_workspaces: number
    max_patients_per_workspace: number
  }
}

export function AdminOrganizationForm({ organization }: AdminOrganizationFormProps) {
  const router = useRouter()
  const isEdit = !!organization

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: organization?.name || '',
    slug: organization?.slug || '',
    type: organization?.type || 'hospital',
    subscription_tier: organization?.subscription_tier || 'free',
    subscription_status: organization?.subscription_status || 'active',
    max_users: organization?.max_users || 50,
    max_workspaces: organization?.max_workspaces || 10,
    max_patients_per_workspace: organization?.max_patients_per_workspace || 100,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const url = '/api/admin/organizations'
      const method = isEdit ? 'PATCH' : 'POST'
      const body = isEdit ? { org_id: organization.id, ...formData } : formData

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'İşlem başarısız')
      }

      router.push('/dashboard/admin/organizations')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) : value,
    }))
  }

  const generateSlug = () => {
    const slug = formData.name
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    setFormData((prev) => ({ ...prev, slug }))
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Temel Bilgiler
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Organizasyon Adı *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onBlur={generateSlug}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Örn: Ankara Şehir Hastanesi"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Slug (URL Friendly) *
            </label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              required
              disabled={isEdit}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              placeholder="ankara-sehir-hastanesi"
            />
            <p className="mt-1 text-xs text-gray-500">
              {isEdit ? 'Slug değiştirilemez' : 'Organizasyon adından otomatik oluşturulur'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Organizasyon Tipi
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="hospital">Hastane</option>
              <option value="clinic">Klinik</option>
              <option value="health_center">Sağlık Merkezi</option>
              <option value="private_practice">Özel Muayenehane</option>
            </select>
          </div>
        </div>

        {/* Subscription */}
        <div className="space-y-4 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Abonelik Bilgileri</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Abonelik Planı
              </label>
              <select
                name="subscription_tier"
                value={formData.subscription_tier}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Abonelik Durumu
              </label>
              <select
                name="subscription_status"
                value={formData.subscription_status}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="active">Aktif</option>
                <option value="trial">Deneme</option>
                <option value="inactive">İnaktif</option>
                <option value="cancelled">İptal Edildi</option>
              </select>
            </div>
          </div>
        </div>

        {/* Limits */}
        <div className="space-y-4 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Limitler</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maksimum Kullanıcı
              </label>
              <input
                type="number"
                name="max_users"
                value={formData.max_users}
                onChange={handleChange}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maksimum Workspace
              </label>
              <input
                type="number"
                name="max_workspaces"
                value={formData.max_workspaces}
                onChange={handleChange}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Workspace Başına Hasta
              </label>
              <input
                type="number"
                name="max_patients_per_workspace"
                value={formData.max_patients_per_workspace}
                onChange={handleChange}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? 'Güncelle' : 'Oluştur'}
          </button>
        </div>
      </form>
    </div>
  )
}
