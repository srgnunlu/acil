'use client'

import { Star, Eye, Clock } from 'lucide-react'
import Link from 'next/link'
import { useAddFavorite, useRemoveFavorite } from '@/lib/hooks/useProtocols'
import type { ProtocolWithStats } from '@/types/protocol.types'
import { useState } from 'react'

interface ProtocolCardProps {
  protocol: ProtocolWithStats
  workspaceId: string
}

export default function ProtocolCard({ protocol, workspaceId }: ProtocolCardProps) {
  const [isFavorited, setIsFavorited] = useState(protocol.is_favorited)
  const addFavorite = useAddFavorite()
  const removeFavorite = useRemoveFavorite()

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const previousState = isFavorited
    setIsFavorited(!isFavorited)

    try {
      if (isFavorited) {
        await removeFavorite.mutateAsync({ protocolId: protocol.id, workspaceId })
      } else {
        await addFavorite.mutateAsync({ protocolId: protocol.id, workspaceId })
      }
    } catch (error) {
      // Revert on error
      setIsFavorited(previousState)
      console.error('Failed to toggle favorite:', error)
    }
  }

  return (
    <Link href={`/dashboard/guidelines/protocols/${(protocol as any).id}`}>
      <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 cursor-pointer group">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            {(protocol as any).category && (
              <div
                className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium mb-2"
                style={{
                  backgroundColor: `${(protocol as any).category.color}20`,
                  color: (protocol as any).category.color,
                }}
              >
                <span>{(protocol as any).category.icon}</span>
                <span>{(protocol as any).category.name}</span>
              </div>
            )}
            <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
              {(protocol as any).title}
            </h3>
          </div>

          {/* Favorite Button */}
          <button
            onClick={handleToggleFavorite}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={addFavorite.isPending || removeFavorite.isPending}
          >
            <Star
              className={`h-5 w-5 transition-colors ${
                isFavorited ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400 hover:text-yellow-400'
              }`}
            />
          </button>
        </div>

        {/* Description */}
        {(protocol as any).description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-4">{(protocol as any).description}</p>
        )}

        {/* Tags */}
        {(protocol as any).tags && (protocol as any).tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {(protocol as any).tags.slice(0, 3).map((tag: any) => (
              <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                #{tag}
              </span>
            ))}
            {(protocol as any).tags.length > 3 && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                +{(protocol as any).tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-500 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>{(protocol as any).view_count}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4" />
            <span>{(protocol as any).favorite_count}</span>
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <Clock className="h-4 w-4" />
            <span>{new Date((protocol as any).updated_at).toLocaleDateString('tr-TR')}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
