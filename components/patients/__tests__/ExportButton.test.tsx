import { render, screen, waitFor } from '@testing-library/react'
import { ExportButton } from '../ExportButton'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'

// Mock fetch
global.fetch = vi.fn()

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = vi.fn()

describe('ExportButton', () => {
  const mockPatientId = '123e4567-e89b-12d3-a456-426614174000'
  const mockPatientName = 'Ahmet Yılmaz'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render export button', () => {
    render(<ExportButton patientId={mockPatientId} patientName={mockPatientName} />)

    expect(screen.getByText('Rapor İndir')).toBeInTheDocument()
  })

  it('should show dropdown menu when button is clicked', async () => {
    const user = userEvent.setup()
    render(<ExportButton patientId={mockPatientId} patientName={mockPatientName} />)

    const button = screen.getByText('Rapor İndir')
    await user.click(button)

    expect(screen.getByText('PDF Rapor')).toBeInTheDocument()
    expect(screen.getByText('JSON Data')).toBeInTheDocument()
  })

  it('should hide dropdown menu when button is clicked again', async () => {
    const user = userEvent.setup()
    render(<ExportButton patientId={mockPatientId} patientName={mockPatientName} />)

    const button = screen.getByText('Rapor İndir')

    // Open menu
    await user.click(button)
    expect(screen.getByText('PDF Rapor')).toBeInTheDocument()

    // Close menu
    await user.click(button)
    expect(screen.queryByText('PDF Rapor')).not.toBeInTheDocument()
  })

  it('should export JSON when JSON option is clicked', async () => {
    const user = userEvent.setup()
    const mockData = { report: { patient: 'data' } }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    })

    render(<ExportButton patientId={mockPatientId} patientName={mockPatientName} />)

    const button = screen.getByText('Rapor İndir')
    await user.click(button)

    const jsonButton = screen.getByText('JSON Data')
    await user.click(jsonButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(`/api/patients/${mockPatientId}/export`)
    })
  })

  it('should export PDF when PDF option is clicked', async () => {
    const user = userEvent.setup()
    const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      blob: async () => mockBlob,
    })

    render(<ExportButton patientId={mockPatientId} patientName={mockPatientName} />)

    const button = screen.getByText('Rapor İndir')
    await user.click(button)

    const pdfButton = screen.getByText('PDF Rapor')
    await user.click(pdfButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(`/api/patients/${mockPatientId}/export-pdf`)
    })
  })

  it('should show loading state during export', async () => {
    const user = userEvent.setup()

    // Mock a delayed response
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ ok: true, blob: async () => new Blob() }), 100)
        )
    )

    render(<ExportButton patientId={mockPatientId} patientName={mockPatientName} />)

    const button = screen.getByText('Rapor İndir')
    await user.click(button)

    const pdfButton = screen.getByText('PDF Rapor')
    await user.click(pdfButton)

    expect(screen.getByText('Export ediliyor...')).toBeInTheDocument()

    // Get button again from DOM after state change
    const loadingButton = screen.getByRole('button', { name: /export ediliyor/i })
    expect(loadingButton).toBeDisabled()
  })

  it('should show error message when export fails', async () => {
    const user = userEvent.setup()
    const errorMessage = 'Export başarısız'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: errorMessage }),
    })

    render(<ExportButton patientId={mockPatientId} patientName={mockPatientName} />)

    const button = screen.getByText('Rapor İndir')
    await user.click(button)

    const jsonButton = screen.getByText('JSON Data')
    await user.click(jsonButton)

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })

  it('should hide menu after successful export', async () => {
    const user = userEvent.setup()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ report: {} }),
    })

    render(<ExportButton patientId={mockPatientId} patientName={mockPatientName} />)

    const button = screen.getByText('Rapor İndir')
    await user.click(button)

    const jsonButton = screen.getByText('JSON Data')
    await user.click(jsonButton)

    await waitFor(() => {
      expect(screen.queryByText('JSON Data')).not.toBeInTheDocument()
    })
  })

  it('should call fetch with correct endpoint for JSON export', async () => {
    const user = userEvent.setup()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ report: {} }),
    })

    render(<ExportButton patientId={mockPatientId} patientName={mockPatientName} />)

    const button = screen.getByText('Rapor İndir')
    await user.click(button)

    const jsonButton = screen.getByText('JSON Data')
    await user.click(jsonButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(`/api/patients/${mockPatientId}/export`)
    })
  })
})
