/**
 * Auto-fill calculator inputs from patient data
 * This utility extracts relevant data from patient records to pre-fill calculator forms
 */

import type { Patient, PatientData, PatientTest } from '@/types'
import type {
  GCSInput,
  qSOFAInput,
  CHADS2VAScInput,
  HASBLEDInput,
  SOFAInput,
  APACHEIIInput,
} from '@/types/calculator.types'

interface PatientDataForCalculators {
  patient: Patient
  patientData: PatientData[]
  tests: PatientTest[]
  latestVitalSigns?: {
    systolic_bp?: number
    diastolic_bp?: number
    heart_rate?: number
    respiratory_rate?: number
    temperature?: number
    oxygen_saturation?: number
    glasgow_coma_scale?: number
  }
  latestLabResults?: {
    platelets?: number
    bilirubin?: number
    creatinine?: number
    sodium?: number
    potassium?: number
    hematocrit?: number
    white_blood_cells?: number
    arterial_ph?: number
    pao2?: number
    fio2?: number
  }
}

/**
 * Extract latest vital signs from patient data
 */
function extractVitalSigns(patientData: PatientData[]): PatientDataForCalculators['latestVitalSigns'] {
  const vitalSignsData = patientData
    .filter((d) => d.data_type === 'vital_signs')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

  if (!vitalSignsData) return undefined

  const content = vitalSignsData.content as Record<string, unknown>
  return {
    systolic_bp: typeof content.systolic_bp === 'number' ? content.systolic_bp : undefined,
    diastolic_bp: typeof content.diastolic_bp === 'number' ? content.diastolic_bp : undefined,
    heart_rate: typeof content.heart_rate === 'number' ? content.heart_rate : undefined,
    respiratory_rate: typeof content.respiratory_rate === 'number' ? content.respiratory_rate : undefined,
    temperature: typeof content.temperature === 'number' ? content.temperature : undefined,
    oxygen_saturation: typeof content.oxygen_saturation === 'number' ? content.oxygen_saturation : undefined,
    glasgow_coma_scale: typeof content.glasgow_coma_scale === 'number' ? content.glasgow_coma_scale : undefined,
  }
}

/**
 * Extract latest lab results from patient tests
 */
function extractLabResults(tests: PatientTest[]): PatientDataForCalculators['latestLabResults'] {
  const labTests = tests
    .filter((t) => t.test_type === 'laboratory')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  if (labTests.length === 0) return undefined

  const latestLab = labTests[0].results as Record<string, unknown>

  return {
    platelets: typeof latestLab.platelets === 'number' ? latestLab.platelets : undefined,
    bilirubin: typeof latestLab.bilirubin === 'number' ? latestLab.bilirubin : undefined,
    creatinine: typeof latestLab.creatinine === 'number' ? latestLab.creatinine : undefined,
    sodium: typeof latestLab.sodium === 'number' ? latestLab.sodium : undefined,
    potassium: typeof latestLab.potassium === 'number' ? latestLab.potassium : undefined,
    hematocrit: typeof latestLab.hematocrit === 'number' ? latestLab.hematocrit : undefined,
    white_blood_cells: typeof latestLab.white_blood_cells === 'number' ? latestLab.white_blood_cells : undefined,
    arterial_ph: typeof latestLab.arterial_ph === 'number' ? latestLab.arterial_ph : undefined,
    pao2: typeof latestLab.pao2 === 'number' ? latestLab.pao2 : undefined,
    fio2: typeof latestLab.fio2 === 'number' ? latestLab.fio2 : undefined,
  }
}

/**
 * Auto-fill GCS calculator from patient data
 */
export function autoFillGCS(data: PatientDataForCalculators): Partial<GCSInput> {
  const vitalSigns = data.latestVitalSigns
  if (!vitalSigns?.glasgow_coma_scale) return {}

  // If GCS total is available, try to estimate components
  // This is approximate - ideally we'd have the components separately
  const gcs = vitalSigns.glasgow_coma_scale

  // Rough estimation (not perfect, but better than nothing)
  let eye: GCSInput['eye_response'] = 4
  let verbal: GCSInput['verbal_response'] = 5
  let motor: GCSInput['motor_response'] = 6

  if (gcs <= 3) {
    eye = 1
    verbal = 1
    motor = 1
  } else if (gcs <= 6) {
    eye = 1
    verbal = 1
    motor = 2
  } else if (gcs <= 9) {
    eye = 2
    verbal = 2
    motor = 3
  } else if (gcs <= 12) {
    eye = 3
    verbal = 3
    motor = 4
  } else {
    eye = 4
    verbal = 4
    motor = 5
  }

  return { eye_response: eye, verbal_response: verbal, motor_response: motor }
}

/**
 * Auto-fill qSOFA calculator from patient data
 */
export function autoFillQSOFA(data: PatientDataForCalculators): Partial<qSOFAInput> {
  const vitalSigns = data.latestVitalSigns
  if (!vitalSigns) return {}

  return {
    respiratory_rate: vitalSigns.respiratory_rate,
    systolic_bp: vitalSigns.systolic_bp,
    altered_mentation: vitalSigns.glasgow_coma_scale ? vitalSigns.glasgow_coma_scale < 15 : undefined,
  }
}

