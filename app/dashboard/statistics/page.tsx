import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AnalyticsDashboard } from '@/components/dashboard/AnalyticsDashboard'

export default async function StatisticsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analiz ve İstatistikler</h1>
        <p className="text-gray-600">Detaylı grafikler ve aktivite analizleri</p>
      </div>

      <AnalyticsDashboard />
    </div>
  )
}
