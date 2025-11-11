'use client'

import { RealtimeStatusIndicator } from '@/components/realtime/RealtimeStatusIndicator'
import { useRealtimeContext } from '@/contexts/RealtimeContext'
import type { ConnectionStatus } from '@/types/realtime.types'

export function RealtimeStatusHeader() {
  const { status } = useRealtimeContext()

  return <RealtimeStatusIndicator status={status as ConnectionStatus} showLabel={true} />
}
