import { createClient } from '@/lib/supabase/server'
import { AddPatientButton } from '@/components/patients/AddPatientButton'
import { PatientListClient } from '@/components/patients/PatientListClient'
import { Sparkles, TrendingUp, Shield } from 'lucide-react'

export default async function PatientsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Hastaları al
  const { data: patients } = await supabase
    .from('patients')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Profil bilgilerini al
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const activePatients = patients?.filter((p) => p.status === 'active') || []
  const canAddPatient = activePatients.length < (profile?.patient_limit || 3)
  const usagePercentage = (activePatients.length / (profile?.patient_limit || 3)) * 100

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hastalar</h1>
          <p className="text-gray-600 mt-2 flex items-center gap-2">
            <span className="font-semibold text-gray-900">{activePatients.length}</span>
            aktif hasta
            <span className="text-gray-400">•</span>
            <span className="text-sm">{profile?.patient_limit || 3} hasta limiti</span>
          </p>
        </div>

        <AddPatientButton
          canAddPatient={canAddPatient}
          currentCount={activePatients.length}
          limit={profile?.patient_limit || 3}
          tier={profile?.subscription_tier || 'free'}
        />
      </div>

      {/* Warning Banner */}
      {usagePercentage >= 75 && usagePercentage < 100 && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-yellow-900 mb-1">Hasta limitinize yaklaşıyorsunuz</h4>
            <p className="text-sm text-yellow-800">
              {activePatients.length}/{profile?.patient_limit || 3} hasta slotu kullanılıyor (
              {Math.round(usagePercentage)}%)
            </p>
          </div>
        </div>
      )}

      {!patients || patients.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Hasta listeniz boş</h3>
            <p className="text-gray-600 mb-8 leading-relaxed">
              İlk hastanızı ekleyerek AI destekli hasta takip sistemini kullanmaya başlayın.
              Otomatik raporlar, akıllı öneriler ve daha fazlası sizi bekliyor.
            </p>

            <div className="grid sm:grid-cols-3 gap-4 mb-8 text-left">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-2">🤖</div>
                <h4 className="font-semibold text-sm text-gray-900 mb-1">AI Asistan</h4>
                <p className="text-xs text-gray-600">Akıllı hasta analizi</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-2">📊</div>
                <h4 className="font-semibold text-sm text-gray-900 mb-1">Raporlar</h4>
                <p className="text-xs text-gray-600">Otomatik raporlama</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-2">🔒</div>
                <h4 className="font-semibold text-sm text-gray-900 mb-1">Güvenli</h4>
                <p className="text-xs text-gray-600">Şifreli veri saklama</p>
              </div>
            </div>

            <AddPatientButton
              canAddPatient={canAddPatient}
              currentCount={activePatients.length}
              limit={profile?.patient_limit || 3}
              tier={profile?.subscription_tier || 'free'}
            />
          </div>
        </div>
      ) : (
        <PatientListClient initialPatients={patients || []} />
      )}

      {/* Upgrade Banner */}
      {profile?.subscription_tier === 'free' &&
        activePatients.length >= (profile?.patient_limit || 3) && (
          <div className="mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-6 h-6" />
                  <h3 className="text-2xl font-bold">Hasta limitine ulaştınız</h3>
                </div>
                <p className="mb-2 opacity-90 leading-relaxed">
                  Pro versiyona geçerek <strong>sınırsız hasta</strong> ekleyebilir ve premium
                  özelliklere erişebilirsiniz.
                </p>
                <ul className="space-y-1 opacity-90 text-sm">
                  <li>✓ Sınırsız hasta kaydı</li>
                  <li>✓ Gelişmiş AI analiz</li>
                  <li>✓ Öncelikli destek</li>
                </ul>
              </div>
              <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 hover:scale-105 active:scale-95 transition-all shadow-lg whitespace-nowrap">
                Pro&apos;ya Yükselt
              </button>
            </div>
          </div>
        )}
    </div>
  )
}
