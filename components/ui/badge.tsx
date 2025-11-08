import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Activity,
  AlertTriangle,
  Info,
  XCircle,
  TrendingUp,
  TrendingDown,
  Pause,
  Play
} from 'lucide-react'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'medical'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  status?: 'online' | 'offline' | 'busy' | 'away'
  pulse?: boolean
  dot?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  rounded?: boolean
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({
    className,
    variant = 'default',
    size = 'md',
    status,
    pulse = false,
    dot = false,
    leftIcon,
    rightIcon,
    rounded = false,
    children,
    ...props
  }, ref) => {
    const baseClasses = 'inline-flex items-center font-medium transition-all duration-200'
    
    const variants = {
      default: 'bg-gray-100 text-gray-800 border border-gray-300',
      primary: 'bg-blue-100 text-blue-800 border border-blue-300',
      secondary: 'bg-gray-100 text-gray-700 border border-gray-200',
      success: 'bg-green-100 text-green-800 border border-green-300',
      warning: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
      error: 'bg-red-100 text-red-800 border border-red-300',
      info: 'bg-blue-100 text-blue-800 border border-blue-300',
      medical: 'bg-red-100 text-red-800 border border-red-300',
    }

    const sizes = {
      xs: 'px-2 py-0.5 text-xs',
      sm: 'px-2.5 py-1 text-xs',
      md: 'px-3 py-1 text-sm',
      lg: 'px-4 py-1.5 text-base',
    }

    const radiusClasses = rounded ? 'rounded-full' : 'rounded-md'

    const statusColors = {
      online: 'bg-green-500',
      offline: 'bg-gray-400',
      busy: 'bg-red-500',
      away: 'bg-yellow-500',
    }

    return (
      <span
        ref={ref}
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          radiusClasses,
          pulse && 'animate-pulse',
          className
        )}
        {...props}
      >
        {/* Status Dot */}
        {status && (
          <span className={cn(
            'w-2 h-2 rounded-full mr-2',
            statusColors[status],
            pulse && 'animate-pulse'
          )} />
        )}

        {/* Left Icon */}
        {leftIcon && <span className="mr-1 flex-shrink-0">{leftIcon}</span>}

        {/* Content */}
        {!dot && children}

        {/* Right Icon */}
        {rightIcon && <span className="ml-1 flex-shrink-0">{rightIcon}</span>}
      </span>
    )
  }
)
Badge.displayName = 'Badge'

// Patient Status Badge
export interface PatientStatusBadgeProps {
  status: 'active' | 'discharged' | 'consultation' | 'critical' | 'stable' | 'observation'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showIcon?: boolean
  compact?: boolean
}

export const PatientStatusBadge = forwardRef<HTMLSpanElement, PatientStatusBadgeProps>(
  ({ status, size = 'md', showIcon = true, compact = false }, ref) => {
    const getStatusConfig = (status: string) => {
      switch (status) {
        case 'active':
          return {
            variant: 'success' as const,
            icon: <Activity className="h-3 w-3" />,
            text: 'Aktif',
            description: 'Hasta aktif tedavi görüyor'
          }
        case 'discharged':
          return {
            variant: 'secondary' as const,
            icon: <CheckCircle className="h-3 w-3" />,
            text: 'Taburcu',
            description: 'Hasta taburcu edildi'
          }
        case 'consultation':
          return {
            variant: 'warning' as const,
            icon: <Clock className="h-3 w-3" />,
            text: 'Konsültasyon',
            description: 'Konsültasyon sürecinde'
          }
        case 'critical':
          return {
            variant: 'error' as const,
            icon: <AlertCircle className="h-3 w-3" />,
            text: 'Kritik',
            description: 'Kritik durumda'
          }
        case 'stable':
          return {
            variant: 'info' as const,
            icon: <CheckCircle className="h-3 w-3" />,
            text: 'Stabil',
            description: 'Durumu stabil'
          }
        case 'observation':
          return {
            variant: 'warning' as const,
            icon: <AlertTriangle className="h-3 w-3" />,
            text: 'Gözlem',
            description: 'Gözlem altında'
          }
        default:
          return {
            variant: 'default' as const,
            icon: <Info className="h-3 w-3" />,
            text: status,
            description: ''
          }
      }
    }

    const config = getStatusConfig(status)

    if (compact) {
      return (
        <Badge
          ref={ref}
          variant={config.variant}
          size={size}
          leftIcon={showIcon ? config.icon : undefined}
          rounded
          title={config.description}
        >
          {config.text}
        </Badge>
      )
    }

    return (
      <div className="flex items-center gap-2" ref={ref}>
        <Badge
          variant={config.variant}
          size={size}
          leftIcon={showIcon ? config.icon : undefined}
          rounded
          title={config.description}
        >
          {config.text}
        </Badge>
        <span className="text-xs text-gray-500 hidden sm:inline">
          {config.description}
        </span>
      </div>
    )
  }
)
PatientStatusBadge.displayName = 'PatientStatusBadge'

