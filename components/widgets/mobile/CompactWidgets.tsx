'use client'

/**
 * Compact Mobile Widgets
 *
 * Optimized widget components for mobile screens
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  AlertTriangle,
  Clock,
  ChevronRight,
  Heart,
  Thermometer,
  Droplet,
  Wind,
} from 'lucide-react'
import { triggerHaptic } from '@/lib/utils/haptics'

/**
 * Compact Stats Widget
 *
 * Minimal stats display for mobile
 */
interface CompactStatsWidgetProps {
  stats: {
    label: string
    value: string | number
    change?: number
    trend?: 'up' | 'down'
    icon?: React.ReactNode
  }[]
  onClick?: (index: number) => void
}

export function CompactStatsWidget({ stats, onClick }: CompactStatsWidgetProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat, index) => (
        <motion.button
          key={index}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            triggerHaptic('light')
            onClick?.(index)
          }}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-left active:bg-gray-50 dark:active:bg-gray-700 transition-colors"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="text-gray-600 dark:text-gray-400">{stat.icon}</div>
            {stat.change !== undefined && (
              <div
                className={`
                  flex items-center gap-1 text-xs font-medium
                  ${stat.trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}
                `}
              >
                {stat.trend === 'up' ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {Math.abs(stat.change)}%
              </div>
            )}
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            {stat.value}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">{stat.label}</p>
        </motion.button>
      ))}
    </div>
  )
}

/**
 * Compact Patient List Widget
 *
 * Minimal patient list for mobile
 */
interface CompactPatientListWidgetProps {
  patients: {
    id: string
    name: string
    age: number
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
    time: string
  }[]
  onPatientClick?: (patientId: string) => void
}

export function CompactPatientListWidget({
  patients,
  onPatientClick,
}: CompactPatientListWidgetProps) {
  const riskColors = {
    low: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400',
    medium: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400',
    high: 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400',
    critical: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400',
  }

  return (
    <div className="space-y-2">
      {patients.map((patient) => (
        <motion.button
          key={patient.id}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            triggerHaptic('light')
            onPatientClick?.(patient.id)
          }}
          className="w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 flex items-center gap-3 active:bg-gray-50 dark:active:bg-gray-700 transition-colors"
        >
          <div
            className={`
              w-10 h-10 rounded-full flex items-center justify-center
              ${riskColors[patient.riskLevel]}
            `}
          >
            <Users className="w-5 h-5" />
          </div>
          <div className="flex-1 text-left">
            <div className="flex items-center justify-between mb-1">
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {patient.name}
              </p>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {patient.time}
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">{patient.age} yaş</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </motion.button>
      ))}
    </div>
  )
}

/**
 * Compact Alert Widget
 *
 * Minimal alert display for mobile
 */
interface CompactAlertWidgetProps {
  alerts: {
    id: string
    title: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    time: string
  }[]
  onAlertClick?: (alertId: string) => void
}

export function CompactAlertWidget({ alerts, onAlertClick }: CompactAlertWidgetProps) {
  const severityConfig = {
    low: {
      color: 'bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
      textColor: 'text-blue-700 dark:text-blue-400',
      icon: <Activity className="w-4 h-4" />,
    },
    medium: {
      color:
        'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
      textColor: 'text-yellow-700 dark:text-yellow-400',
      icon: <Clock className="w-4 h-4" />,
    },
    high: {
      color:
        'bg-orange-100 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
      textColor: 'text-orange-700 dark:text-orange-400',
      icon: <AlertTriangle className="w-4 h-4" />,
    },
    critical: {
      color: 'bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800',
      textColor: 'text-red-700 dark:text-red-400',
      icon: <AlertTriangle className="w-4 h-4" />,
    },
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert) => {
        const config = severityConfig[alert.severity]

        return (
          <motion.button
            key={alert.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              triggerHaptic('warning')
              onAlertClick?.(alert.id)
            }}
            className={`
              w-full rounded-lg border p-3 flex items-start gap-3 text-left
              active:opacity-80 transition-opacity
              ${config.color}
            `}
          >
            <div className={config.textColor}>{config.icon}</div>
            <div className="flex-1">
              <p className={`font-medium text-sm ${config.textColor}`}>{alert.title}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {alert.time}
              </p>
            </div>
            <ChevronRight className={`w-5 h-5 ${config.textColor}`} />
          </motion.button>
        )
      })}
    </div>
  )
}

