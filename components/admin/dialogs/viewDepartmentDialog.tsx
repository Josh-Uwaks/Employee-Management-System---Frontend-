"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Department, Employee } from "@/lib/admin"
import { 
  Building2, 
  Users, 
  UserCog, 
  Mail, 
  Calendar, 
  Hash, 
  FileText, 
  MapPin,
  CheckCircle,
  XCircle,
  Shield,
  Eye,
  ExternalLink,
  ChevronRight,
  User,
  Building,
  AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ViewDepartmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  department: Department | null
  employees: Employee[]
  totalStaffCount?: number
}

export default function ViewDepartmentDialog({
  open,
  onOpenChange,
  department,
  employees,
  totalStaffCount
}: ViewDepartmentDialogProps) {
  if (!department) return null

  // Get staff in this department
  const departmentStaff = employees.filter(emp => {
    if (!emp.department) return false
    if (typeof emp.department === 'string') {
      return emp.department === department._id
    } else {
      return emp.department._id === department._id
    }
  })

  // Get line managers in this department
  const lineManagers = departmentStaff.filter(emp => emp.role === "LINE_MANAGER")
  
  // Get regular staff (not managers)
  const regularStaff = departmentStaff.filter(emp => emp.role === "STAFF")
  
  // Get staff by manager
  const staffByManager = new Map<string, Employee[]>()
  
  lineManagers.forEach(manager => {
    const staff = regularStaff.filter(emp => 
      emp.reportsTo && 
      (typeof emp.reportsTo === 'string' ? emp.reportsTo === manager._id : emp.reportsTo._id === manager._id)
    )
    staffByManager.set(manager._id, staff)
  })

  // Staff without manager
  const staffWithoutManager = regularStaff.filter(emp => !emp.reportsTo)

  // Active staff count
  const activeStaff = departmentStaff.filter(emp => emp.is_active && !emp.isLocked).length
  const lockedStaff = departmentStaff.filter(emp => emp.isLocked).length

  const getFullName = (emp: Employee) => `${emp.first_name} ${emp.last_name}`
  
  const getManagerName = (managerId: string) => {
    const manager = lineManagers.find(m => m._id === managerId)
    return manager ? getFullName(manager) : "Unknown Manager"
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[95vh] overflow-hidden p-0 border-[#ec3338]/20">
        <DialogHeader className="bg-gradient-to-r from-[#ec3338] to-[#ec3338]/90 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {department.name}
              </DialogTitle>
              <DialogDescription className="text-white/80">
                Department details and staff overview
              </DialogDescription>
            </div>
            <Badge className={cn(
              "text-xs font-semibold",
              department.isActive 
                ? "bg-white/20 text-white border-white/30" 
                : "bg-slate-500/20 text-white border-slate-500/30"
            )}>
              {department.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[calc(95vh-180px)] px-6">
          <div className="space-y-6 py-6">
            {/* Department Header Info */}
            <div className="rounded-xl border border-[#ec3338]/10 bg-gradient-to-br from-white to-[#ec3338]/5 p-5">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-[#ec3338]/10 rounded-xl">
                      <Building className="h-6 w-6 text-[#ec3338]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{department.name}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 mt-1">
                        {department.code && (
                          <div className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-lg border border-[#ec3338]/10">
                            <Hash className="h-3.5 w-3.5 text-[#ec3338]" />
                            <code className="font-mono font-semibold text-[#ec3338]">
                              {department.code}
                            </code>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-[#ec3338]" />
                          <span className="font-semibold text-slate-700">{departmentStaff.length} staff</span>
                        </div>
                        
                        {department.createdAt && (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-slate-500" />
                            <span>Created: {formatDate(department.createdAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {department.description && (
                    <div className="pt-4 border-t border-slate-200">
                      <div className="flex items-start gap-3">
                        <FileText className="text-[#ec3338] mt-0.5 shrink-0" size={18} />
                        <div>
                          <p className="text-sm font-medium text-slate-700 mb-1">Description</p>
                          <p className="text-sm text-slate-600">{department.description}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* If this view is restricted (line manager), show note */}
                  {typeof totalStaffCount !== 'undefined' && totalStaffCount > employees.length && (
                    <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-100">
                      <p className="text-sm text-amber-700">Showing <strong>{employees.length}</strong> of <strong>{totalStaffCount}</strong> staff (restricted to your direct reports)</p>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="gap-2 border-[#ec3338]/20 text-[#ec3338] hover:bg-[#ec3338]/10 hover:border-[#ec3338]/30 transition-all"
                  >
                    <ExternalLink size={14} />
                    Full View
                  </Button>
                </div>
              </div>
            </div>

            {/* Department Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-[#ec3338]/5 to-white border border-[#ec3338]/20 rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Total Staff</p>
                    <p className="text-3xl font-bold text-[#ec3338]">{departmentStaff.length}</p>
                    <p className="text-xs text-slate-500">
                      {activeStaff} active • {lockedStaff} locked
                    </p>
                  </div>
                  <div className="p-3 bg-[#ec3338]/10 rounded-xl">
                    <Users className="text-[#ec3338]" size={22} />
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Line Managers</p>
                    <p className="text-3xl font-bold text-blue-700">{lineManagers.length}</p>
                    <p className="text-xs text-slate-500">
                      Manages {regularStaff.length} staff
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <UserCog className="text-blue-600" size={22} />
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Active Staff</p>
                    <p className="text-3xl font-bold text-emerald-700">{activeStaff}</p>
                    <p className="text-xs text-slate-500">
                      {departmentStaff.length > 0 
                        ? `${Math.round((activeStaff / departmentStaff.length) * 100)}% active`
                        : "No staff"
                      }
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-100 rounded-xl">
                    <CheckCircle className="text-emerald-600" size={22} />
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-amber-50 to-white border border-amber-100 rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Unassigned</p>
                    <p className="text-3xl font-bold text-amber-700">{staffWithoutManager.length}</p>
                    <p className="text-xs text-slate-500">
                      Needs manager assignment
                    </p>
                  </div>
                  <div className="p-3 bg-amber-100 rounded-xl">
                    <AlertCircle className="text-amber-600" size={22} />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#ec3338]"></div>
                    <span className="text-sm text-slate-700">Total Staff</span>
                    <span className="font-bold text-[#ec3338]">{departmentStaff.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="text-sm text-slate-700">Active</span>
                    <span className="font-bold text-emerald-700">{activeStaff}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                    <span className="text-sm text-slate-700">Locked</span>
                    <span className="font-bold text-rose-700">{lockedStaff}</span>
                  </div>
                </div>
                <div className="text-sm text-slate-500">
                  Updated just now
                </div>
              </div>
            </div>

            {/* Line Managers Section */}
            {lineManagers.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h4 className="font-bold text-slate-900 flex items-center gap-2">
                      <UserCog className="h-5 w-5 text-blue-600" />
                      Line Managers
                      <Badge className="ml-2 bg-blue-50 text-blue-700 border-blue-200">
                        {lineManagers.length}
                      </Badge>
                    </h4>
                    <p className="text-sm text-slate-600 mt-1">
                      Managers responsible for department supervision
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                    {regularStaff.length} staff managed
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lineManagers.map(manager => {
                    const reports = staffByManager.get(manager._id) || []
                    
                    return (
                      <div key={manager._id} className="border border-blue-100 rounded-xl p-5 bg-gradient-to-br from-blue-50/30 to-white hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <UserCog className="text-blue-600" size={16} />
                              </div>
                              <div>
                                <h5 className="font-semibold text-slate-900">{getFullName(manager)}</h5>
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                  <Badge className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                                    LINE_MANAGER
                                  </Badge>
                                  <span className="text-xs">•</span>
                                  <span>{manager.position || "Manager"}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-y-1.5 text-sm">
                              <div className="flex items-center gap-2">
                                <Mail className="h-3.5 w-3.5 text-slate-400" />
                                <span className="text-slate-600">{manager.email}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <code className="bg-white px-2 py-0.5 rounded border border-blue-100 text-xs font-mono">
                                  {manager.id_card}
                                </code>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-700">{reports.length}</div>
                            <div className="text-xs text-slate-500">Direct reports</div>
                          </div>
                        </div>
                        
                        {reports.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-blue-100">
                            <div className="text-xs font-semibold text-slate-700 mb-3 flex items-center justify-between">
                              <span>Direct Reports</span>
                              <ChevronRight className="h-3 w-3" />
                            </div>
                            <div className="space-y-2">
                              {reports.map(staff => (
                                <div key={staff._id} className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-blue-50 hover:border-blue-100 transition-colors">
                                  <div className="flex items-center gap-2.5">
                                    <div className="p-1.5 bg-slate-50 rounded-lg">
                                      <User className="h-3 w-3 text-slate-500" />
                                    </div>
                                    <div>
                                      <div className="font-medium text-sm text-slate-900">
                                        {staff.first_name} {staff.last_name}
                                      </div>
                                      <div className="text-xs text-slate-500">{staff.position || "Staff"}</div>
                                    </div>
                                  </div>
                                  <Badge className={cn(
                                    "text-xs",
                                    staff.isLocked 
                                      ? "bg-rose-100 text-rose-700 border-rose-200" 
                                      : staff.is_active 
                                        ? "bg-emerald-100 text-emerald-700 border-emerald-200" 
                                        : "bg-slate-100 text-slate-600 border-slate-200"
                                  )}>
                                    {staff.isLocked ? "Locked" : staff.is_active ? "Active" : "Inactive"}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Staff Without Manager */}
            {staffWithoutManager.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h4 className="font-bold text-slate-900 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                      Staff Without Manager
                      <Badge className="ml-2 bg-amber-50 text-amber-700 border-amber-200">
                        {staffWithoutManager.length}
                      </Badge>
                    </h4>
                    <p className="text-sm text-slate-600 mt-1">
                      Staff members requiring manager assignment
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                    Needs attention
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {staffWithoutManager.map(staff => (
                    <div key={staff._id} className="border border-amber-100 rounded-xl p-4 bg-gradient-to-br from-amber-50/30 to-white">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-amber-100 rounded-lg">
                              <User className="h-3.5 w-3.5 text-amber-600" />
                            </div>
                            <div>
                              <h5 className="font-semibold text-slate-900">{getFullName(staff)}</h5>
                              <div className="text-xs text-slate-500">{staff.position || "Staff"}</div>
                            </div>
                          </div>
                          
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-1.5">
                              <Mail className="h-3 w-3 text-slate-400" />
                              <span className="text-slate-600 truncate">{staff.email}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <code className="bg-white px-2 py-0.5 rounded border border-amber-100 text-xs font-mono">
                                {staff.id_card}
                              </code>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-1.5">
                          <Badge className={cn(
                            "text-xs",
                            staff.isLocked 
                              ? "bg-rose-100 text-rose-700 border-rose-200" 
                              : staff.is_active 
                                ? "bg-emerald-100 text-emerald-700 border-emerald-200" 
                                : "bg-slate-100 text-slate-600 border-slate-200"
                          )}>
                            {staff.isLocked ? "Locked" : staff.is_active ? "Active" : "Inactive"}
                          </Badge>
                          
                          {!staff.isVerified && (
                            <Badge className="text-xs bg-amber-100 text-amber-700 border-amber-200">
                              Unverified
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Staff in Department */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <Users className="h-5 w-5 text-[#ec3338]" />
                    All Department Staff
                    <Badge className="ml-2 bg-[#ec3338]/10 text-[#ec3338] border-[#ec3338]/20">
                      {departmentStaff.length}
                    </Badge>
                  </h4>
                  <p className="text-sm text-slate-600 mt-1">
                    Complete list of staff members in this department
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                    <span className="text-slate-600">Active</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                    <span className="text-slate-600">Locked</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-400"></div>
                    <span className="text-slate-600">Inactive</span>
                  </div>
                </div>
              </div>
              
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-slate-50 to-slate-50/50">
                      <tr>
                        <th className="text-left p-4 text-sm font-semibold text-slate-700 border-b border-slate-200">
                          <div className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5" />
                            Name
                          </div>
                        </th>
                        <th className="text-left p-4 text-sm font-semibold text-slate-700 border-b border-slate-200">Role</th>
                        <th className="text-left p-4 text-sm font-semibold text-slate-700 border-b border-slate-200">ID Card</th>
                        <th className="text-left p-4 text-sm font-semibold text-slate-700 border-b border-slate-200">Position</th>
                        <th className="text-left p-4 text-sm font-semibold text-slate-700 border-b border-slate-200">Status</th>
                        <th className="text-left p-4 text-sm font-semibold text-slate-700 border-b border-slate-200">Manager</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {departmentStaff.map(staff => {
                        const manager = lineManagers.find(m => 
                          staff.reportsTo && 
                          (typeof staff.reportsTo === 'string' 
                            ? staff.reportsTo === m._id 
                            : staff.reportsTo._id === m._id)
                        )
                        
                        return (
                          <tr key={staff._id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-2 h-2 rounded-full flex-shrink-0",
                                  staff.isLocked ? "bg-rose-500" : 
                                  staff.is_active ? "bg-emerald-500" : "bg-slate-400"
                                )} />
                                <div>
                                  <div className="font-semibold text-slate-900">
                                    {staff.first_name} {staff.last_name}
                                  </div>
                                  <div className="text-xs text-slate-500 mt-0.5">{staff.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <Badge className={cn(
                                "text-xs font-semibold",
                                staff.role === "SUPER_ADMIN" 
                                  ? "bg-amber-100 text-amber-700 border-amber-200" 
                                  : staff.role === "LINE_MANAGER"
                                  ? "bg-blue-100 text-blue-700 border-blue-200"
                                  : "bg-[#ec3338]/10 text-[#ec3338] border-[#ec3338]/20"
                              )}>
                                {staff.role}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <code className="bg-white px-3 py-1 rounded-lg border border-slate-200 text-xs font-mono font-semibold">
                                {staff.id_card}
                              </code>
                            </td>
                            <td className="p-4 text-sm text-slate-700">
                              {staff.position || <span className="text-slate-400">—</span>}
                            </td>
                            <td className="p-4">
                              <div className="flex flex-col gap-1.5">
                                <Badge className={cn(
                                  "text-xs font-semibold w-fit",
                                  staff.isLocked 
                                    ? "bg-rose-100 text-rose-700 border-rose-200" 
                                    : staff.is_active 
                                      ? "bg-emerald-100 text-emerald-700 border-emerald-200" 
                                      : "bg-slate-100 text-slate-600 border-slate-200"
                                )}>
                                  {staff.isLocked ? "Locked" : staff.is_active ? "Active" : "Inactive"}
                                </Badge>
                                {!staff.isVerified && (
                                  <Badge className="text-xs font-semibold w-fit bg-amber-100 text-amber-700 border-amber-200">
                                    Unverified
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              {manager ? (
                                <div className="flex items-center gap-2">
                                  <UserCog className="h-3.5 w-3.5 text-blue-600" />
                                  <div>
                                    <div className="text-sm font-medium text-slate-900">{getFullName(manager)}</div>
                                    <div className="text-xs text-slate-500">Line Manager</div>
                                  </div>
                                </div>
                              ) : staff.role === "LINE_MANAGER" ? (
                                <div className="flex items-center gap-2 text-slate-400">
                                  <Shield className="h-3.5 w-3.5" />
                                  <span className="text-sm">Manages Department</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-amber-600">
                                  <AlertCircle className="h-3.5 w-3.5" />
                                  <span className="text-sm font-medium">Unassigned</span>
                                </div>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Department Location Distribution */}
            {departmentStaff.some(emp => emp.region || emp.branch) && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h4 className="font-bold text-slate-900 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-[#ec3338]" />
                      Location Distribution
                    </h4>
                    <p className="text-sm text-slate-600 mt-1">
                      Staff distribution by region and branch
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* By Region */}
                  <div className="border border-slate-200 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 bg-[#ec3338]/10 rounded-lg">
                        <MapPin className="h-4.5 w-4.5 text-[#ec3338]" />
                      </div>
                      <div>
                        <h5 className="font-semibold text-slate-900">By Region</h5>
                        <p className="text-sm text-slate-500">Staff count by geographical region</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {Array.from(
                        new Map(
                          departmentStaff
                            .filter(emp => emp.region)
                            .map(emp => [emp.region, emp])
                        ).values()
                      ).map(emp => {
                        const regionCount = departmentStaff.filter(s => s.region === emp.region).length
                        const percentage = (regionCount / departmentStaff.length) * 100
                        
                        return (
                          <div key={emp.region} className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-slate-700">{emp.region}</span>
                              <Badge className="bg-[#ec3338]/10 text-[#ec3338] border-[#ec3338]/20">
                                {regionCount} staff
                              </Badge>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-[#ec3338] to-[#ec3338]/70 rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  
                  {/* By Branch */}
                  <div className="border border-slate-200 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 bg-blue-100 rounded-lg">
                        <Building className="h-4.5 w-4.5 text-blue-600" />
                      </div>
                      <div>
                        <h5 className="font-semibold text-slate-900">By Branch</h5>
                        <p className="text-sm text-slate-500">Staff count by office branch</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {Array.from(
                        new Map(
                          departmentStaff
                            .filter(emp => emp.branch)
                            .map(emp => [emp.branch, emp])
                        ).values()
                      ).map(emp => {
                        const branchCount = departmentStaff.filter(s => s.branch === emp.branch).length
                        const percentage = (branchCount / departmentStaff.length) * 100
                        
                        return (
                          <div key={emp.branch} className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-slate-700">{emp.branch}</span>
                              <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                                {branchCount} staff
                              </Badge>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Summary */}
            <div className="pt-6 border-t border-slate-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-sm">
                <div className="text-slate-600">
                  Department ID: <code className="bg-slate-100 px-2 py-0.5 rounded text-xs font-mono ml-1">{department._id}</code>
                </div>
                <div className="text-slate-500">
                  Last updated: {department.updatedAt ? formatDate(department.updatedAt) : "Recently"}
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="border-t border-slate-200 p-4 bg-slate-50/50">
          <div className="flex justify-end">
            <Button
              onClick={() => onOpenChange(false)}
              className="gap-2 bg-[#ec3338] hover:bg-[#d42c31] shadow-sm"
            >
              Close View
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}