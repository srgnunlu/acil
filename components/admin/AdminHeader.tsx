'use client'

import { User } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'
import { Bell, Search, Settings, LogOut } from 'lucide-react'
import { logout } from '@/app/(auth)/actions'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AdminHeaderProps {
  user: User
  profile: Profile | null
}

export function AdminHeader({ user, profile }: AdminHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Search Bar */}
          <div className="flex-1 max-w-2xl">
            <form
              action="/dashboard/admin/search"
              method="get"
              className="relative"
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const query = formData.get('q') as string
                if (query) {
                  window.location.href = `/dashboard/admin/search?q=${encodeURIComponent(query)}`
                }
              }}
            >
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="q"
                placeholder="Ara... (kullanıcı, hasta, organizasyon)"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </form>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Settings */}
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
            </button>

            {/* User Info */}
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{profile?.full_name || 'Admin'}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-semibold">
                {(profile?.full_name || user.email || 'A')[0].toUpperCase()}
              </div>
            </div>

            {/* Logout */}
            <form action={logout}>
              <button
                type="submit"
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Çıkış Yap"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  )
}
