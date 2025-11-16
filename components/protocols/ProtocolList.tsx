'use client'

import { useState } from 'react'
import { Search, Star, Filter, Plus } from 'lucide-react'
import { useProtocols } from '@/lib/hooks/useProtocols'
import { useProtocolCategories } from '@/lib/hooks/useProtocolCategories'
import type { ProtocolFilters, ProtocolStatus } from '@/types/protocol.types'
import ProtocolCard from './ProtocolCard'
import CreateProtocolModal from './CreateProtocolModal'

interface ProtocolListProps {
  workspaceId: string
}

export default function ProtocolList({ workspaceId }: ProtocolListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<ProtocolStatus | 'all'>('all')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const filters: ProtocolFilters = {
    category_id: selectedCategory,
    status: statusFilter === 'all' ? undefined : statusFilter,
    is_favorited: showFavoritesOnly,
    search: searchQuery,
  }

  const { data: categoriesData } = useProtocolCategories(workspaceId)
  const { data: protocolsData, isLoading } = useProtocols(workspaceId, filters)

  const categories = categoriesData || []
  const protocols = protocolsData?.protocols || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Protokol Kütüphanesi</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Yeni Protokol
        </button>
      </div>

      {/* Create Protocol Modal */}
      <CreateProtocolModal
        workspaceId={workspaceId}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Protokol ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          {/* Category Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tüm Kategoriler</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name} ({cat.protocol_count})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ProtocolStatus | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tümü</option>
              <option value="published">Yayınlanmış</option>
              <option value="draft">Taslak</option>
              <option value="archived">Arşivlenmiş</option>
            </select>
          </div>

          {/* Favorites Toggle */}
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              showFavoritesOnly
                ? 'bg-yellow-50 border-yellow-300 text-yellow-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Star className={`h-4 w-4 ${showFavoritesOnly ? 'fill-yellow-400' : ''}`} />
            Favorilerim
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
            selectedCategory === null
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          Tümü ({protocolsData?.total || 0})
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              selectedCategory === category.id
                ? 'text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            style={{
              backgroundColor: selectedCategory === category.id ? category.color : undefined,
            }}
          >
            {category.icon} {category.name} ({category.protocol_count})
          </button>
        ))}
      </div>

      {/* Protocol Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
              <div className="h-4 bg-gray-200 rounded w-full mb-2" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : protocols.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Protokol bulunamadı</p>
          <p className="text-sm text-gray-500 mt-2">Farklı filtreler deneyin veya yeni protokol ekleyin</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {protocols.map((protocol) => (
            <ProtocolCard key={protocol.id} protocol={protocol} workspaceId={workspaceId} />
          ))}
        </div>
      )}

      {/* Pagination Info */}
      {protocolsData && protocolsData.total > 0 && (
        <div className="text-center text-sm text-gray-600">
          {protocolsData.protocols.length} / {protocolsData.total} protokol gösteriliyor
        </div>
      )}
    </div>
  )
}
