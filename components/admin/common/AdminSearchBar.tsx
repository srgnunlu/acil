'use client'

import { useState, FormEvent } from 'react'
import { Search, X } from 'lucide-react'

interface AdminSearchBarProps {
  placeholder?: string
  value?: string
  onSearch: (query: string) => void
  onClear?: () => void
  className?: string
}

export function AdminSearchBar({
  placeholder = 'Ara...',
  value: controlledValue,
  onSearch,
  onClear,
  className = '',
}: AdminSearchBarProps) {
  const [internalValue, setInternalValue] = useState('')
  const value = controlledValue !== undefined ? controlledValue : internalValue

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSearch(value)
  }

  const handleClear = () => {
    if (controlledValue === undefined) {
      setInternalValue('')
    }
    onClear?.()
    onSearch('')
  }

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => {
          if (controlledValue === undefined) {
            setInternalValue(e.target.value)
          }
          // Allow parent to control value
        }}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </form>
  )
}

