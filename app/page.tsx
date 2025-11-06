import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Eğer kullanıcı giriş yapmışsa dashboard'a yönlendir
  if (user) {
    redirect('/dashboard/patients')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            ACIL
          </h1>
          <p className="text-2xl md:text-3xl text-gray-700 mb-4">
            AI Destekli Hasta Takip Sistemi
          </p>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
            Acil servislerinizde yapay zeka desteğiyle hasta yönetimi ve klinik karar
            destek sistemi. Akademik kaynaklara dayalı, güvenilir tıbbi öneriler.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/register"
              className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg hover:shadow-xl"
            >
              Ücretsiz Başla
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 bg-white text-blue-600 border-2 border-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition"
            >
              Giriş Yap
            </Link>
          </div>

          <p className="text-sm text-gray-500">
            🎉 İlk 3 hasta takibi ücretsiz!
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white p-8 rounded-2xl shadow-lg">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              AI Destekli Analiz
            </h3>
            <p className="text-gray-600">
              OpenAI GPT-4 ve Google Gemini ile güçlendirilmiş hasta değerlendirme
              ve tanı önerileri
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Akıllı Takip
            </h3>
            <p className="text-gray-600">
              Hasta verilerini sıralı ekleyin, AI her yeni veriyle analizini
              güncellesin ve daraltılmış öneriler sunsun
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg">
            <div className="text-4xl mb-4">🔬</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Görsel Analiz
            </h3>
            <p className="text-gray-600">
              EKG, cilt lezyonları ve radyolojik görüntülerin AI destekli
              değerlendirmesi
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Akademik Referanslar
            </h3>
            <p className="text-gray-600">
              Tüm öneriler güvenilir akademik kaynaklara dayalı ve
              referanslanmış
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Hasta Bazlı Chat
            </h3>
            <p className="text-gray-600">
              Her hasta için özel AI sohbet asistanı ile anlık sorularınıza
              yanıt alın
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg">
            <div className="text-4xl mb-4">⏰</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Akıllı Hatırlatmalar
            </h3>
            <p className="text-gray-600">
              Tetkik sonuçları için özelleştirilebilir hatırlatıcılar ve
              bildirimler
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Hemen Başlayın
          </h2>
          <p className="text-xl mb-8 opacity-90">
            İlk 3 hasta takibiniz ücretsiz. Kredi kartı bilgisi gerektirmez.
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition shadow-lg"
          >
            Ücretsiz Hesap Oluştur
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600">
          <p>
            ACIL - AI Destekli Hasta Takip Sistemi © 2024
          </p>
          <p className="text-sm mt-2">
            Bu sistem bir klinik karar destek aracıdır. Nihai klinik kararlar
            hekim sorumluluğundadır.
          </p>
        </div>
      </footer>
    </div>
  )
}
