'use client'

/**
 * NotificationPreferences Component
 * Phase 6: Notification System
 *
 * UI for managing user notification preferences
 */

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import type { NotificationPreferences } from '@/types/notification.types'

export function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/notifications/preferences')

      if (!response.ok) {
        throw new Error('Failed to load preferences')
      }

      const data = await response.json()
      setPreferences(data.preferences)
    } catch (error) {
      console.error('Load preferences error:', error)
      toast.error('Tercihler yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const savePreferences = async (updates: Partial<NotificationPreferences>) => {
    try {
      setSaving(true)

      const response = await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error('Failed to save preferences')
      }

      const data = await response.json()
      setPreferences(data.preferences)
      toast.success('Tercihler kaydedildi')
    } catch (error) {
      console.error('Save preferences error:', error)
      toast.error('Tercihler kaydedilirken hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = (key: keyof NotificationPreferences) => {
    if (!preferences) return

    const updates = { [key]: !preferences[key] }
    setPreferences({ ...preferences, ...updates })
    savePreferences(updates)
  }

  const handleTimeChange = (key: 'quiet_hours_start' | 'quiet_hours_end', value: string) => {
    if (!preferences) return

    const updates = { [key]: value }
    setPreferences({ ...preferences, ...updates })
    savePreferences(updates)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!preferences) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>Tercihler yüklenemedi</p>
        <button
          onClick={loadPreferences}
          className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
        >
          Tekrar dene
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Channel Preferences */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Bildirim Kanalları</h3>
        <div className="space-y-4">
          <PreferenceToggle
            label="E-posta Bildirimleri"
            description="Önemli bildirimler için e-posta alın"
            checked={preferences.email}
            onChange={() => handleToggle('email')}
            disabled={saving}
            icon="📧"
          />

          <PreferenceToggle
            label="Push Bildirimleri"
            description="Tarayıcı üzerinden anlık bildirimler alın"
            checked={preferences.push}
            onChange={() => handleToggle('push')}
            disabled={saving}
            icon="🔔"
          />

          <PreferenceToggle
            label="SMS Bildirimleri"
            description="Kritik durumlar için SMS alın (opsiyonel)"
            checked={preferences.sms}
            onChange={() => handleToggle('sms')}
            disabled={saving}
            icon="📱"
          />
        </div>
      </div>

      {/* Type Preferences */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Bildirim Tipleri</h3>
        <div className="space-y-4">
          <PreferenceToggle
            label="Etiketlemeler"
            description="Biri sizi bir notta etiketlediğinde bildirim alın"
            checked={preferences.mention}
            onChange={() => handleToggle('mention')}
            disabled={saving}
            icon="💬"
          />

          <PreferenceToggle
            label="Hasta Atamaları"
            description="Size yeni hasta atandığında bildirim alın"
            checked={preferences.assignment}
            onChange={() => handleToggle('assignment')}
            disabled={saving}
            icon="👨‍⚕️"
          />

          <PreferenceToggle
            label="Hasta Güncellemeleri"
            description="Hastalarınızla ilgili güncellemeler alın"
            checked={preferences.patient_updates}
            onChange={() => handleToggle('patient_updates')}
            disabled={saving}
            icon="📝"
          />

          <PreferenceToggle
            label="AI Uyarıları"
            description="AI destekli analiz ve uyarılar alın"
            checked={preferences.ai_alerts}
            onChange={() => handleToggle('ai_alerts')}
            disabled={saving}
            icon="🤖"
          />

          <PreferenceToggle
            label="Kritik Uyarılar"
            description="Acil durum ve kritik değer uyarıları (her zaman açık)"
            checked={preferences.critical_alerts}
            onChange={() => handleToggle('critical_alerts')}
            disabled={saving || true}
            icon="⚠️"
            locked
          />
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sessiz Saatler</h3>
        <p className="text-sm text-gray-600 mb-4">
          Belirttiğiniz saatler arasında kritik olmayan bildirimler gönderilmeyecektir
        </p>

        <PreferenceToggle
          label="Sessiz Saatleri Etkinleştir"
          description="Belirli saatler arasında bildirimleri sustur"
          checked={preferences.quiet_hours_enabled}
          onChange={() => handleToggle('quiet_hours_enabled')}
          disabled={saving}
          icon="🌙"
        />

        {preferences.quiet_hours_enabled && (
          <div className="mt-4 grid grid-cols-2 gap-4 pl-12">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Başlangıç Saati
              </label>
              <input
                type="time"
                value={preferences.quiet_hours_start}
                onChange={(e) => handleTimeChange('quiet_hours_start', e.target.value)}
                disabled={saving}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş Saati</label>
              <input
                type="time"
                value={preferences.quiet_hours_end}
                onChange={(e) => handleTimeChange('quiet_hours_end', e.target.value)}
                disabled={saving}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">ℹ️</span>
          <div className="flex-1">
            <h4 className="font-medium text-blue-900 mb-1">Bilgi</h4>
            <p className="text-sm text-blue-800">
              Kritik uyarılar her zaman gönderilir ve susturulamaz. Sessiz saatler sırasında bile
              acil durumlardan haberdar olacaksınız.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// PREFERENCE TOGGLE COMPONENT
// ============================================

interface PreferenceToggleProps {
  label: string
  description: string
  checked: boolean
  onChange: () => void
  disabled?: boolean
  icon?: string
  locked?: boolean
}

function PreferenceToggle({
  label,
  description,
  checked,
  onChange,
  disabled,
  icon,
  locked,
}: PreferenceToggleProps) {
  return (
    <div className="flex items-start gap-4">
      {icon && <span className="text-2xl flex-shrink-0">{icon}</span>}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <label className="font-medium text-gray-900">{label}</label>
          {locked && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
              Zorunlu
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>

      {/* Toggle Switch */}
      <button
        onClick={onChange}
        disabled={disabled || locked}
        className={`
          relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
          transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${checked ? 'bg-blue-600' : 'bg-gray-200'}
          ${disabled || locked ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0
            transition duration-200 ease-in-out
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
    </div>
  )
}
