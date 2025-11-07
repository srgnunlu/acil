import { render, screen, waitFor } from '@testing-library/react'
import { AddPatientButton } from '../AddPatientButton'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'

// Mock next/navigation
const mockPush = vi.fn()
const mockRefresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}))

// Mock Supabase client
const mockGetUser = vi.fn()
const mockInsert = vi.fn()
const mockSelect = vi.fn()
const mockSingle = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  }),
}))

describe('AddPatientButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mock chain
    mockFrom.mockReturnValue({
      insert: mockInsert,
    })
    mockInsert.mockReturnValue({
      select: mockSelect,
    })
    mockSelect.mockReturnValue({
      single: mockSingle,
    })
  })

  describe('when user can add patients', () => {
    const props = {
      canAddPatient: true,
      currentCount: 2,
      limit: 3,
      tier: 'free',
    }

    it('should render add patient button', () => {
      render(<AddPatientButton {...props} />)

      expect(screen.getByText('+ Yeni Hasta Ekle')).toBeInTheDocument()
    })

    it('should open modal when button is clicked', async () => {
      const user = userEvent.setup()
      render(<AddPatientButton {...props} />)

      const button = screen.getByText('+ Yeni Hasta Ekle')
      await user.click(button)

      expect(screen.getByText('Yeni Hasta Ekle')).toBeInTheDocument()
      expect(screen.getByLabelText(/Hasta Adı Soyadı/)).toBeInTheDocument()
    })

    it('should close modal when cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(<AddPatientButton {...props} />)

      // Open modal
      await user.click(screen.getByText('+ Yeni Hasta Ekle'))
      expect(screen.getByText('Yeni Hasta Ekle')).toBeInTheDocument()

      // Close modal
      await user.click(screen.getByText('İptal'))
      expect(screen.queryByText('Yeni Hasta Ekle')).not.toBeInTheDocument()
    })

    it('should submit form with valid data', async () => {
      const user = userEvent.setup()
      const mockPatientId = '123e4567-e89b-12d3-a456-426614174000'

      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })

      mockSingle.mockResolvedValue({
        data: { id: mockPatientId },
        error: null,
      })

      render(<AddPatientButton {...props} />)

      // Open modal
      await user.click(screen.getByText('+ Yeni Hasta Ekle'))

      // Fill form
      await user.type(screen.getByLabelText(/Hasta Adı Soyadı/), 'Ahmet Yılmaz')
      await user.type(screen.getByLabelText(/Yaş/), '45')
      await user.selectOptions(screen.getByLabelText(/Cinsiyet/), 'Erkek')

      // Submit
      await user.click(screen.getByRole('button', { name: /^Ekle$/ }))

      await waitFor(() => {
        expect(mockGetUser).toHaveBeenCalled()
        expect(mockFrom).toHaveBeenCalledWith('patients')
        expect(mockInsert).toHaveBeenCalledWith({
          user_id: 'user-123',
          name: 'Ahmet Yılmaz',
          age: 45,
          gender: 'Erkek',
          status: 'active',
        })
        expect(mockPush).toHaveBeenCalledWith(`/dashboard/patients/${mockPatientId}`)
        expect(mockRefresh).toHaveBeenCalled()
      })
    })

    it('should submit form with only required fields', async () => {
      const user = userEvent.setup()
      const mockPatientId = '123e4567-e89b-12d3-a456-426614174000'

      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })

      mockSingle.mockResolvedValue({
        data: { id: mockPatientId },
        error: null,
      })

      render(<AddPatientButton {...props} />)

      // Open modal
      await user.click(screen.getByText('+ Yeni Hasta Ekle'))

      // Fill only required field
      await user.type(screen.getByLabelText(/Hasta Adı Soyadı/), 'Mehmet Demir')

      // Submit
      await user.click(screen.getByRole('button', { name: /^Ekle$/ }))

      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalledWith({
          user_id: 'user-123',
          name: 'Mehmet Demir',
          age: null,
          gender: null,
          status: 'active',
        })
      })
    })

    it('should show loading state during submission', async () => {
      const user = userEvent.setup()

      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })

      mockSingle.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ data: { id: '123' }, error: null }), 100)
          )
      )

      render(<AddPatientButton {...props} />)

      await user.click(screen.getByText('+ Yeni Hasta Ekle'))
      await user.type(screen.getByLabelText(/Hasta Adı Soyadı/), 'Test Patient')

      const submitButton = screen.getByRole('button', { name: /^Ekle$/ })
      await user.click(submitButton)

      expect(screen.getByText('Ekleniyor...')).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
    })

    it('should show error message when user is not authenticated', async () => {
      const user = userEvent.setup()

      mockGetUser.mockResolvedValue({
        data: { user: null },
      })

      render(<AddPatientButton {...props} />)

      await user.click(screen.getByText('+ Yeni Hasta Ekle'))
      await user.type(screen.getByLabelText(/Hasta Adı Soyadı/), 'Test Patient')
      await user.click(screen.getByRole('button', { name: /^Ekle$/ }))

      await waitFor(() => {
        expect(screen.getByText('Kullanıcı oturumu bulunamadı')).toBeInTheDocument()
      })
    })

    it('should show error message when insert fails', async () => {
      const user = userEvent.setup()

      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
      })

      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })

      render(<AddPatientButton {...props} />)

      await user.click(screen.getByText('+ Yeni Hasta Ekle'))
      await user.type(screen.getByLabelText(/Hasta Adı Soyadı/), 'Test Patient')
      await user.click(screen.getByRole('button', { name: /^Ekle$/ }))

      await waitFor(() => {
        expect(screen.getByText('Database error')).toBeInTheDocument()
      })
    })
  })

  describe('when user cannot add patients', () => {
    const props = {
      canAddPatient: false,
      currentCount: 3,
      limit: 3,
      tier: 'free',
    }

    it('should render disabled button', () => {
      render(<AddPatientButton {...props} />)

      const button = screen.getByText('Hasta Ekle')
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('bg-gray-300')
    })

    it('should show alert when disabled button is clicked', async () => {
      const user = userEvent.setup()
      const alertMock = vi.fn()
      window.alert = alertMock

      render(<AddPatientButton {...props} />)

      const button = screen.getByText('Hasta Ekle')
      await user.click(button)

      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledOnce()
      })

      expect(alertMock.mock.calls[0][0]).toContain('Hasta limitinize ulaştınız')
    })

    it('should show upgrade message for free tier users', async () => {
      const user = userEvent.setup()
      const alertMock = vi.fn()
      window.alert = alertMock

      render(<AddPatientButton {...props} />)

      const button = screen.getByText('Hasta Ekle')
      await user.click(button)

      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledOnce()
      })

      expect(alertMock.mock.calls[0][0]).toContain('Pro versiyona geçerek')
    })

    it('should not show modal when disabled', async () => {
      const user = userEvent.setup()
      const alertMock = vi.fn()
      window.alert = alertMock

      render(<AddPatientButton {...props} />)

      const button = screen.getByText('Hasta Ekle')
      await user.click(button)

      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledOnce()
      })

      expect(screen.queryByText('Yeni Hasta Ekle')).not.toBeInTheDocument()
    })
  })
})
