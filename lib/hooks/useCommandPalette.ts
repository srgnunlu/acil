'use client'

/**
 * useCommandPalette Hook
 *
 * Hook for managing command palette state and functionality
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Command, CommandPaletteState, RecentCommand } from '@/types/command-palette.types'
import { ALL_COMMANDS } from '@/lib/command-palette/commands'

const STORAGE_KEY = 'acil-command-palette-recent'
const MAX_RECENT_COMMANDS = 5

/**
 * Load recent commands from localStorage
 */
function loadRecentCommands(): RecentCommand[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

/**
 * Save recent commands to localStorage
 */
function saveRecentCommands(commands: RecentCommand[]): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(commands))
  } catch (error) {
    console.error('Failed to save recent commands:', error)
  }
}

/**
 * useCommandPalette Hook
 */
export function useCommandPalette() {
  const [state, setState] = useState<CommandPaletteState>({
    isOpen: false,
    searchQuery: '',
    selectedIndex: 0,
    recentCommands: loadRecentCommands(),
    filteredCommands: [],
  })

  const [registeredCommands, setRegisteredCommands] = useState<Command[]>(ALL_COMMANDS)

  /**
   * Filter commands based on search query
   */
  const filteredCommands = useMemo(() => {
    if (!state.searchQuery.trim()) {
      // Show recent commands when no search query
      const recentCommandIds = state.recentCommands
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, MAX_RECENT_COMMANDS)
        .map((rc) => rc.commandId)

      const recent = registeredCommands.filter((cmd) =>
        recentCommandIds.includes(cmd.id)
      )

      // If we have recent commands, show them first, then all commands
      return recent.length > 0 ? [...recent, ...registeredCommands] : registeredCommands
    }

    const query = state.searchQuery.toLowerCase()

    return registeredCommands.filter((cmd) => {
      // Search in label
      if (cmd.label.toLowerCase().includes(query)) return true

      // Search in description
      if (cmd.description?.toLowerCase().includes(query)) return true

      // Search in keywords
      if (cmd.keywords?.some((kw) => kw.toLowerCase().includes(query))) return true

      return false
    })
  }, [state.searchQuery, state.recentCommands, registeredCommands])

  /**
   * Update filtered commands in state
   */
  useEffect(() => {
    setState((prev) => ({
      ...prev,
      filteredCommands,
      selectedIndex: 0, // Reset selection when filtered commands change
    }))
  }, [filteredCommands])

  /**
   * Open palette
   */
  const openPalette = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: true, searchQuery: '', selectedIndex: 0 }))
  }, [])

  /**
   * Close palette
   */
  const closePalette = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false, searchQuery: '', selectedIndex: 0 }))
  }, [])

  /**
   * Toggle palette
   */
  const togglePalette = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isOpen: !prev.isOpen,
      searchQuery: '',
      selectedIndex: 0,
    }))
  }, [])

  /**
   * Set search query
   */
  const setSearchQuery = useCallback((query: string) => {
    setState((prev) => ({ ...prev, searchQuery: query, selectedIndex: 0 }))
  }, [])

  /**
   * Navigate up in command list
   */
  const navigateUp = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedIndex: prev.selectedIndex > 0 ? prev.selectedIndex - 1 : prev.filteredCommands.length - 1,
    }))
  }, [])

  /**
   * Navigate down in command list
   */
  const navigateDown = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedIndex: prev.selectedIndex < prev.filteredCommands.length - 1 ? prev.selectedIndex + 1 : 0,
    }))
  }, [])

  /**
   * Execute command
   */
  const executeCommand = useCallback(
    async (command: Command) => {
      try {
        // Execute the command action
        await command.action()

        // Update recent commands
        setState((prev) => {
          const now = Date.now()
          const existingIndex = prev.recentCommands.findIndex(
            (rc) => rc.commandId === command.id
          )

          let updatedRecent: RecentCommand[]

          if (existingIndex >= 0) {
            // Update existing recent command
            updatedRecent = [
              ...prev.recentCommands.slice(0, existingIndex),
              {
                ...prev.recentCommands[existingIndex],
                timestamp: now,
                count: prev.recentCommands[existingIndex].count + 1,
              },
              ...prev.recentCommands.slice(existingIndex + 1),
            ]
          } else {
            // Add new recent command
            updatedRecent = [
              ...prev.recentCommands,
              {
                commandId: command.id,
                timestamp: now,
                count: 1,
              },
            ]
          }

          // Keep only MAX_RECENT_COMMANDS
          updatedRecent = updatedRecent
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, MAX_RECENT_COMMANDS)

          // Save to localStorage
          saveRecentCommands(updatedRecent)

          return {
            ...prev,
            recentCommands: updatedRecent,
          }
        })

        // Close palette after execution
        closePalette()
      } catch (error) {
        console.error('Command execution failed:', error)
      }
    },
    [closePalette]
  )

  /**
   * Register a new command
   */
  const registerCommand = useCallback((command: Command) => {
    setRegisteredCommands((prev) => {
      // Avoid duplicates
      if (prev.some((cmd) => cmd.id === command.id)) {
        return prev
      }
      return [...prev, command]
    })
  }, [])

  /**
   * Unregister a command
   */
  const unregisterCommand = useCallback((commandId: string) => {
    setRegisteredCommands((prev) => prev.filter((cmd) => cmd.id !== commandId))
  }, [])

  /**
   * Get recent commands
   */
  const getRecentCommands = useCallback((): Command[] => {
    const recentCommandIds = state.recentCommands
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, MAX_RECENT_COMMANDS)
      .map((rc) => rc.commandId)

    return registeredCommands.filter((cmd) => recentCommandIds.includes(cmd.id))
  }, [state.recentCommands, registeredCommands])

  /**
   * Keyboard event handler for global Ctrl+K
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K to open/close palette
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        togglePalette()
      }

      // Escape to close
      if (e.key === 'Escape' && state.isOpen) {
        e.preventDefault()
        closePalette()
      }

      // Arrow navigation when palette is open
      if (state.isOpen) {
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          navigateUp()
        } else if (e.key === 'ArrowDown') {
          e.preventDefault()
          navigateDown()
        } else if (e.key === 'Enter') {
          e.preventDefault()
          const selectedCommand = state.filteredCommands[state.selectedIndex]
          if (selectedCommand) {
            executeCommand(selectedCommand)
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [state.isOpen, state.filteredCommands, state.selectedIndex, togglePalette, closePalette, navigateUp, navigateDown, executeCommand])

  return {
    state,
    openPalette,
    closePalette,
    togglePalette,
    setSearchQuery,
    executeCommand,
    navigateUp,
    navigateDown,
    registerCommand,
    unregisterCommand,
    getRecentCommands,
  }
}
