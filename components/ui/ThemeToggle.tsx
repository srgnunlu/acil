'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/lib/contexts/ThemeContext'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors duration-200"
      aria-label={theme === 'light' ? 'Dark moda geç' : 'Light moda geç'}
      title={theme === 'light' ? 'Dark moda geç' : 'Light moda geç'}
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5 text-gray-700" />
      ) : (
        <Sun className="w-5 h-5 text-yellow-400" />
      )}
    </button>
  )
}
