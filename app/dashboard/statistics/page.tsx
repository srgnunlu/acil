import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StatsCards } from '@/components/dashboard/StatsCards'

export default async function StatisticsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Toplam istatistikleri al
  const { count: totalPatients } = await supabase
    .from('patients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { count: activePatients } = await supabase
    .from('patients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'active')

  const { count: dischargedPatients } = await supabase
    .from('patients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'discharged')

  const { count: consultationPatients } = await supabase
    .from('patients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'consultation')

  // Hasta listesi (son eklenenler)
  const { data: recentPatients } = await supabase
    .from('patients')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">İstatistikler</h1>
        <p className="text-gray-600">Genel aktivite ve kullanım istatistikleri</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Toplam Hasta</h3>
            <span className="text-3xl">👥</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalPatients || 0}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Aktif Hasta</h3>
            <span className="text-3xl">🏥</span>
          </div>
          <p className="text-3xl font-bold text-green-600">{activePatients || 0}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Taburcu</h3>
            <span className="text-3xl">🏠</span>
          </div>
          <p className="text-3xl font-bold text-gray-600">{dischargedPatients || 0}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Konsültasyon</h3>
            <span className="text-3xl">👨‍⚕️</span>
          </div>
          <p className="text-3xl font-bold text-yellow-600">
            {consultationPatients || 0}
          </p>
        </div>
      </div>

      {/* Recent Patients */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Son Eklenen Hastalar
        </h2>
        {!recentPatients || recentPatients.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Henüz hasta eklenmedi</p>
        ) : (
          <div className="space-y-4">
            {recentPatients.map((patient) => (
              <div
                key={patient.id}
                className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{patient.name}</p>
                  <p className="text-sm text-gray-600">
                    {patient.age && `${patient.age} yaş`}
                    {patient.gender && ` • ${patient.gender}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    {new Date(patient.created_at).toLocaleDateString('tr-TR')}
                  </p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      patient.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : patient.status === 'discharged'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {patient.status === 'active'
                      ? 'Aktif'
                      : patient.status === 'discharged'
                      ? 'Taburcu'
                      : 'Konsültasyon'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Usage Info */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          💡 İpucu
        </h3>
        <p className="text-gray-700">
          Daha detaylı istatistikler ve raporlama özellikleri için Pro sürüme
          yükseltin. Hasta başına ortalama tedavi süresi, tetkik kullanım
          oranları ve daha fazlası...
        </p>
      </div>
    </div>
  )
}
