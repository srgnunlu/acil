/**
 * AI Trend Analysis Service
 * Phase 7: Analyzes patient data trends and generates insights
 */

import type {
  TrendDataPoint,
  StatisticalAnalysis,
  TrendDirection,
  MetricType,
} from '@/types/ai-monitoring.types'
import { analyzePatient } from './openai'

// ============================================
// STATISTICAL ANALYSIS FUNCTIONS
// ============================================

/**
 * Calculate statistical metrics for a data series
 */
export function calculateStatistics(dataPoints: TrendDataPoint[]): StatisticalAnalysis {
  if (dataPoints.length === 0) {
    return {
      mean: 0,
      std_dev: 0,
      min: 0,
      max: 0,
      slope: 0,
    }
  }

  const values = dataPoints.map((dp) => dp.value)

  // Mean
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length

  // Standard deviation
  const squareDiffs = values.map((val) => Math.pow(val - mean, 2))
  const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / values.length
  const std_dev = Math.sqrt(avgSquareDiff)

  // Min and Max
  const min = Math.min(...values)
  const max = Math.max(...values)

  // Linear regression for slope (trend)
  const slope = calculateSlope(dataPoints)

  // R-squared (coefficient of determination)
  const r_squared = calculateRSquared(dataPoints, slope, mean)

  return {
    mean,
    std_dev,
    min,
    max,
    slope,
    r_squared,
  }
}

/**
 * Calculate slope using linear regression
 */
function calculateSlope(dataPoints: TrendDataPoint[]): number {
  if (dataPoints.length < 2) return 0

  const n = dataPoints.length
  let sumX = 0
  let sumY = 0
  let sumXY = 0
  let sumXX = 0

  dataPoints.forEach((point, index) => {
    const x = index
    const y = point.value
    sumX += x
    sumY += y
    sumXY += x * y
    sumXX += x * x
  })

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  return isNaN(slope) ? 0 : slope
}

/**
 * Calculate R-squared value
 */
function calculateRSquared(
  dataPoints: TrendDataPoint[],
  slope: number,
  mean: number
): number {
  if (dataPoints.length < 2) return 0

  let ssRes = 0 // Residual sum of squares
  let ssTot = 0 // Total sum of squares

  dataPoints.forEach((point, index) => {
    const predicted = mean + slope * (index - dataPoints.length / 2)
    const actual = point.value

    ssRes += Math.pow(actual - predicted, 2)
    ssTot += Math.pow(actual - mean, 2)
  })

  if (ssTot === 0) return 0

  const rSquared = 1 - ssRes / ssTot
  return Math.max(0, Math.min(1, rSquared))
}

// ============================================
// TREND DIRECTION DETERMINATION
// ============================================

/**
 * Determine trend direction based on slope and variability
 */
export function determineTrendDirection(
  stats: StatisticalAnalysis,
  dataPointCount: number
): TrendDirection {
  // Require at least 2 data points (API already checks this)
  // But for meaningful trend analysis, we prefer 3+
  if (dataPointCount < 2) {
    return 'insufficient_data'
  }
  
  // If we have 2 data points, we can still do basic analysis
  // but mark it as potentially insufficient for complex trends
  if (dataPointCount === 2) {
    // With only 2 points, we can determine if it's improving or worsening
    // but we'll mark it as needing more data for confidence
    const slope = stats.slope
    if (Math.abs(slope) < 0.01) {
      return 'stable'
    }
    return slope < 0 ? 'improving' : 'worsening'
  }

  const { slope, std_dev, mean } = stats

  // Coefficient of variation (relative variability)
  const cv = mean !== 0 ? std_dev / Math.abs(mean) : 0

  // High variability indicates fluctuating
  if (cv > 0.3) {
    return 'fluctuating'
  }

  // Normalize slope by mean to get relative change
  const relativeSlope = mean !== 0 ? slope / Math.abs(mean) : slope

  // Thresholds for trend classification
  const improvingThreshold = -0.05 // 5% improvement per time unit
  const worseningThreshold = 0.05 // 5% worsening per time unit

  if (relativeSlope < improvingThreshold) {
    return 'improving'
  } else if (relativeSlope > worseningThreshold) {
    return 'worsening'
  } else {
    return 'stable'
  }
}

