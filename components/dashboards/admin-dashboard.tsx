"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/context/authContext"
import { useAdmin } from "@/context/adminContext"
import { Employee, Department } from "@/lib/admin"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TooltipProvider } from "@/components/ui/tooltip"
import { showToast } from "@/lib/toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  TrendingUp, Activity, ShieldCheck, Database, Users, 
  Lock, AlertCircle, CheckCircle2, RefreshCw,
  BarChart3, Building2, UserCog, UserX, LayoutDashboard,
  Shield, EyeOff, Filter, Search, UserCheck, XCircle,
  CheckCircle, Edit, Unlock, Mail, Calendar,
  Building, MapPin, AlertTriangle, Package
} from "lucide-react"
import { cn } from "@/lib/utils"

// Components
import Sidebar from "@/components/admin/sidebar"
import Header from "@/components/admin/header"
import EmployeeManagement from "@/components/admin/employeeManagement"
import DepartmentManagement from "@/components/admin/departmentManagement"
import LockedAccounts from "@/components/admin/lockedAccounts"

// Dialogs
import EditUserDialog from "@/components/admin/dialogs/editUserDialog"
import LockUserDialog from "@/components/admin/dialogs/lockUserDialog"
import UnlockUserDialog from "@/components/admin/dialogs/unlockUserDialog"
import CreateDepartmentDialog from "@/components/admin/dialogs/createDepartmentDialog"
import EditDepartmentDialog from "@/components/admin/dialogs/editDepartmentDialog"
import DeleteDepartmentDialog from "@/components/admin/dialogs/deleteDepartmentDialog"
import RegisterUserDialog from "@/components/admin/dialogs/registerUserDialog"

interface AdminDashboardProps {
  onLogout: () => void
}

interface DepartmentFormData {
  name: string;
  code: string;
  description: string;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const { user: authUser } = useAuth()
  const { 
    employees, 
    lockedAccounts,
    departments,
    isLoading, 
    isActionLoading,
    isDepartmentLoading,
    loadUsers,
    loadLockedAccounts,
    loadDepartments,
    lockUserAccount,
    unlockUserAccount,
    updateUser,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    toggleDepartmentStatus
  } = useAdmin()

