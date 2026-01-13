"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode
} from "react"
import { adminApi, Employee, Department } from "@/lib/admin"
import { authApi } from "@/lib/auth"
import { useAuth } from "@/context/authContext"
import { showToast } from "@/lib/toast"

interface AdminContextType {
  // Users & Departments
  employees: Employee[]
  lockedAccounts: any[]
  departments: Department[]
  
  // Loading states
  isLoading: boolean
  isActionLoading: boolean
  isDepartmentLoading: boolean
  
  // Errors
  error: string | null
  departmentError: string | null
  
  // User Management
  loadUsers: () => Promise<void>
  loadLockedAccounts: () => Promise<void>
  loadDepartments: () => Promise<void>
  
  lockUserAccount: (id_card: string, reason?: string) => Promise<{
    success: boolean;
    message: string;
    lockedBy: { id_card: string; name: string; role: string };
    user: { 
      id_card: string; 
      email: string; 
      first_name: string; 
      last_name: string; 
      role: string;
      lockedAt: string;
      lockedReason: string;
    };
  } | undefined>
  
  unlockUserAccount: (id_card: string) => Promise<{
    success: boolean;
    message: string;
    unlockedBy: { id_card: string; name: string; role: string };
    user: { id_card: string; email: string; first_name: string; last_name: string };
  } | undefined>
  
  updateUser: (userId: string, data: Partial<Employee>) => Promise<Employee | undefined>
  deleteUser: (userId: string) => Promise<{
    success: boolean;
    message: string;
    data: {
      id: string;
      id_card: string;
      email: string;
      name: string;
    };
    deletedBy: {
      id_card: string;
      name: string;
      role: string;
    };
  } | undefined>
  getUserById: (userId: string) => Promise<Employee>
  
  // Department Management
  createDepartment: (data: { name: string; code?: string; description?: string }) => Promise<Department | undefined>
  updateDepartment: (departmentId: string, data: Partial<Department>) => Promise<Department | undefined>
  deleteDepartment: (departmentId: string) => Promise<{
    success: boolean;
    message: string;
    data: {
      id: string;
      name: string;
      code: string;
    };
  } | undefined>
  toggleDepartmentStatus: (departmentId: string) => Promise<Department | undefined>
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth()

