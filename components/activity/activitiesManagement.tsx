"use client"

import { useState, useEffect } from "react"
import { DailyActivity } from "@/lib/admin"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Search, 
  Filter, 
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
  Activity
} from "lucide-react"
import { cn } from "@/lib/utils"
import { showToast } from "@/lib/toast"

// In ActivitiesManagementProps interface, update the type:
interface ActivitiesManagementProps {
  activities: DailyActivity[]
  stats: any
  pagination: any
  filters: any
  isLoading: boolean
  isAdmin: boolean
  isSuperAdmin: boolean
  isLineManager: boolean
  onFilterChange: (filters: any) => void
  onRefresh: () => void
  onExport: () => void
  onViewDetails: (activity: DailyActivity) => void
  regions: readonly string[]
  getAvailableBranches: (region: string) => string[] // Keep as string[] for flexibility
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
  onFilterChange,
  onRefresh,
  onExport,
  onViewDetails,
  regions,
  getAvailableBranches
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

  // Extract unique values for filters - as strings
  const uniqueRegions = Array.from(new Set(activities
    .map(a => {
      if (a.user && typeof a.user === 'object' && a.user.region) {
        return a.user.region as string;
      }
      return null;
    })
    .filter((region): region is string => region !== null && region !== '')
  ))

  const uniqueBranches = Array.from(new Set(activities
    .map(a => {
      if (a.user && typeof a.user === 'object' && a.user.branch) {
        return a.user.branch as string;
      }
      return null;
    })
    .filter((branch): branch is string => branch !== null && branch !== '')
  ))

  // Fixed: Properly deduplicate users by their ID with comprehensive null checks
  const uniqueUsers = activities.reduce((acc, activity) => {
    if (activity.user && 
        typeof activity.user === 'object' && 
        activity.user._id && 
        (activity.user.first_name || activity.user.last_name)) {
      
      const userId = activity.user._id;
      
      const existingUser = acc.find(u => u.id === userId);
      
      if (!existingUser) {
        acc.push({
          id: userId,
          name: `${activity.user.first_name || ''} ${activity.user.last_name || ''}`.trim() || 'Unknown User',
          id_card: activity.user.id_card || 'N/A'
        });
      }
    }
    return acc;
  }, [] as { id: string; name: string; id_card: string }[])

