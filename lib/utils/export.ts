/**
 * Data Export Utilities
 *
 * Supports exporting data to various formats:
 * - CSV
 * - JSON
 * - Excel (via SheetJS)
 */

type ExportFormat = 'csv' | 'json' | 'excel'

interface ExportOptions {
  filename?: string
  format: ExportFormat
}

/**
 * Export data to file
 */
export function exportData<T extends Record<string, any>>(
  data: T[],
  options: ExportOptions
): void {
  const { format, filename = `export_${Date.now()}` } = options

  switch (format) {
    case 'csv':
      exportToCSV(data, filename)
      break
    case 'json':
      exportToJSON(data, filename)
      break
    case 'excel':
      exportToExcel(data, filename)
      break
    default:
      throw new Error(`Unsupported export format: ${format}`)
  }
}

/**
 * Export to CSV
 */
function exportToCSV<T extends Record<string, any>>(data: T[], filename: string): void {
  if (data.length === 0) {
    throw new Error('No data to export')
  }

  // Get headers from first object
  const headers = Object.keys(data[0])

  // Build CSV string
  const csvRows = []

  // Add headers
  csvRows.push(headers.map(escapeCSVValue).join(','))

  // Add data rows
  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header]
      return escapeCSVValue(String(value ?? ''))
    })
    csvRows.push(values.join(','))
  }

  const csvString = csvRows.join('\n')

  // Download file
  downloadFile(csvString, `${filename}.csv`, 'text/csv;charset=utf-8;')
}

/**
 * Export to JSON
 */
function exportToJSON<T>(data: T[], filename: string): void {
  const jsonString = JSON.stringify(data, null, 2)
  downloadFile(jsonString, `${filename}.json`, 'application/json;charset=utf-8;')
}

/**
 * Export to Excel
 * Note: This is a simplified version. For production, use SheetJS (xlsx) library
 */
function exportToExcel<T extends Record<string, any>>(data: T[], filename: string): void {
  // For now, export as CSV with .xlsx extension
  // In production, integrate with SheetJS for proper Excel format
  exportToCSV(data, filename)
  console.warn('Excel export not fully implemented. Exported as CSV instead.')
}

/**
 * Escape CSV values
 */
function escapeCSVValue(value: string): string {
  // Escape quotes and wrap in quotes if contains comma, newline, or quote
  if (value.includes(',') || value.includes('\n') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * Download file helper
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Clean up
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

/**
 * Export dashboard stats
 */
export function exportDashboardStats(stats: any, format: ExportFormat): void {
  const data = [
    {
      Metric: 'Aktif Hastalar',
      Value: stats.activePatients,
    },
    {
      Metric: 'Kritik Vakalar',
      Value: stats.criticalPatients,
    },
    {
      Metric: 'Ortalama Kalış Süresi (gün)',
      Value: stats.avgStayDuration,
    },
    {
      Metric: 'Taburcu Hastalar',
      Value: stats.dischargedPatients,
    },
    {
      Metric: 'AI Analiz Sayısı',
      Value: stats.aiAnalysisCount,
    },
    {
      Metric: 'Test Sayısı',
      Value: stats.testCount,
    },
  ]

  exportData(data, {
    format,
    filename: `dashboard_stats_${new Date().toISOString().split('T')[0]}`,
  })
}

/**
 * Export patient list
 */
export function exportPatientList(patients: any[], format: ExportFormat): void {
  const data = patients.map((p) => ({
    'Hasta Adı': p.name,
    Yaş: p.age || '-',
    Cinsiyet: p.gender || '-',
    Durum: p.status || '-',
    'Risk Skoru': p.riskScore || '-',
    'Başvuru Tarihi': p.admissionDate
      ? new Date(p.admissionDate).toLocaleDateString('tr-TR')
      : '-',
  }))

  exportData(data, {
    format,
    filename: `patient_list_${new Date().toISOString().split('T')[0]}`,
  })
}

/**
 * Export activity log
 */
export function exportActivityLog(activities: any[], format: ExportFormat): void {
  const data = activities.map((a) => ({
    Zaman: new Date(a.createdAt).toLocaleString('tr-TR'),
    Tip: a.type,
    Kullanıcı: a.userName || '-',
    Hasta: a.patientName || '-',
    Mesaj: a.message,
  }))

  exportData(data, {
    format,
    filename: `activity_log_${new Date().toISOString().split('T')[0]}`,
  })
}
