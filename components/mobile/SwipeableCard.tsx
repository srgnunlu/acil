'use client'

// Swipeable Card Component with Actions
// Phase 12 - PWA Enhancement

import { ReactNode } from 'react'
import { useSwipeGesture } from '@/lib/hooks/useSwipeGesture'
import { Trash2, Edit, Eye } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

export interface SwipeAction {
  icon: ReactNode
  label: string
  color: string
  onAction: () => void
}

interface SwipeableCardProps {
  children: ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  leftActions?: SwipeAction[]
  rightActions?: SwipeAction[]
  className?: string
}

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftActions = [],
  rightActions = [],
  className = '',
}: SwipeableCardProps) {
  const [showLeftActions, setShowLeftActions] = useState(false)
  const [showRightActions, setShowRightActions] = useState(false)

  const { ref } = useSwipeGesture<HTMLDivElement>({
    onSwipeLeft: () => {
      onSwipeLeft?.()
      if (rightActions.length > 0) {
        setShowRightActions(true)
        setShowLeftActions(false)
        // Auto-hide after 3 seconds
        setTimeout(() => setShowRightActions(false), 3000)
      }
    },
    onSwipeRight: () => {
      onSwipeRight?.()
      if (leftActions.length > 0) {
        setShowLeftActions(true)
        setShowRightActions(false)
        // Auto-hide after 3 seconds
        setTimeout(() => setShowLeftActions(false), 3000)
      }
    },
  })

  const handleActionClick = (action: SwipeAction) => {
    action.onAction()
    setShowLeftActions(false)
    setShowRightActions(false)
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Left Actions */}
      <AnimatePresence>
        {showLeftActions && leftActions.length > 0 && (
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            className="absolute left-0 top-0 bottom-0 flex items-center gap-2 px-2"
          >
            {leftActions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleActionClick(action)}
                className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg ${action.color} text-white transition-transform active:scale-95`}
              >
                <div className="h-5 w-5">{action.icon}</div>
                <span className="text-xs font-medium">{action.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right Actions */}
      <AnimatePresence>
        {showRightActions && rightActions.length > 0 && (
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            className="absolute right-0 top-0 bottom-0 flex items-center gap-2 px-2"
          >
            {rightActions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleActionClick(action)}
                className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg ${action.color} text-white transition-transform active:scale-95`}
              >
                <div className="h-5 w-5">{action.icon}</div>
                <span className="text-xs font-medium">{action.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card Content */}
      <div
        ref={ref}
        className={`touch-pan-y ${showLeftActions || showRightActions ? 'pointer-events-none' : ''}`}
        onClick={() => {
          setShowLeftActions(false)
          setShowRightActions(false)
        }}
      >
        {children}
      </div>
    </div>
  )
}

// Example usage component
export function SwipeablePatientCard({ patient, onEdit, onView, onDelete }: {
  patient: { id: string; name: string }
  onEdit: () => void
  onView: () => void
  onDelete: () => void
}) {
  const leftActions: SwipeAction[] = [
    {
      icon: <Eye className="h-full w-full" />,
      label: 'Görüntüle',
      color: 'bg-blue-600 hover:bg-blue-700',
      onAction: onView,
    },
    {
      icon: <Edit className="h-full w-full" />,
      label: 'Düzenle',
      color: 'bg-green-600 hover:bg-green-700',
      onAction: onEdit,
    },
  ]

  const rightActions: SwipeAction[] = [
    {
      icon: <Trash2 className="h-full w-full" />,
      label: 'Sil',
      color: 'bg-red-600 hover:bg-red-700',
      onAction: onDelete,
    },
  ]

  return (
    <SwipeableCard
      leftActions={leftActions}
      rightActions={rightActions}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md"
    >
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{patient.name}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">Hasta ID: {patient.id}</p>
      </div>
    </SwipeableCard>
  )
}
