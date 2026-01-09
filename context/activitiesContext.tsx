// context/activitiesContext.tsx
"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect
} from "react"
import { activityApi, DailyActivity, CreateActivityData, UpdateActivityData } from "@/lib/activity"
import { adminApi } from "@/lib/admin"
import { useAuth } from "@/context/authContext"
import { showToast } from "@/lib/toast"

interface ActivitiesContextType {
  // Personal Activities
  personalActivities: DailyActivity[]
  personalActivitiesStats: any
  personalActivitiesLoading: boolean
  personalActivitiesError: string | null
  
  // Admin Activities
  allActivities: DailyActivity[]
  userActivities: DailyActivity[]
  activitiesStats: any
  activitiesPagination: any
  adminActivitiesLoading: boolean
  adminActivitiesError: string | null
  
  // Personal Activities Functions
  createPersonalActivity: (data: CreateActivityData) => Promise<DailyActivity | undefined>
  updatePersonalActivity: (activityId: string, data: UpdateActivityData) => Promise<DailyActivity | undefined>
  deletePersonalActivity: (activityId: string) => Promise<{ success: boolean; message: string } | undefined>
  loadTodayActivities: () => Promise<void>
  loadPersonalActivitiesByDateRange: (startDate: string, endDate: string, filters?: {
    status?: 'pending' | 'ongoing' | 'completed';
    category?: 'work' | 'meeting' | 'training' | 'break' | 'other';
  }) => Promise<void>
  
  // Admin Activities Functions
  loadAllActivities: (params?: {
    date?: string;
    status?: 'pending' | 'ongoing' | 'completed';
    region?: string;
    branch?: string;
    page?: number;
    limit?: number;
  }) => Promise<void>
  
  loadActivitiesByUser: (userId: string, params?: {
    date?: string;
    status?: 'pending' | 'ongoing' | 'completed';
    page?: number;
    limit?: number;
  }) => Promise<void>
  
  // Status Functions
  getStatusColor: (status: string) => string
  getPriorityColor: (priority?: string) => string
  getCategoryIcon: (category?: string) => string
  
  // Refresh function
  refreshActivities: () => void
}

const ActivitiesContext = createContext<ActivitiesContextType | undefined>(undefined)

