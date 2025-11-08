/**
 * Query Keys for React Query
 * Tüm query key'leri merkezi olarak yönetir
 */

export const queryKeys = {
  // Patient queries
  patients: {
    all: ['patients'] as const,
    lists: () => [...queryKeys.patients.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.patients.lists(), { filters }] as const,
    details: () => [...queryKeys.patients.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.patients.details(), id] as const,
    infinite: () => [...queryKeys.patients.all, 'infinite'] as const,
  },

  // Patient data queries
  patientData: {
    all: (patientId: string) => ['patientData', patientId] as const,
    byType: (patientId: string, type: string) => 
      [...queryKeys.patientData.all(patientId), { type }] as const,
  },

  // Patient tests queries
  patientTests: {
    all: (patientId: string) => ['patientTests', patientId] as const,
    byType: (patientId: string, type: string) => 
      [...queryKeys.patientTests.all(patientId), { type }] as const,
  },

  // AI analyses queries
  patientAnalyses: {
    all: (patientId: string) => ['patientAnalyses', patientId] as const,
    latest: (patientId: string) => [...queryKeys.patientAnalyses.all(patientId), 'latest'] as const,
  },

  // Statistics queries
  statistics: {
    all: ['statistics'] as const,
    user: (userId: string) => [...queryKeys.statistics.all, userId] as const,
    analytics: (userId: string) => [...queryKeys.statistics.user(userId), 'analytics'] as const,
  },

  // Reminders queries
  reminders: {
    all: ['reminders'] as const,
    user: (userId: string) => [...queryKeys.reminders.all, userId] as const,
    pending: (userId: string) => [...queryKeys.reminders.user(userId), 'pending'] as const,
  },

  // Chat queries
  chat: {
    all: (patientId: string) => ['chat', patientId] as const,
    messages: (patientId: string) => [...queryKeys.chat.all(patientId), 'messages'] as const,
  },

  // Cache invalidation helpers
  invalidateAll: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.patients.all })
    queryClient.invalidateQueries({ queryKey: queryKeys.statistics.all })
    queryClient.invalidateQueries({ queryKey: queryKeys.reminders.all })
  },

  invalidatePatient: (queryClient: any, patientId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.patients.detail(patientId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.patientData.all(patientId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.patientTests.all(patientId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.patientAnalyses.all(patientId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.chat.all(patientId) })
  },
} as const

// Type helpers
export type QueryKey = typeof queryKeys
export type PatientQueryKey = typeof queryKeys.patients
export type PatientDataQueryKey = typeof queryKeys.patientData