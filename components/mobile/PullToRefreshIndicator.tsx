'use client'

import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import { usePullToRefresh } from '@/lib/hooks/usePullToRefresh'

interface PullToRefreshIndicatorProps {
  onRefresh: () => Promise<void>
  enabled?: boolean
  children: React.ReactNode
}

export function PullToRefreshIndicator({
  onRefresh,
  enabled = true,
  children,
}: PullToRefreshIndicatorProps) {
  const { pullDistance, isRefreshing, shouldTrigger } = usePullToRefresh({
    onRefresh,
    enabled,
  })

  const rotation = (pullDistance / 80) * 360
  const opacity = Math.min(pullDistance / 80, 1)

  return (
    <div className="relative">
      {/* Pull-to-Refresh Indicator */}
      <motion.div
        className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-safe"
        style={{
          opacity,
          y: Math.min(pullDistance, 80),
        }}
      >
        <div
          className={`p-3 rounded-full shadow-lg transition-colors ${
            shouldTrigger ? 'bg-blue-600' : 'bg-white'
          }`}
        >
          <motion.div
            animate={{
              rotate: isRefreshing ? 360 : rotation,
            }}
            transition={{
              duration: isRefreshing ? 1 : 0,
              repeat: isRefreshing ? Infinity : 0,
              ease: 'linear',
            }}
          >
            <RefreshCw
              className={`w-6 h-6 ${shouldTrigger ? 'text-white' : 'text-blue-600'}`}
            />
          </motion.div>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        style={{
          y: Math.min(pullDistance * 0.5, 40),
        }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      >
        {children}
      </motion.div>
    </div>
  )
}
