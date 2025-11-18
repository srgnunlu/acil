'use client'

/**
 * Dashboard Share Component
 *
 * UI for sharing dashboards with team members
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Share2,
  Link2,
  Copy,
  Check,
  Download,
  Upload,
  Users,
  Globe,
  Lock,
  Building2,
  Mail,
  Eye,
  Edit,
  Shield,
} from 'lucide-react'
import { DashboardLayout } from '@/types/widget.types'
import type {
  SharePermission,
  ShareVisibility,
  DashboardShare,
} from '@/types/dashboard-sharing.types'
import {
  generateAccessCode,
  generateShareLink,
  getPermissionLabel,
  getPermissionDescription,
  getShareVisibilityLabel,
  getShareVisibilityDescription,
  exportDashboardJSON,
  duplicateDashboard,
  canPerformAction,
} from '@/lib/dashboard/dashboard-sharing'
import { Button } from '@/components/ui/button'

interface DashboardShareProps {
  dashboard: DashboardLayout
  isOpen: boolean
  onClose: () => void
  currentUserPermission?: SharePermission
}

type TabType = 'link' | 'invite' | 'export' | 'activity'

/**
 * Dashboard Share Modal
 */
export function DashboardShare({
  dashboard,
  isOpen,
  onClose,
  currentUserPermission = 'admin',
}: DashboardShareProps) {
  const [activeTab, setActiveTab] = useState<TabType>('link')
  const [copied, setCopied] = useState(false)

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const canShare = canPerformAction(currentUserPermission, 'share')

  if (!canShare) {
    return <PermissionDeniedModal isOpen={isOpen} onClose={onClose} />
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 top-1/2 -translate-y-1/2 w-full md:w-[700px] max-h-[85vh] bg-white dark:bg-gray-900 rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Share2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    Dashboard Paylaş
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{dashboard.name}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-6">
              {[
                { id: 'link' as TabType, label: 'Link Paylaş', icon: Link2 },
                { id: 'invite' as TabType, label: 'Davet Et', icon: Mail },
                { id: 'export' as TabType, label: 'Dışa Aktar', icon: Download },
                { id: 'activity' as TabType, label: 'Aktivite', icon: Users },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`
                    flex items-center gap-2 px-4 py-3 border-b-2 transition-all font-medium text-sm
                    ${
                      activeTab === id
                        ? 'border-blue-600 dark:border-blue-400 text-blue-700 dark:text-blue-400'
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)]">
              {activeTab === 'link' && (
                <ShareLinkTab dashboard={dashboard} onCopy={handleCopy} copied={copied} />
              )}
              {activeTab === 'invite' && <InviteTab dashboard={dashboard} />}
              {activeTab === 'export' && <ExportTab dashboard={dashboard} />}
              {activeTab === 'activity' && <ActivityTab dashboard={dashboard} />}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <Button variant="outline" size="sm" onClick={onClose}>
                Kapat
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/**
 * Share Link Tab
 */
function ShareLinkTab({
  dashboard: _dashboard,
  onCopy,
  copied,
}: {
  dashboard: DashboardLayout
  onCopy: (text: string) => void
  copied: boolean
}) {
  const [visibility, setVisibility] = useState<ShareVisibility>('workspace')
  const [permission, setPermission] = useState<SharePermission>('view')
  const [expiresIn, setExpiresIn] = useState<number>(168) // 7 days

  const accessCode = generateAccessCode()
  const shareUrl = generateShareLink(
    typeof window !== 'undefined' ? window.location.origin : '',
    accessCode
  )

  const visibilityOptions: ShareVisibility[] = ['private', 'workspace', 'organization', 'public']
  const permissionOptions: SharePermission[] = ['view', 'edit', 'admin']

  return (
    <div className="space-y-6">
      {/* Share Link Preview */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <Link2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">Paylaşım Linki</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Bu linki paylaşarak dashboard&apos;unuza erişim sağlayın
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 flex items-center gap-2 mb-2">
          <input
            type="text"
            value={shareUrl}
            readOnly
            className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 outline-none"
          />
          <button
            onClick={() => onCopy(shareUrl)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
          <Lock className="w-4 h-4" />
          <span>
            Erişim Kodu: <strong>{accessCode}</strong>
          </span>
        </div>
      </div>

      {/* Visibility Settings */}
      <div>
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Görünürlük</h4>
        <div className="grid grid-cols-2 gap-2">
          {visibilityOptions.map((vis) => {
            const icons = {
              private: Lock,
              workspace: Users,
              organization: Building2,
              public: Globe,
            }
            const Icon = icons[vis]

            return (
              <button
                key={vis}
                onClick={() => setVisibility(vis)}
                className={`
                  flex items-start gap-3 p-3 rounded-lg border-2 transition-all text-left
                  ${
                    visibility === vis
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                <Icon className="w-5 h-5 mt-0.5 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                    {getShareVisibilityLabel(vis)}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    {getShareVisibilityDescription(vis)}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Permission Settings */}
      <div>
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">İzin Düzeyi</h4>
        <div className="space-y-2">
          {permissionOptions.map((perm) => {
            const icons = {
              view: Eye,
              edit: Edit,
              admin: Shield,
            }
            const Icon = icons[perm]

            return (
              <label
                key={perm}
                className={`
                  flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                  ${
                    permission === perm
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                <input
                  type="radio"
                  checked={permission === perm}
                  onChange={() => setPermission(perm)}
                  className="w-4 h-4 text-blue-600"
                />
                <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                    {getPermissionLabel(perm)}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {getPermissionDescription(perm)}
                  </p>
                </div>
              </label>
            )
          })}
        </div>
      </div>

      {/* Expiration */}
      <div>
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Geçerlilik Süresi</h4>
        <select
          value={expiresIn}
          onChange={(e) => setExpiresIn(parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <option value={24}>24 saat</option>
          <option value={72}>3 gün</option>
          <option value={168}>7 gün</option>
          <option value={720}>30 gün</option>
          <option value={0}>Sınırsız</option>
        </select>
      </div>

      {/* Create Share Button */}
      <Button className="w-full" size="lg">
        Paylaşım Linki Oluştur
      </Button>
    </div>
  )
}

/**
 * Invite Tab
 */
function InviteTab({ dashboard: _dashboard }: { dashboard: DashboardLayout }) {
  const [email, setEmail] = useState('')
  const [permission, setPermission] = useState<SharePermission>('view')

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Email Adresi
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ornek@email.com"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          İzin Düzeyi
        </label>
        <select
          value={permission}
          onChange={(e) => setPermission(e.target.value as SharePermission)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <option value="view">Görüntüleme</option>
          <option value="edit">Düzenleme</option>
          <option value="admin">Yönetici</option>
        </select>
      </div>

      <Button className="w-full">Davet Gönder</Button>

      {/* Pending Invitations */}
      <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Bekleyen Davetler</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400">Henüz bekleyen davet bulunmuyor</p>
      </div>
    </div>
  )
}

/**
 * Export Tab
 */
function ExportTab({ dashboard }: { dashboard: DashboardLayout }) {
  const [copied, setCopied] = useState(false)

  const handleExportJSON = () => {
    const json = exportDashboardJSON(dashboard)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dashboard-${dashboard.id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopyJSON = () => {
    const json = exportDashboardJSON(dashboard)
    navigator.clipboard.writeText(json)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDuplicate = () => {
    const duplicated = duplicateDashboard(dashboard)
    console.log('Duplicated dashboard:', duplicated)
    // In real implementation, save to database
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <Download className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">JSON Olarak İndir</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Dashboard yapılandırmasını JSON dosyası olarak kaydet
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleExportJSON}>
              <Download className="w-4 h-4 mr-2" />
              İndir
            </Button>
            <Button size="sm" variant="outline" onClick={handleCopyJSON}>
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              Kopyala
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <Copy className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Dashboard&apos;u Çoğalt
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Bu dashboard&apos;un bir kopyasını oluştur
          </p>
          <Button size="sm" onClick={handleDuplicate}>
            <Copy className="w-4 h-4 mr-2" />
            Çoğalt
          </Button>
        </div>
      </div>

      <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <Upload className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Dashboard İçe Aktar
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            JSON dosyasından dashboard yükle
          </p>
          <Button size="sm" variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Dosya Seç
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * Activity Tab
 */
function ActivityTab({ dashboard: _dashboard }: { dashboard: DashboardLayout }) {
  return (
    <div className="space-y-4">
      <div className="text-center py-8">
        <Users className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
        <p className="text-lg font-medium text-gray-900 dark:text-gray-100">Henüz aktivite yok</p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Paylaşım aktiviteleri burada görünecek
        </p>
      </div>
    </div>
  )
}

/**
 * Permission Denied Modal
 */
function PermissionDeniedModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-x-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 top-1/2 -translate-y-1/2 w-full md:w-[400px] bg-white dark:bg-gray-900 rounded-xl shadow-2xl z-50 p-6"
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Yetki Gerekli
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Bu dashboard&apos;u paylaşmak için yeterli yetkiniz yok
              </p>
              <Button onClick={onClose}>Tamam</Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
