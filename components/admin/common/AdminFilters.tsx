'use client'

import { ReactNode } from 'react'
import { X } from 'lucide-react'

interface FilterOption {
  value: string
  label: string
}

interface Filter {
  key: string
  label: string
  type: 'select' | 'text' | 'date' | 'checkbox'
  options?: FilterOption[]
  placeholder?: string
}

interface AdminFiltersProps {
  filters: Filter[]
  values: Record<string, string | boolean>
  onChange: (key: string, value: string | boolean) => void
  onReset: () => void
  className?: string
}

export function AdminFilters({
  filters,
  values,
  onChange,
  onReset,
  className = '',
}: AdminFiltersProps) {
  const hasActiveFilters = Object.values(values).some((v) => v !== '' && v !== false)

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-700">Filtreler</h3>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <X className="w-4 h-4" />
            Temizle
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filters.map((filter) => (
          <div key={filter.key}>
            <label className="block text-xs font-medium text-gray-700 mb-1">{filter.label}</label>
            {filter.type === 'select' && (
              <select
                value={(values[filter.key] as string) || ''}
                onChange={(e) => onChange(filter.key, e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tümü</option>
                {filter.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}

            {filter.type === 'text' && (
              <input
                type="text"
                value={(values[filter.key] as string) || ''}
                onChange={(e) => onChange(filter.key, e.target.value)}
                placeholder={filter.placeholder}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            )}

            {filter.type === 'date' && (
              <input
                type="date"
                value={(values[filter.key] as string) || ''}
                onChange={(e) => onChange(filter.key, e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            )}

            {filter.type === 'checkbox' && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={(values[filter.key] as boolean) || false}
                  onChange={(e) => onChange(filter.key, e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{filter.label}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