// ============================================
// TREND ANALYSIS WITH AI
// ============================================

/**
 * Generate AI interpretation for a trend
 */
export async function generateTrendInterpretation(
  metricType: MetricType,
  metricName: string,
  stats: StatisticalAnalysis,
  trendDirection: TrendDirection,
  dataPoints: TrendDataPoint[],
  patientContext?: Record<string, unknown>
): Promise<{
  ai_interpretation: string
  clinical_significance: string
  should_alert: boolean
}> {
  // Handle insufficient_data case early - don't call AI for this
  if (trendDirection === 'insufficient_data') {
    return {
      ai_interpretation: `Yetersiz veri: ${metricName} için sadece ${dataPoints.length} veri noktası bulundu. Trend analizi için en az 3 veri noktası önerilir. Mevcut veriler: Ortalama ${stats.mean.toFixed(1)}, Aralık ${stats.min}-${stats.max}.`,
      clinical_significance: `Daha fazla ölçüm gerekli - ${dataPoints.length}/3 veri noktası`,
      should_alert: false,
    }
  }

  // Build patient context string for prompt
  const patientInfo = patientContext?.demographics
    ? `Hasta Bilgileri:
- İsim: ${patientContext.demographics.name || 'Bilinmiyor'}
- Yaş: ${patientContext.demographics.age || 'Bilinmiyor'}
- Cinsiyet: ${patientContext.demographics.gender || 'Bilinmiyor'}
`
    : `Hasta Bilgileri:
- Genel hasta profili (detaylı bilgi mevcut değil)
`

  const prompt = `
Sen deneyimli bir acil tıp uzmanısın. Aşağıdaki hasta metrik trendini analiz et ve klinik yorum yap.

${patientInfo}
Metrik: ${metricName} (${metricType})
Trend Yönü: ${trendDirection === 'improving' ? 'İyileşme' : trendDirection === 'worsening' ? 'Kötüleşme' : trendDirection === 'stable' ? 'Stabil' : 'Değişken'}

İstatistiksel Analiz:
- Ortalama: ${stats.mean.toFixed(2)}
- Standart Sapma: ${stats.std_dev.toFixed(2)}
- Minimum: ${stats.min}
- Maksimum: ${stats.max}
- Eğim (Slope): ${stats.slope.toFixed(4)}
${stats.r_squared !== undefined ? `- R²: ${stats.r_squared.toFixed(3)}` : ''}

Veri Noktaları (${dataPoints.length} ölçüm):
${dataPoints
  .slice(-10)
  .map((dp) => `- ${new Date(dp.timestamp).toLocaleString('tr-TR')}: ${dp.value}${dp.unit || ''}`)
  .join('\n')}

Lütfen şunları sağla:
1. Klinik yorum (2-3 cümle, Türkçe)
2. Klinik önem (acil/önemli/rutin)
3. Bu bir uyarı tetiklemeli mi? (evet/hayır ve neden)

JSON formatında döndür:
{
  "interpretation": "...",
  "significance": "...",
  "should_alert": true/false,
  "alert_reason": "..."
}
`

  try {
    // Use OpenAI directly for trend interpretation
    const OpenAI = (await import('openai')).default
    const { env } = await import('@/lib/config/env')
    
    if (!env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured')
    }
    
    const openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    })
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'Sen deneyimli bir acil tıp uzmanısın. Hasta metrik trendlerini analiz edip klinik yorum yapıyorsun. Yanıtlarını Türkçe, net ve anlaşılır şekilde ver. Hasta bilgileri eksik olsa bile mevcut vital bulgulara göre analiz yap.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 500,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    const parsed = JSON.parse(content)
    const directionText = trendDirection === 'improving' ? 'İyileşme' 
      : trendDirection === 'worsening' ? 'Kötüleşme' 
      : trendDirection === 'stable' ? 'Stabil' 
      : 'Değişken'
    
    return {
      ai_interpretation: parsed.interpretation || `${directionText} trend gözlemlendi: ${metricName}. Ortalama değer: ${stats.mean.toFixed(1)}, ${dataPoints.length} ölçüm ile analiz edildi.`,
      clinical_significance: parsed.significance || getRuleBasedSignificance(metricName, stats, trendDirection),
      should_alert: parsed.should_alert ?? (trendDirection === 'worsening' && Math.abs(stats.slope) > 0.1),
    }
  } catch (error) {
    console.error('Error generating trend interpretation:', error)

    // Fallback interpretation
    const directionText = trendDirection === 'improving' ? 'İyileşme' 
      : trendDirection === 'worsening' ? 'Kötüleşme' 
      : trendDirection === 'stable' ? 'Stabil' 
      : 'Değişken'
    
    return {
      ai_interpretation: `${directionText} trend gözlemlendi: ${metricName}. Ortalama değer: ${stats.mean.toFixed(1)}, ${dataPoints.length} veri noktası ile analiz edildi.`,
      clinical_significance: getRuleBasedSignificance(metricName, stats, trendDirection),
      should_alert: shouldAlertBasedOnRules(metricName, stats, trendDirection),
    }
  }
}

