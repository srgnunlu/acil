import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { requireAdmin } from '@/lib/middleware/admin-auth'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin()
    if (authResult.error) {
      return authResult.error
    }

    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const model = searchParams.get('model')
    const operation = searchParams.get('operation')
    const groupBy = searchParams.get('group_by') || 'day' // day, week, month, model, operation

    // Calculate date range
    const end = endDate ? new Date(endDate) : new Date()
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Default: last 30 days

    // Build query
    let query = supabase
      .from('ai_usage_logs')
      .select('*')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .eq('success', true) // Only count successful requests

    // Apply filters
    if (model) {
      query = query.ilike('model', `%${model}%`)
    }

    if (operation) {
      query = query.eq('operation', operation)
    }

    const { data: logs, error } = await query

    if (error) {
      logger.error({ error }, 'Failed to fetch AI costs')
      return NextResponse.json({ error: 'Failed to fetch AI costs' }, { status: 500 })
    }

    // Calculate totals
    const totalCost = logs?.reduce((sum, log) => sum + (log.total_cost || 0), 0) || 0
    const totalRequests = logs?.length || 0
    const totalInputTokens = logs?.reduce((sum, log) => sum + (log.input_tokens || 0), 0) || 0
    const totalOutputTokens = logs?.reduce((sum, log) => sum + (log.output_tokens || 0), 0) || 0
    const totalTokens = totalInputTokens + totalOutputTokens

    // Group by model
    const byModel: Record<string, { cost: number; requests: number; tokens: number }> = {}
    logs?.forEach((log) => {
      const modelName = log.model || 'unknown'
      if (!byModel[modelName]) {
        byModel[modelName] = { cost: 0, requests: 0, tokens: 0 }
      }
      byModel[modelName].cost += log.total_cost || 0
      byModel[modelName].requests += 1
      byModel[modelName].tokens += (log.input_tokens || 0) + (log.output_tokens || 0)
    })

    // Group by operation
    const byOperation: Record<string, { cost: number; requests: number; tokens: number }> = {}
    logs?.forEach((log) => {
      const op = log.operation || 'unknown'
      if (!byOperation[op]) {
        byOperation[op] = { cost: 0, requests: 0, tokens: 0 }
      }
      byOperation[op].cost += log.total_cost || 0
      byOperation[op].requests += 1
      byOperation[op].tokens += (log.input_tokens || 0) + (log.output_tokens || 0)
    })

    // Group by time period
    const byTime: Record<string, { cost: number; requests: number; tokens: number; date: string }> = {}
    logs?.forEach((log) => {
      const date = new Date(log.created_at)
      let key: string

      if (groupBy === 'day') {
        key = date.toISOString().split('T')[0] // YYYY-MM-DD
      } else if (groupBy === 'week') {
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        key = weekStart.toISOString().split('T')[0]
      } else if (groupBy === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` // YYYY-MM
      } else {
        key = date.toISOString().split('T')[0]
      }

      if (!byTime[key]) {
        byTime[key] = { cost: 0, requests: 0, tokens: 0, date: key }
      }
      byTime[key].cost += log.total_cost || 0
      byTime[key].requests += 1
      byTime[key].tokens += (log.input_tokens || 0) + (log.output_tokens || 0)
    })

    // Convert to array and sort
    const timeSeries = Object.values(byTime).sort((a, b) => a.date.localeCompare(b.date))

    // Calculate average cost per request
    const avgCostPerRequest = totalRequests > 0 ? totalCost / totalRequests : 0

    // Calculate average tokens per request
    const avgTokensPerRequest = totalRequests > 0 ? totalTokens / totalRequests : 0

    // Get cost trends (compare first half vs second half)
    const sortedLogs = [...(logs || [])].sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
    const midpoint = Math.floor(sortedLogs.length / 2)
    const firstHalfCost = sortedLogs
      .slice(0, midpoint)
      .reduce((sum, log) => sum + (log.total_cost || 0), 0)
    const secondHalfCost = sortedLogs
      .slice(midpoint)
      .reduce((sum, log) => sum + (log.total_cost || 0), 0)
    const costTrend = firstHalfCost > 0 ? ((secondHalfCost - firstHalfCost) / firstHalfCost) * 100 : 0

    return NextResponse.json({
      summary: {
        total_cost: totalCost,
        total_requests: totalRequests,
        total_tokens: totalTokens,
        total_input_tokens: totalInputTokens,
        total_output_tokens: totalOutputTokens,
        avg_cost_per_request: avgCostPerRequest,
        avg_tokens_per_request: avgTokensPerRequest,
        cost_trend_percent: costTrend,
        date_range: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
      },
      breakdown: {
        by_model: byModel,
        by_operation: byOperation,
        by_time: timeSeries,
      },
    })
  } catch (error) {
    logger.error({ error }, 'Admin AI costs API error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

