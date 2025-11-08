import { SupabaseClient } from '@supabase/supabase-js'
import type { PatientContext } from '@/lib/ai/openai'
import type { PatientData, PatientTest, AIAnalysis, Patient } from '@/types'

/**
 * Build complete patient context from database
 * This is a shared utility to avoid code duplication across API routes
 *
 * @param supabase - Supabase client instance
 * @param patientId - Patient UUID
 * @param userId - User UUID (for authorization check)
 * @returns Patient context or null if patient not found
 */
export async function buildPatientContext(
  supabase: SupabaseClient,
  patientId: string,
  userId: string
): Promise<{ context: PatientContext; patient: Patient } | null> {
  // Fetch patient with authorization check
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('*')
    .eq('id', patientId)
    .eq('user_id', userId)
    .single()

  if (patientError || !patient) {
    return null
  }

  // Fetch all patient data in parallel for better performance
  const [
    { data: patientData },
    { data: tests },
    { data: previousAnalyses },
  ] = await Promise.all([
    supabase
      .from('patient_data')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false }),

    supabase
      .from('patient_tests')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false }),

    supabase
      .from('ai_analyses')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .limit(3),
  ])

  // Build context object
  const context: PatientContext = {
    demographics: {
      name: patient.name,
      age: patient.age,
      gender: patient.gender as 'Erkek' | 'Kadın' | 'Diğer' | null,
    },
  }

  // Process patient data by type
  if (patientData && patientData.length > 0) {
    const typedData = patientData as PatientData[]

    typedData.forEach((data) => {
      switch (data.data_type) {
        case 'anamnesis':
          context.anamnesis = data.content as PatientContext['anamnesis']
          break

        case 'medications':
          if (!context.medications) context.medications = []
          context.medications.push(data.content as any)
          break

        case 'vital_signs':
          context.vitalSigns = data.content as PatientContext['vitalSigns']
          break

        case 'history':
          context.history = data.content as PatientContext['history']
          break

        case 'demographics':
          context.demographics = {
            ...context.demographics,
            ...(data.content as any),
          } as PatientContext['demographics']
          break
      }
    })
  }

  // Add test results
  if (tests && tests.length > 0) {
    const typedTests = tests as PatientTest[]

    context.tests = typedTests.map((test) => ({
      type: test.test_type,
      results: test.results as Record<string, unknown>,
      date: test.created_at,
    }))
  }

  // Add previous analyses
  if (previousAnalyses && previousAnalyses.length > 0) {
    const typedAnalyses = previousAnalyses as AIAnalysis[]

    context.previousAnalyses = typedAnalyses.map((analysis) => ({
      type: analysis.analysis_type,
      response: analysis.ai_response,
      date: analysis.created_at,
    }))
  }

  return { context, patient }
}

/**
 * Lightweight version that only fetches patient without full context
 * Useful for simple authorization checks
 */
export async function getPatient(
  supabase: SupabaseClient,
  patientId: string,
  userId: string
): Promise<Patient | null> {
  const { data: patient, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', patientId)
    .eq('user_id', userId)
    .single()

  if (error || !patient) {
    return null
  }

  return patient as Patient
}

/**
 * Get patient data by specific type
 */
export async function getPatientDataByType(
  supabase: SupabaseClient,
  patientId: string,
  dataType: 'demographics' | 'anamnesis' | 'medications' | 'vital_signs' | 'history'
): Promise<PatientData[]> {
  const { data, error } = await supabase
    .from('patient_data')
    .select('*')
    .eq('patient_id', patientId)
    .eq('data_type', dataType)
    .order('created_at', { ascending: false })

  if (error || !data) {
    return []
  }

  return data as PatientData[]
}

/**
 * Get latest vital signs for a patient
 */
export async function getLatestVitalSigns(
  supabase: SupabaseClient,
  patientId: string
) {
  const vitalData = await getPatientDataByType(supabase, patientId, 'vital_signs')

  if (vitalData.length === 0) {
    return null
  }

  return vitalData[0].content
}

/**
 * Get patient test results
 */
export async function getPatientTests(
  supabase: SupabaseClient,
  patientId: string,
  limit?: number
): Promise<PatientTest[]> {
  let query = supabase
    .from('patient_tests')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error || !data) {
    return []
  }

  return data as PatientTest[]
}

/**
 * Get AI analyses for a patient
 */
export async function getPatientAnalyses(
  supabase: SupabaseClient,
  patientId: string,
  limit = 10
): Promise<AIAnalysis[]> {
  const { data, error } = await supabase
    .from('ai_analyses')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data) {
    return []
  }

  return data as AIAnalysis[]
}
