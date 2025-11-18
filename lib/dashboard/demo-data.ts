/**
 * Server-safe demo data generators
 * These functions can be called from server components
 */

export interface ServerAIInsight {
  id: string
  type: 'critical' | 'warning' | 'success' | 'info' | 'suggestion'
  title: string
  message: string
  actionLink?: string
  actionLabel?: string
  dismissible?: boolean
}

export interface ServerAlert {
  id: string
  patientId?: string
  patientName?: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  category: 'vital_signs' | 'lab_result' | 'ai_anomaly' | 'reminder' | 'other'
  title: string
  message: string
  timestamp: string
  link?: string
}

/**
 * Generate demo insights (server-safe)
 */
export function generateDemoInsights(stats: {
  criticalPatients: number
  avgStayIncrease: number
  aiSuggestions: number
  teamPerformance: number
}): ServerAIInsight[] {
  const insights: ServerAIInsight[] = []

  if (stats.criticalPatients > 0) {
    insights.push({
      id: 'critical-patients',
      type: 'critical',
      title: `${stats.criticalPatients} Kritik Hasta Dikkat Gerektiriyor`,
      message:
        'Vital bulgularda anormallik tespit edilen hastalar için acil değerlendirme önerilmektedir.',
      actionLink: '/dashboard/patients?filter=critical',
      actionLabel: 'Hastaları Görüntüle',
      dismissible: false,
    })
  }

  if (stats.avgStayIncrease > 10) {
    insights.push({
      id: 'stay-increase',
      type: 'warning',
      title: 'Ortalama Kalış Süresi Arttı',
      message: `Bugün ortalama kalış süresi geçen haftaya göre %${stats.avgStayIncrease} arttı. Hasta akışını gözden geçirmeniz önerilir.`,
      dismissible: true,
    })
  }

  if (stats.aiSuggestions > 0) {
    insights.push({
      id: 'ai-suggestions',
      type: 'suggestion',
      title: `${stats.aiSuggestions} AI Önerisi Mevcut`,
      message: 'Hastalarınız için konsültasyon ve tetkik önerileri hazır. İncelemek için tıklayın.',
      actionLink: '/dashboard/analytics',
      actionLabel: 'Önerileri Gör',
      dismissible: true,
    })
  }

  if (stats.teamPerformance >= 100) {
    insights.push({
      id: 'team-performance',
      type: 'success',
      title: 'Ekip Performansı Hedefin Üzerinde! 🎉',
      message: `Bugün ekip performansı hedefin %${stats.teamPerformance}'inde. Harika iş çıkarıyorsunuz!`,
      dismissible: true,
    })
  }

  if (insights.length === 0) {
    insights.push({
      id: 'default',
      type: 'info',
      title: 'AI Destekli Hasta Takibi Aktif',
      message:
        'ACIL sistemi hasta verilerinizi analiz ederek akıllı öneriler sunmaya devam ediyor.',
      dismissible: false,
    })
  }

  return insights
}

/**
 * Generate demo alerts (server-safe)
 */
export function generateDemoAlerts(): ServerAlert[] {
  return [
    {
      id: '1',
      patientId: 'p1',
      patientName: 'Ahmet Yılmaz',
      severity: 'critical',
      category: 'vital_signs',
      title: 'Kritik Vital Bulgu',
      message: 'Hastanın sistolik kan basıncı 180 mmHg - Acil müdahale gerekiyor',
      timestamp: new Date().toISOString(),
      link: '/dashboard/patients/p1',
    },
    {
      id: '2',
      patientId: 'p2',
      patientName: 'Ayşe Demir',
      severity: 'high',
      category: 'lab_result',
      title: 'Anormal Laboratuvar Sonucu',
      message: 'Troponin değeri yüksek (0.8 ng/mL) - Kardiyak marker anormalliği',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      link: '/dashboard/patients/p2',
    },
    {
      id: '3',
      patientId: 'p3',
      patientName: 'Mehmet Kaya',
      severity: 'medium',
      category: 'ai_anomaly',
      title: 'AI Anomali Tespiti',
      message: 'EKG analizinde ST segment değişikliği tespit edildi',
      timestamp: new Date(Date.now() - 1200000).toISOString(),
      link: '/dashboard/patients/p3',
    },
  ]
}