// Urgency Level Badge
export interface UrgencyBadgeProps {
  level: 'low' | 'medium' | 'high' | 'critical' | 'immediate'
  showLabel?: boolean
  size?: 'xs' | 'sm' | 'md' | 'lg'
}

export const UrgencyBadge = forwardRef<HTMLSpanElement, UrgencyBadgeProps>(
  ({ level, showLabel = true, size = 'md' }, ref) => {
    const getUrgencyConfig = (level: string) => {
      switch (level) {
        case 'low':
          return {
            variant: 'success' as const,
            icon: <TrendingDown className="h-3 w-3" />,
            text: 'Düşük',
            color: 'text-green-600',
            bgColor: 'bg-green-100'
          }
        case 'medium':
          return {
            variant: 'warning' as const,
            icon: <TrendingUp className="h-3 w-3" />,
            text: 'Orta',
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-100'
          }
        case 'high':
          return {
            variant: 'error' as const,
            icon: <AlertTriangle className="h-3 w-3" />,
            text: 'Yüksek',
            color: 'text-red-600',
            bgColor: 'bg-red-100'
          }
        case 'critical':
          return {
            variant: 'error' as const,
            icon: <AlertCircle className="h-3 w-3" />,
            text: 'Kritik',
            color: 'text-red-700',
            bgColor: 'bg-red-100'
          }
        case 'immediate':
          return {
            variant: 'medical' as const,
            icon: <AlertCircle className="h-3 w-3" />,
            text: 'Acil',
            color: 'text-red-800',
            bgColor: 'bg-red-200'
          }
        default:
          return {
            variant: 'default' as const,
            icon: <Info className="h-3 w-3" />,
            text: level,
            color: 'text-gray-600',
            bgColor: 'bg-gray-100'
          }
      }
    }

    const config = getUrgencyConfig(level)

    return (
      <div className="flex items-center gap-2" ref={ref}>
        <Badge
          variant={config.variant}
          size={size}
          leftIcon={config.icon}
          rounded
          className={cn(
            level === 'immediate' && 'animate-pulse border-2 border-red-400'
          )}
        >
          {showLabel && config.text}
        </Badge>
        {level === 'immediate' && (
          <span className="text-xs font-medium text-red-600 animate-pulse">
            HEMEN MÜDAHALE
          </span>
        )}
      </div>
    )
  }
)
UrgencyBadge.displayName = 'UrgencyBadge'

// Vital Sign Status Badge
export interface VitalSignBadgeProps {
  vital: 'normal' | 'caution' | 'critical' | 'unknown'
  label: string
  value?: string | number
  unit?: string
  trend?: 'up' | 'down' | 'stable'
  size?: 'xs' | 'sm' | 'md' | 'lg'
}

