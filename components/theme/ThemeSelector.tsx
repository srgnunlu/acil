'use client'

/**
 * Theme Selector Component
 *
 * UI for selecting and customizing themes
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sun,
  Moon,
  Monitor,
  Palette,
  Download,
  Upload,
  Plus,
  Check,
  Settings,
  Eye,
  Trash2,
  X,
} from 'lucide-react'
import { useThemeContext } from '@/components/providers/ThemeProvider'
import { useAvailableThemes } from '@/lib/hooks/useTheme'
import { THEME_CATEGORIES } from '@/lib/theme/theme-presets'
import { ThemeConfig, ThemeMode } from '@/types/theme.types'
import { Button } from '@/components/ui/button'

interface ThemeSelectorProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * Theme Selector Modal
 */
export function ThemeSelector({ isOpen, onClose }: ThemeSelectorProps) {
  const {
    theme: currentTheme,
    themeMode,
    preferences,
    setTheme,
    setThemeMode,
    deleteCustomTheme,
    exportTheme,
    importTheme,
  } = useThemeContext()

  const availableThemes = useAvailableThemes(preferences.customThemes)

  const [selectedCategory, setSelectedCategory] = useState<string>('default')
  const [previewTheme, setPreviewTheme] = useState<ThemeConfig | null>(null)

  const filteredThemes =
    selectedCategory === 'all'
      ? availableThemes
      : availableThemes.filter((t) => {
          const category = THEME_CATEGORIES.find((cat) =>
            cat.themes.includes(t.id)
          )
          return category?.id === selectedCategory || t.isCustom
        })

  const handleThemeSelect = (themeId: string) => {
    setTheme(themeId)
    setPreviewTheme(null)
  }

  const handleExportTheme = (themeId: string) => {
    try {
      const json = exportTheme(themeId)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `theme-${themeId}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export theme:', error)
    }
  }

  const handleImportTheme = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const json = e.target?.result as string
          importTheme(json)
        } catch (error) {
          console.error('Failed to import theme:', error)
        }
      }
      reader.readAsText(file)
    }
    input.click()
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
            className="fixed inset-x-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 top-1/2 -translate-y-1/2 w-full md:w-[900px] max-h-[85vh] bg-white dark:bg-gray-900 rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Tema Seçimi
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Görünümünüzü özelleştirin
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Theme Mode Selector */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Tema Modu
              </p>
              <div className="flex gap-2">
                {[
                  { mode: 'light' as ThemeMode, icon: Sun, label: 'Aydınlık' },
                  { mode: 'dark' as ThemeMode, icon: Moon, label: 'Karanlık' },
                  { mode: 'system' as ThemeMode, icon: Monitor, label: 'Sistem' },
                ].map(({ mode, icon: Icon, label }) => (
                  <button
                    key={mode}
                    onClick={() => setThemeMode(mode)}
                    className={`
                      flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all
                      ${
                        themeMode === mode
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{label}</span>
                    {themeMode === mode && <Check className="w-5 h-5" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex h-[calc(85vh-240px)]">
              {/* Categories Sidebar */}
              <div className="w-48 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
                <nav className="space-y-1">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`
                      w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${
                        selectedCategory === 'all'
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }
                    `}
                  >
                    <Palette className="w-4 h-4" />
                    <span>Tümü</span>
                  </button>

                  {THEME_CATEGORIES.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`
                        w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                        ${
                          selectedCategory === category.id
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }
                      `}
                    >
                      <span>{category.label}</span>
                    </button>
                  ))}

                  {preferences.customThemes.length > 0 && (
                    <>
                      <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
                      <button
                        onClick={() => setSelectedCategory('custom')}
                        className={`
                          w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                          ${
                            selectedCategory === 'custom'
                              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                          }
                        `}
                      >
                        <Plus className="w-4 h-4" />
                        <span>Özel Temalar</span>
                      </button>
                    </>
                  )}
                </nav>
              </div>

              {/* Themes Grid */}
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredThemes.map((theme) => (
                    <ThemeCard
                      key={theme.id}
                      theme={theme}
                      isActive={currentTheme.id === theme.id}
                      onSelect={() => handleThemeSelect(theme.id)}
                      onPreview={() => setPreviewTheme(theme)}
                      onExport={() => handleExportTheme(theme.id)}
                      onDelete={
                        theme.isCustom
                          ? () => deleteCustomTheme(theme.id)
                          : undefined
                      }
                    />
                  ))}
                </div>

                {filteredThemes.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    <Palette className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600" />
                    <p className="text-lg font-medium">Tema bulunamadı</p>
                    <p className="text-sm mt-1">Farklı bir kategori deneyin</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleImportTheme}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  İçe Aktar
                </Button>
              </div>

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
 * Theme Card Component
 */
interface ThemeCardProps {
  theme: ThemeConfig
  isActive: boolean
  onSelect: () => void
  onPreview: () => void
  onExport: () => void
  onDelete?: () => void
}

function ThemeCard({
  theme,
  isActive,
  onSelect,
  onPreview,
  onExport,
  onDelete,
}: ThemeCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        group relative bg-white dark:bg-gray-800 border-2 rounded-lg p-4 cursor-pointer transition-all
        ${
          isActive
            ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
        }
      `}
      onClick={onSelect}
    >
      {/* Color Preview */}
      <div className="flex gap-1 mb-3">
        {[
          theme.colors.primary,
          theme.colors.secondary,
          theme.colors.accent,
          theme.colors.background,
          theme.colors.text,
        ].map((color, index) => (
          <div
            key={index}
            className="w-8 h-8 rounded-md border border-gray-300 dark:border-gray-600"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      {/* Theme Info */}
      <div className="mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          {theme.name}
          {isActive && (
            <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          )}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {theme.mode === 'light' ? 'Aydınlık' : 'Karanlık'} Mod
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onPreview()
          }}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title="Önizle"
        >
          <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onExport()
          }}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title="Dışa Aktar"
        >
          <Download className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
            title="Sil"
          >
            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
          </button>
        )}
      </div>

      {theme.isCustom && (
        <span className="absolute top-2 right-2 px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 text-xs font-medium rounded">
          ÖZEL
        </span>
      )}
    </motion.div>
  )
}
