import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { Eye, EyeOff, Search, AlertCircle, CheckCircle } from 'lucide-react'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  success?: boolean
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  variant?: 'default' | 'filled' | 'outlined' | 'medical'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  required?: boolean
  disabled?: boolean
  loading?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    label,
    error,
    success,
    helperText,
    leftIcon,
    rightIcon,
    variant = 'default',
    size = 'md',
    fullWidth = false,
    required = false,
    disabled = false,
    loading = false,
    type = 'text',
    id,
    ...props
  }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const [isFocused, setIsFocused] = React.useState(false)

    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`

    const baseClasses = 'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
    
    const variants = {
      default: 'border border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500',
      filled: 'border-0 bg-gray-100 focus:bg-white focus:border-blue-500 focus:ring-blue-500',
      outlined: 'border-2 border-gray-300 bg-transparent focus:border-blue-500 focus:ring-blue-500',
      medical: 'border-2 border-blue-200 bg-blue-50 focus:border-blue-500 focus:ring-blue-500 focus:bg-white',
    }

    const sizes = {
      sm: 'h-9 px-3 text-sm',
      md: 'h-11 px-4 text-sm',
      lg: 'h-13 px-5 text-base',
    }

    const stateClasses = error 
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
      : success 
      ? 'border-green-500 focus:border-green-500 focus:ring-green-500' 
      : ''

    const isPassword = type === 'password'
    const isSearch = type === 'search'

    return (
      <div className={cn('relative', fullWidth && 'w-full')}>
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
              {leftIcon}
            </div>
          )}

          {/* Input Field */}
          <input
            id={inputId}
            type={isPassword && showPassword ? 'text' : type}
            className={cn(
              baseClasses,
              variants[variant],
              sizes[size],
              stateClasses,
              leftIcon && 'pl-10',
              (rightIcon || isPassword || isSearch || loading) && 'pr-10',
              fullWidth && 'w-full',
              'rounded-lg',
              className
            )}
            ref={ref}
            disabled={disabled || loading}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />

          {/* Right Icons */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {loading && (
              <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-500 rounded-full" />
            )}
            
            {isPassword && !loading && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            )}

            {isSearch && !loading && (
              <Search className="h-4 w-4 text-gray-400" />
            )}

            {rightIcon && !isPassword && !isSearch && !loading && (
              <div className="text-gray-400">
                {rightIcon}
              </div>
            )}

            {success && !loading && (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}

            {error && !loading && (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
          </div>
        </div>

        {/* Helper Text */}
        {(helperText || error) && (
          <div className="mt-2 flex items-start gap-2">
            {error && <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />}
            {success && <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />}
            <span className={cn(
              'text-sm',
              error ? 'text-red-600' : success ? 'text-green-600' : 'text-gray-500'
            )}>
              {error || helperText}
            </span>
          </div>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

// Search Input Component
export const SearchInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type'>>(
  ({ className, ...props }, ref) => (
    <Input
      ref={ref}
      type="search"
      leftIcon={<Search className="h-4 w-4" />}
      placeholder="Ara..."
      className={cn('bg-gray-50', className)}
      {...props}
    />
  )
)
SearchInput.displayName = 'SearchInput'

// Medical Input Component (for medical data)
export const MedicalInput = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <Input
      ref={ref}
      variant="medical"
      className={cn('font-mono', className)}
      {...props}
    />
  )
)
MedicalInput.displayName = 'MedicalInput'

export { Input, SearchInput, MedicalInput }