export const VitalSignBadge = forwardRef<HTMLSpanElement, VitalSignBadgeProps>(
  ({ vital, label, value, unit, trend, size = 'md' }, ref) => {
    const getVitalConfig = (vital: string) => {
      switch (vital) {
        case 'normal':
          return {
            variant: 'success' as const,
            icon: <CheckCircle className="h-3 w-3" />,
            textColor: 'text-green-700',
            bgColor: 'bg-green-50'
          }
        case 'caution':
          return {
            variant: 'warning' as const,
            icon: <AlertTriangle className="h-3 w-3" />,
            textColor: 'text-yellow-700',
            bgColor: 'bg-yellow-50'
          }
        case 'critical':
          return {
            variant: 'error' as const,
            icon: <AlertCircle className="h-3 w-3" />,
            textColor: 'text-red-700',
            bgColor: 'bg-red-50'
          }
        default:
          return {
            variant: 'secondary' as const,
            icon: <Info className="h-3 w-3" />,
            textColor: 'text-gray-700',
            bgColor: 'bg-gray-50'
          }
      }
    }

    const config = getVitalConfig(vital)

    const getTrendIcon = (trend?: string) => {
      switch (trend) {
        case 'up':
          return <TrendingUp className="h-3 w-3 text-green-600" />
        case 'down':
          return <TrendingDown className="h-3 w-3 text-red-600" />
        case 'stable':
          return <Pause className="h-3 w-3 text-gray-600" />
        default:
          return null
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-between p-3 rounded-lg border',
          config.bgColor,
          vital === 'critical' && 'border-red-300 animate-pulse',
          vital === 'caution' && 'border-yellow-300',
          vital === 'normal' && 'border-green-300'
        )}
      >
        <div className="flex items-center gap-2">
          {config.icon}
          <div>
            <div className="text-sm font-medium text-gray-700">{label}</div>
            {value !== undefined && (
              <div className={cn('text-lg font-bold', config.textColor)}>
                {value}
                {unit && <span className="text-sm font-normal ml-1">{unit}</span>}
              </div>
            )}
          </div>
        </div>
        
        {trend && (
          <div className="flex items-center">
            {getTrendIcon(trend)}
          </div>
        )}
      </div>
    )
  }
)
VitalSignBadge.displayName = 'VitalSignBadge'

// Department Badge
export interface DepartmentBadgeProps {
  department: 'emergency' | 'icu' | 'cardiology' | 'neurology' | 'pediatrics' | 'surgery' | 'general'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showName?: boolean
}

export const DepartmentBadge = forwardRef<HTMLSpanElement, DepartmentBadgeProps>(
  ({ department, size = 'md', showName = true }, ref) => {
    const getDepartmentConfig = (dept: string) => {
      switch (dept) {
        case 'emergency':
          return {
            variant: 'medical' as const,
            icon: <AlertCircle className="h-3 w-3" />,
            text: 'Acil',
            color: 'red'
          }
        case 'icu':
          return {
            variant: 'error' as const,
            icon: <Activity className="h-3 w-3" />,
            text: 'YOBAH',
            color: 'red'
          }
        case 'cardiology':
          return {
            variant: 'error' as const,
            icon: <Activity className="h-3 w-3" />,
            text: 'Kardiyoloji',
            color: 'red'
          }
        case 'neurology':
          return {
            variant: 'info' as const,
            icon: <Activity className="h-3 w-3" />,
            text: 'Nöroloji',
            color: 'blue'
          }
        case 'pediatrics':
          return {
            variant: 'info' as const,
            icon: <Activity className="h-3 w-3" />,
            text: 'Pediatri',
            color: 'blue'
          }
        case 'surgery':
          return {
            variant: 'warning' as const,
            icon: <AlertTriangle className="h-3 w-3" />,
            text: 'Cerrahi',
            color: 'yellow'
          }
        default:
          return {
            variant: 'primary' as const,
            icon: <Activity className="h-3 w-3" />,
            text: 'Genel',
            color: 'blue'
          }
      }
    }

    const config = getDepartmentConfig(department)

    return (
      <Badge
        ref={ref}
        variant={config.variant}
        size={size}
        leftIcon={config.icon}
        rounded
        title={`${config.text} departmanı`}
      >
        {showName && config.text}
      </Badge>
    )
  }
)
DepartmentBadge.displayName = 'DepartmentBadge'

// Activity Status Badge
export interface ActivityBadgeProps {
  isActive?: boolean
  label?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export const ActivityBadge = forwardRef<HTMLSpanElement, ActivityBadgeProps>(
  ({ isActive = false, label = 'Aktif', size = 'sm', showLabel = true }, ref) => {
    return (
      <div className="flex items-center gap-2" ref={ref}>
        <Badge
          variant={isActive ? 'success' : 'secondary'}
          size={size}
          dot
          status={isActive ? 'online' : 'offline'}
          pulse={isActive}
        />
        {showLabel && (
          <span className={cn(
            'text-sm font-medium',
            isActive ? 'text-green-600' : 'text-gray-500'
          )}>
            {label}
          </span>
        )}
      </div>
    )
  }
)
ActivityBadge.displayName = 'ActivityBadge'

export { Badge }
