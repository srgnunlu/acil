'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, Loader2 } from 'lucide-react'
import { AdminLoadingState, AdminEmptyState } from '@/components/admin/common'

export default function AdminSearchPage() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{
    users: unknown[]
    organizations: unknown[]
    workspaces: unknown[]
    patients: unknown[]
  }>({
    users: [],
    organizations: [],
    workspaces: [],
    patients: [],
  })

  useEffect(() => {
    if (query) {
      performSearch(query)
    }
  }, [query])

  const performSearch = async (searchQuery: string) => {
    setLoading(true)
    try {
      // Search across all entities
      const [usersRes, orgsRes, workspacesRes, patientsRes] = await Promise.all([
        fetch(`/api/admin/users?search=${encodeURIComponent(searchQuery)}`).catch(() => null),
        fetch(`/api/admin/organizations?search=${encodeURIComponent(searchQuery)}`).catch(() => null),
        fetch(`/api/admin/workspaces?search=${encodeURIComponent(searchQuery)}`).catch(() => null),
        fetch(`/api/admin/patients?search=${encodeURIComponent(searchQuery)}`).catch(() => null),
      ])

      const users = usersRes?.ok ? await usersRes.json() : { users: [] }
      const orgs = orgsRes?.ok ? await orgsRes.json() : { organizations: [] }
      const workspaces = workspacesRes?.ok ? await workspacesRes.json() : { workspaces: [] }
      const patients = patientsRes?.ok ? await patientsRes.json() : { patients: [] }

      setResults({
        users: users.users || [],
        organizations: orgs.organizations || [],
        workspaces: workspaces.workspaces || [],
        patients: patients.patients || [],
      })
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <AdminLoadingState message="Aranıyor..." />
  }

  const totalResults =
    results.users.length +
    results.organizations.length +
    results.workspaces.length +
    results.patients.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Arama Sonuçları</h1>
        <p className="mt-2 text-gray-600">
          &quot;{query}&quot; için {totalResults} sonuç bulundu
        </p>
      </div>

      {totalResults === 0 ? (
        <AdminEmptyState
          title="Sonuç bulunamadı"
          description={`"${query}" için herhangi bir sonuç bulunamadı.`}
        />
      ) : (
        <div className="space-y-6">
          {/* Users */}
          {results.users.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Kullanıcılar ({results.users.length})
              </h2>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Kullanıcı
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Email
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {results.users.map((user: any) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {user.full_name || user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.email}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Organizations */}
          {results.organizations.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Organizasyonlar ({results.organizations.length})
              </h2>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Organizasyon
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Tip
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {results.organizations.map((org: any) => (
                      <tr key={org.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {org.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{org.type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Workspaces */}
          {results.workspaces.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Workspace&apos;ler ({results.workspaces.length})
              </h2>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Workspace
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Durum
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {results.workspaces.map((workspace: any) => (
                      <tr key={workspace.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {workspace.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              workspace.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {workspace.is_active ? 'Aktif' : 'Pasif'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Patients */}
          {results.patients.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Hastalar ({results.patients.length})
              </h2>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Hasta
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Durum
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {results.patients.map((patient: any) => (
                      <tr key={patient.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {patient.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {patient.workflow_state || 'admission'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

