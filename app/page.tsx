"use client"

import { Suspense, useEffect, useState } from "react"
import { useAuth } from '@/context/authContext'
import LoginPage from "@/components/auth/login-page"
import OtpPage from "@/components/auth/otp-page"
import EmployeeDashboard from "@/components/dashboards/employee-dashboard"
import AdminDashboard from "@/components/dashboards/admin-dashboard"
import AdminLoadingWrapper from "@/components/admin/adminloadingwrapper"

export default function Home() {
  const { user, loading, logout, requiresOtp, pendingIdCard } = useAuth()
  const [renderKey, setRenderKey] = useState(0)

  // Add a slight delay to prevent flash of content
  useEffect(() => {
    // Force a re-render after auth state stabilizes
    const timer = setTimeout(() => {
      setRenderKey(prev => prev + 1)
    }, 50)
    
    return () => clearTimeout(timer)
  }, [loading, user, requiresOtp])

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If user is authenticated, show appropriate dashboard
  if (user) {
    return user.isAdmin ? (
      <AdminLoadingWrapper>
        <AdminDashboard key={`admin-${user._id}`} onLogout={logout}/>
      </AdminLoadingWrapper>
    ) : (
      <EmployeeDashboard key={`employee-${user._id}`} onLogout={logout}/>
    )
  }

  // If requiresOtp is true and we have a pending ID, show OTP page
  if (requiresOtp && pendingIdCard) {
    return <OtpPage key="otp-page" />
  }

  // Show login page by default
  return <LoginPage key="login-page" />
}