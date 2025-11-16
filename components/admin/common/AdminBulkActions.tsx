'use client'

import { useState } from 'react'
import { Trash2, Archive, CheckSquare, Square } from 'lucide-react'
import { AdminConfirmDialog } from './AdminConfirmDialog'

interface AdminBulkActionsProps<T> {
  selectedItems: T[]
  onBulkDelete?: (items: T[]) => Promise<void>
  onBulkArchive?: (items: T[]) => Promise<void>
  onBulkUpdate?: (items: T[], updates: Record<string, unknown>) => Promise<void>
  onSelectAll?: () => void
  onDeselectAll?: () => void
  totalItems: number
  itemName?: string
}

export function AdminBulkActions<T extends { id: string }>({
  selectedItems,
  onBulkDelete,
  onBulkArchive,
  onBulkUpdate,
  onSelectAll,
  onDeselectAll,
  totalItems,
  itemName = 'öğe',
}: AdminBulkActionsProps<T>) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const allSelected = selectedItems.length === totalItems && totalItems > 0

  const handleSelectAll = () => {
    if (allSelected) {
      onDeselectAll?.()
    } else {
      onSelectAll?.()
    }
  }

  const handleBulkDelete = async () => {
    if (!onBulkDelete) return

    setLoading(true)
    try {
      await onBulkDelete(selectedItems)
      setShowDeleteDialog(false)
    } catch (error) {
      console.error('Bulk delete failed:', error)
    } finally {
      setLoading(false)
    }
  }

  if (selectedItems.length === 0) {
    return (
      <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSelectAll}
            className="p-1 text-gray-600 hover:text-gray-900 transition-colors"
            title={allSelected ? 'Tümünü Kaldır' : 'Tümünü Seç'}
          >
            {allSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
          </button>
          <span className="text-sm text-gray-600">
            {totalItems} {itemName}
          </span>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-4">
          <button
            onClick={handleSelectAll}
            className="p-1 text-blue-600 hover:text-blue-700 transition-colors"
            title={allSelected ? 'Tümünü Kaldır' : 'Tümünü Seç'}
          >
            {allSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
          </button>
          <span className="text-sm font-medium text-blue-900">
            {selectedItems.length} {itemName} seçildi
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onBulkArchive && (
            <button
              onClick={() => onBulkArchive(selectedItems)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Archive className="w-4 h-4" />
              Arşivle
            </button>
          )}
          {onBulkDelete && (
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Sil ({selectedItems.length})
            </button>
          )}
        </div>
      </div>

      {onBulkDelete && (
        <AdminConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleBulkDelete}
          title="Toplu Silme"
          message={`${selectedItems.length} ${itemName} silinecek. Bu işlem geri alınamaz.`}
          confirmText="Sil"
          variant="danger"
          loading={loading}
        />
      )}
    </>
  )
}

