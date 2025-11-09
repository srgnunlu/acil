'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { X, UserPlus, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { useCurrentWorkspace } from '@/contexts/WorkspaceContext'
import type { PatientCategory } from '@/types'

interface AddPatientButtonProps {
  canAddPatient: boolean
  currentCount: number
  limit: number
  tier: string
}

export function AddPatientButton({
  canAddPatient,
  currentCount,
  limit,
  tier,
}: AddPatientButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<PatientCategory[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const router = useRouter()
  const { showToast } = useToast()
  const currentWorkspace = useCurrentWorkspace()

  // Load categories when workspace changes or modal opens
  useEffect(() => {
    if (isOpen && currentWorkspace?.id) {
      loadCategories()
    }
  }, [isOpen, currentWorkspace?.id])

  const loadCategories = async () => {
    if (!currentWorkspace?.id) return

    setLoadingCategories(true)
    try {
      const response = await fetch(`/api/workspaces/${currentWorkspace.id}/categories`)
      if (!response.ok) throw new Error('Failed to load categories')

      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Error loading categories:', error)
      showToast('Kategoriler yüklenemedi', 'error')
    } finally {
      setLoadingCategories(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!currentWorkspace) {
      showToast('Lütfen bir workspace seçin', 'error')
      return
    }

    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const age = formData.get('age') as string
    const gender = formData.get('gender') as string
    const categoryId = formData.get('category_id') as string

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Kullanıcı oturumu bulunamadı')
      }

      // Kullanıcının aktif workspace'ini bul
      const { data: membership, error: membershipError } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(1)
        .single()

      if (membershipError || !membership) {
        throw new Error('Aktif workspace bulunamadı. Lütfen sayfayı yenileyin.')
      }

      const { data, error } = await supabase
        .from('patients')
        .insert({
          workspace_id: membership.workspace_id,
          user_id: user.id,
          workspace_id: currentWorkspace.id,
          organization_id: currentWorkspace.organization_id,
          category_id: categoryId || null,
          name,
          age: age ? parseInt(age) : null,
          gender: gender || null,
          status: 'active',
          workflow_state: 'intake',
          admission_date: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      showToast('Hasta başarıyla eklendi!', 'success')
      setIsOpen(false)

      // Hasta detay sayfasına yönlendir
      setTimeout(() => {
        router.push(`/dashboard/patients/${data.id}`)
        router.refresh()
      }, 500)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Hasta eklenirken bir hata oluştu'
      showToast(errorMessage, 'error')
      setLoading(false)
    }
  }

  if (!canAddPatient) {
    return (
      <button
        onClick={() => {
          showToast(
            `Hasta limitinize ulaştınız (${currentCount}/${limit}). ${
              tier === 'free' ? 'Pro versiyona geçerek sınırsız hasta ekleyebilirsiniz.' : ''
            }`,
            'warning'
          )
        }}
        className="px-6 py-3 bg-gray-300 text-gray-600 rounded-lg font-semibold cursor-not-allowed flex items-center gap-2"
        aria-label="Hasta limitine ulaşıldı"
      >
        <UserPlus className="w-5 h-5" />
        Hasta Ekle
      </button>
    )
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
        aria-label="Yeni hasta ekle"
      >
        <UserPlus className="w-5 h-5" />
        Yeni Hasta Ekle
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in"
          onClick={() => !loading && setIsOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Yeni Hasta Ekle</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
                disabled={loading}
                aria-label="Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Workspace info */}
              {currentWorkspace && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Workspace:</span>{' '}
                    <span className="text-blue-700">{currentWorkspace.name}</span>
                  </p>
                </div>
              )}

              {!currentWorkspace && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Lütfen sol üstten bir workspace seçin
                  </p>
                </div>
              )}

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Hasta Adı Soyadı <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  autoFocus
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white text-gray-900 placeholder-gray-400 transition-colors"
                  placeholder="Ahmet Yılmaz"
                  disabled={loading}
                />
              </div>

              {/* Category selection */}
              {currentWorkspace && (
                <div>
                  <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-2">
                    Kategori
                  </label>
                  <select
                    id="category_id"
                    name="category_id"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white text-gray-900 transition-colors"
                    disabled={loading || loadingCategories}
                  >
                    <option value="">Kategori seçiniz (opsiyonel)</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                        {category.is_system && ' (Sistem)'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
                    Yaş
                  </label>
                  <input
                    id="age"
                    name="age"
                    type="number"
                    min="0"
                    max="150"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white text-gray-900 placeholder-gray-400 transition-colors"
                    placeholder="45"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                    Cinsiyet
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white text-gray-900 transition-colors"
                    disabled={loading}
                  >
                    <option value="">Seçiniz</option>
                    <option value="Erkek">Erkek</option>
                    <option value="Kadın">Kadın</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Ekleniyor...
                    </>
                  ) : (
                    'Hasta Ekle'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
