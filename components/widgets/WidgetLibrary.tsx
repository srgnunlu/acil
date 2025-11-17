'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WIDGET_CATALOG, getWidgetsByCategory } from '@/lib/widgets/widget-catalog'
import { WidgetCatalogEntry, WidgetInstance } from '@/types/widget.types'

interface WidgetLibraryProps {
  isOpen: boolean
  onClose: () => void
  onAddWidget: (widget: WidgetCatalogEntry) => void
}

const categories = [
  { id: 'overview', label: 'Genel Bakış', icon: '📊' },
  { id: 'patients', label: 'Hastalar', icon: '👥' },
  { id: 'analytics', label: 'Analitik', icon: '📈' },
  { id: 'collaboration', label: 'İşbirliği', icon: '🤝' },
  { id: 'tools', label: 'Araçlar', icon: '🛠️' },
]

export function WidgetLibrary({ isOpen, onClose, onAddWidget }: WidgetLibraryProps) {
  const [selectedCategory, setSelectedCategory] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredWidgets = searchQuery
    ? WIDGET_CATALOG.filter(
        (w) =>
          w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          w.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : getWidgetsByCategory(selectedCategory)

  const handleAdd = (widget: WidgetCatalogEntry) => {
    onAddWidget(widget)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 top-1/2 -translate-y-1/2 w-full md:w-[900px] max-h-[80vh] bg-white rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Widget Kütüphanesi</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Dashboard'unuza eklemek için widget seçin
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Search */}
            <div className="p-6 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Widget ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex h-[calc(80vh-200px)]">
              {/* Categories Sidebar */}
              <div className="w-48 border-r border-gray-200 p-4 overflow-y-auto">
                <nav className="space-y-1">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.id)
                        setSearchQuery('')
                      }}
                      className={`
                        w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                        ${
                          selectedCategory === cat.id
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        }
                      `}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Widgets Grid */}
              <div className="flex-1 p-6 overflow-y-auto">
                {filteredWidgets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <Search className="w-16 h-16 text-gray-300 mb-4" />
                    <p className="text-lg font-medium">Widget bulunamadı</p>
                    <p className="text-sm mt-1">Farklı bir kategori veya arama terimi deneyin</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredWidgets.map((widget) => (
                      <motion.div
                        key={widget.type}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group relative bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
                        onClick={() => handleAdd(widget)}
                      >
                        {/* Widget Icon */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                            {widget.icon}
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="p-2 bg-blue-600 text-white rounded-lg shadow-lg">
                              <Plus className="w-4 h-4" />
                            </div>
                          </div>
                        </div>

                        {/* Widget Info */}
                        <h3 className="font-semibold text-gray-900 mb-1">{widget.title}</h3>
                        <p className="text-sm text-gray-600 mb-3">{widget.description}</p>

                        {/* Widget Size */}
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="px-2 py-1 bg-gray-100 rounded">
                            {widget.defaultSize.w}x{widget.defaultSize.h}
                          </span>
                          {widget.isNew && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-medium">
                              YENİ
                            </span>
                          )}
                          {widget.isPro && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded font-medium">
                              PRO
                            </span>
                          )}
                        </div>

                        {/* Hover Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-indigo-500/0 group-hover:from-blue-500/5 group-hover:to-indigo-500/5 rounded-lg pointer-events-none transition-all" />
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-600">
                {filteredWidgets.length} widget bulundu
              </p>
              <Button variant="outline" size="sm" onClick={onClose}>
                Kapat
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
