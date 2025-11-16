'use client'

import { getStatusColor, getSeverityColor } from '@/lib/utils/admin-helpers'

interface AdminBadgeProps {
  label: string
  variant?: 'status' | 'severity' | 'default'
  customColor?: string
  className?: string
}

export function AdminBadge({
  label,
  variant = 'default',
  customColor,
  className = '',
}: AdminBadgeProps) {
  const getColor = () => {
    if (customColor) return customColor

    if (variant === 'status') {
      return getStatusColor(label)
    }

    if (variant === 'severity') {
      return getSeverityColor(label)
    }

    return 'bg-gray-100 text-gray-800'
  }

  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getColor()} ${className}`}>
      {label}
    </span>
  )
}

