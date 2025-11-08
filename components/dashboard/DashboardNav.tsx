'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, BarChart3, Book, Settings } from 'lucide-react'

const navItems = [
  { href: '/dashboard/patients', label: 'Hastalar', icon: Users },
  { href: '/dashboard/statistics', label: 'İstatistikler', icon: BarChart3 },
  { href: '/dashboard/guidelines', label: 'Kılavuzlar', icon: Book },
  { href: '/dashboard/settings', label: 'Ayarlar', icon: Settings },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <nav className="hidden md:flex space-x-1" role="navigation" aria-label="Ana navigasyon">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href)
        const Icon = item.icon

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group relative px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
              isActive
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-slate-700/50'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className="w-4 h-4" aria-hidden="true" />
            <span>{item.label}</span>

            {/* Active indicator */}
            {isActive && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
