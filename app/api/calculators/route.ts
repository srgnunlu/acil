import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { CalculatorType, ClinicalCalculatorResultCreate } from '@/types/calculator.types'

/**
 * POST /api/calculators
 * Calculate and save a clinical calculator result
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { workspace_id, patient_id, calculator_type, input_data } = body as ClinicalCalculatorResultCreate

    if (!workspace_id || !calculator_type || !input_data) {
      return NextResponse.json(
        { error: 'workspace_id, calculator_type, and input_data are required' },
        { status: 400 }
      )
    }

    // Check workspace membership
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'You are not a member of this workspace' }, { status: 403 })
    }

    // Calculate result based on calculator type
    const calculationResult = await calculateScore(calculator_type, input_data)

    // Save result to database
    const { data: result, error } = await supabase
      .from('clinical_calculator_results')
      .insert({
        workspace_id,
        patient_id: patient_id || null,
        user_id: user.id,
        calculator_type,
        input_data,
        score: calculationResult.score,
        score_interpretation: calculationResult.interpretation,
        risk_category: calculationResult.risk_category,
        recommendations: calculationResult.recommendations,
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving calculator result:', error)
      return NextResponse.json({ error: 'Failed to save calculator result' }, { status: 500 })
    }

    return NextResponse.json({
      ...result,
      calculation_details: calculationResult,
    }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error in POST /api/calculators:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/calculators
 * Get calculator history for a patient or workspace
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const workspaceId = searchParams.get('workspace_id')
    const patientId = searchParams.get('patient_id')
    const calculatorType = searchParams.get('calculator_type')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspace_id is required' }, { status: 400 })
    }

    // Check workspace membership
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'You are not a member of this workspace' }, { status: 403 })
    }

    // Build query
    let query = supabase
      .from('clinical_calculator_results')
      .select('*')
      .eq('workspace_id', workspaceId)

    if (patientId) {
      query = query.eq('patient_id', patientId)
    }

    if (calculatorType) {
      query = query.eq('calculator_type', calculatorType)
    }

    query = query.order('created_at', { ascending: false }).limit(limit)

    const { data: results, error } = await query

    if (error) {
      console.error('Error fetching calculator results:', error)
      return NextResponse.json({ error: 'Failed to fetch calculator results' }, { status: 500 })
    }

    return NextResponse.json({
      results: results || [],
      count: results?.length || 0,
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/calculators:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// =====================================================
// CALCULATOR LOGIC
// =====================================================

async function calculateScore(
  calculatorType: CalculatorType,
  inputData: any
): Promise<{
  score: number
  interpretation: string
  risk_category: string
  recommendations: string
}> {
  switch (calculatorType) {
    case 'gcs':
      return calculateGCS(inputData)
    case 'apache_ii':
      return calculateAPACHEII(inputData)
    case 'sofa':
      return calculateSOFA(inputData)
    case 'qsofa':
      return calculateQSOFA(inputData)
    case 'wells':
      return calculateWells(inputData)
    case 'chads2vasc':
      return calculateCHADS2VASc(inputData)
    case 'hasbled':
      return calculateHASBLED(inputData)
    default:
      throw new Error(`Unknown calculator type: ${calculatorType}`)
  }
}

// Glasgow Coma Scale
function calculateGCS(input: any) {
  const score = input.eye_response + input.verbal_response + input.motor_response
  let severity = 'mild'
  let interpretation = ''
  let recommendations = ''

  if (score <= 8) {
    severity = 'severe'
    interpretation = 'Ciddi bilinç bozukluğu - GKS ≤8'
    recommendations = 'Acil entübasyon değerlendirmesi. YBÜ konsültasyonu. Serebral BT gerekli.'
  } else if (score <= 12) {
    severity = 'moderate'
    interpretation = 'Orta derecede bilinç bozukluğu - GKS 9-12'
    recommendations = 'Yakın nörolojik takip. BT görüntüleme düşünülmeli. Sık vital bulgu monitorizasyonu.'
  } else {
    severity = 'mild'
    interpretation = 'Hafif bilinç bozukluğu - GKS 13-15'
    recommendations = 'Nörolojik muayene. Gerekirse görüntüleme. Gözlem altında tutulmalı.'
  }

  return {
    score,
    interpretation: `${interpretation} (Göz:${input.eye_response}, Sözel:${input.verbal_response}, Motor:${input.motor_response})`,
    risk_category: severity,
    recommendations,
  }
}

// qSOFA (Quick SOFA)
function calculateQSOFA(input: any) {
  let score = 0

  if (input.respiratory_rate >= 22) score++
  if (input.altered_mentation) score++
  if (input.systolic_bp <= 100) score++

  let interpretation = ''
  let riskCategory = 'low'
  let recommendations = ''

  if (score >= 2) {
    riskCategory = 'high'
    interpretation = 'Yüksek sepsis riski (qSOFA ≥2)'
    recommendations =
      'Acil sepsis protokolü başlatılmalı. Kan kültürü alınmalı. Geniş spektrumlu antibiyotik başlanmalı. Laktat ölçümü. Sıvı resüsitasyonu değerlendirilmeli.'
  } else if (score === 1) {
    riskCategory = 'medium'
    interpretation = 'Orta sepsis riski (qSOFA = 1)'
    recommendations =
      'Yakın takip. Vital bulgular sık kontrol edilmeli. Klinik kötüleşme açısından izlem. Enfeksiyon odağı araştırılmalı.'
  } else {
    riskCategory = 'low'
    interpretation = 'Düşük sepsis riski (qSOFA = 0)'
    recommendations = 'Rutin takip. Klinik şüphe devam ederse detaylı değerlendirme yapılmalı.'
  }

  return {
    score,
    interpretation,
    risk_category: riskCategory,
    recommendations,
  }
}

// CHA2DS2-VASc Score
function calculateCHADS2VASc(input: any) {
  let score = 0

  if (input.congestive_heart_failure) score += 1
  if (input.hypertension) score += 1
  if (input.diabetes) score += 1
  if (input.prior_stroke_tia) score += 2
  if (input.vascular_disease) score += 1
  if (input.sex === 'female') score += 1

  // Age scoring
  if (input.age >= 75) score += 2
  else if (input.age >= 65) score += 1

  let annualStrokeRisk = 0
  let riskCategory = 'low'
  let interpretation = ''
  let recommendations = ''
  let anticoagulationRecommended = false

  // Annual stroke risk based on score
  const riskMap: Record<number, number> = {
    0: 0,
    1: 1.3,
    2: 2.2,
    3: 3.2,
    4: 4.0,
    5: 6.7,
    6: 9.8,
    7: 9.6,
    8: 6.7,
    9: 15.2,
  }

  annualStrokeRisk = riskMap[score] || 0

  if (score === 0) {
    riskCategory = 'low'
    interpretation = 'Çok düşük stroke riski'
    recommendations = 'Antikoagülasyon önerilmez. Yıllık takip yeterli.'
    anticoagulationRecommended = false
  } else if (score === 1) {
    riskCategory = 'low'
    interpretation = 'Düşük stroke riski'
    recommendations = 'Antikoagülasyon düşünülebilir (tercihe bağlı). Aspirin alternatif olabilir.'
    anticoagulationRecommended = false
  } else if (score >= 2) {
    riskCategory = score >= 4 ? 'high' : 'medium'
    interpretation = score >= 4 ? 'Yüksek stroke riski' : 'Orta stroke riski'
    recommendations = 'Oral antikoagülasyon önerilir (varfarin veya DOAK). HAS-BLED skoru ile kanama riski değerlendirilmeli.'
    anticoagulationRecommended = true
  }

  return {
    score,
    interpretation: `${interpretation} - Yıllık stroke riski: %${annualStrokeRisk.toFixed(1)}`,
    risk_category: riskCategory,
    recommendations: `${recommendations} ${anticoagulationRecommended ? '⚠️ Antikoagülasyon önerilir' : ''}`,
  }
}

// HAS-BLED Score
function calculateHASBLED(input: any) {
  let score = 0

  if (input.hypertension_uncontrolled) score += 1
  if (input.renal_disease) score += 1
  if (input.liver_disease) score += 1
  if (input.stroke_history) score += 1
  if (input.prior_bleeding) score += 1
  if (input.labile_inr) score += 1
  if (input.elderly) score += 1
  if (input.drugs_predisposing) score += 1
  if (input.alcohol_excess) score += 1

  let annualBleedingRisk = 0
  let riskCategory = 'low'
  let interpretation = ''
  let recommendations = ''
  let cautionAdvised = false

  // Annual bleeding risk estimation
  const bleedingRiskMap: Record<number, number> = {
    0: 1.13,
    1: 1.02,
    2: 1.88,
    3: 3.74,
    4: 8.70,
    5: 12.50,
    6: 12.50,
    7: 12.50,
    8: 12.50,
    9: 12.50,
  }

  annualBleedingRisk = bleedingRiskMap[score] || 12.5

  if (score <= 2) {
    riskCategory = 'low'
    interpretation = 'Düşük kanama riski'
    recommendations = 'Antikoagülasyon güvenli. Rutin takip yeterli.'
    cautionAdvised = false
  } else if (score === 3) {
    riskCategory = 'medium'
    interpretation = 'Orta kanama riski'
    recommendations = 'Dikkatli antikoagülasyon. Düzenli INR takibi. Kanama risk faktörleri modifiye edilmeli.'
    cautionAdvised = true
  } else {
    riskCategory = 'high'
    interpretation = 'Yüksek kanama riski'
    recommendations =
      '⚠️ Antikoagülasyon dikkatle kullanılmalı. Risk/fayda değerlendirmesi yapılmalı. Sık takip gerekli. Modifiye edilebilir risk faktörleri düzeltilmeli.'
    cautionAdvised = true
  }

  return {
    score,
    interpretation: `${interpretation} - Yıllık major kanama riski: %${annualBleedingRisk.toFixed(2)}`,
    risk_category: riskCategory,
    recommendations: `${recommendations}`,
  }
}

// Wells Criteria (DVT/PE)
function calculateWells(input: any) {
  let score = 0

  // Determine if DVT or PE
  if ('clinical_signs_dvt' in input) {
    // PE Wells Score
    if (input.clinical_signs_dvt) score += 3
    if (input.alternative_diagnosis_less_likely) score += 3
    if (input.heart_rate_over_100) score += 1.5
    if (input.immobilization_or_surgery) score += 1.5
    if (input.previous_dvt_pe) score += 1.5
    if (input.hemoptysis) score += 1
    if (input.malignancy) score += 1
  } else {
    // DVT Wells Score
    if (input.active_cancer) score += 1
    if (input.paralysis_or_immobilization) score += 1
    if (input.bedridden_recently) score += 1
    if (input.localized_tenderness) score += 1
    if (input.entire_leg_swollen) score += 1
    if (input.calf_swelling) score += 1
    if (input.pitting_edema) score += 1
    if (input.collateral_veins) score += 1
    if (input.previous_dvt) score += 1
    if (input.alternative_diagnosis) score -= 2
  }

  let probability = ''
  let riskCategory = 'low'
  let recommendations = ''

  if (score < 2) {
    riskCategory = 'low'
    probability = 'Düşük olasılık'
    recommendations = 'D-dimer testi yapılabilir. Negatif ise PE/DVT dışlanabilir.'
  } else if (score <= 6) {
    riskCategory = 'medium'
    probability = 'Orta olasılık'
    recommendations = 'D-dimer veya görüntüleme önerilir. Doppler USG (DVT) veya BT Anjio (PE) düşünülmeli.'
  } else {
    riskCategory = 'high'
    probability = 'Yüksek olasılık'
    recommendations = 'Acil görüntüleme gerekli. Antikoagülasyon başlanması düşünülmeli.'
  }

  return {
    score,
    interpretation: probability,
    risk_category: riskCategory,
    recommendations,
  }
}

// SOFA Score (Simplified)
function calculateSOFA(input: any) {
  let totalScore = 0

  // Respiration
  let respScore = 0
  if (input.pao2_fio2_ratio) {
    if (input.pao2_fio2_ratio < 100) respScore = 4
    else if (input.pao2_fio2_ratio < 200) respScore = input.mechanical_ventilation ? 3 : 2
    else if (input.pao2_fio2_ratio < 300) respScore = 2
    else if (input.pao2_fio2_ratio < 400) respScore = 1
  }
  totalScore += respScore

  // Coagulation
  let coagScore = 0
  if (input.platelets < 20) coagScore = 4
  else if (input.platelets < 50) coagScore = 3
  else if (input.platelets < 100) coagScore = 2
  else if (input.platelets < 150) coagScore = 1
  totalScore += coagScore

  // Liver
  let liverScore = 0
  if (input.bilirubin >= 12) liverScore = 4
  else if (input.bilirubin >= 6) liverScore = 3
  else if (input.bilirubin >= 2) liverScore = 2
  else if (input.bilirubin >= 1.2) liverScore = 1
  totalScore += liverScore

  // Cardiovascular (simplified)
  let cvScore = 0
  if (input.mean_arterial_pressure < 70) {
    if (input.vasopressors) cvScore = 3
    else cvScore = 1
  }
  totalScore += cvScore

  // CNS
  let cnsScore = 0
  const gcs = input.glasgow_coma_scale
  if (gcs < 6) cnsScore = 4
  else if (gcs < 10) cnsScore = 3
  else if (gcs < 13) cnsScore = 2
  else if (gcs < 15) cnsScore = 1
  totalScore += cnsScore

  // Renal
  let renalScore = 0
  if (input.creatinine >= 5) renalScore = 4
  else if (input.creatinine >= 3.5) renalScore = 3
  else if (input.creatinine >= 2) renalScore = 2
  else if (input.creatinine >= 1.2) renalScore = 1
  totalScore += renalScore

  // Mortality risk estimation
  let mortalityRisk = 0
  if (totalScore < 6) mortalityRisk = 10
  else if (totalScore < 10) mortalityRisk = 25
  else if (totalScore < 15) mortalityRisk = 50
  else mortalityRisk = 75

  let riskCategory = 'low'
  let interpretation = ''

  if (totalScore < 6) {
    riskCategory = 'low'
    interpretation = 'Düşük mortalite riski'
  } else if (totalScore < 10) {
    riskCategory = 'medium'
    interpretation = 'Orta mortalite riski'
  } else {
    riskCategory = 'high'
    interpretation = 'Yüksek mortalite riski'
  }

  return {
    score: totalScore,
    interpretation: `${interpretation} - Tahmini mortalite: %${mortalityRisk}`,
    risk_category: riskCategory,
    recommendations: `SOFA skoru ${totalScore}. Organ destek tedavileri değerlendirilmeli. YBÜ takibi gerekli.`,
  }
}

// APACHE II (Simplified - requires extensive data)
function calculateAPACHEII(input: any) {
  // This is a simplified version - full APACHE II is very complex
  let score = 0

  // Age points
  if (input.age >= 75) score += 6
  else if (input.age >= 65) score += 5
  else if (input.age >= 55) score += 3
  else if (input.age >= 45) score += 2

  // Temperature points (simplified)
  if (input.temperature >= 41 || input.temperature < 30) score += 4
  else if (input.temperature >= 39 || input.temperature < 34) score += 3
  else if (input.temperature >= 38.5 || input.temperature < 36) score += 1

  // MAP points
  if (input.mean_arterial_pressure >= 160) score += 4
  else if (input.mean_arterial_pressure >= 130) score += 3
  else if (input.mean_arterial_pressure >= 110) score += 2
  else if (input.mean_arterial_pressure < 50) score += 4
  else if (input.mean_arterial_pressure < 70) score += 2

  // Heart rate
  if (input.heart_rate >= 180) score += 4
  else if (input.heart_rate >= 140) score += 3
  else if (input.heart_rate >= 110) score += 2
  else if (input.heart_rate < 40) score += 4
  else if (input.heart_rate < 55) score += 2

  // GCS points (15 - GCS)
  score += 15 - input.glasgow_coma_scale

  // Chronic health
  score += input.chronic_health_points

  // Mortality risk (simplified)
  let mortalityRisk = Math.min(Math.round(score * 2.5), 85)

  let riskCategory = 'low'
  if (mortalityRisk > 50) riskCategory = 'critical'
  else if (mortalityRisk > 25) riskCategory = 'high'
  else if (mortalityRisk > 10) riskCategory = 'medium'

  return {
    score,
    interpretation: `APACHE II Skoru: ${score} - Tahmini mortalite: %${mortalityRisk}`,
    risk_category: riskCategory,
    recommendations: 'Yoğun bakım takibi önerilir. Organ fonksiyonları yakın takip edilmeli.',
  }
}
