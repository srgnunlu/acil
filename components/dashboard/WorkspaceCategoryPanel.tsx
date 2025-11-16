'use client'

import { CategoryList } from '@/components/workspace/CategoryList'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { Card } from '@/components/ui/card'
import { Layers } from 'lucide-react'

export function WorkspaceCategoryPanel() {
  const { currentWorkspace, isLoading } = useWorkspace()

  if (isLoading || !currentWorkspace) {
    return null
  }

  return (
    <Card
      variant="default"
      header={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">Hasta Kategorileri</h2>
          </div>
          <span className="text-sm text-gray-500">{currentWorkspace.name}</span>
        </div>
      }
    >
      <CategoryList />
    </Card>
  )
}