export const ActivitiesProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth()

  // Personal Activities State
  const [personalActivities, setPersonalActivities] = useState<DailyActivity[]>([])
  const [personalActivitiesStats, setPersonalActivitiesStats] = useState<any>(null)
  const [personalActivitiesLoading, setPersonalActivitiesLoading] = useState(false)
  const [personalActivitiesError, setPersonalActivitiesError] = useState<string | null>(null)

  // Admin Activities State
  const [allActivities, setAllActivities] = useState<DailyActivity[]>([])
  const [userActivities, setUserActivities] = useState<DailyActivity[]>([])
  const [activitiesStats, setActivitiesStats] = useState<any>(null)
  const [activitiesPagination, setActivitiesPagination] = useState<any>(null)
  const [adminActivitiesLoading, setAdminActivitiesLoading] = useState(false)
  const [adminActivitiesError, setAdminActivitiesError] = useState<string | null>(null)

  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const isAdmin = Boolean(user?.isAdmin)
  const isSuperAdmin = user?.role === "SUPER_ADMIN"
  const isLineManager = user?.role === "LINE_MANAGER"

  // ======================
  // Helper Functions
  // ======================
  const getStatusColor = useCallback((status: string): string => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'ongoing': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }, [])

  const getPriorityColor = useCallback((priority?: string): string => {
    if (!priority) return 'bg-gray-100 text-gray-800 border-gray-200'
    
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }, [])

  const getCategoryIcon = useCallback((category?: string): string => {
    switch (category?.toLowerCase()) {
      case 'meeting': return '👥'
      case 'training': return '📚'
      case 'break': return '☕'
      case 'work': return '💼'
      case 'other': return '📝'
      default: return '📋'
    }
  }, [])

  // ======================
  // Personal Activities Functions
  // ======================
  const createPersonalActivity = useCallback(async (data: CreateActivityData): Promise<DailyActivity | undefined> => {
    try {
      setPersonalActivitiesLoading(true)
      setPersonalActivitiesError(null)
      
      const response = await activityApi.createDailyActivity(data)
      
      if (response.success) {
        // Add the new activity to the current list
        setPersonalActivities(prev => {
          const newActivities = [response.data, ...prev]
          // Sort by time interval for better display
          return newActivities.sort((a, b) => {
            const timeA = a.timeInterval.split('-')[0].trim()
            const timeB = b.timeInterval.split('-')[0].trim()
            return timeA.localeCompare(timeB)
          })
        })
        
        // Update stats
        setPersonalActivitiesStats((prev: any) => {
          const newStats = {
            total: (prev?.total || 0) + 1,
            completed: prev?.completed || 0,
            ongoing: prev?.ongoing || 0,
            pending: prev?.pending || 0
          }
          
          if (response.data.status === 'completed') {
            newStats.completed = (prev?.completed || 0) + 1
          } else if (response.data.status === 'ongoing') {
            newStats.ongoing = (prev?.ongoing || 0) + 1
          } else {
            newStats.pending = (prev?.pending || 0) + 1
          }
          
          return newStats
        })
        
        showToast.success("Activity created successfully")
        return response.data
      } else {
        throw new Error(response.message || "Failed to create activity")
      }
    } catch (error: any) {
      console.error("createPersonalActivity error:", error)
      
      let errorMessage = error.message || "Failed to create activity"
      
      if (error.error === 'TIME_CONFLICT') {
        errorMessage = `Time conflict: An activity already exists for ${error.conflictingActivity?.timeInterval}. Please select a different time slot.`
      } else if (error.error === 'VALIDATION_ERROR') {
        if (error.details && error.details.length > 0) {
          errorMessage = error.details.map((d: any) => d.message).join(', ')
        }
      }
      
      setPersonalActivitiesError(errorMessage)
      showToast.error(errorMessage)
      throw error
    } finally {
      setPersonalActivitiesLoading(false)
    }
  }, [])

  const updatePersonalActivity = useCallback(async (activityId: string, data: UpdateActivityData): Promise<DailyActivity | undefined> => {
    try {
      setPersonalActivitiesLoading(true)
      setPersonalActivitiesError(null)
      
      const response = await activityApi.updateDailyActivity(activityId, data)
      
      if (response.success) {
        // Update the activity in the list
        setPersonalActivities(prev => 
          prev.map(activity => 
            activity._id === activityId ? response.data : activity
          )
        )
        
        // Update stats if status changed
        if (data.status) {
          setPersonalActivitiesStats((prev: any) => {
            if (!prev) return null
            
            // Find the old activity to get previous status
            const oldActivity = personalActivities.find(a => a._id === activityId)
            if (oldActivity && oldActivity.status !== data.status) {
              const newStats = { ...prev }
              
              // Decrement old status
              if (oldActivity.status === 'completed') {
                newStats.completed = Math.max(0, (newStats.completed || 0) - 1)
              } else if (oldActivity.status === 'ongoing') {
                newStats.ongoing = Math.max(0, (newStats.ongoing || 0) - 1)
              } else if (oldActivity.status === 'pending') {
                newStats.pending = Math.max(0, (newStats.pending || 0) - 1)
              }
              
              // Increment new status
              if (data.status === 'completed') {
                newStats.completed = (newStats.completed || 0) + 1
              } else if (data.status === 'ongoing') {
                newStats.ongoing = (newStats.ongoing || 0) + 1
              } else if (data.status === 'pending') {
                newStats.pending = (newStats.pending || 0) + 1
              }
              
              return newStats
            }
            return prev
          })
        }
        
        showToast.success("Activity updated successfully")
        return response.data
      } else {
        throw new Error(response.message || "Failed to update activity")
      }
    } catch (error: any) {
      console.error("updatePersonalActivity error:", error)
      
      let errorMessage = error.message || "Failed to update activity"
      
      if (error.error === 'NOT_FOUND') {
        errorMessage = "Activity not found"
      } else if (error.error === 'UPDATE_ERROR') {
        errorMessage = "Cannot modify a completed activity"
      } else if (error.error === 'PERMISSION_DENIED') {
        errorMessage = "You don't have permission to update this activity"
      }
      
      setPersonalActivitiesError(errorMessage)
      showToast.error(errorMessage)
      throw error
    } finally {
      setPersonalActivitiesLoading(false)
    }
  }, [personalActivities])

  const deletePersonalActivity = useCallback(async (activityId: string): Promise<{ success: boolean; message: string } | undefined> => {
    try {
      setPersonalActivitiesLoading(true)
      setPersonalActivitiesError(null)
      
      const response = await activityApi.deleteDailyActivity(activityId)
      
      if (response.success) {
        // Remove the activity from the list
        const deletedActivity = personalActivities.find(a => a._id === activityId)
        
        setPersonalActivities(prev => prev.filter(activity => activity._id !== activityId))
        
        // Update stats
        if (deletedActivity) {
          setPersonalActivitiesStats((prev: any) => {
            if (!prev) return null
            const newStats = { ...prev }
            
            if (deletedActivity.status === 'completed') {
              newStats.completed = Math.max(0, (newStats.completed || 0) - 1)
            } else if (deletedActivity.status === 'ongoing') {
              newStats.ongoing = Math.max(0, (newStats.ongoing || 0) - 1)
            } else if (deletedActivity.status === 'pending') {
              newStats.pending = Math.max(0, (newStats.pending || 0) - 1)
            }
            
            newStats.total = Math.max(0, (newStats.total || 0) - 1)
            return newStats
          })
        }
        
        showToast.success("Activity deleted successfully")
        return response
      } else {
        throw new Error(response.message || "Failed to delete activity")
      }
    } catch (error: any) {
      console.error("deletePersonalActivity error:", error)
      
      let errorMessage = error.message || "Failed to delete activity"
      
      if (error.error === 'NOT_FOUND') {
        errorMessage = "Activity not found"
      } else if (error.error === 'PERMISSION_DENIED') {
        errorMessage = "You don't have permission to delete this activity"
      }
      
      setPersonalActivitiesError(errorMessage)
      showToast.error(errorMessage)
      throw error
    } finally {
      setPersonalActivitiesLoading(false)
    }
  }, [personalActivities])

  const loadTodayActivities = useCallback(async (): Promise<void> => {
    try {
      setPersonalActivitiesLoading(true)
      setPersonalActivitiesError(null)
      
      const response = await activityApi.getTodayActivities()
      
      if (response.success) {
        setPersonalActivities(response.data || [])
        
        // Transform stats from backend to match our format
        if (response.stats) {
          setPersonalActivitiesStats({
            total: response.stats.total || 0,
            completed: response.stats.completed || 0,
            ongoing: response.stats.ongoing || 0,
            pending: response.stats.pending || 0
          })
        } else if (response.summary?.statusCount) {
          setPersonalActivitiesStats({
            total: response.summary.statusCount.pending + 
                   response.summary.statusCount.ongoing + 
                   response.summary.statusCount.completed,
            completed: response.summary.statusCount.completed,
            ongoing: response.summary.statusCount.ongoing,
            pending: response.summary.statusCount.pending
          })
        } else {
          setPersonalActivitiesStats({
            total: response.data?.length || 0,
            completed: response.data?.filter((a: DailyActivity) => a.status === 'completed').length || 0,
            ongoing: response.data?.filter((a: DailyActivity) => a.status === 'ongoing').length || 0,
            pending: response.data?.filter((a: DailyActivity) => a.status === 'pending').length || 0
          })
        }
      } else {
        throw new Error(response.message || "Failed to load today's activities")
      }
    } catch (error: any) {
      console.error("loadTodayActivities error:", error)
      setPersonalActivitiesError(error.message || "Failed to load today's activities")
      showToast.error("Failed to load activities")
      throw error
    } finally {
      setPersonalActivitiesLoading(false)
    }
  }, [])

  const loadPersonalActivitiesByDateRange = useCallback(async (
    startDate: string, 
    endDate: string, 
    filters?: {
      status?: 'pending' | 'ongoing' | 'completed';
      category?: 'work' | 'meeting' | 'training' | 'break' | 'other';
    }
  ): Promise<void> => {
    try {
      setPersonalActivitiesLoading(true)
      setPersonalActivitiesError(null)
      
      const response = await activityApi.getActivitiesByDateRange(startDate, endDate, filters)
      
      if (response.success) {
        setPersonalActivities(response.data || [])
        
        // Transform stats from backend
        if (response.stats) {
          if (response.stats.byStatus) {
            setPersonalActivitiesStats({
              total: response.stats.total || 0,
              completed: response.stats.byStatus.completed || 0,
              ongoing: response.stats.byStatus.ongoing || 0,
              pending: response.stats.byStatus.pending || 0
            })
          } else {
            setPersonalActivitiesStats({
              total: response.stats.total || 0,
              completed: response.data?.filter((a: DailyActivity) => a.status === 'completed').length || 0,
              ongoing: response.data?.filter((a: DailyActivity) => a.status === 'ongoing').length || 0,
              pending: response.data?.filter((a: DailyActivity) => a.status === 'pending').length || 0
            })
          }
        } else {
          setPersonalActivitiesStats({
            total: response.data?.length || 0,
            completed: response.data?.filter((a: DailyActivity) => a.status === 'completed').length || 0,
            ongoing: response.data?.filter((a: DailyActivity) => a.status === 'ongoing').length || 0,
            pending: response.data?.filter((a: DailyActivity) => a.status === 'pending').length || 0
          })
        }
      } else {
        throw new Error(response.message || "Failed to load activities")
      }
    } catch (error: any) {
      console.error("loadPersonalActivitiesByDateRange error:", error)
      
      let errorMessage = error.message || "Failed to load activities"
      
      if (error.error === 'DATE_RANGE_ERROR') {
        errorMessage = "Date range cannot exceed 90 days"
      } else if (error.error === 'DATE_FORMAT_ERROR') {
        errorMessage = "Invalid date format. Please use YYYY-MM-DD"
      }
      
      setPersonalActivitiesError(errorMessage)
      showToast.error(errorMessage)
      throw error
    } finally {
      setPersonalActivitiesLoading(false)
    }
  }, [])

  // ======================
  // Admin Activities Functions
  // ======================
  const loadAllActivities = useCallback(async (params?: {
    date?: string;
    status?: 'pending' | 'ongoing' | 'completed';
    region?: string;
    branch?: string;
    page?: number;
    limit?: number;
  }): Promise<void> => {
    if (!isAdmin) {
      setAllActivities([])
      setAdminActivitiesError("Admin access required")
      return
    }

    try {
      setAdminActivitiesLoading(true)
      setAdminActivitiesError(null)
      
      const response = await adminApi.getAllActivities(params)
      
      if (response.success) {
        setAllActivities(response.data || [])
        setActivitiesStats(response.stats || null)
        setActivitiesPagination(response.pagination || null)
      } else {
        throw new Error(response.message || "Failed to fetch activities")
      }
    } catch (error: any) {
      console.error("loadAllActivities error:", error)
      
      let errorMessage = error.message || "Failed to fetch activities"
      
      if (error.error === 'INSUFFICIENT_PERMISSIONS') {
        errorMessage = "Insufficient permissions to view all activities"
      } else if (error.error === 'VALIDATION_ERROR') {
        errorMessage = "Invalid filter parameters"
      }
      
      setAdminActivitiesError(errorMessage)
      setAllActivities([])
      showToast.error(errorMessage)
    } finally {
      setAdminActivitiesLoading(false)
    }
  }, [isAdmin])

  const loadActivitiesByUser = useCallback(async (userId: string, params?: {
    date?: string;
    status?: 'pending' | 'ongoing' | 'completed';
    page?: number;
    limit?: number;
  }): Promise<void> => {
    if (!isAdmin) {
      setUserActivities([])
      setAdminActivitiesError("Admin access required")
      return
    }

    try {
      setAdminActivitiesLoading(true)
      setAdminActivitiesError(null)
      
      const response = await adminApi.getActivitiesByUser(userId, params)
      
      if (response.success) {
        setUserActivities(response.data || [])
        setActivitiesStats(response.stats || null)
        setActivitiesPagination(response.pagination || null)
      } else {
        throw new Error(response.message || "Failed to fetch user activities")
      }
    } catch (error: any) {
      console.error("loadActivitiesByUser error:", error)
      
      let errorMessage = error.message || "Failed to fetch user activities"
      
      if (error.error === 'INSUFFICIENT_PERMISSIONS') {
        errorMessage = "Insufficient permissions to view user activities"
      } else if (error.error === 'USER_NOT_FOUND') {
        errorMessage = "User not found"
      }
      
      setAdminActivitiesError(errorMessage)
      setUserActivities([])
      showToast.error(errorMessage)
    } finally {
      setAdminActivitiesLoading(false)
    }
  }, [isAdmin])

  const refreshActivities = useCallback(() => {
    setRefreshTrigger(prev => prev + 1)
  }, [])

  // Auto-load today's activities when user changes
  useEffect(() => {
    if (user) {
      loadTodayActivities()
    }
  }, [user, refreshTrigger])

  return (
    <ActivitiesContext.Provider value={{ 
      // Personal Activities State
      personalActivities,
      personalActivitiesStats,
      personalActivitiesLoading,
      personalActivitiesError,
      
      // Admin Activities State
      allActivities,
      userActivities,
      activitiesStats,
      activitiesPagination,
      adminActivitiesLoading,
      adminActivitiesError,
      
      // Personal Activities Functions
      createPersonalActivity,
      updatePersonalActivity,
      deletePersonalActivity,
      loadTodayActivities,
      loadPersonalActivitiesByDateRange,
      
      // Admin Activities Functions
      loadAllActivities,
      loadActivitiesByUser,
      
      // Helper Functions
      getStatusColor,
      getPriorityColor,
      getCategoryIcon,
      
      // Refresh function
      refreshActivities,
    }}>
      {children}
    </ActivitiesContext.Provider>
  )
}

export const useActivities = (): ActivitiesContextType => {
  const context = useContext(ActivitiesContext)
  if (!context) {
    throw new Error("useActivities must be used within an ActivitiesProvider")
  }
  return context
}