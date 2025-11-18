/**
 * Command Palette Types
 *
 * Type definitions for the command palette system
 */

export type CommandCategory =
  | 'navigation'
  | 'actions'
  | 'dashboard'
  | 'widgets'
  | 'theme'
  | 'settings'
  | 'help'

export interface Command {
  id: string
  label: string
  description?: string
  category: CommandCategory
  keywords?: string[]
  icon?: React.ReactNode
  shortcut?: KeyboardShortcut
  action: () => void | Promise<void>
  isAvailable?: () => boolean
  requiresPermission?: string
}

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  alt?: boolean
  shift?: boolean
  meta?: boolean
}

export interface CommandGroup {
  category: CommandCategory
  label: string
  commands: Command[]
}

export interface RecentCommand {
  commandId: string
  timestamp: number
  count: number
}

export interface CommandPaletteState {
  isOpen: boolean
  searchQuery: string
  selectedIndex: number
  recentCommands: RecentCommand[]
  filteredCommands: Command[]
}

export interface CommandPaletteContextValue {
  state: CommandPaletteState
  openPalette: () => void
  closePalette: () => void
  togglePalette: () => void
  setSearchQuery: (query: string) => void
  executeCommand: (command: Command) => void
  navigateUp: () => void
  navigateDown: () => void
  registerCommand: (command: Command) => void
  unregisterCommand: (commandId: string) => void
  getRecentCommands: () => Command[]
}
