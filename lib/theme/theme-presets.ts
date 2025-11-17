/**
 * Theme Presets
 *
 * Predefined theme configurations with professional color palettes
 */

import { ThemeConfig } from '@/types/theme.types'

/**
 * Light Theme - Default
 */
export const LIGHT_THEME: ThemeConfig = {
  id: 'light',
  name: 'Aydınlık',
  mode: 'light',
  colors: {
    primary: '#3b82f6', // Blue 500
    primaryDark: '#2563eb', // Blue 600
    primaryLight: '#60a5fa', // Blue 400
    secondary: '#8b5cf6', // Violet 500
    secondaryDark: '#7c3aed', // Violet 600
    secondaryLight: '#a78bfa', // Violet 400
    accent: '#10b981', // Emerald 500
    success: '#22c55e', // Green 500
    warning: '#f59e0b', // Amber 500
    error: '#ef4444', // Red 500
    info: '#06b6d4', // Cyan 500
    background: '#ffffff',
    backgroundSecondary: '#f9fafb', // Gray 50
    surface: '#ffffff',
    surfaceHover: '#f3f4f6', // Gray 100
    text: '#111827', // Gray 900
    textSecondary: '#4b5563', // Gray 600
    textMuted: '#9ca3af', // Gray 400
    border: '#e5e7eb', // Gray 200
    borderLight: '#f3f4f6', // Gray 100
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  borderRadius: 'md',
  spacing: 'normal',
}

/**
 * Dark Theme - Default
 */
export const DARK_THEME: ThemeConfig = {
  id: 'dark',
  name: 'Karanlık',
  mode: 'dark',
  colors: {
    primary: '#60a5fa', // Blue 400
    primaryDark: '#3b82f6', // Blue 500
    primaryLight: '#93c5fd', // Blue 300
    secondary: '#a78bfa', // Violet 400
    secondaryDark: '#8b5cf6', // Violet 500
    secondaryLight: '#c4b5fd', // Violet 300
    accent: '#34d399', // Emerald 400
    success: '#4ade80', // Green 400
    warning: '#fbbf24', // Amber 400
    error: '#f87171', // Red 400
    info: '#22d3ee', // Cyan 400
    background: '#0f172a', // Slate 900
    backgroundSecondary: '#1e293b', // Slate 800
    surface: '#1e293b', // Slate 800
    surfaceHover: '#334155', // Slate 700
    text: '#f1f5f9', // Slate 100
    textSecondary: '#cbd5e1', // Slate 300
    textMuted: '#64748b', // Slate 500
    border: '#334155', // Slate 700
    borderLight: '#475569', // Slate 600
    shadow: 'rgba(0, 0, 0, 0.5)',
  },
  borderRadius: 'md',
  spacing: 'normal',
}

/**
 * Ocean Theme - Professional Blue
 */
export const OCEAN_THEME: ThemeConfig = {
  id: 'ocean',
  name: 'Okyanus',
  mode: 'light',
  colors: {
    primary: '#0891b2', // Cyan 600
    primaryDark: '#0e7490', // Cyan 700
    primaryLight: '#06b6d4', // Cyan 500
    secondary: '#0284c7', // Sky 600
    secondaryDark: '#0369a1', // Sky 700
    secondaryLight: '#0ea5e9', // Sky 500
    accent: '#14b8a6', // Teal 500
    success: '#059669', // Emerald 600
    warning: '#d97706', // Amber 600
    error: '#dc2626', // Red 600
    info: '#2563eb', // Blue 600
    background: '#f0fdfa', // Teal 50
    backgroundSecondary: '#ffffff',
    surface: '#ffffff',
    surfaceHover: '#ccfbf1', // Teal 100
    text: '#164e63', // Cyan 900
    textSecondary: '#155e75', // Cyan 800
    textMuted: '#0e7490', // Cyan 700
    border: '#99f6e4', // Teal 200
    borderLight: '#ccfbf1', // Teal 100
    shadow: 'rgba(8, 145, 178, 0.15)',
  },
  borderRadius: 'lg',
  spacing: 'comfortable',
}

/**
 * Forest Theme - Natural Green
 */
export const FOREST_THEME: ThemeConfig = {
  id: 'forest',
  name: 'Orman',
  mode: 'light',
  colors: {
    primary: '#16a34a', // Green 600
    primaryDark: '#15803d', // Green 700
    primaryLight: '#22c55e', // Green 500
    secondary: '#65a30d', // Lime 600
    secondaryDark: '#4d7c0f', // Lime 700
    secondaryLight: '#84cc16', // Lime 500
    accent: '#0d9488', // Teal 600
    success: '#10b981', // Emerald 500
    warning: '#f59e0b', // Amber 500
    error: '#dc2626', // Red 600
    info: '#0891b2', // Cyan 600
    background: '#f7fee7', // Lime 50
    backgroundSecondary: '#ffffff',
    surface: '#ffffff',
    surfaceHover: '#ecfccb', // Lime 100
    text: '#14532d', // Green 900
    textSecondary: '#166534', // Green 800
    textMuted: '#15803d', // Green 700
    border: '#d9f99d', // Lime 200
    borderLight: '#ecfccb', // Lime 100
    shadow: 'rgba(22, 163, 74, 0.15)',
  },
  borderRadius: 'lg',
  spacing: 'comfortable',
}

/**
 * Sunset Theme - Warm Orange/Red
 */
export const SUNSET_THEME: ThemeConfig = {
  id: 'sunset',
  name: 'Gün Batımı',
  mode: 'light',
  colors: {
    primary: '#ea580c', // Orange 600
    primaryDark: '#c2410c', // Orange 700
    primaryLight: '#f97316', // Orange 500
    secondary: '#dc2626', // Red 600
    secondaryDark: '#b91c1c', // Red 700
    secondaryLight: '#ef4444', // Red 500
    accent: '#d946ef', // Fuchsia 500
    success: '#16a34a', // Green 600
    warning: '#eab308', // Yellow 500
    error: '#b91c1c', // Red 700
    info: '#0891b2', // Cyan 600
    background: '#fff7ed', // Orange 50
    backgroundSecondary: '#ffffff',
    surface: '#ffffff',
    surfaceHover: '#ffedd5', // Orange 100
    text: '#7c2d12', // Orange 900
    textSecondary: '#9a3412', // Orange 800
    textMuted: '#c2410c', // Orange 700
    border: '#fed7aa', // Orange 200
    borderLight: '#ffedd5', // Orange 100
    shadow: 'rgba(234, 88, 12, 0.15)',
  },
  borderRadius: 'xl',
  spacing: 'normal',
}

/**
 * Purple Dream Theme - Royal Purple
 */
export const PURPLE_DREAM_THEME: ThemeConfig = {
  id: 'purple-dream',
  name: 'Mor Rüya',
  mode: 'light',
  colors: {
    primary: '#9333ea', // Purple 600
    primaryDark: '#7e22ce', // Purple 700
    primaryLight: '#a855f7', // Purple 500
    secondary: '#c026d3', // Fuchsia 600
    secondaryDark: '#a21caf', // Fuchsia 700
    secondaryLight: '#d946ef', // Fuchsia 500
    accent: '#ec4899', // Pink 500
    success: '#10b981', // Emerald 500
    warning: '#f59e0b', // Amber 500
    error: '#ef4444', // Red 500
    info: '#3b82f6', // Blue 500
    background: '#faf5ff', // Purple 50
    backgroundSecondary: '#ffffff',
    surface: '#ffffff',
    surfaceHover: '#f3e8ff', // Purple 100
    text: '#581c87', // Purple 900
    textSecondary: '#6b21a8', // Purple 800
    textMuted: '#7e22ce', // Purple 700
    border: '#e9d5ff', // Purple 200
    borderLight: '#f3e8ff', // Purple 100
    shadow: 'rgba(147, 51, 234, 0.15)',
  },
  borderRadius: 'xl',
  spacing: 'comfortable',
}

/**
 * Midnight Theme - Dark with Blue accent
 */
export const MIDNIGHT_THEME: ThemeConfig = {
  id: 'midnight',
  name: 'Gece Yarısı',
  mode: 'dark',
  colors: {
    primary: '#38bdf8', // Sky 400
    primaryDark: '#0ea5e9', // Sky 500
    primaryLight: '#7dd3fc', // Sky 300
    secondary: '#818cf8', // Indigo 400
    secondaryDark: '#6366f1', // Indigo 500
    secondaryLight: '#a5b4fc', // Indigo 300
    accent: '#22d3ee', // Cyan 400
    success: '#34d399', // Emerald 400
    warning: '#fbbf24', // Amber 400
    error: '#f87171', // Red 400
    info: '#60a5fa', // Blue 400
    background: '#020617', // Slate 950
    backgroundSecondary: '#0f172a', // Slate 900
    surface: '#0f172a', // Slate 900
    surfaceHover: '#1e293b', // Slate 800
    text: '#f8fafc', // Slate 50
    textSecondary: '#e2e8f0', // Slate 200
    textMuted: '#94a3b8', // Slate 400
    border: '#1e293b', // Slate 800
    borderLight: '#334155', // Slate 700
    shadow: 'rgba(0, 0, 0, 0.6)',
  },
  borderRadius: 'lg',
  spacing: 'normal',
}

/**
 * Charcoal Theme - Dark with Green accent
 */
export const CHARCOAL_THEME: ThemeConfig = {
  id: 'charcoal',
  name: 'Kömür',
  mode: 'dark',
  colors: {
    primary: '#4ade80', // Green 400
    primaryDark: '#22c55e', // Green 500
    primaryLight: '#86efac', // Green 300
    secondary: '#a3e635', // Lime 400
    secondaryDark: '#84cc16', // Lime 500
    secondaryLight: '#bef264', // Lime 300
    accent: '#34d399', // Emerald 400
    success: '#10b981', // Emerald 500
    warning: '#fbbf24', // Amber 400
    error: '#f87171', // Red 400
    info: '#22d3ee', // Cyan 400
    background: '#0a0a0a',
    backgroundSecondary: '#171717', // Neutral 900
    surface: '#262626', // Neutral 800
    surfaceHover: '#404040', // Neutral 700
    text: '#fafafa', // Neutral 50
    textSecondary: '#d4d4d4', // Neutral 300
    textMuted: '#737373', // Neutral 500
    border: '#404040', // Neutral 700
    borderLight: '#525252', // Neutral 600
    shadow: 'rgba(0, 0, 0, 0.7)',
  },
  borderRadius: 'sm',
  spacing: 'compact',
}

/**
 * High Contrast Light Theme - Accessibility
 */
export const HIGH_CONTRAST_LIGHT_THEME: ThemeConfig = {
  id: 'high-contrast-light',
  name: 'Yüksek Kontrast (Aydınlık)',
  mode: 'light',
  colors: {
    primary: '#0000ff', // Pure Blue
    primaryDark: '#000080', // Navy
    primaryLight: '#0066ff',
    secondary: '#800080', // Purple
    secondaryDark: '#4b0082', // Indigo
    secondaryLight: '#9932cc',
    accent: '#008000', // Green
    success: '#006400', // Dark Green
    warning: '#ff8c00', // Dark Orange
    error: '#ff0000', // Red
    info: '#0000cd', // Medium Blue
    background: '#ffffff',
    backgroundSecondary: '#f0f0f0',
    surface: '#ffffff',
    surfaceHover: '#e0e0e0',
    text: '#000000',
    textSecondary: '#1a1a1a',
    textMuted: '#4d4d4d',
    border: '#000000',
    borderLight: '#333333',
    shadow: 'rgba(0, 0, 0, 0.3)',
  },
  borderRadius: 'none',
  spacing: 'comfortable',
}

/**
 * High Contrast Dark Theme - Accessibility
 */
export const HIGH_CONTRAST_DARK_THEME: ThemeConfig = {
  id: 'high-contrast-dark',
  name: 'Yüksek Kontrast (Karanlık)',
  mode: 'dark',
  colors: {
    primary: '#00ffff', // Cyan
    primaryDark: '#00cccc',
    primaryLight: '#66ffff',
    secondary: '#ff00ff', // Magenta
    secondaryDark: '#cc00cc',
    secondaryLight: '#ff66ff',
    accent: '#00ff00', // Lime
    success: '#00ff00', // Lime
    warning: '#ffff00', // Yellow
    error: '#ff0000', // Red
    info: '#00ccff',
    background: '#000000',
    backgroundSecondary: '#0a0a0a',
    surface: '#1a1a1a',
    surfaceHover: '#333333',
    text: '#ffffff',
    textSecondary: '#f0f0f0',
    textMuted: '#b3b3b3',
    border: '#ffffff',
    borderLight: '#cccccc',
    shadow: 'rgba(255, 255, 255, 0.3)',
  },
  borderRadius: 'none',
  spacing: 'comfortable',
}

/**
 * All predefined themes
 */
export const PREDEFINED_THEMES: ThemeConfig[] = [
  LIGHT_THEME,
  DARK_THEME,
  OCEAN_THEME,
  FOREST_THEME,
  SUNSET_THEME,
  PURPLE_DREAM_THEME,
  MIDNIGHT_THEME,
  CHARCOAL_THEME,
  HIGH_CONTRAST_LIGHT_THEME,
  HIGH_CONTRAST_DARK_THEME,
]

/**
 * Get theme by ID
 */
export function getThemeById(themeId: string): ThemeConfig | undefined {
  return PREDEFINED_THEMES.find((theme) => theme.id === themeId)
}

/**
 * Get themes by mode
 */
export function getThemesByMode(mode: 'light' | 'dark'): ThemeConfig[] {
  return PREDEFINED_THEMES.filter((theme) => theme.mode === mode)
}

/**
 * Theme categories for organization
 */
export const THEME_CATEGORIES = [
  {
    id: 'default',
    label: 'Varsayılan',
    themes: ['light', 'dark'],
  },
  {
    id: 'colorful',
    label: 'Renkli',
    themes: ['ocean', 'forest', 'sunset', 'purple-dream'],
  },
  {
    id: 'dark',
    label: 'Karanlık',
    themes: ['midnight', 'charcoal'],
  },
  {
    id: 'accessibility',
    label: 'Erişilebilirlik',
    themes: ['high-contrast-light', 'high-contrast-dark'],
  },
]
