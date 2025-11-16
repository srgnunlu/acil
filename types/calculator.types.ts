/**
 * Clinical Calculator Type Definitions
 * Phase 10: Clinical Decision Support Tools
 */

// =====================================================
// CALCULATOR TYPES
// =====================================================

export type CalculatorType =
  | 'gcs'
  | 'apache_ii'
  | 'sofa'
  | 'qsofa'
  | 'wells'
  | 'chads2vasc'
  | 'hasbled'

export type RiskCategory = 'low' | 'medium' | 'high' | 'critical'

// =====================================================
// CLINICAL CALCULATOR RESULT
// =====================================================

export interface ClinicalCalculatorResult {
  id: string
  workspace_id: string
  patient_id: string | null
  user_id: string
  calculator_type: CalculatorType
  input_data: Record<string, any>
  score: number | null
  score_interpretation: string | null
  risk_category: RiskCategory | null
  recommendations: string | null
  created_at: string
}

export type ClinicalCalculatorResultCreate = Omit<
  ClinicalCalculatorResult,
  'id' | 'created_at'
>

// =====================================================
// GLASGOW COMA SCALE (GCS)
// =====================================================

export type GCSEyeResponse = 1 | 2 | 3 | 4
export type GCSVerbalResponse = 1 | 2 | 3 | 4 | 5
export type GCSMotorResponse = 1 | 2 | 3 | 4 | 5 | 6

export interface GCSInput {
  eye_response: GCSEyeResponse
  verbal_response: GCSVerbalResponse
  motor_response: GCSMotorResponse
}

export interface GCSResult {
  total_score: number
  eye_score: GCSEyeResponse
  verbal_score: GCSVerbalResponse
  motor_score: GCSMotorResponse
  interpretation: string
  severity: 'mild' | 'moderate' | 'severe'
}

// =====================================================
// APACHE II
// =====================================================

export interface APACHEIIInput {
  age: number
  temperature: number // Celsius
  mean_arterial_pressure: number // mmHg
  heart_rate: number // bpm
  respiratory_rate: number // breaths/min
  pao2: number | null // mmHg (if FiO2 < 0.5)
  fio2: number | null // decimal (e.g., 0.21 for room air)
  aado2: number | null // mmHg (if FiO2 >= 0.5)
  arterial_ph: number
  serum_sodium: number // mEq/L
  serum_potassium: number // mEq/L
  serum_creatinine: number // mg/dL
  hematocrit: number // %
  white_blood_cells: number // x1000/mm3
  glasgow_coma_scale: number // 3-15
  acute_renal_failure: boolean
  chronic_health_points: number // 0, 2, or 5
}

export interface APACHEIIResult {
  total_score: number
  mortality_risk: number // percentage
  interpretation: string
  risk_category: RiskCategory
}

// =====================================================
// SOFA (Sequential Organ Failure Assessment)
// =====================================================

export interface SOFAInput {
  pao2_fio2_ratio: number | null
  mechanical_ventilation: boolean
  platelets: number // x1000/mm3
  bilirubin: number // mg/dL
  mean_arterial_pressure: number // mmHg
  vasopressors: boolean
  dopamine_dose: number | null // mcg/kg/min
  dobutamine_dose: number | null // mcg/kg/min
  epinephrine_dose: number | null // mcg/kg/min
  norepinephrine_dose: number | null // mcg/kg/min
  glasgow_coma_scale: number // 3-15
  creatinine: number // mg/dL
  urine_output: number | null // mL/day
}

export interface SOFAResult {
  total_score: number
  respiration_score: number
  coagulation_score: number
  liver_score: number
  cardiovascular_score: number
  cns_score: number
  renal_score: number
  mortality_risk: number // percentage
  interpretation: string
  risk_category: RiskCategory
}

// =====================================================
// qSOFA (Quick SOFA)
// =====================================================

export interface qSOFAInput {
  respiratory_rate: number // breaths/min
  altered_mentation: boolean
  systolic_bp: number // mmHg
}

export interface qSOFAResult {
  total_score: number // 0-3
  criteria_met: string[]
  interpretation: string
  risk_category: RiskCategory
  recommendations: string
}

// =====================================================
// WELLS CRITERIA (DVT/PE)
// =====================================================

export type WellsType = 'dvt' | 'pe'

export interface WellsDVTInput {
  active_cancer: boolean
  paralysis_or_immobilization: boolean
  bedridden_recently: boolean
  localized_tenderness: boolean
  entire_leg_swollen: boolean
  calf_swelling: boolean
  pitting_edema: boolean
  collateral_veins: boolean
  alternative_diagnosis: boolean
  previous_dvt: boolean
}

export interface WellsPEInput {
  clinical_signs_dvt: boolean
  alternative_diagnosis_less_likely: boolean
  heart_rate_over_100: boolean
  immobilization_or_surgery: boolean
  previous_dvt_pe: boolean
  hemoptysis: boolean
  malignancy: boolean
}

export interface WellsResult {
  total_score: number
  interpretation: string
  risk_category: 'low' | 'moderate' | 'high'
  probability: string
  recommendations: string
}

// =====================================================
// CHA2DS2-VASc (Stroke Risk in AFib)
// =====================================================

export interface CHADS2VAScInput {
  congestive_heart_failure: boolean
  hypertension: boolean
  age: number // in years
  diabetes: boolean
  prior_stroke_tia: boolean
  vascular_disease: boolean
  sex: 'male' | 'female'
}

