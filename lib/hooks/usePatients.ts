import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Patient } from '@/types'

/**
 * Fetch all patients for the current user
 */
export function usePatients() {
  return useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Patient[]
    },
  })
}

/**
 * Fetch a single patient by ID
 */
export function usePatient(patientId: string | null) {
  return useQuery({
    queryKey: ['patient', patientId],
    queryFn: async () => {
      if (!patientId) return null

      const supabase = createClient()
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single()

      if (error) throw error
      return data as Patient
    },
    enabled: !!patientId,
  })
}

/**
 * Create a new patient
 */
export function useCreatePatient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newPatient: Omit<Patient, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('patients')
        .insert(newPatient)
        .select()
        .single()

      if (error) throw error
      return data as Patient
    },
    onSuccess: () => {
      // Invalidate and refetch patients list
      queryClient.invalidateQueries({ queryKey: ['patients'] })
    },
  })
}

/**
 * Update a patient
 */
export function useUpdatePatient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<Patient>
    }) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('patients')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Patient
    },
    onSuccess: (_, variables) => {
      // Invalidate both the list and the specific patient
      queryClient.invalidateQueries({ queryKey: ['patients'] })
      queryClient.invalidateQueries({ queryKey: ['patient', variables.id] })
    },
  })
}

/**
 * Delete a patient (soft delete)
 */
export function useDeletePatient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (patientId: string) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('patients')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', patientId)

      if (error) throw error
    },
    onSuccess: () => {
      // Invalidate patients list
      queryClient.invalidateQueries({ queryKey: ['patients'] })
    },
  })
}
