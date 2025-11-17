/**
 * @vitest-environment happy-dom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MobileNavigation } from '../MobileNavigation'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/dashboard'),
}))

// Mock hooks
vi.mock('@/lib/hooks/useOnlineStatus', () => ({
  useOnlineStatus: vi.fn(() => ({
    isOffline: false,
    isOnline: true,
    isSlow: false,
    status: 'online',
  })),
}))

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}))

describe('MobileNavigation Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render primary navigation items', () => {
    render(<MobileNavigation />)

    expect(screen.getByText('Ana Sayfa')).toBeInTheDocument()
    expect(screen.getByText('Hastalar')).toBeInTheDocument()
    expect(screen.getByText('Bildirimler')).toBeInTheDocument()
    expect(screen.getByText('Ayarlar')).toBeInTheDocument()
    expect(screen.getByText('Daha Fazla')).toBeInTheDocument()
  })

  it('should highlight active route', () => {
    const { usePathname } = require('next/navigation')
    usePathname.mockReturnValue('/dashboard/patients')

    render(<MobileNavigation />)

    const patientsLink = screen.getByText('Hastalar').closest('a')
    expect(patientsLink).toHaveClass('text-blue-600')
  })

  it('should show offline indicator when offline', () => {
    const { useOnlineStatus } = require('@/lib/hooks/useOnlineStatus')
    useOnlineStatus.mockReturnValue({
      isOffline: true,
      isOnline: false,
      isSlow: false,
      status: 'offline',
    })

    render(<MobileNavigation />)

    expect(screen.getByText('Çevrimdışı Mod')).toBeInTheDocument()
  })

  it('should not show offline indicator when online', () => {
    render(<MobileNavigation />)

    expect(screen.queryByText('Çevrimdışı Mod')).not.toBeInTheDocument()
  })

  it('should open more menu when clicking more button', async () => {
    render(<MobileNavigation />)

    const moreButton = screen.getByText('Daha Fazla').closest('button')!

    fireEvent.click(moreButton)

    await waitFor(() => {
      expect(screen.getByText('Tüm Sayfalar')).toBeInTheDocument()
    })
  })

  it('should show secondary navigation items in more menu', async () => {
    render(<MobileNavigation />)

    const moreButton = screen.getByText('Daha Fazla').closest('button')!
    fireEvent.click(moreButton)

    await waitFor(() => {
      expect(screen.getByText('Görevler')).toBeInTheDocument()
      expect(screen.getByText('Vardiya Devir')).toBeInTheDocument()
      expect(screen.getByText('Analitik')).toBeInTheDocument()
      expect(screen.getByText('Protokoller')).toBeInTheDocument()
      expect(screen.getByText('Workspace')).toBeInTheDocument()
      expect(screen.getByText('Organizasyonlar')).toBeInTheDocument()
      expect(screen.getByText('Admin Panel')).toBeInTheDocument()
    })
  })

  it('should close more menu when clicking close button', async () => {
    render(<MobileNavigation />)

    // Open menu
    const moreButton = screen.getByText('Daha Fazla').closest('button')!
    fireEvent.click(moreButton)

    await waitFor(() => {
      expect(screen.getByText('Tüm Sayfalar')).toBeInTheDocument()
    })

    // Close menu
    const closeButton = screen.getByLabelText('Kapat')
    fireEvent.click(closeButton)

    await waitFor(() => {
      expect(screen.queryByText('Tüm Sayfalar')).not.toBeInTheDocument()
    })
  })

  it('should close more menu when clicking on a menu item', async () => {
    render(<MobileNavigation />)

    // Open menu
    const moreButton = screen.getByText('Daha Fazla').closest('button')!
    fireEvent.click(moreButton)

    await waitFor(() => {
      expect(screen.getByText('Görevler')).toBeInTheDocument()
    })

    // Click on a menu item
    const taskLink = screen.getByText('Görevler').closest('a')!
    fireEvent.click(taskLink)

    await waitFor(() => {
      expect(screen.queryByText('Tüm Sayfalar')).not.toBeInTheDocument()
    })
  })

  it('should close more menu on ESC key', async () => {
    render(<MobileNavigation />)

    // Open menu
    const moreButton = screen.getByText('Daha Fazla').closest('button')!
    fireEvent.click(moreButton)

    await waitFor(() => {
      expect(screen.getByText('Tüm Sayfalar')).toBeInTheDocument()
    })

    // Press ESC
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' })

    await waitFor(() => {
      expect(screen.queryByText('Tüm Sayfalar')).not.toBeInTheDocument()
    })
  })

  it('should not render on login page', () => {
    const { usePathname } = require('next/navigation')
    usePathname.mockReturnValue('/login')

    const { container } = render(<MobileNavigation />)

    expect(container.firstChild).toBeNull()
  })

  it('should not render on register page', () => {
    const { usePathname } = require('next/navigation')
    usePathname.mockReturnValue('/register')

    const { container } = render(<MobileNavigation />)

    expect(container.firstChild).toBeNull()
  })

  it('should show active indicator on more button when on secondary page', () => {
    const { usePathname } = require('next/navigation')
    usePathname.mockReturnValue('/dashboard/tasks')

    render(<MobileNavigation />)

    const moreButton = screen.getByText('Daha Fazla').closest('button')!
    const moreIcon = moreButton.querySelector('svg')

    expect(moreIcon).toHaveClass('text-blue-600')
  })

  it('should show number badge on more button', () => {
    render(<MobileNavigation />)

    const moreButton = screen.getByText('Daha Fazla').closest('button')!
    const badge = moreButton.querySelector('.bg-gray-500')

    expect(badge).toBeInTheDocument()
    expect(badge?.textContent).toBe('7') // 7 secondary items
  })

  it('should have proper ARIA labels', () => {
    render(<MobileNavigation />)

    expect(screen.getByLabelText('Ana Sayfa')).toBeInTheDocument()
    expect(screen.getByLabelText('Hastalar')).toBeInTheDocument()
    expect(screen.getByLabelText('Bildirimler')).toBeInTheDocument()
    expect(screen.getByLabelText('Ayarlar')).toBeInTheDocument()
    expect(screen.getByLabelText('Daha fazla sayfa')).toBeInTheDocument()
  })

  it('should have proper aria-current on active link', () => {
    const { usePathname } = require('next/navigation')
    usePathname.mockReturnValue('/dashboard/patients')

    render(<MobileNavigation />)

    const patientsLink = screen.getByText('Hastalar').closest('a')
    expect(patientsLink).toHaveAttribute('aria-current', 'page')
  })

  it('should have proper aria-expanded on more button', async () => {
    render(<MobileNavigation />)

    const moreButton = screen.getByText('Daha Fazla').closest('button')!

    expect(moreButton).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(moreButton)

    await waitFor(() => {
      expect(moreButton).toHaveAttribute('aria-expanded', 'true')
    })
  })

  it('should prevent body scroll when more menu is open', async () => {
    render(<MobileNavigation />)

    expect(document.body.style.overflow).toBe('')

    const moreButton = screen.getByText('Daha Fazla').closest('button')!
    fireEvent.click(moreButton)

    await waitFor(() => {
      expect(document.body.style.overflow).toBe('hidden')
    })

    const closeButton = screen.getByLabelText('Kapat')
    fireEvent.click(closeButton)

    await waitFor(() => {
      expect(document.body.style.overflow).toBe('unset')
    })
  })
})
