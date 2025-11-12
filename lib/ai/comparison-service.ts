/**
 * AI Comparison Service
 * Phase 7: Compares AI analyses to detect changes and trends
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  AIComparison,
  ChangesDetected,
  OverallTrend,
  ComparisonType,
} from '@/types/ai-monitoring.types'
import type { AIAnalysisResponse } from '@/types/patient.types'
import { analyzePatient } from './openai'

// ============================================
// COMPARISON CREATION
// ============================================

/**
 * Compare two AI analyses and detect changes
 */
export async function compareAnalyses(
  supabase: SupabaseClient,
  patientId: string,
  workspaceId: string,
  baselineAnalysisId: string,
  currentAnalysisId: string,
  comparisonType: ComparisonType = 'sequential'
): Promise<AIComparison | null> {
  try {
    // Fetch both analyses
    const { data: baselineAnalysis } = await supabase
      .from('ai_analyses')
      .select('*')
      .eq('id', baselineAnalysisId)
      .single()

    const { data: currentAnalysis } = await supabase
      .from('ai_analyses')
      .select('*')
      .eq('id', currentAnalysisId)
      .single()

    if (!baselineAnalysis || !currentAnalysis) {
      console.error('One or both analyses not found')
      return null
    }

    // Extract AI responses
    const baselineResponse = baselineAnalysis.ai_response as AIAnalysisResponse
    const currentResponse = currentAnalysis.ai_response as AIAnalysisResponse

    // Detect changes
    const changesDetected = detectChanges(baselineResponse, currentResponse)

    // Determine overall trend
    const overallTrend = determineOverallTrend(changesDetected)

    // Calculate significance score
    const significanceScore = calculateSignificanceScore(changesDetected)

    // Calculate time interval
    const timeInterval = calculateTimeInterval(
      baselineAnalysis.created_at,
      currentAnalysis.created_at
    )

    // Generate AI summary
    const aiSummary = await generateComparisonSummary(
      patientId,
      baselineResponse,
      currentResponse,
      changesDetected,
      timeInterval
    )

    // Create comparison record
    const { data: comparison, error } = await supabase
      .from('ai_comparisons')
      .insert({
        patient_id: patientId,
        workspace_id: workspaceId,
        baseline_analysis_id: baselineAnalysisId,
        current_analysis_id: currentAnalysisId,
        comparison_type: comparisonType,
        changes_detected: changesDetected,
        overall_trend: overallTrend,
        significance_score: significanceScore,
        ai_summary: aiSummary.summary,
        clinical_implications: aiSummary.implications,
        recommendations: aiSummary.recommendations,
        time_interval_hours: timeInterval,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating comparison:', error)
      return null
    }

    return comparison
  } catch (error) {
    console.error('Error in compareAnalyses:', error)
    return null
  }
}

/**
 * Get latest comparison for a patient
 */
export async function getLatestComparison(
  supabase: SupabaseClient,
  patientId: string
): Promise<AIComparison | null> {
  try {
    const { data, error } = await supabase
      .from('ai_comparisons')
      .select('*')
      .eq('patient_id', patientId)
      .order('compared_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.error('Error fetching latest comparison:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getLatestComparison:', error)
    return null
  }
}

/**
 * Get comparison history for a patient
 */
export async function getComparisonHistory(
  supabase: SupabaseClient,
  patientId: string,
  limit: number = 10
): Promise<AIComparison[]> {
  try {
    const { data, error } = await supabase
      .from('ai_comparisons')
      .select('*')
      .eq('patient_id', patientId)
      .order('compared_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching comparison history:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getComparisonHistory:', error)
    return []
  }
}

// ============================================
// CHANGE DETECTION
// ============================================

/**
 * Detect changes between two AI analyses
 */
function detectChanges(
  baseline: AIAnalysisResponse,
  current: AIAnalysisResponse
): ChangesDetected {
  const changes: ChangesDetected = {
    improved: [],
    worsened: [],
    new_findings: [],
    resolved: [],
  }

  // Compare differential diagnoses
  const baselineDx = new Set(baseline.differential_diagnosis || [])
  const currentDx = new Set(current.differential_diagnosis || [])

  currentDx.forEach((dx) => {
    if (!baselineDx.has(dx)) {
      changes.new_findings.push(`New diagnosis: ${dx}`)
    }
  })

  baselineDx.forEach((dx) => {
    if (!currentDx.has(dx)) {
      changes.resolved.push(`Resolved diagnosis: ${dx}`)
    }
  })

  // Compare red flags
  const baselineFlags = new Set(baseline.red_flags || [])
  const currentFlags = new Set(current.red_flags || [])

  currentFlags.forEach((flag) => {
    if (!baselineFlags.has(flag)) {
      changes.worsened.push(`New red flag: ${flag}`)
    }
  })

  baselineFlags.forEach((flag) => {
    if (!currentFlags.has(flag)) {
      changes.improved.push(`Resolved red flag: ${flag}`)
    }
  })

  // Compare recommended tests priority
  const baselineUrgentTests =
    baseline.recommended_tests?.filter((t) => t.priority === 'urgent').length || 0
  const currentUrgentTests =
    current.recommended_tests?.filter((t) => t.priority === 'urgent').length || 0

  if (currentUrgentTests > baselineUrgentTests) {
    changes.worsened.push(
      `Increased urgent tests: ${baselineUrgentTests} → ${currentUrgentTests}`
    )
  } else if (currentUrgentTests < baselineUrgentTests) {
    changes.improved.push(
      `Decreased urgent tests: ${baselineUrgentTests} → ${currentUrgentTests}`
    )
  }

  // Compare disposition
  if (baseline.disposition && current.disposition) {
    const dispositionSeverity = {
      discharge: 0,
      observe: 1,
      hospitalize: 2,
    }

    const baselineSeverity = dispositionSeverity[baseline.disposition.recommendation] || 1
    const currentSeverity = dispositionSeverity[current.disposition.recommendation] || 1

    if (currentSeverity > baselineSeverity) {
      changes.worsened.push(
        `Disposition escalated: ${baseline.disposition.recommendation} → ${current.disposition.recommendation}`
      )
    } else if (currentSeverity < baselineSeverity) {
      changes.improved.push(
        `Disposition de-escalated: ${baseline.disposition.recommendation} → ${current.disposition.recommendation}`
      )
    }
  }

  // Compare consultation requirements
  if (baseline.consultation?.required && !current.consultation?.required) {
    changes.improved.push('Consultation no longer required')
  } else if (!baseline.consultation?.required && current.consultation?.required) {
    changes.worsened.push('Consultation now required')
  }

  return changes
}

/**
 * Determine overall trend from detected changes
 */
function determineOverallTrend(changes: ChangesDetected): OverallTrend {
  const improvedCount = changes.improved.length
  const worsenedCount = changes.worsened.length
  const newCount = changes.new_findings.length
  const resolvedCount = changes.resolved.length

  const totalChanges = improvedCount + worsenedCount + newCount + resolvedCount

  if (totalChanges === 0) {
    return 'stable'
  }

  // Calculate net change score
  const netScore = improvedCount + resolvedCount - worsenedCount - newCount

  if (Math.abs(netScore) < 2 && totalChanges > 3) {
    return 'mixed'
  }

  if (netScore > 2) {
    return 'improving'
  } else if (netScore < -2) {
    return 'worsening'
  }

  return 'stable'
}

/**
 * Calculate significance score (0-1)
 */
function calculateSignificanceScore(changes: ChangesDetected): number {
  // Weight different types of changes
  const weights = {
    improved: 0.15,
    worsened: 0.25, // Worsening is more significant
    new_findings: 0.20,
    resolved: 0.10,
  }

  let score = 0

  score += changes.improved.length * weights.improved
  score += changes.worsened.length * weights.worsened
  score += changes.new_findings.length * weights.new_findings
  score += changes.resolved.length * weights.resolved

  // Normalize to 0-1 range (assuming max 10 changes would be score of 1)
  return Math.min(1, score / 2)
}

/**
 * Calculate time interval between analyses in hours
 */
function calculateTimeInterval(baselineDate: string, currentDate: string): number {
  const baseline = new Date(baselineDate).getTime()
  const current = new Date(currentDate).getTime()

  const diffMs = current - baseline
  return diffMs / (1000 * 60 * 60) // Convert to hours
}

// ============================================
// AI SUMMARY GENERATION
// ============================================

/**
 * Generate AI summary of comparison
 */
async function generateComparisonSummary(
  patientId: string,
  baseline: AIAnalysisResponse,
  current: AIAnalysisResponse,
  changes: ChangesDetected,
  timeInterval: number
): Promise<{
  summary: string
  implications: string
  recommendations: string[]
}> {
  try {
    // Create a prompt for AI to summarize the comparison
    const prompt = `
Compare two AI analyses for the same patient taken ${timeInterval.toFixed(1)} hours apart:

BASELINE ANALYSIS:
Summary: ${baseline.summary}
Differential Diagnosis: ${baseline.differential_diagnosis?.join(', ') || 'None'}
Red Flags: ${baseline.red_flags?.join(', ') || 'None'}
Disposition: ${baseline.disposition?.recommendation || 'Unknown'}

CURRENT ANALYSIS:
Summary: ${current.summary}
Differential Diagnosis: ${current.differential_diagnosis?.join(', ') || 'None'}
Red Flags: ${current.red_flags?.join(', ') || 'None'}
Disposition: ${current.disposition?.recommendation || 'Unknown'}

DETECTED CHANGES:
Improved: ${changes.improved.join('; ') || 'None'}
Worsened: ${changes.worsened.join('; ') || 'None'}
New Findings: ${changes.new_findings.join('; ') || 'None'}
Resolved: ${changes.resolved.join('; ') || 'None'}

Provide a concise clinical summary (2-3 sentences), clinical implications, and 3-5 recommendations.
Return as JSON: { "summary": "...", "implications": "...", "recommendations": ["...", "..."] }
`

    // For now, use rule-based fallback
    // In production, you could use OpenAI API here
    const summary = generateRuleBasedSummary(changes, timeInterval)

    return summary
  } catch (error) {
    console.error('Error generating comparison summary:', error)
    return generateRuleBasedSummary(changes, timeInterval)
  }
}

/**
 * Rule-based summary generation (fallback)
 */
function generateRuleBasedSummary(
  changes: ChangesDetected,
  timeInterval: number
): {
  summary: string
  implications: string
  recommendations: string[]
} {
  const totalChanges =
    changes.improved.length + changes.worsened.length + changes.new_findings.length

  let summary = ''
  let implications = ''
  const recommendations: string[] = []

  if (totalChanges === 0) {
    summary = `Patient condition remains stable over ${timeInterval.toFixed(1)} hours with no significant changes detected.`
    implications = 'Continue current management plan and monitoring.'
    recommendations.push('Maintain current treatment regimen', 'Continue routine monitoring')
  } else if (changes.worsened.length > changes.improved.length) {
    summary = `Patient showing clinical deterioration with ${changes.worsened.length} worsening findings over ${timeInterval.toFixed(1)} hours.`
    implications = 'Clinical deterioration requires immediate attention and possible escalation of care.'
    recommendations.push(
      'Urgent clinical review required',
      'Consider escalation of care level',
      'Reassess treatment effectiveness',
      'Increase monitoring frequency'
    )
  } else if (changes.improved.length > changes.worsened.length) {
    summary = `Patient showing clinical improvement with ${changes.improved.length} improving findings and ${changes.resolved.length} resolved issues.`
    implications = 'Positive response to treatment. Continue monitoring for sustained improvement.'
    recommendations.push(
      'Continue current treatment',
      'Monitor for sustained improvement',
      'Consider de-escalation if improvement continues'
    )
  } else {
    summary = `Mixed clinical picture with both improving (${changes.improved.length}) and worsening (${changes.worsened.length}) findings.`
    implications = 'Complex clinical picture requires careful ongoing assessment.'
    recommendations.push(
      'Detailed clinical reassessment',
      'Review treatment plan',
      'Increase monitoring frequency'
    )
  }

  // Add specific recommendations based on changes
  if (changes.new_findings.length > 0) {
    recommendations.push(`Investigate new findings: ${changes.new_findings[0]}`)
  }

  return { summary, implications, recommendations }
}

// ============================================
// AUTO-COMPARISON TRIGGERING
// ============================================

/**
 * Auto-compare latest two analyses for a patient
 */
export async function autoCompareLatestAnalyses(
  supabase: SupabaseClient,
  patientId: string,
  workspaceId: string
): Promise<AIComparison | null> {
  try {
    // Get latest two analyses
    const { data: analyses, error } = await supabase
      .from('ai_analyses')
      .select('id, created_at')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .limit(2)

    if (error || !analyses || analyses.length < 2) {
      console.log('Not enough analyses to compare')
      return null
    }

    // Compare them (most recent is current, previous is baseline)
    return await compareAnalyses(
      supabase,
      patientId,
      workspaceId,
      analyses[1].id, // baseline (older)
      analyses[0].id, // current (newer)
      'sequential'
    )
  } catch (error) {
    console.error('Error in autoCompareLatestAnalyses:', error)
    return null
  }
}

/**
 * Get baseline analysis for comparison
 * (First analysis or analysis from admission)
 */
export async function getBaselineAnalysis(
  supabase: SupabaseClient,
  patientId: string
): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('ai_analyses')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (error) {
      console.error('Error fetching baseline analysis:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getBaselineAnalysis:', error)
    return null
  }
}
