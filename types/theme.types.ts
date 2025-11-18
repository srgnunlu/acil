/**
 * Theme System Types
 *
 * Type definitions for the theme customization system
 */

export type ThemeMode = 'light' | 'dark' | 'system'

export interface ColorPalette {
  primary: string
  primaryDark: string
  primaryLight: string
  secondary: string
  secondaryDark: string
  secondaryLight: string
  accent: string
  success: string
  warning: string
  error: string
  info: string
  background: string
  backgroundSecondary: string
  surface: string
  surfaceHover: string
  text: string
  textSecondary: string
  textMuted: string
  border: string
  borderLight: string
  shadow: string
}

export interface ThemeConfig {
  id: string
  name: string
  mode: 'light' | 'dark'
  colors: ColorPalette
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  spacing: 'compact' | 'normal' | 'comfortable'
  fontFamily?: string
  isCustom?: boolean
  preview?: string // Preview image URL
}

export interface UserThemePreferences {
  userId: string
  workspaceId: string | null
  currentThemeId: string
  themeMode: ThemeMode
  customThemes: ThemeConfig[]
  fontSize: 'sm' | 'base' | 'lg'
  reducedMotion: boolean
  highContrast: boolean
  colorBlindMode?: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia'
}

export interface ThemeContextValue {
  theme: ThemeConfig
  themeMode: ThemeMode
  preferences: UserThemePreferences
  setTheme: (themeId: string) => void
  setThemeMode: (mode: ThemeMode) => void
  createCustomTheme: (theme: Omit<ThemeConfig, 'id' | 'isCustom'>) => void
  updateCustomTheme: (themeId: string, theme: Partial<ThemeConfig>) => void
  deleteCustomTheme: (themeId: string) => void
  updatePreferences: (preferences: Partial<UserThemePreferences>) => void
  exportTheme: (themeId: string) => string
  importTheme: (themeJson: string) => void
}