/**
 * Compact Vitals Widget
 *
 * Quick vital signs display
 */
interface CompactVitalsWidgetProps {
  vitals: {
    heartRate?: number
    temperature?: number
    bloodPressure?: string
    oxygenSaturation?: number
  }
  onVitalClick?: (vital: string) => void
}

export function CompactVitalsWidget({ vitals, onVitalClick }: CompactVitalsWidgetProps) {
  const vitalItems = [
    {
      key: 'heartRate',
      label: 'Nabız',
      value: vitals.heartRate ? `${vitals.heartRate} bpm` : '-',
      icon: <Heart className="w-5 h-5" />,
      color: 'text-red-600 dark:text-red-400',
    },
    {
      key: 'temperature',
      label: 'Ateş',
      value: vitals.temperature ? `${vitals.temperature}°C` : '-',
      icon: <Thermometer className="w-5 h-5" />,
      color: 'text-orange-600 dark:text-orange-400',
    },
    {
      key: 'bloodPressure',
      label: 'Tansiyon',
      value: vitals.bloodPressure || '-',
      icon: <Activity className="w-5 h-5" />,
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      key: 'oxygenSaturation',
      label: 'SpO2',
      value: vitals.oxygenSaturation ? `${vitals.oxygenSaturation}%` : '-',
      icon: <Wind className="w-5 h-5" />,
      color: 'text-green-600 dark:text-green-400',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      {vitalItems.map((vital) => (
        <motion.button
          key={vital.key}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            triggerHaptic('light')
            onVitalClick?.(vital.key)
          }}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 text-center active:bg-gray-50 dark:active:bg-gray-700 transition-colors"
        >
          <div className={`flex justify-center mb-2 ${vital.color}`}>{vital.icon}</div>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
            {vital.value}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">{vital.label}</p>
        </motion.button>
      ))}
    </div>
  )
}

/**
 * Compact Activity Feed Widget
 *
 * Minimal activity stream for mobile
 */
interface CompactActivityFeedProps {
  activities: {
    id: string
    type: string
    message: string
    time: string
    user: string
  }[]
  onActivityClick?: (activityId: string) => void
}

export function CompactActivityFeed({ activities, onActivityClick }: CompactActivityFeedProps) {
  const activityIcons: Record<string, React.ReactNode> = {
    patient_created: <Users className="w-4 h-4" />,
    ai_analysis: <Activity className="w-4 h-4" />,
    test_added: <Droplet className="w-4 h-4" />,
    status_change: <AlertTriangle className="w-4 h-4" />,
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <motion.button
          key={activity.id}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            triggerHaptic('light')
            onActivityClick?.(activity.id)
          }}
          className="w-full text-left flex gap-3 active:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
            {activityIcons[activity.type] || <Activity className="w-4 h-4" />}
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-900 dark:text-gray-100 mb-1">
              {activity.message}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {activity.user} • {activity.time}
            </p>
          </div>
        </motion.button>
      ))}
    </div>
  )
}

/**
 * Compact Quick Actions Widget
 *
 * Quick action buttons for mobile
 */
interface CompactQuickActionsProps {
  actions: {
    id: string
    label: string
    icon: React.ReactNode
    color: string
  }[]
  onActionClick?: (actionId: string) => void
}

export function CompactQuickActions({ actions, onActionClick }: CompactQuickActionsProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {actions.map((action) => (
        <motion.button
          key={action.id}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            triggerHaptic('medium')
            onActionClick?.(action.id)
          }}
          className={`
            flex flex-col items-center justify-center gap-2 p-4 rounded-xl
            active:opacity-80 transition-opacity
            ${action.color}
          `}
        >
          {action.icon}
          <span className="text-xs font-medium">{action.label}</span>
        </motion.button>
      ))}
    </div>
  )
}

/**
 * Mobile Widget Skeleton
 *
 * Loading skeleton for mobile widgets
 */
export function MobileWidgetSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        </div>
      </div>
      <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
    </div>
  )
}
