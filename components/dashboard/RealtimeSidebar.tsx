'use client'

import { useWorkspace } from '@/contexts/WorkspaceContext'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState, useRef } from 'react'
import { OnlineUsersList } from '@/components/realtime/OnlineUsersList'
import { ActivityFeed } from '@/components/realtime/ActivityFeed'
import { RealtimeStatusIndicator } from '@/components/realtime/RealtimeStatusIndicator'
import { useRealtimeContext } from '@/contexts/RealtimeContext'
import type { ConnectionStatus } from '@/types/realtime.types'
import { Users, Activity, X } from 'lucide-react'

interface RealtimeSidebarProps {
  isOpen: boolean
  onClose: () => void
}

type TabType = 'users' | 'activity'

export function RealtimeSidebar({ isOpen, onClose }: RealtimeSidebarProps) {
  const { currentWorkspace } = useWorkspace()
  const [userId, setUserId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('users')
  const drawerRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const { status, onlineUsers } = useRealtimeContext()

  // Get current user ID
  useEffect(() => {
    async function getUserId() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    getUserId()
  }, [supabase])

  // Handle clicks outside drawer
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    // Add small delay to prevent immediate closing
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  if (!currentWorkspace || !userId) {
    return null
  }

  return (
    <>
      {/* Overlay - visual only, no click handler */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/10 z-[100] transition-opacity animate-in fade-in duration-200 pointer-events-none" />
      )}

      {/* Drawer - always render for smooth animation */}
      <div
        ref={drawerRef}
        className={`
          fixed top-24 right-6 bottom-6
          w-64 max-w-[80vw] bg-white border border-gray-200 rounded-2xl
          shadow-2xl
          z-[101]
          transform transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95 pointer-events-none'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Compact Header */}
          <div className="flex-shrink-0 border-b border-gray-200 bg-white">
            {/* Top bar with status and close */}
            <div className="flex items-center justify-between px-3 py-2.5">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gray-50">
                  <RealtimeStatusIndicator status={status as ConnectionStatus} showLabel={false} />
                  <span className="text-[11px] font-medium text-gray-700">Canlı Durum</span>
                </div>
                {status === 'connected' && onlineUsers.length > 0 && (
                  <span className="text-[10px] text-gray-500">{onlineUsers.length} çevrimiçi</span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                aria-label="Kapat"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-t border-gray-100">
              <button
                type="button"
                onClick={() => setActiveTab('users')}
                className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-medium transition-colors ${
                  activeTab === 'users'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Kullanıcılar</span>
                {onlineUsers.length > 0 && (
                  <span
                    className={`px-1 py-0.5 rounded-full text-[9px] font-semibold ${
                      activeTab === 'users'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {onlineUsers.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('activity')}
                className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-medium transition-colors ${
                  activeTab === 'activity'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Aktiviteler</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'users' ? (
              <div className="p-2.5">
                <OnlineUsersList />
              </div>
            ) : (
              <div className="p-2.5">
                <ActivityFeed workspaceId={currentWorkspace.id} limit={30} />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// Floating button component
export function RealtimeSidebarToggle() {
  const [isOpen, setIsOpen] = useState(false)

  // Get context values - component must be inside RealtimeProvider
  const context = useRealtimeContext()
  const onlineUsers = context?.onlineUsers || []
  const status = context?.status || 'disconnected'
  const onlineCount = onlineUsers.length

  // Handle ESC key to close drawer
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      window.addEventListener('keydown', handleEscape)
    }

    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  return (
    <>
      {/* Floating Button - always show when drawer is closed */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[9999] bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-full p-4 shadow-2xl hover:shadow-2xl transition-all duration-200 flex items-center justify-center group relative"
          aria-label="Canlı durumu aç"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            width: '56px',
            height: '56px',
            minWidth: '56px',
            minHeight: '56px',
          }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>

          {/* Online users badge */}
          {onlineCount > 0 && (
            <span
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center border-2 border-white shadow-md"
              style={{ zIndex: 10000 }}
            >
              {onlineCount}
            </span>
          )}

          {/* Pulse animation - only when connected */}
          {status === 'connected' && (
            <span className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-20" />
          )}
        </button>
      )}

      {/* Sidebar */}
      <RealtimeSidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
