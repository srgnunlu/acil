'use client'

// PWA Settings Page - Client Component
// Phase 12 - PWA Enhancement

import { useState, useEffect } from 'react'
import { usePWA } from '@/lib/hooks/usePWA'
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus'
import { clearAllCaches, checkForUpdates } from '@/lib/pwa/register-sw'
import { getInstallInstructions } from '@/lib/pwa/install-prompt'
import {
  Smartphone,
  Download,
  RefreshCw,
  Trash2,
  WifiOff,
  Wifi,
  Monitor,
  CheckCircle2,
  XCircle,
  Info,
  Bell,
  Database,
  Zap,
} from 'lucide-react'
import toast from 'react-hot-toast'

export function PWASettingsClient() {
  const {
    isSupported,
    isInstalled,
    isInstallable,
    displayMode,
    platform,
    updateAvailable,
    install,
    update,
    checkUpdate,
  } = usePWA()

  const { status, info, isOnline, isSlow } = useOnlineStatus()
  const [cacheSize, setCacheSize] = useState<number | null>(null)
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false)
  const [isClearingCache, setIsClearingCache] = useState(false)
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    // Check cache size
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then((estimate) => {
        if (estimate.usage) {
          setCacheSize(estimate.usage)
        }
      })
    }

    // Check notification permission
    if ('Notification' in window) {
      setPushPermission(Notification.permission)
    }
  }, [])

  const handleInstall = async () => {
    const result = await install()
    if (result.outcome === 'accepted') {
      toast.success('Uygulama başarıyla yüklendi!')
    } else if (result.outcome === 'dismissed') {
      toast.error('Yükleme iptal edildi')
    } else {
      const instructions = getInstallInstructions()
      toast(instructions.instructions, { duration: 5000 })
    }
  }

  const handleUpdate = async () => {
    await update()
    toast.success('Güncelleme uygulanıyor...')
  }

  const handleCheckUpdate = async () => {
    setIsCheckingUpdate(true)
    await checkUpdate()
    setTimeout(() => {
      setIsCheckingUpdate(false)
      toast.success('Güncelleme kontrolü tamamlandı')
    }, 1000)
  }

  const handleClearCache = async () => {
    if (!confirm('Tüm önbellek verilerini silmek istediğinizden emin misiniz?')) {
      return
    }

    setIsClearingCache(true)
    await clearAllCaches()
    setTimeout(() => {
      setIsClearingCache(false)
      setCacheSize(0)
      toast.success('Önbellek temizlendi')
    }, 1000)
  }

  const handleRequestPushPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Tarayıcınız bildirimleri desteklemiyor')
      return
    }

    const permission = await Notification.requestPermission()
    setPushPermission(permission)

    if (permission === 'granted') {
      toast.success('Bildirim izni verildi')
    } else {
      toast.error('Bildirim izni reddedildi')
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
          <Smartphone className="h-8 w-8 text-blue-600" />
          PWA Ayarları
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Progressive Web App özelliklerini yönetin ve uygulamanızı optimize edin
        </p>
      </div>

      {/* PWA Support Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-600" />
          PWA Durumu
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Support Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span className="text-gray-700 dark:text-gray-300">PWA Desteği</span>
            <div className="flex items-center gap-2">
              {isSupported ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-green-600 dark:text-green-400 font-medium">Destekleniyor</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="text-red-600 dark:text-red-400 font-medium">Desteklenmiyor</span>
                </>
              )}
            </div>
          </div>

          {/* Installation Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span className="text-gray-700 dark:text-gray-300">Kurulum Durumu</span>
            <div className="flex items-center gap-2">
              {isInstalled ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-green-600 dark:text-green-400 font-medium">Kurulu</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-yellow-500" />
                  <span className="text-yellow-600 dark:text-yellow-400 font-medium">Kurulu Değil</span>
                </>
              )}
            </div>
          </div>

          {/* Display Mode */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span className="text-gray-700 dark:text-gray-300">Görüntüleme Modu</span>
            <span className="text-gray-900 dark:text-gray-100 font-medium capitalize">{displayMode}</span>
          </div>

          {/* Platform */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span className="text-gray-700 dark:text-gray-300">Platform</span>
            <div className="flex items-center gap-2">
              {platform === 'desktop' ? (
                <Monitor className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              ) : (
                <Smartphone className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              )}
              <span className="text-gray-900 dark:text-gray-100 font-medium capitalize">{platform}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Installation */}
      {isInstallable && !isInstalled && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Download className="h-5 w-5" />
                Uygulamayı Yükle
              </h3>
              <p className="text-blue-100 mb-4">
                ACIL uygulamasını cihazınıza yükleyerek daha hızlı erişim ve offline çalışma özelliklerinden
                yararlanın.
              </p>
              <ul className="text-sm text-blue-100 space-y-1 mb-4">
                <li>✓ Offline çalışma desteği</li>
                <li>✓ Hızlı başlatma</li>
                <li>✓ Push bildirimleri</li>
                <li>✓ Tam ekran deneyim</li>
              </ul>
            </div>
          </div>
          <button
            onClick={handleInstall}
            className="w-full md:w-auto bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
          >
            <Download className="h-4 w-4" />
            Şimdi Yükle
          </button>
        </div>
      )}

      {/* Updates */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-blue-600" />
          Güncellemeler
        </h2>

        {updateAvailable && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
            <p className="text-green-800 dark:text-green-300 mb-3">
              Yeni bir güncelleme mevcut! Güncellemek için aşağıdaki butona tıklayın.
            </p>
            <button
              onClick={handleUpdate}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Güncelle ve Yenile
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleCheckUpdate}
            disabled={isCheckingUpdate}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
            {isCheckingUpdate ? 'Kontrol Ediliyor...' : 'Güncelleme Kontrol Et'}
          </button>
        </div>
      </div>

      {/* Connection Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          {isOnline ? <Wifi className="h-5 w-5 text-green-600" /> : <WifiOff className="h-5 w-5 text-red-600" />}
          Bağlantı Durumu
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span className="text-gray-700 dark:text-gray-300">Durum</span>
            <span
              className={`font-medium ${
                isOnline
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}
            </span>
          </div>

          {info.effectiveType && (
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-700 dark:text-gray-300">Bağlantı Tipi</span>
              <span className="text-gray-900 dark:text-gray-100 font-medium uppercase">
                {info.effectiveType}
              </span>
            </div>
          )}

          {info.downlink !== undefined && (
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-700 dark:text-gray-300">İndirme Hızı</span>
              <span className="text-gray-900 dark:text-gray-100 font-medium">{info.downlink} Mbps</span>
            </div>
          )}

          {info.rtt !== undefined && (
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-700 dark:text-gray-300">Gecikme (RTT)</span>
              <span className="text-gray-900 dark:text-gray-100 font-medium">{info.rtt} ms</span>
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Bell className="h-5 w-5 text-blue-600" />
          Bildirimler
        </h2>

        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg mb-4">
          <span className="text-gray-700 dark:text-gray-300">Push Bildirim İzni</span>
          <span
            className={`font-medium ${
              pushPermission === 'granted'
                ? 'text-green-600 dark:text-green-400'
                : pushPermission === 'denied'
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-yellow-600 dark:text-yellow-400'
            }`}
          >
            {pushPermission === 'granted' ? 'Verildi' : pushPermission === 'denied' ? 'Reddedildi' : 'Bekleniyor'}
          </span>
        </div>

        {pushPermission !== 'granted' && (
          <button
            onClick={handleRequestPushPermission}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Bell className="h-4 w-4" />
            Bildirim İzni İste
          </button>
        )}
      </div>

      {/* Cache Management */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Database className="h-5 w-5 text-blue-600" />
          Önbellek Yönetimi
        </h2>

        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg mb-4">
          <span className="text-gray-700 dark:text-gray-300">Önbellek Boyutu</span>
          <span className="text-gray-900 dark:text-gray-100 font-medium">
            {cacheSize !== null ? formatBytes(cacheSize) : 'Hesaplanıyor...'}
          </span>
        </div>

        <button
          onClick={handleClearCache}
          disabled={isClearingCache}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          {isClearingCache ? 'Temizleniyor...' : 'Önbelleği Temizle'}
        </button>
      </div>

      {/* Performance Tips */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
        <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-600" />
          Performans İpuçları
        </h2>

        <ul className="space-y-2 text-blue-800 dark:text-blue-200">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span>Uygulamayı cihazınıza yükleyerek daha hızlı başlatma sürelerine ulaşın</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span>Offline modda çalışabilmek için önbellek özelliğini aktif tutun</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span>Düzenli olarak güncellemeleri kontrol edin ve uygulayın</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span>Push bildirimleri açarak önemli uyarıları kaçırmayın</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
