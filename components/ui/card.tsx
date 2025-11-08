import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  User, 
  Activity,
  Heart,
  TrendingUp,
  Calendar,
  MoreHorizontal
} from 'lucide-react'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated' | 'medical' | 'patient' | 'vital' | 'test'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  hover?: boolean
  interactive?: boolean
  loading?: boolean
  header?: React.ReactNode
  footer?: React.ReactNode
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  status?: 'success' | 'warning' | 'error' | 'info' | 'neutral'
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({
    className,
    variant = 'default',
    size = 'md',
    hover = true,
    interactive = false,
    loading = false,
    header,
    footer,
    leftIcon,
    rightIcon,
    status,
    children,
    ...props
  }, ref) => {
    const baseClasses = 'rounded-xl transition-all duration-200'
    
    const variants = {
      default: 'bg-white border border-gray-200 shadow-sm',
      outlined: 'bg-white border-2 border-gray-300 shadow-none',
      elevated: 'bg-white border border-gray-100 shadow-lg',
      medical: 'bg-gradient-to-br from-blue-50 to-white border border-blue-200 shadow-md',
      patient: 'bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300',
      vital: 'bg-white border border-gray-200 shadow-sm',
      test: 'bg-white border border-gray-200 shadow-sm',
    }

    const sizes = {
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
      xl: 'p-10',
    }

    const hoverClasses = hover && !loading ? 'hover:shadow-lg hover:scale-[1.02]' : ''
    const interactiveClasses = interactive ? 'cursor-pointer active:scale-[0.98]' : ''

    const statusBorders = {
      success: 'border-l-4 border-l-green-500',
      warning: 'border-l-4 border-l-yellow-500',
      error: 'border-l-4 border-l-red-500',
      info: 'border-l-4 border-l-blue-500',
      neutral: '',
    }

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          hoverClasses,
          interactiveClasses,
          status && statusBorders[status],
          loading && 'opacity-50 pointer-events-none',
          className
        )}
        {...props}
      >
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-xl z-10">
            <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        )}

        {/* Card Header */}
        {header && (
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
            {typeof header === 'string' ? (
              <h3 className="text-lg font-semibold text-gray-900">{header}</h3>
            ) : (
              header
            )}
            {rightIcon && (
              <div className="text-gray-400 hover:text-gray-600 transition-colors">
                {rightIcon}
              </div>
            )}
          </div>
        )}

        {/* Card Content with Icons */}
        <div className={cn('relative', leftIcon && 'pl-12')}>
          {leftIcon && (
            <div className="absolute left-0 top-0 text-gray-400">
              {leftIcon}
            </div>
          )}
          {children}
        </div>

        {/* Card Footer */}
        {footer && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            {footer}
          </div>
        )}
      </div>
    )
  }
)
Card.displayName = 'Card'

// Patient Card Component
export interface PatientCardProps {
  patient: {
    id: string
    name: string
    age?: number | null
    gender?: string | null
    status: string
    created_at: string
    updated_at?: string
  }
  onUpdate?: (patientId: string, updates: Partial<any>) => void
  onAdd?: (patient: any) => void
  compact?: boolean
}