// ============================================
// RULE-BASED FALLBACK LOGIC
// ============================================

/**
 * Rule-based significance assessment (fallback)
 */
function getRuleBasedSignificance(
  metricName: string,
  stats: StatisticalAnalysis,
  direction: TrendDirection
): string {
  // Heart rate
  if (metricName.toLowerCase().includes('heart') || metricName.toLowerCase().includes('hr')) {
    if (stats.mean < 50 || stats.mean > 120) {
      return 'Abnormal heart rate detected - requires clinical review'
    }
    if (direction === 'worsening') {
      return 'Worsening heart rate trend - monitor closely'
    }
  }

  // Temperature
  if (metricName.toLowerCase().includes('temp')) {
    if (stats.mean > 38 || stats.mean < 36) {
      return 'Abnormal temperature - possible infection or hypothermia'
    }
  }

  // Blood pressure
  if (metricName.toLowerCase().includes('blood') || metricName.toLowerCase().includes('bp')) {
    if (stats.mean > 140 || stats.mean < 90) {
      return 'Blood pressure out of normal range'
    }
  }

  // Oxygen saturation
  if (metricName.toLowerCase().includes('o2') || metricName.toLowerCase().includes('spo2')) {
    if (stats.mean < 92) {
      return 'Low oxygen saturation - may require oxygen therapy'
    }
  }

  // Generic
  if (direction === 'worsening') {
    return `${metricName} showing worsening trend - clinical review recommended`
  } else if (direction === 'improving') {
    return `${metricName} showing improvement`
  } else {
    return `${metricName} stable within observed range`
  }
}

/**
 * Rule-based alert logic (fallback)
 */
function shouldAlertBasedOnRules(
  metricName: string,
  stats: StatisticalAnalysis,
  direction: TrendDirection
): boolean {
  // Critical vital signs
  const metric = metricName.toLowerCase()

  if (metric.includes('heart') || metric.includes('hr')) {
    if (stats.mean < 40 || stats.mean > 140) return true
  }

  if (metric.includes('temp')) {
    if (stats.mean > 39 || stats.mean < 35) return true
  }

  if (metric.includes('o2') || metric.includes('spo2')) {
    if (stats.mean < 90) return true
  }

  if (metric.includes('systolic') || metric.includes('sbp')) {
    if (stats.mean > 180 || stats.mean < 80) return true
  }

  if (metric.includes('respiratory') || metric.includes('rr')) {
    if (stats.mean > 30 || stats.mean < 8) return true
  }

  // Worsening trends
  if (direction === 'worsening' && Math.abs(stats.slope) > 0.15) {
    return true
  }

  return false
}

// ============================================
// VITAL SIGNS SPECIFIC ANALYSIS
// ============================================

export interface VitalSignsThresholds {
  heart_rate: { min: number; max: number; critical_min: number; critical_max: number }
  temperature: { min: number; max: number; critical_min: number; critical_max: number }
  respiratory_rate: { min: number; max: number; critical_min: number; critical_max: number }
  systolic_bp: { min: number; max: number; critical_min: number; critical_max: number }
  diastolic_bp: { min: number; max: number; critical_min: number; critical_max: number }
  oxygen_saturation: { min: number; max: number; critical_min: number; critical_max: number }
}

