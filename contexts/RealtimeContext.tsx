'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRealtimePresence, type PresenceState } from '@/lib/hooks/useRealtimePresence'
import type { ConnectionStatus } from '@/types/realtime.types'

interface RealtimeContextValue {
  status: ConnectionStatus
  userId: string | null
  workspaceId: string | null
  onlineUsers: PresenceState[]
  presenceState: Map<string, PresenceState>
  updatePresence: (
    updates: Partial<Pick<PresenceState, 'status' | 'viewing_patient_id'>>
  ) => Promise<void>
  getUsersViewingPatient: (patientId: string) => PresenceState[]
  error: Error | null
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null)

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { currentWorkspace } = useWorkspace()
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()

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

  // Single instance of presence hook for the entire app
  const { status, onlineUsers, presenceState, updatePresence, getUsersViewingPatient, error } =
    useRealtimePresence({
      workspaceId: currentWorkspace?.id || '',
      userId: userId || '',
      enabled: !!currentWorkspace && !!userId,
    })

  return (
    <RealtimeContext.Provider
      value={{
        status,
        userId,
        workspaceId: currentWorkspace?.id || null,
        onlineUsers,
        presenceState,
        updatePresence,
        getUsersViewingPatient,
        error,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  )
}

export function useRealtimeContext() {
  const context = useContext(RealtimeContext)
  if (!context) {
    throw new Error('useRealtimeContext must be used within RealtimeProvider')
  }
  return context
}
