'use client'

import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Edit, Eye, Trash2, Settings } from 'lucide-react'
import Link from 'next/link'

interface Organization {
  id: string
  name: string
  slug: string
  type: string | null
  subscription_tier: string
  subscription_status: string
  max_users: number
  max_workspaces: number
  created_at: string
  workspaces?: any[]
}

interface AdminOrganizationsTableProps {
  organizations: Organization[]
}

export function AdminOrganizationsTable({ organizations }: AdminOrganizationsTableProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Table Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Organizasyonlar ({organizations.length})
        </h3>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Organizasyon
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tip
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Workspace
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Limitler
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Abonelik
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Durum
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Oluşturulma
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {organizations.map((org) => (
              <tr key={org.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{org.name}</p>
                    <p className="text-xs text-gray-500">{org.slug}</p>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm text-gray-900 capitalize">
                    {org.type?.replace('_', ' ') || '-'}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm text-gray-900">
                    {org.workspaces?.[0]?.count || 0}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="text-xs text-gray-600">
                    <div>Kullanıcı: {org.max_users}</div>
                    <div>Workspace: {org.max_workspaces}</div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      org.subscription_tier === 'enterprise'
                        ? 'bg-purple-100 text-purple-800'
                        : org.subscription_tier === 'pro'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {org.subscription_tier === 'enterprise'
                      ? 'Enterprise'
                      : org.subscription_tier === 'pro'
                        ? 'Pro'
                        : 'Free'}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      org.subscription_status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : org.subscription_status === 'trial'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {org.subscription_status === 'active'
                      ? 'Aktif'
                      : org.subscription_status === 'trial'
                        ? 'Deneme'
                        : 'İnaktif'}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm text-gray-600">
                    {formatDistanceToNow(new Date(org.created_at), {
                      addSuffix: true,
                      locale: tr,
                    })}
                  </span>
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Görüntüle"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Ayarlar"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <button
                      className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Düzenle"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      className="p-1 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
