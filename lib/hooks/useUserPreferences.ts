'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { UserDashboardPreferences, DashboardLayout } from '@/types/widget.types'

const STORAGE_KEY = 'acil_user_preferences'

/**
 * User Preferences Hook
 *
 * Manages user dashboard preferences with:
 * - localStorage for fast access
 * - Supabase for cross-device sync
 * - Optimistic updates
 */
export function useUserPreferences(userId: string | null, workspaceId: string | null) {
  const queryClient = useQueryClient()
  const supabase = createClient()
  const [localPrefs, setLocalPrefs] = useState<UserDashboardPreferences | null>(null)

  // Fetch preferences from Supabase
  const {
    data: remotePrefs,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['user-preferences', userId, workspaceId],
    queryFn: async () => {
      if (!userId || !workspaceId) return null

      // Try to fetch from Supabase (future: when we have user_preferences table)
      // For now, use localStorage only
      return null
    },
    enabled: !!userId && !!workspaceId,
  })

  // Load from localStorage on mount
  useEffect(() => {
    if (!userId || !workspaceId) return

    const key = `${STORAGE_KEY}_${userId}_${workspaceId}`
    const stored = localStorage.getItem(key)

    if (stored) {
      try {
        const parsed = JSON.parse(stored) as UserDashboardPreferences
        setLocalPrefs(parsed)
      } catch (error) {
        console.error('Failed to parse preferences:', error)
      }
    } else {
      // Initialize with defaults
      const defaultPrefs: UserDashboardPreferences = {
        userId,
        workspaceId,
        currentLayoutId: 'default',
        layouts: [
          {
            id: 'default',
            name: 'Varsayılan',
            description: 'Standart dashboard görünümü',
            widgets: [],
            isDefault: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        theme: 'system',
        density: 'comfortable',
        autoRefresh: true,
        refreshInterval: 300, // 5 minutes
      }
      setLocalPrefs(defaultPrefs)
      saveToLocalStorage(defaultPrefs, userId, workspaceId)
    }
  }, [userId, workspaceId])

  // Save to localStorage
  const saveToLocalStorage = useCallback(
    (prefs: UserDashboardPreferences, uid: string, wid: string) => {
      const key = `${STORAGE_KEY}_${uid}_${wid}`
      localStorage.setItem(key, JSON.stringify(prefs))
    },
    []
  )

  // Update preferences mutation
  const updatePrefs = useMutation({
    mutationFn: async (updates: Partial<UserDashboardPreferences>) => {
      if (!userId || !workspaceId || !localPrefs) {
        throw new Error('Missing required data')
      }

      const updated: UserDashboardPreferences = {
        ...localPrefs,
        ...updates,
      }

      // Save to localStorage
      saveToLocalStorage(updated, userId, workspaceId)

      // TODO: Save to Supabase for cross-device sync
      // await supabase.from('user_preferences').upsert(updated)

      return updated
    },
    onSuccess: (data) => {
      setLocalPrefs(data)
      queryClient.invalidateQueries({ queryKey: ['user-preferences', userId, workspaceId] })
    },
  })

  // Update current layout
  const setCurrentLayout = useCallback(
    (layoutId: string) => {
      updatePrefs.mutate({ currentLayoutId: layoutId })
    },
    [updatePrefs]
  )

  // Add new layout
  const addLayout = useCallback(
    (layout: DashboardLayout) => {
      if (!localPrefs) return

      const updated: UserDashboardPreferences = {
        ...localPrefs,
        layouts: [...localPrefs.layouts, layout],
        currentLayoutId: layout.id,
      }

      updatePrefs.mutate(updated)
    },
    [localPrefs, updatePrefs]
  )

  // Update layout
  const updateLayout = useCallback(
    (layoutId: string, updates: Partial<DashboardLayout>) => {
      if (!localPrefs) return

      const updated: UserDashboardPreferences = {
        ...localPrefs,
        layouts: localPrefs.layouts.map((l) =>
          l.id === layoutId ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l
        ),
      }

      updatePrefs.mutate(updated)
    },
    [localPrefs, updatePrefs]
  )

  // Delete layout
  const deleteLayout = useCallback(
    (layoutId: string) => {
      if (!localPrefs) return

      // Don't allow deleting the default layout
      const layout = localPrefs.layouts.find((l) => l.id === layoutId)
      if (layout?.isDefault) return

      const updated: UserDashboardPreferences = {
        ...localPrefs,
        layouts: localPrefs.layouts.filter((l) => l.id !== layoutId),
        currentLayoutId:
          localPrefs.currentLayoutId === layoutId ? 'default' : localPrefs.currentLayoutId,
      }

      updatePrefs.mutate(updated)
    },
    [localPrefs, updatePrefs]
  )

  // Get current layout
  const currentLayout = localPrefs?.layouts.find((l) => l.id === localPrefs.currentLayoutId)

  return {
    preferences: localPrefs,
    currentLayout,
    layouts: localPrefs?.layouts || [],
    isLoading,
    error,
    setCurrentLayout,
    addLayout,
    updateLayout,
    deleteLayout,
    updatePreferences: (updates: Partial<UserDashboardPreferences>) =>
      updatePrefs.mutate(updates),
  }
}
