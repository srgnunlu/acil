'use client'

import { useEffect } from 'react'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { PresenceIndicator } from '@/components/realtime/PresenceIndicator'
import { useRealtimePatients } from '@/lib/hooks/useRealtimePatients'
import { useRealtimeContext } from '@/contexts/RealtimeContext'
import { useQueryClient } from '@tanstack/react-query'

interface PatientRealtimeProps {
  patientId: string
}

export function PatientRealtime({ patientId }: PatientRealtimeProps) {
  const { currentWorkspace } = useWorkspace()
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()
  const queryClient = useQueryClient()

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

  // Real-time patient updates
  useRealtimePatients({
    workspaceId: currentWorkspace?.id || '',
    enabled: !!currentWorkspace && !!patientId,
    onUpdate: (patient) => {
      if (patient.id === patientId) {
        // Patient data değişti, yenile
        queryClient.invalidateQueries({ queryKey: ['patient', patientId] })
      }
    },
  })

  // Presence tracking - use context instead of hook
  const { updatePresence, status } = useRealtimeContext()

  // Update presence when viewing patient (only when connected)
  useEffect(() => {
    if (!currentWorkspace || !userId || !patientId || status !== 'connected') {
      return
    }

    // Bu hastayı görüntülediğimizi bildir
    updatePresence({ viewing_patient_id: patientId }).catch((err) => {
      // Silently fail if channel not ready
      console.warn('[PatientRealtime] Failed to update presence:', err)
    })

    return () => {
      // Sayfadan çıkarken temizle
      if (status === 'connected') {
        updatePresence({ viewing_patient_id: null }).catch(() => {
          // Ignore cleanup errors
        })
      }
    }
  }, [patientId, currentWorkspace, userId, updatePresence, status])

  if (!currentWorkspace || !userId) {
    return null
  }

  return <PresenceIndicator patientId={patientId} className="mt-2" />
}
