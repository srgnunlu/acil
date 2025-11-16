'use client'

import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { MoreVertical, Edit, Trash2, Shield, Eye } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

interface User {
  id: string
  user_id: string
  full_name: string | null
  specialty: string | null
  subscription_tier: string
  last_seen_at: string | null
  created_at: string
  workspace_members?: any[]
}

interface AdminUsersTableProps {
  users: User[]
  total: number
  currentPage: number
}

export function AdminUsersTable({ users, total, currentPage }: AdminUsersTableProps) {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])

  const toggleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(users.map((u) => u.id))
    }
  }

  const toggleSelectUser = (id: string) => {
    if (selectedUsers.includes(id)) {
      setSelectedUsers(selectedUsers.filter((uid) => uid !== id))
    } else {
      setSelectedUsers([...selectedUsers, id])
    }
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Table Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Kullanıcılar ({total})
          </h3>
          {selectedUsers.length > 0 && (
            <span className="text-sm text-gray-600">
              {selectedUsers.length} seçildi
            </span>
          )}
        </div>
        {selectedUsers.length > 0 && (
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              Seçilenleri Sil
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedUsers.length === users.length && users.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kullanıcı
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Uzmanlık
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Workspace'ler
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Son Görülme
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kayıt Tarihi
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Abonelik
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => toggleSelectUser(user.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {(user.full_name || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {user.full_name || 'İsimsiz Kullanıcı'}
                      </p>
                      <p className="text-xs text-gray-500">{user.user_id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm text-gray-900">{user.specialty || '-'}</span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm text-gray-900">
                    {user.workspace_members?.length || 0}
                  </span>
                </td>
                <td className="px-4 py-4">
                  {user.last_seen_at ? (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">
                        {formatDistanceToNow(new Date(user.last_seen_at), {
                          addSuffix: true,
                          locale: tr,
                        })}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">Hiç</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm text-gray-600">
                    {new Date(user.created_at).toLocaleDateString('tr-TR')}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.subscription_tier === 'pro'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {user.subscription_tier === 'pro' ? 'Pro' : 'Free'}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Sayfa {currentPage} / {totalPages}
          </div>
          <div className="flex gap-2">
            <Link
              href={`/dashboard/admin/users?page=${currentPage - 1}`}
              className={`px-3 py-1 border border-gray-300 rounded-lg ${
                currentPage === 1
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-gray-50'
              }`}
            >
              Önceki
            </Link>
            <Link
              href={`/dashboard/admin/users?page=${currentPage + 1}`}
              className={`px-3 py-1 border border-gray-300 rounded-lg ${
                currentPage === totalPages
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-gray-50'
              }`}
            >
              Sonraki
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