export const PatientCard = forwardRef<HTMLDivElement, PatientCardProps>(
  ({ patient, onUpdate, onAdd, compact = false }, ref) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'active':
          return 'bg-green-100 text-green-800 border-green-200'
        case 'discharged':
          return 'bg-gray-100 text-gray-800 border-gray-200'
        case 'consultation':
          return 'bg-yellow-100 text-yellow-800 border-yellow-200'
        case 'critical':
          return 'bg-red-100 text-red-800 border-red-200'
        default:
          return 'bg-blue-100 text-blue-800 border-blue-200'
      }
    }

    const getStatusText = (status: string) => {
      switch (status) {
        case 'active':
          return 'Aktif'
        case 'discharged':
          return 'Taburcu'
        case 'consultation':
          return 'Konsültasyon'
        case 'critical':
          return 'Kritik'
        default:
          return status
      }
    }

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'active':
          return <Activity className="h-4 w-4" />
        case 'discharged':
          return <CheckCircle className="h-4 w-4" />
        case 'consultation':
          return <Clock className="h-4 w-4" />
        case 'critical':
          return <AlertCircle className="h-4 w-4" />
        default:
          return <User className="h-4 w-4" />
      }
    }

    if (compact) {
      return (
        <Card
          ref={ref}
          variant="patient"
          size="sm"
          interactive
          status={patient.status === 'critical' ? 'error' : patient.status === 'active' ? 'success' : 'neutral'}
          className="relative group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {patient.name}
                </h4>
                <p className="text-sm text-gray-600">
                  {patient.age && `${patient.age} yaş`}
                  {patient.gender && ` • ${patient.gender}`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={cn(
                'px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1',
                getStatusColor(patient.status)
              )}>
                {getStatusIcon(patient.status)}
                {getStatusText(patient.status)}
              </span>
              
              <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                <MoreHorizontal className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>
        </Card>
      )
    }

    return (
      <Card
        ref={ref}
        variant="patient"
        status={patient.status === 'critical' ? 'error' : patient.status === 'active' ? 'success' : 'neutral'}
        className="relative group"
        header={
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{patient.name}</h3>
                <p className="text-sm text-gray-600">
                  {patient.age && `${patient.age} yaş`}
                  {patient.gender && ` • ${patient.gender}`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={cn(
                'px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1',
                getStatusColor(patient.status)
              )}>
                {getStatusIcon(patient.status)}
                {getStatusText(patient.status)}
              </span>
              
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                <MoreHorizontal className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>
        }
        footer={
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>
                {new Date(patient.created_at).toLocaleDateString('tr-TR')}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="text-blue-600 hover:text-blue-800 font-medium">
                Detayları Gör
              </button>
              {onUpdate && (
                <button
                  onClick={() => onUpdate?.(patient.id, { status: 'consultation' })}
                  className="text-yellow-600 hover:text-yellow-800 font-medium"
                >
                  Konsültasyon
                </button>
              )}
            </div>
          </div>
        }
      >
        {/* Patient details content would go here */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Heart className="h-4 w-4 text-red-500" />
            <span>Vital signs normal</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span>İyileşme gösteriyor</span>
          </div>
        </div>
      </Card>
    )
  }
)
PatientCard.displayName = 'PatientCard'

// Vital Signs Card Component
export interface VitalSignsCardProps {
  vitalSigns: {
    heartRate?: number
    bloodPressure?: { systolic: number; diastolic: number }
    temperature?: number
    oxygen?: number
  }
  status?: 'normal' | 'caution' | 'critical'
  time?: string
}

export const VitalSignsCard = forwardRef<HTMLDivElement, VitalSignsCardProps>(
  ({ vitalSigns, status = 'normal', time }, ref) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'normal':
          return 'text-green-600 bg-green-50 border-green-200'
        case 'caution':
          return 'text-yellow-600 bg-yellow-50 border-yellow-200'
        case 'critical':
          return 'text-red-600 bg-red-50 border-red-200'
        default:
          return 'text-gray-600 bg-gray-50 border-gray-200'
      }
    }

    return (
      <Card
        ref={ref}
        variant="vital"
        status={status === 'critical' ? 'error' : status === 'caution' ? 'warning' : 'success'}
        header={
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Vital Bulgular</h3>
            {time && (
              <span className="text-sm text-gray-500">{time}</span>
            )}
          </div>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          {vitalSigns.heartRate && (
            <div className={cn('p-3 rounded-lg border', getStatusColor(status))}>
              <div className="flex items-center gap-2 mb-1">
                <Heart className="h-4 w-4" />
                <span className="text-sm font-medium">Nabız</span>
              </div>
              <div className="text-2xl font-bold">{vitalSigns.heartRate}</div>
              <div className="text-xs opacity-75">bpm</div>
            </div>
          )}

          {vitalSigns.bloodPressure && (
            <div className={cn('p-3 rounded-lg border', getStatusColor(status))}>
              <div className="text-sm font-medium mb-1">Kan Basıncı</div>
              <div className="text-2xl font-bold">
                {vitalSigns.bloodPressure.systolic}/{vitalSigns.bloodPressure.diastolic}
              </div>
              <div className="text-xs opacity-75">mmHg</div>
            </div>
          )}

          {vitalSigns.temperature && (
            <div className={cn('p-3 rounded-lg border', getStatusColor(status))}>
              <div className="text-sm font-medium mb-1">Sıcaklık</div>
              <div className="text-2xl font-bold">{vitalSigns.temperature}</div>
              <div className="text-xs opacity-75">°C</div>
            </div>
          )}

          {vitalSigns.oxygen && (
            <div className={cn('p-3 rounded-lg border', getStatusColor(status))}>
              <div className="text-sm font-medium mb-1">O2 Satürasyonu</div>
              <div className="text-2xl font-bold">{vitalSigns.oxygen}</div>
              <div className="text-xs opacity-75">%</div>
            </div>
          )}
        </div>
      </Card>
    )
  }
)
VitalSignsCard.displayName = 'VitalSignsCard'

export { Card }