export const DEFAULT_VITAL_THRESHOLDS: VitalSignsThresholds = {
  heart_rate: { min: 60, max: 100, critical_min: 40, critical_max: 140 },
  temperature: { min: 36.5, max: 37.5, critical_min: 35, critical_max: 39 },
  respiratory_rate: { min: 12, max: 20, critical_min: 8, critical_max: 30 },
  systolic_bp: { min: 90, max: 140, critical_min: 80, critical_max: 180 },
  diastolic_bp: { min: 60, max: 90, critical_min: 50, critical_max: 110 },
  oxygen_saturation: { min: 95, max: 100, critical_min: 90, critical_max: 100 },
}

/**
 * Check if value is within thresholds
 */
export function checkVitalThresholds(
  metricName: string,
  value: number,
  thresholds: VitalSignsThresholds = DEFAULT_VITAL_THRESHOLDS
): {
  is_critical: boolean
  is_warning: boolean
  message: string
} {
  const metric = metricName.toLowerCase().replace(/[^a-z_]/g, '_')

  // Find matching threshold
  let threshold: { min: number; max: number; critical_min: number; critical_max: number } | null =
    null

  if (metric.includes('heart') || metric.includes('hr')) {
    threshold = thresholds.heart_rate
  } else if (metric.includes('temp')) {
    threshold = thresholds.temperature
  } else if (metric.includes('resp')) {
    threshold = thresholds.respiratory_rate
  } else if (metric.includes('systolic') || metric.includes('sbp')) {
    threshold = thresholds.systolic_bp
  } else if (metric.includes('diastolic') || metric.includes('dbp')) {
    threshold = thresholds.diastolic_bp
  } else if (metric.includes('o2') || metric.includes('spo2') || metric.includes('sat')) {
    threshold = thresholds.oxygen_saturation
  }

  if (!threshold) {
    return { is_critical: false, is_warning: false, message: 'No threshold defined' }
  }

  // Check critical
  if (value < threshold.critical_min) {
    return {
      is_critical: true,
      is_warning: false,
      message: `Critical low: ${value} < ${threshold.critical_min}`,
    }
  }
  if (value > threshold.critical_max) {
    return {
      is_critical: true,
      is_warning: false,
      message: `Critical high: ${value} > ${threshold.critical_max}`,
    }
  }

  // Check warning
  if (value < threshold.min) {
    return {
      is_critical: false,
      is_warning: true,
      message: `Warning low: ${value} < ${threshold.min}`,
    }
  }
  if (value > threshold.max) {
    return {
      is_critical: false,
      is_warning: true,
      message: `Warning high: ${value} > ${threshold.max}`,
    }
  }

  return { is_critical: false, is_warning: false, message: 'Within normal range' }
}

// ============================================
// TREND EXTRACTION FROM PATIENT DATA
// ============================================

/**
 * Extract trend data points from patient records
 */
