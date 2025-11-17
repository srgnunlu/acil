'use client'

/**
 * Widget Settings Component
 *
 * Generic settings panel for widget configuration
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Save,
  RotateCcw,
  Settings as SettingsIcon,
  Palette,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react'
import { WidgetInstance, WidgetType } from '@/types/widget.types'
import { getWidgetConfig } from '@/lib/widgets/widget-catalog'
import { Button } from '@/components/ui/button'

interface WidgetSettingsProps {
  widget: WidgetInstance
  isOpen: boolean
  onClose: () => void
  onSave: (settings: Record<string, any>) => void
}

/**
 * Widget Settings Modal
 */
export function WidgetSettings({
  widget,
  isOpen,
  onClose,
  onSave,
}: WidgetSettingsProps) {
  const config = getWidgetConfig(widget.type)
  const [settings, setSettings] = useState(widget.settings || {})
  const [hasChanges, setHasChanges] = useState(false)

  const handleChange = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleSave = () => {
    onSave(settings)
    setHasChanges(false)
    onClose()
  }

  const handleReset = () => {
    setSettings(widget.settings || {})
    setHasChanges(false)
  }

  const handleCancel = () => {
    if (hasChanges) {
      if (confirm('Değişiklikler kaydedilmedi. Çıkmak istediğinize emin misiniz?')) {
        setSettings(widget.settings || {})
        setHasChanges(false)
        onClose()
      }
    } else {
      onClose()
    }
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
            onClick={handleCancel}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 top-1/2 -translate-y-1/2 w-full md:w-[600px] max-h-[80vh] bg-white dark:bg-gray-900 rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg flex items-center justify-center text-xl">
                  {config?.icon}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {config?.title} Ayarları
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Widget ayarlarını özelleştirin
                  </p>
                </div>
              </div>
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-180px)]">
              {/* Render widget-specific settings */}
              <WidgetSettingsContent
                type={widget.type}
                settings={settings}
                onChange={handleChange}
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  disabled={!hasChanges}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Sıfırla
                </Button>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  İptal
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={!hasChanges}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Kaydet
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/**
 * Widget-specific settings content
 */
interface WidgetSettingsContentProps {
  type: WidgetType
  settings: Record<string, any>
  onChange: (key: string, value: any) => void
}

function WidgetSettingsContent({ type, settings, onChange }: WidgetSettingsContentProps) {
  switch (type) {
    case 'stats':
      return <StatsWidgetSettings settings={settings} onChange={onChange} />

    case 'patients':
      return <PatientsWidgetSettings settings={settings} onChange={onChange} />

    case 'alerts':
      return <AlertsWidgetSettings settings={settings} onChange={onChange} />

    case 'activity':
      return <ActivityWidgetSettings settings={settings} onChange={onChange} />

    case 'ai-insights':
      return <AIInsightsWidgetSettings settings={settings} onChange={onChange} />

    case 'charts':
      return <ChartsWidgetSettings settings={settings} onChange={onChange} />

    case 'notes':
      return <NotesWidgetSettings settings={settings} onChange={onChange} />

    case 'quick-actions':
      return <QuickActionsWidgetSettings settings={settings} onChange={onChange} />

    default:
      return <GenericWidgetSettings settings={settings} onChange={onChange} />
  }
}

/**
 * Stats Widget Settings
 */
