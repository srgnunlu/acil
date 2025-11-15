'use client'

/**
 * NotificationBell Component
 * Phase 6: Wrapper for NotificationCenter
 * 
 * This component wraps NotificationCenter and gets userId from client-side
 */

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { NotificationCenter } from '@/components/notifications/NotificationCenter'

export function NotificationBell() {
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    async function getUserId() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    getUserId()
  }, [])

  if (!userId) {
    // Show placeholder bell while loading
    return (
      <div className="relative p-2 text-gray-400">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
      </div>
    )
  }

  return <NotificationCenter userId={userId} enabled={true} />
}
