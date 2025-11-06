import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { AddPatientButton } from '@/components/patients/AddPatientButton'

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
  const canAddPatient =
    activePatients.length < (profile?.patient_limit || 3)

  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      discharged: 'bg-gray-100 text-gray-800',
      consultation: 'bg-yellow-100 text-yellow-800',
    }
    const labels = {
      active: 'Aktif',
      discharged: 'Taburcu',
      consultation: 'Konsültasyon',
    }
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${
          badges[status as keyof typeof badges]
        }`}
      >
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hastalar</h1>
          <p className="text-gray-600 mt-2">
            {activePatients.length} aktif hasta ({profile?.patient_limit || 3}{' '}
            hasta limiti)
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
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Henüz hasta eklemediniz
          </h3>
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
        <div className="grid gap-4">
          {patients.map((patient) => (
            <Link
              key={patient.id}
              href={`/dashboard/patients/${patient.id}`}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {patient.name}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    {patient.age && <span>{patient.age} yaş</span>}
                    {patient.gender && <span>• {patient.gender}</span>}
                    <span>
                      •{' '}
                      {new Date(patient.created_at).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                </div>
                <div>{getStatusBadge(patient.status)}</div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Upgrade Banner */}
      {profile?.subscription_tier === 'free' &&
        activePatients.length >= (profile?.patient_limit || 3) && (
          <div className="mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
            <h3 className="text-xl font-bold mb-2">Hasta limitine ulaştınız</h3>
            <p className="mb-4 opacity-90">
              Pro versiyona geçerek sınırsız hasta ekleyebilir ve premium
              özelliklere erişebilirsiniz.
            </p>
            <button className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition">
              Pro'ya Yükselt
            </button>
          </div>
        )}
    </div>
  )
}
