"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useAuth } from "@/context/authContext"
import { useAdmin } from "@/context/adminContext"
import { useActivities } from "@/context/activitiesContext"
import { Employee, Department, REGIONS, BRANCHES, validateLocation, getBranchesForRegion, Region, Branch, isValidLocationCombo } from "@/lib/admin"
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
  Building, MapPin, AlertTriangle, Package,
  LucideIcon
} from "lucide-react"
import { cn } from "@/lib/utils"

// Components
import Sidebar from "@/components/admin/sidebar"
import Header from "@/components/admin/header"
import EmployeeManagement from "@/components/admin/employeeManagement"
import DepartmentManagement from "@/components/admin/departmentManagement"
import LockedAccounts from "@/components/admin/lockedAccounts"
import ActivitiesManagement from "@/components/activity/activitiesManagement"

// Dialogs
import EditUserDialog from "@/components/admin/dialogs/editUserDialog"
import LockUserDialog from "@/components/admin/dialogs/lockUserDialog"
import UnlockUserDialog from "@/components/admin/dialogs/unlockUserDialog"
import DeleteUserDialog from "@/components/admin/dialogs/deleteUserDialog"
import CreateDepartmentDialog from "@/components/admin/dialogs/createDepartmentDialog"
import EditDepartmentDialog from "@/components/admin/dialogs/editDepartmentDialog"
import DeleteDepartmentDialog from "@/components/admin/dialogs/deleteDepartmentDialog"
import ViewDepartmentDialog from "@/components/admin/dialogs/viewDepartmentDialog"
import RegisterUserDialog from "@/components/admin/dialogs/registerUserDialog"
import ActivityDetailsDialog from "@/components/activity/activityDetailsDialog"

interface AdminDashboardProps {
  onLogout: () => void
}

interface DepartmentFormData {
  name: string;
  code: string;
  description: string;
}

// Define ViewItem type for sidebar navigation
type ViewItem = {
  id: "overview" | "employees" | "activities" | "departments" | "locked" | "analytics";
  label: string;
  icon: LucideIcon;
};

