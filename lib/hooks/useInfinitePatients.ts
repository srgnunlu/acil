import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/queries/query-keys'
import type { Patient } from '@/types'

interface PatientsResponse {
  patients: Patient[]
  nextPage: number | null
  hasMore: boolean
}

interface FetchPatientsParams {
  page: number
  limit?: number
  status?: string
  search?: string
}

/**
 * Infinite scroll için hasta listesi hook'u
 */
export function useInfinitePatients(params: Omit<FetchPatientsParams, 'page'> = {}) {
  const queryClient = useQueryClient()

  return useInfiniteQuery<PatientsResponse, Error>({
    queryKey: [...queryKeys.patients.infinite(), params],
    queryFn: async ({ pageParam = 0 }) => {
      return fetchPatients({ ...params, page: pageParam as number })
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    staleTime: 2 * 60 * 1000, // 2 dakika
    gcTime: 10 * 60 * 1000, // 10 dakika
    refetchOnWindowFocus: false,
  })
}

/**
 * API'den hastaları çeken fonksiyon
 */
async function fetchPatients({
  page,
  limit = 20,
  status,
  search
}: FetchPatientsParams): Promise<PatientsResponse> {
  const supabase = createClient()
  const offset = page * limit

  let query = supabase
    .from('patients')
    .select('*', { count: 'exact' })
    .eq('deleted_at', null) // Soft delete'i dikkate alma
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  // Status filtresi
  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  // Arama filtresi
  if (search) {
    query = query.or(`name.ilike.%${search}%,notes.ilike.%${search}%`)
  }

  const { data: patients, error, count } = await query

  if (error) throw error

  const totalItems = count || 0
  const hasMore = offset + limit < totalItems
  const nextPage = hasMore ? page + 1 : null

  return {
    patients: patients || [],
    nextPage,
    hasMore,
  }
}

/**
 * Prefetch fonksiyonu - sonraki sayfayı önceden yükle
 */
export function usePrefetchNextPage() {
  const queryClient = useQueryClient()

  return (params: Omit<FetchPatientsParams, 'page'>, currentPage: number) => {
    queryClient.prefetchInfiniteQuery({
      queryKey: [...queryKeys.patients.infinite(), params],
      queryFn: ({ pageParam = currentPage + 1 }) =>
        fetchPatients({ ...params, page: pageParam as number }),
      staleTime: 30 * 1000, // 30 saniye
      initialPageParam: currentPage + 1,
    })
  }
}

/**
 * Manual refresh fonksiyonu
 */
export function useRefreshPatients() {
  const queryClient = useQueryClient()

  return (params: Omit<FetchPatientsParams, 'page'> = {}) => {
    queryClient.invalidateQueries({ queryKey: [...queryKeys.patients.infinite(), params] })
  }
}

/**
 * Optimistic update için yardımcı fonksiyonlar
 */
export function usePatientOptimisticUpdates() {
  const queryClient = useQueryClient()

  const addPatient = (newPatient: Patient) => {
    queryClient.setQueryData(
      [...queryKeys.patients.infinite(), {}],
      (oldData: any) => {
        if (!oldData) return oldData

        return {
          ...oldData,
          pages: [
            {
              ...oldData.pages[0],
              patients: [newPatient, ...oldData.pages[0].patients],
            },
            ...oldData.pages.slice(1),
          ],
        }
      }
    )
  }

  const updatePatient = (patientId: string, updates: Partial<Patient>) => {
    queryClient.setQueriesData(
      { queryKey: queryKeys.patients.infinite() },
      (oldData: any) => {
        if (!oldData) return oldData

        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            patients: page.patients.map((patient: Patient) =>
              patient.id === patientId ? { ...patient, ...updates } : patient
            ),
          })),
        }
      }
    )
  }

  const removePatient = (patientId: string) => {
    queryClient.setQueriesData(
      { queryKey: queryKeys.patients.infinite() },
      (oldData: any) => {
        if (!oldData) return oldData

        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            patients: page.patients.filter((patient: Patient) => patient.id !== patientId),
          })),
        }
      }
    )
  }

  return { addPatient, updatePatient, removePatient }
}