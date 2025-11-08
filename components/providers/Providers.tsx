'use client'

import { ReactNode } from 'react'
import { ToastProvider } from '@/components/ui/Toast'
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      {children}
      <PWAInstallPrompt />
    </ToastProvider>
  )
}
