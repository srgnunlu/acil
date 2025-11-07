'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const age = formData.get('age') as string
    const gender = formData.get('gender') as string

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Kullanıcı oturumu bulunamadı')
      }

      const { data, error } = await supabase
        .from('patients')
        .insert({
          user_id: user.id,
          name,
          age: age ? parseInt(age) : null,
          gender: gender || null,
          status: 'active',
        })
        .select()
        .single()

      if (error) throw error

      // Hasta detay sayfasına yönlendir
      router.push(`/dashboard/patients/${data.id}`)
      router.refresh()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Hasta eklenirken bir hata oluştu'
      setError(errorMessage)
      setLoading(false)
    }
  }

  if (!canAddPatient) {
    return (
      <button
        onClick={() => {
          alert(
            `Hasta limitinize ulaştınız (${currentCount}/${limit}). ${
              tier === 'free' ? 'Pro versiyona geçerek sınırsız hasta ekleyebilirsiniz.' : ''
            }`
          )
        }}
        className="px-6 py-3 bg-gray-300 text-gray-600 rounded-lg font-semibold cursor-not-allowed"
      >
        Hasta Ekle
      </button>
    )
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg hover:shadow-xl"
      >
        + Yeni Hasta Ekle
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Yeni Hasta Ekle</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Hasta Adı Soyadı *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Ahmet Yılmaz"
                />
              </div>

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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="45"
                />
              </div>

              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                  Cinsiyet
                </label>
                <select
                  id="gender"
                  name="gender"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">Seçiniz</option>
                  <option value="Erkek">Erkek</option>
                  <option value="Kadın">Kadın</option>
                </select>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                  disabled={loading}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Ekleniyor...' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