function StatsWidgetSettings({
  settings,
  onChange,
}: {
  settings: Record<string, any>
  onChange: (key: string, value: any) => void
}) {
  return (
    <div className="space-y-6">
      <SettingSection title="Görünüm">
        <SettingToggle
          label="İstatistikleri göster"
          checked={settings.showStats ?? true}
          onChange={(checked) => onChange('showStats', checked)}
        />
        <SettingToggle
          label="Trend çizgilerini göster"
          checked={settings.showSparklines ?? true}
          onChange={(checked) => onChange('showSparklines', checked)}
        />
        <SettingToggle
          label="Yüzde değişimini göster"
          checked={settings.showPercentChange ?? true}
          onChange={(checked) => onChange('showPercentChange', checked)}
        />
      </SettingSection>

      <SettingSection title="Renkler">
        <SettingSelect
          label="Renk şeması"
          value={settings.colorScheme || 'default'}
          options={[
            { value: 'default', label: 'Varsayılan' },
            { value: 'blue', label: 'Mavi' },
            { value: 'green', label: 'Yeşil' },
            { value: 'purple', label: 'Mor' },
            { value: 'orange', label: 'Turuncu' },
          ]}
          onChange={(value) => onChange('colorScheme', value)}
        />
      </SettingSection>

      <SettingSection title="Yenileme">
        <SettingSelect
          label="Otomatik yenileme"
          value={settings.refreshInterval || '60'}
          options={[
            { value: '0', label: 'Kapalı' },
            { value: '30', label: '30 saniye' },
            { value: '60', label: '1 dakika' },
            { value: '300', label: '5 dakika' },
            { value: '600', label: '10 dakika' },
          ]}
          onChange={(value) => onChange('refreshInterval', parseInt(value))}
        />
      </SettingSection>
    </div>
  )
}

/**
 * Patients Widget Settings
 */
function PatientsWidgetSettings({
  settings,
  onChange,
}: {
  settings: Record<string, any>
  onChange: (key: string, value: any) => void
}) {
  return (
    <div className="space-y-6">
      <SettingSection title="Görüntüleme">
        <SettingNumber
          label="Maksimum hasta sayısı"
          value={settings.maxDisplay || 6}
          min={3}
          max={20}
          onChange={(value) => onChange('maxDisplay', value)}
        />
        <SettingSelect
          label="Sıralama"
          value={settings.sortBy || 'recent'}
          options={[
            { value: 'recent', label: 'En yeni' },
            { value: 'name', label: 'İsim' },
            { value: 'risk', label: 'Risk skoru' },
            { value: 'category', label: 'Kategori' },
          ]}
          onChange={(value) => onChange('sortBy', value)}
        />
      </SettingSection>

      <SettingSection title="Filtre">
        <SettingSelect
          label="Durum filtresi"
          value={settings.filter || 'all'}
          options={[
            { value: 'all', label: 'Tümü' },
            { value: 'critical', label: 'Kritik' },
            { value: 'active', label: 'Aktif' },
            { value: 'recent', label: 'Son eklenenler' },
          ]}
          onChange={(value) => onChange('filter', value)}
        />
      </SettingSection>

      <SettingSection title="Görünüm">
        <SettingToggle
          label="Risk skorunu göster"
          checked={settings.showRiskScore ?? true}
          onChange={(checked) => onChange('showRiskScore', checked)}
        />
        <SettingToggle
          label="Kategoriyi göster"
          checked={settings.showCategory ?? true}
          onChange={(checked) => onChange('showCategory', checked)}
        />
        <SettingToggle
          label="Atanan doktoru göster"
          checked={settings.showAssignee ?? true}
          onChange={(checked) => onChange('showAssignee', checked)}
        />
      </SettingSection>
    </div>
  )
}

/**
 * Alerts Widget Settings
 */
function AlertsWidgetSettings({
  settings,
  onChange,
}: {
  settings: Record<string, any>
  onChange: (key: string, value: any) => void
}) {
  return (
    <div className="space-y-6">
      <SettingSection title="Görüntüleme">
        <SettingNumber
          label="Maksimum uyarı sayısı"
          value={settings.maxDisplay || 5}
          min={3}
          max={15}
          onChange={(value) => onChange('maxDisplay', value)}
        />
        <SettingSelect
          label="Önem düzeyi"
          value={settings.minSeverity || 'low'}
          options={[
            { value: 'low', label: 'Tüm uyarılar' },
            { value: 'medium', label: 'Orta ve üzeri' },
            { value: 'high', label: 'Yüksek ve üzeri' },
            { value: 'critical', label: 'Sadece kritik' },
          ]}
          onChange={(value) => onChange('minSeverity', value)}
        />
      </SettingSection>

      <SettingSection title="Bildirimler">
        <SettingToggle
          label="Ses bildirimi"
          checked={settings.soundEnabled ?? false}
          onChange={(checked) => onChange('soundEnabled', checked)}
        />
        <SettingToggle
          label="Titreşim"
          checked={settings.vibrationEnabled ?? true}
          onChange={(checked) => onChange('vibrationEnabled', checked)}
        />
      </SettingSection>
    </div>
  )
}

