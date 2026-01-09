import StatCard from "./StatCard"
import { Users, UserCheck, ShieldAlert, Mail, TrendingUp, Activity } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface DashboardStatsProps {
  stats: {
    total: number
    active: number
    locked: number
    unverified: number
  }
  isLoading: boolean
}

export default function DashboardStats({ stats, isLoading }: DashboardStatsProps) {
  // Calculate percentages for visual indicators
  const activePercentage = stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0
  const lockedPercentage = stats.total > 0 ? Math.round((stats.locked / stats.total) * 100) : 0
  const unverifiedPercentage = stats.total > 0 ? Math.round((stats.unverified / stats.total) * 100) : 0

  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Skeleton className="h-7 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-10 w-10 rounded-full" />
                </div>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mb-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Overview</h1>
          <p className="text-slate-500 text-sm mt-1">Real-time staff management dashboard</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-slate-600">Live Data</span>
          </div>
          <span className="text-slate-300">•</span>
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-slate-600">Last updated: Just now</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Staff Card */}
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 group bg-gradient-to-br from-white to-blue-50/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-blue-700 uppercase tracking-wide">Total Staff</h3>
                <p className="text-xs text-slate-500 mt-1">All registered employees</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-3xl font-bold text-slate-900">{stats.total}</span>
              <span className="text-sm text-slate-500">employees</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-slate-600">All departments</span>
            </div>
          </CardContent>
        </Card>

        {/* Active/Verified Card */}
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 group bg-gradient-to-br from-white to-emerald-50/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-emerald-700 uppercase tracking-wide">Active & Verified</h3>
                <p className="text-xs text-slate-500 mt-1">Ready for duty</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <UserCheck className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-3xl font-bold text-slate-900">{stats.active}</span>
              <span className="text-sm font-medium text-emerald-600">
                ({activePercentage}%)
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${activePercentage}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Locked Card */}
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 group bg-gradient-to-br from-white to-red-50/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-red-700 uppercase tracking-wide">Locked Accounts</h3>
                <p className="text-xs text-slate-500 mt-1">Require admin action</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <ShieldAlert className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-3xl font-bold text-slate-900">{stats.locked}</span>
              <span className="text-sm font-medium text-red-600">
                ({lockedPercentage}%)
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-red-400 to-red-500 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.min(lockedPercentage, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Unverified Card */}
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 group bg-gradient-to-br from-white to-amber-50/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-amber-700 uppercase tracking-wide">Pending Verification</h3>
                <p className="text-xs text-slate-500 mt-1">Awaiting OTP confirmation</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Mail className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-3xl font-bold text-slate-900">{stats.unverified}</span>
              <span className="text-sm font-medium text-amber-600">
                ({unverifiedPercentage}%)
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-amber-400 to-amber-500 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.min(unverifiedPercentage, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Bar */}
      <div className="mt-6 bg-gradient-to-r from-slate-50 to-white border border-slate-200 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-sm text-slate-700">
                <span className="font-semibold">{stats.active}</span> active employees
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm text-slate-700">
                <span className="font-semibold">{stats.locked}</span> require attention
              </span>
            </div>
          </div>
          <div className="text-sm text-slate-600">
            System health: <span className="font-semibold text-emerald-600">Good</span>
          </div>
        </div>
      </div>
    </div>
  )
}