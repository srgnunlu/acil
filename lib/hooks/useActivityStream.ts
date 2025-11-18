'use client'

import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export type ActivityType =
  | 'patient_created'
  | 'patient_updated'
  | 'ai_analysis_completed'
  | 'test_added'
  | 'note_created'
  | 'mention'
  | 'reminder_created'
  | 'assignment_changed'
  | 'category_changed'

export interface Activity {
  id: string
  type: ActivityType
  userId: string
  userName?: string
  patientId?: string
  patientName?: string
  message: string
  metadata?: Record<string, any>
  createdAt: string
}

interface UseActivityStreamOptions {
  workspaceId: string | null
  limit?: number
  enabled?: boolean
  types?: ActivityType[]
}

/**
 * Real-time activity stream hook
 */
export function useActivityStream({
  workspaceId,
  limit = 50,
  enabled = true,
  types,
}: UseActivityStreamOptions) {
  const queryClient = useQueryClient()
  const supabase = createClient()
  const [activities, setActivities] = useState<Activity[]>([])

  // Fetch initial activities
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['activities', workspaceId, types],
    queryFn: async () => {
      if (!workspaceId) return []

      // Since we don't have an activity_logs table yet, we'll mock this
      // In production, this would query the activity_logs table
      const mockActivities: Activity[] = []

      return mockActivities
    },
    enabled: enabled && !!workspaceId,
    staleTime: 1000 * 60, // 1 minute
  })

  // Real-time subscriptions for activity updates
  useEffect(() => {
    if (!enabled || !workspaceId) return

    const addActivity = (activity: Activity) => {
      setActivities((prev) => {
        // Add new activity and keep only latest 'limit' items
        const updated = [activity, ...prev].slice(0, limit)
        return updated
      })
    }

    // Subscribe to patients table changes
    const patientsChannel = supabase
      .channel(`patients:${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'patients',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          addActivity({
            id: crypto.randomUUID(),
            type: 'patient_created',
            userId: payload.new.user_id,
            patientId: payload.new.id,
            patientName: payload.new.name,
            message: `Yeni hasta eklendi: ${payload.new.name}`,
            createdAt: new Date().toISOString(),
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'patients',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          addActivity({
            id: crypto.randomUUID(),
            type: 'patient_updated',
            userId: payload.new.user_id,
            patientId: payload.new.id,
            patientName: payload.new.name,
            message: `Hasta güncellendi: ${payload.new.name}`,
            createdAt: new Date().toISOString(),
          })
        }
      )
      .subscribe()

    // Subscribe to AI analyses
    const aiChannel = supabase
      .channel(`ai_analyses:${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_analyses',
        },
        async (payload) => {
          // Fetch patient name
          const { data: patient } = await supabase
            .from('patients')
            .select('name')
            .eq('id', payload.new.patient_id)
            .single()

          addActivity({
            id: crypto.randomUUID(),
            type: 'ai_analysis_completed',
            userId: payload.new.user_id || 'system',
            patientId: payload.new.patient_id,
            patientName: patient?.name,
            message: `AI analizi tamamlandı${patient ? `: ${patient.name}` : ''}`,
            createdAt: new Date().toISOString(),
          })
        }
      )
      .subscribe()

    // Subscribe to tests
    const testsChannel = supabase
      .channel(`tests:${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tests',
        },
        async (payload) => {
          const { data: patient } = await supabase
            .from('patients')
            .select('name')
            .eq('id', payload.new.patient_id)
            .single()

          addActivity({
            id: crypto.randomUUID(),
            type: 'test_added',
            userId: payload.new.created_by || 'system',
            patientId: payload.new.patient_id,
            patientName: patient?.name,
            message: `Yeni test eklendi${patient ? `: ${patient.name}` : ''}`,
            metadata: { testType: payload.new.test_type },
            createdAt: new Date().toISOString(),
          })
        }
      )
      .subscribe()

    // Subscribe to sticky notes
    const notesChannel = supabase
      .channel(`sticky_notes:${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sticky_notes',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        async (payload) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', payload.new.created_by)
            .single()

          const patientName = payload.new.patient_id
            ? (
                await supabase
                  .from('patients')
                  .select('name')
                  .eq('id', payload.new.patient_id)
                  .single()
              ).data?.name
            : null

          addActivity({
            id: crypto.randomUUID(),
            type: 'note_created',
            userId: payload.new.created_by,
            userName: profile?.full_name,
            patientId: payload.new.patient_id,
            patientName,
            message: `${profile?.full_name || 'Kullanıcı'} not ekledi${patientName ? `: ${patientName}` : ''}`,
            createdAt: new Date().toISOString(),
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(patientsChannel)
      supabase.removeChannel(aiChannel)
      supabase.removeChannel(testsChannel)
      supabase.removeChannel(notesChannel)
    }
  }, [enabled, workspaceId, limit, supabase])

  // Merge fetched data with real-time activities
  useEffect(() => {
    if (data) {
      setActivities((prev) => {
        // Merge without duplicates
        const merged = [...prev]
        data.forEach((item) => {
          if (!merged.find((a) => a.id === item.id)) {
            merged.push(item)
          }
        })
        return merged.slice(0, limit)
      })
    }
  }, [data, limit])

  return {
    activities,
    isLoading,
    error,
    refetch,
  }
}

/**
 * Get activity icon
 */
export function getActivityIcon(type: ActivityType): string {
  const icons: Record<ActivityType, string> = {
    patient_created: '👤',
    patient_updated: '✏️',
    ai_analysis_completed: '🤖',
    test_added: '🧪',
    note_created: '📝',
    mention: '💬',
    reminder_created: '⏰',
    assignment_changed: '👨‍⚕️',
    category_changed: '📊',
  }
  return icons[type] || '•'
}

/**
 * Get activity color
 */
export function getActivityColor(type: ActivityType): string {
  const colors: Record<ActivityType, string> = {
    patient_created: 'blue',
    patient_updated: 'gray',
    ai_analysis_completed: 'purple',
    test_added: 'green',
    note_created: 'amber',
    mention: 'pink',
    reminder_created: 'indigo',
    assignment_changed: 'cyan',
    category_changed: 'teal',
  }
  return colors[type] || 'gray'
}
