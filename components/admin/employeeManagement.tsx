import { Employee, Department, Region, Branch } from "@/lib/admin"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { 
  Search, MapPin, ShieldCheck, Edit, XCircle, 
  CheckCircle, Lock, Unlock, ShieldAlert, UserPlus, UserX,
  Filter, Users, UserCog, Mail, Calendar,
  Building2, MapPin as MapIcon, Eye, AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"

interface EmployeeManagementProps {
  employees: Employee[]
  departments: Department[]
  searchQuery: string
  statusFilter: string
  isLoading: boolean
  isActionLoading: boolean
  authUser: any
  onSearchChange: (query: string) => void
  onStatusFilterChange: (filter: string) => void
  onEdit: (employee: Employee) => void
  onStatusToggle: (employee: Employee) => void
  onLock: (employee: Employee) => void
  getDepartmentName: (employee: Employee) => string
  canManageUser: (employee: Employee) => boolean
  onDelete?: (employee: Employee) => void
  canRegisterUser?: boolean
  onRegisterUser?: () => void
  // Updated location props - make them more flexible
  getFullLocation?: (employee: Employee) => string
  regions?: readonly string[] // Changed from Region[] to string[]
  getAvailableBranches?: (region: string) => string[] // Changed return type to string[]
}


export default function EmployeeManagement({
  employees,
  departments,
  searchQuery,
  statusFilter,
  isLoading,
  isActionLoading,
  authUser,
  onSearchChange,
  onStatusFilterChange,
  onEdit,
  onStatusToggle,
  onLock,
  getDepartmentName,
  canManageUser,
  onDelete,
  canRegisterUser,
  onRegisterUser,
  // Updated location props with defaults
  getFullLocation,
  regions = [],
  getAvailableBranches = () => [],
}: EmployeeManagementProps) {
  
  // Filter employees based on search and status
  const filteredEmployees = employees.filter((emp) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch = 
      `${emp.first_name} ${emp.last_name} ${emp.email} ${emp.id_card}`.toLowerCase().includes(q)

    if (!matchesSearch) return false

    switch (statusFilter) {
      case "locked": return emp.isLocked
      case "unverified": return !emp.isVerified
      case "active": return !emp.isLocked && emp.isVerified && emp.is_active
      case "inactive": return !emp.is_active
      default: return true
    }
  })

  // Helper function to get location display
  const getLocationDisplay = (employee: Employee): string => {
    if (getFullLocation) {
      return getFullLocation(employee);
    }
    // Fallback if getFullLocation is not provided
    if (employee.region && employee.branch) {
      return `${employee.region} - ${employee.branch}`;
    }
    return employee.region || employee.branch || "Not specified";
  };

  // Role-based statistics
  const lockedCount = employees.filter(emp => emp.isLocked).length
  const activeCount = employees.filter(emp => !emp.isLocked && emp.isVerified && emp.is_active).length
  const unverifiedCount = employees.filter(emp => !emp.isVerified).length

  // Viewer role helper
  const isSuperAdmin = authUser?.role === "SUPER_ADMIN"

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-24" /></div>
            <Skeleton className="h-8 w-24" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border border-slate-200 rounded-xl bg-slate-50/50">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-48 sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input 
              placeholder="Search by name, ID or email..." 
              className="pl-9 h-9 focus-visible:ring-[#ec3338] border-slate-200" 
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-32 h-9 border-slate-200 focus:ring-[#ec3338]">
              <div className="flex items-center gap-2"><Filter size={14} /><SelectValue /></div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Staff</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="locked">Locked</SelectItem>
              <SelectItem value="unverified">Unverified</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {canRegisterUser && onRegisterUser && (
          <Button 
            onClick={onRegisterUser} 
            className="gap-2 bg-[#ec3338] hover:bg-[#d42c31] shadow-sm text-white"
          >
            <UserPlus size={16} />
            Add New Staff
          </Button>
        )}
      </div>

      {/* Role-based Access Notice */}
      {employees.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-amber-600 mt-0.5" size={18} />
            <div>
              <h4 className="font-medium text-amber-800">No Staff Found</h4>
              <p className="text-sm text-amber-700 mt-1">
                You don't have any direct reports assigned to you. Only SUPER_ADMIN can view all users.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#ec3338]/5 border border-[#ec3338]/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-[#ec3338]">Active Staff</p>
                  <p className="text-xl font-bold text-[#ec3338]">{activeCount}</p>
                </div>
                <div className="p-2 bg-[#ec3338]/10 rounded-lg">
                  <Users className="text-[#ec3338]" size={18} />
                </div>
              </div>
            </div>
            
            <div className="bg-rose-50/50 border border-rose-100 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-rose-700">Locked Accounts</p>
                  <p className="text-xl font-bold text-rose-900">{lockedCount}</p>
                </div>
                <div className="p-2 bg-rose-100 rounded-lg">
                  <Lock className="text-rose-600" size={18} />
                </div>
              </div>
            </div>
            
            <div className="bg-amber-50/50 border border-amber-100 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-amber-700">Pending Verification</p>
                  <p className="text-xl font-bold text-amber-900">{unverifiedCount}</p>
                </div>
                <div className="p-2 bg-amber-100 rounded-lg">
                  <ShieldAlert className="text-amber-600" size={18} />
                </div>
              </div>
            </div>
          </div>

          {/* Employee List */}
          {filteredEmployees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                <Users className="text-slate-300" size={32} />
              </div>
              <h3 className="font-semibold text-slate-700 mb-1">No results found</h3>
              <p className="text-sm text-slate-500 max-w-md">
                {searchQuery 
                  ? "No employees match your search criteria. Try adjusting your search term or filter." 
                  : "No employees found with the selected filter."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEmployees.map((emp) => {
                const isRestricted = !canManageUser(emp)
                const isEmployeeSuperAdmin = emp.role === "SUPER_ADMIN"
                
                return (
                  <div 
                    key={emp._id} 
                    className={cn(
                      "flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-xl transition-all",
                      isRestricted 
                        ? "bg-amber-50/30 border-amber-100" 
                        : emp.isLocked
                          ? "bg-rose-50/30 border-rose-100"
                          : emp.is_active && emp.isVerified
                            ? "bg-emerald-50/30 border-emerald-100"
                            : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
                    )}
                  >
                    <div className="flex items-start gap-4 mb-4 sm:mb-0">
                      <div className="shrink-0">
                        <div className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center border font-bold text-white",
                          isRestricted 
                            ? "bg-amber-500 border-amber-600" 
                            : emp.isLocked
                              ? "bg-rose-500 border-rose-600"
                              : emp.is_active && emp.isVerified
                                ? "bg-emerald-500 border-emerald-600"
                                : "bg-slate-500 border-slate-600"
                        )}>
                          {emp.first_name[0]}{emp.last_name[0]}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-slate-900">
                            {emp.first_name} {emp.last_name}
                          </h4>
                          <div className="flex items-center gap-1.5">
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-[10px] px-1.5 py-0",
                                isEmployeeSuperAdmin 
                                  ? "border-indigo-200 bg-indigo-50 text-indigo-700" 
                                  : "border-blue-200 bg-blue-50 text-blue-700"
                              )}
                            >
                              {emp.role}
                            </Badge>
                            {isEmployeeSuperAdmin && (
                              <Badge 
                                className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 border-amber-200"
                              >
                                <ShieldCheck className="w-3 h-3 mr-1" />
                                Admin
                              </Badge>
                            )} 
                          </div>
                        </div>
                        
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                            <div className="flex items-center gap-1">
                              <code className="font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-100">
                                {emp.id_card}
                              </code>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <Mail size={12} />
                              <span>{emp.email}</span>
                            </div>
                            
                            {emp.department && (
                              <div className="flex items-center gap-1">
                                <Building2 size={12} />
                                <span className="font-medium text-slate-700">
                                  {getDepartmentName(emp)}
                                </span>
                              </div>
                            )}
                            
                            {(emp.region || emp.branch) && (
                              <div className="flex items-center gap-1">
                                <MapIcon size={12} />
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="cursor-help border-b border-dashed border-slate-300">
                                      {getLocationDisplay(emp)}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">
                                    <div className="space-y-1">
                                      <p className="text-sm">Region: {emp.region || "Not specified"}</p>
                                      <p className="text-sm">Branch: {emp.branch || "Not specified"}</p>
                                      {getFullLocation && (
                                        <p className="text-sm font-medium mt-1 pt-1 border-t border-slate-200">
                                          Full Location: {getFullLocation(emp)}
                                        </p>
                                      )}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            <Badge className={cn(
                              "text-[10px] px-2 py-0.5 font-medium",
                              emp.isLocked 
                                ? "bg-rose-100 text-rose-700 border-rose-200" 
                                : emp.is_active 
                                  ? "bg-emerald-100 text-emerald-700 border-emerald-200" 
                                  : "bg-slate-100 text-slate-600 border-slate-200"
                            )}>
                              {emp.isLocked ? "Locked" : emp.is_active ? "Active" : "Inactive"}
                            </Badge>
                            
                            {!emp.isVerified && (
                              <Badge 
                                variant="outline" 
                                className="text-[10px] px-2 py-0.5 border-amber-200 text-amber-700 bg-amber-50"
                              >
                                <ShieldAlert className="w-3 h-3 mr-1" />
                                Unverified
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                      {isRestricted ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="p-2 text-amber-600 bg-amber-50 border border-amber-100 rounded-lg flex items-center gap-2">
                              <ShieldAlert size={14} />
                              <span className="text-xs font-medium">Restricted</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p className="text-sm">Insufficient permissions to manage this account</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
                            onClick={() => onEdit(emp)}
                            disabled={isActionLoading}
                          >
                            <Eye size={14} />
                            View
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
                            onClick={() => onEdit(emp)}
                            disabled={isActionLoading}
                          >
                            <Edit size={14} />
                            Edit
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className={cn(
                                  "gap-2 transition-all",
                                  emp.is_active 
                                    ? "border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300" 
                                    : "border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300"
                                )}
                                disabled={isActionLoading}
                              >
                                {emp.is_active ? <XCircle size={14} /> : <CheckCircle size={14} />}
                                {emp.is_active ? "Disable" : "Enable"}
                              </Button>
                            </AlertDialogTrigger>

                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{emp.is_active ? "Disable User" : "Enable User"}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to {emp.is_active ? "disable" : "enable"} {emp.first_name} {emp.last_name}?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onStatusToggle(emp)}>
                                  {emp.is_active ? "Disable" : "Enable"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className={cn(
                              "gap-2 transition-all",
                              emp.isLocked 
                                ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300" 
                                : "border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 hover:border-rose-300"
                            )}
                            onClick={() => onLock(emp)}
                            disabled={isActionLoading}
                          >
                            {emp.isLocked ? <Unlock size={14} /> : <Lock size={14} />}
                            {emp.isLocked ? "Unlock" : "Lock"}
                          </Button>

                          {isSuperAdmin && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="gap-2 border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 hover:border-rose-300"
                              onClick={() => onDelete && onDelete(emp)}
                              disabled={isActionLoading}
                            >
                              <UserX size={14} />
                              Delete
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          
          {/* Summary Footer */}
          {filteredEmployees.length > 0 && (
            <div className="pt-4 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
                <div className="text-slate-600">
                  Showing <span className="font-semibold text-[#ec3338]">{filteredEmployees.length}</span> of{" "}
                  <span className="font-semibold">{employees.length}</span> employees
                </div>
                <div className="flex items-center gap-4 text-slate-500">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span>Active</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                    <span>Locked</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    <span>Pending</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                    <span>Inactive</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}