export async function extractTrendDataPoints(
  supabase: any,
  patientId: string,
  metricName: string,
  periodHours: number = 24
): Promise<TrendDataPoint[]> {
  const periodStart = new Date(Date.now() - periodHours * 60 * 60 * 1000).toISOString()

  try {
    // Query vital signs from patient_data table
    // Include deleted_at check and increase period if needed
    let query = supabase
      .from('patient_data')
      .select('id, content, created_at')
      .eq('patient_id', patientId)
      .eq('data_type', 'vital_signs')
      .is('deleted_at', null) // Only get non-deleted records
    
    // If periodHours is provided and reasonable, use it; otherwise get all data
    // For trend analysis, we want to see all available data, not just last 24 hours
    if (periodHours && periodHours > 0 && periodHours < 720) { // Max 30 days
      query = query.gte('created_at', periodStart)
    }
    // If periodHours is 0 or very large, get all data
    
    const { data, error } = await query.order('created_at', { ascending: true })

    if (error) {
      console.error('Error querying patient_data:', error)
      throw error
    }

    if (!data || data.length === 0) {
      console.log(`[extractTrendDataPoints] No vital signs data found for patient ${patientId} in last ${periodHours} hours`)
      return []
    }

    console.log(`[extractTrendDataPoints] Found ${data.length} vital signs records for patient ${patientId}`)
    console.log(`[extractTrendDataPoints] Sample content:`, data[0]?.content)

    // Comprehensive metric name mapping for field lookups
    // Handles both camelCase (TypeScript) and snake_case (database) formats
    const getPossibleFieldNames = (metric: string): string[] => {
      const lowerMetric = metric.toLowerCase().replace(/[-_\s]/g, '')
      
      const mappings: Record<string, string[]> = {
        // Heart Rate variations
        heartrate: ['heartRate', 'heart_rate', 'hr', 'HR', 'pulse', 'Pulse'],
        hr: ['heartRate', 'heart_rate', 'hr', 'HR', 'pulse'],
        pulse: ['heartRate', 'heart_rate', 'pulse', 'hr'],
        
        // Temperature variations
        temperature: ['temperature', 'temp', 'Temperature', 'Temp', 'body_temperature'],
        temp: ['temperature', 'temp', 'Temperature'],
        bodytemperature: ['temperature', 'body_temperature', 'bodyTemperature'],
        
        // Blood Pressure variations
        bloodpressure: ['bloodPressureSystolic', 'blood_pressure', 'bp', 'systolic', 'BP'],
        bloodpressuresystolic: ['bloodPressureSystolic', 'blood_pressure_systolic', 'systolic', 'bp_systolic', 'sbp', 'SBP'],
        systolic: ['bloodPressureSystolic', 'systolic', 'bp_systolic', 'sbp'],
        sbp: ['bloodPressureSystolic', 'systolic', 'blood_pressure_systolic', 'sbp', 'SBP'],
        bloodpressurediastolic: ['bloodPressureDiastolic', 'blood_pressure_diastolic', 'diastolic', 'bp_diastolic', 'dbp', 'DBP'],
        diastolic: ['bloodPressureDiastolic', 'diastolic', 'bp_diastolic', 'dbp'],
        dbp: ['bloodPressureDiastolic', 'diastolic', 'blood_pressure_diastolic', 'dbp', 'DBP'],
        
        // Respiratory Rate variations
        respiratoryrate: ['respiratoryRate', 'respiratory_rate', 'rr', 'RR', 'breathing_rate', 'respiration'],
        rr: ['respiratoryRate', 'respiratory_rate', 'rr', 'RR'],
        breathingrate: ['respiratoryRate', 'respiratory_rate', 'breathing_rate', 'rr'],
        respiration: ['respiratoryRate', 'respiratory_rate', 'respiration', 'rr'],
        
        // Oxygen Saturation variations
        oxygensaturation: ['oxygenSaturation', 'oxygen_saturation', 'spo2', 'SpO2', 'o2_sat', 'o2sat', 'O2', 'saturation'],
        spo2: ['oxygenSaturation', 'oxygen_saturation', 'spo2', 'SpO2', 'o2_sat', 'o2sat'],
        o2sat: ['oxygenSaturation', 'oxygen_saturation', 'spo2', 'o2sat', 'o2_sat'],
        o2saturation: ['oxygenSaturation', 'oxygen_saturation', 'o2_saturation', 'spo2'],
        saturation: ['oxygenSaturation', 'oxygen_saturation', 'saturation', 'spo2'],
        
        // Pain Score variations
        painscore: ['painScore', 'pain_score', 'pain', 'Pain', 'painLevel', 'pain_level'],
        pain: ['painScore', 'pain_score', 'pain', 'painLevel'],
        painlevel: ['painScore', 'pain_score', 'pain_level', 'painLevel'],
        
        // Consciousness variations
        consciousness: ['consciousness', 'conscious_level', 'consciousnessLevel', 'mental_status', 'gcs'],
        gcs: ['consciousness', 'gcs', 'glasgow_coma_scale', 'GCS'],
      }
      
      // Return mapped values or try variations of the original metric
      return mappings[lowerMetric] || [
        metric,  // Original
        metric.toLowerCase(),  // lowercase
        metric.toUpperCase(),  // UPPERCASE
        // Convert camelCase to snake_case
        metric.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, ''),
        // Convert snake_case to camelCase
        metric.replace(/_([a-z])/g, (g) => g[1].toUpperCase()),
      ]
    }

    const possibleFieldNames = getPossibleFieldNames(metricName)

    // Map to trend data points
    const dataPoints: TrendDataPoint[] = data
      .map((record: any) => {
        const content = record.content as any
        if (!content) return null

        // Try all possible field name variations
        let value: any = null
        for (const fieldName of possibleFieldNames) {
          if (content[fieldName] !== null && content[fieldName] !== undefined) {
            value = content[fieldName]
            break
          }
        }

        // Also check if blood_pressure is a string like "120/80" or object like {systolic: 120, diastolic: 80}
        if (!value && metricName.toLowerCase().includes('blood') && metricName.toLowerCase().includes('pressure')) {
          // Check for string format "120/80"
          if (content.blood_pressure && typeof content.blood_pressure === 'string') {
            const bp = String(content.blood_pressure)
            const parts = bp.split('/')
            if (parts.length === 2) {
              if (metricName.toLowerCase().includes('systolic') || metricName.toLowerCase().includes('sbp')) {
                value = parts[0].trim()
              } else if (metricName.toLowerCase().includes('diastolic') || metricName.toLowerCase().includes('dbp')) {
                value = parts[1].trim()
              }
            }
          }
          // Check for object format {systolic: 120, diastolic: 80}
          else if (content.blood_pressure && typeof content.blood_pressure === 'object') {
            const bp = content.blood_pressure as any
            if (metricName.toLowerCase().includes('systolic') || metricName.toLowerCase().includes('sbp')) {
              value = bp.systolic || bp.systolic_bp || bp.sbp
            } else if (metricName.toLowerCase().includes('diastolic') || metricName.toLowerCase().includes('dbp')) {
              value = bp.diastolic || bp.diastolic_bp || bp.dbp
            }
          }
          // Also check direct bloodPressureSystolic and bloodPressureDiastolic fields
          if (!value) {
            if (metricName.toLowerCase().includes('systolic') || metricName.toLowerCase().includes('sbp')) {
              value = content.bloodPressureSystolic || content.blood_pressure_systolic || content.systolic || content.sbp
            } else if (metricName.toLowerCase().includes('diastolic') || metricName.toLowerCase().includes('dbp')) {
              value = content.bloodPressureDiastolic || content.blood_pressure_diastolic || content.diastolic || content.dbp
            }
          }
        }

        if (value === null || value === undefined || value === '' || isNaN(Number(value))) {
          return null
        }

        return {
          timestamp: record.created_at,
          value: Number(value),
          unit: getMetricUnit(metricName),
          context: { record_id: record.id, data_type: 'vital_signs' },
        }
      })
      .filter((dp): dp is TrendDataPoint => dp !== null)

    console.log(`[extractTrendDataPoints] Extracted ${dataPoints.length} valid data points for metric "${metricName}"`)
    if (dataPoints.length > 0) {
      console.log(`[extractTrendDataPoints] Sample data point:`, dataPoints[0])
    }

    return dataPoints
  } catch (error) {
    console.error('Error extracting trend data points:', error)
    return []
  }
}