export interface CHADS2VAScResult {
  total_score: number // 0-9
  annual_stroke_risk: number // percentage
  interpretation: string
  risk_category: RiskCategory
  recommendations: string
  anticoagulation_recommended: boolean
}

// =====================================================
// HAS-BLED (Bleeding Risk)
// =====================================================

export interface HASBLEDInput {
  hypertension_uncontrolled: boolean
  renal_disease: boolean
  liver_disease: boolean
  stroke_history: boolean
  prior_bleeding: boolean
  labile_inr: boolean
  elderly: boolean // age > 65
  drugs_predisposing: boolean // antiplatelets, NSAIDs
  alcohol_excess: boolean
}

export interface HASBLEDResult {
  total_score: number // 0-9
  annual_bleeding_risk: number // percentage
  interpretation: string
  risk_category: RiskCategory
  recommendations: string
  caution_advised: boolean
}

// =====================================================
// CALCULATOR METADATA
// =====================================================

export interface CalculatorMetadata {
  type: CalculatorType
  name: string
  description: string
  category: string
  icon: string
  color: string
  references: string[]
  version: string
}

export const CALCULATOR_METADATA: Record<CalculatorType, CalculatorMetadata> = {
  gcs: {
    type: 'gcs',
    name: 'Glasgow Coma Scale',
    description: 'Bilinç düzeyini değerlendirmek için kullanılan skalasyon',
    category: 'neurology',
    icon: '🧠',
    color: '#8b5cf6',
    references: [
      'Teasdale G, Jennett B. Assessment of coma and impaired consciousness. Lancet. 1974;2(7872):81-84.',
    ],
    version: '1.0',
  },
  apache_ii: {
    type: 'apache_ii',
    name: 'APACHE II Score',
    description: 'Yoğun bakım mortalite riski değerlendirmesi',
    category: 'critical_care',
    icon: '🏥',
    color: '#ef4444',
    references: [
      'Knaus WA, et al. APACHE II: a severity of disease classification system. Crit Care Med. 1985;13(10):818-29.',
    ],
    version: '1.0',
  },
  sofa: {
    type: 'sofa',
    name: 'SOFA Score',
    description: 'Sepsis ve organ yetmezliği değerlendirmesi',
    category: 'critical_care',
    icon: '⚕️',
    color: '#f59e0b',
    references: [
      'Vincent JL, et al. The SOFA (Sepsis-related Organ Failure Assessment) score to describe organ dysfunction/failure. Intensive Care Med. 1996;22(7):707-10.',
    ],
    version: '1.0',
  },
  qsofa: {
    type: 'qsofa',
    name: 'qSOFA Score',
    description: 'Hızlı sepsis tarama aracı',
    category: 'emergency',
    icon: '🚨',
    color: '#dc2626',
    references: [
      'Singer M, et al. The Third International Consensus Definitions for Sepsis and Septic Shock (Sepsis-3). JAMA. 2016;315(8):801-810.',
    ],
    version: '1.0',
  },
  wells: {
    type: 'wells',
    name: 'Wells Criteria',
    description: 'DVT/PE olasılık değerlendirmesi',
    category: 'emergency',
    icon: '🫀',
    color: '#ec4899',
    references: [
      'Wells PS, et al. Excluding pulmonary embolism at the bedside without diagnostic imaging. Ann Intern Med. 2001;135(2):98-107.',
    ],
    version: '1.0',
  },
  chads2vasc: {
    type: 'chads2vasc',
    name: 'CHA₂DS₂-VASc Score',
    description: 'Atrial fibrilasyonda stroke riski',
    category: 'cardiology',
    icon: '❤️',
    color: '#f43f5e',
    references: [
      'Lip GY, et al. Refining clinical risk stratification for predicting stroke and thromboembolism in atrial fibrillation. Chest. 2010;137(2):263-72.',
    ],
    version: '1.0',
  },
  hasbled: {
    type: 'hasbled',
    name: 'HAS-BLED Score',
    description: 'Antikoagülan tedavide kanama riski',
    category: 'cardiology',
    icon: '💉',
    color: '#be123c',
    references: [
      'Pisters R, et al. A novel user-friendly score (HAS-BLED) to assess 1-year risk of major bleeding in patients with atrial fibrillation. Chest. 2010;138(5):1093-100.',
    ],
    version: '1.0',
  },
}

// =====================================================
// CALCULATOR INPUT TYPES (UNION)
// =====================================================

export type CalculatorInput =
  | GCSInput
  | APACHEIIInput
  | SOFAInput
  | qSOFAInput
  | WellsDVTInput
  | WellsPEInput
  | CHADS2VAScInput
  | HASBLEDInput

export type CalculatorResult =
  | GCSResult
  | APACHEIIResult
  | SOFAResult
  | qSOFAResult
  | WellsResult
  | CHADS2VAScResult
  | HASBLEDResult

// =====================================================
// UI TYPES
// =====================================================

export interface CalculatorFormState {
  calculator_type: CalculatorType | null
  input_data: Partial<CalculatorInput>
  patient_id: string | null
  errors: Record<string, string>
}

export interface CalculatorHistoryItem {
  id: string
  calculator_type: CalculatorType
  score: number
  interpretation: string
  created_at: string
  patient_name?: string
}
