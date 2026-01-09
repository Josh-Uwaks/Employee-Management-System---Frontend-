"use client"

import React, { useState, useEffect } from "react"
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2,
  Activity 
} from "lucide-react"
import { useAuth } from "@/context/authContext"
import { showToast } from "@/lib/toast"

interface LoginPageProps {
  onNext?: () => void
}

export default function LoginPage({ onNext }: LoginPageProps) {
  const { login, loading: authLoading } = useAuth()
  
  const [employeeId, setEmployeeId] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loginSuccess, setLoginSuccess] = useState(false)
  const [errors, setErrors] = useState({ employeeId: "", password: "" })
  const [touched, setTouched] = useState({ employeeId: false, password: false })

  const validateEmployeeId = (id: string) => {
    if (!id.trim()) return "Employee ID is required"
    const idPattern = /^KE\d{3}$/
    if (!idPattern.test(id.toUpperCase())) {
      return "Employee ID must follow format KE123 (KE followed by 3 digits)"
    }
    return ""
  }

  const validatePassword = (pass: string) => {
    if (!pass) return "Password is required"
    if (pass.length < 6) return "Password must be at least 6 characters"
    return ""
  }

  useEffect(() => {
    if (touched.employeeId) {
      setErrors(prev => ({ ...prev, employeeId: validateEmployeeId(employeeId) }))
    }
    if (touched.password) {
      setErrors(prev => ({ ...prev, password: validatePassword(password) }))
    }
  }, [employeeId, password, touched])

  const handleBlur = (field: "employeeId" | "password") => {
    setTouched(prev => ({ ...prev, [field]: true }))
  }

  const handleLoginClick = async (e?: React.MouseEvent) => {
    e?.preventDefault?.();
    
    setTouched({ employeeId: true, password: true })
    
    const idError = validateEmployeeId(employeeId)
    const passwordError = validatePassword(password)
    setErrors({ employeeId: idError, password: passwordError })
    
    if (idError || passwordError) return

    setIsLoading(true)
    try {
      const result = await login(employeeId.toUpperCase(), password)

      if (result?.requiresOtp) {
        showToast.success("Login successful! Please verify OTP.")
        if (onNext) onNext()
      } else {
        showToast.success(`Welcome back, ${employeeId}!`)
        setLoginSuccess(true)
        setTimeout(() => {
          console.log('Login successful!', { employeeId: employeeId.toUpperCase() })
        }, 1000)
      }
    } catch (err: any) {
      console.error("Login failed:", err)
      
      if (err.locked) {
        const lockMessage = err.lockRemainingMinutes 
          ? `Account locked. Try again in ${err.lockRemainingMinutes} minute(s).`
          : 'Account locked. Please try again later.'
        
        showToast.error(lockMessage)
        setErrors({ 
          employeeId: "", 
          password: "Account is locked" 
        })
      } else if (err.attemptsRemaining !== undefined) {
        const errorMessage = err.message || 'Login failed'
        showToast.error(`${errorMessage} (${err.attemptsRemaining} attempt(s) remaining)`)
        setErrors({ 
          employeeId: "", 
          password: `Invalid credentials. ${err.attemptsRemaining} attempt(s) remaining` 
        })
      } else if (err.requiresVerification) {
        showToast.info("Please verify your account with OTP")
        if (onNext) onNext()
      } else {
        showToast.error(err.message || "Invalid Employee ID or password")
        setErrors({ 
          employeeId: "", 
          password: "Invalid Employee ID or password" 
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSubmitting && isFormValid) {
      handleLoginClick()
    }
  }

  const isSubmitting = isLoading || authLoading
  const isFormValid = !validateEmployeeId(employeeId) && !validatePassword(password) && employeeId && password

  if (loginSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Login Successful!</h2>
          <p className="text-gray-600">Welcome back, you've been successfully logged in.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800">Kadick Daily Log</h1>
            <p className="text-gray-600 text-sm">Monitoring System</p>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#ec3338' }}>
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Kadick Daily Log</h1>
          <p className="text-gray-600">Monitoring System</p>
        </div>

        

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8" onKeyDown={handleKeyPress}>
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Sign In</h2>
            <p className="text-gray-600 text-sm">Enter your credentials to continue</p>
          </div>

          {/* Employee ID Field */}
          <div className="mb-5">
            <label htmlFor="employeeId" className="block text-sm font-semibold text-gray-700 mb-2">
              Employee ID
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="employeeId"
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                onBlur={() => handleBlur("employeeId")}
                disabled={isSubmitting}
                className={`w-full pl-11 pr-4 py-3 border-2 rounded-lg focus:outline-none transition-colors uppercase ${
                  errors.employeeId && touched.employeeId
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-gray-200 focus:border-red-500'
                } disabled:bg-gray-50 disabled:cursor-not-allowed`}
                placeholder="KE123"
                maxLength={5}
              />
            </div>
            {errors.employeeId && touched.employeeId && (
              <div className="flex items-center gap-1 mt-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.employeeId}</span>
              </div>
            )}
          </div>

          {/* Password Field */}
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => handleBlur("password")}
                disabled={isSubmitting}
                className={`w-full pl-11 pr-11 py-3 border-2 rounded-lg focus:outline-none transition-colors ${
                  errors.password && touched.password
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-gray-200 focus:border-red-500'
                } disabled:bg-gray-50 disabled:cursor-not-allowed`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isSubmitting}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors disabled:cursor-not-allowed"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && touched.password && (
              <div className="flex items-center gap-1 mt-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.password}</span>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={(e) => handleLoginClick(e)}
            disabled={isSubmitting || !isFormValid}
            className="w-full py-3 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
            style={{
              backgroundColor: (isSubmitting || !isFormValid) ? '#d1d5db' : '#ec3338',
              cursor: (isSubmitting || !isFormValid) ? 'not-allowed' : 'pointer',
              opacity: 1
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting && isFormValid) {
                e.currentTarget.style.backgroundColor = '#d62d32';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting && isFormValid) {
                e.currentTarget.style.backgroundColor = '#ec3338';
              }
            }}
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Need help?{' '}
              <a 
                href="mailto:devs@kadickintegrated.com" 
                className="font-semibold hover:underline" 
                style={{ color: '#ec3338' }}
              >
                devs@kadickintegrated.com
              </a>
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Forgot your password? Contact your administrator
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}