/**
 * Get unit for a metric
 */
function getMetricUnit(metricName: string): string {
  const metric = metricName.toLowerCase().replace(/[-_\s]/g, '')

  // Vital Signs
  if (metric.includes('heart') || metric.includes('hr') || metric === 'pulse') return 'bpm'
  if (metric.includes('temp')) return '°C'
  if (metric.includes('bp') || metric.includes('pressure') || metric === 'systolic' || metric === 'diastolic' || metric === 'sbp' || metric === 'dbp') return 'mmHg'
  if (metric.includes('o2') || metric.includes('sat') || metric === 'spo2' || metric.includes('oxygen')) return '%'
  if (metric.includes('resp') || metric === 'rr' || metric.includes('breathing')) return '/min'
  if (metric.includes('pain')) return '/10'
  
  // Lab Values
  if (metric.includes('glucose') || metric.includes('sugar')) return 'mg/dL'
  if (metric.includes('wbc') || metric.includes('leukocyte')) return 'K/μL'
  if (metric.includes('hemoglobin') || metric.includes('hgb') || metric === 'hb') return 'g/dL'
  if (metric.includes('platelet') || metric === 'plt') return 'K/μL'
  if (metric.includes('creatinine')) return 'mg/dL'
  if (metric.includes('sodium') || metric === 'na') return 'mEq/L'
  if (metric.includes('potassium') || metric === 'k') return 'mEq/L'

  return ''
}
