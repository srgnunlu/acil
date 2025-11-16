'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

let toastListeners: Array<(toasts: Toast[]) => void> = []
let toasts: Toast[] = []

const addToast = (toast: Omit<Toast, 'id'>) => {
  const id = Math.random().toString(36).substring(7)
  const newToast = { ...toast, id }
  toasts = [...toasts, newToast]
  toastListeners.forEach((listener) => listener([...toasts]))

  // Auto remove after duration
  const duration = toast.duration || 5000
  setTimeout(() => {
    removeToast(id)
  }, duration)
}

const removeToast = (id: string) => {
  toasts = toasts.filter((t) => t.id !== id)
  toastListeners.forEach((listener) => listener([...toasts]))
}

export const toast = {
  success: (message: string, duration?: number) => addToast({ message, type: 'success', duration }),
  error: (message: string, duration?: number) => addToast({ message, type: 'error', duration }),
  warning: (message: string, duration?: number) => addToast({ message, type: 'warning', duration }),
  info: (message: string, duration?: number) => addToast({ message, type: 'info', duration }),
}

export function AdminToast() {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>([])

  useEffect(() => {
    toastListeners.push(setCurrentToasts)
    // Use setTimeout to avoid synchronous setState in effect
    setTimeout(() => {
      setCurrentToasts([...toasts])
    }, 0)

    return () => {
      toastListeners = toastListeners.filter((listener) => listener !== setCurrentToasts)
    }
  }, [])

  const getIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />
    }
  }

  const getBgColor = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'info':
        return 'bg-blue-50 border-blue-200'
    }
  }

  if (currentToasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {currentToasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 p-4 rounded-lg border shadow-lg min-w-[300px] max-w-md ${getBgColor(toast.type)} animate-in slide-in-from-right`}
        >
          {getIcon(toast.type)}
          <p className="flex-1 text-sm font-medium text-gray-900">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}

