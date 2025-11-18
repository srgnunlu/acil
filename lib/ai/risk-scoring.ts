/**
 * Patient Risk Scoring Service
 *
 * Calculates risk scores (0-100) based on various patient factors:
 * - Age
 * - Vital signs abnormalities
 * - Lab test results
 * - Medical history
 * - AI analysis results
 * - Length of stay
 */

interface VitalSigns {
  systolicBP?: number
  diastolicBP?: number
  heartRate?: number
  respiratoryRate?: number
  temperature?: number
  oxygenSaturation?: number
}

interface PatientData {
  age?: number
  vitalSigns?: VitalSigns
  hasAbnormalLabs?: boolean
  hasChronicConditions?: boolean
  lengthOfStayDays?: number
  aiAnalysisRisk?: 'low' | 'medium' | 'high'
}

interface RiskScore {
  total: number // 0-100
  category: 'low' | 'medium' | 'high' | 'critical'
  factors: {
    age: number
    vitals: number
    labs: number
    history: number
    stay: number
    ai: number
  }
  recommendations: string[]
}

/**
 * Calculate comprehensive patient risk score
 */
export function calculateRiskScore(patient: PatientData): RiskScore {
  const factors = {
    age: calculateAgeRisk(patient.age),
    vitals: calculateVitalSignsRisk(patient.vitalSigns),
    labs: patient.hasAbnormalLabs ? 15 : 0,
    history: patient.hasChronicConditions ? 10 : 0,
    stay: calculateLengthOfStayRisk(patient.lengthOfStayDays),
    ai: calculateAIRisk(patient.aiAnalysisRisk),
  }

  // Weighted total (max 100)
  const total = Math.min(
    Math.round(
      factors.age * 0.15 +
      factors.vitals * 0.35 +
      factors.labs * 0.20 +
      factors.history * 0.10 +
      factors.stay * 0.10 +
      factors.ai * 0.10
    ),
    100
  )

  // Determine category
  let category: RiskScore['category']
  if (total >= 80) category = 'critical'
  else if (total >= 60) category = 'high'
  else if (total >= 40) category = 'medium'
  else category = 'low'

  // Generate recommendations
  const recommendations = generateRecommendations(factors, category)

  return {
    total,
    category,
    factors,
    recommendations,
  }
}

/**
 * Calculate age-based risk (0-20 points)
 */
function calculateAgeRisk(age?: number): number {
  if (!age) return 0

  if (age >= 80) return 20
  if (age >= 70) return 15
  if (age >= 60) return 10
  if (age >= 50) return 5
  if (age <= 1) return 15 // Infants
  if (age <= 5) return 10 // Young children

  return 0
}

/**
 * Calculate vital signs risk (0-35 points)
 */
function calculateVitalSignsRisk(vitals?: VitalSigns): number {
  if (!vitals) return 0

  let risk = 0

  // Blood Pressure
  if (vitals.systolicBP) {
    if (vitals.systolicBP >= 180 || vitals.systolicBP < 90) risk += 10
    else if (vitals.systolicBP >= 160 || vitals.systolicBP < 100) risk += 5
  }

  // Heart Rate
  if (vitals.heartRate) {
    if (vitals.heartRate >= 120 || vitals.heartRate < 50) risk += 8
    else if (vitals.heartRate >= 100 || vitals.heartRate < 60) risk += 4
  }

  // Respiratory Rate
  if (vitals.respiratoryRate) {
    if (vitals.respiratoryRate >= 25 || vitals.respiratoryRate < 10) risk += 7
    else if (vitals.respiratoryRate >= 20 || vitals.respiratoryRate < 12) risk += 3
  }

  // Temperature (Celsius)
  if (vitals.temperature) {
    if (vitals.temperature >= 39 || vitals.temperature < 35) risk += 5
    else if (vitals.temperature >= 38 || vitals.temperature < 36) risk += 2
  }

  // Oxygen Saturation
  if (vitals.oxygenSaturation) {
    if (vitals.oxygenSaturation < 90) risk += 10
    else if (vitals.oxygenSaturation < 95) risk += 5
  }

  return Math.min(risk, 35)
}

/**
 * Calculate length of stay risk (0-10 points)
 */
function calculateLengthOfStayRisk(days?: number): number {
  if (!days) return 0

  if (days >= 7) return 10
  if (days >= 5) return 7
  if (days >= 3) return 4

  return 0
}

/**
 * Calculate AI analysis risk (0-10 points)
 */
function calculateAIRisk(aiRisk?: 'low' | 'medium' | 'high'): number {
  if (!aiRisk) return 0

  const riskMap = {
    low: 0,
    medium: 5,
    high: 10,
  }

  return riskMap[aiRisk]
}

/**
 * Generate recommendations based on risk factors
 */
function generateRecommendations(
  factors: RiskScore['factors'],
  category: RiskScore['category']
): string[] {
  const recommendations: string[] = []

  if (category === 'critical' || category === 'high') {
    recommendations.push('Acil hekim değerlendirmesi gerekli')
    recommendations.push('Vital bulguları sık aralıklarla monitörize edin')
  }

  if (factors.vitals >= 15) {
    recommendations.push('Vital bulgu anomalileri için müdahale yapın')
  }

  if (factors.labs >= 10) {
    recommendations.push('Anormal laboratuvar sonuçlarını tekrar değerlendirin')
  }

  if (factors.age >= 15) {
    recommendations.push('Yaş grubuna özel dikkat gösterin')
  }

  if (factors.stay >= 7) {
    recommendations.push('Uzayan yatış süresi nedeniyle taburculuk planı yapın')
  }

  if (factors.ai >= 5) {
    recommendations.push('AI analizindeki önerileri inceleyin')
  }

  if (recommendations.length === 0) {
    recommendations.push('Rutin takip yapın')
  }

  return recommendations
}

/**
 * Batch calculate risk scores for multiple patients
 */
export function calculateBatchRiskScores(patients: PatientData[]): RiskScore[] {
  return patients.map(calculateRiskScore)
}

/**
 * Get risk score color class for UI
 */
export function getRiskScoreColor(score: number): string {
  if (score >= 80) return 'red'
  if (score >= 60) return 'orange'
  if (score >= 40) return 'amber'
  return 'green'
}

/**
 * Get risk category label in Turkish
 */
export function getRiskCategoryLabel(category: RiskScore['category']): string {
  const labels = {
    low: 'Düşük Risk',
    medium: 'Orta Risk',
    high: 'Yüksek Risk',
    critical: 'Kritik Risk',
  }
  return labels[category]
}
