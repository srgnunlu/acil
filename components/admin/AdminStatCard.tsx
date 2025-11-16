'use client'

import {
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  Briefcase,
  UserPlus,
  Activity,
  TrendingUp as TrendingUpIcon,
  Database,
  Zap,
  Bell,
  FileText,
  AlertTriangle,
  CheckCircle,
  type LucideIcon,
} from 'lucide-react'

interface AdminStatCardProps {
  title: string
  value: string | number
  icon: string // Icon name as string
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'emerald' | 'cyan' | 'amber'
}

const iconMap: Record<string, LucideIcon> = {
  Users,
  Building2,
  Briefcase,
  UserPlus,
  Activity,
  TrendingUp: TrendingUpIcon,
  Database,
  Zap,
  Bell,
  FileText,
  AlertTriangle,
  CheckCircle,
}

const colorClasses = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  purple: 'bg-purple-50 text-purple-600',
  orange: 'bg-orange-50 text-orange-600',
  red: 'bg-red-50 text-red-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  cyan: 'bg-cyan-50 text-cyan-600',
  amber: 'bg-amber-50 text-amber-600',
}

export function AdminStatCard({ title, value, icon, trend, color = 'blue' }: AdminStatCardProps) {
  const Icon = iconMap[icon] || Users // Fallback to Users if icon not found

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              {trend.isPositive ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <span
                className={`text-sm font-medium ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.value}%
              </span>
              <span className="text-sm text-gray-500">bu aydan</span>
            </div>
          )}
        </div>
        <div className={`p-4 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-8 h-8" />
        </div>
      </div>
    </div>
  )
}
