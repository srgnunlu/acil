'use client'

import { Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export function SetupContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Workspace oluşturuluyor...')
  const router = useRouter()

  useEffect(() => {
    const initializeWorkspace = async () => {
      try {
        const response = await fetch('/api/setup/initialize-workspace', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        const data = await response.json()

        if (!response.ok) {
          setStatus('error')
          setMessage(data.error || 'Workspace oluşturulamadı. Lütfen tekrar deneyin.')
          return
        }

        setStatus('success')
        setMessage('Workspace başarıyla oluşturuldu! Yönlendiriliyorsunuz...')

        // 2 saniye sonra dashboard'a yönlendir
        setTimeout(() => {
          router.push('/dashboard/patients')
        }, 2000)
      } catch (error) {
        console.error('Setup error:', error)
        setStatus('error')
        setMessage('Beklenmeyen hata oluştu. Lütfen sayfayı yenileyin.')
      }
    }

    initializeWorkspace()
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-12 text-center">
        {status === 'loading' && (
          <>
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Workspace Oluşturuluyor...</h1>
            <p className="text-gray-600 leading-relaxed">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Tamamlandı!</h1>
            <p className="text-gray-600 leading-relaxed text-green-700">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Hata Oluştu</h1>
            <p className="text-gray-600 leading-relaxed text-red-700 mb-8">{message}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Tekrar Deneyin
            </button>
          </>
        )}
      </div>
    </div>
  )
}