/**
 * Auto-fill CHA2DS2-VASc calculator from patient data
 */
export function autoFillCHADS2VASc(data: PatientDataForCalculators): Partial<CHADS2VAScInput> {
  const patient = data.patient
  const historyData = data.patientData
    .filter((d) => d.data_type === 'history')
    .map((d) => d.content as Record<string, unknown>)

  const hasHistory = (condition: string) => {
    return historyData.some((h) => {
      const conditions = h.conditions as string[] | undefined
      return conditions?.some((c) => c.toLowerCase().includes(condition.toLowerCase()))
    })
  }

  return {
    age: patient.age || undefined,
    sex: patient.gender === 'Kadın' ? 'female' : patient.gender === 'Erkek' ? 'male' : undefined,
    congestive_heart_failure: hasHistory('kalp yetmezliği') || hasHistory('heart failure'),
    hypertension: hasHistory('hipertansiyon') || hasHistory('hypertension'),
    prior_stroke_tia: hasHistory('inme') || hasHistory('stroke') || hasHistory('tia'),
    vascular_disease: hasHistory('vasküler') || hasHistory('vascular'),
    diabetes: hasHistory('diyabet') || hasHistory('diabetes'),
  }
}

/**
 * Auto-fill HAS-BLED calculator from patient data
 */
export function autoFillHASBLED(data: PatientDataForCalculators): Partial<HASBLEDInput> {
  const historyData = data.patientData
    .filter((d) => d.data_type === 'history')
    .map((d) => d.content as Record<string, unknown>)

  const medicationsData = data.patientData
    .filter((d) => d.data_type === 'medications')
    .map((d) => d.content as Record<string, unknown>)

  const hasHistory = (condition: string) => {
    return historyData.some((h) => {
      const conditions = h.conditions as string[] | undefined
      return conditions?.some((c) => c.toLowerCase().includes(condition.toLowerCase()))
    })
  }

  const hasMedication = (medName: string) => {
    return medicationsData.some((m) => {
      const name = (m.name as string) || ''
      return name.toLowerCase().includes(medName.toLowerCase())
    })
  }

  const labResults = data.latestLabResults

  return {
    hypertension_uncontrolled: hasHistory('hipertansiyon') || hasHistory('hypertension'),
    renal_disease: labResults?.creatinine ? labResults.creatinine > 2.3 : undefined,
    liver_disease: labResults?.bilirubin ? labResults.bilirubin > 2 : undefined,
    stroke_history: hasHistory('inme') || hasHistory('stroke'),
    prior_bleeding: hasHistory('kanama') || hasHistory('bleeding'),
    labile_inr: undefined, // Would need INR test results
    elderly: data.patient.age ? data.patient.age > 65 : undefined,
    drugs_predisposing: hasMedication('warfarin') || hasMedication('aspirin') || hasMedication('clopidogrel'),
    alcohol_excess: undefined, // Would need specific alcohol history
  }
}

/**
 * Auto-fill SOFA calculator from patient data
 */
export function autoFillSOFA(data: PatientDataForCalculators): Partial<SOFAInput> {
  const vitalSigns = data.latestVitalSigns
  const labResults = data.latestLabResults

  const meanArterialPressure =
    vitalSigns?.systolic_bp && vitalSigns?.diastolic_bp
      ? (vitalSigns.systolic_bp + 2 * vitalSigns.diastolic_bp) / 3
      : undefined

  const pao2Fio2Ratio =
    labResults?.pao2 && labResults?.fio2 ? labResults.pao2 / labResults.fio2 : undefined

  return {
    pao2_fio2_ratio: pao2Fio2Ratio,
    mechanical_ventilation: vitalSigns?.oxygen_saturation ? vitalSigns.oxygen_saturation < 90 : undefined,
    platelets: labResults?.platelets,
    bilirubin: labResults?.bilirubin,
    mean_arterial_pressure: meanArterialPressure,
    vasopressors: undefined, // Would need medication data
    glasgow_coma_scale: vitalSigns?.glasgow_coma_scale,
    creatinine: labResults?.creatinine,
  }
}

/**
 * Auto-fill APACHE II calculator from patient data
 */