  useEffect(() => {
    // Apply filters after a short delay to prevent too many API calls
    const timeoutId = setTimeout(() => {
      onFilterChange({
        ...localFilters,
        search: searchQuery
      })
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [localFilters, searchQuery])

  const handleStatusChange = (status: string) => {
    setLocalFilters(prev => ({ ...prev, status }))
  }

  const handleDateChange = (date: string) => {
    setLocalFilters(prev => ({ ...prev, date }))
  }

  const handleRegionChange = (region: string) => {
    setLocalFilters(prev => ({ 
      ...prev, 
      region,
      branch: region === "all" ? "all" : prev.branch
    }))
  }

  const handleBranchChange = (branch: string) => {
    setLocalFilters(prev => ({ ...prev, branch }))
  }

  const handleUserChange = (userId: string) => {
    setLocalFilters(prev => ({ ...prev, user: userId }))
    setSelectedUser(userId)
  }

  const handleResetFilters = () => {
    setSearchQuery("")
    setLocalFilters({
      date: "",
      status: "all",
      region: "all",
      branch: "all",
      user: "",
      page: 1,
      limit: 20
    })
    setSelectedUser("")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'ongoing': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority?: string) => {
    if (!priority) return 'bg-gray-100 text-gray-800 border-gray-200'
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getCategoryIcon = (category?: string) => {
    switch (category?.toLowerCase()) {
      case 'meeting': return '👥'
      case 'training': return '📚'
      case 'break': return '☕'
      case 'work': return '💼'
      case 'other': return '📝'
      default: return '📋'
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-NG', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return 'Invalid Date'
    }
  }

  const formatTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleTimeString('en-NG', {
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Invalid Time'
    }
  }

  // Get filtered branches based on selected region
  const getFilteredBranches = () => {
    if (localFilters.region === "all") {
      return uniqueBranches;
    }
    
    // If we have available branches from props, use those
    if (getAvailableBranches) {
      const availableBranches = getAvailableBranches(localFilters.region);
      // Filter to only show branches that exist in the data
      return availableBranches.filter(branch => 
        uniqueBranches.includes(branch)
      );
    }
    
    // Fallback: return all unique branches
    return uniqueBranches;
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-600">Total Activities</p>
                <p className="text-3xl font-bold text-slate-900">{stats?.total || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Activity className="text-blue-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-gradient-to-br from-green-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-600">Completed</p>
                <p className="text-3xl font-bold text-slate-900">
                  {stats?.byStatus?.completed || stats?.completed || 0}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle className="text-green-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-gradient-to-br from-yellow-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-600">Pending</p>
                <p className="text-3xl font-bold text-slate-900">
                  {stats?.byStatus?.pending || stats?.pending || 0}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-xl">
                <AlertCircle className="text-yellow-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-600">Ongoing</p>
                <p className="text-3xl font-bold text-slate-900">
                  {stats?.byStatus?.ongoing || stats?.ongoing || 0}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <PlayCircle className="text-purple-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters & Search</CardTitle>
          <CardDescription>Filter activities by various criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Search activities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Date Filter */}
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  id="date"
                  type="date"
                  value={localFilters.date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={localFilters.status} onValueChange={handleStatusChange}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* User Filter (for Super Admin) */}
            {isSuperAdmin && (
              <div className="space-y-2">
                <Label htmlFor="user">Employee</Label>
                <Select value={selectedUser} onValueChange={handleUserChange}>
                  <SelectTrigger id="user">
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Employees</SelectItem>
                    {uniqueUsers.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.id_card})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Region & Branch Filters (Row 2) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* Region Filter */}
            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Select value={localFilters.region} onValueChange={handleRegionChange}>
                <SelectTrigger id="region">
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  {uniqueRegions.map(region => (
                    <SelectItem key={region} value={region}>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {region}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Branch Filter */}
            <div className="space-y-2">
              <Label htmlFor="branch">Branch</Label>
              <Select 
                value={localFilters.branch} 
                onValueChange={handleBranchChange}
                disabled={localFilters.region === "all"}
              >
                <SelectTrigger id="branch">
                  <SelectValue placeholder={localFilters.region === "all" ? "Select region first" : "Select branch"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {getFilteredBranches().map(branch => (
                    <SelectItem key={branch} value={branch}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {branch}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleResetFilters} disabled={isLoading}>
            <Filter className="h-4 w-4 mr-2" />
            Reset Filters
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onRefresh} disabled={isLoading}>
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>
            <Button onClick={onExport} disabled={activities.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Activities Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Activities ({activities.length})</CardTitle>
              <CardDescription>
                Showing {activities.length} of {pagination?.totalItems || 0} activities
              </CardDescription>
            </div>
            {pagination && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onFilterChange({ ...localFilters, page: pagination.page - 1 })}
                    disabled={pagination.page <= 1 || isLoading}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onFilterChange({ ...localFilters, page: pagination.page + 1 })}
                    disabled={pagination.page >= pagination.totalPages || isLoading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
              <Activity className="h-12 w-12 text-slate-300 mb-4" />
              <h3 className="font-semibold text-slate-700 mb-2">No Activities Found</h3>
              <p className="text-sm text-slate-500 mb-4">
                {searchQuery || Object.values(localFilters).some(f => f !== "" && f !== "all") 
                  ? "Try changing your search or filters"
                  : "No activities have been logged yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div 
                  key={activity._id} 
                  className="p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    {/* Left Column - Time & User Info */}
                    <div className="lg:w-1/4 space-y-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(activity.date)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Clock className="h-4 w-4 text-slate-400" />
                          <span>{activity.timeInterval}</span>
                        </div>
                      </div>
                      
                      {/* User Info */}
                      {activity.user && typeof activity.user === 'object' && (
                        <div className="space-y-1 pt-2 border-t">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-slate-400" />
                            <span className="font-medium">
                              {activity.user.first_name || ''} {activity.user.last_name || ''}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500">
                            {activity.user.id_card || ''} • {activity.user.role || ''}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {activity.user.region && (
                              <Badge variant="outline" className="text-xs">
                                <MapPin className="h-3 w-3 mr-1" />
                                {activity.user.region as string}
                              </Badge>
                            )}
                            {activity.user.branch && (
                              <Badge variant="outline" className="text-xs">
                                <Building2 className="h-3 w-3 mr-1" />
                                {activity.user.branch as string}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Column - Activity Details */}
                    <div className="lg:w-3/4 space-y-3">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge className={getStatusColor(activity.status)}>
                          {activity.status}
                        </Badge>
                        {activity.category && (
                          <Badge variant="outline">
                            {getCategoryIcon(activity.category)} {activity.category}
                          </Badge>
                        )}
                        {activity.priority && (
                          <Badge className={getPriorityColor(activity.priority)}>
                            {activity.priority} priority
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-slate-800 font-medium">{activity.description}</p>
                      
                      <div className="flex flex-wrap gap-2 text-sm text-slate-500">
                        <span>Created: {formatTime(activity.createdAt)}</span>
                        <span>•</span>
                        <span>Updated: {formatTime(activity.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex justify-end mt-4 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewDetails(activity)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}