'use client'

import { useEffect, useCallback } from 'react'

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  alt?: boolean
  shift?: boolean
  meta?: boolean // Command on Mac
  description: string
  action: () => void
  category?: string
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[]
  enabled?: boolean
}

/**
 * Keyboard Shortcuts Hook
 *
 * Manages global keyboard shortcuts
 */
export function useKeyboardShortcuts({
  shortcuts,
  enabled = true,
}: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return

      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      for (const shortcut of shortcuts) {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase()
        const ctrlMatches = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey
        const altMatches = shortcut.alt ? event.altKey : !event.altKey
        const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey
        const metaMatches = shortcut.meta ? event.metaKey : true

        if (keyMatches && ctrlMatches && altMatches && shiftMatches && metaMatches) {
          event.preventDefault()
          shortcut.action()
          break
        }
      }
    },
    [shortcuts, enabled]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

/**
 * Format shortcut for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = []

  if (shortcut.ctrl) parts.push('Ctrl')
  if (shortcut.alt) parts.push('Alt')
  if (shortcut.shift) parts.push('Shift')
  if (shortcut.meta) parts.push('⌘')

  parts.push(shortcut.key.toUpperCase())

  return parts.join('+')
}

/**
 * Default dashboard shortcuts
 */
export const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  {
    key: 'k',
    ctrl: true,
    description: 'Komut paleti aç',
    action: () => console.log('Command palette'),
    category: 'Genel',
  },
  {
    key: '/',
    description: 'Arama yap',
    action: () => document.getElementById('search-input')?.focus(),
    category: 'Genel',
  },
  {
    key: 'n',
    ctrl: true,
    description: 'Yeni hasta ekle',
    action: () => (window.location.href = '/dashboard/patients?action=new'),
    category: 'Hastalar',
  },
  {
    key: 'd',
    ctrl: true,
    description: 'Dashboard\'a git',
    action: () => (window.location.href = '/dashboard'),
    category: 'Navigasyon',
  },
  {
    key: 'p',
    ctrl: true,
    description: 'Hasta listesine git',
    action: () => (window.location.href = '/dashboard/patients'),
    category: 'Navigasyon',
  },
  {
    key: 'a',
    ctrl: true,
    description: 'Analizler\'e git',
    action: () => (window.location.href = '/dashboard/analytics'),
    category: 'Navigasyon',
  },
  {
    key: 's',
    ctrl: true,
    description: 'Ayarlar\'a git',
    action: () => (window.location.href = '/dashboard/settings'),
    category: 'Navigasyon',
  },
  {
    key: 'e',
    ctrl: true,
    description: 'Dashboard düzenleme modu',
    action: () => console.log('Toggle edit mode'),
    category: 'Dashboard',
  },
  {
    key: 'w',
    ctrl: true,
    description: 'Widget ekle',
    action: () => console.log('Open widget library'),
    category: 'Dashboard',
  },
  {
    key: '?',
    shift: true,
    description: 'Klavye kısayolları',
    action: () => console.log('Show shortcuts'),
    category: 'Yardım',
  },
  {
    key: 'Escape',
    description: 'Modal\'ları kapat',
    action: () => console.log('Close modals'),
    category: 'Genel',
  },
]
