'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, BarChart3, Book, Settings, Building2 } from 'lucide-react'

const navItems = [
  { href: '/dashboard/patients', label: 'Hastalar', icon: Users },
  { href: '/dashboard/statistics', label: 'İstatistikler', icon: BarChart3 },
  { href: '/dashboard/guidelines', label: 'Kılavuzlar', icon: Book },
  { href: '/dashboard/organizations', label: 'Organizasyonlar', icon: Building2 },
  { href: '/dashboard/settings', label: 'Ayarlar', icon: Settings },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <nav className="hidden lg:flex space-x-1" role="navigation" aria-label="Ana navigasyon">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href)
        const Icon = item.icon

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group relative px-3 lg:px-4 py-2 rounded-lg text-sm lg:text-base font-medium transition-all duration-200 flex items-center gap-1.5 lg:gap-2 ${
              isActive
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span className="whitespace-nowrap">{item.label}</span>

            {/* Active indicator */}
            {isActive && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 lg:w-12 h-0.5 bg-blue-600 rounded-full" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
