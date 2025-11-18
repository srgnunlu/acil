'use client'

import { motion } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  AlertTriangle,
  Clock,
  Brain,
  Activity,
  FileText,
  BarChart3,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { MiniSparkline } from '@/components/charts/MiniSparkline'

interface Trend {
  direction: 'up' | 'down' | 'neutral'
  percentage: number
  period?: string
}

// Icon name mapping for server-safe icon passing
const iconMap: Record<string, LucideIcon> = {
  Users,
  AlertTriangle,
  Clock,
  Brain,
  Activity,
  FileText,
  BarChart3,
  TrendingUp,
}

interface StatCardWithTrendProps {
  title: string
  value: number | string
  subtitle?: string
  trend?: Trend
  sparklineData?: number[]
  color?: 'green' | 'blue' | 'purple' | 'red' | 'indigo' | 'amber'
  icon?: LucideIcon | string // Accept both component and string
  onClick?: () => void
  href?: string // Add href prop for navigation
  isLoading?: boolean
  realtime?: boolean
  unit?: string
}

const colorClasses = {
  green: {
    text: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    hover: 'hover:border-green-300',
  },
  blue: {
    text: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    hover: 'hover:border-blue-300',
  },
  purple: {
    text: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    hover: 'hover:border-purple-300',
  },
  red: {
    text: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    hover: 'hover:border-red-300',
  },
  indigo: {
    text: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    hover: 'hover:border-indigo-300',
  },
  amber: {
    text: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    hover: 'hover:border-amber-300',
  },
}

export function StatCardWithTrend({
  title,
  value,
  subtitle,
  trend,
  sparklineData,
  color = 'blue',
  icon,
  onClick,
  href,
  isLoading = false,
  realtime = false,
  unit,
}: StatCardWithTrendProps) {
  const colors = colorClasses[color]
  const isInteractive = !!(onClick || href)

  // Resolve icon - handle both string and component
  const Icon = typeof icon === 'string' ? iconMap[icon] : icon

  const getTrendIcon = () => {
    if (!trend) return null
    if (trend.direction === 'up')
      return <TrendingUp className="w-4 h-4" aria-label="Artış trendi" />
    if (trend.direction === 'down')
      return <TrendingDown className="w-4 h-4" aria-label="Azalış trendi" />
    return <Minus className="w-4 h-4" aria-label="Sabit trend" />
  }

  const getTrendColor = () => {
    if (!trend) return 'text-gray-500'
    if (trend.direction === 'up') return 'text-green-600'
    if (trend.direction === 'down') return 'text-red-600'
    return 'text-gray-500'
  }

  if (isLoading) {
    return (
      <Card variant="elevated" className="animate-pulse">
        <div className="h-32 bg-gray-100 rounded-lg" />
      </Card>
    )
  }

  const cardContent = (
    <Card
      variant="elevated"
      interactive={isInteractive}
      onClick={href ? undefined : onClick}
      className={`group relative overflow-hidden transition-all duration-300 ${
        isInteractive ? 'cursor-pointer' : ''
      }`}
    >
      {/* Real-time indicator */}
      {realtime && (
        <div className="absolute top-3 right-3 z-10">
          <motion.div
            className="w-2 h-2 bg-green-500 rounded-full shadow-lg"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [1, 0.6, 1],
            }}
            transition={{
              repeat: Infinity,
              duration: 2,
              ease: 'easeInOut',
            }}
          />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        </div>

        {Icon && (
          <div
            className={`p-2.5 ${colors.bg} rounded-lg transition-transform group-hover:scale-110`}
          >
            <Icon className={`w-5 h-5 ${colors.text}`} />
          </div>
        )}
      </div>

      {/* Value */}
      <div className="mb-3">
        <div className="flex items-baseline gap-2">
          <motion.p
            className={`text-4xl font-bold ${colors.text}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            key={String(value)}
          >
            {value}
          </motion.p>
          {unit && <span className="text-lg text-gray-500 font-medium">{unit}</span>}
        </div>

        {/* Subtitle or Trend */}
        <div className="flex items-center justify-between mt-2">
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}

          {trend && (
            <div className={`flex items-center gap-1 text-sm font-medium ${getTrendColor()}`}>
              {getTrendIcon()}
              <span>
                {trend.percentage > 0 ? '+' : ''}
                {trend.percentage}%
              </span>
              {trend.period && <span className="text-xs text-gray-400 ml-1">{trend.period}</span>}
            </div>
          )}
        </div>
      </div>

      {/* Sparkline */}
      {sparklineData && sparklineData.length > 0 && (
        <div className="mt-4 -mx-2">
          <MiniSparkline data={sparklineData} color={color} height={40} />
        </div>
      )}

      {/* Hover gradient effect */}
      <div
        className={`absolute inset-0 bg-gradient-to-br from-${color}-500/0 to-${color}-600/0
        group-hover:from-${color}-500/5 group-hover:to-${color}-600/5
        transition-all duration-500 pointer-events-none`}
      />
    </Card>
  )

  // Wrap in Link if href is provided
  if (href) {
    return <Link href={href}>{cardContent}</Link>
  }

  return cardContent
}

// Loading Skeleton
export function StatCardSkeleton() {
  return (
    <Card variant="elevated" className="animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="h-4 bg-gray-200 rounded w-24" />
        <div className="w-10 h-10 bg-gray-200 rounded-lg" />
      </div>
      <div className="h-10 bg-gray-200 rounded w-20 mb-2" />
      <div className="h-3 bg-gray-200 rounded w-32 mb-4" />
      <div className="h-10 bg-gray-100 rounded" />
    </Card>
  )
}
