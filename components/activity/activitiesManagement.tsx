"use client"

import { useState, useEffect, useMemo } from "react"
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
  MoreHorizontal,
  Building2,
  MapPin,
  Activity,
  ChevronLeft,
  ChevronRight,
  FilterX,
  X,
  Filter,
  Users,
  Table,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
  Hash
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

// UPDATED interface with metadata
interface ActivitiesManagementProps {
  activities: DailyActivity[]
  stats: any
  pagination: any
  filters: any
  isLoading: boolean
  isAdmin: boolean
  isSuperAdmin: boolean
  isLineManager: boolean
  directReportsCount: number
  directReports?: Employee[]
  onFilterChange: (filters: any) => void
  onRefresh: () => void
  onExport: () => void
  onViewDetails: (activity: DailyActivity) => void
  regions: readonly string[]  // FIXED: Pass regions from parent (not derived from filtered data)
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
  directReportsCount,
  directReports = [],
  onFilterChange,
  onRefresh,
  onExport,
  onViewDetails,
  regions,  // Now using passed regions instead of deriving
  getAvailableBranches,
  getStatusColor
}: ActivitiesManagementProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"cards" | "table">("table")
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [activeDatePreset, setActiveDatePreset] = useState<string | null>(null)
  
  const [localFilters, setLocalFilters] = useState({
    date: "",
    status: "all",
    region: "all",
    branch: "all",
    user: "all",
    page: 1,
    limit: 20
  })

  const availableBranches = useMemo(() => {
    if (localFilters.region && localFilters.region !== "all") {
      return getAvailableBranches(localFilters.region)
    }
    return []
  }, [localFilters.region, getAvailableBranches])

  const debouncedSearch = useDebounce(searchQuery, 300)

  const allPossibleUsers = useMemo(() => {
    const userMap = new Map();
    
    activities.forEach(activity => {
      const user = getActivityUser(activity);
      if (user && user._id) {
        if (!userMap.has(user._id)) {
          userMap.set(user._id, {
            id: user._id,
            name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown',
            id_card: user.id_card || 'N/A',
            initials: `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase(),
            region: user.region || '',
            branch: user.branch || ''
          });
        }
      }
    });

    let usersArray = Array.from(userMap.values());
    
    if (isLineManager && directReports.length > 0) {
      const directReportIds = directReports.map(report => report._id);
      usersArray = usersArray.filter(user => directReportIds.includes(user.id));
    }

    return usersArray.sort((a, b) => a.name.localeCompare(b.name));
  }, [activities, isLineManager, directReports])

  const selectedUserInfo = useMemo(() => {
    if (!localFilters.user || localFilters.user === "all") return null;
    return allPossibleUsers.find(u => u.id === localFilters.user);
  }, [localFilters.user, allPossibleUsers])

  // Function to format date as YYYY-MM-DD
  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Quick date preset handlers
  const handleDatePreset = (preset: string) => {
    setActiveDatePreset(preset);
    const today = new Date();
    
    let dateValue = "";
    
    switch (preset) {
      case "Today":
        dateValue = formatDateForInput(today);
        break;
        
      case "Yesterday":
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        dateValue = formatDateForInput(yesterday);
        break;
        
      case "Last 7 Days":
        const lastWeek = new Date(today);
        lastWeek.setDate(today.getDate() - 6); // Last 7 days includes today
        dateValue = formatDateForInput(lastWeek);
        break;
        
      case "This Month":
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        dateValue = formatDateForInput(firstDayOfMonth);
        break;
        
      case "Last Month":
        const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        // For "Last Month" preset, we'll use a date range approach
        // Since our API expects a single date, we'll use the first day
        dateValue = formatDateForInput(firstDayOfLastMonth);
        break;
        
      case "Last 30 Days":
        const last30Days = new Date(today);
        last30Days.setDate(today.getDate() - 29);
        dateValue = formatDateForInput(last30Days);
        break;
        
      default:
        dateValue = "";
    }
    
    handleFilterChange({ date: dateValue });
  }

  // Clear date preset when manually changing date
  const handleDateChange = (date: string) => {
    setActiveDatePreset(null);
    handleFilterChange({ date });
  }

  const handleFilterChange = (updates: Partial<typeof localFilters>) => {
    const newFilters = { ...localFilters, ...updates, page: 1 }
    setLocalFilters(newFilters)
    
    const backendFilters = {
      ...newFilters,
      status: newFilters.status === "all" ? "" : newFilters.status,
      region: newFilters.region === "all" ? "" : newFilters.region,
      branch: newFilters.branch === "all" ? "" : newFilters.branch,
      user: newFilters.user === "all" ? "" : newFilters.user,
      search: debouncedSearch
    }
    
    onFilterChange(backendFilters)
  }

  useEffect(() => {
    const backendFilters = {
      ...localFilters,
      status: localFilters.status === "all" ? "" : localFilters.status,
      region: localFilters.region === "all" ? "" : localFilters.region,
      branch: localFilters.branch === "all" ? "" : localFilters.branch,
      user: localFilters.user === "all" ? "" : localFilters.user,
      search: debouncedSearch,
      page: 1
    }
    onFilterChange(backendFilters)
  }, [debouncedSearch])

  const handleResetFilters = () => {
    setSearchQuery("")
    setActiveDatePreset(null)
    setLocalFilters({ date: "", status: "all", region: "all", branch: "all", user: "all", page: 1, limit: 20 })
    
    onFilterChange({ 
      date: "", 
      status: "", 
      region: "", 
      branch: "", 
      user: "", 
      page: 1, 
      limit: 20, 
      search: "" 
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      month: 'short', day: 'numeric', year: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (searchQuery) count++
    if (localFilters.date) count++
    if (localFilters.status !== "all") count++
    if (localFilters.region !== "all") count++
    if (localFilters.branch !== "all") count++
    if (localFilters.user !== "all") count++
    return count
  }

  const hasActiveFilters = getActiveFilterCount() > 0

  // Date presets configuration
  const datePresets = [
    { label: "Today", value: "Today" },
    { label: "Yesterday", value: "Yesterday" },
    { label: "Last 7 Days", value: "Last 7 Days" },
    { label: "This Month", value: "This Month" },
    { label: "Last 30 Days", value: "Last 30 Days" },
    { label: "Last Month", value: "Last Month" },
  ]

  // Get readable date display for preset
  const getDatePresetDisplay = () => {
    if (!activeDatePreset || !localFilters.date) return null;
    
    const date = new Date(localFilters.date);
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    };
    
    switch (activeDatePreset) {
      case "Today":
      case "Yesterday":
        return date.toLocaleDateString('en-NG', options);
      case "Last 7 Days":
        const endDate = new Date(date);
        endDate.setDate(date.getDate() + 6);
        return `${date.toLocaleDateString('en-NG', options)} - ${endDate.toLocaleDateString('en-NG', options)}`;
      case "This Month":
        const monthName = date.toLocaleDateString('en-NG', { month: 'long', year: 'numeric' });
        return `All of ${monthName}`;
      case "Last 30 Days":
        const endDate30 = new Date(date);
        endDate30.setDate(date.getDate() + 29);
        return `${date.toLocaleDateString('en-NG', options)} - ${endDate30.toLocaleDateString('en-NG', options)}`;
      case "Last Month":
        const lastMonthDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        const lastMonthName = lastMonthDate.toLocaleDateString('en-NG', { month: 'long', year: 'numeric' });
        return `All of ${lastMonthName}`;
      default:
        return date.toLocaleDateString('en-NG', options);
    }
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Consolidated Filter Bar */}
        <Card className="border-slate-200 rounded-xl">
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Top Row: Search and Actions */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="flex-1 min-w-0">
                  <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <Input
                      placeholder="Search activities, descriptions, users, or ID cards..."
                      className="pl-9 h-10 focus-visible:ring-[#ec3338] border-slate-200 rounded-lg"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                        onClick={() => setSearchQuery("")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Tip: You can search by employee name, ID card (e.g., "KE175"), or activity description
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* View Mode Toggle */}
                  <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-1">
                    <Button
                      variant={viewMode === "table" ? "default" : "ghost"}
                      size="icon"
                      className={cn("h-8 w-8 rounded-md", viewMode === "table" && "bg-white shadow-sm")}
                      onClick={() => setViewMode("table")}
                    >
                      <Table className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "cards" ? "default" : "ghost"}
                      size="icon"
                      className={cn("h-8 w-8 rounded-md", viewMode === "cards" && "bg-white shadow-sm")}
                      onClick={() => setViewMode("cards")}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Export Button */}
                  <Button
                    size="sm"
                    onClick={onExport}
                    className="h-10 gap-2 bg-[#ec3338] hover:bg-[#d42c31] shadow-sm text-white rounded-lg"
                    disabled={activities.length === 0}
                  >
                    <Download size={16} />
                    Export
                  </Button>
                </div>
              </div>

              {/* Quick Filters Row */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Status Filter */}
                  <div className="min-w-[140px]">
                    <Select 
                      value={localFilters.status} 
                      onValueChange={(v) => handleFilterChange({ status: v })}
                    >
                      <SelectTrigger className="h-9 border-slate-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Activity className="h-3.5 w-3.5" />
                          <span className="text-sm">
                            {localFilters.status === "all" ? "All Status" : localFilters.status}
                          </span>
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="ongoing">Ongoing</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Region Filter */}
                  <div className="min-w-[140px]">
                    <Select 
                      value={localFilters.region} 
                      onValueChange={(v) => handleFilterChange({ region: v, branch: "all" })}
                    >
                      <SelectTrigger className="h-9 border-slate-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5" />
                          <span className="text-sm">
                            {localFilters.region === "all" ? "All Regions" : localFilters.region}
                          </span>
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Regions</SelectItem>
                        {regions.map(r => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Branch Filter */}
                  <div className="min-w-[140px]">
                    <Select 
                      value={localFilters.branch} 
                      onValueChange={(v) => handleFilterChange({ branch: v })}
                      disabled={localFilters.region === "all"}
                    >
                      <SelectTrigger className="h-9 border-slate-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5" />
                          <span className="text-sm">
                            {localFilters.region === "all" ? "Select region" : 
                             localFilters.branch === "all" ? "All Branches" : localFilters.branch}
                          </span>
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Branches</SelectItem>
                        {availableBranches.map(b => (
                          <SelectItem key={b} value={b}>{b}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Advanced Filters Toggle */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-2 border-slate-200 rounded-lg"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  >
                    <Filter className="h-3.5 w-3.5" />
                    More Filters
                    {showAdvancedFilters ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                    {hasActiveFilters && (
                      <Badge className="ml-1 h-5 min-w-5 p-0 flex items-center justify-center bg-[#ec3338] text-white">
                        {getActiveFilterCount()}
                      </Badge>
                    )}
                  </Button>

                  {/* Clear All Button */}
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 gap-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                      onClick={handleResetFilters}
                    >
                      <FilterX className="h-3.5 w-3.5" />
                      Clear All
                    </Button>
                  )}
                </div>

                {/* Advanced Filters (Collapsible) */}
                {showAdvancedFilters && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-slate-200">
                    {/* Date Filter */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Date</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          type="date"
                          value={localFilters.date}
                          onChange={(e) => handleDateChange(e.target.value)}
                          className="pl-10 h-9 border-slate-200 rounded-lg"
                        />
                        {localFilters.date && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                            onClick={() => {
                              setActiveDatePreset(null);
                              handleFilterChange({ date: "" });
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Employee Filter */}
                    {(isSuperAdmin || (isLineManager && allPossibleUsers.length > 0)) && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">Employee</Label>
                        <Select
                          value={localFilters.user}
                          onValueChange={(v) => handleFilterChange({ user: v, region: "all", branch: "all" })}
                        >
                          <SelectTrigger className="h-9 border-slate-200 rounded-lg">
                            <div className="flex items-center gap-2">
                              <User className="h-3.5 w-3.5 text-slate-500" />
                              <span className="text-sm font-medium">
                                {selectedUserInfo ? selectedUserInfo.name : "All Employees"}
                              </span>
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Employees</SelectItem>
                            {allPossibleUsers.map(u => (
                              <SelectItem key={u.id} value={u.id}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{u.name}</span>
                                  <span className="text-xs text-slate-500">
                                    <Hash className="inline h-3 w-3 mr-1" />
                                    {u.id_card}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Quick Date Presets */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Quick Dates</Label>
                      <div className="flex flex-wrap gap-2">
                        {datePresets.map((preset) => (
                          <Button
                            key={preset.value}
                            variant={activeDatePreset === preset.value ? "default" : "outline"}
                            size="sm"
                            className={cn(
                              "h-9 text-xs rounded-lg transition-all",
                              activeDatePreset === preset.value 
                                ? "bg-[#ec3338] text-white hover:bg-[#d42c31] border-[#ec3338]" 
                                : "border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                            )}
                            onClick={() => handleDatePreset(preset.value)}
                          >
                            {preset.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Active Filters Display */}
              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <span className="text-sm font-medium text-blue-700">Active Filters:</span>
                  
                  {searchQuery && (
                    <Badge variant="secondary" className="gap-1 bg-blue-100 text-blue-700 hover:bg-blue-200 border-none rounded-md">
                      <Search className="h-3 w-3" />
                      "{searchQuery}"
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-3 w-3 ml-1 hover:bg-blue-300"
                        onClick={() => setSearchQuery("")}
                      >
                        <X className="h-2 w-2" />
                      </Button>
                    </Badge>
                  )}
                  
                  {localFilters.date && (
                    <Badge variant="secondary" className="gap-1 bg-blue-100 text-blue-700 hover:bg-blue-200 border-none rounded-md">
                      <Calendar className="h-3 w-3" />
                      {activeDatePreset ? (
                        <span className="flex items-center gap-1">
                          {activeDatePreset}
                          {getDatePresetDisplay() && (
                            <span className="text-xs opacity-75">
                              ({getDatePresetDisplay()})
                            </span>
                          )}
                        </span>
                      ) : (
                        new Date(localFilters.date).toLocaleDateString('en-NG')
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-3 w-3 ml-1 hover:bg-blue-300"
                        onClick={() => {
                          setActiveDatePreset(null);
                          handleFilterChange({ date: "" });
                        }}
                      >
                        <X className="h-2 w-2" />
                      </Button>
                    </Badge>
                  )}
                  
                  {localFilters.status !== "all" && (
                    <Badge variant="secondary" className="gap-1 bg-blue-100 text-blue-700 hover:bg-blue-200 border-none rounded-md">
                      <Activity className="h-3 w-3" />
                      {localFilters.status}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-3 w-3 ml-1 hover:bg-blue-300"
                        onClick={() => handleFilterChange({ status: "all" })}
                      >
                        <X className="h-2 w-2" />
                      </Button>
                    </Badge>
                  )}
                  
                  {localFilters.region !== "all" && (
                    <Badge variant="secondary" className="gap-1 bg-blue-100 text-blue-700 hover:bg-blue-200 border-none rounded-md">
                      <MapPin className="h-3 w-3" />
                      {localFilters.region}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-3 w-3 ml-1 hover:bg-blue-300"
                        onClick={() => handleFilterChange({ region: "all", branch: "all" })}
                      >
                        <X className="h-2 w-2" />
                      </Button>
                    </Badge>
                  )}
                  
                  {localFilters.branch !== "all" && (
                    <Badge variant="secondary" className="gap-1 bg-blue-100 text-blue-700 hover:bg-blue-200 border-none rounded-md">
                      <Building2 className="h-3 w-3" />
                      {localFilters.branch}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-3 w-3 ml-1 hover:bg-blue-300"
                        onClick={() => handleFilterChange({ branch: "all" })}
                      >
                        <X className="h-2 w-2" />
                      </Button>
                    </Badge>
                  )}
                  
                  {selectedUserInfo && (
                    <Badge variant="secondary" className="gap-1 bg-blue-100 text-blue-700 hover:bg-blue-200 border-none rounded-md">
                      <User className="h-3 w-3" />
                      {selectedUserInfo.name}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-3 w-3 ml-1 hover:bg-blue-300"
                        onClick={() => handleFilterChange({ user: "all" })}
                      >
                        <X className="h-2 w-2" />
                      </Button>
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="bg-[#ec3338]/5 border border-[#ec3338]/20 rounded-xl p-4">
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
          
          <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4">
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
          
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
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

          {isLineManager && (
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4">
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

        {/* Results Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Activity Log</h2>
            <p className="text-sm text-slate-500">
              Showing {activities.length} of {pagination?.totalItems || 0} activities
              {selectedUserInfo && ` • Filtered by: ${selectedUserInfo.name}`}
              {activeDatePreset && ` • Date: ${activeDatePreset}`}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 border-slate-200 hover:bg-slate-50 rounded-lg" 
                  disabled={pagination.page <= 1 || isLoading}
                  onClick={() => handleFilterChange({ page: pagination.page - 1 })}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm font-medium text-slate-700 px-3">
                  Page {pagination.page} of {pagination.totalPages}
                </div>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 border-slate-200 hover:bg-slate-50 rounded-lg" 
                  disabled={pagination.page >= pagination.totalPages || isLoading}
                  onClick={() => handleFilterChange({ page: pagination.page + 1 })}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="gap-2 border-slate-200 hover:bg-slate-50 rounded-lg"
            >
              <RefreshCw size={14} className={cn(isLoading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Activity List - Table View (Default) */}
        {viewMode === "table" ? (
          <Card className="border-slate-200 rounded-xl overflow-hidden">
            {isLoading ? (
              <CardContent className="py-24">
                <div className="flex flex-col items-center justify-center gap-4">
                  <div className="relative">
                    <RefreshCw className="h-10 w-10 animate-spin text-[#ec3338]" />
                    <div className="absolute inset-0 bg-[#ec3338]/20 blur-xl rounded-full animate-pulse" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-700">Loading activities...</p>
                    <p className="text-xs text-slate-500 mt-1">Fetching latest records</p>
                  </div>
                </div>
              </CardContent>
            ) : activities.length === 0 ? (
              <CardContent className="py-24">
                <div className="flex flex-col items-center justify-center gap-4 text-slate-500">
                  <div className="p-4 bg-white rounded-full shadow-sm border border-slate-100 mb-4">
                    <Activity className="h-8 w-8 text-slate-300" />
                  </div>
                  <div className="text-center max-w-sm">
                    <h3 className="font-semibold text-slate-700 mb-1">
                      {hasActiveFilters ? "No activities found" : "No activities yet"}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {hasActiveFilters 
                        ? "Try adjusting your search or filter criteria" 
                        : "Activities will appear here when logged"}
                    </p>
                  </div>
                  {hasActiveFilters && (
                    <Button 
                      variant="outline" 
                      onClick={handleResetFilters} 
                      className="mt-4 border-slate-200"
                    >
                      <FilterX className="h-3.5 w-3.5 mr-2" />
                      Reset All Filters
                    </Button>
                  )}
                </div>
              </CardContent>
            ) : (
              <div className="overflow-x-auto">
                <UITable>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-200">
                      <TableHead className="h-14 font-medium text-sm text-slate-600 pl-6">
                        <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Date & Time</div>
                      </TableHead>
                      <TableHead className="font-medium text-sm text-slate-600">
                        <div className="flex items-center gap-2"><User className="h-4 w-4" /> Employee</div>
                      </TableHead>
                      <TableHead className="font-medium text-sm text-slate-600">
                        <div className="flex items-center gap-2"><Activity className="h-4 w-4" /> Description</div>
                      </TableHead>
                      <TableHead className="font-medium text-sm text-slate-600 text-center">Status</TableHead>
                      <TableHead className="font-medium text-sm text-slate-600">
                        <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Location</div>
                      </TableHead>
                      <TableHead className="text-right pr-6"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activities.map((activity) => {
                      const user = getActivityUser(activity)
                      const isOngoing = activity.status === "ongoing"
                      
                      return (
                        <TableRow 
                          key={activity._id} 
                          className={cn(
                            "hover:bg-slate-50/50 transition-colors border-b border-slate-100 group",
                            isOngoing && "bg-[#ec3338]/5 hover:bg-[#ec3338]/10"
                          )}
                        >
                          <TableCell className="py-4 pl-6">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-slate-900">
                                {formatDate(activity.date)}
                              </span>
                              <div className="flex items-center gap-1 text-xs text-slate-500">
                                <Clock className="h-3 w-3" />
                                {activity.timeInterval}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {user ? (
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-10 h-10 rounded-lg flex items-center justify-center border",
                                  isOngoing 
                                    ? "bg-[#ec3338]/10 border-[#ec3338]/20 text-[#ec3338]" 
                                    : "bg-slate-100 border-slate-200 text-slate-600"
                                )}>
                                  <span className="text-sm font-medium">
                                    {`${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-sm font-medium text-slate-900 truncate">
                                    {user.first_name} {user.last_name}
                                  </span>
                                  <div className="flex items-center gap-1 text-xs text-slate-500">
                                    <Hash className="h-3 w-3" />
                                    {user.id_card}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-slate-400 text-sm">
                                <User className="h-3.5 w-3.5" /> Unassigned
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="max-w-[300px]">
                            <p className="text-sm text-slate-700 leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all">
                              {activity.description}
                            </p>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge 
                              className={cn(
                                "capitalize text-xs px-3 py-1 rounded-md border-none",
                                activity.status === "ongoing" ? "bg-[#ec3338] text-white" : 
                                activity.status === "completed" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : 
                                "bg-slate-100 text-slate-600 border-slate-200"
                              )}
                            >
                              {activity.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user?.branch ? (
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Building2 className="h-4 w-4 text-slate-400" />
                                {user.branch}
                              </div>
                            ) : (
                              <span className="text-sm text-slate-400">Remote</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onViewDetails(activity)}
                              className="h-9 w-9 p-0 hover:bg-slate-100 hover:text-slate-900 border-slate-200 rounded-lg"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </UITable>
              </div>
            )}
          </Card>
        ) : (
          /* Card View (Grid Layout) */
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              <div className="col-span-full py-24 flex flex-col items-center">
                <RefreshCw className="h-10 w-10 animate-spin text-[#ec3338]" />
              </div>
            ) : activities.length === 0 ? (
              <div className="col-span-full py-24 flex flex-col items-center text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <div className="p-4 bg-white rounded-full shadow-sm border border-slate-100 mb-4">
                  <Activity className="h-12 w-12 text-slate-300" />
                </div>
                <h3 className="font-semibold text-slate-700 mb-1">
                  {hasActiveFilters ? "No activities found" : "No activities yet"}
                </h3>
                <p className="text-sm text-slate-500 max-w-md mb-4">
                  {hasActiveFilters 
                    ? "Try adjusting your search or filter criteria" 
                    : "Activities will appear here when logged by your team"}
                </p>
                {hasActiveFilters && (
                  <Button 
                    variant="outline" 
                    onClick={handleResetFilters} 
                    className="gap-2 border-slate-200"
                  >
                    <FilterX size={14} />
                    Reset Filters
                  </Button>
                )}
              </div>
            ) : (
              activities.map((activity) => {
                const user = getActivityUser(activity)
                const isOngoing = activity.status === "ongoing"
                const hasStaff = !!user
                
                return (
                  <div 
                    key={activity._id} 
                    className={cn(
                      "flex flex-col p-4 border rounded-xl transition-all",
                      isOngoing 
                        ? hasStaff 
                          ? "bg-[#ec3338]/5 border-[#ec3338]/20 hover:border-[#ec3338]/30" 
                          : "bg-white border-[#ec3338]/20 hover:border-[#ec3338]/30" 
                        : "bg-white border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center border",
                          isOngoing 
                            ? "bg-[#ec3338]/10 border-[#ec3338]/20 text-[#ec3338]" 
                            : "bg-slate-100 border-slate-200 text-slate-600"
                        )}>
                          <Activity size={18} />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-900">
                              {formatDate(activity.date)}
                            </span>
                            <Badge 
                              className={cn(
                                "text-[10px] px-2 py-0 border-none",
                                isOngoing 
                                  ? "bg-[#ec3338] text-white" 
                                  : "bg-slate-100 text-slate-600"
                              )}
                            >
                              {activity.timeInterval}
                            </Badge>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-[10px] px-1.5 py-0",
                              isOngoing 
                                ? "border-[#ec3338]/30 bg-[#ec3338]/10 text-[#ec3338]" 
                                : activity.status === "completed"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 bg-slate-50 text-slate-600"
                            )}
                          >
                            {activity.status}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onViewDetails(activity)}
                        className="h-8 w-8 border-slate-200 hover:bg-slate-100 hover:border-slate-300 rounded-lg"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <p className="text-sm text-slate-700 leading-relaxed mb-4 line-clamp-3">
                      {activity.description}
                    </p>
                    
                    {user && (
                      <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-lg border border-slate-100 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                          <span className="text-xs font-medium text-slate-700">
                            {`${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {user.first_name} {user.last_name}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Hash className="h-3 w-3" />
                            {user.id_card}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {user.branch || 'Remote'}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <Button
                      onClick={() => onViewDetails(activity)}
                      className="w-full bg-slate-900 hover:bg-[#ec3338] text-white font-medium text-sm rounded-lg h-9 transition-all"
                    >
                      View Details
                    </Button>
                  </div>
                )
              })
            )}
          </div>
        )}
        
        {/* Summary Footer */}
        {activities.length > 0 && viewMode === "table" && (
          <div className="pt-4 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
              <div className="text-slate-600">
                Showing <span className="font-semibold text-[#ec3338]">{activities.length}</span> of{" "}
                <span className="font-semibold">{pagination?.totalItems || 0}</span> activities
              </div>
              <div className="flex items-center gap-4 text-slate-500">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#ec3338]"></div>
                  <span>Ongoing activities</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span>Completed</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                  <span>Other</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}