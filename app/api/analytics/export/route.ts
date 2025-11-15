import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

/**
 * POST /api/analytics/export
 * Export analytics data to various formats
 * Body: { workspace_id, report_type, format, start_date, end_date }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { workspace_id, report_type, format, start_date, end_date } = body

    if (!workspace_id || !report_type || !format) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify workspace membership
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get data based on report type
    let data
    switch (report_type) {
      case 'workspace_overview': {
        const { data: overview } = await supabase.rpc('get_workspace_overview', {
          p_workspace_id: workspace_id,
        })
        data = overview
        break
      }
      case 'team_performance': {
        const { data: team } = await supabase.rpc('get_team_performance', {
          p_workspace_id: workspace_id,
          p_start_date: start_date,
          p_end_date: end_date,
        })
        data = team
        break
      }
      case 'clinical_metrics': {
        const { data: clinical } = await supabase.rpc('get_clinical_metrics', {
          p_workspace_id: workspace_id,
          p_start_date: start_date,
          p_end_date: end_date,
        })
        data = clinical
        break
      }
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    }

    // Format conversion
    if (format === 'csv') {
      const csv = convertToCSV(data)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${report_type}_${new Date().toISOString()}.csv"`,
        },
      })
    } else if (format === 'json') {
      return NextResponse.json({
        success: true,
        data,
        metadata: {
          report_type,
          workspace_id,
          generated_at: new Date().toISOString(),
          generated_by: user.id,
        },
      })
    } else if (format === 'excel') {
      // For Excel export, we'll return JSON for now
      // In a real implementation, use a library like xlsx
      return NextResponse.json({
        success: true,
        message: 'Excel export coming soon',
        data,
      })
    }

    return NextResponse.json({ error: 'Unsupported format' }, { status: 400 })
  } catch (error: unknown) {
    const err = error as Error
    logger.error({ error: err }, 'Export error')
    return NextResponse.json({ error: err.message || 'Failed to export data' }, { status: 500 })
  }
}

// Helper function to convert JSON to CSV
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertToCSV(data: any): string {
  if (!data) return ''

  // Handle arrays
  if (Array.isArray(data)) {
    if (data.length === 0) return ''

    const headers = Object.keys(data[0])
    const rows = data.map((row) => headers.map((header) => JSON.stringify(row[header] || '')).join(','))

    return [headers.join(','), ...rows].join('\n')
  }

  // Handle objects
  if (typeof data === 'object') {
    const flatData = flattenObject(data)
    return Object.entries(flatData)
      .map(([key, value]) => `${key},${JSON.stringify(value)}`)
      .join('\n')
  }

  return String(data)
}

// Helper to flatten nested objects
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function flattenObject(obj: any, prefix = ''): Record<string, any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Object.keys(obj).reduce((acc: Record<string, any>, key: string) => {
    const prefixedKey = prefix ? `${prefix}.${key}` : key

    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(acc, flattenObject(obj[key], prefixedKey))
    } else {
      acc[prefixedKey] = obj[key]
    }

    return acc
  }, {})
}
