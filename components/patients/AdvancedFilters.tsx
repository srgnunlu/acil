'use client'

import { useState } from 'react'
import { Filter, X } from 'lucide-react'

interface AdvancedFiltersProps {
  onFiltersChange: (filters: any) => void
}

/**
 * Advanced Filters Component
 */
export function AdvancedFilters({ onFiltersChange }: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: 'all',
    ageRange: { min: '', max: '' },
    hasTests: false,
    hasAnalysis: false,
  })

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const clearFilters = () => {
    const clearedFilters = {
      status: 'all',
      dateRange: 'all',
      ageRange: { min: '', max: '' },
      hasTests: false,
      hasAnalysis: false,
    }
    setFilters(clearedFilters)
    onFiltersChange(clearedFilters)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Gelişmiş Filtreler</h3>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-gray-400 hover:text-gray-600"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Filter className="h-5 w-5" />}
        </button>
      </div>

      {isOpen && (
        <div className="space-y-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Durum
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tümü</option>
              <option value="active">Aktif</option>
              <option value="discharged">Taburcu</option>
              <option value="consultation">Konsültasyon</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tarih Aralığı
            </label>
            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tüm Zamanlar</option>
              <option value="today">Bugün</option>
              <option value="week">Son 7 Gün</option>
              <option value="month">Son 30 Gün</option>
              <option value="quarter">Son 3 Ay</option>
            </select>
          </div>

          {/* Age Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Yaş Aralığı
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.ageRange.min}
                onChange={(e) => handleFilterChange('ageRange', { 
                  ...filters.ageRange, 
                  min: e.target.value 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.ageRange.max}
                onChange={(e) => handleFilterChange('ageRange', { 
                  ...filters.ageRange, 
                  max: e.target.value 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Has Tests Filter */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={filters.hasTests}
                onChange={(e) => handleFilterChange('hasTests', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Tetkik Sonucu Olanlar
            </label>
          </div>

          {/* Has Analysis Filter */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={filters.hasAnalysis}
                onChange={(e) => handleFilterChange('hasAnalysis', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              AI Analizi Yapılanlar
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Temizle
            </button>
            <button
              onClick={() => onFiltersChange(filters)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Uygula
            </button>
          </div>
        </div>
      )}
    </div>
  )
}