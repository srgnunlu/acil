/**
 * Command Palette Commands
 *
 * Centralized command definitions for the command palette
 */

import {
  Home,
  Users,
  BarChart3,
  Settings,
  Plus,
  Download,
  Share2,
  Palette,
  Grid3x3,
  HelpCircle,
  Search,
  FileText,
  Calendar,
  Bell,
  Workflow,
  Activity,
  Zap,
  Database,
  Layout,
  Keyboard,
} from 'lucide-react'
import { Command, CommandCategory } from '@/types/command-palette.types'

/**
 * Navigation Commands
 */
export const NAVIGATION_COMMANDS: Command[] = [
  {
    id: 'nav-dashboard',
    label: 'Ana Sayfa',
    description: 'Dashboard ana sayfasına git',
    category: 'navigation',
    keywords: ['home', 'dashboard', 'ana'],
    icon: <Home className="w-4 h-4" />,
    shortcut: { key: 'd', ctrl: true },
    action: () => {
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard'
      }
    },
  },
  {
    id: 'nav-patients',
    label: 'Hasta Listesi',
    description: 'Tüm hastaları görüntüle',
    category: 'navigation',
    keywords: ['patients', 'hasta', 'liste'],
    icon: <Users className="w-4 h-4" />,
    shortcut: { key: 'p', ctrl: true },
    action: () => {
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard/patients'
      }
    },
  },
  {
    id: 'nav-statistics',
    label: 'İstatistikler',
    description: 'Analiz ve istatistikler',
    category: 'navigation',
    keywords: ['statistics', 'analytics', 'istatistik', 'analiz'],
    icon: <BarChart3 className="w-4 h-4" />,
    shortcut: { key: 'a', ctrl: true },
    action: () => {
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard/statistics'
      }
    },
  },
  {
    id: 'nav-settings',
    label: 'Ayarlar',
    description: 'Uygulama ayarları',
    category: 'navigation',
    keywords: ['settings', 'ayarlar', 'preferences'],
    icon: <Settings className="w-4 h-4" />,
    shortcut: { key: 's', ctrl: true },
    action: () => {
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard/settings'
      }
    },
  },
  {
    id: 'nav-guidelines',
    label: 'Kılavuzlar',
    description: 'Klinik kılavuzlar ve protokoller',
    category: 'navigation',
    keywords: ['guidelines', 'protocols', 'kılavuz', 'protokol'],
    icon: <FileText className="w-4 h-4" />,
    action: () => {
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard/guidelines'
      }
    },
  },
  {
    id: 'nav-workspace',
    label: 'Workspace Yönetimi',
    description: 'Workspace ayarları ve üye yönetimi',
    category: 'navigation',
    keywords: ['workspace', 'team', 'ekip', 'alan'],
    icon: <Workflow className="w-4 h-4" />,
    action: () => {
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard/workspace'
      }
    },
  },
]

/**
 * Action Commands
 */
export const ACTION_COMMANDS: Command[] = [
  {
    id: 'action-new-patient',
    label: 'Yeni Hasta Ekle',
    description: 'Yeni hasta kaydı oluştur',
    category: 'actions',
    keywords: ['new', 'patient', 'add', 'create', 'yeni', 'hasta', 'ekle'],
    icon: <Plus className="w-4 h-4" />,
    shortcut: { key: 'n', ctrl: true },
    action: () => {
      // Will be implemented with modal
      console.log('Open new patient modal')
    },
  },
  {
    id: 'action-search',
    label: 'Arama Yap',
    description: 'Global arama',
    category: 'actions',
    keywords: ['search', 'find', 'ara', 'bul'],
    icon: <Search className="w-4 h-4" />,
    shortcut: { key: '/' },
    action: () => {
      // Will focus search input
      const searchInput = document.querySelector<HTMLInputElement>('#global-search')
      searchInput?.focus()
    },
  },
  {
    id: 'action-export-data',
    label: 'Veri Dışa Aktar',
    description: 'Dashboard verilerini dışa aktar',
    category: 'actions',
    keywords: ['export', 'download', 'dışa aktar', 'indir'],
    icon: <Download className="w-4 h-4" />,
    action: () => {
      console.log('Open export modal')
    },
  },
  {
    id: 'action-notifications',
    label: 'Bildirimler',
    description: 'Bildirimleri görüntüle',
    category: 'actions',
    keywords: ['notifications', 'alerts', 'bildirim', 'uyarı'],
    icon: <Bell className="w-4 h-4" />,
    action: () => {
      console.log('Open notifications panel')
    },
  },
]

