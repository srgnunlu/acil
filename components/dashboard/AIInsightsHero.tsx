'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

type InsightType = 'critical' | 'warning' | 'success' | 'info' | 'suggestion'

interface AIInsight {
  id: string
  type: InsightType
  title: string
  message: string
  action?: {
    label: string
    onClick?: () => void
    link?: string
  }
  actionLink?: string // Server-safe alternative
  actionLabel?: string // Server-safe alternative
  dismissible?: boolean
}

interface AIInsightsHeroProps {
  insights: AIInsight[]
  autoRotate?: boolean
  rotateInterval?: number // milliseconds
}

const insightStyles = {
  critical: {
    bg: 'from-red-600 to-rose-600',
    border: 'border-red-300',
    icon: AlertTriangle,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-700',
  },
  warning: {
    bg: 'from-amber-500 to-orange-500',
    border: 'border-amber-300',
    icon: AlertTriangle,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-700',
  },
  success: {
    bg: 'from-emerald-600 to-green-600',
    border: 'border-emerald-300',
    icon: TrendingUp,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-700',
  },
  info: {
    bg: 'from-blue-600 to-indigo-600',
    border: 'border-blue-300',
    icon: Brain,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-700',
  },
  suggestion: {
    bg: 'from-purple-600 to-indigo-600',
    border: 'border-purple-300',
    icon: Lightbulb,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-700',
  },
}

export function AIInsightsHero({
  insights,
  autoRotate = true,
  rotateInterval = 8000,
}: AIInsightsHeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [dismissedIds, setDismissedIds] = useState<string[]>([])

  // Filter out dismissed insights
  const activeInsights = insights.filter((insight) => !dismissedIds.includes(insight.id))

  // Auto-rotate insights
  useEffect(() => {
    if (!autoRotate || activeInsights.length <= 1) return

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeInsights.length)
    }, rotateInterval)

    return () => clearInterval(timer)
  }, [autoRotate, rotateInterval, activeInsights.length])

  // Handle dismiss
  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => [...prev, id])
    // If current insight is dismissed, move to next
    if (activeInsights[currentIndex]?.id === id && activeInsights.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % (activeInsights.length - 1))
    }
  }

  // Navigation
  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + activeInsights.length) % activeInsights.length)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeInsights.length)
  }

  if (activeInsights.length === 0) {
    return null
  }

  const currentInsight = activeInsights[currentIndex]
  const style = insightStyles[currentInsight.type]
  const Icon = style.icon

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentInsight.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          className={`
            relative overflow-hidden rounded-2xl
            bg-gradient-to-r ${style.bg}
            text-white shadow-lg
          `}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle at 20px 20px, white 2px, transparent 0)`,
                backgroundSize: '40px 40px',
              }}
            />
          </div>

          {/* Content */}
          <div className="relative p-6 md:p-8">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div
                className={`flex-shrink-0 p-3 ${style.iconBg} rounded-xl shadow-sm hidden sm:block`}
              >
                <Icon className={`w-6 h-6 ${style.iconColor}`} />
              </div>

              {/* Text Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-2">
                  <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <h2 className="text-xl md:text-2xl font-bold">{currentInsight.title}</h2>
                </div>
                <p className="text-white/90 leading-relaxed text-sm md:text-base">
                  {currentInsight.message}
                </p>

                {/* Action Button */}
                {(currentInsight.action ||
                  (currentInsight.actionLink && currentInsight.actionLabel)) && (
                  <div className="mt-4">
                    {currentInsight.action?.onClick ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={currentInsight.action.onClick}
                        className="bg-white/20 border-white/40 text-white hover:bg-white/30 backdrop-blur-sm"
                      >
                        {currentInsight.action.label}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const link = currentInsight.actionLink || currentInsight.action?.link
                          if (link) {
                            window.location.href = link
                          }
                        }}
                        className="bg-white/20 border-white/40 text-white hover:bg-white/30 backdrop-blur-sm"
                      >
                        {currentInsight.actionLabel || currentInsight.action?.label}
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Dismiss Button */}
              {currentInsight.dismissible && (
                <button
                  onClick={() => handleDismiss(currentInsight.id)}
                  className="flex-shrink-0 p-2 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label="Kapat"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Navigation Controls */}
            {activeInsights.length > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/20">
                <div className="flex items-center gap-2">
                  <button
                    onClick={goToPrevious}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                    aria-label="Önceki insight"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={goToNext}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                    aria-label="Sonraki insight"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Dots Indicator */}
                <div className="flex items-center gap-1.5">
                  {activeInsights.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={`h-2 rounded-full transition-all ${
                        index === currentIndex ? 'w-6 bg-white' : 'w-2 bg-white/40'
                      }`}
                      aria-label={`Insight ${index + 1}`}
                    />
                  ))}
                </div>

                {/* Counter */}
                <div className="text-sm font-medium">
                  {currentIndex + 1} / {activeInsights.length}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// Default insights generator (can be replaced with actual AI service)
export function generateDemoInsights(stats: {
  criticalPatients: number
  avgStayIncrease: number
  aiSuggestions: number
  teamPerformance: number
}): AIInsight[] {
  const insights: AIInsight[] = []

  if (stats.criticalPatients > 0) {
    insights.push({
      id: 'critical-patients',
      type: 'critical',
      title: `${stats.criticalPatients} Kritik Hasta Dikkat Gerektiriyor`,
      message:
        'Vital bulgularda anormallik tespit edilen hastalar için acil değerlendirme önerilmektedir.',
      action: {
        label: 'Hastaları Görüntüle',
        onClick: () => (window.location.href = '/dashboard/patients?filter=critical'),
      },
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
      action: {
        label: 'Önerileri Gör',
        onClick: () => (window.location.href = '/dashboard/analytics'),
      },
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
