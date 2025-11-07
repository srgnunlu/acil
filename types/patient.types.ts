/**
 * Strict TypeScript types for patient data
 * Replaces 'any' types with proper interfaces
 */

// Demographics
export interface Demographics {
  name: string
  age: number | null
  gender: 'Erkek' | 'Kadın' | 'Diğer' | null
  birthDate?: string
  bloodType?: string
  allergies?: string[]
}

// Anamnesis (Patient History)
export interface Anamnesis {
  chiefComplaint: string
  historyOfPresentIllness: string
  symptomOnset?: string
  symptomDuration?: string
  painScale?: number
  associatedSymptoms?: string[]
  reviewOfSystems?: Record<string, string>
}

// Medications
export interface Medication {
  name: string
  dose: string
  frequency: string
  route: string
  startDate?: string
  endDate?: string
  indication?: string
}

// Vital Signs
export interface VitalSigns {
  temperature?: number // Celsius
  heartRate?: number // bpm
  bloodPressureSystolic?: number // mmHg
  bloodPressureDiastolic?: number // mmHg
  respiratoryRate?: number // per minute
  oxygenSaturation?: number // %
  painScore?: number // 0-10
  consciousness?: 'Alert' | 'Confused' | 'Drowsy' | 'Unresponsive'
  measuredAt?: string
}

// Medical History
export interface MedicalHistory {
  chronicDiseases?: string[]
  pastSurgeries?: Array<{
    procedure: string
    date?: string
    hospital?: string
  }>
  familyHistory?: string[]
  socialHistory?: {
    smoking?: boolean
    alcohol?: boolean
    occupation?: string
  }
  immunizations?: Array<{
    vaccine: string
    date?: string
  }>
}

// Test Results (Generic structure)
export interface TestResult {
  testName: string
  value: string | number
  unit?: string
  referenceRange?: string
  status?: 'normal' | 'abnormal' | 'critical'
  performedAt?: string
}

// Lab Results
export interface LabResults {
  complete_blood_count?: {
    wbc?: TestResult
    rbc?: TestResult
    hemoglobin?: TestResult
    hematocrit?: TestResult
    platelets?: TestResult
  }
  basic_metabolic_panel?: {
    sodium?: TestResult
    potassium?: TestResult
    chloride?: TestResult
    bicarbonate?: TestResult
    glucose?: TestResult
    bun?: TestResult
    creatinine?: TestResult
  }
  liver_function?: {
    alt?: TestResult
    ast?: TestResult
    alkaline_phosphatase?: TestResult
    bilirubin?: TestResult
  }
  cardiac_markers?: {
    troponin?: TestResult
    bnp?: TestResult
    ck_mb?: TestResult
  }
  coagulation?: {
    pt?: TestResult
    inr?: TestResult
    ptt?: TestResult
  }
  [key: string]: Record<string, TestResult> | undefined
}

// Imaging Results
export interface ImagingResult {
  type: 'X-Ray' | 'CT' | 'MRI' | 'Ultrasound' | 'EKG' | 'Other'
  bodyPart?: string
  findings: string
  impression?: string
  images?: string[]
  performedAt?: string
  reportedBy?: string
}

// AI Analysis Response
export interface AIAnalysisResponse {
  summary?: string
  differential_diagnosis?: string[]
  red_flags?: string[]
  recommended_tests?: Array<{
    test: string
    priority: 'urgent' | 'high' | 'routine'
    rationale: string
  }>
  treatment_algorithm?: {
    immediate?: string[]
    monitoring?: string[]
    medications?: string[]
  }
  consultation?: {
    required: boolean
    departments?: string[]
    urgency?: 'urgent' | 'routine'
    reason?: string
  }
  disposition?: {
    recommendation: 'hospitalize' | 'observe' | 'discharge'
    criteria?: string
  }
  references?: Array<{
    title: string
    source: string
    year?: string
    key_point?: string
    url?: string
  }>
}

// Vision Analysis Response
export interface VisionAnalysisResponse {
  // EKG specific
  interpretation?: {
    rhythm?: string
    rate?: string
    intervals?: string
    axis?: string
    findings?: string[]
  }
  // Skin Lesion specific
  abcde_score?: {
    asymmetry?: string
    border?: string
    color?: string
    diameter?: string
  }
  malignancy_risk?: 'low' | 'medium' | 'high'
  // X-Ray specific
  systematic_review?: {
    airways?: string
    bones?: string
    cardiac?: string
    diaphragm?: string
    edges?: string
    fields?: string
  }
  image_type?: string
  technique?: string
  // Common fields
  description?: string
  findings?: string[]
  clinical_significance?: string
  urgent_findings?: string[]
  urgent_evaluation_needed?: boolean
  differential_diagnosis?: string[]
  recommendations?: string[]
  confidence?: 'high' | 'medium' | 'low'
  impression?: string
  raw_analysis?: string
}

// Image Comparison Response
export interface ImageComparisonResponse {
  temporal_relationship?: string
  changes?: {
    improved?: string[]
    worsened?: string[]
    new_findings?: string[]
    resolved?: string[]
  }
  interval_changes?: string[]
  progression?: 'stable' | 'improved' | 'worsened'
  new_findings?: string[]
  clinical_significance?: string
  recommendations?: string[]
  comparison?: string
  raw_comparison?: string
}
