'use client'

/**
 * Theme Provider Component
 *
 * Provides theme context to the entire application
 */

import React, { createContext, useContext, ReactNode } from 'react'
import { ThemeContextValue } from '@/types/theme.types'
import { useTheme } from '@/lib/hooks/useTheme'

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
  userId?: string | null
  workspaceId?: string | null
}

/**
 * Theme Provider
 */
export function ThemeProvider({ children, userId, workspaceId }: ThemeProviderProps) {
  const themeValue = useTheme(userId, workspaceId)

  return <ThemeContext.Provider value={themeValue}>{children}</ThemeContext.Provider>
}

/**
 * useThemeContext Hook
 *
 * Access theme context in components
 */
export function useThemeContext(): ThemeContextValue {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useThemeContext must be used within ThemeProvider')
  }

  return context
}
