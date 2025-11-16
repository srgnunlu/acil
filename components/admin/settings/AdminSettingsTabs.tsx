'use client'

import { useState, useEffect } from 'react'
import { Settings, Zap, Mail, Bell, Shield, Database, Code, Loader2 } from 'lucide-react'

const tabs = [
  { id: 'general', label: 'Genel', icon: Settings },
  { id: 'ai', label: 'AI Servisleri', icon: Zap },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'notifications', label: 'Bildirimler', icon: Bell },
  { id: 'security', label: 'Güvenlik', icon: Shield },
  { id: 'database', label: 'Veritabanı', icon: Database },
  { id: 'api', label: 'API', icon: Code },
]

export function AdminSettingsTabs() {
  const [activeTab, setActiveTab] = useState('general')
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async (updates: any) => {
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        await fetchSettings()
        alert('Ayarlar başarıyla kaydedildi')
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      alert('Ayarlar kaydedilemedi')
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4 px-6" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'general' && <GeneralSettings onSave={saveSettings} />}
        {activeTab === 'ai' && <AISettings settings={settings?.ai} onSave={saveSettings} />}
        {activeTab === 'email' && <EmailSettings settings={settings?.email} onSave={saveSettings} />}
        {activeTab === 'notifications' && <NotificationSettings settings={settings?.notifications} onSave={saveSettings} />}
        {activeTab === 'security' && <SecuritySettings settings={settings?.security} onSave={saveSettings} />}
        {activeTab === 'database' && <DatabaseSettings onSave={saveSettings} />}
        {activeTab === 'api' && <APISettings settings={settings?.rate_limiting} onSave={saveSettings} />}
      </div>
    </div>
  )
}

function GeneralSettings({ onSave }: { onSave: (updates: any) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Genel Ayarlar</h3>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-blue-800">
            Bu ayarlar şu anda sadece görüntüleme amaçlıdır. Değişiklikler environment variables üzerinden yapılmalıdır.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Uygulama Adı
            </label>
            <input
              type="text"
              defaultValue="ACIL"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Dil</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="tr">Türkçe</option>
              <option value="en">English</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Varsayılan Hasta Limiti
            </label>
            <input
              type="number"
              defaultValue="100"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Varsayılan Workspace Limiti
            </label>
            <input
              type="number"
              defaultValue="10"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          İptal
        </button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Kaydet
        </button>
      </div>
    </div>
  )
}

function AISettings({ settings, onSave }: { settings: any; onSave: (updates: any) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Servisleri Ayarları</h3>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-blue-800">
            OpenAI: {settings?.openai_enabled ? '✅ Aktif' : '❌ İnaktif'} |
            Gemini: {settings?.gemini_enabled ? ' ✅ Aktif' : ' ❌ İnaktif'} |
            Model: {settings?.default_model || 'gpt-4'}
          </p>
        </div>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              OpenAI API Key
            </label>
            <input
              type="password"
              placeholder="sk-..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Google Gemini API Key
            </label>
            <input
              type="password"
              placeholder="AI..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Varsayılan GPT Model
              </label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rate Limit (req/min)
              </label>
              <input
                type="number"
                defaultValue="10"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          İptal
        </button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Kaydet
        </button>
      </div>
    </div>
  )
}

function EmailSettings({ settings, onSave }: { settings: any; onSave: (updates: any) => void }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Email Ayarları</h3>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-blue-800">
          Email Servisi: {settings?.enabled ? '✅ Aktif (Resend)' : '❌ İnaktif'} |
          Gönderici: {settings?.from_email || 'noreply@acil.app'}
        </p>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Resend API Key
          </label>
          <input
            type="password"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gönderici Email
          </label>
          <input
            type="email"
            defaultValue="noreply@acil.app"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          İptal
        </button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Kaydet
        </button>
      </div>
    </div>
  )
}

