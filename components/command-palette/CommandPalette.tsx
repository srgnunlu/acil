'use client'

/**
 * Command Palette Component
 *
 * Main command palette UI with search and command execution
 */

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Clock, Command as CommandIcon } from 'lucide-react'
import { useCommandPalette } from '@/lib/hooks/useCommandPalette'
import { Command, CommandCategory } from '@/types/command-palette.types'
import { getCategoryLabel, formatShortcut } from '@/lib/command-palette/commands'
import { triggerHaptic } from '@/lib/utils/haptics'

/**
 * Command Palette Component
 */
export function CommandPalette() {
  const { state, closePalette, setSearchQuery, executeCommand, getRecentCommands } =
    useCommandPalette()

  const searchInputRef = useRef<HTMLInputElement>(null)

  // Focus search input when palette opens
  useEffect(() => {
    if (state.isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [state.isOpen])

  // Group commands by category
  const groupedCommands = state.filteredCommands.reduce(
    (acc, cmd) => {
      if (!acc[cmd.category]) {
        acc[cmd.category] = []
      }
      acc[cmd.category].push(cmd)
      return acc
    },
    {} as Record<CommandCategory, Command[]>
  )

  const recentCommands = getRecentCommands()
  const hasResults = state.filteredCommands.length > 0

  return (
    <AnimatePresence>
      {state.isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
            onClick={closePalette}
          />

          {/* Command Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-[101]"
          >
            <div className="mx-4 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <Search className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={state.searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Komut ara veya bir şeyler yaz..."
                  className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none text-base"
                />
                <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono text-gray-600 dark:text-gray-400">
                  ESC
                </kbd>
              </div>

              {/* Command List */}
              <div className="max-h-[60vh] overflow-y-auto">
                {/* Recent Commands */}
                {!state.searchQuery && recentCommands.length > 0 && (
                  <CommandGroup
                    label="Son Kullanılan"
                    icon={<Clock className="w-4 h-4" />}
                    commands={recentCommands}
                    selectedIndex={state.selectedIndex}
                    onCommandClick={(cmd) => {
                      triggerHaptic('light')
                      executeCommand(cmd)
                    }}
                    startIndex={0}
                  />
                )}

                {/* Filtered Commands */}
                {hasResults ? (
                  Object.entries(groupedCommands).map(([category, commands]) => (
                    <CommandGroup
                      key={category}
                      label={getCategoryLabel(category as CommandCategory)}
                      commands={commands}
                      selectedIndex={state.selectedIndex}
                      onCommandClick={(cmd) => {
                        triggerHaptic('light')
                        executeCommand(cmd)
                      }}
                      startIndex={state.filteredCommands.findIndex((c) => c.category === category)}
                    />
                  ))
                ) : (
                  <div className="px-4 py-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                      <Search className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-gray-900 dark:text-gray-100 font-medium mb-1">
                      Sonuç bulunamadı
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      &quot;{state.searchQuery}&quot; için bir komut bulunamadı
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded font-mono">
                      ↑↓
                    </kbd>
                    Gezin
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded font-mono">
                      ↵
                    </kbd>
                    Seç
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <CommandIcon className="w-3 h-3" />
                  <span>Komut Paleti</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/**
 * Command Group Component
 */
interface CommandGroupProps {
  label: string
  icon?: React.ReactNode
  commands: Command[]
  selectedIndex: number
  onCommandClick: (command: Command, index: number) => void
  startIndex: number
}

function CommandGroup({
  label,
  icon,
  commands,
  selectedIndex,
  onCommandClick,
  startIndex,
}: CommandGroupProps) {
  if (commands.length === 0) return null

  return (
    <div className="py-2">
      <div className="flex items-center gap-2 px-4 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {icon}
        {label}
      </div>
      <div>
        {commands.map((command, index) => {
          const absoluteIndex = startIndex + index
          const isSelected = absoluteIndex === selectedIndex

          return (
            <CommandItem
              key={command.id}
              command={command}
              isSelected={isSelected}
              onClick={() => onCommandClick(command, absoluteIndex)}
            />
          )
        })}
      </div>
    </div>
  )
}

/**
 * Command Item Component
 */
interface CommandItemProps {
  command: Command
  isSelected: boolean
  onClick: () => void
}

function CommandItem({ command, isSelected, onClick }: CommandItemProps) {
  const itemRef = useRef<HTMLButtonElement>(null)

  // Scroll selected item into view
  useEffect(() => {
    if (isSelected && itemRef.current) {
      itemRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [isSelected])

  return (
    <button
      ref={itemRef}
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
        ${
          isSelected
            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
            : 'text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800/50'
        }
      `}
    >
      {/* Icon */}
      {command.icon && (
        <div
          className={`
          flex-shrink-0
          ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}
        `}
        >
          {command.icon}
        </div>
      )}

      {/* Label & Description */}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{command.label}</p>
        {command.description && (
          <p
            className={`
            text-xs truncate
            ${isSelected ? 'text-blue-600/80 dark:text-blue-400/80' : 'text-gray-500 dark:text-gray-400'}
          `}
          >
            {command.description}
          </p>
        )}
      </div>

      {/* Shortcut */}
      {command.shortcut && (
        <kbd
          className={`
          hidden sm:block flex-shrink-0 px-2 py-1 rounded text-xs font-mono border
          ${
            isSelected
              ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400'
              : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
          }
        `}
        >
          {formatShortcut(command.shortcut)}
        </kbd>
      )}
    </button>
  )
}

/**
 * Command Palette Provider
 *
 * Wrap your app with this to enable command palette globally
 */
export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <CommandPalette />
    </>
  )
}
