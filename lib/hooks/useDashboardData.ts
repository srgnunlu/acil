'use client'

import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface DashboardStats {
  activePatients: number
  criticalPatients: number
  avgStayDuration: number
  dischargedPatients: number
  aiAnalysisCount: number
  testCount: number
  todayPatients: number
  totalPatients: number
}

export interface DashboardTrends {
  last7Days: number[]
  aiUsageTrend: number[]
  testTrend: number[]
  admissionTrend: { date: string; count: number }[]
}

export interface DashboardData {
  stats: DashboardStats
  trends: DashboardTrends
  patients: any[]
  alerts: any[]
  recentActivity: any[]
}

/**
 * Real-time dashboard data hook with Supabase Realtime
 */
export function useDashboardData(workspaceId: string | null, options: { enabled?: boolean } = {}) {
  const { enabled = true } = options
  const queryClient = useQueryClient()
  const supabase = createClient()
  const [isConnected, setIsConnected] = useState(true)

  // Fetch dashboard data
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['dashboard', workspaceId],
    queryFn: async () => {
      if (!workspaceId) {
        throw new Error('Workspace ID is required')
      }

      const response = await fetch(`/api/dashboard?workspace_id=${workspaceId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      return response.json() as Promise<DashboardData>
    },
    enabled: enabled && !!workspaceId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  })

  // Real-time subscriptions
  useEffect(() => {
    if (!enabled || !workspaceId) return

    const channel = supabase
      .channel(`dashboard:${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'patients',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          // Invalidate and refetch dashboard data
          queryClient.invalidateQueries({ queryKey: ['dashboard', workspaceId] })
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_analyses',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard', workspaceId] })
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tests',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard', workspaceId] })
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [enabled, workspaceId, queryClient, supabase])

  return {
    data,
    isLoading,
    error,
    refetch,
    isConnected,
  }
}

/**
 * Manual refresh helper
 */
export function useRefreshDashboard(workspaceId: string | null) {
  const queryClient = useQueryClient()

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['dashboard', workspaceId] })
  }

  return { refresh }
}
