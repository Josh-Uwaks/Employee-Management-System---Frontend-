"use client"

import { ReactNode } from "react"
import { useAuth } from "@/context/authContext"
import { useAdmin } from "@/context/adminContext"
import { AlertTriangle, Loader2 } from "lucide-react"
import { Button } from "../ui/button"

interface AdminLoadingWrapperProps {
  children: ReactNode
}

export default function AdminLoadingWrapper({ children }: AdminLoadingWrapperProps) {
  const { user } = useAuth()
  const { isLoading, error, loadUsers } = useAdmin()

  if (process.env.NODE_ENV === "development") {
  console.log("user in AdminLoadingWrapper:", user)
  console.log("error in AdminLoadingWrapper:", error)
}

  // Non-admins should never be blocked here
  if (!user?.isAdmin) {
    return <>{children}</>
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Dashboard Error</h2>
        <p className="text-gray-600 mb-4 text-center">{error}</p>
        <Button
          onClick={async () => {
            try {
              await loadUsers()
            } catch (err) {
              console.error("Retry loadUsers error:", err)
            }
          }}
          variant="outline"
          disabled={isLoading}
        >
          Retry
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-red-600 mb-4" />
        <p className="text-gray-600">Loading Admin Dashboard…</p>
      </div>
    )
  }

  return <>{children}</>
}
