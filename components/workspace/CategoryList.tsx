'use client'

import { useEffect, useState } from 'react'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import type { PatientCategory } from '@/types'
import { Plus, Edit2, Trash2, Tag } from 'lucide-react'

interface CategoryWithCount extends PatientCategory {
  patient_count?: number
}

export function CategoryList() {
  const { currentWorkspace } = useWorkspace()
  const [categories, setCategories] = useState<CategoryWithCount[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (currentWorkspace) {
      loadCategories()
    }
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
          onClick={() => {
            /* TODO: Add category modal */
          }}
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
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">Varsayılan</span>
                    )}
                    {category.is_system && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">Sistem</span>
                    )}
                  </div>
                  {category.description && <p className="text-sm text-gray-500 mt-0.5">{category.description}</p>}
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
                    disabled={category.patient_count && category.patient_count > 0}
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
            <p className="text-sm text-gray-400 mt-1">Kategori eklemek için yukarıdaki butonu kullanın</p>
          </div>
        )}
      </div>
    </div>
  )
}
