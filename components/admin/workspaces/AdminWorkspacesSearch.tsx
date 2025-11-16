'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { AdminSearchBar } from '../common'

interface AdminWorkspacesSearchProps {
  initialSearch?: string
}

export function AdminWorkspacesSearch({ initialSearch }: AdminWorkspacesSearchProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSearch = (query: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (query) {
      params.set('search', query)
    } else {
      params.delete('search')
    }
    params.set('page', '1')
    router.push(`/dashboard/admin/workspaces?${params.toString()}`)
  }

  const handleClear = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('search')
    params.set('page', '1')
    router.push(`/dashboard/admin/workspaces?${params.toString()}`)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <AdminSearchBar
        placeholder="Workspace ara..."
        value={initialSearch}
        onSearch={handleSearch}
        onClear={handleClear}
      />
    </div>
  )
}

