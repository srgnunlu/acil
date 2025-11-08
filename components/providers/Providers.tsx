'use client'

import { ReactNode } from 'react'
import { ThemeProvider } from '@/lib/contexts/ThemeContext'
import { ToastProvider } from '@/components/ui/Toast'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>{children}</ToastProvider>
    </ThemeProvider>
  )
}
