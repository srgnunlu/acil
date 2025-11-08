import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const { count: patientCount } = await supabase
    .from('patients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Ayarlar</h1>
        <p className="text-gray-600">Hesap ve uygulama ayarlarınız</p>
      </div>

      {/* Profile Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Profil Bilgileri</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">E-posta</label>
            <p className="text-gray-900">{user.email}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Ad Soyad</label>
            <p className="text-gray-900">{profile?.full_name || '-'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Uzmanlık</label>
            <p className="text-gray-900">{profile?.specialty || '-'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Kurum</label>
            <p className="text-gray-900">{profile?.institution || '-'}</p>
          </div>
        </div>
      </div>

      {/* Subscription Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Abonelik Bilgileri</h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium text-gray-900">Mevcut Plan</p>
              <p className="text-sm text-gray-600">
                {profile?.subscription_tier === 'free' ? 'Ücretsiz' : 'Pro Üyelik'}
              </p>
            </div>
            <span
              className={`px-4 py-2 rounded-lg font-semibold ${
                profile?.subscription_tier === 'free'
                  ? 'bg-gray-100 text-gray-800'
                  : 'bg-blue-600 text-white'
              }`}
            >
              {profile?.subscription_tier === 'free' ? 'FREE' : 'PRO'}
            </span>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <div>
              <p className="font-medium text-gray-900">Hasta Limiti</p>
              <p className="text-sm text-gray-600">
                {patientCount || 0} / {profile?.patient_limit || 3} hasta kullanılıyor
              </p>
            </div>
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{
                  width: `${((patientCount || 0) / (profile?.patient_limit || 3)) * 100}%`,
                }}
              />
            </div>
          </div>

          {profile?.subscription_tier === 'free' && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
                <h3 className="font-semibold text-gray-900 mb-2">Pro&apos;ya Yükselt</h3>
                <ul className="space-y-2 mb-4 text-sm text-gray-700">
                  <li className="flex items-center">
                    <span className="text-green-600 mr-2">✓</span>
                    Sınırsız hasta takibi
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-600 mr-2">✓</span>
                    Gelişmiş AI analizi
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-600 mr-2">✓</span>
                    Öncelikli destek
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-600 mr-2">✓</span>
                    Detaylı raporlama
                  </li>
                </ul>
                <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
                  Pro&apos;ya Geç - ₺199/ay
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Bildirim Ayarları</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Tetkik Sonucu Hatırlatıcıları</p>
              <p className="text-sm text-gray-600">Tetkik sonuçları için otomatik hatırlatma</p>
            </div>
            <button className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none bg-blue-600">
              <span className="translate-x-5 inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out" />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">E-posta Bildirimleri</p>
              <p className="text-sm text-gray-600">Önemli güncellemeler için e-posta al</p>
            </div>
            <button className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none bg-gray-200">
              <span className="translate-x-0 inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out" />
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
        <h2 className="text-xl font-semibold text-red-900 mb-4">Tehlikeli Bölge</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-700 mb-3">
              Hesabınızı silmek tüm verilerinizi kalıcı olarak siler. Bu işlem geri alınamaz.
            </p>
            <button className="px-4 py-2 border-2 border-red-600 text-red-600 rounded-lg font-medium hover:bg-red-50 transition">
              Hesabı Sil
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
