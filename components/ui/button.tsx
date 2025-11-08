import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { colors, borderRadius, shadows, animation } from '@/lib/design/tokens'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link' | 'success' | 'warning' | 'medical'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'icon' | 'full'
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
  rounded?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'default', 
    size = 'md', 
    loading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    rounded = false,
    children,
    disabled,
    ...props 
  }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none relative overflow-hidden group'
    
    const variants = {
      default: 'bg-blue-500 text-white hover:bg-blue-600 focus-visible:ring-blue-500 shadow-sm',
      primary: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 focus-visible:ring-blue-500 shadow-sm',
      secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus-visible:ring-gray-500 border border-gray-300',
      destructive: 'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500 shadow-sm',
      outline: 'border-2 border-blue-300 bg-transparent text-blue-600 hover:bg-blue-50 focus-visible:ring-blue-500',
      ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 focus-visible:ring-gray-500',
      link: 'text-blue-600 underline-offset-4 hover:underline focus-visible:ring-blue-500 p-0 h-auto',
      success: 'bg-green-500 text-white hover:bg-green-600 focus-visible:ring-green-500 shadow-sm',
      warning: 'bg-yellow-500 text-white hover:bg-yellow-600 focus-visible:ring-yellow-500 shadow-sm',
      medical: 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 focus-visible:ring-red-500 shadow-sm',
    }
    
    const sizes = {
      xs: 'h-8 px-3 text-xs',
      sm: 'h-9 px-4 text-sm',
      md: 'h-10 px-6 text-sm',
      lg: 'h-12 px-8 text-base',
      xl: 'h-14 px-10 text-lg',
      icon: 'h-10 w-10',
      full: 'h-12 px-8 text-base w-full',
    }

    const radiusClasses = rounded ? 'rounded-full' : 'rounded-lg'

    return (
      <button
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          radiusClasses,
          fullWidth && 'w-full',
          loading && 'cursor-wait',
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {/* Loading state */}
        {loading && (
          <Loader2 className="absolute h-4 w-4 animate-spin" />
        )}
        
        {/* Content */}
        <span className={cn('flex items-center gap-2', loading && 'opacity-0')}>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </span>

        {/* Hover effect overlay */}
        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-200 rounded-inherit" />
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button }
