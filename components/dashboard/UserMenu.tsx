'use client'

import { User } from '@supabase/supabase-js'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

interface Profile {
  full_name?: string
  subscription_tier?: string
}

interface UserMenuProps {
  user: User
  profile: Profile | null
  patientCount: number
  patientLimit: number
  usagePercentage: number
}

export function UserMenu({
  user,
  profile,
  patientCount,
  patientLimit,
  usagePercentage,
}: UserMenuProps) {
  const getProgressColor = () => {
    if (usagePercentage >= 90) return 'bg-red-500'
    if (usagePercentage >= 75) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div className="flex items-center gap-3">
      <ThemeToggle />

      <div className="text-right hidden sm:block">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {profile?.full_name || user.email}
        </p>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {patientCount}/{patientLimit} hasta
              </span>
              {profile?.subscription_tier === 'free' && (
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  (Ücretsiz)
                </span>
              )}
            </div>
            {/* Progress bar */}
            <div className="w-24 h-1 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden mt-1">
              <div
                className={`h-full ${getProgressColor()} transition-all duration-300`}
                style={{ width: `${usagePercentage}%` }}
                role="progressbar"
                aria-valuenow={usagePercentage}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Hasta limiti kullanımı: %${Math.round(usagePercentage)}`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