function NotificationSettings({ settings, onSave }: { settings: any; onSave: (updates: any) => void }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Bildirim Ayarları</h3>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-blue-800">
          Push: {settings?.push_enabled ? '✅ Aktif' : '❌ İnaktif'} |
          Email: {settings?.email_enabled ? ' ✅ Aktif' : ' ❌ İnaktif'}
        </p>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between py-3 border-b border-gray-200">
          <div>
            <p className="font-medium text-gray-900">Email Bildirimleri</p>
            <p className="text-sm text-gray-600">Kullanıcılara email bildirimleri gönder</p>
          </div>
          <input
            type="checkbox"
            defaultChecked
            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center justify-between py-3 border-b border-gray-200">
          <div>
            <p className="font-medium text-gray-900">Push Bildirimleri</p>
            <p className="text-sm text-gray-600">Web push bildirimleri gönder</p>
          </div>
          <input
            type="checkbox"
            defaultChecked
            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center justify-between py-3 border-b border-gray-200">
          <div>
            <p className="font-medium text-gray-900">AI Uyarı Bildirimleri</p>
            <p className="text-sm text-gray-600">AI uyarıları için otomatik bildirim</p>
          </div>
          <input
            type="checkbox"
            defaultChecked
            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          İptal
        </button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Kaydet
        </button>
      </div>
    </div>
  )
}

function SecuritySettings({ settings, onSave }: { settings: any; onSave: (updates: any) => void }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Güvenlik Ayarları</h3>
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-green-800">
          RLS: {settings?.rls_enabled ? '✅ Aktif' : '❌ İnaktif'} |
          Email Verification: {settings?.require_email_verification ? ' ✅ Gerekli' : ' ❌ İsteğe Bağlı'}
        </p>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between py-3 border-b border-gray-200">
          <div>
            <p className="font-medium text-gray-900">İki Faktörlü Kimlik Doğrulama</p>
            <p className="text-sm text-gray-600">Tüm kullanıcılar için zorunlu kıl</p>
          </div>
          <input
            type="checkbox"
            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center justify-between py-3 border-b border-gray-200">
          <div>
            <p className="font-medium text-gray-900">IP Whitelist</p>
            <p className="text-sm text-gray-600">Sadece belirli IP'lerden erişime izin ver</p>
          </div>
          <input
            type="checkbox"
            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Şifre Minimum Uzunluğu
          </label>
          <input
            type="number"
            defaultValue="8"
            min="6"
            max="32"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          İptal
        </button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Kaydet
        </button>
      </div>
    </div>
  )
}

function DatabaseSettings({ onSave }: { onSave: (updates: any) => void }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Veritabanı Ayarları</h3>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-blue-800">
          Veritabanı: Supabase PostgreSQL | Soft Delete: ✅ Aktif
        </p>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Otomatik Yedekleme Sıklığı
          </label>
          <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="hourly">Saatlik</option>
            <option value="daily">Günlük</option>
            <option value="weekly">Haftalık</option>
          </select>
        </div>
        <div className="flex items-center justify-between py-3 border-b border-gray-200">
          <div>
            <p className="font-medium text-gray-900">Soft Delete</p>
            <p className="text-sm text-gray-600">Kayıtları kalıcı silmek yerine işaretle</p>
          </div>
          <input
            type="checkbox"
            defaultChecked
            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          İptal
        </button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Kaydet
        </button>
      </div>
    </div>
  )
}

function APISettings({ settings, onSave }: { settings: any; onSave: (updates: any) => void }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">API Ayarları</h3>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-blue-800">
          Rate Limiting: {settings?.enabled ? '✅ Aktif (Upstash Redis)' : '❌ İnaktif'} |
          AI Rate Limit: {settings?.ai_requests_per_minute || 10} req/min
        </p>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            API Rate Limit (req/min)
          </label>
          <input
            type="number"
            defaultValue="100"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center justify-between py-3 border-b border-gray-200">
          <div>
            <p className="font-medium text-gray-900">API Loglama</p>
            <p className="text-sm text-gray-600">Tüm API isteklerini logla</p>
          </div>
          <input
            type="checkbox"
            defaultChecked
            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          İptal
        </button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Kaydet
        </button>
      </div>
    </div>
  )
}
