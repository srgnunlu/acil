'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AITrend, MetricType, TrendDirection } from '@/types/ai-monitoring.types'
import { TrendingUp, TrendingDown, Minus, Activity, BarChart3, RefreshCw, AlertCircle, Info } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

interface TrendVisualizationProps {
  patientId: string
  metricType?: MetricType
  autoRefresh?: boolean
  refreshInterval?: number
}

export function TrendVisualization({
  patientId,
  metricType,
  autoRefresh = false,
  refreshInterval = 60000,
}: TrendVisualizationProps) {
  const [trends, setTrends] = useState<AITrend[]>([])
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState<string | null>(null) // Track which metric is being calculated
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null)
  const [periodHours, setPeriodHours] = useState(24)
  const [error, setError] = useState<string | null>(null)
  const [showGuide, setShowGuide] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState<string>('')
  
  // Refs to prevent duplicate auto-create calls
  const autoCreateInProgress = useRef(false)
  const lastAutoCreateTime = useRef<number>(0)
  const AUTO_CREATE_COOLDOWN = 30000 // 30 seconds cooldown between auto-creates
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null)
  const supabase = createClient()
  const hasAutoAnalyzedRef = useRef(false)

  const fetchTrends = useCallback(async () => {
    // Don't fetch if patientId is not available
    if (!patientId || (typeof patientId === 'string' && patientId.trim() === '')) {
      setTrends([])
      setLoading(false)
      return []
    }
    
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      params.append('patient_id', patientId)
      if (metricType) params.append('metric_type', metricType)
      params.append('limit', '10')

      const response = await fetch(`/api/ai/trends?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      
      const data = await response.json()
      const fetchedTrends = data.trends || []
      setTrends(fetchedTrends)
      
      if (fetchedTrends.length > 0 && !selectedMetric) {
        setSelectedMetric(fetchedTrends[0].metric_name)
      }
      
      // Show guide if no trends exist
      if (fetchedTrends.length === 0) {
        setShowGuide(true)
      }
      
      return fetchedTrends
    } catch (error) {
      console.error('Failed to fetch trends:', error)
      setError('Trendler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.')
      return []
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, metricType])

  const autoCreateMissingTrends = useCallback(async () => {
    // Prevent duplicate calls with cooldown
    const now = Date.now()
    if (autoCreateInProgress.current || (now - lastAutoCreateTime.current) < AUTO_CREATE_COOLDOWN) {
      if (process.env.NODE_ENV === 'development') {
        console.debug('[Auto-create] Skipped: cooldown active or already in progress')
      }
      return
    }
    
    if (calculating) return // Don't create if already calculating
    
    // Validate patientId before proceeding
    if (!patientId || (typeof patientId === 'string' && patientId.trim() === '')) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Auto-create] patientId is missing or empty, cannot create trends')
      }
      return
    }
    
    try {
      autoCreateInProgress.current = true
      lastAutoCreateTime.current = now
      
      // All available metrics
      const allMetrics = [
        'heartRate',
        'temperature',
        'respiratoryRate',
        'oxygenSaturation',
        'bloodPressureSystolic',
        'bloodPressureDiastolic',
        'painScore',
      ]

      // Get current trends to check what's missing
      const params = new URLSearchParams()
      params.append('patient_id', patientId)
      if (metricType) params.append('metric_type', metricType)
      params.append('limit', '10')

      const response = await fetch(`/api/ai/trends?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch trends for auto-create check')
      }
      
      const data = await response.json()
      const currentTrends = data.trends || []

      // Find metrics that don't have trends yet (group by metric_name and get latest)
      const trendsByMetric = currentTrends.reduce((acc: Record<string, AITrend>, trend: AITrend) => {
        const metricName = trend.metric_name
        if (!acc[metricName] || new Date(trend.calculated_at) > new Date(acc[metricName].calculated_at)) {
          acc[metricName] = trend
        }
        return acc
      }, {})
      
      const existingMetrics = Object.keys(trendsByMetric)
      const missingMetrics = allMetrics.filter(m => !existingMetrics.includes(m))

      if (missingMetrics.length === 0) {
        if (process.env.NODE_ENV === 'development') {
          console.debug('[Auto-create] All trends already exist')
        }
        return // All trends exist
      }

      // Create trends for missing metrics (max 3 at a time to avoid overload)
      const metricsToCreate = missingMetrics.slice(0, 3)
      
      for (const metric of metricsToCreate) {
        try {
          setCalculating(metric)
          
          // Validate patientId
          if (!patientId || (typeof patientId === 'string' && patientId.trim() === '')) {
            console.error('[Auto-create] patientId is missing or empty')
            continue
          }
          
          // Ensure metric_type is always a valid value
          const validMetricType: MetricType = (metricType && ['vital_signs', 'lab_values', 'clinical_scores', 'overall_condition'].includes(metricType))
            ? metricType
            : 'vital_signs'
          
          const requestBody = {
            patient_id: patientId,
            metric_type: validMetricType,
            metric_name: metric,
            period_hours: periodHours,
          }
          
          // Debug log
          if (process.env.NODE_ENV === 'development') {
            console.log('[Auto-create] Request body:', requestBody)
          }
          
          const createResponse = await fetch('/api/ai/trends', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
          })
          
          // Debug log for response
          if (process.env.NODE_ENV === 'development' && !createResponse.ok) {
            const errorData = await createResponse.clone().json().catch(() => ({}))
            console.error('[Auto-create] Error response:', {
              status: createResponse.status,
              error: errorData,
              requestBody,
            })
          }

          if (createResponse.ok) {
            // Successfully created, refresh trends list by calling fetchTrends
            // But we need to avoid circular dependency, so we'll refetch manually
            const refreshParams = new URLSearchParams()
            refreshParams.append('patient_id', patientId)
            if (metricType) refreshParams.append('metric_type', metricType)
            refreshParams.append('limit', '10')
            const refreshResponse = await fetch(`/api/ai/trends?${refreshParams.toString()}`)
            const refreshData = await refreshResponse.json()
            setTrends(refreshData.trends || [])
            if (refreshData.trends?.length > 0 && !selectedMetric) {
              setSelectedMetric(refreshData.trends[0].metric_name)
            }
          } else {
            // Get error details
            const errorData = await createResponse.json().catch(() => ({}))
            
            // Log error details in development
            if (process.env.NODE_ENV === 'development') {
              console.warn(`[Auto-create] Failed to create trend for ${metric}:`, {
                status: createResponse.status,
                error: errorData.error || 'Unknown error',
                message: errorData.message,
                received: errorData.received,
                requestBody,
              })
            }
            
            const isInsufficientData = 
              errorData.data_points_found === 0 || 
              errorData.data_points_found === null ||
              errorData.error === 'Insufficient data points for trend analysis' ||
              (errorData.message && errorData.message.includes('veri noktası'))
            
            if (isInsufficientData) {
              // No data for this metric yet, skip silently (this is normal and expected)
              continue
            }
            
            // For validation errors, skip silently - these are expected during auto-create
            if (errorData.error === 'Missing required fields' || errorData.error === 'Invalid metric_type') {
              // But log in development to help debug
              if (process.env.NODE_ENV === 'development') {
                console.warn(`[Auto-create] Validation error for ${metric}:`, errorData)
              }
              continue
            }
          }
        } catch (error) {
          // Silent fail for auto-creation - completely silent even in development
          // This is expected when there's no data yet
        } finally {
          setCalculating(null)
        }
      }
    } catch (error) {
      // Silent fail - auto-create should never show errors to user
    } finally {
      autoCreateInProgress.current = false
    }
  }, [calculating, patientId, metricType, periodHours, selectedMetric])

  // Auto-analyze trends when page loads
  const autoAnalyzeTrends = useCallback(async () => {
    // Validate patientId
    if (!patientId || (typeof patientId === 'string' && patientId.trim() === '')) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Auto-analyze] patientId is missing or empty:', patientId)
      }
      return
    }
    
    // Check if already analyzing or calculating
    if (isAnalyzing || calculating) {
      if (process.env.NODE_ENV === 'development') {
        console.debug('[Auto-analyze] Already analyzing or calculating, skipping')
      }
      return
    }

    setIsAnalyzing(true)
    setAnalysisProgress('Trend analizi başlatılıyor...')

    try {
      // First fetch existing trends
      const fetchedTrends = await fetchTrends()
      
      // Get all available metrics
      const allMetrics = [
        'heartRate',
        'temperature',
        'respiratoryRate',
        'oxygenSaturation',
        'bloodPressureSystolic',
        'bloodPressureDiastolic',
        'painScore',
      ]

      // Group existing trends by metric_name
      const trendsByMetric = (fetchedTrends || []).reduce((acc: Record<string, AITrend>, trend: AITrend) => {
        const metricName = trend.metric_name
        if (!acc[metricName] || new Date(trend.calculated_at) > new Date(acc[metricName].calculated_at)) {
          acc[metricName] = trend
        }
        return acc
      }, {})

      const existingMetrics = Object.keys(trendsByMetric)
      const metricsToAnalyze = allMetrics.filter(m => !existingMetrics.includes(m))

      // Always call auto-create to ensure trends include latest vital signs
      // Even if trends exist, they might be outdated if new vitals were added
      setAnalysisProgress(metricsToAnalyze.length > 0 
        ? 'Eksik trendler oluşturuluyor...' 
        : 'Son vitaller için trendler güncelleniyor...')
      
      try {
        const response = await fetch('/api/ai/trends/auto-create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patient_id: patientId,
            period_hours: periodHours,
            update_existing: true, // Update existing trends if new data exists
          }),
        })

        if (response.ok) {
          const data = await response.json()
          const createdCount = data.created || 0
          const updatedCount = data.updated || 0
          
          // Refresh trends after auto-create
          setAnalysisProgress('Trendler güncelleniyor...')
          await fetchTrends()

          if (createdCount > 0 || updatedCount > 0) {
            if (createdCount > 0 && updatedCount > 0) {
              toast.success(`${createdCount} yeni trend oluşturuldu, ${updatedCount} trend güncellendi`)
            } else if (createdCount > 0) {
              toast.success(`${createdCount} trend analizi tamamlandı`)
            } else if (updatedCount > 0) {
              toast.success(`${updatedCount} trend son vitallerle güncellendi`)
            }
          } else if (data.message === 'All trends already exist and are up to date') {
            // All trends already exist and are up to date, no need to show message
          }
        } else {
          const errorData = await response.json().catch(() => ({}))
          // Only log if it's not a normal "no data" situation
          if (process.env.NODE_ENV === 'development') {
            console.warn('[Auto-analyze] Auto-create failed:', errorData)
          }
        }
      } catch (error) {
        // Log error in development
        if (process.env.NODE_ENV === 'development') {
          console.error('[Auto-analyze] Auto-create error:', error)
        }
      }

      // Refresh trends after analysis
      setAnalysisProgress('Trendler güncelleniyor...')
      await fetchTrends()
    } catch (error) {
      console.error('Auto-analyze error:', error)
    } finally {
      setIsAnalyzing(false)
      setAnalysisProgress('')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, metricType, periodHours])

  // Track previous patientId to detect changes
  const prevPatientIdRef = useRef<string | null>(null)

  // Effect for initial load and patientId/metricType changes
  useEffect(() => {
    // Don't run if patientId is not available
    if (!patientId || (typeof patientId === 'string' && patientId.trim() === '')) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[TrendVisualization] patientId is missing or empty, skipping load')
      }
      setLoading(false)
      return
    }

    // Reset flag when patientId changes
    if (prevPatientIdRef.current !== patientId) {
      hasAutoAnalyzedRef.current = false
      prevPatientIdRef.current = patientId
    }
    
    let mounted = true
    
    // Auto-analyze on initial load (only once per patientId)
    const loadTrends = async () => {
      if (!hasAutoAnalyzedRef.current && mounted) {
        hasAutoAnalyzedRef.current = true
        await autoAnalyzeTrends()
      }
    }
    
    // Small delay to ensure patientId is stable
    const timeoutId = setTimeout(() => {
      if (mounted) {
        loadTrends()
      }
    }, 100)
    
    return () => {
      mounted = false
      clearTimeout(timeoutId)
    }
    
    if (autoRefresh) {
      const interval = setInterval(() => {
        if (mounted && !isAnalyzing && !calculating) {
          // On auto-refresh, just fetch trends, don't auto-create
          fetchTrends()
        }
      }, refreshInterval)
      return () => {
        mounted = false
        clearInterval(interval)
      }
    }
    
    return () => {
      mounted = false
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, metricType, autoRefresh, refreshInterval])

  // Realtime subscription for patient_data changes
  useEffect(() => {
    if (!patientId || (typeof patientId === 'string' && patientId.trim() === '')) {
      return
    }

    const channelName = `trends:patient:${patientId}`
    const channel = supabase.channel(channelName)

    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'patient_data',
          filter: `patient_id=eq.${patientId}`,
        },
        async (payload: RealtimePostgresChangesPayload<any>) => {
          const newData = payload.new
          // Only react to vital_signs data
          if (newData.data_type === 'vital_signs') {
            console.log('[TrendVisualization] New vital sign detected, refreshing trends...')
            
            // Wait a bit for the data to be fully inserted and backend processing
            setTimeout(async () => {
              // Use the auto-create endpoint which handles missing trends better
              const now = Date.now()
              if (!autoCreateInProgress.current && (now - lastAutoCreateTime.current) > AUTO_CREATE_COOLDOWN) {
                try {
                  lastAutoCreateTime.current = now
                  autoCreateInProgress.current = true
                  
                  // Call the auto-create endpoint (same one used by AddDataForm)
                  const response = await fetch('/api/ai/trends/auto-create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      patient_id: patientId,
                      period_hours: periodHours,
                    }),
                  })
                  
                  if (response.ok) {
                    const data = await response.json()
                    console.log('[TrendVisualization] Auto-create result:', data)
                    // Refresh trends after auto-create
                    await fetchTrends()
                  } else {
                    const error = await response.json().catch(() => ({}))
                    console.warn('[TrendVisualization] Auto-create failed:', error)
                  }
                } catch (error) {
                  console.error('[TrendVisualization] Auto-create error:', error)
                } finally {
                  autoCreateInProgress.current = false
                }
              } else {
                // Just refresh trends if cooldown is active
                await fetchTrends()
              }
            }, 2000) // Wait 2 seconds for backend processing
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[TrendVisualization] Realtime subscription active for patient:', patientId)
        }
      })

    realtimeChannelRef.current = channel

    return () => {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current)
        realtimeChannelRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId])

  // Separate effect for periodHours changes - clear existing trends and reload
  useEffect(() => {
    if (!patientId || (typeof patientId === 'string' && patientId.trim() === '')) {
      return
    }
    
    // Clear existing trends when period changes
    setTrends([])
    setSelectedMetric(null)
    
    // Reload trends with new period
    const reloadWithNewPeriod = async () => {
      await fetchTrends()
      // Don't auto-create on period change, let user manually refresh if needed
    }
    
    reloadWithNewPeriod()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodHours, patientId])

  // Manual refresh all trends
  const handleManualRefresh = useCallback(async () => {
    if (calculating) {
      toast.error('Bir işlem devam ediyor, lütfen bekleyin.')
      return
    }
    
    try {
      setLoading(true)
      const loadingToastId = toast.loading('Trendler yenileniyor...')
      await fetchTrends()
      // Try to auto-create missing trends silently
      await autoCreateMissingTrends()
      toast.dismiss(loadingToastId)
      toast.success('Trendler güncellendi')
    } catch (error) {
      toast.dismiss()
      toast.error('Trendler güncellenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }, [calculating, fetchTrends, autoCreateMissingTrends])

  // Recalculate all trends for current period
  const handleRecalculateAll = useCallback(async () => {
    if (calculating) {
      toast.error('Bir işlem devam ediyor, lütfen bekleyin.')
      return
    }
    
    const confirmRecalculate = window.confirm(
      `Tüm trendleri son ${periodHours} saat için yeniden hesaplamak istediğinize emin misiniz?`
    )
    
    if (!confirmRecalculate) return
    
    const allMetrics = [
      'heartRate',
      'temperature',
      'respiratoryRate',
      'oxygenSaturation',
      'bloodPressureSystolic',
      'bloodPressureDiastolic',
      'painScore',
    ]
    
    let successCount = 0
    let noDataCount = 0
    let failCount = 0
    
    const loadingToastId = toast.loading('Trendler hesaplanıyor...')
    setLoading(true)
    
    // Calculate all metrics without refreshing UI for each one
    for (const metric of allMetrics) {
      try {
        setCalculating(metric)
        
        const validMetricType: MetricType = (metricType && ['vital_signs', 'lab_values', 'clinical_scores', 'overall_condition'].includes(metricType))
          ? metricType
          : 'vital_signs'
        
        const response = await fetch('/api/ai/trends', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patient_id: patientId,
            metric_type: validMetricType,
            metric_name: metric,
            period_hours: periodHours,
          }),
        })

        if (response.ok) {
          successCount++
        } else {
          const errorData = await response.json().catch(() => ({}))
          if (errorData.data_points_found === 0) {
            noDataCount++
          } else {
            failCount++
          }
        }
      } catch (error) {
        failCount++
      }
    }
    
    setCalculating(null)
    
    // Refresh trends ONCE after all calculations
    await fetchTrends()
    
    setLoading(false)
    toast.dismiss(loadingToastId)
    
    if (successCount > 0) {
      toast.success(`${successCount} trend başarıyla hesaplandı`)
    }
    
    if (noDataCount > 0 && successCount === 0) {
      toast.error(`Hiç trend hesaplanamadı. Son ${periodHours} saat içinde vital bulgu verisi bulunamadı.`)
    } else if (noDataCount > 0) {
      toast(`${noDataCount} metrik için yeterli veri bulunamadı`, {
        icon: 'ℹ️',
        duration: 4000,
      })
    }
  }, [calculating, periodHours, patientId, metricType, fetchTrends])

  const calculateTrend = async (metricName: string) => {
    if (calculating) {
      return // Prevent multiple simultaneous calculations
    }

    try {
      setCalculating(metricName)
      const loadingToast = toast.loading(`${metricName} trendi hesaplanıyor...`)
      
      console.log(`[TrendVisualization] Calculating trend for ${metricName} (patient: ${patientId}, period: ${periodHours}h)`)
      
      // Ensure metric_type is always a valid value
      const validMetricType: MetricType = (metricType && ['vital_signs', 'lab_values', 'clinical_scores', 'overall_condition'].includes(metricType))
        ? metricType
        : 'vital_signs'
      
      const response = await fetch('/api/ai/trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          metric_type: validMetricType,
          metric_name: metricName,
          period_hours: periodHours,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        toast.dismiss(loadingToast)
        
        // Check if trend has insufficient_data
        if (result.trend?.trend_direction === 'insufficient_data') {
          toast('Trend oluşturuldu ancak yetersiz veri nedeniyle analiz tamamlanamadı. Daha fazla veri ekleyin.', {
            icon: '⚠️',
            duration: 6000,
          })
        } else {
          toast.success('Trend başarıyla hesaplandı', { id: loadingToast })
        }
        
        await fetchTrends()
        
        // Select the newly created trend
        if (result.trend) {
          setSelectedMetric(result.trend.metric_name)
        }
      } else {
        toast.dismiss(loadingToast)
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        const errorMessage = errorData.message || errorData.error || 'Yetersiz veri'
        const dataPointsFound = errorData.data_points_found ?? 0
        
        if (dataPointsFound === 0) {
          toast.error(
            `Son ${periodHours} saat içinde ${metricName} için veri bulunamadı. Lütfen vital bulgular ekleyin.`,
            { duration: 5000 }
          )
        } else {
          toast.error(
            `Trend hesaplanamadı: ${errorMessage}`,
            { duration: 5000 }
          )
        }
      }
    } catch (error) {
      toast.error('Trend hesaplanırken bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setCalculating(null)
    }
  }

  const getTrendDirectionIcon = (direction: TrendDirection) => {
    switch (direction) {
      case 'improving':
        return <TrendingDown className="h-5 w-5 text-green-600" />
      case 'worsening':
        return <TrendingUp className="h-5 w-5 text-red-600" />
      case 'stable':
        return <Minus className="h-5 w-5 text-blue-600" />
      case 'fluctuating':
        return <Activity className="h-5 w-5 text-yellow-600" />
      default:
        return <BarChart3 className="h-5 w-5 text-gray-600" />
    }
  }

  const getTrendDirectionColor = (direction: TrendDirection) => {
    switch (direction) {
      case 'improving':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'worsening':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'stable':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'fluctuating':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getTrendDirectionText = (direction: TrendDirection) => {
    switch (direction) {
      case 'improving':
        return 'İyileşiyor'
      case 'worsening':
        return 'Kötüleşiyor'
      case 'stable':
        return 'Stabil'
      case 'fluctuating':
        return 'Dalgalı'
      default:
        return 'Yetersiz Veri'
    }
  }

  const selectedTrend = trends.find((t) => t.metric_name === selectedMetric)

  const chartData = selectedTrend
    ? {
        labels: selectedTrend.data_points.map((dp) =>
          new Date(dp.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
        ),
        datasets: [
          {
            label: selectedTrend.metric_name,
            data: selectedTrend.data_points.map((dp) => dp.value),
            borderColor:
              selectedTrend.trend_direction === 'improving'
                ? 'rgb(34, 197, 94)'
                : selectedTrend.trend_direction === 'worsening'
                ? 'rgb(239, 68, 68)'
                : 'rgb(59, 130, 246)',
            backgroundColor:
              selectedTrend.trend_direction === 'improving'
                ? 'rgba(34, 197, 94, 0.1)'
                : selectedTrend.trend_direction === 'worsening'
                ? 'rgba(239, 68, 68, 0.1)'
                : 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      }
    : null

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  }

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-red-900 mb-1">Hata</h4>
              <p className="text-sm text-red-700">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                className="mt-2"
              >
                Tekrar Dene
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Guide Message */}
      {showGuide && trends.length === 0 && !loading && !error && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Info className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-base font-bold text-gray-900 mb-3">Trend Analizi Nasıl Çalışır?</h4>
              <div className="grid gap-2 text-sm text-gray-700">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                  <p>Hasta için vital bulgular ekledikçe sistem otomatik olarak trend analizleri oluşturur</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                  <p>Her metrik için en az 2 veri noktası gereklidir</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                  <p>AI, trendleri analiz edip klinik yorumlar sunar</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-blue-200">
                <p className="text-sm font-semibold text-gray-900 mb-2">🎯 İlk adım: Vital Bulgular ekleyin</p>
                <p className="text-xs text-gray-600">Hastanın "Bilgileri" sekmesinden vital bulgular (nabız, ateş, SpO2, vb.) ekleyerek başlayın</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGuide(false)}
                className="mt-3"
              >
                Anladım
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header with Controls */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Trend Analizleri</h2>
            <p className="text-sm text-gray-600 mt-0.5">
              {isAnalyzing
                ? analysisProgress || 'Trend analizi yapılıyor...'
                : trends.length > 0 
                ? `${trends.length} metrik için trend analizi mevcut`
                : 'Henüz trend analizi bulunmuyor'}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
              <label className="text-xs font-medium text-gray-700 whitespace-nowrap">Zaman:</label>
              <select
                value={periodHours}
                onChange={(e) => setPeriodHours(Number(e.target.value))}
                disabled={loading || !!calculating}
                className="text-sm font-medium bg-transparent border-0 focus:outline-none focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900"
              >
                <option value={6}>Son 6 Saat</option>
                <option value={12}>Son 12 Saat</option>
                <option value={24}>Son 24 Saat</option>
                <option value={48}>Son 48 Saat</option>
                <option value={72}>Son 72 Saat</option>
              </select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={loading || !!calculating}
              leftIcon={<RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />}
            >
              Yenile
            </Button>
            
            {trends.length > 0 && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleRecalculateAll}
                disabled={loading || !!calculating}
                leftIcon={<BarChart3 className="h-4 w-4" />}
              >
                Yeniden Hesapla
              </Button>
            )}
          </div>
        </div>
        
        {(calculating || isAnalyzing) && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              <span className="font-medium">
                {isAnalyzing ? (analysisProgress || 'Trend analizi yapılıyor...') : `${calculating} hesaplanıyor...`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Trend Cards - Modern Grid */}
      {trends.length > 0 && (() => {
        // Group trends by metric_name and get the latest one for each metric
        const trendsByMetric = trends.reduce((acc, trend) => {
          const metricName = trend.metric_name
          if (!acc[metricName] || new Date(trend.calculated_at) > new Date(acc[metricName].calculated_at)) {
            acc[metricName] = trend
          }
          return acc
        }, {} as Record<string, AITrend>)
        
        const uniqueTrends = Object.values(trendsByMetric)
        
        return (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {uniqueTrends.map((trend) => (
            <div
              key={trend.id}
              className={cn(
                'bg-white border-2 rounded-xl p-5 cursor-pointer transition-all duration-200 hover:shadow-lg',
                selectedMetric === trend.metric_name 
                  ? 'border-blue-500 shadow-md' 
                  : 'border-gray-200 hover:border-gray-300'
              )}
              onClick={() => setSelectedMetric(trend.metric_name)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 text-base mb-1 capitalize">
                    {trend.metric_name}
                  </h4>
                  <div
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
                      getTrendDirectionColor(trend.trend_direction)
                    )}
                  >
                    {getTrendDirectionIcon(trend.trend_direction)}
                    {getTrendDirectionText(trend.trend_direction)}
                  </div>
                </div>
              </div>

              {/* Statistics */}
              {trend.statistical_analysis && (
                <div className="space-y-2.5 mb-4">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Ortalama</span>
                    <span className="text-sm font-bold text-gray-900">
                      {trend.statistical_analysis.mean.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Aralık</span>
                    <span className="text-sm font-bold text-gray-900">
                      {trend.statistical_analysis.min.toFixed(1)} - {trend.statistical_analysis.max.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600">Eğim</span>
                    <span className={cn(
                      "text-sm font-bold",
                      trend.statistical_analysis.slope > 0 ? "text-red-600" : trend.statistical_analysis.slope < 0 ? "text-green-600" : "text-gray-600"
                    )}>
                      {trend.statistical_analysis.slope > 0 ? '+' : ''}
                      {trend.statistical_analysis.slope.toFixed(3)}
                    </span>
                  </div>
                </div>
              )}

              {/* AI Interpretation Preview */}
              {trend.ai_interpretation && (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 mb-3">
                  <p className="text-xs text-gray-700 line-clamp-3">
                    {trend.ai_interpretation}
                  </p>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-200">
                <span>
                  {formatDistanceToNow(new Date(trend.calculated_at), {
                    addSuffix: true,
                    locale: tr,
                  })}
                </span>
                <span className="font-medium">
                  {trend.data_point_count} veri
                </span>
              </div>
            </div>
          ))}
          </div>
        )
      })()}

      {/* Detailed Chart View */}
      {selectedTrend && chartData && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          {/* Chart Header */}
          <div className="mb-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 capitalize">
                  {selectedTrend.metric_name}
                </h3>
                <p className="text-sm text-gray-600">
                  Son {periodHours} saat | {selectedTrend.data_point_count} veri noktası
                </p>
              </div>
              <div
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-bold inline-flex items-center gap-2',
                  getTrendDirectionColor(selectedTrend.trend_direction)
                )}
              >
                {getTrendDirectionIcon(selectedTrend.trend_direction)}
                {getTrendDirectionText(selectedTrend.trend_direction)}
              </div>
            </div>
            
            {selectedTrend.clinical_significance && (
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 border border-gray-200">
                <span className="font-semibold">Klinik Önem:</span> {selectedTrend.clinical_significance}
              </p>
            )}
          </div>

          {/* Chart */}
          <div className="h-72 mb-6">
            <Line data={chartData} options={chartOptions} />
          </div>

          {/* AI Interpretation */}
          {selectedTrend.ai_interpretation && (
            <div className={cn(
              "border-2 rounded-xl p-5 mb-6",
              selectedTrend.trend_direction === 'insufficient_data'
                ? "bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300"
                : "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300"
            )}>
              <div className="flex items-start gap-3">
                <div className={cn(
                  "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
                  selectedTrend.trend_direction === 'insufficient_data' 
                    ? "bg-yellow-500" 
                    : "bg-blue-500"
                )}>
                  <span className="text-white text-xl">🤖</span>
                </div>
                <div className="flex-1">
                  <h4 className={cn(
                    "text-sm font-bold mb-2",
                    selectedTrend.trend_direction === 'insufficient_data'
                      ? "text-yellow-900"
                      : "text-blue-900"
                  )}>
                    AI Yorumu
                  </h4>
                  <p className={cn(
                    "text-sm leading-relaxed",
                    selectedTrend.trend_direction === 'insufficient_data'
                      ? "text-yellow-800"
                      : "text-blue-800"
                  )}>
                    {selectedTrend.ai_interpretation}
                  </p>
                  {selectedTrend.trend_direction === 'insufficient_data' && (
                    <p className="text-xs text-yellow-700 mt-3 flex items-start gap-2">
                      <span>⚠️</span>
                      <span>Bu trend için yetersiz veri bulundu. Daha fazla vital bulgu ekleyerek analizi tamamlayabilirsiniz.</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Statistics Grid */}
          {selectedTrend.statistical_analysis && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-xs font-medium text-gray-600 mb-1">Ortalama</p>
                <p className="text-2xl font-bold text-gray-900">
                  {selectedTrend.statistical_analysis.mean.toFixed(1)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-xs font-medium text-gray-600 mb-1">Std Sapma</p>
                <p className="text-2xl font-bold text-gray-900">
                  {selectedTrend.statistical_analysis.std_dev.toFixed(2)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-xs font-medium text-gray-600 mb-1">Minimum</p>
                <p className="text-2xl font-bold text-gray-900">
                  {selectedTrend.statistical_analysis.min.toFixed(1)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-xs font-medium text-gray-600 mb-1">Maksimum</p>
                <p className="text-2xl font-bold text-gray-900">
                  {selectedTrend.statistical_analysis.max.toFixed(1)}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {trends.length === 0 && !loading && !error && (
        <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-12">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-8 w-8 text-gray-400" />
            </div>
            {calculating ? (
              <>
                <div className="flex items-center justify-center gap-2 text-sm text-blue-600 mb-3">
                  <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
                  <span className="font-semibold">{calculating} trendi hesaplanıyor...</span>
                </div>
                <p className="text-sm text-gray-500">
                  Lütfen bekleyin, vital bulgular analiz ediliyor...
                </p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Henüz Trend Analizi Yok</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Hasta için vital bulgular eklediğinizde sistem otomatik olarak trend analizleri oluşturacak.
                </p>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 text-left mb-6">
                  <p className="text-xs font-bold text-gray-800 mb-3">📋 Gereksinimler</p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-xs text-gray-700">
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-[10px]">
                        2+
                      </div>
                      <span>Her metrik için en az <strong>2 veri noktası</strong></span>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-gray-700">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 text-white">
                        ✓
                      </div>
                      <span>Vital bulgular: <strong>Nabız, Ateş, Solunum, SpO2</strong></span>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-gray-700">
                      <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 text-white">
                        ⏱
                      </div>
                      <span>Son <strong>{periodHours} saat</strong> içindeki veriler</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleManualRefresh}
                >
                  Trendleri Kontrol Et
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