/**
 * Dashboard Commands
 */
export const DASHBOARD_COMMANDS: Command[] = [
  {
    id: 'dashboard-edit-mode',
    label: 'Dashboard Düzenle',
    description: 'Dashboard düzenleme modunu aç/kapat',
    category: 'dashboard',
    keywords: ['edit', 'customize', 'düzenle', 'özelleştir'],
    icon: <Layout className="w-4 h-4" />,
    shortcut: { key: 'e', ctrl: true },
    action: () => {
      console.log('Toggle dashboard edit mode')
    },
  },
  {
    id: 'dashboard-share',
    label: 'Dashboard Paylaş',
    description: 'Dashboard paylaşım ayarları',
    category: 'dashboard',
    keywords: ['share', 'paylaş', 'link'],
    icon: <Share2 className="w-4 h-4" />,
    action: () => {
      console.log('Open share modal')
    },
  },
  {
    id: 'dashboard-reset',
    label: 'Dashboard Sıfırla',
    description: 'Dashboard\'u varsayılan haline döndür',
    category: 'dashboard',
    keywords: ['reset', 'default', 'sıfırla', 'varsayılan'],
    icon: <Database className="w-4 h-4" />,
    action: () => {
      if (confirm('Dashboard\'u varsayılan haline döndürmek istediğinize emin misiniz?')) {
        console.log('Reset dashboard')
      }
    },
  },
]

/**
 * Widget Commands
 */
export const WIDGET_COMMANDS: Command[] = [
  {
    id: 'widget-add',
    label: 'Widget Ekle',
    description: 'Dashboard\'a yeni widget ekle',
    category: 'widgets',
    keywords: ['widget', 'add', 'ekle', 'yeni'],
    icon: <Grid3x3 className="w-4 h-4" />,
    shortcut: { key: 'w', ctrl: true },
    action: () => {
      console.log('Open widget library')
    },
  },
  {
    id: 'widget-remove-all',
    label: 'Tüm Widget\'ları Kaldır',
    description: 'Dashboard\'daki tüm widget\'ları kaldır',
    category: 'widgets',
    keywords: ['widget', 'remove', 'clear', 'kaldır', 'temizle'],
    icon: <Grid3x3 className="w-4 h-4" />,
    action: () => {
      if (confirm('Tüm widget\'ları kaldırmak istediğinize emin misiniz?')) {
        console.log('Remove all widgets')
      }
    },
  },
]

/**
 * Theme Commands
 */
export const THEME_COMMANDS: Command[] = [
  {
    id: 'theme-selector',
    label: 'Tema Değiştir',
    description: 'Tema seçici\'yi aç',
    category: 'theme',
    keywords: ['theme', 'color', 'tema', 'renk'],
    icon: <Palette className="w-4 h-4" />,
    shortcut: { key: 't', ctrl: true },
    action: () => {
      console.log('Open theme selector')
    },
  },
  {
    id: 'theme-toggle-dark',
    label: 'Karanlık Mod',
    description: 'Karanlık modu aç/kapat',
    category: 'theme',
    keywords: ['dark', 'mode', 'karanlık'],
    icon: <Palette className="w-4 h-4" />,
    action: () => {
      console.log('Toggle dark mode')
    },
  },
  {
    id: 'theme-toggle-light',
    label: 'Aydınlık Mod',
    description: 'Aydınlık modu aç/kapat',
    category: 'theme',
    keywords: ['light', 'mode', 'aydınlık'],
    icon: <Palette className="w-4 h-4" />,
    action: () => {
      console.log('Toggle light mode')
    },
  },
]

/**
 * Settings Commands
 */