/**
 * Activity Widget Settings
 */
function ActivityWidgetSettings({
  settings,
  onChange,
}: {
  settings: Record<string, any>
  onChange: (key: string, value: any) => void
}) {
  return (
    <div className="space-y-6">
      <SettingSection title="Görüntüleme">
        <SettingNumber
          label="Maksimum aktivite sayısı"
          value={settings.maxDisplay || 10}
          min={5}
          max={50}
          onChange={(value) => onChange('maxDisplay', value)}
        />
      </SettingSection>

      <SettingSection title="Filtreler">
        <SettingCheckboxGroup
          label="Aktivite tipleri"
          options={[
            { value: 'patient_created', label: 'Hasta eklendi' },
            { value: 'patient_updated', label: 'Hasta güncellendi' },
            { value: 'ai_analysis', label: 'AI analizi' },
            { value: 'test_added', label: 'Test eklendi' },
            { value: 'note_added', label: 'Not eklendi' },
            { value: 'assignment', label: 'Atama' },
            { value: 'status_change', label: 'Durum değişikliği' },
          ]}
          value={settings.activityTypes || []}
          onChange={(value) => onChange('activityTypes', value)}
        />
      </SettingSection>
    </div>
  )
}

/**
 * AI Insights Widget Settings
 */
function AIInsightsWidgetSettings({
  settings,
  onChange,
}: {
  settings: Record<string, any>
  onChange: (key: string, value: any) => void
}) {
  return (
    <div className="space-y-6">
      <SettingSection title="Görüntüleme">
        <SettingToggle
          label="Otomatik döndür"
          checked={settings.autoRotate ?? true}
          onChange={(checked) => onChange('autoRotate', checked)}
        />
        {settings.autoRotate && (
          <SettingNumber
            label="Döndürme aralığı (saniye)"
            value={(settings.rotateInterval || 10000) / 1000}
            min={3}
            max={60}
            onChange={(value) => onChange('rotateInterval', value * 1000)}
          />
        )}
      </SettingSection>

      <SettingSection title="Filtreler">
        <SettingCheckboxGroup
          label="İçgörü tipleri"
          options={[
            { value: 'critical', label: 'Kritik uyarılar' },
            { value: 'warning', label: 'Dikkat' },
            { value: 'success', label: 'Başarılı' },
            { value: 'info', label: 'Bilgi' },
            { value: 'suggestion', label: 'Öneri' },
          ]}
          value={settings.insightTypes || []}
          onChange={(value) => onChange('insightTypes', value)}
        />
      </SettingSection>
    </div>
  )
}

/**
 * Charts Widget Settings
 */
function ChartsWidgetSettings({
  settings,
  onChange,
}: {
  settings: Record<string, any>
  onChange: (key: string, value: any) => void
}) {
  return (
    <div className="space-y-6">
      <SettingSection title="Grafik Tipi">
        <SettingSelect
          label="Grafik türü"
          value={settings.chartType || 'line'}
          options={[
            { value: 'line', label: 'Çizgi grafik' },
            { value: 'bar', label: 'Sütun grafik' },
            { value: 'pie', label: 'Pasta grafik' },
            { value: 'area', label: 'Alan grafik' },
          ]}
          onChange={(value) => onChange('chartType', value)}
        />
      </SettingSection>

      <SettingSection title="Zaman Aralığı">
        <SettingSelect
          label="Periyot"
          value={settings.period || '7d'}
          options={[
            { value: '24h', label: 'Son 24 saat' },
            { value: '7d', label: 'Son 7 gün' },
            { value: '30d', label: 'Son 30 gün' },
            { value: '90d', label: 'Son 90 gün' },
            { value: '1y', label: 'Son 1 yıl' },
          ]}
          onChange={(value) => onChange('period', value)}
        />
      </SettingSection>

      <SettingSection title="Görünüm">
        <SettingToggle
          label="Efsaneyi göster"
          checked={settings.showLegend ?? true}
          onChange={(checked) => onChange('showLegend', checked)}
        />
        <SettingToggle
          label="Veri etiketlerini göster"
          checked={settings.showLabels ?? false}
          onChange={(checked) => onChange('showLabels', checked)}
        />
      </SettingSection>
    </div>
  )
}

