import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  CalculatorType,
  ClinicalCalculatorResult,
  ClinicalCalculatorResultCreate,
} from '@/types/calculator.types'

/**
 * Calculate and save a clinical score
 */
export function useCalculateScore() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (calculationData: ClinicalCalculatorResultCreate) => {
      const response = await fetch('/api/calculators', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(calculationData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to calculate score')
      }

      return response.json() as Promise<
        ClinicalCalculatorResult & {
          calculation_details: {
            score: number
            interpretation: string
            risk_category: string
            recommendations: string
          }
        }
      >
    },
    onSuccess: (data) => {
      // Invalidate calculator history
      queryClient.invalidateQueries({ queryKey: ['calculator-results', data.workspace_id] })
      if (data.patient_id) {
        queryClient.invalidateQueries({
          queryKey: ['calculator-results', data.workspace_id, data.patient_id],
        })
      }
    },
  })
}

/**
 * Get calculator history for a workspace or patient
 */
export function useCalculatorHistory(
  workspaceId: string | null,
  patientId?: string | null,
  calculatorType?: CalculatorType
) {
  return useQuery({
    queryKey: ['calculator-results', workspaceId, patientId, calculatorType],
    queryFn: async () => {
      if (!workspaceId) throw new Error('Workspace ID is required')

      const params = new URLSearchParams({
        workspace_id: workspaceId,
      })

      if (patientId) params.append('patient_id', patientId)
      if (calculatorType) params.append('calculator_type', calculatorType)

      const response = await fetch(`/api/calculators?${params.toString()}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch calculator history')
      }

      return response.json() as Promise<{
        results: ClinicalCalculatorResult[]
        count: number
      }>
    },
    enabled: !!workspaceId,
  })
}

/**
 * Get calculator history for a specific patient
 */
export function usePatientCalculatorHistory(workspaceId: string | null, patientId: string | null) {
  return useCalculatorHistory(workspaceId, patientId)
}

/**
 * Get calculator history by type
 */
export function useCalculatorHistoryByType(
  workspaceId: string | null,
  calculatorType: CalculatorType
) {
  return useCalculatorHistory(workspaceId, null, calculatorType)
}