  // Users & Departments state
  const [employees, setEmployees] = useState<Employee[]>([])
  const [lockedAccounts, setLockedAccounts] = useState<any[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [isDepartmentLoading, setIsDepartmentLoading] = useState(false)
  
  // Errors
  const [error, setError] = useState<string | null>(null)
  const [departmentError, setDepartmentError] = useState<string | null>(null)

  const isAdmin = Boolean(user?.isAdmin)
  const isSuperAdmin = user?.role === "SUPER_ADMIN"
  const isLineManager = user?.role === "LINE_MANAGER"

  // ======================
  // User Management
  // ======================
  const loadUsers = useCallback(async () => {
    // Allow LINE_MANAGER to view their direct reports and SUPER_ADMIN to view all
    if (!isAdmin && !isLineManager) {
      setEmployees([])
      setError(null)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      let users = await adminApi.getAllUsers()

      // If LINE_MANAGER, restrict to direct reports (defensive: backend may already do this)
      if (isLineManager) {
        users = users.filter((u: any) => {
          if (!u.reportsTo) return false
          return (typeof u.reportsTo === 'string') ? u.reportsTo === user?._id : u.reportsTo._id === user?._id
        })
      }

      console.log(`[ADMIN CONTEXT] ${user?.role} loaded ${users.length} users`)
      setEmployees(users)
    } catch (err: any) {
      console.error("AdminContext loadUsers error:", {
        message: err?.message,
        response: err?.response?.data
      })
      if (isLineManager && err?.response?.status === 403) {
        setError("You can only view your direct reports")
        setEmployees([])
      } else {
        setError(err?.response?.data?.message || err.message || "Failed to fetch users")
        setEmployees([])
      }
    } finally {
      setIsLoading(false)
    }
  }, [isAdmin, isLineManager, user?.role, user?._id])

  const loadLockedAccounts = useCallback(async () => {
    // Allow LINE_MANAGER to view locked accounts for their direct reports as well
    if (!isAdmin && !isLineManager) {
      setLockedAccounts([])
      return
    }

    try {
      setIsLoading(true)
      const response = await authApi.getLockedAccounts()
      let accounts = response.data.accounts || []
      
      if (isLineManager) {
        accounts = accounts.filter((account: any) => {
          return account.reportsTo && (typeof account.reportsTo === 'string' ? account.reportsTo === user?._id : account.reportsTo._id === user?._id)
        })
      }
      setLockedAccounts(accounts)
    } catch (err: any) {
      console.error("AdminContext loadLockedAccounts error:", err)
      if (err.error === 'INSUFFICIENT_PERMISSIONS') {
        showToast.error("Insufficient permissions to view locked accounts")
      } else {
        showToast.error(err.message || "Failed to fetch locked accounts")
      }
      setLockedAccounts([])
    } finally {
      setIsLoading(false)
    }
  }, [isAdmin, isLineManager, user?._id])

  // ======================
  // Department Management
  // ======================
  const loadDepartments = useCallback(async () => {
    // Allow LINE_MANAGER to view departments (read-only) and SUPER_ADMIN to manage
    if (!isSuperAdmin && !isLineManager) {
      setDepartments([])
      setDepartmentError(null)
      return
    }

    try {
      setIsDepartmentLoading(true)
      setDepartmentError(null)
      const departmentsData = await adminApi.getAllDepartments()
      setDepartments(departmentsData)
    } catch (err: any) {
      console.error("AdminContext loadDepartments error:", {
        message: err?.message,
        response: err?.response?.data
      })
      setDepartmentError(err?.response?.data?.message || err.message || "Failed to fetch departments")
      setDepartments([])
      showToast.error("Failed to load departments")
    } finally {
      setIsDepartmentLoading(false)
    }
  }, [isSuperAdmin, isLineManager])

  // ======================
  // User Account Management Functions
  // ======================
  const lockUserAccount = useCallback(async (id_card: string, reason?: string) => {
    if (!isAdmin) {
      showToast.error("Admin access required")
      return
    }

    try {
      setIsActionLoading(true)
      const response = await authApi.lockAccount({ id_card, reason })
      setEmployees(prev => prev.map(emp => {
        if (emp.id_card === id_card) {
          return {
            ...emp,
            isLocked: true,
            lockedAt: response.user?.lockedAt || new Date().toISOString(),
            lockedReason: reason || response.user?.lockedReason || 'Manually locked by administrator'
          };
        }
        return emp;
      }))
      await loadLockedAccounts()
      showToast.success(response.message || "Account locked successfully")
      return response
    } catch (err: any) {
      console.error("AdminContext lockUserAccount error:", err)
      if (err.error === 'INSUFFICIENT_PERMISSIONS') {
        showToast.error("Insufficient permissions to lock accounts")
      } else if (err.error === 'USER_NOT_FOUND') {
        showToast.error("User not found")
      } else if (err.error === 'ACCOUNT_ALREADY_LOCKED') {
        showToast.error("Account is already locked")
      } else if (err.error === 'SELF_LOCK_NOT_ALLOWED') {
        showToast.error("You cannot lock your own account")
      } else if (err.error === 'INSUFFICIENT_PRIVILEGES') {
        showToast.error("Only SUPER_ADMIN can lock other SUPER_ADMIN accounts")
      } else {
        showToast.error(err.message || "Failed to lock account")
      }
      throw err
    } finally {
      setIsActionLoading(false)
    }
  }, [isAdmin, loadLockedAccounts])

  const unlockUserAccount = useCallback(async (id_card: string) => {
    if (!isAdmin) {
      showToast.error("Admin access required")
      return
    }

    try {
      setIsActionLoading(true)
      const response = await authApi.unlockAccount({ id_card })
      setEmployees(prev => prev.map(emp => 
        emp.id_card === id_card 
          ? { ...emp, isLocked: false, lockedAt: undefined, lockedReason: undefined } 
          : emp
      ))
      await loadLockedAccounts()
      showToast.success(response.message || "Account unlocked successfully")
      return response
    } catch (err: any) {
      console.error("AdminContext unlockUserAccount error:", err)
      if (err.error === 'INSUFFICIENT_PERMISSIONS') {
        showToast.error("Insufficient permissions to unlock accounts")
      } else if (err.error === 'USER_NOT_FOUND') {
        showToast.error("User not found")
      } else if (err.error === 'ACCOUNT_NOT_LOCKED') {
        showToast.error("Account is not locked")
      } else {
        showToast.error(err.message || "Failed to unlock account")
      }
      throw err
    } finally {
      setIsActionLoading(false)
    }
  }, [isAdmin, loadLockedAccounts])

  const updateUser = useCallback(async (userId: string, data: Partial<Employee>) => {
    if (!isAdmin) {
      showToast.error("Admin access required")
      return
    }

    try {
      setIsActionLoading(true)
      const updatedUser = await adminApi.updateUser(userId, data)
      setEmployees(prev => prev.map(emp => 
        emp._id === userId ? { ...emp, ...updatedUser } : emp
      ))
      showToast.success("User updated successfully")
      return updatedUser
    } catch (err: any) {
      console.error("AdminContext updateUser error:", err)
      if (err?.response?.status === 403) {
        if (err?.response?.data?.error === 'INSUFFICIENT_PERMISSIONS') {
          showToast.error("Insufficient permissions to update this user")
        } else if (err?.response?.data?.message?.includes('LINE_MANAGER')) {
          showToast.error("LINE_MANAGER can only update their direct reports")
        }
      } else {
        showToast.error(err.message || "Failed to update user")
      }
      throw err
    } finally {
      setIsActionLoading(false)
    }
  }, [isAdmin])

  const deleteUser = useCallback(async (userId: string) => {
    if (!isSuperAdmin) {
      showToast.error("SUPER_ADMIN access required to delete users")
      return
    }

    try {
      setIsActionLoading(true)
      const response = await adminApi.deleteUser(userId)
      setEmployees(prev => prev.filter(emp => emp._id !== userId))
      showToast.success(response.message || "User deleted successfully")
      return response
    } catch (err: any) {
      console.error("AdminContext deleteUser error:", err)
      if (err?.message?.includes('Only SUPER_ADMIN')) {
        showToast.error("Only SUPER_ADMIN can delete users")
      } else if (err?.message?.includes('Cannot delete your own account')) {
        showToast.error("You cannot delete your own account")
      } else if (err?.message?.includes('Cannot delete another SUPER_ADMIN')) {
        showToast.error("Cannot delete another SUPER_ADMIN account")
      } else if (err?.message?.includes('User not found')) {
        showToast.error("User not found")
      } else {
        showToast.error(err.message || "Failed to delete user")
      }
      throw err
    } finally {
      setIsActionLoading(false)
    }
  }, [isSuperAdmin])

  const getUserById = useCallback(async (userId: string): Promise<Employee> => { 
    if (!isAdmin) throw new Error("Admin access required")

    try {
      setIsLoading(true)
      const user = await adminApi.getUserById(userId)
      return user
    } catch (err: any) {
      console.error("AdminContext getUserById error:", err)
      showToast.error(err.message || "Failed to fetch user")
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [isAdmin])

  // ======================
  // Department Management Functions
  // ======================
  const createDepartment = useCallback(async (data: { name: string; code?: string; description?: string }) => {
    if (!isSuperAdmin) {
      showToast.error("SUPER_ADMIN access required")
      return
    }

    try {
      setIsActionLoading(true)
      const newDepartment = await adminApi.createDepartment(data)
      setDepartments(prev => [...prev, newDepartment])
      showToast.success("Department created successfully")
      return newDepartment
    } catch (err: any) {
      console.error("AdminContext createDepartment error:", err)
      if (err?.response?.status === 409) {
        if (err?.response?.data?.message?.includes('name')) {
          showToast.error("Department name already exists")
        } else if (err?.response?.data?.message?.includes('code')) {
          showToast.error("Department code already exists")
        } else {
          showToast.error(err.message || "Failed to create department")
        }
      } else if (err?.response?.status === 403) {
        showToast.error("Only SUPER_ADMIN can create departments")
      } else {
        showToast.error(err.message || "Failed to create department")
      }
      throw err
    } finally {
      setIsActionLoading(false)
    }
  }, [isSuperAdmin])

  const updateDepartment = useCallback(async (departmentId: string, data: Partial<Department>) => {
    if (!isSuperAdmin) {
      showToast.error("SUPER_ADMIN access required")
      return
    }

    try {
      setIsActionLoading(true)
      const updatedDepartment = await adminApi.updateDepartment(departmentId, data)
      setDepartments(prev => prev.map(dept => 
        dept._id === departmentId ? { ...dept, ...updatedDepartment } : dept
      ))
      showToast.success("Department updated successfully")
      return updatedDepartment
    } catch (err: any) {
      console.error("AdminContext updateDepartment error:", err)
      showToast.error(err.message || "Failed to update department")
      throw err
    } finally {
      setIsActionLoading(false)
    }
  }, [isSuperAdmin])

  const deleteDepartment = useCallback(async (departmentId: string) => {
    if (!isSuperAdmin) {
      showToast.error("SUPER_ADMIN access required")
      return
    }

    try {
      setIsActionLoading(true)
      const result = await adminApi.deleteDepartment(departmentId)
      setDepartments(prev => prev.filter(dept => dept._id !== departmentId))
      showToast.success("Department deleted successfully")
      return result
    } catch (err: any) {
      console.error("AdminContext deleteDepartment error:", err)
      if (err?.response?.status === 400 && err?.response?.data?.message?.includes('users')) {
        showToast.error("Cannot delete department with assigned users")
      } else if (err?.response?.status === 403) {
        showToast.error("Only SUPER_ADMIN can delete departments")
      } else {
        showToast.error(err.message || "Failed to delete department")
      }
      throw err
    } finally {
      setIsActionLoading(false)
    }
  }, [isSuperAdmin])

  const toggleDepartmentStatus = useCallback(async (departmentId: string) => {
    if (!isSuperAdmin) {
      showToast.error("SUPER_ADMIN access required")
      return
    }

    try {
      setIsActionLoading(true)
      const updatedDepartment = await adminApi.toggleDepartmentStatus(departmentId)
      setDepartments(prev => prev.map(dept => 
        dept._id === departmentId ? updatedDepartment : dept
      ))
      showToast.success(
        updatedDepartment.isActive 
          ? "Department activated successfully" 
          : "Department deactivated successfully"
      )
      return updatedDepartment
    } catch (err: any) {
      console.error("AdminContext toggleDepartmentStatus error:", err)
      showToast.error(err.message || "Failed to toggle department status")
      throw err
    } finally {
      setIsActionLoading(false)
    }
  }, [isSuperAdmin])

  // ======================
  // Initial Data Loading
  // ======================
  useEffect(() => {
    if (isAdmin) {
      loadUsers()
      loadLockedAccounts()
    }
    
    if (isSuperAdmin) {
      loadDepartments()
    } else {
      setDepartments([])
      setDepartmentError(null)
    }
    
    if (!isAdmin) {
      setEmployees([])
      setLockedAccounts([])
      setError(null)
    }
  }, [isAdmin, isSuperAdmin, loadUsers, loadLockedAccounts, loadDepartments])

  return (
    <AdminContext.Provider value={{ 
      // State
      employees, 
      lockedAccounts,
      departments,
      
      // Loading states
      isLoading, 
      isActionLoading,
      isDepartmentLoading,
      
      // Errors
      error, 
      departmentError,
      
      // User Management
      loadUsers,
      loadLockedAccounts,
      loadDepartments,
      lockUserAccount,
      unlockUserAccount,
      updateUser,
      deleteUser,
      getUserById,
      
      // Department Management
      createDepartment,
      updateDepartment,
      deleteDepartment,
      toggleDepartmentStatus,
    }}>
      {children}
    </AdminContext.Provider>
  )
}

export const useAdmin = (): AdminContextType => {
  const context = useContext(AdminContext)
  if (!context) {
    throw new Error("useAdmin must be used within an AdminProvider")
  }
  return context
}