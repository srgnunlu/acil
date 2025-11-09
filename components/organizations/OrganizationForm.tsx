'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import type {
  CreateOrganizationInput,
  Organization,
  OrganizationType,
} from '@/types/multi-tenant.types'

interface OrganizationFormProps {
  organization?: Organization
  onSubmit: (data: CreateOrganizationInput | Partial<Organization>) => Promise<void>
  onCancel?: () => void
}

const organizationTypes: { value: OrganizationType; label: string }[] = [
  { value: 'hospital', label: 'Hastane' },
  { value: 'clinic', label: 'Klinik' },
  { value: 'health_center', label: 'Sağlık Merkezi' },
  { value: 'private_practice', label: 'Özel Muayenehane' },
]

export function OrganizationForm({ organization, onSubmit, onCancel }: OrganizationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: organization?.name || '',
    slug: organization?.slug || '',
    type: (organization?.type || 'clinic') as OrganizationType,
    contact_email: organization?.contact_email || '',
    contact_phone: organization?.contact_phone || '',
    address: organization?.address || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleNameChange = (name: string) => {
    if (!organization) {
      // Auto-generate slug for new organizations
      const generatedSlug = generateSlug(name)
      setFormData((prev) => ({ ...prev, name, slug: generatedSlug }))
    } else {
      // For existing organizations, only update name
      setFormData((prev) => ({ ...prev, name }))
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Organizasyon adı gereklidir'
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug gereklidir'
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug sadece küçük harf, rakam ve tire içerebilir'
    }

    if (formData.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      newErrors.contact_email = 'Geçerli bir e-posta adresi giriniz'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log('[OrganizationForm] Form submitted with data:', formData)

    if (!validate()) {
      console.log('[OrganizationForm] Validation failed:', errors)
      return
    }

    setIsSubmitting(true)
    try {
      console.log('[OrganizationForm] Calling onSubmit with:', formData)
      await onSubmit(formData)
      console.log('[OrganizationForm] Submit successful')
    } catch (error) {
      console.error('[OrganizationForm] Error submitting form:', error)
      // Error is handled by parent component
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Organizasyon Adı <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => handleNameChange(e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.name ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="Örn: Acıbadem Hastanesi"
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
      </div>

      {/* Slug */}
      <div>
        <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
          Slug <span className="text-red-500">*</span>
        </label>
        <input
          id="slug"
          type="text"
          value={formData.slug}
          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.slug ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="acibadem-hastanesi"
        />
        {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug}</p>}
        <p className="mt-1 text-xs text-gray-500">URL için kullanılacak benzersiz tanımlayıcı</p>
      </div>

      {/* Type */}
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
          Organizasyon Tipi <span className="text-red-500">*</span>
        </label>
        <select
          id="type"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as OrganizationType })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {organizationTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Contact Email */}
      <div>
        <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700 mb-1">
          İletişim E-postası
        </label>
        <input
          id="contact_email"
          type="email"
          value={formData.contact_email}
          onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.contact_email ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="info@example.com"
        />
        {errors.contact_email && (
          <p className="mt-1 text-sm text-red-600">{errors.contact_email}</p>
        )}
      </div>

      {/* Contact Phone */}
      <div>
        <label htmlFor="contact_phone" className="block text-sm font-medium text-gray-700 mb-1">
          İletişim Telefonu
        </label>
        <input
          id="contact_phone"
          type="tel"
          value={formData.contact_phone}
          onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="+90 555 123 4567"
        />
      </div>

      {/* Address */}
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
          Adres
        </label>
        <textarea
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Adres bilgisi..."
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            İptal
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Kaydediliyor...
            </>
          ) : organization ? (
            'Güncelle'
          ) : (
            'Oluştur'
          )}
        </button>
      </div>
    </form>
  )
}
