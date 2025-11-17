/**
 * Dashboard Sharing Utilities
 *
 * Helper functions for dashboard sharing and collaboration
 */

import { DashboardLayout } from '@/types/widget.types'
import {
  DashboardShare,
  ShareLink,
  SharePermission,
  ShareVisibility,
  CreateShareOptions,
} from '@/types/dashboard-sharing.types'

/**
 * Generate unique access code for share link
 */
export function generateAccessCode(length: number = 8): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

/**
 * Generate share link URL
 */
export function generateShareLink(baseUrl: string, accessCode: string): string {
  return `${baseUrl}/share/${accessCode}`
}

/**
 * Validate access code format
 */
export function validateAccessCode(code: string): boolean {
  return /^[A-Z0-9]{8}$/.test(code)
}

/**
 * Check if share is expired
 */
export function isShareExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false
  return new Date(expiresAt) < new Date()
}

/**
 * Check if share is active
 */
export function isShareActive(share: DashboardShare): boolean {
  return share.status === 'active' && !isShareExpired(share.expiresAt)
}

/**
 * Calculate expiration date
 */
export function calculateExpirationDate(hoursFromNow: number): string {
  const date = new Date()
  date.setHours(date.getHours() + hoursFromNow)
  return date.toISOString()
}

/**
 * Format expiration date for display
 */
export function formatExpirationDate(expiresAt: string | null | undefined): string {
  if (!expiresAt) return 'Süresi dolmaz'

  const date = new Date(expiresAt)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffMs < 0) return 'Süresi dolmuş'
  if (diffHours < 1) return '1 saatten az'
  if (diffHours < 24) return `${diffHours} saat`
  if (diffDays === 1) return '1 gün'
  return `${diffDays} gün`
}

/**
 * Get permission label
 */
export function getPermissionLabel(permission: SharePermission): string {
  const labels: Record<SharePermission, string> = {
    view: 'Görüntüleme',
    edit: 'Düzenleme',
    admin: 'Yönetici',
  }
  return labels[permission]
}

/**
 * Get permission description
 */
export function getPermissionDescription(permission: SharePermission): string {
  const descriptions: Record<SharePermission, string> = {
    view: 'Sadece dashboard\' görüntüleyebilir',
    edit: 'Dashboard\'u düzenleyebilir ve widget ekleyebilir',
    admin: 'Tam kontrol (paylaşım ayarları dahil)',
  }
  return descriptions[permission]
}

/**
 * Get share visibility label
 */
export function getShareVisibilityLabel(visibility: ShareVisibility): string {
  const labels: Record<ShareVisibility, string> = {
    private: 'Özel',
    workspace: 'Workspace',
    organization: 'Organizasyon',
    public: 'Herkese Açık',
  }
  return labels[visibility]
}

/**
 * Get share visibility description
 */
export function getShareVisibilityDescription(visibility: ShareVisibility): string {
  const descriptions: Record<ShareVisibility, string> = {
    private: 'Sadece davet edilen kişiler erişebilir',
    workspace: 'Workspace içindeki herkes erişebilir',
    organization: 'Organizasyondaki herkes erişebilir',
    public: 'Link ile herkes erişebilir',
  }
  return descriptions[visibility]
}

/**
 * Export dashboard as JSON
 */
export function exportDashboardJSON(dashboard: DashboardLayout): string {
  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    dashboard: {
      name: dashboard.name,
      description: dashboard.description,
      widgets: dashboard.widgets,
    },
  }
  return JSON.stringify(exportData, null, 2)
}

/**
 * Import dashboard from JSON
 */
export function importDashboardJSON(json: string): DashboardLayout | null {
  try {
    const data = JSON.parse(json)

    if (!data.dashboard || !data.dashboard.widgets) {
      return null
    }

    return {
      id: crypto.randomUUID(),
      name: data.dashboard.name || 'İçe Aktarılan Dashboard',
      description: data.dashboard.description,
      widgets: data.dashboard.widgets,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Failed to import dashboard:', error)
    return null
  }
}

/**
 * Duplicate dashboard with new ID
 */
export function duplicateDashboard(dashboard: DashboardLayout, suffix: string = ' (Kopya)'): DashboardLayout {
  return {
    ...dashboard,
    id: crypto.randomUUID(),
    name: dashboard.name + suffix,
    widgets: dashboard.widgets.map((widget) => ({
      ...widget,
      id: crypto.randomUUID(),
      layout: {
        ...widget.layout,
        i: crypto.randomUUID(),
      },
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Validate dashboard structure
 */
export function validateDashboard(dashboard: Partial<DashboardLayout>): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!dashboard.name) {
    errors.push('Dashboard adı gerekli')
  }

  if (!dashboard.widgets || !Array.isArray(dashboard.widgets)) {
    errors.push('Dashboard widget listesi gerekli')
  } else if (dashboard.widgets.length === 0) {
    errors.push('En az bir widget gerekli')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Sanitize dashboard for sharing (remove sensitive data)
 */
export function sanitizeDashboardForSharing(dashboard: DashboardLayout): DashboardLayout {
  return {
    ...dashboard,
    // Remove any user-specific or sensitive data
    widgets: dashboard.widgets.map((widget) => ({
      ...widget,
      settings: {
        ...widget.settings,
        // Remove user-specific settings if any
        userId: undefined,
        workspaceId: undefined,
      },
    })),
  }
}

/**
 * Check if user can perform action based on permission
 */
export function canPerformAction(
  permission: SharePermission,
  action: 'view' | 'edit' | 'share' | 'delete'
): boolean {
  const permissionLevels = {
    view: ['view'],
    edit: ['view', 'edit'],
    admin: ['view', 'edit', 'share', 'delete'],
  }

  return permissionLevels[permission].includes(action)
}

/**
 * Generate share notification message
 */
export function generateShareNotification(
  userName: string,
  dashboardName: string,
  permission: SharePermission
): string {
  return `${userName} sizinle "${dashboardName}" dashboard'unu paylaştı (${getPermissionLabel(permission)})`
}

/**
 * Format share statistics
 */
export function formatShareStats(share: DashboardShare): {
  views: string
  status: string
  expires: string
} {
  return {
    views: share.views === 1 ? '1 görüntüleme' : `${share.views} görüntüleme`,
    status: isShareActive(share) ? 'Aktif' : 'Pasif',
    expires: formatExpirationDate(share.expiresAt),
  }
}

/**
 * Get share URL for clipboard
 */
export function getShareURLForClipboard(baseUrl: string, accessCode: string): string {
  const url = generateShareLink(baseUrl, accessCode)
  return `Dashboard Paylaşım Linki:\n${url}\n\nErişim Kodu: ${accessCode}`
}

/**
 * Create share email template
 */
export function createShareEmailTemplate(
  senderName: string,
  dashboardName: string,
  shareUrl: string,
  accessCode: string,
  permission: SharePermission
): { subject: string; body: string } {
  return {
    subject: `${senderName} sizinle bir dashboard paylaştı: ${dashboardName}`,
    body: `
Merhaba,

${senderName} sizinle "${dashboardName}" adlı dashboard'unu paylaştı.

Dashboard'a erişmek için:
${shareUrl}

Erişim Kodu: ${accessCode}
İzin Düzeyi: ${getPermissionLabel(permission)}

${getPermissionDescription(permission)}

Dashboard'u görüntülemek için yukarıdaki linke tıklayın.

İyi çalışmalar,
ACIL Team
    `.trim(),
  }
}
