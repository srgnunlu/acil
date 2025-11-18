'use client'

/**
 * Theme Toggle Component
 *
 * Quick toggle button for switching between light/dark themes
 */

import { Sun, Moon, Monitor } from 'lucide-react'
import { useThemeContext } from '@/components/providers/ThemeProvider'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

interface ThemeToggleProps {
  className?: string
  showLabel?: boolean
  variant?: 'icon' | 'dropdown'
}

/**
 * Theme Toggle Button
 */
export function ThemeToggle({
  className = '',
  showLabel = false,
  variant = 'icon',
}: ThemeToggleProps) {
  const { themeMode, setThemeMode } = useThemeContext()
  const [isOpen, setIsOpen] = useState(false)

  const modes = [
    { mode: 'light' as const, icon: Sun, label: 'Aydınlık' },
    { mode: 'dark' as const, icon: Moon, label: 'Karanlık' },
    { mode: 'system' as const, icon: Monitor, label: 'Sistem' },
  ]

  const currentMode = modes.find((m) => m.mode === themeMode) || modes[0]
  const CurrentIcon = currentMode.icon

  // Simple icon toggle (cycles through modes)
  if (variant === 'icon') {
    const handleToggle = () => {
      const currentIndex = modes.findIndex((m) => m.mode === themeMode)
      const nextIndex = (currentIndex + 1) % modes.length
      setThemeMode(modes[nextIndex].mode)
    }

    return (
      <button
        onClick={handleToggle}
        className={`
          p-2 rounded-lg transition-colors
          hover:bg-gray-100 dark:hover:bg-gray-800
          active:scale-95 transition-transform
          ${className}
        `}
        title={`Tema: ${currentMode.label}`}
        aria-label={`Tema değiştir (Şu an: ${currentMode.label})`}
      >
        <motion.div
          key={themeMode}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 90, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <CurrentIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </motion.div>
      </button>
    )
  }

  // Dropdown variant
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg transition-colors
          hover:bg-gray-100 dark:hover:bg-gray-800
          ${className}
        `}
        aria-label="Tema seçenekleri"
      >
        <CurrentIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        {showLabel && (
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {currentMode.label}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 overflow-hidden"
            >
              {modes.map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => {
                    setThemeMode(mode)
                    setIsOpen(false)
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 transition-colors
                    hover:bg-gray-50 dark:hover:bg-gray-700/50
                    ${
                      themeMode === mode
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium text-sm">{label}</span>
                  {themeMode === mode && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                  )}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * Compact Theme Switcher (for mobile/compact layouts)
 */
export function CompactThemeToggle() {
  const { themeMode, setThemeMode } = useThemeContext()

  const modes = [
    { mode: 'light' as const, icon: Sun },
    { mode: 'dark' as const, icon: Moon },
    { mode: 'system' as const, icon: Monitor },
  ]

  return (
    <div className="inline-flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      {modes.map(({ mode, icon: Icon }) => (
        <button
          key={mode}
          onClick={() => setThemeMode(mode)}
          className={`
            p-2 rounded-md transition-all
            ${
              themeMode === mode
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }
          `}
          aria-label={mode}
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  )
}
