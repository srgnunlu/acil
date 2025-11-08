'use client'

import { useState } from 'react'
import { Trash2, Users, CheckCircle, X } from 'lucide-react'

interface BulkActionsProps {
  selectedIds: string[]
  onAction: (action: string, ids: string[]) => void
  onClearSelection: () => void
}

/**
 * Bulk Actions Component
 */
export function BulkActions({ selectedIds, onAction, onClearSelection }: BulkActionsProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handleBulkAction = async (action: string) => {
    if (selectedIds.length === 0) return

    setIsLoading(action)
    
    try {
      const response = await fetch('/api/patients/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          patientIds: selectedIds
        })
      })

      if (response.ok) {
        const result = await response.json()
        onAction(action, selectedIds)
        onClearSelection()
        
        // Success feedback
        alert(`${selectedIds.length} hasta ${action} işlemi başarıyla tamamlandı`)
      } else {
        throw new Error('Bulk action failed')
      }
    } catch (error) {
      console.error('Bulk action error:', error)
      alert('İşlem başarısız oldu')
    } finally {
      setIsLoading(null)
    }
  }

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'activate':
        return 'Aktif Et'
      case 'discharge':
        return 'Taburcu Et'
      case 'set_consultation':
        return 'Konsültasyona Gönder'
      default:
        return action
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'activate':
        return 'bg-green-600 hover:bg-green-700'
      case 'discharge':
        return 'bg-gray-600 hover:bg-gray-700'
      case 'set_consultation':
        return 'bg-yellow-600 hover:bg-yellow-700'
      default:
        return 'bg-blue-600 hover:bg-blue-700'
    }
  }

  if (selectedIds.length === 0) {
    return null
  }

  return (
    <div className="bg-blue-50 border border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-blue-600" />
          <span className="font-medium text-blue-900">
            {selectedIds.length} hasta seçildi
          </span>
        </div>
        
        <button
          onClick={onClearSelection}
          className="text-blue-600 hover:text-blue-800"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => handleBulkAction('activate')}
          disabled={isLoading !== null}
          className={`px-4 py-2 text-white rounded-lg transition-colors ${
            isLoading === 'activate' 
              ? 'bg-green-400 cursor-wait' 
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isLoading === 'activate' ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              İşleniyor...
            </div>
          ) : (
            <>
              <Users className="h-4 w-4" />
              Aktif Et
            </>
          )}
        </button>

        <button
          onClick={() => handleBulkAction('set_consultation')}
          disabled={isLoading !== null}
          className={`px-4 py-2 text-white rounded-lg transition-colors ${
            isLoading === 'set_consultation' 
              ? 'bg-yellow-400 cursor-wait' 
              : 'bg-yellow-600 hover:bg-yellow-700'
          }`}
        >
          {isLoading === 'set_consultation' ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              İşleniyor...
            </div>
          ) : (
            <>
              <Users className="h-4 w-4" />
              Konsültasyona Gönder
            </>
          )}
        </button>

        <button
          onClick={() => handleBulkAction('discharge')}
          disabled={isLoading !== null}
          className={`px-4 py-2 text-white rounded-lg transition-colors ${
            isLoading === 'discharge' 
              ? 'bg-gray-400 cursor-wait' 
              : 'bg-gray-600 hover:bg-gray-700'
          }`}
        >
          {isLoading === 'discharge' ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              İşleniyor...
            </div>
          ) : (
            <>
              <Trash2 className="h-4 w-4" />
              Taburcu Et
            </>
          )}
        </button>
      </div>
    </div>
  )
}