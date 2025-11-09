'use client'

import { useEffect, useState } from 'react'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import type { PatientCategory } from '@/types'
import { Plus, Edit2, Trash2, Tag, Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/Toast'

interface CategoryWithCount extends PatientCategory {
  patient_count?: number
}

export function CategoryList() {
  const { currentWorkspace } = useWorkspace()
  const [categories, setCategories] = useState<CategoryWithCount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { showToast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    color: '#6b7280',
    icon: '',
    description: '',
    is_default: false,
  })

  useEffect(() => {
    if (currentWorkspace) {
      loadCategories()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWorkspace])

  async function loadCategories() {
    if (!currentWorkspace) return

    try {
      setIsLoading(true)
      const res = await fetch(`/api/workspaces/${currentWorkspace.id}/categories`)
      if (!res.ok) throw new Error('Failed to fetch categories')

      const data = await res.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Error loading categories:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Generate slug from name
  function generateSlug(name: string): string {
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

  function handleNameChange(name: string) {
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name),
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!currentWorkspace) return

    if (!formData.name.trim() || !formData.slug.trim()) {
      showToast('Kategori adı ve slug gereklidir', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/workspaces/${currentWorkspace.id}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          slug: formData.slug.trim(),
          color: formData.color,
          icon: formData.icon || null,
          description: formData.description || null,
          is_default: formData.is_default,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Kategori oluşturulamadı')
      }

      showToast('Kategori başarıyla oluşturuldu', 'success')
      setIsModalOpen(false)
      setFormData({
        name: '',
        slug: '',
        color: '#6b7280',
        icon: '',
        description: '',
        is_default: false,
      })
      await loadCategories()
    } catch (error) {
      console.error('Error creating category:', error)
      showToast(error instanceof Error ? error.message : 'Kategori oluşturulamadı', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!currentWorkspace) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-700">Lütfen bir workspace seçin</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <p className="text-sm text-gray-500">Kategoriler yükleniyor...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border">
      {/* Header */}
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Hasta Kategorileri</h2>
          <span className="text-sm text-gray-500">({categories.length})</span>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Kategori Ekle
        </button>
      </div>

      {/* Categories List */}
      <div className="divide-y">
        {categories.map((category) => (
          <div key={category.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              {/* Category Info */}
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: category.color }}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{category.name}</span>
                    {category.is_default && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                        Varsayılan
                      </span>
                    )}
                    {category.is_system && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                        Sistem
                      </span>
                    )}
                  </div>
                  {category.description && (
                    <p className="text-sm text-gray-500 mt-0.5">{category.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">{category.patient_count || 0} hasta</p>
                </div>
              </div>

              {/* Actions */}
              {!category.is_system && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      /* TODO: Edit modal */
                    }}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Düzenle"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      /* TODO: Delete confirmation */
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Sil"
                    disabled={!!(category.patient_count && category.patient_count > 0)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {categories.length === 0 && (
          <div className="px-6 py-12 text-center">
            <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Henüz kategori yok</p>
            <p className="text-sm text-gray-400 mt-1">
              Kategori eklemek için yukarıdaki butonu kullanın
            </p>
          </div>
        )}
      </div>

      {/* Add Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title="Yeni Kategori Ekle"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label htmlFor="category-name" className="block text-sm font-medium text-gray-700 mb-2">
              Kategori Adı <span className="text-red-500">*</span>
            </label>
            <input
              id="category-name"
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition disabled:bg-gray-50 disabled:cursor-not-allowed"
              placeholder="Örn: Acil Servis"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Slug */}
          <div>
            <label htmlFor="category-slug" className="block text-sm font-medium text-gray-700 mb-2">
              Slug <span className="text-red-500">*</span>
            </label>
            <input
              id="category-slug"
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="ornek: acil-servis"
              required
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1.5">
              URL için kullanılacak benzersiz tanımlayıcı
            </p>
          </div>

          {/* Color */}
          <div>
            <label
              htmlFor="category-color"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Renk
            </label>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  id="category-color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-14 h-14 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                  style={{ backgroundColor: formData.color }}
                />
              </div>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => {
                  const value = e.target.value
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(value) || value === '') {
                    setFormData({ ...formData, color: value || '#6b7280' })
                  }
                }}
                className="flex-1 px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition font-mono disabled:bg-gray-50 disabled:cursor-not-allowed"
                placeholder="#6b7280"
                maxLength={7}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Icon */}
          <div>
            <label htmlFor="category-icon" className="block text-sm font-medium text-gray-700 mb-2">
              İkon (Emoji)
            </label>
            <div className="relative">
              <input
                id="category-icon"
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="w-full px-4 py-2.5 text-2xl text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition disabled:bg-gray-50 disabled:cursor-not-allowed"
                placeholder="🏥"
                maxLength={2}
                disabled={isSubmitting}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1.5">Tek bir emoji karakteri (opsiyonel)</p>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="category-description"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Açıklama
            </label>
            <textarea
              id="category-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition disabled:bg-gray-50 disabled:cursor-not-allowed"
              rows={3}
              placeholder="Kategori hakkında kısa bir açıklama..."
              disabled={isSubmitting}
            />
          </div>

          {/* Is Default */}
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <input
              id="category-default"
              type="checkbox"
              checked={formData.is_default}
              onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
              className="w-4 h-4 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer disabled:cursor-not-allowed"
              disabled={isSubmitting}
            />
            <div className="flex-1">
              <label
                htmlFor="category-default"
                className="text-sm font-medium text-gray-700 cursor-pointer"
              >
                Varsayılan kategori olarak ayarla
              </label>
              <p className="text-xs text-gray-500 mt-0.5">
                Yeni hastalar otomatik olarak bu kategoriye atanacak
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-5 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Oluşturuluyor...' : 'Oluştur'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
