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
  if (dataPointCount < 3) {
    return 'insufficient_data'
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
  const prompt = `
Analyze the following patient metric trend:

Metric: ${metricName} (${metricType})
Trend Direction: ${trendDirection}

Statistical Analysis:
- Mean: ${stats.mean.toFixed(2)}
- Standard Deviation: ${stats.std_dev.toFixed(2)}
- Min: ${stats.min}
- Max: ${stats.max}
- Slope: ${stats.slope.toFixed(4)}
- R²: ${stats.r_squared?.toFixed(3)}

Data Points (${dataPoints.length} measurements):
${dataPoints
  .slice(-10)
  .map((dp) => `- ${new Date(dp.timestamp).toLocaleString()}: ${dp.value}${dp.unit || ''}`)
  .join('\n')}

${patientContext ? `\nPatient Context:\n${JSON.stringify(patientContext, null, 2)}` : ''}

Provide:
1. Clinical interpretation (2-3 sentences)
2. Clinical significance (urgent/important/routine)
3. Should this trigger an alert? (yes/no and why)

Return JSON format:
{
  "interpretation": "...",
  "significance": "...",
  "should_alert": true/false,
  "alert_reason": "..."
}
`

  try {
    // Use a lightweight OpenAI call for trend interpretation
    const response = await analyzePatient(
      {
        demographics: patientContext?.demographics as never,
      },
      'updated'
    )

    // Parse response (simplified - you'd want better parsing)
    return {
      ai_interpretation: `${trendDirection.toUpperCase()} trend detected in ${metricName}. ${response.summary || ''}`,
      clinical_significance: `Mean: ${stats.mean.toFixed(1)}, Range: ${stats.min}-${stats.max}`,
      should_alert: trendDirection === 'worsening' && Math.abs(stats.slope) > 0.1,
    }
  } catch (error) {
    console.error('Error generating trend interpretation:', error)

    // Fallback interpretation
    return {
      ai_interpretation: `${trendDirection} trend observed in ${metricName}. Mean value: ${stats.mean.toFixed(1)}, with ${dataPoints.length} data points.`,
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

  // This is a simplified version - you'd need to adjust based on your actual data structure
  // For vital signs stored in patient_data or a separate vital_signs table

  try {
    // Example: Query vital signs history
    const { data, error } = await supabase
      .from('vital_signs_history') // Assuming you have this table
      .select('*')
      .eq('patient_id', patientId)
      .gte('measured_at', periodStart)
      .order('measured_at', { ascending: true })

    if (error) throw error

    // Map to trend data points
    const dataPoints: TrendDataPoint[] = data
      .map((record: any) => {
        const value = record[metricName] || record.vital_signs?.[metricName]
        if (value === null || value === undefined) return null

        return {
          timestamp: record.measured_at,
          value: Number(value),
          unit: getMetricUnit(metricName),
          context: { record_id: record.id },
        }
      })
      .filter((dp): dp is TrendDataPoint => dp !== null)

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
  const metric = metricName.toLowerCase()

  if (metric.includes('heart') || metric.includes('hr')) return 'bpm'
  if (metric.includes('temp')) return '°C'
  if (metric.includes('bp') || metric.includes('pressure')) return 'mmHg'
  if (metric.includes('o2') || metric.includes('sat')) return '%'
  if (metric.includes('resp')) return '/min'
  if (metric.includes('glucose')) return 'mg/dL'
  if (metric.includes('wbc')) return 'K/μL'
  if (metric.includes('hemoglobin') || metric.includes('hgb')) return 'g/dL'

  return ''
}
