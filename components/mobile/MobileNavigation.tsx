'use client'

// Mobile Bottom Navigation Component
// Phase 12 - PWA Enhancement

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, Users, Settings, Bell, LayoutGrid } from 'lucide-react'
import { motion } from 'framer-motion'
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus'

const navItems = [
  {
    name: 'Ana Sayfa',
    href: '/dashboard',
    icon: Home,
    activePattern: /^\/dashboard$/,
  },
  {
    name: 'Hastalar',
    href: '/dashboard/patients',
    icon: Users,
    activePattern: /^\/dashboard\/patients/,
  },
  {
    name: 'Workspace',
    href: '/dashboard/workspace',
    icon: LayoutGrid,
    activePattern: /^\/dashboard\/workspace/,
  },
  {
    name: 'Bildirimler',
    href: '/dashboard/notifications',
    icon: Bell,
    activePattern: /^\/dashboard\/notifications/,
  },
  {
    name: 'Ayarlar',
    href: '/dashboard/settings',
    icon: Settings,
    activePattern: /^\/dashboard\/settings/,
  },
]

export function MobileNavigation() {
  const pathname = usePathname()
  const { isOffline } = useOnlineStatus()

  // Don't show on auth pages
  if (pathname?.startsWith('/login') || pathname?.startsWith('/register')) {
    return null
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-40 safe-area-inset-bottom">
      {/* Offline indicator bar */}
      {isOffline && (
        <div className="bg-red-500 text-white text-xs text-center py-1">
          Çevrimdışı Mod
        </div>
      )}

      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = item.activePattern.test(pathname || '')
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 relative flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <div className="relative">
                <Icon
                  className={`h-5 w-5 transition-colors ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                />
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </div>
              <span
                className={`text-xs font-medium transition-colors ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {item.name}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
