import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminAICostsPage({
  searchParams,
}: {
  searchParams: { start_date?: string; end_date?: string; model?: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check admin access
  const { data: memberships } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .in('role', ['owner', 'admin'])

  if (!memberships || memberships.length === 0) {
    redirect('/dashboard')
  }

  // Calculate date range
  const end = searchParams.end_date ? new Date(searchParams.end_date) : new Date()
  // eslint-disable-next-line react-hooks/purity
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const start = searchParams.start_date ? new Date(searchParams.start_date) : thirtyDaysAgo

  // Fetch AI usage logs
  let query = supabase
    .from('ai_usage_logs')
    .select('*')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())
    .eq('success', true)

  if (searchParams.model) {
    query = query.ilike('model', `%${searchParams.model}%`)
  }

  const { data: logs } = await query

  // Calculate totals
  const totalCost = logs?.reduce((sum, log) => sum + (log.total_cost || 0), 0) || 0
  const totalRequests = logs?.length || 0
  const totalTokens =
    logs?.reduce((sum, log) => sum + (log.input_tokens || 0) + (log.output_tokens || 0), 0) || 0

  // Group by model
  const byModel: Record<string, { cost: number; requests: number }> = {}
  logs?.forEach((log) => {
    const modelName = log.model || 'unknown'
    if (!byModel[modelName]) {
      byModel[modelName] = { cost: 0, requests: 0 }
    }
    byModel[modelName].cost += log.total_cost || 0
    byModel[modelName].requests += 1
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">AI Maliyet Analizi</h1>
        <p className="mt-2 text-gray-600">AI servislerinin maliyetlerini ve kullanımını analiz edin</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500">Toplam Maliyet</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">${totalCost.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500">Toplam İstek</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{totalRequests}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500">Toplam Token</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{totalTokens.toLocaleString()}</p>
        </div>
      </div>

      {/* Model Breakdown */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Model Bazlı Maliyet</h2>
        <div className="space-y-4">
          {Object.entries(byModel).map(([model, stats]) => (
            <div key={model} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{model}</p>
                <p className="text-sm text-gray-500">{stats.requests} istek</p>
              </div>
              <p className="text-lg font-semibold text-gray-900">${stats.cost.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

