"use client"

import { useState, useEffect } from "react"
import { DailyActivity, Employee } from "@/lib/admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Search, 
  Calendar, 
  User, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  PlayCircle,
  Download,
  RefreshCw,
  Eye,
  Building2,
  MapPin,
  Activity,
  ChevronLeft,
  ChevronRight,
  FilterX,
  History,
  Info,
  Filter,
  Users
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// ADD directReportsCount to the interface
interface ActivitiesManagementProps {
  activities: DailyActivity[]
  stats: any
  pagination: any
  filters: any
  isLoading: boolean
  isAdmin: boolean
  isSuperAdmin: boolean
  isLineManager: boolean
  directReportsCount: number  // ADD THIS
  onFilterChange: (filters: any) => void
  onRefresh: () => void
  onExport: () => void
  onViewDetails: (activity: DailyActivity) => void
  regions: readonly string[]
  getAvailableBranches: (region: string) => string[]
  getStatusColor: (status: string) => string
}

const getActivityUser = (activity: DailyActivity): Employee | null => {
  if (activity.user && typeof activity.user === 'object') {
    return activity.user as Employee
  }
  return null
}

export default function ActivitiesManagement({
  activities,
  stats,
  pagination,
  filters,
  isLoading,
  isAdmin,
  isSuperAdmin,
  isLineManager,
  directReportsCount,  // ADD THIS PARAMETER
  onFilterChange,
  onRefresh,
  onExport,
  onViewDetails,
  regions,
  getAvailableBranches,
  getStatusColor
}: ActivitiesManagementProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [localFilters, setLocalFilters] = useState({
    date: "",
    status: "all",
    region: "all",
    branch: "all",
    user: "",
    page: 1,
    limit: 20
  })

  const [selectedUser, setSelectedUser] = useState<string>("")

  // Extract unique data for filters
  const uniqueRegions = Array.from(new Set(
    activities
      .map(activity => getActivityUser(activity)?.region || '')
      .filter(region => region !== '')
  ))

  const uniqueBranches = Array.from(new Set(
    activities
      .map(activity => getActivityUser(activity)?.branch || '')
      .filter(branch => branch !== '')
  ))

  const uniqueUsers = activities.reduce((acc, activity) => {
    const user = getActivityUser(activity)
    if (user && user._id) {
      if (!acc.find(u => u.id === user._id)) {
        acc.push({
          id: user._id,
          name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown',
          id_card: user.id_card || 'N/A',
          initials: `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase()
        })
      }
    }
    return acc
  }, [] as { id: string; name: string; id_card: string; initials: string }[])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onFilterChange({ ...localFilters, search: searchQuery })
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [localFilters, searchQuery])

  const handleResetFilters = () => {
    setSearchQuery("")
    setLocalFilters({ date: "", status: "all", region: "all", branch: "all", user: "", page: 1, limit: 20 })
    setSelectedUser("")
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })
  }

  const getCompletionPercentage = () => {
    if (!stats?.total || stats.total === 0) return 0
    const completed = stats?.byStatus?.completed || 0
    return Math.round((completed / stats.total) * 100)
  }

  // Add a helper function to show role-specific messages
  const getEmptyStateMessage = () => {
    if (isLineManager && activities.length === 0) {
      if (directReportsCount === 0) {
        return {
          title: "No Direct Reports",
          message: "You don't have any direct reports assigned to you yet.",
          action: "Contact SUPER_ADMIN to assign staff to you"
        }
      } else {
        return {
          title: "No Activities Found",
          message: "Your direct reports haven't logged any activities yet.",
          action: "Encourage your staff to log their daily activities"
        }
      }
    }
    
    return {
      title: "No activities found",
      message: searchQuery || Object.values(localFilters).some(f => f !== "" && f !== "all") 
        ? "Try adjusting your search criteria"
        : "No activities have been logged yet",
      action: ""
    }
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Role-specific header for LINE_MANAGER */}
        {isLineManager && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Users className="text-blue-600" size={20} />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-800">Line Manager View</h3>
                <p className="text-sm text-blue-600">
                  You are viewing activities of your {directReportsCount} direct report{directReportsCount !== 1 ? 's' : ''}
                </p>
              </div>
              <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                Restricted Access
              </Badge>
            </div>
          </div>
        )}

        {/* Search and Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border border-slate-200 rounded-xl bg-slate-50/50">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-48 sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input 
                placeholder="Search activities by description..." 
                className="pl-9 h-9 focus-visible:ring-[#ec3338] border-slate-200" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select value={localFilters.status} onValueChange={(v) => setLocalFilters(p => ({ ...p, status: v }))}>
              <SelectTrigger className="w-32 h-9 border-slate-200 focus:ring-[#ec3338]">
                <div className="flex items-center gap-2"><Filter size={14} /><SelectValue /></div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activities</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="ongoing">Ongoing</SelectItem>
              </SelectContent>
            </Select>

            <Select value={localFilters.region} onValueChange={(v) => setLocalFilters(p => ({ ...p, region: v, branch: "all" }))}>
              <SelectTrigger className="w-32 h-9 border-slate-200 focus:ring-[#ec3338]">
                <div className="flex items-center gap-2"><MapPin size={14} /><SelectValue /></div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                {uniqueRegions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleResetFilters}
              className="h-9 text-slate-600 border-slate-200 hover:bg-slate-50"
            >
              <FilterX className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button 
              size="sm" 
              onClick={onExport} 
              className="h-9 gap-2 bg-[#ec3338] hover:bg-[#d42c31] shadow-sm text-white"
              disabled={activities.length === 0}
            >
              <Download size={16} />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Summary - Updated with role-specific info */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="bg-[#ec3338]/5 border border-[#ec3338]/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-[#ec3338]">Total Activities</p>
                <p className="text-xl font-bold text-[#ec3338]">{stats?.total?.toLocaleString() || 0}</p>
              </div>
              <div className="p-2 bg-[#ec3338]/10 rounded-lg">
                <Activity className="text-[#ec3338]" size={18} />
              </div>
            </div>
          </div>
          
          <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-emerald-700">Completed</p>
                <p className="text-xl font-bold text-emerald-900">{stats?.byStatus?.completed || 0}</p>
              </div>
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle className="text-emerald-600" size={18} />
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-blue-700">Ongoing</p>
                <p className="text-xl font-bold text-blue-900">{stats?.byStatus?.ongoing || 0}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <PlayCircle className="text-blue-600" size={18} />
              </div>
            </div>
          </div>

          {/* Direct Reports Count - Only show for LINE_MANAGER */}
          {isLineManager && (
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-indigo-700">Direct Reports</p>
                  <p className="text-xl font-bold text-indigo-900">{directReportsCount}</p>
                </div>
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Users className="text-indigo-600" size={18} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Additional Filters Card */}
        <Card className="border border-slate-200">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Advanced Filters</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onRefresh}
                className="text-slate-500 hover:text-[#ec3338]"
                disabled={isLoading}
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    type="date" 
                    value={localFilters.date} 
                    onChange={(e) => setLocalFilters(p => ({ ...p, date: e.target.value }))} 
                    className="pl-10 border-slate-200" 
                  />
                </div>
              </div>

              {isSuperAdmin && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Employee</Label>
                  <Select 
                    value={selectedUser} 
                    onValueChange={(v) => { setSelectedUser(v); setLocalFilters(p => ({ ...p, user: v })) }}
                  >
                    <SelectTrigger className="border-slate-200">
                      <SelectValue placeholder="All Employees" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Employees</SelectItem>
                      {uniqueUsers.map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-medium">Branch</Label>
                <Select 
                  value={localFilters.branch} 
                  onValueChange={(v) => setLocalFilters(p => ({ ...p, branch: v }))} 
                  disabled={localFilters.region === "all"}
                >
                  <SelectTrigger className="border-slate-200">
                    <Building2 className="h-4 w-4 mr-2" />
                    <SelectValue placeholder={localFilters.region === "all" ? "Select region first" : "All Branches"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {uniqueBranches.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Activity Log</h2>
            <p className="text-sm text-slate-500">
              Showing {activities.length} of {pagination?.totalItems || 0} activities
              {isLineManager && ` (from ${directReportsCount} direct report${directReportsCount !== 1 ? 's' : ''})`}
            </p>
          </div>
          
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8 border-slate-200 hover:bg-slate-50" 
                disabled={pagination.page <= 1 || isLoading}
                onClick={() => onFilterChange({ ...localFilters, page: pagination.page - 1 })}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm font-medium text-slate-700 px-3">
                Page {pagination.page} of {pagination.totalPages}
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8 border-slate-200 hover:bg-slate-50" 
                disabled={pagination.page >= pagination.totalPages || isLoading}
                onClick={() => onFilterChange({ ...localFilters, page: pagination.page + 1 })}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* ACTIVITY LIST */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center bg-white rounded-lg border">
              <RefreshCw className="h-8 w-8 animate-spin text-slate-400 mb-4" />
              <p className="text-slate-600">Loading activities...</p>
            </div>
          ) : activities.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center bg-white rounded-lg border">
              <Activity className="h-12 w-12 text-slate-300 mb-4" />
              <p className="font-medium text-slate-900 mb-2">{getEmptyStateMessage().title}</p>
              <p className="text-sm text-slate-500 text-center max-w-md mb-4">
                {getEmptyStateMessage().message}
              </p>
              {getEmptyStateMessage().action && (
                <p className="text-sm text-blue-600 italic">{getEmptyStateMessage().action}</p>
              )}
            </div>
          ) : (
            activities.map((activity) => {
              const user = getActivityUser(activity)
              
              return (
                <Card 
                  key={activity._id} 
                  className="border hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-0">
                    <div className="flex flex-col lg:flex-row">
                      {/* Time and Status Section */}
                      <div className="lg:w-64 p-6 border-b lg:border-b-0 lg:border-r border-slate-100 bg-slate-50">
                        <div className="space-y-4">
                          <Badge className={cn("font-medium", getStatusColor(activity.status))}>
                            {activity.status}
                          </Badge>
                          
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Calendar className="h-4 w-4" />
                              <span className="font-medium">{formatDate(activity.date)}</span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                              <Clock className="h-4 w-4" />
                              <span>{activity.timeInterval}</span>
                            </div>
                          </div>
                          
                          <div className="pt-4 border-t border-slate-100">
                            <div className="text-xs text-slate-500 space-y-1">
                              <div className="flex items-center gap-2">
                                <History className="h-3 w-3" />
                                <span>Updated: {formatTime(activity.updatedAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="flex-1 p-6">
                        <div className="space-y-4">
                          <p className="text-slate-800">
                            {activity.description}
                          </p>
                          
                          {user && (
                            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-[#ec3338] text-white font-semibold">
                                  {`${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-slate-900 truncate">
                                    {user.first_name} {user.last_name}
                                  </h4>
                                  <Badge variant="outline" className="text-xs">
                                    {user.id_card}
                                  </Badge>
                                </div>
                                <div className="flex flex-wrap gap-2 text-sm text-slate-600">
                                  {user.region && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {user.region}
                                    </span>
                                  )}
                                  {user.branch && (
                                    <span className="flex items-center gap-1">
                                      <Building2 className="h-3 w-3" />
                                      {user.branch}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions Section */}
                      <div className="p-6 border-t lg:border-t-0 lg:border-l border-slate-100 flex items-center justify-center">
                        <Button
                          variant="outline"
                          onClick={() => onViewDetails(activity)}
                          className="gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}