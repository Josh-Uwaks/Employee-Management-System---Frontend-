"use client"

import React, { useState, useEffect, useCallback } from "react"
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2,
  ArrowRight,
  Shield,
  Building
} from "lucide-react"
import { useAuth } from "@/context/authContext"
import { showToast } from "@/lib/toast"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"

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
  const [isFocused, setIsFocused] = useState({ employeeId: false, password: false })

  const validateEmployeeId = useCallback((id: string) => {
    if (!id.trim()) return "Employee ID is required"
    const idPattern = /^KE\d{3}$/i
    if (!idPattern.test(id)) return "Format: KE followed by 3 digits"
    return ""
  }, [])

  const validatePassword = useCallback((pass: string) => {
    if (!pass) return "Password is required"
    if (pass.length < 6) return "Minimum 6 characters required"
    return ""
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (touched.employeeId) {
        setErrors(prev => ({ ...prev, employeeId: validateEmployeeId(employeeId) }))
      }
      if (touched.password) {
        setErrors(prev => ({ ...prev, password: validatePassword(password) }))
      }
    }, 300)
    
    return () => clearTimeout(timer)
  }, [employeeId, password, touched, validateEmployeeId, validatePassword])

  const handleBlur = (field: "employeeId" | "password") => {
    setTouched(prev => ({ ...prev, [field]: true }))
    setIsFocused(prev => ({ ...prev, [field]: false }))
  }

  const handleFocus = (field: "employeeId" | "password") => {
    setIsFocused(prev => ({ ...prev, [field]: true }))
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ employeeId: true, password: true })
    
    const idError = validateEmployeeId(employeeId)
    const passwordError = validatePassword(password)
    
    if (idError || passwordError) {
      setErrors({ employeeId: idError, password: passwordError })
      return
    }

    setIsLoading(true)
    try {
      const result = await login(employeeId.toUpperCase(), password)
      if (result?.requiresOtp) {
        showToast.success("Login successful! Redirecting to OTP verification...")
        setTimeout(() => {
          if (onNext) onNext()
        }, 1500)
      } else {
        setLoginSuccess(true)
        showToast.success("Welcome back! Redirecting to dashboard...")
        // Simulate redirect delay
        setTimeout(() => {
          // Handle successful login redirect here
        }, 2000)
      }
    } catch (err: any) {
      console.error("Login error:", err)
      const errMsg = err?.response?.data?.message || err?.message || "Invalid credentials"
      showToast.error(errMsg)
    } finally {
      setIsLoading(false)
    }
  }

  const isSubmitting = isLoading || authLoading
  const isFormValid = !validateEmployeeId(employeeId) && !validatePassword(password)

  if (loginSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fffafa] to-[#fee2e2]/20 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/80 backdrop-blur-sm border border-[#fee2e2] rounded-3xl p-12 max-w-md w-full text-center shadow-2xl shadow-red-50"
        >
          <div className="w-24 h-24 bg-[#ec3338]/10 rounded-full flex items-center justify-center mx-auto mb-8 border-8 border-white shadow-lg">
            <CheckCircle2 className="w-12 h-12 text-[#ec3338]" />
          </div>
          <motion.h2 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-semibold text-gray-900 mb-3"
          >
            Welcome Back!
          </motion.h2>
          <motion.p 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-[#ec3338] text-lg"
          >
            Redirecting to your dashboard...
          </motion.p>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ delay: 0.5, duration: 2 }}
            className="mt-8 h-1.5 bg-[#ec3338] rounded-full"
          />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fffafa] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#ec3338]/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-[440px] z-10">
        {/* Header */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex flex-col items-center mb-12 text-center"
        >
          <div className="relative mb-6">
            <div className="absolute inset-0  bg-[#ec3338] rounded-2xl blur-lg opacity-30" />
            <img 
              src="/kadick_logo.png" 
              alt="Kadick Integrated Limited" 
              className="relative h-14 w-auto"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Daily Log System</h1>
          <div className="flex items-center gap-2 text-[#ec3338]">
            <Building className="w-4 h-4" />
            <p className="text-sm font-medium tracking-widest uppercase"> Portal</p>
          </div>
        </motion.div>

        {/* Login Card */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white/90 backdrop-blur-sm border border-[#fee2e2] rounded-2xl shadow-xl shadow-red-50/50 overflow-hidden"
        >
          <div className="p-2 bg-[#ec3338] " />
          
          <form onSubmit={handleLogin} className="p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 bg-red-50 rounded-lg">
                <Shield className="w-5 h-5 text-[#ec3338]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Secure Login</h2>
                <p className="text-sm text-gray-600">Enter your credentials to continue</p>
              </div>
            </div>



            <div className="space-y-6">
              {/* Employee ID Field */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Employee ID
                </label>
                <div className="relative group">
                  <div className={`absolute inset-0 bg-[#ec3338]/5 rounded-xl transition-opacity ${
                    isFocused.employeeId ? 'opacity-100' : 'opacity-0'
                  }`} />
                  <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                    isFocused.employeeId || employeeId ? 'text-[#ec3338]' : 'text-gray-400'
                  }`} />
                  <input
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value.toUpperCase().slice(0, 5))}
                    onFocus={() => handleFocus("employeeId")}
                    onBlur={() => handleBlur("employeeId")}
                    disabled={isSubmitting}
                    maxLength={5}
                    className={`relative w-full pl-12 pr-4 py-3.5 bg-white border rounded-xl outline-none transition-all text-gray-900 placeholder:text-gray-400 ${
                      errors.employeeId && touched.employeeId 
                        ? 'border-[#ec3338] ring-2 ring-[#ec3338]/20' 
                        : 'border-gray-200 focus:border-[#ec3338] focus:ring-2 focus:ring-[#ec3338]/20'
                    } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    placeholder="KE123"
                    autoComplete="username"
                  />
                  {employeeId && !errors.employeeId && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    </motion.div>
                  )}
                </div>
                <AnimatePresence>
                  {errors.employeeId && touched.employeeId && (
                    <motion.p 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-2 text-sm text-[#ec3338] flex items-center gap-1.5"
                    >
                      <AlertCircle className="w-4 h-4" />
                      {errors.employeeId}
                    </motion.p>
                  )}
                </AnimatePresence>
                <p className="mt-1.5 text-xs text-gray-500">
                  Format: KE followed by 3 digits
                </p>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center mb-2">
                  <label className="block text-sm font-medium text-gray-900">
                    Password
                  </label>
                </div>
                <div className="relative group">
                  <div className={`absolute inset-0 bg-[#ec3338]/5 rounded-xl transition-opacity ${
                    isFocused.password ? 'opacity-100' : 'opacity-0'
                  }`} />
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                    isFocused.password || password ? 'text-[#ec3338]' : 'text-gray-400'
                  }`} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => handleFocus("password")}
                    onBlur={() => handleBlur("password")}
                    disabled={isSubmitting}
                    className={`relative w-full pl-12 pr-12 py-3.5 bg-white border rounded-xl outline-none transition-all text-gray-900 placeholder:text-gray-400 ${
                      errors.password && touched.password 
                        ? 'border-[#ec3338] ring-2 ring-[#ec3338]/20' 
                        : 'border-gray-200 focus:border-[#ec3338] focus:ring-2 focus:ring-[#ec3338]/20'
                    } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSubmitting}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#ec3338] transition-colors disabled:opacity-50"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <AnimatePresence>
                  {errors.password && touched.password && (
                    <motion.p 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-2 text-sm text-[#ec3338] flex items-center gap-1.5"
                    >
                      <AlertCircle className="w-4 h-4" />
                      {errors.password}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Login Button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={isSubmitting || !isFormValid}
                className="w-full py-4 px-4 bg-[#ec3338] hover:bg-[#d62d32] disabled:bg-gray-100 text-white rounded-xl transition-all shadow-lg hover:shadow-xl disabled:shadow-none flex items-center justify-center gap-3 font-semibold disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                  </>
                )}
              </motion.button>
            </div>
          </form>


        </motion.div>

        {/* Footer */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-8 text-center space-y-4"
        >
          
          
          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Secure access to Kadick Integrated Limited's internal systems. 
              All activities are monitored and logged.
            </p>
            <p className="text-xs text-gray-400 mt-3 uppercase tracking-widest">
              © {new Date().getFullYear()} Kadick Integrated Limited. All Rights Reserved.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}