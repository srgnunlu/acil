'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { WorkspaceMembersList } from './WorkspaceMembersList'

interface WorkspaceMembersViewProps {
  workspaceId: string
}

export function WorkspaceMembersView({ workspaceId }: WorkspaceMembersViewProps) {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWorkspace()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId])

  const fetchWorkspace = async () => {
    try {
      await fetch(`/api/workspaces/${workspaceId}`)
    } catch (err) {
      console.error('Error fetching workspace:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Workspace Üyeleri</h2>
        <p className="text-sm text-gray-600">
          Bu workspace&apos;teki üyeleri görüntüleyebilirsiniz. Üye ekleme ve çıkarma işlemleri
          organizasyon ayarlarından yapılır.
        </p>
      </div>
      <WorkspaceMembersList workspaceId={workspaceId} />
    </div>
  )
}
