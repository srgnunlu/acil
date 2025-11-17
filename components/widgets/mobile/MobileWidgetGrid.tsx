'use client'

/**
 * Mobile Widget Grid
 *
 * Mobile-optimized widget layout with swipe gestures and touch interactions
 */

import { useState, useRef } from 'react'
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion'
import { MoreVertical, X, Settings, Maximize2 } from 'lucide-react'
import { WidgetInstance } from '@/types/widget.types'
import { getWidgetConfig } from '@/lib/widgets/widget-catalog'
import { triggerHaptic } from '@/lib/utils/haptics'

interface MobileWidgetGridProps {
  widgets: WidgetInstance[]
  onWidgetClick?: (widget: WidgetInstance) => void
  onWidgetRemove?: (widgetId: string) => void
  onWidgetSettings?: (widgetId: string) => void
  editable?: boolean
  children?: React.ReactNode
}

/**
 * Mobile Widget Grid
 *
 * Optimized for mobile screens with swipe-to-remove and touch interactions
 */
export function MobileWidgetGrid({
  widgets,
  onWidgetClick,
  onWidgetRemove,
  onWidgetSettings,
  editable = false,
  children,
}: MobileWidgetGridProps) {
  return (
    <div className="space-y-4 pb-20">
      {widgets.map((widget) => (
        <MobileWidget
          key={widget.id}
          widget={widget}
          onClick={() => onWidgetClick?.(widget)}
          onRemove={() => onWidgetRemove?.(widget.id)}
          onSettings={() => onWidgetSettings?.(widget.id)}
          editable={editable}
        />
      ))}
      {children}
    </div>
  )
}

/**
 * Mobile Widget Card
 *
 * Individual widget with swipe-to-remove and touch interactions
 */
interface MobileWidgetProps {
  widget: WidgetInstance
  onClick?: () => void
  onRemove?: () => void
  onSettings?: () => void
  editable?: boolean
}

function MobileWidget({
  widget,
  onClick,
  onRemove,
  onSettings,
  editable = false,
}: MobileWidgetProps) {
  const config = getWidgetConfig(widget.type)
  const [showActions, setShowActions] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const x = useMotionValue(0)
  const opacity = useTransform(x, [-150, 0, 150], [0.5, 1, 0.5])
  const backgroundColor = useTransform(
    x,
    [-150, -75, 0, 75, 150],
    ['#ef4444', '#f87171', '#ffffff', '#f87171', '#ef4444']
  )

  const handleDragEnd = (_event: any, info: PanInfo) => {
    setIsDragging(false)

    // Swipe left or right to remove
    if (Math.abs(info.offset.x) > 150) {
      triggerHaptic('warning')
      onRemove?.()
    }
  }

  const handleDragStart = () => {
    setIsDragging(true)
    triggerHaptic('light')
  }

  return (
    <div className="relative">
      {/* Background (shown when swiping) */}
      {editable && (
        <motion.div
          style={{ backgroundColor }}
          className="absolute inset-0 rounded-xl flex items-center justify-center"
        >
          <X className="w-6 h-6 text-white" />
        </motion.div>
      )}

      {/* Widget Card */}
      <motion.div
        drag={editable ? 'x' : false}
        dragConstraints={{ left: -200, right: 200 }}
        dragElastic={0.2}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        style={{ x, opacity }}
        className={`
          relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm
          ${!isDragging && 'active:scale-[0.98]'}
          transition-transform
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg flex items-center justify-center text-xl">
              {config?.icon}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {config?.title}
              </h3>
              {config?.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {config.description}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {onSettings && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  triggerHaptic('light')
                  onSettings()
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg active:scale-95 transition-all"
              >
                <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                triggerHaptic('light')
                onClick?.()
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg active:scale-95 transition-all"
            >
              <Maximize2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Placeholder - Replace with actual widget content */}
          <div className="flex items-center justify-center h-32 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {config?.title} Widget
            </p>
          </div>
        </div>

        {/* Swipe Hint */}
        {editable && !isDragging && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-gray-400 dark:text-gray-500">
            ← Kaydırarak kaldır →
          </div>
        )}
      </motion.div>
    </div>
  )
}

/**
 * Mobile Widget Carousel
 *
 * Swipeable carousel for multiple widgets
 */
interface MobileWidgetCarouselProps {
  widgets: WidgetInstance[]
  onWidgetClick?: (widget: WidgetInstance) => void
}

export function MobileWidgetCarousel({ widgets, onWidgetClick }: MobileWidgetCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const handleDragEnd = (_event: any, info: PanInfo) => {
    const threshold = 50

    if (info.offset.x > threshold && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      triggerHaptic('light')
    } else if (info.offset.x < -threshold && currentIndex < widgets.length - 1) {
      setCurrentIndex(currentIndex + 1)
      triggerHaptic('light')
    }
  }

  return (
    <div className="relative overflow-hidden">
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        animate={{ x: -currentIndex * 100 + '%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="flex"
      >
        {widgets.map((widget) => {
          const config = getWidgetConfig(widget.type)

          return (
            <div key={widget.id} className="w-full flex-shrink-0 px-4">
              <div
                onClick={() => {
                  triggerHaptic('light')
                  onWidgetClick?.(widget)
                }}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 active:scale-95 transition-transform"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{config?.icon}</span>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {config?.title}
                  </h3>
                </div>

                <div className="flex items-center justify-center h-48 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {config?.title} Widget
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </motion.div>

      {/* Indicators */}
      <div className="flex justify-center gap-2 mt-4">
        {widgets.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentIndex(index)
              triggerHaptic('light')
            }}
            className={`
              h-2 rounded-full transition-all
              ${
                index === currentIndex
                  ? 'bg-blue-600 dark:bg-blue-400 w-8'
                  : 'bg-gray-300 dark:bg-gray-600 w-2'
              }
            `}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * Mobile Widget Stack
 *
 * Stacked cards like Tinder with swipe gestures
 */
interface MobileWidgetStackProps {
  widgets: WidgetInstance[]
  onWidgetDismiss?: (widget: WidgetInstance) => void
}

export function MobileWidgetStack({ widgets, onWidgetDismiss }: MobileWidgetStackProps) {
  const [visibleWidgets, setVisibleWidgets] = useState(widgets)

  const handleDismiss = (widget: WidgetInstance) => {
    setVisibleWidgets((prev) => prev.filter((w) => w.id !== widget.id))
    onWidgetDismiss?.(widget)
    triggerHaptic('medium')
  }

  return (
    <div className="relative h-96">
      {visibleWidgets.slice(0, 3).map((widget, index) => {
        const config = getWidgetConfig(widget.type)

        return (
          <motion.div
            key={widget.id}
            drag
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.5}
            onDragEnd={(_event, info) => {
              if (Math.abs(info.offset.x) > 150 || Math.abs(info.offset.y) > 150) {
                handleDismiss(widget)
              }
            }}
            style={{
              zIndex: visibleWidgets.length - index,
              scale: 1 - index * 0.05,
              y: index * 10,
            }}
            className="absolute inset-x-4 top-0 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{config?.icon}</span>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                {config?.title}
              </h3>
            </div>

            <div className="flex items-center justify-center h-56 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {config?.title} Content
              </p>
            </div>

            <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-4">
              ← Kaydırarak geç →
            </p>
          </motion.div>
        )
      })}

      {visibleWidgets.length === 0 && (
        <div className="flex items-center justify-center h-96 text-gray-500 dark:text-gray-400">
          <p>Tüm widget'lar görüntülendi</p>
        </div>
      )}
    </div>
  )
}
