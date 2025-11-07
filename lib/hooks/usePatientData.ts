import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { PatientData, PatientTest, AIAnalysis } from '@/types'

/**
 * Fetch all data for a patient
 */
export function usePatientData(patientId: string | null) {
  return useQuery({
    queryKey: ['patientData', patientId],
    queryFn: async () => {
      if (!patientId) return []

      const supabase = createClient()
      const { data, error } = await supabase
        .from('patient_data')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as PatientData[]
    },
    enabled: !!patientId,
  })
}

/**
 * Fetch patient tests
 */
export function usePatientTests(patientId: string | null) {
  return useQuery({
    queryKey: ['patientTests', patientId],
    queryFn: async () => {
      if (!patientId) return []

      const supabase = createClient()
      const { data, error } = await supabase
        .from('patient_tests')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as PatientTest[]
    },
    enabled: !!patientId,
  })
}

/**
 * Fetch AI analyses
 */
export function usePatientAnalyses(patientId: string | null) {
  return useQuery({
    queryKey: ['patientAnalyses', patientId],
    queryFn: async () => {
      if (!patientId) return []

      const supabase = createClient()
      const { data, error } = await supabase
        .from('ai_analyses')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as AIAnalysis[]
    },
    enabled: !!patientId,
  })
}

/**
 * Trigger AI analysis
 */
export function useAIAnalysis() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      patientId,
      analysisType,
    }: {
      patientId: string
      analysisType: 'initial' | 'updated'
    }) => {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, analysisType }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Analysis failed')
      }

      return response.json()
    },
    onSuccess: (_, variables) => {
      // Invalidate analyses for this patient
      queryClient.invalidateQueries({
        queryKey: ['patientAnalyses', variables.patientId],
      })
    },
  })
}

/**
 * Add patient data
 */
export function useAddPatientData() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newData: Omit<PatientData, 'id' | 'created_at'>) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('patient_data')
        .insert(newData)
        .select()
        .single()

      if (error) throw error
      return data as PatientData
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['patientData', data.patient_id],
      })
    },
  })
}

/**
 * Add patient test
 */
export function useAddPatientTest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newTest: Omit<PatientTest, 'id' | 'created_at'>) => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('patient_tests')
        .insert(newTest)
        .select()
        .single()

      if (error) throw error
      return data as PatientTest
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['patientTests', data.patient_id],
      })
    },
  })
}