  const [activeView, setActiveView] = useState<"overview" | "employees" | "departments" | "locked" | "analytics">("overview")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isRefetching, setIsRefetching] = useState(false)

  // Optimistic state for instant UI updates
  const [optimisticEmployees, setOptimisticEmployees] = useState<Employee[]>([])
  const [optimisticDepartments, setOptimisticDepartments] = useState<Department[]>([])

  // Action Dialog States
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)
  const [lockReason, setLockReason] = useState("")
  
  const [editFormData, setEditFormData] = useState<Partial<Employee>>({
    first_name: "", last_name: "", role: "", department: "", region: "", branch: ""
  })

  const [departmentFormData, setDepartmentFormData] = useState<DepartmentFormData>({
    name: "", code: "", description: ""
  })

  const [editDepartmentFormData, setEditDepartmentFormData] = useState<DepartmentFormData>({
    name: "", code: "", description: ""
  })

  // Modal visibility state
  const [modals, setModals] = useState({
    lock: false,
    unlock: false,
    edit: false,
    createDept: false,
    editDept: false,
    deleteDept: false,
    register: false
  })

  const userName = authUser ? `${authUser.first_name} ${authUser.last_name}` : "Administrator"
  const canRegisterUser = authUser?.role === "SUPER_ADMIN"
  const isLineManager = authUser?.role === "LINE_MANAGER"
  const isSuperAdmin = authUser?.role === "SUPER_ADMIN"
  
  // Use optimistic data when available, otherwise use fetched data
  const displayEmployees = optimisticEmployees.length > 0 ? optimisticEmployees : employees
  const displayDepartments = isSuperAdmin ? (optimisticDepartments.length > 0 ? optimisticDepartments : departments) : []
  
  // Role-based statistics - LINE_MANAGER should see stats for their direct reports only
  const stats = useMemo(() => {
    const total = displayEmployees.length
    const active = displayEmployees.filter(e => !e.isLocked && e.isVerified && e.is_active).length
    const locked = lockedAccounts.length || displayEmployees.filter(e => e.isLocked).length
    const unverified = displayEmployees.filter(e => !e.isVerified).length
    const efficiency = total > 0 ? Math.round((active / total) * 100) : 0
    
    return { total, active, locked, unverified, efficiency }
  }, [displayEmployees, lockedAccounts])

  // Role-based access information
  const roleInfo = useMemo(() => {
    if (isLineManager) {
      return {
        title: "LINE MANAGER Dashboard",
        description: "You can only manage your direct reports",
        icon: Shield,
        color: "bg-blue-50 text-blue-700 border-blue-200",
        badge: "Restricted Access",
        showDepartments: false,
        canRegisterUsers: false
      }
    } else if (isSuperAdmin) {
      return {
        title: "SUPER ADMIN Dashboard",
        description: "Full system access and management",
        icon: ShieldCheck,
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        badge: "Full Access",
        showDepartments: true,
        canRegisterUsers: true
      }
    } else {
      return {
        title: "Admin Dashboard",
        description: "System management interface",
        icon: Shield,
        color: "bg-slate-50 text-slate-700 border-slate-200",
        badge: "Standard Access",
        showDepartments: false,
        canRegisterUsers: false
      }
    }
  }, [isLineManager, isSuperAdmin])

  // Available views based on role
  const availableViews = useMemo(() => {
    const baseViews = [
      { id: "overview", label: "Overview", icon: LayoutDashboard },
      { id: "employees", label: "Employees", icon: Users },
      { id: "locked", label: "Locked Accounts", icon: Lock }
    ];
    
    if (isSuperAdmin) {
      baseViews.push({ id: "departments", label: "Departments", icon: Building2 });
    }
    
    baseViews.push({ id: "analytics", label: "Analytics", icon: BarChart3 });
    
    return baseViews;
  }, [isSuperAdmin]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  /* -------------------- Helper Functions -------------------- */
  const toggleModal = (modalName: keyof typeof modals, isOpen: boolean) => {
    setModals(prev => ({ ...prev, [modalName]: isOpen }))
  }

  const refetchData = async (type?: 'users' | 'departments' | 'all') => {
    setIsRefetching(true)
    try {
      const promises = []
      
      if (type === 'all' || !type) {
        promises.push(loadUsers())
        promises.push(loadLockedAccounts())
        if (isSuperAdmin) {
          promises.push(loadDepartments())
        }
      } else if (type === 'users') {
        promises.push(loadUsers())
        promises.push(loadLockedAccounts())
      } else if (type === 'departments' && isSuperAdmin) {
        promises.push(loadDepartments())
      }
      
      await Promise.all(promises)
    } catch (error) {
      console.error('Error refetching data:', error)
      showToast.error("Failed to refresh data")
    } finally {
      setIsRefetching(false)
    }
  }

  const handleReloadData = async () => {
    showToast.info("Refreshing data...")
    await refetchData('all')
    showToast.success("Dashboard data refreshed successfully")
  }

  const handleLockUser = async () => {
    if (!selectedEmployee) return
    
    // Check if LINE_MANAGER can manage this user
    if (isLineManager && !canManageUser(selectedEmployee)) {
      showToast.error("You can only lock accounts of your direct reports")
      toggleModal('lock', false)
      return
    }
    
    // Optimistically update UI
    setOptimisticEmployees(prev => 
      prev.map(emp => 
        emp._id === selectedEmployee._id 
          ? { ...emp, isLocked: true }
          : emp
      )
    )
    
    try {
      await lockUserAccount(selectedEmployee.id_card, lockReason)
      toggleModal('lock', false)
      setLockReason("")
      showToast.success(`Account locked for ${selectedEmployee.first_name}`)
      await refetchData('users')
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticEmployees([])
      showToast.error("Failed to lock account")
    }
  }

  const handleUnlockUser = async () => {
    if (!selectedEmployee) return
    
    // Check if LINE_MANAGER can manage this user
    if (isLineManager && !canManageUser(selectedEmployee)) {
      showToast.error("You can only unlock accounts of your direct reports")
      toggleModal('unlock', false)
      return
    }
    
    // Optimistically update UI
    setOptimisticEmployees(prev => 
      prev.map(emp => 
        emp._id === selectedEmployee._id 
          ? { ...emp, isLocked: false }
          : emp
      )
    )
    
    try {
      await unlockUserAccount(selectedEmployee.id_card)
      toggleModal('unlock', false)
      showToast.success(`Account unlocked for ${selectedEmployee.first_name}`)
      await refetchData('users')
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticEmployees([])
      showToast.error("Failed to unlock account")
    }
  }

  const handleStatusToggle = async (employee: Employee) => {
    // Check if LINE_MANAGER can manage this user
    if (isLineManager && !canManageUser(employee)) {
      showToast.error("You can only update status of your direct reports")
      return
    }
    
    // Optimistically update UI
    setOptimisticEmployees(prev => 
      prev.map(emp => 
        emp._id === employee._id 
          ? { ...emp, is_active: !emp.is_active }
          : emp
      )
    )
    
    try {
      await updateUser(employee._id, { is_active: !employee.is_active })
      await refetchData('users')
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticEmployees([])
      showToast.error("Failed to update status")
    }
  }

  const handleOpenEdit = (employee: Employee) => {
    // Check if LINE_MANAGER can manage this user
    if (isLineManager && !canManageUser(employee)) {
      showToast.error("You can only edit your direct reports")
      return
    }
    
    setSelectedEmployee(employee)
    setEditFormData({
      first_name: employee.first_name,
      last_name: employee.last_name,
      role: employee.role,
      department: typeof employee.department === 'object' ? employee.department._id : employee.department || "",
      region: employee.region || "",
      branch: employee.branch || ""
    })
    toggleModal('edit', true)
  }

  const handleSaveEdit = async () => {
    if (!selectedEmployee) return
    
    // Optimistically update UI
    setOptimisticEmployees(prev => 
      prev.map(emp => 
        emp._id === selectedEmployee._id 
          ? { ...emp, ...editFormData }
          : emp
      )
    )
    
    try {
      await updateUser(selectedEmployee._id, editFormData)
      toggleModal('edit', false)
      showToast.success("User updated successfully")
      await refetchData('users')
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticEmployees([])
      showToast.error("Failed to update user")
    }
  }

  const handleCreateDepartment = async () => {
    if (!isSuperAdmin) {
      showToast.error("Only SUPER_ADMIN can create departments")
      return
    }
    
    // Optimistically update UI
    const newDept: Department = {
      _id: `temp-${Date.now()}`,
      name: departmentFormData.name,
      code: departmentFormData.code,
      description: departmentFormData.description,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setOptimisticDepartments(prev => [...prev, newDept])
    
    try {
      await createDepartment({
        name: departmentFormData.name,
        code: departmentFormData.code || undefined,
        description: departmentFormData.description || undefined
      })
      setDepartmentFormData({ name: "", code: "", description: "" })
      toggleModal('createDept', false)
      showToast.success("Department created successfully")
      await refetchData('departments')
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticDepartments([])
      showToast.error("Failed to create department")
    }
  }

  const handleOpenEditDepartment = (department: Department) => {
    if (!isSuperAdmin) {
      showToast.error("Only SUPER_ADMIN can edit departments")
      return
    }
    
    setSelectedDepartment(department)
    setEditDepartmentFormData({
      name: department.name,
      code: department.code || "",
      description: department.description || ""
    })
    toggleModal('editDept', true)
  }

  const handleSaveEditDepartment = async () => {
    if (!selectedDepartment) return
    
    // Optimistically update UI
    setOptimisticDepartments(prev => 
      prev.map(dept => 
        dept._id === selectedDepartment._id 
          ? { ...dept, ...editDepartmentFormData }
          : dept
      )
    )
    
    try {
      await updateDepartment(selectedDepartment._id, editDepartmentFormData)
      toggleModal('editDept', false)
      showToast.success("Department updated successfully")
      await refetchData('departments')
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticDepartments([])
      showToast.error("Failed to update department")
    }
  }

  const handleToggleDepartmentStatus = async (departmentId: string) => {
    if (!isSuperAdmin) {
      showToast.error("Only SUPER_ADMIN can toggle department status")
      return
    }
    
    // Find the department
    const department = displayDepartments.find(dept => dept._id === departmentId)
    if (!department) return
    
    // Optimistically update UI
    setOptimisticDepartments(prev => 
      prev.map(dept => 
        dept._id === departmentId 
          ? { ...dept, isActive: !dept.isActive }
          : dept
      )
    )
    
    try {
      await toggleDepartmentStatus(departmentId)
      await refetchData('departments')
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticDepartments([])
      showToast.error("Failed to toggle department status")
    }
  }

  const handleDeleteDepartment = async () => {
    if (!selectedDepartment) return
    
    // Optimistically update UI
    setOptimisticDepartments(prev => 
      prev.filter(dept => dept._id !== selectedDepartment._id)
    )
    
    try {
      await deleteDepartment(selectedDepartment._id)
      toggleModal('deleteDept', false)
      showToast.success("Department deleted successfully")
      await refetchData('departments')
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticDepartments([])
      showToast.error("Failed to delete department")
    }
  }

  const formatDate = (date?: string | null) => {
    if (!date) return "N/A"
    return new Date(date).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })
  }

  const getDepartmentName = (employee: Employee) => {
    if (!employee.department) return "N/A"
    if (typeof employee.department === 'object') return employee.department.name
    const dept = displayDepartments.find(d => d._id === employee.department)
    return dept?.name || "N/A"
  }

  const canManageUser = (targetEmployee: Employee) => {
    if (isSuperAdmin) return true
    if (isLineManager) {
      // LINE_MANAGER can only manage STAFF that report to them
      return targetEmployee.role === "STAFF" && 
             targetEmployee.reportsTo && 
             targetEmployee.reportsTo._id === authUser?._id
    }
    return false
  }

  /* -------------------- View Renderers -------------------- */
  const renderActiveView = () => {
    switch (activeView) {
      case "overview":
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Role-based Access Notice */}
            <div className={`p-4 border rounded-lg ${roleInfo.color}`}>
              <div className="flex items-start gap-3">
                <roleInfo.icon className="mt-0.5" size={20} />
                <div className="flex-1">
                  <h4 className="font-medium">{roleInfo.title}</h4>
                  <p className="text-sm mt-1">
                    {roleInfo.description}
                  </p>
                </div>
                <Badge className={roleInfo.color}>{roleInfo.badge}</Badge>
              </div>
            </div>

            {/* Stats Overview - Hide department stats for LINE_MANAGER */}
            <div className={`grid gap-4 ${isSuperAdmin ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
              <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-600">Total Employees</p>
                      <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <Users className="text-blue-600" size={24} />
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-blue-100">
                    <p className="text-xs text-slate-500">
                      Active: {stats.active} ({stats.total > 0 ? Math.round((stats.active/stats.total)*100) : 0}%)
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-gradient-to-br from-amber-50 to-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-600">Locked Accounts</p>
                      <p className="text-3xl font-bold text-slate-900">{stats.locked}</p>
                    </div>
                    <div className="p-3 bg-amber-100 rounded-xl">
                      <Lock className="text-amber-600" size={24} />
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-amber-100">
                    <p className="text-xs text-slate-500">
                      {stats.locked > 0 ? "Requires attention" : "All accounts are active"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-gradient-to-br from-rose-50 to-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-600">Unverified</p>
                      <p className="text-3xl font-bold text-slate-900">{stats.unverified}</p>
                    </div>
                    <div className="p-3 bg-rose-100 rounded-xl">
                      <AlertCircle className="text-rose-600" size={24} />
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-rose-100">
                    <p className="text-xs text-slate-500">
                      Pending verification
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Department Card - Only show for SUPER_ADMIN */}
              {isSuperAdmin && (
                <Card className="border-none shadow-sm bg-gradient-to-br from-purple-50 to-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-600">Departments</p>
                        <p className="text-3xl font-bold text-slate-900">{displayDepartments.length}</p>
                      </div>
                      <div className="p-3 bg-purple-100 rounded-xl">
                        <Building2 className="text-purple-600" size={24} />
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-purple-100">
                      <p className="text-xs text-slate-500">
                        Active: {displayDepartments.filter(d => d.isActive).length}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* System Health Card - Position based on role */}
              <Card className={`border-none shadow-sm bg-gradient-to-br from-emerald-50 to-white ${isSuperAdmin ? '' : 'lg:col-span-1 md:col-span-1'}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-600">System Health</p>
                      <div className="flex items-center gap-2 mt-2">
                        <CheckCircle2 className="text-emerald-600" size={24} />
                        <p className="text-3xl font-bold text-slate-900">
                          {stats.efficiency}%
                        </p>
                      </div>
                    </div>
                    <div className="p-3 bg-emerald-100 rounded-xl">
                      <CheckCircle2 className="text-emerald-600" size={24} />
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-emerald-100">
                    <p className="text-xs text-slate-500">
                      Operational efficiency
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 border-none shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-bold">Recent System Activity</CardTitle>
                    <CardDescription className="text-slate-500">Live feed of administrative actions</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="text-blue-500" size={20} />
                    <Badge variant="outline" className="text-xs">Live</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <TrendingUp className="mb-3 opacity-30" size={48} />
                    <p className="font-medium text-slate-500">No recent activities to display</p>
                    <p className="text-sm text-slate-400 mt-1">Activities will appear here as they occur</p>
                  </div>
                </CardContent>
              </Card>
              
              <div className="space-y-6">
                <Card className="border-none shadow-sm bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="text-emerald-400" size={18} />
                      <CardTitle className="text-base font-semibold">System Security</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center text-sm p-3 bg-white/5 rounded-lg border border-white/10">
                      <span className="text-slate-300 font-medium">Auth Status</span>
                      <Badge className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-emerald-500/50">Operational</Badge>
                    </div>
                    <div className="flex justify-between items-center text-sm p-3 bg-white/5 rounded-lg border border-white/10">
                      <span className="text-slate-300 font-medium">Locked Accounts</span>
                      <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10">
                        {lockedAccounts.length}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center text-sm p-3 bg-white/5 rounded-lg border border-white/10">
                      <span className="text-slate-300 font-medium">Active Sessions</span>
                      <span className="font-bold">{stats.active}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Data Summary Card - Show departments only for SUPER_ADMIN */}
                <Card className="border-none shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Database className="text-blue-500" size={18} />
                      <CardTitle className="text-base font-semibold">Data Summary</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-3xl font-bold text-slate-900">{displayDepartments.length}</div>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Departments</p>
                      </div>
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Building2 className="text-blue-600" size={20} />
                      </div>
                    </div>
                    {!isSuperAdmin && (
                      <div className="pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-2 text-sm text-blue-600">
                          <Package size={14} />
                          <span>Department management requires SUPER_ADMIN access</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )
      case "employees":
        return (
          <EmployeeManagement
            employees={displayEmployees}
            departments={displayDepartments}
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            isLoading={isLoading || isRefetching}
            isActionLoading={isActionLoading}
            authUser={authUser}
            canRegisterUser={canRegisterUser}
            onRegisterUser={() => toggleModal('register', true)}
            onSearchChange={setSearchQuery}
            onStatusFilterChange={setStatusFilter}
            onEdit={handleOpenEdit}
            onStatusToggle={handleStatusToggle}
            onLock={(emp) => { 
              setSelectedEmployee(emp); 
              emp.isLocked ? toggleModal('unlock', true) : toggleModal('lock', true); 
            }}
            getDepartmentName={getDepartmentName}
            canManageUser={canManageUser}
          />
        )
      case "departments":
        // Only SUPER_ADMIN can see department management
        if (!isSuperAdmin) {
          return (
            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                <EyeOff className="text-slate-300" size={32} />
              </div>
              <h3 className="font-semibold text-slate-700 mb-1">Access Restricted</h3>
              <p className="text-sm text-slate-500 max-w-md mb-4">
                Only SUPER_ADMIN can manage departments. Please contact your system administrator.
              </p>
              <Badge className="bg-amber-100 text-amber-700 border-amber-200">SUPER_ADMIN Only</Badge>
            </div>
          )
        }
        return (
          <DepartmentManagement
            departments={displayDepartments}
            employees={displayEmployees}
            searchQuery={searchQuery}
            isLoading={isDepartmentLoading || isRefetching}
            isActionLoading={isActionLoading}
            onSearchChange={setSearchQuery}
            onCreateDepartment={() => toggleModal('createDept', true)}
            onEditDepartment={handleOpenEditDepartment}
            onToggleStatus={handleToggleDepartmentStatus}
            onDeleteDepartment={(dept) => { 
              setSelectedDepartment(dept); 
              toggleModal('deleteDept', true); 
            }}
          />
        )
      case "locked":
        return (
          <LockedAccounts
            lockedAccounts={lockedAccounts}
            authUser={authUser}
            formatDate={formatDate}
            onUnlock={(acc) => { 
              setSelectedEmployee(acc as Employee); 
              toggleModal('unlock', true); 
            }}
            canManageUser={canManageUser}
          />
        )
      case "analytics":
        return (
          <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <div className="p-4 bg-white rounded-full shadow-sm mb-4">
              <BarChart3 className="text-slate-300" size={32} />
            </div>
            <h3 className="font-semibold text-slate-700 mb-1">Analytics Dashboard</h3>
            <p className="text-sm text-slate-500 max-w-md mb-4">
              Advanced analytics and reporting features are coming soon.
            </p>
            <Badge className="bg-blue-100 text-blue-700 border-blue-200">Coming Soon</Badge>
          </div>
        )
      default: 
        return (
          <div className="flex items-center justify-center h-64">
            <p className="text-slate-500">View not implemented yet</p>
          </div>
        )
    }
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen w-full overflow-hidden bg-gradient-to-br from-slate-50 to-white">
        {/* Sidebar - Pass availableViews to hide departments for LINE_MANAGER */}
        <Sidebar
          sidebarOpen={sidebarOpen}
          activeView={activeView}
          userName={userName}
          userRole={authUser?.role}
          stats={stats}
          departmentsCount={displayDepartments.length}
          availableViews={availableViews}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onViewChange={setActiveView}
          onLogout={onLogout}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          <Header
            activeView={activeView}
            currentTime={currentTime}
            isLoading={isLoading || isRefetching}
            isActionLoading={isActionLoading}
            onReloadData={handleReloadData}
          />

          {/* Scrollable Content Container */}
          <main className="flex-1 overflow-hidden relative">
            <ScrollArea className="h-full w-full">
              <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 capitalize">
                      {activeView === 'overview' ? 'Dashboard Overview' : `${activeView} Management`}
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                      {activeView === 'overview' 
                        ? `Welcome back, ${authUser?.first_name}. System is operating normally.`
                        : isLineManager && activeView === 'employees'
                          ? "Managing your direct reports"
                          : `Manage your ${activeView} efficiently`
                      }
                    </p>
                  </div>
                  
                  {activeView !== "overview" && activeView !== "analytics" && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleReloadData}
                      disabled={isLoading || isRefetching}
                      className="gap-2"
                    >
                      <RefreshCw size={14} className={cn((isLoading || isRefetching) && "animate-spin")} />
                      Sync Data
                    </Button>
                  )}
                </div>

                {/* Active Dynamic View */}
                <div className="pb-10">
                  {renderActiveView()}
                </div>
              </div>
            </ScrollArea>
          </main>
        </div>
      </div>

      {/* Dialog Components - Only include department dialogs for SUPER_ADMIN */}
      <RegisterUserDialog
        open={modals.register}
        onOpenChange={(s) => toggleModal('register', s)}
        departments={displayDepartments}
        employees={displayEmployees}
        isActionLoading={isActionLoading}
        onSuccess={loadUsers}
      />
      <EditUserDialog 
        open={modals.edit} 
        onOpenChange={(s) => toggleModal('edit', s)} 
        employee={selectedEmployee} 
        formData={editFormData} 
        departments={displayDepartments} 
        isActionLoading={isActionLoading} 
        onFormDataChange={setEditFormData} 
        onSave={handleSaveEdit} 
      />
      <LockUserDialog 
        open={modals.lock} 
        onOpenChange={(s) => toggleModal('lock', s)} 
        employee={selectedEmployee} 
        lockReason={lockReason} 
        isActionLoading={isActionLoading} 
        onLockReasonChange={setLockReason} 
        onLock={handleLockUser} 
      />
      <UnlockUserDialog 
        open={modals.unlock} 
        onOpenChange={(s) => toggleModal('unlock', s)} 
        employee={selectedEmployee} 
        isActionLoading={isActionLoading} 
        onUnlock={handleUnlockUser} 
      />
      
      {/* Department dialogs - Only for SUPER_ADMIN */}
      {isSuperAdmin && (
        <>
          <CreateDepartmentDialog 
            open={modals.createDept} 
            onOpenChange={(s) => toggleModal('createDept', s)} 
            formData={departmentFormData} 
            isActionLoading={isActionLoading} 
            onFormDataChange={setDepartmentFormData} 
            onCreate={handleCreateDepartment} 
          />
          <EditDepartmentDialog 
            open={modals.editDept} 
            onOpenChange={(s) => toggleModal('editDept', s)} 
            department={selectedDepartment} 
            formData={editDepartmentFormData} 
            isActionLoading={isActionLoading} 
            onFormDataChange={setEditDepartmentFormData} 
            onSave={handleSaveEditDepartment} 
          />
          <DeleteDepartmentDialog 
            open={modals.deleteDept} 
            onOpenChange={(s) => toggleModal('deleteDept', s)} 
            department={selectedDepartment} 
            employees={displayEmployees} 
            isActionLoading={isActionLoading} 
            onDelete={handleDeleteDepartment} 
          />
        </>
      )}
    </TooltipProvider>
  )
}