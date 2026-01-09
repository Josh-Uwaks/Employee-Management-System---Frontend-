"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/context/authContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Building2, Shield, ArrowLeft, RefreshCw, Mail, Clock, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { Toaster } from "sonner"
import { showToast } from "@/lib/toast"

interface OtpPageProps {
  onSuccess?: () => void
}

export default function OtpPage({ onSuccess }: OtpPageProps) {
  const router = useRouter()
  const { verifyOtp, resendOtp, clearOtpRequirement, pendingIdCard, loading } = useAuth()
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""])
  const [isLoading, setIsLoading] = useState(false)
  const [verified, setVerified] = useState(false)
  const [resendTimer, setResendTimer] = useState(30) // Resend timer (seconds)
  const [idNumber, setIdNumber] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [otpExpiresAt, setOtpExpiresAt] = useState<Date | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<string>("")
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // OTP expiration time (10 minutes)
  const OTP_EXPIRY_MINUTES = 10;

  useEffect(() => {
    // Get the ID number from auth context or localStorage
    if (pendingIdCard) {
      setIdNumber(pendingIdCard)
    } else {
      const storedId = localStorage.getItem("pending_verification_id")
      if (storedId) {
        setIdNumber(storedId)
      }
    }
    
    // Try to get email from user info if available
    const storedUserInfo = localStorage.getItem("user_info")
    if (storedUserInfo) {
      try {
        const userInfo = JSON.parse(storedUserInfo)
        if (userInfo.email) {
          setUserEmail(userInfo.email)
        }
      } catch (e) {
        console.error("Failed to parse user info:", e)
      }
    }
    
    // Get OTP timestamp and calculate expiration
    const otpTimestamp = localStorage.getItem("otp_timestamp")
    if (otpTimestamp) {
      const expiryTime = new Date(parseInt(otpTimestamp) + (OTP_EXPIRY_MINUTES * 60 * 1000))
      setOtpExpiresAt(expiryTime)
    }
    
    // Focus first input on mount
    setTimeout(() => {
      inputRefs.current[0]?.focus()
    }, 100)
  }, [pendingIdCard])

  // Update time remaining countdown
  useEffect(() => {
    if (!otpExpiresAt) return;

    const updateTimeRemaining = () => {
      const now = new Date();
      const diff = otpExpiresAt.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeRemaining("Expired");
        // Automatically clear OTP requirement when expired
        if (!verified) {
          clearOtpRequirement();
          showToast.warning("OTP session expired. Please login again.");
          router.push("/");
        }
        return;
      }
      
      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [otpExpiresAt, verified, clearOtpRequirement, router])

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendTimer])

  // Handle auto-redirect after verification
  useEffect(() => {
    if (verified) {
      const timer = setTimeout(() => {
        router.push("/dashboard"); // Redirect to dashboard after verification
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [verified, router])

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all fields are filled
    if (newOtp.every(digit => digit !== "") && index === 5) {
      handleVerify(newOtp.join(""))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").slice(0, 6).split("")
    
    if (pastedData.every(char => /^\d$/.test(char))) {
      const newOtp = [...otp]
      pastedData.forEach((char, index) => {
        if (index < 6) newOtp[index] = char
      })
      setOtp(newOtp)
      
      // Focus last filled input or first empty
      const lastIndex = pastedData.length - 1
      const nextIndex = Math.min(lastIndex + 1, 5)
      setTimeout(() => {
        inputRefs.current[nextIndex]?.focus()
      }, 0)
      
      // Auto-verify if complete
      if (pastedData.length === 6) {
        handleVerify(newOtp.join(""))
      }
    }
  }

  const handleVerify = async (otpValue: string) => {
    if (!idNumber) {
      showToast.error("ID number not found. Please try logging in again.")
      return
    }

    if (otpValue.length !== 6) {
      showToast.error("Please enter a 6-digit verification code")
      return
    }

    setIsLoading(true)

    try {
      await verifyOtp(idNumber, otpValue)
      setVerified(true)
    } catch (err: any) {
      // Clear OTP fields on error
      setOtp(["", "", "", "", "", ""])
      
      // Focus back to first input
      setTimeout(() => {
        inputRefs.current[0]?.focus()
      }, 100)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const otpValue = otp.join("")
    handleVerify(otpValue)
  }

  const handleResend = async () => {
    setIsLoading(true)
    
    try {
      // The resendOtp function now returns the data
      const data = await resendOtp(idNumber)
      setResendTimer(30)
      setOtp(["", "", "", "", "", ""])
      
      // Reset expiration timer
      const newExpiryTime = new Date(Date.now() + (OTP_EXPIRY_MINUTES * 60 * 1000))
      setOtpExpiresAt(newExpiryTime)
      
      // Update email if returned in response
      if (data.email) {
        setUserEmail(data.email)
      }
      
      // Focus back to first input
      setTimeout(() => {
        inputRefs.current[0]?.focus()
      }, 100)
    } catch (err: any) {
      // Error is handled by Sonner in the auth context
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    // Clear OTP requirement and go back to login
    clearOtpRequirement()
    router.push("/")
  }

  const isExpired = timeRemaining === "Expired";

  return (
    <>
      <Toaster position="top-right" />
      
      <div className="min-h-screen flex bg-linear-to-br from-slate-50 via-red-50/20 to-slate-50">
        {/* Left Side - Branding (Desktop) */}
        <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-slate-800 to-slate-900 p-12 flex-col justify-between relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-500/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Kadick Integrated</h1>
                <p className="text-slate-300 text-sm">HR Management System</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 space-y-8">
            <div className="flex items-center gap-4 p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
              <div className="w-16 h-16 bg-red-500/20 rounded-xl flex items-center justify-center shrink-0">
                <Shield className="w-8 h-8 text-red-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1 text-lg">Secure Authentication</h3>
                <p className="text-slate-300 text-sm">
                  Two-factor authentication ensures your account remains protected at all times.
                </p>
              </div>
            </div>

            <div className="space-y-4 pl-6 border-l-2 border-white/10">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-red-400 rounded-full mt-2 shrink-0"></div>
                <div>
                  <p className="text-white font-medium">Encrypted Connection</p>
                  <p className="text-slate-400 text-sm">Your data is protected with industry-standard encryption</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-red-400 rounded-full mt-2 shrink-0"></div>
                <div>
                  <p className="text-white font-medium">One-Time Password</p>
                  <p className="text-slate-400 text-sm">Each OTP is valid for {OTP_EXPIRY_MINUTES} minutes only</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-red-400 rounded-full mt-2 shrink-0"></div>
                <div>
                  <p className="text-white font-medium">Session Management</p>
                  <p className="text-slate-400 text-sm">Automatic timeout for inactive sessions</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10">
            <p className="text-slate-400 text-sm">
              © 2025 Kadick Integrated Limited. All rights reserved.
            </p>
          </div>
        </div>

        {/* Right Side - OTP Form */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
              <div className="w-12 h-12 bg-linear-to-br from-slate-700 to-slate-900 rounded-2xl flex items-center justify-center shadow-lg">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Kadick Integrated</h1>
                <p className="text-slate-500 text-xs">HR Management System</p>
              </div>
            </div>

            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                {verified ? (
                  // Success State
                  <div className="text-center py-8 animate-in fade-in duration-500">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-300">
                      <Shield className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Verification Successful!</h2>
                    <p className="text-slate-600 mb-6">Your account has been verified. Redirecting to dashboard...</p>
                    <div className="flex justify-center">
                      <div className="w-8 h-8 border-3 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Back Button */}
                    <button
                      onClick={handleBack}
                      className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 mb-6 transition-colors hover:bg-slate-100 p-2 rounded-lg"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Login
                    </button>

                    {/* Header */}
                    <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-in fade-in">
                        <Shield className="w-8 h-8 text-red-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-800 mb-2">Verify Your Identity</h2>
                      <p className="text-slate-600 text-sm">
                        Enter the 6-digit verification code sent to your email
                      </p>
                      
                      {/* OTP Expiration Timer */}
                      {otpExpiresAt && !isExpired && (
                        <div className="mt-4 inline-flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200 animate-in slide-in-from-top-5">
                          <Clock className="w-4 h-4 text-amber-600" />
                          <span className="text-xs font-semibold text-amber-700">OTP expires in:</span>
                          <span className="text-sm font-mono font-bold text-amber-800">{timeRemaining}</span>
                        </div>
                      )}
                      
                      {isExpired && (
                        <div className="mt-4 inline-flex items-center gap-2 bg-red-50 px-4 py-2 rounded-lg border border-red-200 animate-in slide-in-from-top-5">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          <span className="text-xs font-semibold text-red-700">OTP has expired</span>
                        </div>
                      )}
                      
                      {/* Email display */}
                      {userEmail && (
                        <div className="mt-3 inline-flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-lg animate-in slide-in-from-top-5">
                          <Mail className="w-4 h-4 text-slate-500" />
                          <span className="text-xs font-semibold text-slate-500">Sent to:</span>
                          <code className="text-sm font-mono font-bold text-slate-800 truncate max-w-[180px]">
                            {userEmail}
                          </code>
                        </div>
                      )}
                      
                      {/* ID display */}
                      <div className="mt-2 inline-flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-lg animate-in slide-in-from-top-5">
                        <span className="text-xs font-semibold text-slate-500">Employee ID:</span>
                        <code className="text-sm font-mono font-bold text-slate-800">{idNumber || "Not found"}</code>
                      </div>
                    </div>

                    {/* OTP Input Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* OTP Inputs */}
                      <div className="animate-in fade-in duration-500">
                        <label className="text-sm font-semibold text-slate-700 mb-3 block text-center">
                          Enter 6-Digit Verification Code
                        </label>
                        <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                          {otp.map((digit, index) => (
                            <Input
                              key={index}
                              ref={(el) => { inputRefs.current[index] = el }}
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => handleChange(index, e.target.value)}
                              onKeyDown={(e) => handleKeyDown(index, e)}
                              disabled={isLoading || loading || isExpired}
                              className={cn(
                                "w-12 h-14 text-center text-xl font-bold border-2 transition-all duration-200",
                                digit 
                                  ? "border-red-400 bg-red-50 shadow-sm" 
                                  : "border-slate-200 hover:border-slate-300 focus:border-red-500",
                                (isLoading || loading) && "opacity-50 cursor-not-allowed",
                                isExpired && "border-slate-200 bg-slate-100 opacity-50"
                              )}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-slate-500 text-center mt-3">
                          Enter the 6-digit code sent to {userEmail ? `your email (${userEmail})` : 'your email'}
                        </p>
                      </div>

                      {/* Submit Button */}
                      <Button 
                        type="submit" 
                        className="w-full h-12 bg-linear-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold shadow-lg shadow-red-200 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isLoading || loading || otp.some(digit => digit === "") || isExpired}
                      >
                        {isLoading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                            Verifying...
                          </>
                        ) : isExpired ? (
                          "OTP Expired"
                        ) : (
                          "Verify Code"
                        )}
                      </Button>

                      {/* Resend Code */}
                      <div className="text-center pt-4 border-t border-slate-200">
                        <p className="text-sm text-slate-600 mb-3">Didn't receive the code?</p>
                        {isExpired ? (
                          <p className="text-sm text-red-600 font-medium">
                            OTP has expired. Please go back and login again.
                          </p>
                        ) : resendTimer > 0 ? (
                          <div className="space-y-2">
                            <p className="text-sm text-slate-500">
                              Resend available in{" "}
                              <span className="font-semibold text-slate-700">{resendTimer}s</span>
                            </p>
                            <p className="text-xs text-slate-400">
                              Check your spam folder if you don't see the email
                            </p>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleResend}
                            className="gap-2 border-slate-300 hover:bg-slate-50 hover:text-red-600 hover:border-red-300 transition-all duration-200"
                            disabled={isLoading || isExpired}
                          >
                            <RefreshCw className="w-4 h-4" />
                            Resend Code
                          </Button>
                        )}
                      </div>
                    </form>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Help Text */}
            <div className="mt-6 text-center animate-in fade-in duration-700">
              <p className="text-xs text-slate-500">
                Having trouble?{" "}
                <a href="mailto:support@kadick.com" className="text-red-600 hover:text-red-700 font-semibold">
                  Contact Support
                </a>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                OTP valid for {OTP_EXPIRY_MINUTES} minutes only
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}