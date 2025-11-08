'use client'

import { useState, useCallback } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'

export interface FilterOptions {
  search: string
  status: string[]
  gender: string[]
  ageRange: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

interface PatientSearchProps {
  onFilterChange: (filters: FilterOptions) => void
}

export function PatientSearch({ onFilterChange }: PatientSearchProps) {
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    status: [],
    gender: [],
    ageRange: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc',
  })

  const activeFilterCount =
    filters.status.length +
    filters.gender.length +
    (filters.ageRange !== 'all' ? 1 : 0) +
    (filters.sortBy !== 'created_at' ? 1 : 0)

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value)
      const newFilters = { ...filters, search: value }
      setFilters(newFilters)
      onFilterChange(newFilters)
    },
    [filters, onFilterChange]
  )

  const handleFilterChange = useCallback(
    (key: keyof FilterOptions, value: string | string[] | 'asc' | 'desc') => {
      const newFilters = { ...filters, [key]: value }
      setFilters(newFilters)
      onFilterChange(newFilters)
    },
    [filters, onFilterChange]
  )

  const toggleArrayFilter = useCallback(
    (key: 'status' | 'gender', value: string) => {
      const currentArray = filters[key]
      const newArray = currentArray.includes(value)
        ? currentArray.filter((item) => item !== value)
        : [...currentArray, value]
      handleFilterChange(key, newArray)
    },
    [filters, handleFilterChange]
  )

  const clearFilters = () => {
    const defaultFilters: FilterOptions = {
      search,
      status: [],
      gender: [],
      ageRange: 'all',
      sortBy: 'created_at',
      sortOrder: 'desc',
    }
    setFilters(defaultFilters)
    onFilterChange(defaultFilters)
  }

  return (
    <div className="mb-6 space-y-4">
      {/* Arama Çubuğu */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Hasta adı, yaş veya cinsiyet ile ara..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
            aria-label="Hasta ara"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="px-4 py-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 font-medium text-gray-700 dark:text-gray-200"
          aria-label="Filtreleri aç"
          aria-expanded={showFilters}
        >
          <SlidersHorizontal className="w-5 h-5" />
          Filtreler
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Hızlı Filtre Chip'leri */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleFilterChange('status', [])}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            filters.status.length === 0
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
          }`}
        >
          Tümü
        </button>
        <button
          onClick={() => toggleArrayFilter('status', 'active')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            filters.status.includes('active')
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
          }`}
        >
          Aktif
        </button>
        <button
          onClick={() => toggleArrayFilter('status', 'consultation')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            filters.status.includes('consultation')
              ? 'bg-yellow-600 text-white'
              : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
          }`}
        >
          Konsültasyon
        </button>
        <button
          onClick={() => toggleArrayFilter('status', 'discharged')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            filters.status.includes('discharged')
              ? 'bg-gray-600 text-white'
              : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
          }`}
        >
          Taburcu
        </button>
      </div>

      {/* Gelişmiş Filtreler Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-6 shadow-lg animate-in slide-in-from-top-5 fade-in">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Gelişmiş Filtreler
            </h3>
            <button
              onClick={() => setShowFilters(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Filtreleri kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Cinsiyet */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cinsiyet
              </label>
              <div className="space-y-2">
                {['Erkek', 'Kadın'].map((gender) => (
                  <label key={gender} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.gender.includes(gender)}
                      onChange={() => toggleArrayFilter('gender', gender)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{gender}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Yaş Aralığı */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Yaş Aralığı
              </label>
              <select
                value={filters.ageRange}
                onChange={(e) => handleFilterChange('ageRange', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
              >
                <option value="all">Tümü</option>
                <option value="0-18">0-18 yaş</option>
                <option value="19-40">19-40 yaş</option>
                <option value="41-65">41-65 yaş</option>
                <option value="65+">65+ yaş</option>
              </select>
            </div>

            {/* Sıralama */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sırala
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
              >
                <option value="created_at">Kayıt Tarihi</option>
                <option value="name">İsim</option>
                <option value="age">Yaş</option>
              </select>
            </div>

            {/* Sıralama Yönü */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sıralama Yönü
              </label>
              <select
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value as 'asc' | 'desc')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
              >
                <option value="desc">Azalan</option>
                <option value="asc">Artan</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
            >
              Filtreleri Temizle
            </button>
            <button
              onClick={() => setShowFilters(false)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Uygula
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
