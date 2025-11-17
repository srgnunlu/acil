'use client'

import { useState, useCallback } from 'react'
import { motion, Reorder } from 'framer-motion'
import { GripVertical, Settings, X } from 'lucide-react'
import { WidgetInstance, WidgetLayout } from '@/types/widget.types'
import { getWidgetConfig } from '@/lib/widgets/widget-catalog'

interface WidgetGridProps {
  widgets: WidgetInstance[]
  onLayoutChange?: (widgets: WidgetInstance[]) => void
  onWidgetRemove?: (widgetId: string) => void
  onWidgetSettings?: (widgetId: string) => void
  editable?: boolean
  children?: React.ReactNode
}

/**
 * Simplified Widget Grid
 *
 * Uses Framer Motion's Reorder for simple drag-and-drop
 * For production, consider react-grid-layout for advanced features
 */
export function WidgetGrid({
  widgets,
  onLayoutChange,
  onWidgetRemove,
  onWidgetSettings,
  editable = false,
  children,
}: WidgetGridProps) {
  const [items, setItems] = useState(widgets)

  const handleReorder = useCallback(
    (newOrder: WidgetInstance[]) => {
      setItems(newOrder)
      onLayoutChange?.(newOrder)
    },
    [onLayoutChange]
  )

  // Calculate grid span classes based on widget size
  const getGridClasses = (layout: WidgetLayout) => {
    const colSpan = `md:col-span-${Math.min(layout.w, 12)}`
    const rowSpan = layout.h > 2 ? `md:row-span-${layout.h}` : ''
    return `${colSpan} ${rowSpan}`
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-min">
      {editable ? (
        <Reorder.Group
          axis="y"
          values={items}
          onReorder={handleReorder}
          className="contents"
        >
          {items.map((widget) => {
            const config = getWidgetConfig(widget.type)

            return (
              <Reorder.Item
                key={widget.id}
                value={widget}
                className={`${getGridClasses(widget.layout)} relative`}
              >
                <motion.div
                  layout
                  className="h-full bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  {/* Widget Header */}
                  <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-2">
                      {editable && (
                        <div className="cursor-grab active:cursor-grabbing">
                          <GripVertical className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                      <span className="text-lg">{config?.icon}</span>
                      <h3 className="font-medium text-sm text-gray-900">{config?.title}</h3>
                    </div>

                    {editable && (
                      <div className="flex items-center gap-1">
                        {onWidgetSettings && (
                          <button
                            onClick={() => onWidgetSettings(widget.id)}
                            className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                            title="Ayarlar"
                          >
                            <Settings className="w-4 h-4 text-gray-600" />
                          </button>
                        )}
                        {onWidgetRemove && (
                          <button
                            onClick={() => onWidgetRemove(widget.id)}
                            className="p-1.5 hover:bg-red-100 rounded transition-colors"
                            title="Kaldır"
                          >
                            <X className="w-4 h-4 text-red-600" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Widget Content */}
                  <div className="p-4">
                    {/* Placeholder - Replace with actual widget components */}
                    <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <p className="text-sm text-gray-500">
                        {config?.title} Widget
                      </p>
                    </div>
                  </div>
                </motion.div>
              </Reorder.Item>
            )
          })}
        </Reorder.Group>
      ) : (
        // Non-editable view
        <>
          {widgets.map((widget) => {
            const config = getWidgetConfig(widget.type)

            return (
              <div key={widget.id} className={getGridClasses(widget.layout)}>
                <div className="h-full bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  {/* Widget Header */}
                  <div className="flex items-center gap-2 p-3 border-b border-gray-200 bg-gray-50">
                    <span className="text-lg">{config?.icon}</span>
                    <h3 className="font-medium text-sm text-gray-900">{config?.title}</h3>
                  </div>

                  {/* Widget Content */}
                  <div className="p-4">
                    {/* Placeholder */}
                    <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <p className="text-sm text-gray-500">
                        {config?.title} Widget
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </>
      )}

      {/* Custom children (e.g., add widget button) */}
      {children}
    </div>
  )
}
