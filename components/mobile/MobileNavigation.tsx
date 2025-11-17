'use client'

// Enhanced Mobile Bottom Navigation Component
// Phase 12 - PWA Enhancement - Improved UX

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Home,
  Users,
  Settings,
  Bell,
  LayoutGrid,
  MoreHorizontal,
  CheckSquare,
  ClipboardList,
  TrendingUp,
  FileText,
  Building2,
  Shield,
  X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus'
import { useState, useEffect } from 'react'

// Primary navigation items (always visible in tab bar)
const primaryNavItems = [
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

// Secondary navigation items (in "More" menu)
const secondaryNavItems = [
  {
    name: 'Görevler',
    href: '/dashboard/tasks',
    icon: CheckSquare,
    activePattern: /^\/dashboard\/tasks/,
    description: 'Görev yönetimi'
  },
  {
    name: 'Vardiya Devir',
    href: '/dashboard/handoffs',
    icon: ClipboardList,
    activePattern: /^\/dashboard\/handoffs/,
    description: 'Hasta devir işlemleri'
  },
  {
    name: 'Analitik',
    href: '/dashboard/analytics',
    icon: TrendingUp,
    activePattern: /^\/dashboard\/analytics/,
    description: 'Raporlar ve istatistikler'
  },
  {
    name: 'Protokoller',
    href: '/dashboard/protocols',
    icon: FileText,
    activePattern: /^\/dashboard\/protocols/,
    description: 'Klinik protokoller'
  },
  {
    name: 'Workspace',
    href: '/dashboard/workspace',
    icon: LayoutGrid,
    activePattern: /^\/dashboard\/workspace/,
    description: 'Workspace yönetimi'
  },
  {
    name: 'Organizasyonlar',
    href: '/dashboard/organizations',
    icon: Building2,
    activePattern: /^\/dashboard\/organizations/,
    description: 'Hastane ve klinikler'
  },
  {
    name: 'Admin Panel',
    href: '/dashboard/admin',
    icon: Shield,
    activePattern: /^\/dashboard\/admin/,
    description: 'Sistem yönetimi',
    adminOnly: true
  },
]

// More Menu Modal Component
function MoreMenuModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname()

  // Close on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3, type: 'spring', damping: 25 }}
            className="fixed bottom-20 left-4 right-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl z-[61] max-h-[70vh] overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="more-menu-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <h2 id="more-menu-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Tüm Sayfalar
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Kapat"
              >
                <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="overflow-y-auto max-h-[calc(70vh-60px)] p-2">
              <div className="grid grid-cols-2 gap-2">
                {secondaryNavItems.map((item) => {
                  const isActive = item.activePattern.test(pathname || '')
                  const Icon = item.icon

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`relative flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                        isActive
                          ? item.adminOnly
                            ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 shadow-sm'
                            : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon className="h-6 w-6" aria-hidden="true" />
                      <div className="text-center">
                        <div className="text-sm font-medium">{item.name}</div>
                        {item.description && (
                          <div className="text-xs opacity-70 mt-0.5">{item.description}</div>
                        )}
                      </div>

                      {/* Active indicator */}
                      {isActive && (
                        <motion.div
                          layoutId="moreMenuActiveIndicator"
                          className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                            item.adminOnly ? 'bg-red-500' : 'bg-blue-500'
                          }`}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export function MobileNavigation() {
  const pathname = usePathname()
  const { isOffline } = useOnlineStatus()
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)

  // Don't show on auth pages
  if (pathname?.startsWith('/login') || pathname?.startsWith('/register')) {
    return null
  }

  // Check if current page is in secondary nav
  const isSecondaryPageActive = secondaryNavItems.some(item =>
    item.activePattern.test(pathname || '')
  )

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-40 safe-area-inset-bottom"
        role="navigation"
        aria-label="Mobil ana navigasyon"
      >
        {/* Offline indicator bar */}
        {isOffline && (
          <div className="bg-red-500 text-white text-xs text-center py-1 font-medium">
            Çevrimdışı Mod
          </div>
        )}

        <div className="flex items-center justify-around px-2 py-2">
          {/* Primary navigation items */}
          {primaryNavItems.map((item) => {
            const isActive = item.activePattern.test(pathname || '')
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex-1 relative flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700"
                aria-label={item.name}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="relative">
                  <Icon
                    className={`h-5 w-5 transition-colors ${
                      isActive
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                    aria-hidden="true"
                  />
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </div>
                <span
                  className={`text-xs font-medium transition-colors truncate max-w-full ${
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

          {/* More menu button */}
          <button
            onClick={() => setIsMoreMenuOpen(true)}
            className="flex-1 relative flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700"
            aria-label="Daha fazla sayfa"
            aria-expanded={isMoreMenuOpen}
          >
            <div className="relative">
              <MoreHorizontal
                className={`h-5 w-5 transition-colors ${
                  isSecondaryPageActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
                aria-hidden="true"
              />
              {/* Active indicator if on secondary page */}
              {isSecondaryPageActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              {/* Badge showing number of secondary items */}
              <span className="absolute -top-1 -right-1 bg-gray-500 dark:bg-gray-600 text-white text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                {secondaryNavItems.length}
              </span>
            </div>
            <span
              className={`text-xs font-medium transition-colors ${
                isSecondaryPageActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Daha Fazla
            </span>
          </button>
        </div>
      </nav>

      {/* More Menu Modal */}
      <MoreMenuModal
        isOpen={isMoreMenuOpen}
        onClose={() => setIsMoreMenuOpen(false)}
      />
    </>
  )
}
