'use client'

import { useWorkspace } from '@/contexts/WorkspaceContext'
import ProtocolList from '@/components/protocols/ProtocolList'
import { Card } from '@/components/ui/card'
import { BookOpen, AlertCircle } from 'lucide-react'

export default function ProtocolsPage() {
  const { currentWorkspace, isLoading } = useWorkspace()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-64 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
              <div className="h-4 bg-gray-200 rounded w-full mb-2" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!currentWorkspace) {
    return (
      <Card className="p-8 text-center">
        <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Workspace Seçilmedi
        </h2>
        <p className="text-gray-600">
          Protokol kütüphanesine erişmek için önce bir workspace seçmeniz gerekiyor.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BookOpen className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Protokol Kütüphanesi</h1>
          <p className="text-gray-600 mt-1">
            Klinik protokoller, kılavuzlar ve algoritmalar
          </p>
        </div>
      </div>

      <ProtocolList workspaceId={currentWorkspace.id} />
    </div>
  )
}

