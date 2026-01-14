import { Department, Employee } from "@/lib/admin"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { 
  Search, 
  Building2, 
  Plus, 
  Edit2, 
  Trash2, 
  Users, 
  ExternalLink,
  MoreHorizontal,
  Hash,
  Calendar,
  FileText,
  Eye
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

interface DepartmentManagementProps {
  departments: Department[]
  employees: Employee[]
  searchQuery: string
  isLoading: boolean
  isActionLoading: boolean
  canEditDepartments?: boolean
  onSearchChange: (query: string) => void
  onCreateDepartment?: () => void
  onViewDepartment: (department: Department) => void
  onEditDepartment?: (department: Department) => void
  onToggleStatus?: (departmentId: string) => void
  onDeleteDepartment?: (department: Department) => void
}

export default function DepartmentManagement({
  departments,
  employees,
  searchQuery,
  isLoading,
  isActionLoading,
  canEditDepartments = false,
  onSearchChange,
  onCreateDepartment,
  onViewDepartment,
  onEditDepartment,
  onToggleStatus,
  onDeleteDepartment,
}: DepartmentManagementProps) {

  const getEmployeeCount = (departmentId: string) => {
    return employees.filter(emp => {
      // Skip employees without a department assignment
      if (!emp.department) return false;
      
      // Handle both string ID and Department object
      if (typeof emp.department === 'string') {
        return emp.department === departmentId;
      } else {
        // It's a Department object
        return emp.department._id === departmentId;
      }
    }).length;
  }

  const filteredDepartments = departments.filter((dept) => {
    const q = searchQuery.toLowerCase()
    return (
      dept.name.toLowerCase().includes(q) ||
      (dept.code && dept.code.toLowerCase().includes(q)) ||
      (dept.description && dept.description.toLowerCase().includes(q))
    )
  })

  const activeDepartments = departments.filter(dept => dept.isActive).length
  const totalEmployees = employees.length
  
  // Calculate departments with staff, handling null departments
  const departmentsWithStaff = departments.filter(dept => {
    const count = getEmployeeCount(dept._id);
    return count > 0;
  }).length;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border border-slate-200 rounded-xl bg-slate-50/50">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <Input 
            placeholder="Search departments..." 
            className="pl-9 h-9 focus-visible:ring-[#ec3338] border-slate-200" 
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        
        {canEditDepartments && onCreateDepartment && (
          <Button
            onClick={onCreateDepartment}
            className="gap-2 bg-[#ec3338] hover:bg-[#d42c31] shadow-sm text-white"
          >
            <Plus className="h-4 w-4" />
            Create New Department
          </Button>
        )}
        
        {!canEditDepartments && (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
            View Only Mode
          </Badge>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#ec3338]/5 border border-[#ec3338]/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-[#ec3338]">Active Departments</p>
              <p className="text-xl font-bold text-[#ec3338]">{activeDepartments}</p>
            </div>
            <div className="p-2 bg-[#ec3338]/10 rounded-lg">
              <Building2 className="text-[#ec3338]" size={18} />
            </div>
          </div>
        </div>
        
        <div className="bg-slate-50/50 border border-slate-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-700">Total Staff</p>
              <p className="text-xl font-bold text-slate-900">{totalEmployees}</p>
            </div>
            <div className="p-2 bg-slate-100 rounded-lg">
              <Users className="text-slate-600" size={18} />
            </div>
          </div>
        </div>
        
        <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-emerald-700">With Staff</p>
              <p className="text-xl font-bold text-emerald-900">{departmentsWithStaff}</p>
            </div>
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Users className="text-emerald-600" size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* Department List */}
      {filteredDepartments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          <div className="p-4 bg-white rounded-full shadow-sm mb-4">
            <Building2 className="text-slate-300" size={32} />
          </div>
          <h3 className="font-semibold text-slate-700 mb-1">
            {searchQuery ? "No departments found" : "No departments yet"}
          </h3>
          <p className="text-sm text-slate-500 max-w-md mb-4">
            {searchQuery 
              ? "Try adjusting your search term" 
              : "Create your first department to organize your staff"}
          </p>
          {!searchQuery && canEditDepartments && onCreateDepartment && (
            <Button 
              onClick={onCreateDepartment}
              className="gap-2 border-[#ec3338]/20 text-[#ec3338] hover:bg-[#ec3338]/5"
              variant="outline"
            >
              <Plus size={14} />
              Create Department
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDepartments.map((dept) => {
            const count = getEmployeeCount(dept._id)
            const hasStaff = count > 0
            
            return (
              <div 
                key={dept._id} 
                className={cn(
                  "flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-xl transition-all",
                  dept.isActive 
                    ? hasStaff 
                      ? "bg-emerald-50/30 border-emerald-100"
                      : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
                    : "bg-slate-50/50 border-slate-100"
                )}
              >
                <div className="flex items-start gap-4 mb-4 sm:mb-0">
                  <div className="flex-shrink-0">
                    <div className={cn(
                      "w-12 h-12 rounded-lg flex items-center justify-center border",
                      dept.isActive 
                        ? "bg-[#ec3338]/10 border-[#ec3338]/20 text-[#ec3338]" 
                        : "bg-slate-100 border-slate-200 text-slate-400"
                    )}>
                      <Building2 size={20} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-slate-900">
                        {dept.name}
                      </h4>
                      <div className="flex items-center gap-1.5">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-[10px] px-1.5 py-0",
                            dept.isActive 
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700" 
                              : "border-slate-200 bg-slate-50 text-slate-600"
                          )}
                        >
                          {dept.isActive ? "Active" : "Disabled"}
                        </Badge>
                        
                        {dept.code && (
                          <Badge 
                            className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200"
                          >
                            <Hash className="w-3 h-3 mr-1" />
                            {dept.code}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      {dept.description && (
                        <div className="flex items-start gap-2">
                          <FileText className="text-slate-400 mt-0.5 flex-shrink-0" size={12} />
                          <p className="text-xs text-slate-600">
                            {dept.description}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <Users size={12} />
                          <span className="font-medium text-slate-700">{count} staff</span>
                        </div>
                        
                        {dept.createdAt && (
                          <div className="flex items-center gap-1">
                            <Calendar size={12} />
                            <span>
                              Created: {new Date(dept.createdAt).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                        )}
                        
                        {dept.updatedAt && dept.updatedAt !== dept.createdAt && (
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400">•</span>
                            <span>
                              Updated: {new Date(dept.updatedAt).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
                    onClick={() => onViewDepartment(dept)}
                    disabled={isActionLoading}
                  >
                    <Eye size={14} />
                    View
                  </Button>
                  
                  {canEditDepartments && onEditDepartment && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
                      onClick={() => onEditDepartment(dept)}
                      disabled={isActionLoading}
                    >
                      <Edit2 size={14} />
                      Edit
                    </Button>
                  )}
                  
                  {canEditDepartments && onToggleStatus && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className={cn(
                            "gap-2 transition-all",
                            dept.isActive 
                              ? "border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300" 
                              : "border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300"
                          )}
                          disabled={isActionLoading}
                        >
                          {dept.isActive ? "Disable" : "Enable"}
                        </Button>
                      </AlertDialogTrigger>

                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{dept.isActive ? "Disable Department" : "Enable Department"}</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to {dept.isActive ? "disable" : "enable"} the department "{dept.name}"?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onToggleStatus(dept._id)}>
                            {dept.isActive ? "Disable" : "Enable"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
                        disabled={isActionLoading}
                      >
                        <MoreHorizontal size={14} />
                        More
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel className="text-xs font-medium">Department Options</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="gap-2 text-xs cursor-pointer"
                        onClick={() => onViewDepartment(dept)}
                      >
                        <Eye size={14} />
                        View Details
                      </DropdownMenuItem>
                      {onDeleteDepartment ? (
                        <DropdownMenuItem 
                          className="gap-2 text-xs text-red-600 cursor-pointer"
                          disabled={hasStaff || isActionLoading}
                          onClick={() => onDeleteDepartment(dept)}
                        >
                          <Trash2 size={14} />
                          Delete Department
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem className="gap-2 text-xs text-red-400 cursor-not-allowed" disabled>
                          <Trash2 size={14} />
                          Delete (restricted)
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )
          })}
        </div>
      )}
      
      {/* Summary Footer */}
      {filteredDepartments.length > 0 && (
        <div className="pt-4 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
            <div className="text-slate-600">
              Showing <span className="font-semibold text-[#ec3338]">{filteredDepartments.length}</span> of{" "}
              <span className="font-semibold">{departments.length}</span> departments
            </div>
            <div className="flex items-center gap-4 text-slate-500">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span>Active with staff</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[#ec3338]"></div>
                <span>Active (no staff)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                <span>Disabled</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}