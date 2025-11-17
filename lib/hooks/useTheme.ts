'use client'

/**
 * Theme Management Hook
 *
 * Manages theme state, persistence, and system theme detection
 */

import { useState, useEffect, useCallback } from 'react'
import {
  ThemeConfig,
  ThemeMode,
  UserThemePreferences,
  ThemeContextValue,
} from '@/types/theme.types'
import {
  PREDEFINED_THEMES,
  LIGHT_THEME,
  DARK_THEME,
  getThemeById,
} from '@/lib/theme/theme-presets'
import {
  applyTheme,
  resolveThemeMode,
  watchSystemTheme,
  generateThemeId,
  exportThemeJSON,
  importThemeJSON,
} from '@/lib/theme/theme-utils'

const STORAGE_KEY = 'acil-theme-preferences'

/**
 * Get default preferences
 */
function getDefaultPreferences(
  userId: string | null,
  workspaceId: string | null
): UserThemePreferences {
  return {
    userId: userId || '',
    workspaceId: workspaceId || null,
    currentThemeId: 'light',
    themeMode: 'system',
    customThemes: [],
    fontSize: 'base',
    reducedMotion: false,
    highContrast: false,
    colorBlindMode: 'none',
  }
}

/**
 * Load preferences from localStorage
 */
function loadPreferences(
  userId: string | null,
  workspaceId: string | null
): UserThemePreferences {
  if (typeof window === 'undefined') {
    return getDefaultPreferences(userId, workspaceId)
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as UserThemePreferences
      return {
        ...getDefaultPreferences(userId, workspaceId),
        ...parsed,
        userId: userId || '',
        workspaceId: workspaceId || null,
      }
    }
  } catch (error) {
    console.error('Failed to load theme preferences:', error)
  }

  return getDefaultPreferences(userId, workspaceId)
}

/**
 * Save preferences to localStorage
 */
function savePreferences(preferences: UserThemePreferences): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
  } catch (error) {
    console.error('Failed to save theme preferences:', error)
  }
}

/**
 * useTheme Hook
 */
