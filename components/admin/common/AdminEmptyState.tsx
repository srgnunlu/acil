'use client'

import { ReactNode } from 'react'
import { Inbox } from 'lucide-react'

interface AdminEmptyStateProps {
  title?: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  className?: string
}

export function AdminEmptyState({
  title = 'Veri bulunamadı',
  description = 'Henüz kayıt bulunmuyor.',
  icon,
  action,
  className = '',
}: AdminEmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      {icon || (
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Inbox className="w-8 h-8 text-gray-400" />
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 text-center max-w-md mb-4">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

