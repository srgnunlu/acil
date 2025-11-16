'use client'

import { Zap, DollarSign, Hash, Clock, CheckCircle, Cpu, Brain } from 'lucide-react'
import { AdminStatCard } from '../AdminStatCard'

interface AdminAIStatsProps {
  totalRequests: number
  totalCost: number
  totalTokens: number
  avgResponseTime: number
  successRate: number
  gpt4Usage: number
  geminiUsage: number
}

export function AdminAIStats({
  totalRequests,
  totalCost,
  totalTokens,
  avgResponseTime,
  successRate,
  gpt4Usage,
  geminiUsage,
}: AdminAIStatsProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminStatCard
          title="Toplam İstek"
          value={totalRequests.toLocaleString('tr-TR')}
          icon={Zap}
          color="blue"
        />
        <AdminStatCard
          title="Toplam Maliyet"
          value={`$${totalCost.toFixed(2)}`}
          icon={DollarSign}
          color="green"
        />
        <AdminStatCard
          title="Toplam Token"
          value={totalTokens.toLocaleString('tr-TR')}
          icon={Hash}
          color="purple"
        />
        <AdminStatCard
          title="Ort. Yanıt Süresi"
          value={`${avgResponseTime.toFixed(0)}ms`}
          icon={Clock}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AdminStatCard
          title="Başarı Oranı"
          value={`${successRate.toFixed(1)}%`}
          icon={CheckCircle}
          color="emerald"
        />
        <AdminStatCard
          title="GPT-4 Kullanımı"
          value={gpt4Usage.toLocaleString('tr-TR')}
          icon={Brain}
          color="cyan"
        />
        <AdminStatCard
          title="Gemini Kullanımı"
          value={geminiUsage.toLocaleString('tr-TR')}
          icon={Cpu}
          color="amber"
        />
      </div>
    </>
  )
}