export const SETTINGS_COMMANDS: Command[] = [
  {
    id: 'settings-profile',
    label: 'Profil Ayarları',
    description: 'Kullanıcı profili düzenle',
    category: 'settings',
    keywords: ['profile', 'user', 'profil', 'kullanıcı'],
    icon: <Settings className="w-4 h-4" />,
    action: () => {
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard/settings/profile'
      }
    },
  },
  {
    id: 'settings-notifications',
    label: 'Bildirim Ayarları',
    description: 'Bildirim tercihlerini düzenle',
    category: 'settings',
    keywords: ['notifications', 'preferences', 'bildirim', 'tercih'],
    icon: <Bell className="w-4 h-4" />,
    action: () => {
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard/settings/notifications'
      }
    },
  },
  {
    id: 'settings-workspace',
    label: 'Workspace Ayarları',
    description: 'Workspace yapılandırması',
    category: 'settings',
    keywords: ['workspace', 'team', 'alan', 'ekip'],
    icon: <Workflow className="w-4 h-4" />,
    action: () => {
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard/workspace/settings'
      }
    },
  },
]

/**
 * Help Commands
 */
export const HELP_COMMANDS: Command[] = [
  {
    id: 'help-shortcuts',
    label: 'Klavye Kısayolları',
    description: 'Tüm klavye kısayollarını göster',
    category: 'help',
    keywords: ['keyboard', 'shortcuts', 'klavye', 'kısayol'],
    icon: <Keyboard className="w-4 h-4" />,
    shortcut: { key: '?', shift: true },
    action: () => {
      console.log('Open keyboard shortcuts modal')
    },
  },
  {
    id: 'help-documentation',
    label: 'Dokümantasyon',
    description: 'Yardım dokümantasyonu',
    category: 'help',
    keywords: ['help', 'docs', 'documentation', 'yardım', 'dokümantasyon'],
    icon: <HelpCircle className="w-4 h-4" />,
    action: () => {
      if (typeof window !== 'undefined') {
        window.open('/docs', '_blank')
      }
    },
  },
  {
    id: 'help-tour',
    label: 'Uygulamayı Keşfet',
    description: 'Yönlendirmeli turu başlat',
    category: 'help',
    keywords: ['tour', 'tutorial', 'guide', 'rehber', 'tur'],
    icon: <Activity className="w-4 h-4" />,
    action: () => {
      console.log('Start tutorial tour')
    },
  },
  {
    id: 'help-whats-new',
    label: 'Yeni Özellikler',
    description: 'Son güncellemeleri gör',
    category: 'help',
    keywords: ['new', 'features', 'updates', 'yeni', 'güncellemeler'],
    icon: <Zap className="w-4 h-4" />,
    action: () => {
      console.log('Open what\'s new modal')
    },
  },
]

/**
 * All Commands Registry
 */
export const ALL_COMMANDS: Command[] = [
  ...NAVIGATION_COMMANDS,
  ...ACTION_COMMANDS,
  ...DASHBOARD_COMMANDS,
  ...WIDGET_COMMANDS,
  ...THEME_COMMANDS,
  ...SETTINGS_COMMANDS,
  ...HELP_COMMANDS,
]

/**
 * Get commands by category
 */
export function getCommandsByCategory(category: CommandCategory): Command[] {
  return ALL_COMMANDS.filter((cmd) => cmd.category === category)
}

/**
 * Get command by ID
 */
export function getCommandById(id: string): Command | undefined {
  return ALL_COMMANDS.find((cmd) => cmd.id === id)
}

/**
 * Category Labels
 */
export const CATEGORY_LABELS: Record<CommandCategory, string> = {
  navigation: 'Navigasyon',
  actions: 'Eylemler',
  dashboard: 'Dashboard',
  widgets: 'Widget\'lar',
  theme: 'Tema',
  settings: 'Ayarlar',
  help: 'Yardım',
}

/**
 * Get category label
 */
export function getCategoryLabel(category: CommandCategory): string {
  return CATEGORY_LABELS[category] || category
}

/**
 * Format keyboard shortcut for display
 */
export function formatShortcut(shortcut?: {
  key: string
  ctrl?: boolean
  alt?: boolean
  shift?: boolean
  meta?: boolean
}): string {
  if (!shortcut) return ''

  const parts: string[] = []

  if (shortcut.ctrl) parts.push('Ctrl')
  if (shortcut.alt) parts.push('Alt')
  if (shortcut.shift) parts.push('Shift')
  if (shortcut.meta) parts.push('⌘')

  parts.push(shortcut.key.toUpperCase())

  return parts.join('+')
}
