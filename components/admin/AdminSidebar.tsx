'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  UserPlus,
  Activity,
  Bell,
  Database,
  Settings,
  FileText,
  Zap,
  TrendingUp,
  Shield,
  AlertTriangle,
  Clipboard,
  MessageSquare,
  Calendar,
  BarChart3,
} from 'lucide-react'

const navSections = [
  {
    title: 'Genel Bakış',
    items: [
      { href: '/dashboard/admin', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/dashboard/admin/analytics', label: 'Analitik', icon: TrendingUp },
      { href: '/dashboard/admin/system-health', label: 'Sistem Sağlığı', icon: Activity },
    ],
  },
  {
    title: 'Kullanıcı Yönetimi',
    items: [
      { href: '/dashboard/admin/users', label: 'Kullanıcılar', icon: Users },
      { href: '/dashboard/admin/organizations', label: 'Organizasyonlar', icon: Building2 },
      { href: '/dashboard/admin/workspaces', label: 'Workspace\'ler', icon: Briefcase },
      { href: '/dashboard/admin/invitations', label: 'Davetiyeler', icon: UserPlus },
    ],
  },
  {
    title: 'Veri Yönetimi',
    items: [
      { href: '/dashboard/admin/patients', label: 'Hastalar', icon: Clipboard },
      { href: '/dashboard/admin/patient-data', label: 'Hasta Verileri', icon: FileText },
      { href: '/dashboard/admin/categories', label: 'Kategoriler', icon: BarChart3 },
      { href: '/dashboard/admin/protocols', label: 'Protokoller', icon: Shield },
    ],
  },
  {
    title: 'AI & İzleme',
    items: [
      { href: '/dashboard/admin/ai-monitoring', label: 'AI Kullanımı', icon: Zap },
      { href: '/dashboard/admin/ai-costs', label: 'AI Maliyetleri', icon: TrendingUp },
      { href: '/dashboard/admin/ai-alerts', label: 'AI Uyarıları', icon: AlertTriangle },
    ],
  },
  {
    title: 'Aktivite & İletişim',
    items: [
      { href: '/dashboard/admin/activity-logs', label: 'Aktivite Logları', icon: Activity },
      { href: '/dashboard/admin/notifications', label: 'Bildirimler', icon: Bell },
      { href: '/dashboard/admin/sticky-notes', label: 'Sticky Notes', icon: MessageSquare },
    ],
  },
  {
    title: 'Sistem',
    items: [
      { href: '/dashboard/admin/database', label: 'Veritabanı', icon: Database },
      { href: '/dashboard/admin/settings', label: 'Ayarlar', icon: Settings },
    ],
  },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <Shield className="w-8 h-8 text-red-600" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Admin Panel</h2>
            <p className="text-xs text-gray-500">Sistem Yönetimi</p>
          </div>
        </div>

        <nav className="space-y-6">
          {navSections.map((section) => (
            <div key={section.title}>
              <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href
                  const Icon = item.icon

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-red-50 text-red-700'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Back to Dashboard */}
      <div className="p-6 border-t border-gray-200">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <LayoutDashboard className="w-4 h-4" />
          Ana Panel'e Dön
        </Link>
      </div>
    </aside>
  )
}
