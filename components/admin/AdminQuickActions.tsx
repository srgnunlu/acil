'use client'

import Link from 'next/link'
import { UserPlus, Building2, Briefcase, FileText, Settings, Database, Zap, Shield } from 'lucide-react'

const quickActions = [
  {
    title: 'Kullanıcı Ekle',
    description: 'Yeni kullanıcı oluştur',
    icon: UserPlus,
    href: '/dashboard/admin/users?action=create',
    color: 'blue',
  },
  {
    title: 'Organizasyon Ekle',
    description: 'Yeni organizasyon oluştur',
    icon: Building2,
    href: '/dashboard/admin/organizations?action=create',
    color: 'purple',
  },
  {
    title: 'Workspace Ekle',
    description: 'Yeni workspace oluştur',
    icon: Briefcase,
    href: '/dashboard/admin/workspaces?action=create',
    color: 'green',
  },
  {
    title: 'Sistem Ayarları',
    description: 'Global ayarları düzenle',
    icon: Settings,
    href: '/dashboard/admin/settings',
    color: 'gray',
  },
  {
    title: 'Veritabanı Yönetimi',
    description: 'Tablolar ve RLS',
    icon: Database,
    href: '/dashboard/admin/database',
    color: 'cyan',
  },
  {
    title: 'AI Ayarları',
    description: 'AI servisleri yapılandırması',
    icon: Zap,
    href: '/dashboard/admin/settings?tab=ai',
    color: 'amber',
  },
]

const colorClasses = {
  blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
  purple: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
  green: 'bg-green-50 text-green-600 hover:bg-green-100',
  gray: 'bg-gray-50 text-gray-600 hover:bg-gray-100',
  cyan: 'bg-cyan-50 text-cyan-600 hover:bg-cyan-100',
  amber: 'bg-amber-50 text-amber-600 hover:bg-amber-100',
  red: 'bg-red-50 text-red-600 hover:bg-red-100',
}

export function AdminQuickActions() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Hızlı İşlemler</h3>

      <div className="space-y-2">
        {quickActions.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.href}
              href={action.href}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                colorClasses[action.color as keyof typeof colorClasses]
              }`}
            >
              <Icon className="w-5 h-5" />
              <div className="flex-1">
                <p className="text-sm font-medium">{action.title}</p>
                <p className="text-xs opacity-75">{action.description}</p>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <Link
          href="/dashboard/admin/settings"
          className="flex items-center justify-center gap-2 w-full py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
        >
          <Shield className="w-4 h-4" />
          Tüm Ayarlar
        </Link>
      </div>
    </div>
  )
}