export function autoFillAPACHEII(data: PatientDataForCalculators): Partial<APACHEIIInput> {
  const patient = data.patient
  const vitalSigns = data.latestVitalSigns
  const labResults = data.latestLabResults

  const meanArterialPressure =
    vitalSigns?.systolic_bp && vitalSigns?.diastolic_bp
      ? (vitalSigns.systolic_bp + 2 * vitalSigns.diastolic_bp) / 3
      : undefined

  const aado2 =
    labResults?.pao2 && labResults?.fio2
      ? (labResults.fio2 * 713) - labResults.pao2 - (labResults.arterial_ph ? labResults.arterial_ph * 0.8 : 0)
      : undefined

  return {
    age: patient.age || undefined,
    temperature: vitalSigns?.temperature,
    mean_arterial_pressure: meanArterialPressure,
    heart_rate: vitalSigns?.heart_rate,
    respiratory_rate: vitalSigns?.respiratory_rate,
    pao2: labResults?.pao2 && labResults.fio2 && labResults.fio2 < 0.5 ? labResults.pao2 : null,
    fio2: labResults?.fio2 || null,
    aado2: labResults?.fio2 && labResults.fio2 >= 0.5 ? aado2 || null : null,
    arterial_ph: labResults?.arterial_ph,
    serum_sodium: labResults?.sodium,
    serum_potassium: labResults?.potassium,
    serum_creatinine: labResults?.creatinine,
    hematocrit: labResults?.hematocrit,
    white_blood_cells: labResults?.white_blood_cells,
    glasgow_coma_scale: vitalSigns?.glasgow_coma_scale,
    acute_renal_failure: labResults?.creatinine ? labResults.creatinine > 2 : undefined,
    chronic_health_points: 0, // Would need history data
  }
}

/**
 * Check if all required fields for a calculator are available
 */
export function canAutoCalculate(
  calculatorType: string,
  data: PatientDataForCalculators
): { canCalculate: boolean; missingFields: string[] } {
  const vitalSigns = extractVitalSigns(data.patientData)
  const labResults = extractLabResults(data.tests)

  const missingFields: string[] = []

  switch (calculatorType) {
    case 'gcs':
      if (!vitalSigns?.glasgow_coma_scale) missingFields.push('Glasgow Coma Scale')
      break

    case 'qsofa':
      if (!vitalSigns?.respiratory_rate) missingFields.push('Solunum Sayısı')
      if (!vitalSigns?.systolic_bp) missingFields.push('Sistolik Kan Basıncı')
      if (vitalSigns?.glasgow_coma_scale === undefined) missingFields.push('Bilinç Durumu')
      break

    case 'chads2vasc':
      if (!data.patient.age) missingFields.push('Yaş')
      if (!data.patient.gender) missingFields.push('Cinsiyet')
      break

    case 'hasbled':
      if (!data.patient.age) missingFields.push('Yaş')
      if (!labResults?.creatinine) missingFields.push('Kreatinin')
      if (!labResults?.bilirubin) missingFields.push('Bilirubin')
      break

    case 'sofa':
      if (!labResults?.pao2 || !labResults?.fio2) missingFields.push('PaO2/FiO2')
      if (!labResults?.platelets) missingFields.push('Trombosit')
      if (!labResults?.bilirubin) missingFields.push('Bilirubin')
      if (!vitalSigns?.systolic_bp || !vitalSigns?.diastolic_bp) missingFields.push('Kan Basıncı')
      if (!vitalSigns?.glasgow_coma_scale) missingFields.push('Glasgow Coma Scale')
      if (!labResults?.creatinine) missingFields.push('Kreatinin')
      break

    case 'apache_ii':
      if (!data.patient.age) missingFields.push('Yaş')
      if (!vitalSigns?.temperature) missingFields.push('Vücut Sıcaklığı')
      if (!vitalSigns?.systolic_bp || !vitalSigns?.diastolic_bp) missingFields.push('Kan Basıncı')
      if (!vitalSigns?.heart_rate) missingFields.push('Kalp Hızı')
      if (!vitalSigns?.respiratory_rate) missingFields.push('Solunum Sayısı')
      if (!labResults?.arterial_ph) missingFields.push('Arteriyel pH')
      if (!labResults?.sodium) missingFields.push('Sodyum')
      if (!labResults?.potassium) missingFields.push('Potasyum')
      if (!labResults?.creatinine) missingFields.push('Kreatinin')
      if (!labResults?.hematocrit) missingFields.push('Hematokrit')
      if (!labResults?.white_blood_cells) missingFields.push('Beyaz Küre')
      if (!vitalSigns?.glasgow_coma_scale) missingFields.push('Glasgow Coma Scale')
      break
  }

  return {
    canCalculate: missingFields.length === 0,
    missingFields,
  }
}

/**
 * Main function to auto-fill any calculator
 */
export function autoFillCalculator(
  calculatorType: string,
  patient: Patient,
  patientData: PatientData[],
  tests: PatientTest[]
): Record<string, unknown> {
  const vitalSigns = extractVitalSigns(patientData)
  const labResults = extractLabResults(tests)

  const data: PatientDataForCalculators = {
    patient,
    patientData,
    tests,
    latestVitalSigns: vitalSigns,
    latestLabResults: labResults,
  }

  switch (calculatorType) {
    case 'gcs':
      return autoFillGCS(data)
    case 'qsofa':
      return autoFillQSOFA(data)
    case 'chads2vasc':
      return autoFillCHADS2VASc(data)
    case 'hasbled':
      return autoFillHASBLED(data)
    case 'sofa':
      return autoFillSOFA(data)
    case 'apache_ii':
      return autoFillAPACHEII(data)
    default:
      return {}
  }
}

