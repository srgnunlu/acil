import { createClient } from '@/lib/supabase/server'
import { AddPatientButton } from '@/components/patients/AddPatientButton'
import { PatientListWithBulk } from '@/components/patients/PatientListWithBulk'

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

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hastalar</h1>
          <p className="text-gray-600 mt-2">
            {activePatients.length} aktif hasta ({profile?.patient_limit || 3} hasta limiti)
          </p>
        </div>

        <AddPatientButton
          canAddPatient={canAddPatient}
          currentCount={activePatients.length}
          limit={profile?.patient_limit || 3}
          tier={profile?.subscription_tier || 'free'}
        />
      </div>

      {!patients || patients.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">👨‍⚕️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Henüz hasta eklemediniz</h3>
          <p className="text-gray-600 mb-6">
            İlk hastanızı ekleyerek AI destekli hasta takibine başlayın
          </p>
          <AddPatientButton
            canAddPatient={canAddPatient}
            currentCount={activePatients.length}
            limit={profile?.patient_limit || 3}
            tier={profile?.subscription_tier || 'free'}
          />
        </div>
      ) : (
        <PatientListWithBulk patients={patients} />
      )}

      {/* Upgrade Banner */}
      {profile?.subscription_tier === 'free' &&
        activePatients.length >= (profile?.patient_limit || 3) && (
          <div className="mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
            <h3 className="text-xl font-bold mb-2">Hasta limitine ulaştınız</h3>
            <p className="mb-4 opacity-90">
              Pro versiyona geçerek sınırsız hasta ekleyebilir ve premium özelliklere
              erişebilirsiniz.
            </p>
            <button className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition">
              Pro&apos;ya Yükselt
            </button>
          </div>
        )}
    </div>
  )
}