/**
 * Notes Widget Settings
 */
function NotesWidgetSettings({
  settings,
  onChange,
}: {
  settings: Record<string, any>
  onChange: (key: string, value: any) => void
}) {
  return (
    <div className="space-y-6">
      <SettingSection title="Görüntüleme">
        <SettingSelect
          label="Sıralama"
          value={settings.sortBy || 'recent'}
          options={[
            { value: 'recent', label: 'En yeni' },
            { value: 'oldest', label: 'En eski' },
            { value: 'pinned', label: 'Sabitlenenler önce' },
          ]}
          onChange={(value) => onChange('sortBy', value)}
        />
      </SettingSection>

      <SettingSection title="Filtreler">
        <SettingToggle
          label="Sadece sabitlenenler"
          checked={settings.pinnedOnly ?? false}
          onChange={(checked) => onChange('pinnedOnly', checked)}
        />
        <SettingToggle
          label="Sadece bana atananlar"
          checked={settings.assignedToMe ?? false}
          onChange={(checked) => onChange('assignedToMe', checked)}
        />
      </SettingSection>
    </div>
  )
}

/**
 * Quick Actions Widget Settings
 */
function QuickActionsWidgetSettings({
  settings,
  onChange,
}: {
  settings: Record<string, any>
  onChange: (key: string, value: any) => void
}) {
  return (
    <div className="space-y-6">
      <SettingSection title="Görünüm">
        <SettingSelect
          label="Düzen"
          value={settings.layout || 'grid'}
          options={[
            { value: 'grid', label: 'Izgara' },
            { value: 'list', label: 'Liste' },
          ]}
          onChange={(value) => onChange('layout', value)}
        />
      </SettingSection>

      <SettingSection title="Eylemler">
        <SettingCheckboxGroup
          label="Gösterilecek eylemler"
          options={[
            { value: 'new_patient', label: 'Yeni hasta ekle' },
            { value: 'statistics', label: 'İstatistikler' },
            { value: 'protocols', label: 'Protokoller' },
            { value: 'search', label: 'Arama' },
            { value: 'export', label: 'Dışa aktar' },
            { value: 'settings', label: 'Ayarlar' },
          ]}
          value={settings.actions || ['new_patient', 'statistics', 'protocols']}
          onChange={(value) => onChange('actions', value)}
        />
      </SettingSection>
    </div>
  )
}

/**
 * Generic Widget Settings (fallback)
 */
function GenericWidgetSettings({
  settings,
  onChange,
}: {
  settings: Record<string, any>
  onChange: (key: string, value: any) => void
}) {
  return (
    <div className="space-y-6">
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <SettingsIcon className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
        <p className="text-lg font-medium">Bu widget için özel ayar yok</p>
        <p className="text-sm mt-1">Genel widget ayarlarını kullanabilirsiniz</p>
      </div>
    </div>
  )
}

/* ========== Setting Components ========== */

function SettingSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function SettingToggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors
          ${checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
            ${checked ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
    </label>
  )
}

function SettingSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  return (
    <label className="block">
      <span className="text-sm text-gray-700 dark:text-gray-300 mb-2 block">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function SettingNumber({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}) {
  return (
    <label className="block">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{value}</span>
      </div>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
    </label>
  )
}

function SettingCheckboxGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: string; label: string }[]
  value: string[]
  onChange: (value: string[]) => void
}) {
  const handleToggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue))
    } else {
      onChange([...value, optionValue])
    }
  }

  return (
    <div>
      <span className="text-sm text-gray-700 dark:text-gray-300 mb-3 block">{label}</span>
      <div className="space-y-2">
        {options.map((option) => (
          <label key={option.value} className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={value.includes(option.value)}
              onChange={() => handleToggle(option.value)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}