// Type for activities filters
interface ActivitiesFilters {
  date: string;
  status: string;
  region: Region | "" | "all";
  branch: Branch | "" | "all";
  page: number;
  limit: number;
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
    deleteUser,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    toggleDepartmentStatus
  } = useAdmin()

  const {
    allActivities,
    userActivities,
    activitiesStats,
    activitiesPagination,
    adminActivitiesLoading,
    adminActivitiesError,
    loadAllActivities,
    loadActivitiesByUser,
    getStatusColor
  } = useActivities()

  const [activeView, setActiveView] = useState<"overview" | "employees" | "activities" | "departments" | "locked" | "analytics">("overview")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isRefetching, setIsRefetching] = useState(false)

  // Optimistic state for instant UI updates
  const [optimisticEmployees, setOptimisticEmployees] = useState<Employee[]>([])
  const [optimisticDepartments, setOptimisticDepartments] = useState<Department[]>([])

  // Activities state
  const [activitiesFilters, setActivitiesFilters] = useState<ActivitiesFilters>({
    date: "",
    status: "",
    region: "",
    branch: "",
    page: 1,
    limit: 20
  })

  // Action Dialog States
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)
  const [selectedActivity, setSelectedActivity] = useState<any>(null)
  const [lockReason, setLockReason] = useState("")
  
  const [editFormData, setEditFormData] = useState<Partial<Employee>>({
    first_name: "", 
    last_name: "", 
    role: "", 
    department: "", 
    region: undefined,
    branch: undefined,
    position: ""
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
    register: false,
    activityDetails: false,
    delete: false,
    viewDept: false
  })

  const userName = authUser ? `${authUser.first_name} ${authUser.last_name}` : "Administrator"
  const canRegisterUser = authUser?.role === "SUPER_ADMIN"
  const isLineManager = authUser?.role === "LINE_MANAGER"
  const isSuperAdmin = authUser?.role === "SUPER_ADMIN"
  const isAdmin = Boolean(authUser?.isAdmin)
  
  // Use optimistic data when available, otherwise use fetched data
  const displayEmployees = optimisticEmployees.length > 0 ? optimisticEmployees : employees

  // Filter departments for LINE_MANAGER - only show departments where they have direct reports
  const filteredDepartments = useMemo(() => {
    if (isSuperAdmin) {
      return optimisticDepartments.length > 0 ? optimisticDepartments : departments
    } else if (isLineManager) {
      const depts = optimisticDepartments.length > 0 ? optimisticDepartments : departments
      
      // LINE_MANAGER can only see departments where they have direct reports
      return depts.filter(dept => {
        // Get employees in this department
        const deptEmployees = displayEmployees.filter(emp => {
          if (!emp.department) return false
          if (typeof emp.department === 'string') return emp.department === dept._id
          return emp.department._id === dept._id
        })
        
        // Check if any of these employees report to this LINE_MANAGER
        return deptEmployees.some(emp => 
          emp.reportsTo && 
          (typeof emp.reportsTo === 'string' ? 
           emp.reportsTo === authUser?._id : 
           emp.reportsTo._id === authUser?._id)
        )
      })
    }
    return []
  }, [departments, optimisticDepartments, displayEmployees, isSuperAdmin, isLineManager, authUser?._id])

  const displayDepartments = filteredDepartments
  
  // Employees that will be shown in ViewDepartmentDialog depending on viewer role
  const viewDepartmentEmployees = useMemo(() => {
    if (!selectedDepartment) return []
    const deptId = selectedDepartment._id
    let staff = displayEmployees.filter(emp => {
      if (!emp.department) return false
      if (typeof emp.department === 'string') return emp.department === deptId
      return emp.department._id === deptId
    })
    if (isLineManager) {
      staff = staff.filter(emp => emp.reportsTo && (typeof emp.reportsTo === 'string' ? emp.reportsTo === authUser?._id : emp.reportsTo._id === authUser?._id))
    }
    return staff
  }, [selectedDepartment, displayEmployees, isLineManager, authUser?._id])

  const viewDepartmentTotal = useMemo(() => {
    if (!selectedDepartment) return 0
    const deptId = selectedDepartment._id
    return displayEmployees.filter(emp => {
      if (!emp.department) return false
      if (typeof emp.department === 'object') return emp.department._id === deptId
      return emp.department === deptId
    }).length
  }, [selectedDepartment, displayEmployees])

  // CORRECTED: Get direct reports for LINE_MANAGER
  const directReports = useMemo(() => {
    if (!isLineManager) return []
    return displayEmployees.filter(emp => 
      emp.reportsTo && 
      (typeof emp.reportsTo === 'string' ? 
       emp.reportsTo === authUser?._id : 
       emp.reportsTo._id === authUser?._id) &&
      emp.role === 'STAFF'
    )
  }, [displayEmployees, isLineManager, authUser?._id])

  // Activities will be filtered by backend, no need for frontend filtering
  const displayActivities = allActivities // Backend already filters for LINE_MANAGER
  
  // Role-based statistics - LINE_MANAGER should see stats for their direct reports only
  const stats = useMemo(() => {
    let relevantEmployees = displayEmployees
    
    // LINE_MANAGER only sees stats for their direct reports
    if (isLineManager) {
      relevantEmployees = directReports
    }
    
    const total = relevantEmployees.length
    const active = relevantEmployees.filter(e => !e.isLocked && e.isVerified && e.is_active).length
    const locked = relevantEmployees.filter(e => e.isLocked).length
    const unverified = relevantEmployees.filter(e => !e.isVerified).length
    const efficiency = total > 0 ? Math.round((active / total) * 100) : 0
    
    return { total, active, locked, unverified, efficiency }
  }, [displayEmployees, directReports, isLineManager])

  // Location-based statistics - only for relevant employees
  const locationStats = useMemo(() => {
    const statsByRegion: Record<string, { count: number; branches: Record<string, number> }> = {};
    
    const relevantEmployees = isLineManager ? directReports : displayEmployees;
    
    relevantEmployees.forEach(employee => {
      if (employee.region) {
        if (!statsByRegion[employee.region]) {
          statsByRegion[employee.region] = { count: 0, branches: {} };
        }
        statsByRegion[employee.region].count++;
        
        if (employee.branch) {
          if (!statsByRegion[employee.region].branches[employee.branch]) {
            statsByRegion[employee.region].branches[employee.branch] = 0;
          }
          statsByRegion[employee.region].branches[employee.branch]++;
        }
      }
    });
    
    return statsByRegion;
  }, [displayEmployees, directReports, isLineManager]);

  // Role-based access information
  const roleInfo = useMemo(() => {
    if (isLineManager) {
      return {
        title: "LINE MANAGER Dashboard",
        description: `You have ${directReports.length} direct report${directReports.length !== 1 ? 's' : ''} in ${displayDepartments.length} department${displayDepartments.length !== 1 ? 's' : ''}`,
        icon: Shield,
        color: "bg-blue-50 text-blue-700 border-blue-200",
        badge: "Department View Access",
        showDepartments: true,
        canRegisterUsers: false,
        canEditDepartments: false
      }
    } else if (isSuperAdmin) {
      return {
        title: "SUPER ADMIN Dashboard",
        description: "Full system access and management",
        icon: ShieldCheck,
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        badge: "Full Access",
        showDepartments: true,
        canRegisterUsers: true,
        canEditDepartments: true
      }
    } else {
      return {
        title: "Admin Dashboard",
        description: "System management interface",
        icon: Shield,
        color: "bg-slate-50 text-slate-700 border-slate-200",
        badge: "Standard Access",
        showDepartments: false,
        canRegisterUsers: false,
        canEditDepartments: false
      }
    }
  }, [isLineManager, isSuperAdmin, directReports.length, displayDepartments.length])

  // Location helper functions - FIXED to accept string
  const locationHelper = useMemo(() => ({
    // Get available branches for a given region - accept string
    getAvailableBranches: (region: string): string[] => {
      if (!region) return [];
      // Check if it's a valid Region type
      if (REGIONS.includes(region as Region)) {
        return getBranchesForRegion(region as Region);
      }
      return [];
    },
    
    // Get full location display
    getFullLocation: (employee: Employee): string => {
      if (!employee.region && !employee.branch) return "Not specified";
      if (!employee.branch) return employee.region || "";
      if (!employee.region) return employee.branch || "";
      return `${employee.region} - ${employee.branch}`;
    },
    
    // Validate location for editing
    isValidLocation: (region?: Region, branch?: Branch): boolean => {
      if (!region || !branch) return false;
      return validateLocation(region, branch);
    },

    // Get all valid region-branch combinations
    getValidLocationCombinations: () => {
      const combinations: Array<{region: Region, branch: Branch}> = [];
      Object.entries(BRANCHES).forEach(([region, branches]) => {
        branches.forEach(branch => {
          combinations.push({ region: region as Region, branch: branch as Branch });
        });
      });
      return combinations;
    }
  }), []);

  // Available views based on role - properly typed
  const availableViews = useMemo((): ViewItem[] => {
    const baseViews: ViewItem[] = [
      { id: "overview", label: "Overview", icon: LayoutDashboard },
      { id: "employees", label: "Employees", icon: Users },
      { id: "activities", label: "Activities", icon: Activity },
      { id: "locked", label: "Locked Accounts", icon: Lock }
    ];
    
    if (isSuperAdmin || isLineManager) {
      baseViews.push({ id: "departments", label: "Departments", icon: Building2 });
    }
    
    baseViews.push({ id: "analytics", label: "Analytics", icon: BarChart3 });
    
    return baseViews;
  }, [isSuperAdmin, isLineManager])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Load activities based on role and filters
  useEffect(() => {
    if ((isAdmin || isLineManager) && activeView === "activities") {
      loadActivitiesData()
    }
  }, [isAdmin, isLineManager, activeView, activitiesFilters])

  /* -------------------- Helper Functions -------------------- */
  const toggleModal = (modalName: keyof typeof modals, isOpen: boolean) => {
    setModals(prev => ({ ...prev, [modalName]: isOpen }))
  }

  const refetchData = async (type?: 'users' | 'departments' | 'activities' | 'all') => {
    setIsRefetching(true)
    try {
      const promises = []
      
      if (type === 'all' || !type) {
        promises.push(loadUsers())
        promises.push(loadLockedAccounts())
        if (isSuperAdmin || isLineManager) {
          promises.push(loadDepartments())
        }
        if (activeView === 'activities') {
          promises.push(loadActivitiesData())
        }
      } else if (type === 'users') {
        promises.push(loadUsers())
        promises.push(loadLockedAccounts())
      } else if (type === 'departments' && (isSuperAdmin || isLineManager)) {
        promises.push(loadDepartments())
      } else if (type === 'activities') {
        promises.push(loadActivitiesData())
      }
      
      await Promise.all(promises)
    } catch (error) {
      console.error('Error refetching data:', error)
      showToast.error("Failed to refresh data")
    } finally {
      setIsRefetching(false)
    }
  }

  // CORRECTED: Simplified loadActivitiesData function
  const loadActivitiesData = async (filters: ActivitiesFilters = activitiesFilters) => {
    // Allow both Admin and LINE_MANAGER to load activities
    if (!isAdmin && !isLineManager) return
    
    try {
      // Create filtered params with proper typing
      const filteredParams: any = {
        date: filters.date || '',
        status: filters.status === 'all' ? '' : filters.status,
        region: filters.region || '',
        branch: filters.branch || '',
        page: filters.page,
        limit: filters.limit
      }

      // FIX: Validate region-branch combination only when BOTH are provided and not empty
      if (filters.region && filters.branch && 
          filters.region.trim() !== '' && filters.branch.trim() !== '' &&
          filters.region !== 'all' && filters.branch !== 'all') {
        
        // Ensure they are valid types
        if (!REGIONS.includes(filters.region as Region)) {
          showToast.error(`Invalid region: ${filters.region}`);
          return;
        }
        
        const isValid = isValidLocationCombo(filters.region, filters.branch);
        if (!isValid) {
          showToast.error(`Invalid location filter combination: ${filters.region} - ${filters.branch}`);
          return;
        }
      }

      // Simply call loadAllActivities - backend handles filtering for LINE_MANAGER
      await loadAllActivities(filteredParams);
      
    } catch (error: any) {
      console.error("Error loading activities:", error)
      
      // Handle specific error cases
      if (error.response?.status === 403) {
        showToast.error("Access denied. You can only view activities of your direct reports.");
      } else {
        showToast.error("Failed to load activities");
      }
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
      region: employee.region || undefined,
      branch: employee.branch || undefined,
      position: employee.position || "",
    })
    toggleModal('edit', true)
  }

  const handleSaveEdit = async () => {
    if (!selectedEmployee) return
    
    // Validate location if provided
    if (editFormData.region && editFormData.branch) {
      const isValid = locationHelper.isValidLocation(editFormData.region as Region, editFormData.branch as Branch);
      if (!isValid) {
        showToast.error("Invalid location combination. Please check region and branch.");
        return;
      }
    }

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
    } catch (error: any) {
      // Revert optimistic update on error
      setOptimisticEmployees([])
      
      if (error.message?.includes("Invalid region and branch combination")) {
        showToast.error("Invalid location combination. Please check region and branch settings.");
      } else {
        showToast.error("Failed to update user")
      }
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedEmployee) return
    
    // Optimistically update UI
    setOptimisticEmployees(prev => 
      prev.filter(emp => emp._id !== selectedEmployee._id)
    )
    
    try {
      await deleteUser(selectedEmployee._id)
      toggleModal('delete', false)
      setSelectedEmployee(null)
      showToast.success(`User ${selectedEmployee.first_name} ${selectedEmployee.last_name} deleted successfully`)
      await refetchData('users')
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticEmployees([])
      // Error is already handled in the context
    }
  }

  const handleViewDepartment = (department: Department) => {
    setSelectedDepartment(department)
    toggleModal('viewDept', true)
  }

  const handleCreateDepartment = async () => {
    if (!isSuperAdmin) {
      showToast.error("Only SUPER_ADMIN can create departments")
      return
    }
    
    try {
      console.log('Creating department with data:', departmentFormData);
      
      const response = await createDepartment({
        name: departmentFormData.name,
        code: departmentFormData.code || undefined,
        description: departmentFormData.description || undefined
      });
      
      console.log('Department creation response:', response);
      
      // Type guard to ensure it's a valid Department
      if (!response || !response._id) {
        console.error('Invalid department response:', response);
        throw new Error("Failed to create department: Invalid response from server");
      }
      
      // Now add the real department
      const newDepartment: Department = {
        _id: response._id,
        name: response.name,
        code: response.code,
        description: response.description,
        isActive: response.isActive,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt
      };
      
      setOptimisticDepartments(prev => [...prev, newDepartment])
      
      setDepartmentFormData({ name: "", code: "", description: "" })
      toggleModal('createDept', false)
      showToast.success("Department created successfully")
      await refetchData('departments')
    } catch (error: any) {
      console.error('Error creating department:', error);
      // Revert optimistic update on error
      setOptimisticDepartments([])
      showToast.error(error.message || "Failed to create department")
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

  const handleExportActivities = useCallback(() => {
    try {
      // Filter activities for LINE_MANAGER if needed
      const activitiesToExport = isLineManager 
        ? allActivities.filter(activity => {
            if (typeof activity.user === 'object' && activity.user.reportsTo) {
              const reportsToId = typeof activity.user.reportsTo === 'object' 
                ? activity.user.reportsTo._id 
                : activity.user.reportsTo;
              return reportsToId === authUser?._id;
            }
            return false;
          })
        : allActivities;

      const data = activitiesToExport.map(activity => ({
        Date: activity.date,
        Time: activity.timeInterval,
        Employee: typeof activity.user === 'object' 
          ? `${activity.user.first_name} ${activity.user.last_name}`
          : "N/A",
        IDCard: typeof activity.user === 'object' ? activity.user.id_card : "N/A",
        Department: typeof activity.user === 'object' && activity.user.department
          ? (typeof activity.user.department === 'object' 
            ? activity.user.department.name 
            : activity.user.department)
          : "N/A",
        Region: typeof activity.user === 'object' ? activity.user.region : "N/A",
        Branch: typeof activity.user === 'object' ? activity.user.branch : "N/A",
        Location: typeof activity.user === 'object' 
          ? locationHelper.getFullLocation(activity.user as Employee)
          : "N/A",
        Description: activity.description,
        Status: activity.status,
        Created: activity.createdAt,
        Updated: activity.updatedAt
      }))

      const csvContent = [
        ['Date', 'Time', 'Employee', 'ID Card', 'Department', 'Region', 'Branch', 'Location', 'Description', 'Status', 'Created', 'Updated'],
        ...data.map(row => [
          row.Date,
          row.Time,
          row.Employee,
          row.IDCard,
          row.Department,
          row.Region,
          row.Branch,
          row.Location,
          row.Description,
          row.Status,
          row.Created,
          row.Updated
        ])
      ].map(e => e.join(',')).join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `activities-export-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      
      showToast.success("Activities exported successfully")
    } catch (error) {
      console.error("Failed to export activities:", error)
      showToast.error("Failed to export activities")
    }
  }, [allActivities, isLineManager, authUser?._id, locationHelper])

  const handleViewActivityDetails = (activity: any) => {
    setSelectedActivity(activity)
    toggleModal('activityDetails', true)
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

            {/* Stats Overview - Show direct reports count for LINE_MANAGER */}
            <div className={`grid gap-4 ${isSuperAdmin ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
              <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-600">
                        {isLineManager ? 'Direct Reports' : 'Total Employees'}
                      </p>
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
            </div>

            {/* Direct Reports Card for LINE_MANAGER */}
            {isLineManager && directReports.length > 0 && (
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <UserCheck className="text-blue-600" size={18} />
                    <CardTitle className="text-lg font-bold">Your Direct Reports</CardTitle>
                  </div>
                  <CardDescription>Staff members who report directly to you</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {directReports.slice(0, 6).map(report => (
                      <div key={report._id} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="font-bold text-blue-600">
                              {report.first_name?.[0]}{report.last_name?.[0]}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-slate-900 truncate">
                              {report.first_name} {report.last_name}
                            </h4>
                            <p className="text-sm text-slate-500">{report.id_card}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-sm">
                          <span className="text-slate-600">{report.position}</span>
                          <Badge variant={report.is_active ? "default" : "secondary"} className="text-xs">
                            {report.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  {directReports.length > 6 && (
                    <div className="mt-4 pt-4 border-t border-slate-100 text-center">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setActiveView("employees")}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        View all {directReports.length} direct reports →
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Location Distribution Card - Only show for SUPER_ADMIN */}
            {isSuperAdmin && Object.keys(locationStats).length > 0 && (
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <MapPin className="text-purple-600" size={18} />
                    <CardTitle className="text-lg font-bold">Location Distribution</CardTitle>
                  </div>
                  <CardDescription>Employee distribution by region and branch</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(locationStats).map(([region, data]) => (
                      <div key={region} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Building className="text-slate-500" size={16} />
                            <span className="font-medium">{region}</span>
                          </div>
                          <Badge variant="outline">{data.count} employees</Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {Object.entries(data.branches).map(([branch, count]) => (
                            <div key={branch} className="flex items-center justify-between text-sm p-2 bg-slate-50 rounded">
                              <span className="text-slate-600">{branch}</span>
                              <span className="font-medium">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

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
                        {stats.locked}
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
            onDelete={(emp) => {
              setSelectedEmployee(emp);
              toggleModal('delete', true);
            }}
            getDepartmentName={getDepartmentName}
            canManageUser={canManageUser}
            getFullLocation={locationHelper.getFullLocation}
            regions={REGIONS}
            getAvailableBranches={locationHelper.getAvailableBranches}
          />
        )
      case "activities":
        return (
          <ActivitiesManagement
            activities={displayActivities}
            stats={activitiesStats}
            pagination={activitiesPagination}
            filters={activitiesFilters}
            isLoading={adminActivitiesLoading}
            isAdmin={isAdmin}
            isSuperAdmin={isSuperAdmin}
            isLineManager={isLineManager}
            directReportsCount={directReports.length}
            onFilterChange={(newFilters) => {
              const normalizedFilters: ActivitiesFilters = {
                ...newFilters,
                status: newFilters.status === 'all' ? '' : newFilters.status,
                region: newFilters.region || "",
                branch: newFilters.branch || "",
              }
              setActivitiesFilters(normalizedFilters)
              loadActivitiesData(normalizedFilters)
            }}
            onRefresh={() => loadActivitiesData()}
            onExport={handleExportActivities}
            onViewDetails={handleViewActivityDetails}
            regions={REGIONS}
            getAvailableBranches={locationHelper.getAvailableBranches}
            getStatusColor={getStatusColor}
          />
        )
      case "departments":
        // SUPER_ADMIN can manage departments; LINE_MANAGER can view departments (read-only)
        if (!isSuperAdmin && !isLineManager) {
          return (
            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                <EyeOff className="text-slate-300" size={32} />
              </div>
              <h3 className="font-semibold text-slate-700 mb-1">Access Restricted</h3>
              <p className="text-sm text-slate-500 max-w-md mb-4">
                Only SUPER_ADMIN and LINE_MANAGERS can view departments.
              </p>
              <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                {isLineManager ? "No Departments Assigned" : "SUPER_ADMIN/LINE_MANAGER Only"}
              </Badge>
            </div>
          )
        }
        
        // Show message if LINE_MANAGER has no departments with direct reports
        if (isLineManager && displayDepartments.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                <Building2 className="text-slate-300" size={32} />
              </div>
              <h3 className="font-semibold text-slate-700 mb-1">No Assigned Departments</h3>
              <p className="text-sm text-slate-500 max-w-md mb-4">
                You don't have any direct reports in any departments yet.
                Departments will appear here when staff members are assigned to you.
              </p>
              <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                View Only Access
              </Badge>
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
            canEditDepartments={isSuperAdmin}
            onSearchChange={setSearchQuery}
            onCreateDepartment={isSuperAdmin ? () => toggleModal('createDept', true) : undefined}
            onViewDepartment={handleViewDepartment}
            onEditDepartment={isSuperAdmin ? handleOpenEditDepartment : undefined}
            onToggleStatus={isSuperAdmin ? handleToggleDepartmentStatus : undefined}
            onDeleteDepartment={isSuperAdmin ? (dept) => { setSelectedDepartment(dept); toggleModal('deleteDept', true); } : undefined}
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
            getFullLocation={locationHelper.getFullLocation}
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
                          ? `Managing your ${directReports.length} direct report${directReports.length !== 1 ? 's' : ''}`
                          : isLineManager && activeView === 'activities'
                          ? `Viewing activities of your direct reports`
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

      <DeleteUserDialog
        open={modals.delete}
        onOpenChange={(s) => toggleModal('delete', s)}
        employee={selectedEmployee}
        isActionLoading={isActionLoading}
        onDelete={handleDeleteUser}
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

      {/* View Department Dialog - Available for both SUPER_ADMIN and LINE_MANAGER */}
      <ViewDepartmentDialog
        open={modals.viewDept}
        onOpenChange={(s) => toggleModal('viewDept', s)}
        department={selectedDepartment}
        employees={viewDepartmentEmployees}
        totalStaffCount={viewDepartmentTotal}
        isLineManager={isLineManager}
        authUserId={authUser?._id}
      />

      {/* Activity Details Dialog */}
      <ActivityDetailsDialog
        open={modals.activityDetails}
        onOpenChange={(s) => toggleModal('activityDetails', s)}
        activity={selectedActivity}
        getStatusColor={getStatusColor}
      />
    </TooltipProvider>
  )
}