'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  Activity,
  Clock,
  CheckCircle,
  Bell,
  BellOff,
  User,
  X,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

type AlertSeverity = 'critical' | 'high' | 'medium' | 'low'
type AlertCategory = 'vital_signs' | 'lab_result' | 'ai_anomaly' | 'reminder' | 'other'

interface Alert {
  id: string
  patientId?: string
  patientName?: string
  severity: AlertSeverity
  category: AlertCategory
  title: string
  message: string
  timestamp: string
  acknowledged?: boolean
  acknowledgedBy?: string
  link?: string
}

interface CriticalAlertsPanelProps {
  alerts: Alert[]
  onAcknowledge?: (alertId: string) => void
  onDismiss?: (alertId: string) => void
  onSnooze?: (alertId: string, duration: number) => void
  maxDisplay?: number
}

const severityStyles = {
  critical: {
    bg: 'bg-red-50',
    border: 'border-red-300',
    text: 'text-red-800',
    badge: 'bg-red-600 text-white',
    icon: 'text-red-600',
  },
  high: {
    bg: 'bg-orange-50',
    border: 'border-orange-300',
    text: 'text-orange-800',
    badge: 'bg-orange-600 text-white',
    icon: 'text-orange-600',
  },
  medium: {
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    text: 'text-amber-800',
    badge: 'bg-amber-600 text-white',
    icon: 'text-amber-600',
  },
  low: {
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    text: 'text-blue-800',
    badge: 'bg-blue-600 text-white',
    icon: 'text-blue-600',
  },
}

const categoryIcons = {
  vital_signs: Activity,
  lab_result: AlertTriangle,
  ai_anomaly: AlertTriangle,
  reminder: Clock,
  other: Bell,
}

export function CriticalAlertsPanel({
  alerts,
  onAcknowledge,
  onDismiss,
  onSnooze,
  maxDisplay = 5,
}: CriticalAlertsPanelProps) {
  const [dismissedIds, setDismissedIds] = useState<string[]>([])
  const [showAll, setShowAll] = useState(false)

  // Filter and sort alerts
  const activeAlerts = alerts
    .filter((alert) => !dismissedIds.includes(alert.id) && !alert.acknowledged)
    .sort((a, b) => {
      // Sort by severity first
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity]
      if (severityDiff !== 0) return severityDiff

      // Then by timestamp (newest first)
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })

  const displayedAlerts = showAll ? activeAlerts : activeAlerts.slice(0, maxDisplay)

  const handleDismiss = (alertId: string) => {
    setDismissedIds((prev) => [...prev, alertId])
    onDismiss?.(alertId)
  }

  const handleAcknowledge = (alertId: string) => {
    onAcknowledge?.(alertId)
  }

  const handleSnooze = (alertId: string) => {
    // Default: snooze for 1 hour (3600000 ms)
    onSnooze?.(alertId, 3600000)
    handleDismiss(alertId)
  }

  if (activeAlerts.length === 0) {
    return (
      <Card variant="elevated" className="bg-green-50 border-green-200">
        <div className="flex items-center gap-3 p-6">
          <div className="p-3 bg-green-100 rounded-full">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-green-900">Aktif Uyarı Yok</h3>
            <p className="text-sm text-green-700">Tüm sistemler normal çalışıyor.</p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">Kritik Uyarılar</h3>
          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
            {activeAlerts.length}
          </span>
        </div>
        {activeAlerts.length > maxDisplay && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {showAll ? 'Daha Az Göster' : `${activeAlerts.length - maxDisplay} Daha Fazla →`}
          </button>
        )}
      </div>

      {/* Alerts List */}
      <AnimatePresence mode="popLayout">
        {displayedAlerts.map((alert, index) => {
          const style = severityStyles[alert.severity]
          const CategoryIcon = categoryIcons[alert.category]

          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20, height: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <Card
                variant="elevated"
                className={`${style.bg} border-l-4 ${style.border} relative`}
              >
                {/* Pulse animation for critical alerts */}
                {alert.severity === 'critical' && (
                  <motion.div
                    className="absolute top-3 right-3 w-3 h-3 bg-red-600 rounded-full"
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [1, 0.5, 1],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.5,
                    }}
                  />
                )}

                <div className="flex items-start gap-4 p-4">
                  {/* Icon */}
                  <div className={`flex-shrink-0 p-2 bg-white rounded-lg ${style.icon}`}>
                    <CategoryIcon className="w-5 h-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 text-xs font-bold rounded ${style.badge} uppercase`}
                          >
                            {alert.severity === 'critical'
                              ? 'KRİTİK'
                              : alert.severity === 'high'
                                ? 'YÜKSEK'
                                : alert.severity === 'medium'
                                  ? 'ORTA'
                                  : 'DÜŞÜK'}
                          </span>
                          {alert.patientName && (
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <User className="w-3 h-3" />
                              <span className="font-medium">{alert.patientName}</span>
                            </div>
                          )}
                        </div>
                        <h4 className={`font-semibold ${style.text}`}>{alert.title}</h4>
                      </div>

                      <button
                        onClick={() => handleDismiss(alert.id)}
                        className="flex-shrink-0 p-1 hover:bg-white/50 rounded transition-colors"
                        aria-label="Kapat"
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>

                    {/* Message */}
                    <p className={`text-sm ${style.text} mb-3`}>{alert.message}</p>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{format(new Date(alert.timestamp), 'HH:mm, dd MMM', { locale: tr })}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {onSnooze && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSnooze(alert.id)}
                            leftIcon={<BellOff className="w-3 h-3" />}
                            className="text-xs h-7"
                          >
                            Ertele
                          </Button>
                        )}
                        {onAcknowledge && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAcknowledge(alert.id)}
                            leftIcon={<CheckCircle className="w-3 h-3" />}
                            className="text-xs h-7 bg-white"
                          >
                            Onaylıyorum
                          </Button>
                        )}
                        {alert.link && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => (window.location.href = alert.link!)}
                            className="text-xs h-7"
                          >
                            Görüntüle
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

// Demo data generator
export function generateDemoAlerts(): Alert[] {
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