export function useTheme(
  userId: string | null = null,
  workspaceId: string | null = null
): ThemeContextValue {
  const [preferences, setPreferences] = useState<UserThemePreferences>(() =>
    loadPreferences(userId, workspaceId)
  )

  const [currentTheme, setCurrentTheme] = useState<ThemeConfig>(() => {
    const resolvedMode = resolveThemeMode(preferences.themeMode)
    const theme =
      getThemeById(preferences.currentThemeId) ||
      preferences.customThemes.find((t) => t.id === preferences.currentThemeId) ||
      (resolvedMode === 'dark' ? DARK_THEME : LIGHT_THEME)

    return theme
  })

  // Apply theme on mount and when it changes
  useEffect(() => {
    applyTheme(currentTheme)
  }, [currentTheme])

  // Save preferences when they change
  useEffect(() => {
    savePreferences(preferences)
  }, [preferences])

  // Watch for system theme changes when mode is 'system'
  useEffect(() => {
    if (preferences.themeMode !== 'system') return

    const unwatch = watchSystemTheme((isDark) => {
      const newTheme = isDark ? DARK_THEME : LIGHT_THEME
      setCurrentTheme(newTheme)
    })

    return unwatch
  }, [preferences.themeMode])

  // Apply reduced motion preference
  useEffect(() => {
    if (typeof document === 'undefined') return

    if (preferences.reducedMotion) {
      document.documentElement.classList.add('reduce-motion')
    } else {
      document.documentElement.classList.remove('reduce-motion')
    }
  }, [preferences.reducedMotion])

  // Apply font size preference
  useEffect(() => {
    if (typeof document === 'undefined') return

    const fontSizeMap = {
      sm: '14px',
      base: '16px',
      lg: '18px',
    }

    document.documentElement.style.setProperty(
      '--font-size-base',
      fontSizeMap[preferences.fontSize]
    )
  }, [preferences.fontSize])

  // Apply high contrast mode
  useEffect(() => {
    if (typeof document === 'undefined') return

    if (preferences.highContrast) {
      document.documentElement.classList.add('high-contrast')
    } else {
      document.documentElement.classList.remove('high-contrast')
    }
  }, [preferences.highContrast])

  /**
   * Set theme by ID
   */
  const setTheme = useCallback(
    (themeId: string) => {
      const theme =
        getThemeById(themeId) ||
        preferences.customThemes.find((t) => t.id === themeId)

      if (!theme) {
        console.error(`Theme not found: ${themeId}`)
        return
      }

      setCurrentTheme(theme)
      setPreferences((prev) => ({
        ...prev,
        currentThemeId: themeId,
      }))
    },
    [preferences.customThemes]
  )

  /**
   * Set theme mode (light/dark/system)
   */
  const setThemeMode = useCallback((mode: ThemeMode) => {
    setPreferences((prev) => ({
      ...prev,
      themeMode: mode,
    }))

    // Immediately apply the new mode
    const resolvedMode = resolveThemeMode(mode)
    const newTheme = resolvedMode === 'dark' ? DARK_THEME : LIGHT_THEME
    setCurrentTheme(newTheme)
  }, [])

  /**
   * Create custom theme
   */
  const createCustomTheme = useCallback(
    (theme: Omit<ThemeConfig, 'id' | 'isCustom'>) => {
      const newTheme: ThemeConfig = {
        ...theme,
        id: generateThemeId(),
        isCustom: true,
      }

      setPreferences((prev) => ({
        ...prev,
        customThemes: [...prev.customThemes, newTheme],
        currentThemeId: newTheme.id,
      }))

      setCurrentTheme(newTheme)
    },
    []
  )

  /**
   * Update custom theme
   */
  const updateCustomTheme = useCallback(
    (themeId: string, updates: Partial<ThemeConfig>) => {
      setPreferences((prev) => {
        const customThemes = prev.customThemes.map((theme) =>
          theme.id === themeId ? { ...theme, ...updates } : theme
        )

        return {
          ...prev,
          customThemes,
        }
      })

      // Update current theme if it's the one being edited
      if (currentTheme.id === themeId) {
        setCurrentTheme((prev) => ({ ...prev, ...updates }))
      }
    },
    [currentTheme.id]
  )

  /**
   * Delete custom theme
   */
  const deleteCustomTheme = useCallback(
    (themeId: string) => {
      setPreferences((prev) => {
        const customThemes = prev.customThemes.filter((theme) => theme.id !== themeId)

        // If deleting the current theme, switch to light theme
        const currentThemeId =
          prev.currentThemeId === themeId ? 'light' : prev.currentThemeId

        return {
          ...prev,
          customThemes,
          currentThemeId,
        }
      })

      // Switch to light theme if deleting current
      if (currentTheme.id === themeId) {
        setCurrentTheme(LIGHT_THEME)
      }
    },
    [currentTheme.id]
  )

  /**
   * Update preferences
   */
  const updatePreferences = useCallback((updates: Partial<UserThemePreferences>) => {
    setPreferences((prev) => ({
      ...prev,
      ...updates,
    }))
  }, [])

  /**
   * Export theme as JSON
   */
  const exportTheme = useCallback(
    (themeId: string): string => {
      const theme =
        getThemeById(themeId) ||
        preferences.customThemes.find((t) => t.id === themeId)

      if (!theme) {
        throw new Error(`Theme not found: ${themeId}`)
      }

      return exportThemeJSON(theme)
    },
    [preferences.customThemes]
  )

  /**
   * Import theme from JSON
   */
  const importTheme = useCallback((themeJson: string) => {
    const theme = importThemeJSON(themeJson)

    if (!theme) {
      throw new Error('Invalid theme JSON')
    }

    // Assign new ID to avoid conflicts
    const newTheme: ThemeConfig = {
      ...theme,
      id: generateThemeId(),
      isCustom: true,
    }

    setPreferences((prev) => ({
      ...prev,
      customThemes: [...prev.customThemes, newTheme],
      currentThemeId: newTheme.id,
    }))

    setCurrentTheme(newTheme)
  }, [])

  return {
    theme: currentTheme,
    themeMode: preferences.themeMode,
    preferences,
    setTheme,
    setThemeMode,
    createCustomTheme,
    updateCustomTheme,
    deleteCustomTheme,
    updatePreferences,
    exportTheme,
    importTheme,
  }
}

/**
 * Get all available themes (predefined + custom)
 */
export function useAvailableThemes(customThemes: ThemeConfig[] = []): ThemeConfig[] {
  return [...PREDEFINED_THEMES, ...customThemes]
}
