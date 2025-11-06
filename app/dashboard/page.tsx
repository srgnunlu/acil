import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format, subDays } from 'date-fns'
import { tr } from 'date-fns/locale'

export default async function DashboardHome() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Hastaları al
  const { data: patients } = await supabase
    .from('patients')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const activePatients = patients?.filter((p) => p.status === 'active') || []
  const recentPatients = patients?.slice(0, 5) || []

  // Bugünkü hastalar (son 24 saat)
  const yesterday = subDays(new Date(), 1).toISOString()
  const todayPatients = patients?.filter(
    (p) => new Date(p.created_at) > new Date(yesterday)
  ) || []

  // Hatırlatmaları al
  const { data: reminders } = await supabase
    .from('reminders')
    .select('*, patients(name)')
    .eq('user_id', user.id)
    .in('status', ['pending', 'sent'])
    .order('scheduled_time', { ascending: true })
    .limit(5)

  // AI analiz sayısı
  const { count: aiAnalysisCount } = await supabase
    .from('ai_analyses')
    .select('*', { count: 'exact', head: true })
    .in(
      'patient_id',
      patients?.map((p) => p.id) || []
    )

  // Test sayısı
  const { count: testCount } = await supabase
    .from('tests')
    .select('*', { count: 'exact', head: true })
    .in(
      'patient_id',
      patients?.map((p) => p.id) || []
    )

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
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Hoş geldiniz, Dr. 👋
        </h1>
        <p className="text-blue-100">
          Bugün {todayPatients.length} yeni hasta kaydı yapıldı
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link
          href="/dashboard/patients"
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Aktif Hasta</h3>
            <span className="text-3xl group-hover:scale-110 transition">🏥</span>
          </div>
          <p className="text-3xl font-bold text-green-600">{activePatients.length}</p>
          <p className="text-sm text-gray-500 mt-1">Toplam {patients?.length || 0} hasta</p>
        </Link>

        <Link
          href="/dashboard/statistics"
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Test Sayısı</h3>
            <span className="text-3xl group-hover:scale-110 transition">🧪</span>
          </div>
          <p className="text-3xl font-bold text-blue-600">{testCount || 0}</p>
          <p className="text-sm text-gray-500 mt-1">
            {activePatients.length > 0
              ? `Ortalama ${((testCount || 0) / activePatients.length).toFixed(1)} test/hasta`
              : 'Henüz test yok'}
          </p>
        </Link>

        <Link
          href="/dashboard/statistics"
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">AI Analizi</h3>
            <span className="text-3xl group-hover:scale-110 transition">🤖</span>
          </div>
          <p className="text-3xl font-bold text-purple-600">{aiAnalysisCount || 0}</p>
          <p className="text-sm text-gray-500 mt-1">
            {patients?.length && patients.length > 0
              ? `${((aiAnalysisCount || 0) / patients.length * 100).toFixed(0)}% kullanım`
              : 'Henüz analiz yok'}
          </p>
        </Link>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Bugünkü Aktivite</h3>
            <span className="text-3xl">📊</span>
          </div>
          <p className="text-3xl font-bold text-indigo-600">{todayPatients.length}</p>
          <p className="text-sm text-gray-500 mt-1">Yeni hasta kaydı</p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Patients */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Son Hastalar</h2>
            <Link
              href="/dashboard/patients"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Tümünü Gör →
            </Link>
          </div>

          {recentPatients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Henüz hasta eklenmedi
            </div>
          ) : (
            <div className="space-y-3">
              {recentPatients.map((patient) => (
                <Link
                  key={patient.id}
                  href={`/dashboard/patients/${patient.id}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div>
                    <p className="font-medium text-gray-900">{patient.name}</p>
                    <p className="text-sm text-gray-600">
                      {patient.age && `${patient.age} yaş`}
                      {patient.gender && ` • ${patient.gender}`}
                    </p>
                  </div>
                  {getStatusBadge(patient.status)}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Reminders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Yaklaşan Hatırlatmalar
          </h2>

          {!reminders || reminders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Henüz hatırlatma yok
            </div>
          ) : (
            <div className="space-y-3">
              {reminders.map((reminder: any) => (
                <div
                  key={reminder.id}
                  className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg"
                >
                  <span className="text-2xl">⏰</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {reminder.patients?.name || 'Hasta'}
                    </p>
                    <p className="text-sm text-gray-600 capitalize">
                      {reminder.reminder_type.replace('_', ' ')}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(
                        new Date(reminder.scheduled_time),
                        'dd MMM yyyy, HH:mm',
                        { locale: tr }
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Hızlı İşlemler</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Link
            href="/dashboard/patients"
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-center group"
          >
            <div className="text-4xl mb-2 group-hover:scale-110 transition">➕</div>
            <p className="font-medium text-gray-900">Yeni Hasta Ekle</p>
            <p className="text-sm text-gray-500 mt-1">
              Hasta kaydı oluştur ve takibe başla
            </p>
          </Link>

          <Link
            href="/dashboard/statistics"
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition text-center group"
          >
            <div className="text-4xl mb-2 group-hover:scale-110 transition">📈</div>
            <p className="font-medium text-gray-900">İstatistikleri Görüntüle</p>
            <p className="text-sm text-gray-500 mt-1">
              Grafikler ve detaylı analizler
            </p>
          </Link>

          <Link
            href="/dashboard/guidelines"
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition text-center group"
          >
            <div className="text-4xl mb-2 group-hover:scale-110 transition">📚</div>
            <p className="font-medium text-gray-900">Rehberlere Bak</p>
            <p className="text-sm text-gray-500 mt-1">
              Acil tıp protokolleri ve kılavuzlar
            </p>
          </Link>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
        <div className="flex items-start space-x-3">
          <svg
            className="w-6 h-6 text-indigo-600 mt-0.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              AI Destekli Hasta Takibi
            </h4>
            <p className="text-gray-700 leading-relaxed">
              ACIL sistemi, hasta verilerinizi analiz ederek ayırıcı tanı önerileri,
              test tavsiyeleri ve tedavi algoritmaları sunar. Her hasta için detaylı
              AI analizleri ve görsel değerlendirmeler yapabilirsiniz.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
