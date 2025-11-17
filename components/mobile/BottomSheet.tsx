'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from 'framer-motion'
import { X } from 'lucide-react'
import { triggerHaptic } from '@/lib/utils/haptics'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  snapPoints?: number[] // Percentages: [0.3, 0.6, 0.9]
  defaultSnap?: number // Index of default snap point
  showHandle?: boolean
  showCloseButton?: boolean
  closeOnBackdropClick?: boolean
  enableSwipeDown?: boolean
}

export function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  snapPoints = [0.9],
  defaultSnap = 0,
  showHandle = true,
  showCloseButton = true,
  closeOnBackdropClick = true,
  enableSwipeDown = true,
}: BottomSheetProps) {
  const [currentSnapIndex, setCurrentSnapIndex] = useState(defaultSnap)
  const y = useMotionValue(0)
  const sheetRef = useRef<HTMLDivElement>(null)

  const currentSnapPoint = snapPoints[currentSnapIndex]
  const sheetHeight = useTransform(y, (value) => {
    const windowHeight = window.innerHeight
    const snapHeight = windowHeight * currentSnapPoint
    return Math.max(0, snapHeight - value)
  })

  useEffect(() => {
    if (isOpen) {
      triggerHaptic('light')
    }
  }, [isOpen])

  const handleDragEnd = (_: any, info: PanInfo) => {
    const offsetY = info.offset.y
    const velocityY = info.velocity.y
    const windowHeight = window.innerHeight

    // Close if dragged down significantly
    if (enableSwipeDown && (offsetY > windowHeight * 0.3 || velocityY > 500)) {
      triggerHaptic('medium')
      onClose()
      return
    }

    // Snap to nearest point
    const currentHeight = windowHeight * currentSnapPoint - offsetY
    const currentPercentage = currentHeight / windowHeight

    let closestSnapIndex = 0
    let minDiff = Math.abs(snapPoints[0] - currentPercentage)

    snapPoints.forEach((point, index) => {
      const diff = Math.abs(point - currentPercentage)
      if (diff < minDiff) {
        minDiff = diff
        closestSnapIndex = index
      }
    })

    if (closestSnapIndex !== currentSnapIndex) {
      triggerHaptic('selection')
    }

    setCurrentSnapIndex(closestSnapIndex)
    y.set(0)
  }

  const handleClose = () => {
    triggerHaptic('light')
    onClose()
  }

  const handleBackdropClick = () => {
    if (closeOnBackdropClick) {
      handleClose()
    }
  }

  // Keyboard support
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={handleBackdropClick}
          />

          {/* Bottom Sheet */}
          <motion.div
            ref={sheetRef}
            initial={{ y: '100%' }}
            animate={{ y: `${(1 - currentSnapPoint) * 100}%` }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300,
            }}
            drag={enableSwipeDown ? 'y' : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            style={{ y }}
            className="fixed bottom-0 left-0 right-0 z-50
              bg-white rounded-t-3xl shadow-2xl
              max-h-screen overflow-hidden
              touch-none"
          >
            {/* Handle */}
            {showHandle && (
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
              </div>
            )}

            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                {title && <h2 className="text-lg font-semibold text-gray-900">{title}</h2>}
                {showCloseButton && (
                  <button
                    onClick={handleClose}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Kapat"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div
              className="overflow-y-auto overscroll-contain"
              style={{
                maxHeight: `calc(${currentSnapPoint * 100}vh - ${title || showCloseButton ? '80px' : '20px'})`,
              }}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Example usage component
export function BottomSheetExample() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Bottom Sheet</button>

      <BottomSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Hasta Filtrele"
        snapPoints={[0.3, 0.6, 0.9]}
        defaultSnap={1}
      >
        <div className="p-6">
          <p>Bottom sheet content goes here...</p>
        </div>
      </BottomSheet>
    </>
  )
}
