/**
 * Theme Utilities
 *
 * Helper functions for theme management and CSS variable generation
 */

import { ThemeConfig, ColorPalette, ThemeMode } from '@/types/theme.types'

/**
 * Apply theme to document by setting CSS variables
 */
export function applyTheme(theme: ThemeConfig): void {
  if (typeof document === 'undefined') return

  const root = document.documentElement

  // Apply color variables
  Object.entries(theme.colors).forEach(([key, value]) => {
    const cssVarName = `--color-${kebabCase(key)}`
    root.style.setProperty(cssVarName, value)
  })

  // Apply border radius
  const borderRadiusMap = {
    none: '0',
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
  }
  root.style.setProperty('--border-radius', borderRadiusMap[theme.borderRadius])

  // Apply spacing
  const spacingMap = {
    compact: '0.75',
    normal: '1',
    comfortable: '1.25',
  }
  root.style.setProperty('--spacing-scale', spacingMap[theme.spacing])

  // Apply mode class
  root.classList.remove('light-mode', 'dark-mode')
  root.classList.add(`${theme.mode}-mode`)

  // Update meta theme-color for mobile browsers
  updateMetaThemeColor(theme.colors.primary)
}

/**
 * Get system theme preference
 */
export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Resolve theme mode (system -> light/dark)
 */
export function resolveThemeMode(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    return getSystemTheme()
  }
  return mode
}

/**
 * Generate CSS variables string for SSR
 */
export function generateCSSVariables(theme: ThemeConfig): string {
  const variables: string[] = []

  // Color variables
  Object.entries(theme.colors).forEach(([key, value]) => {
    variables.push(`--color-${kebabCase(key)}: ${value};`)
  })

  // Border radius
  const borderRadiusMap = {
    none: '0',
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
  }
  variables.push(`--border-radius: ${borderRadiusMap[theme.borderRadius]};`)

  // Spacing
  const spacingMap = {
    compact: '0.75',
    normal: '1',
    comfortable: '1.25',
  }
  variables.push(`--spacing-scale: ${spacingMap[theme.spacing]};`)

  return variables.join('\n  ')
}

/**
 * Update meta theme-color tag
 */
function updateMetaThemeColor(color: string): void {
  if (typeof document === 'undefined') return

  let metaTag = document.querySelector('meta[name="theme-color"]')

  if (!metaTag) {
    metaTag = document.createElement('meta')
    metaTag.setAttribute('name', 'theme-color')
    document.head.appendChild(metaTag)
  }

  metaTag.setAttribute('content', color)
}

/**
 * Convert camelCase to kebab-case
 */
function kebabCase(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

/**
 * Validate theme configuration
 */
export function validateTheme(theme: Partial<ThemeConfig>): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!theme.name) errors.push('Theme name is required')
  if (!theme.mode) errors.push('Theme mode is required')
  if (!theme.colors) {
    errors.push('Theme colors are required')
  } else {
    const requiredColors: (keyof ColorPalette)[] = [
      'primary',
      'background',
      'text',
      'border',
    ]
    requiredColors.forEach((color) => {
      if (!theme.colors![color]) {
        errors.push(`Color "${color}" is required`)
      }
    })
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Export theme as JSON
 */
export function exportThemeJSON(theme: ThemeConfig): string {
  return JSON.stringify(theme, null, 2)
}

/**
 * Import theme from JSON
 */
export function importThemeJSON(json: string): ThemeConfig | null {
  try {
    const theme = JSON.parse(json) as ThemeConfig
    const validation = validateTheme(theme)

    if (!validation.valid) {
      console.error('Invalid theme:', validation.errors)
      return null
    }

    return theme
  } catch (error) {
    console.error('Failed to parse theme JSON:', error)
    return null
  }
}

/**
 * Generate random theme ID
 */
export function generateThemeId(): string {
  return `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Merge theme with defaults
 */
export function mergeThemeWithDefaults(
  theme: Partial<ThemeConfig>,
  defaults: ThemeConfig
): ThemeConfig {
  return {
    ...defaults,
    ...theme,
    colors: {
      ...defaults.colors,
      ...theme.colors,
    },
  }
}

/**
 * Get contrast color (black or white) based on background
 */
export function getContrastColor(hexColor: string): '#000000' | '#ffffff' {
  // Remove # if present
  const hex = hexColor.replace('#', '')

  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  return luminance > 0.5 ? '#000000' : '#ffffff'
}

/**
 * Lighten or darken a color
 */
export function adjustColorBrightness(hexColor: string, percent: number): string {
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)

  const adjust = (value: number) => {
    const adjusted = Math.round(value + (255 - value) * (percent / 100))
    return Math.max(0, Math.min(255, adjusted))
  }

  const newR = adjust(r).toString(16).padStart(2, '0')
  const newG = adjust(g).toString(16).padStart(2, '0')
  const newB = adjust(b).toString(16).padStart(2, '0')

  return `#${newR}${newG}${newB}`
}

/**
 * Generate color variants from a base color
 */
export function generateColorVariants(baseColor: string): {
  dark: string
  light: string
} {
  return {
    dark: adjustColorBrightness(baseColor, -20),
    light: adjustColorBrightness(baseColor, 20),
  }
}

/**
 * Listen to system theme changes
 */
export function watchSystemTheme(callback: (isDark: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {}

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches)
  }

  mediaQuery.addEventListener('change', handler)

  return () => {
    mediaQuery.removeEventListener('change', handler)
  }
}

/**
 * Get accessible color for text on background
 */
export function getAccessibleTextColor(
  backgroundColor: string,
  textColor: string,
  alternativeColor: string
): string {
  const bgLuminance = getLuminance(backgroundColor)
  const textLuminance = getLuminance(textColor)
  const contrast = getContrastRatio(bgLuminance, textLuminance)

  // WCAG AA requires 4.5:1 for normal text
  if (contrast >= 4.5) {
    return textColor
  }

  return alternativeColor
}

/**
 * Calculate relative luminance
 */
function getLuminance(hexColor: string): number {
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16) / 255
  const g = parseInt(hex.substr(2, 2), 16) / 255
  const b = parseInt(hex.substr(4, 2), 16) / 255

  const [rs, gs, bs] = [r, g, b].map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  )

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/**
 * Calculate contrast ratio
 */
function getContrastRatio(lum1: number, lum2: number): number {
  const lighter = Math.max(lum1, lum2)
  const darker = Math.min(lum1, lum2)
  return (lighter + 0.05) / (darker + 0.05)
}
