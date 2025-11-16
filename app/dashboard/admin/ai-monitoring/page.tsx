import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminAIStats } from '@/components/admin/ai/AdminAIStats'
import { AdminAIUsageChart } from '@/components/admin/ai/AdminAIUsageChart'
import { AdminAICostBreakdown } from '@/components/admin/ai/AdminAICostBreakdown'
import { AdminAIRecentLogs } from '@/components/admin/ai/AdminAIRecentLogs'

export default async function AdminAIMonitoringPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch AI usage logs
  const { data: aiLogs } = await supabase
    .from('ai_usage_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  // Calculate stats
  const totalLogs = aiLogs?.length || 0
  const totalCost = aiLogs?.reduce((sum, log) => sum + (log.total_cost || 0), 0) || 0
  const totalTokens = aiLogs?.reduce((sum, log) => sum + (log.input_tokens || 0) + (log.output_tokens || 0), 0) || 0
  const avgResponseTime =
    aiLogs?.reduce((sum, log) => sum + (log.response_time_ms || 0), 0) / (aiLogs?.length || 1) || 0

  // Get success rate
  const successfulLogs = aiLogs?.filter((log) => log.success).length || 0
  const successRate = totalLogs > 0 ? (successfulLogs / totalLogs) * 100 : 0

  // Get logs by model
  const gpt4Logs = aiLogs?.filter((log) => log.model?.includes('gpt-4')).length || 0
  const geminiLogs = aiLogs?.filter((log) => log.model?.includes('gemini')).length || 0

  // Get recent logs with user info
  const { data: recentLogs } = await supabase
    .from('ai_usage_logs')
    .select(
      `
      *,
      profiles(full_name, avatar_url)
    `
    )
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">AI Kullanım İzleme</h1>
        <p className="mt-2 text-gray-600">
          AI servislerinin kullanımını, maliyetlerini ve performansını izleyin
        </p>
      </div>

      {/* Stats */}
      <AdminAIStats
        totalRequests={totalLogs}
        totalCost={totalCost}
        totalTokens={totalTokens}
        avgResponseTime={avgResponseTime}
        successRate={successRate}
        gpt4Usage={gpt4Logs}
        geminiUsage={geminiLogs}
      />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdminAIUsageChart logs={aiLogs || []} />
        <AdminAICostBreakdown logs={aiLogs || []} />
      </div>

      {/* Recent Logs */}
      <AdminAIRecentLogs logs={recentLogs || []} />
    </div>
  )
}
