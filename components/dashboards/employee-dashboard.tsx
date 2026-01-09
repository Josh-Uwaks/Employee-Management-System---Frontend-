"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/context/authContext"
import { useActivities } from "@/context/activitiesContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LogOut, Bell, Calendar, Activity, Clock, AlertTriangle, Table, Eye, BarChart2, Download, CheckCircle2, XCircle, Loader2, Edit, Save, X } from "lucide-react"
import ActivityCalendar from "../activity/activity-calender"
import NotificationCenter from "@/components/notifications/notification-center"
import LoadingScreen from "@/components/loader/loader"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { showToast } from "@/lib/toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "../ui/badge"

// --- UTILITY FUNCTIONS ---

// NOTE: Using Africa/Lagos timezone for all time-based logic.
const TIMEZONE = 'Africa/Lagos' 

// Helper function to normalize dates for comparison
const normalizeDateForComparison = (dateString: string | Date): string => {
  const date = new Date(dateString)
  // Convert to YYYY-MM-DD format in Lagos timezone
  return date.toLocaleDateString('en-CA', { timeZone: TIMEZONE })
}

// Get dates with activities from personalActivities
const getDatesWithActivity = (activities: any[]): Date[] => {
  // Extract unique dates from activities
  const uniqueDates = new Set<string>()
  
  activities.forEach(activity => {
    if (activity.date) {
      // Normalize date to remove time component
      const normalizedDate = normalizeDateForComparison(activity.date)
      uniqueDates.add(normalizedDate)
    }
  })
  
  return Array.from(uniqueDates).map(dateStr => {
    // Parse in Lagos timezone
    const [year, month, day] = dateStr.split('-').map(Number)
    return new Date(Date.UTC(year, month - 1, day))
  })
}

// --- EMPLOYEE DASHBOARD INTERFACES AND CONSTANTS ---

interface EmployeeDashboardProps {
  onLogout: () => void
}

interface ActivityTableEntryHalfHour {
  slotIndex: number
  timeLabel: string
  status: "present" | "absent" | "pending" | "empty"
  activities: Array<{
    id: string;
    description: string;
    status: "pending" | "ongoing" | "completed";
    timestamp: string;
    changeCount: number;
    category?: string;
    priority?: string;
  }>
}

interface EditActivityData {
  id: string;
  timeInterval: string;
  description: string;
  status: 'pending' | 'ongoing' | 'completed';
  category?: 'work' | 'meeting' | 'training' | 'break' | 'other';
  priority?: 'low' | 'medium' | 'high';
}

// 🔑 Updated constants for a full 24-hour period (48 half-hour slots)
// CHANGED: Restricting work hours to 8:00 AM to 5:30 PM (to include the 5:00 PM slot)
const WORK_SLOT_START = 16 // 8:00 AM (16th half-hour of the day)
const WORK_SLOT_END = 35 // 5:30 PM (35th half-hour of the day - slots go up to 34, which is 5:00 PM to 5:30 PM)
const TOTAL_WORK_SLOTS = WORK_SLOT_END - WORK_SLOT_START 

const slotIndexToTimeLabel = (slotIndex: number): string => {
  const totalHalfHours = slotIndex
  const hour = Math.floor(totalHalfHours / 2)
  const minute = (totalHalfHours % 2) * 30
  
  // Handle the end of the day (slot 48 should display as 00:00)
  const nextHalfHours = totalHalfHours + 1
  const nextHour = Math.floor(nextHalfHours / 2) % 24 
  const nextMinute = (nextHalfHours % 2) * 30
  
  const start = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  const end = `${String(nextHour).padStart(2, '0')}:${String(nextMinute).padStart(2, '0')}`
  
  return `${start} - ${end}`
}

// Generate time slots from 8:00 AM to 5:30 PM in 30-minute intervals
const generateTimeSlots = (): string[] => {
  const slots: string[] = []
  
  for (let i = WORK_SLOT_START; i < WORK_SLOT_END; i++) {
    slots.push(slotIndexToTimeLabel(i))
  }
  
  return slots
}

// Get current slot index in Lagos timezone
const getCurrentSlotIndexLagos = (): number => {
  const now = new Date()
  const lagosTime = new Intl.DateTimeFormat('en-US', { 
    hour: 'numeric', 
    minute: 'numeric', 
    hourCycle: 'h23',
    timeZone: TIMEZONE 
  }).formatToParts(now)

  const hourPart = lagosTime.find(p => p.type === 'hour')
  const minutePart = lagosTime.find(p => p.type === 'minute')

  const currentHourInLagos = hourPart ? parseInt(hourPart.value, 10) : now.getHours()
  const currentMinuteInLagos = minutePart ? parseInt(minutePart.value, 10) : now.getMinutes()

  return currentHourInLagos * 2 + Math.floor(currentMinuteInLagos / 30)
}

// Convert time interval string to slot index
const timeIntervalToSlotIndex = (timeInterval: string): number => {
  const [startTime] = timeInterval.split('-').map(t => t.trim())
  const [hours, minutes] = startTime.split(':').map(Number)
  return hours * 2 + Math.floor(minutes / 30)
}

// --- MAIN DASHBOARD COMPONENT ---

export default function EmployeeDashboard({ onLogout }: EmployeeDashboardProps) {
  const { user } = useAuth()
  const { 
    personalActivities, 
    personalActivitiesStats, 
    personalActivitiesLoading, 
    loadTodayActivities,
    createPersonalActivity,
    updatePersonalActivity,
    deletePersonalActivity,
    loadPersonalActivitiesByDateRange,
    refreshActivities
  } = useActivities()
  
  const [notifications, setNotifications] = useState<any[]>([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [isClient, setIsClient] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>(normalizeDateForComparison(new Date()))
  const [missedSlots, setMissedSlots] = useState<number>(0)
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  const [activityTable, setActivityTable] = useState<ActivityTableEntryHalfHour[]>([])
  const [activityDates, setActivityDates] = useState<Date[]>([])
  
  // New state for activity logger
  const [activityDescription, setActivityDescription] = useState<string>("")
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("")
  const [activityStatus, setActivityStatus] = useState<"pending" | "ongoing" | "completed">("pending")
  const [timeSlots, setTimeSlots] = useState<string[]>([])
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([])
  const [currentSlotIndex, setCurrentSlotIndex] = useState<number>(0)

  // State for edit modal
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState<EditActivityData | null>(null)
  const [editDescription, setEditDescription] = useState("")
  const [editStatus, setEditStatus] = useState<'pending' | 'ongoing' | 'completed'>("pending")
  const [editCategory, setEditCategory] = useState<'work' | 'meeting' | 'training' | 'break' | 'other'>("work")
  const [editPriority, setEditPriority] = useState<'low' | 'medium' | 'high'>("medium")

  const todayNormalized = normalizeDateForComparison(new Date())
  const isToday = normalizeDateForComparison(selectedDate) === todayNormalized

  const userName = user ? `${user.first_name} ${user.last_name}` : "Employee"
  const userId = user?._id || ""

  // Get department name
  const getDepartmentName = (): string => {
    if (!user?.department) return "N/A"
    
    if (typeof user.department === 'object' && user.department !== null) {
      return user.department.name || "N/A"
    }
    
    return String(user.department) || "N/A"
  }

  // Get position
  const getPosition = (): string => {
    return user?.position || "N/A"
  }

  useEffect(() => {
    if (!user) return
    
    setIsClient(true)
    
    // Initialize time slots
    const slots = generateTimeSlots()
    setTimeSlots(slots)
    
    loadDashboardData()
    
    // Refresh data every 5 minutes
    const interval = setInterval(() => {
      loadDashboardData()
    }, 300000) // 5 minutes
    
    return () => clearInterval(interval)
  }, [userId, selectedDate, refreshKey])

  useEffect(() => {
    if (isToday) {
      updateAvailableTimeSlots()
    } else {
      // For past dates, all slots are available for viewing but not for logging
      setAvailableTimeSlots(timeSlots)
    }
  }, [isToday, timeSlots])

  useEffect(() => {
    // Update activity dates when personal activities change
    const dates = getDatesWithActivity(personalActivities)
    setActivityDates(dates)
    
    // Update activity table whenever personal activities change
    updateActivityTable()
  }, [personalActivities, selectedDate, currentSlotIndex])

  useEffect(() => {
    // Calculate missed slots whenever activities or date changes
    calculateMissedSlots()
  }, [personalActivities, selectedDate, currentSlotIndex])

  const updateAvailableTimeSlots = () => {
    const currentIndex = getCurrentSlotIndexLagos()
    setCurrentSlotIndex(currentIndex)
    
    // For today, only allow current and future slots
    const available = timeSlots.filter(slot => {
      const slotIndex = timeIntervalToSlotIndex(slot)
      return slotIndex >= currentIndex && slotIndex < WORK_SLOT_END
    })
    
    setAvailableTimeSlots(available)
  }

  const loadDashboardData = async () => {
    if (!userId) return
    
    try {
      if (isToday) {
        // Load today's activities
        await loadTodayActivities()
      } else {
        // Load activities for selected date
        await loadPersonalActivitiesByDateRange(selectedDate, selectedDate)
      }
      
      // Refresh the global activities context
      refreshActivities()
      
    } catch (error) {
      console.error("Error loading dashboard data:", error)
      showToast.error("Failed to load activities")
    }
  }

  const calculateMissedSlots = () => {
    if (!isToday) {
      setMissedSlots(0)
      return
    }
    
    const now = new Date()
    const todayNormalized = normalizeDateForComparison(now)
    const currentSlotIndex = getCurrentSlotIndexLagos()
    
    let missed = 0
    for (let i = WORK_SLOT_START; i < Math.min(currentSlotIndex, WORK_SLOT_END); i++) {
      // Check if there's an activity in this slot
      const hasActivity = personalActivities.some(activity => {
        if (!activity.date) return false
        
        const activityDate = normalizeDateForComparison(activity.date)
        if (activityDate !== todayNormalized) return false
        
        const activitySlot = timeIntervalToSlotIndex(activity.timeInterval)
        return activitySlot === i
      })
      
      if (!hasActivity) {
        missed++
      }
    }
    
    setMissedSlots(Math.max(0, missed))
  }

  const updateActivityTable = () => {
    if (!userId) return
    
    // Create empty slots for all work hours
    const workSlots: ActivityTableEntryHalfHour[] = Array.from({ length: TOTAL_WORK_SLOTS }, (_, index) => {
      const slotIndex = index + WORK_SLOT_START
      return {
        slotIndex: slotIndex,
        timeLabel: slotIndexToTimeLabel(slotIndex),
        status: "empty",
        activities: [],
      }
    })
    
    // Normalize selected date for comparison
    const normalizedSelectedDate = normalizeDateForComparison(selectedDate)
    
    // Fill in activities for selected date
    const activitiesForDate = personalActivities.filter(activity => {
      if (!activity.date) return false
      
      // Normalize activity date for comparison
      const activityDate = normalizeDateForComparison(activity.date)
      return activityDate === normalizedSelectedDate
    })
    
    const tableData = workSlots.map(workSlot => {
      // Find ALL activities for this slot (not just one)
      const activitiesInSlot = activitiesForDate.filter(a => {
        const activitySlot = timeIntervalToSlotIndex(a.timeInterval)
        return activitySlot === workSlot.slotIndex
      })
      
      if (activitiesInSlot.length > 0) {
        return {
          slotIndex: workSlot.slotIndex,
          timeLabel: workSlot.timeLabel,
          status: "present" as const,
          activities: activitiesInSlot.map(activity => ({
            id: activity._id,
            description: activity.description,
            status: activity.status,
            timestamp: activity.createdAt,
            changeCount: 0,
            category: activity.category,
            priority: activity.priority
          }))
        }
      }
      
      // If no activity, determine status
      const now = new Date()
      const todayNormalized = normalizeDateForComparison(now)
      const currentSlotIndex = getCurrentSlotIndexLagos()
      
      // Compare normalized dates
      if (normalizedSelectedDate < todayNormalized || 
          (normalizedSelectedDate === todayNormalized && workSlot.slotIndex < currentSlotIndex)) {
        return {
          ...workSlot,
          status: "absent" as const
        }
      }
      
      return workSlot
    })
    
    setActivityTable(tableData)
  }

  const handleLogActivity = async () => {
    if (!selectedTimeSlot || !activityDescription.trim()) {
      showToast.error("Please select a time slot and enter a description")
      return
    }

    if (!isToday) {
      showToast.error("You can only log activities for today")
      return
    }

    try {
      // Check if this time slot is still available
      const slotIndex = timeIntervalToSlotIndex(selectedTimeSlot)
      
      // Allow any slot up to the end of work day, even if it's past current time
      // This allows logging activities they forgot to log earlier
      if (slotIndex < WORK_SLOT_START || slotIndex >= WORK_SLOT_END) {
        showToast.error("Please select a time slot between 8:00 AM and 5:30 PM")
        return
      }

      await createPersonalActivity({
        timeInterval: selectedTimeSlot,
        description: activityDescription.trim(),
        status: activityStatus,
        category: "work" as any,
        priority: "medium" as any
      })
      
      // Reset form
      setActivityDescription("")
      setSelectedTimeSlot("")
      setActivityStatus("pending")
      
      // Update UI
      setRefreshKey(k => k + 1)
      
      showToast.success("Activity logged successfully!")
      
    } catch (error: any) {
      console.error("Error logging activity:", error)
      // Error is already handled in the context
    }
  }

  const handleEditClick = (activity: any) => {
    setEditingActivity({
      id: activity.id,
      timeInterval: activity.timeInterval,
      description: activity.description,
      status: activity.status,
      category: activity.category || "work",
      priority: activity.priority || "medium"
    })
    setEditDescription(activity.description)
    setEditStatus(activity.status)
    setEditCategory(activity.category || "work")
    setEditPriority(activity.priority || "medium")
    setEditModalOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingActivity || !editDescription.trim()) {
      showToast.error("Please enter a description")
      return
    }

    try {
      // Prepare update data - include all fields
      const updateData: any = {
        description: editDescription.trim(),
        status: editStatus,
        category: editCategory,
        priority: editPriority
      }

      // Only include timeInterval if it's different
      if (editingActivity.timeInterval !== editingActivity.timeInterval) {
        updateData.timeInterval = editingActivity.timeInterval
      }

      await updatePersonalActivity(editingActivity.id, updateData)
      setEditModalOpen(false)
      setEditingActivity(null)
      setRefreshKey(k => k + 1)
      showToast.success("Activity updated successfully")
    } catch (error) {
      console.error("Error updating activity:", error)
      // Error is already handled in the context
    }
  }

  const handleCancelEdit = () => {
    setEditModalOpen(false)
    setEditingActivity(null)
    setEditDescription("")
  }

  const handleActivityUpdate = async (activityId: string, status: "pending" | "ongoing" | "completed") => {
    try {
      await updatePersonalActivity(activityId, { status })
      setRefreshKey(k => k + 1)
      showToast.success("Activity updated successfully")
    } catch (error) {
      console.error("Error updating activity:", error)
      // Error handling is done in the context
    }
  }

  const handleActivityDelete = async (activityId: string) => {
    try {
      await deletePersonalActivity(activityId)
      setRefreshKey(k => k + 1)
      showToast.success("Activity deleted successfully")
    } catch (error) {
      console.error("Error deleting activity:", error)
      // Error handling is done in the context
    }
  }

  const downloadReport = () => {
    try {
      const data = activityTable.map(slot => ({
        Time: slot.timeLabel,
        Status: slot.status,
        Activities: slot.activities.map((a: any) => `${a.description} (${a.status})`).join('; '),
        'Activity Count': slot.activities.length
      }))

      const csvContent = [
        ['Time Slot', 'Status', 'Activities', 'Activity Count'],
        ...data.map(row => [row.Time, row.Status, row.Activities, row['Activity Count']])
      ].map(e => e.join(',')).join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `activity-report-${selectedDate}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      
      showToast.success("Report downloaded successfully")
    } catch (error) {
      console.error("Failed to download report:", error)
      showToast.error("Failed to download report")
    }
  }
  
  const unreadCount = notifications.filter((n) => !n.read).length

  if (!isClient || personalActivitiesLoading) {
    return <LoadingScreen />
  }
  
  const isAnyActivityLogged = activityTable.some(entry => 
    entry.status !== 'empty' || entry.activities.length > 0
  )

  if (!user) {
    return <LoadingScreen />
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-red-50/30 to-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            
            {/* Left Side - Company Branding & User Info */}
            <div className="flex items-center gap-4 min-w-0 flex-1">
              {/* Company Logo */}
              <div className="relative shrink-0">
                <div className="w-12 h-12 bg-linear-to-br from-red-600 to-red-700 rounded-2xl flex items-center justify-center shadow-lg shadow-red-200/50">
                  <Activity className="w-7 h-7 text-white" />
                </div>
              </div>

              {/* User Welcome */}
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight truncate">
                  Welcome, {userName}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-500">
                  <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{user.region || "N/A"} / {user.branch || "N/A"}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 border border-green-300">
                    {user.role || "Employee"}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-300">
                    {getDepartmentName()}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-300">
                    {getPosition()}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Side - Stats, Notifications & Actions */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              
              {/* Missed Slots Indicator */}
              {missedSlots > 0 && (
                <div className="hidden md:flex items-center gap-2 bg-linear-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-xl px-4 py-2.5 shadow-sm">
                  <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center shadow-md">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">Missed Slots</p>
                    <p className="text-2xl font-bold text-amber-900 leading-none">{missedSlots}</p>
                  </div>
                </div>
              )}

              {/* Mobile Missed Slots Badge */}
              {missedSlots > 0 && (
                <button
                  onClick={() => {
                    setSelectedDate(normalizeDateForComparison(new Date()))
                    showToast.info("Switched to today's view")
                  }}
                  className="md:hidden relative p-2.5 hover:bg-amber-50 rounded-xl transition-all duration-200 group border-2 border-amber-300 bg-amber-50"
                >
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {missedSlots}
                  </span>
                </button>
              )}
              
              {/* Notifications Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className="relative p-2.5 hover:bg-slate-100 rounded-xl transition-all duration-200 group">
                    <Bell className="w-5 h-5 text-slate-600 group-hover:text-red-600 transition-colors" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0.5 right-0.5 bg-red-600 text-white text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold animate-pulse px-1">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 sm:w-96 p-0 mr-4 shadow-xl rounded-xl" align="end">
                  <NotificationCenter
                    userId={userId}
                    onNotificationsUpdate={() => {
                      // TODO: Load notifications from API
                    }}
                  />
                </PopoverContent>
              </Popover>

              {/* Logout Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={onLogout}
                className="gap-2 border-slate-300 hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all duration-200 h-10"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </div>
          </div>
        </div>

      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Date Selection and View Controls */}
        <div className="mb-8">
          <Card className="border-slate-200/80 shadow-lg bg-white/90 backdrop-blur-sm transition-all duration-300 hover:shadow-xl">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
                
                {/* Date Information Section & Today Button */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 flex-1">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-linear-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-300">
                      <Calendar className="w-7 h-7 text-white" />
                    </div>
                    
                    <div className="space-y-0.5">
                      <h3 className="text-slate-800 tracking-tight">
                        {new Date(selectedDate + 'T00:00:00Z').toLocaleDateString('en-NG', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </h3>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-slate-600">Selected Date</span>
                        
                        {!isToday && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedDate(normalizeDateForComparison(new Date()))
                              showToast.success("Switched to today's view")
                            }}
                            className="h-8 px-3 text-xs bg-red-50 text-red-700 border-red-300 hover:bg-red-100 transition-all duration-200 font-semibold rounded-lg shadow-sm"
                          >
                            <Clock className="w-3.5 h-3.5 mr-1" />
                            Go to Today
                          </Button>
                        )}
                        {isToday && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-300">
                            <Clock className="w-3 h-3 mr-1"/> Live View
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Stats Display */}
                  {personalActivitiesStats && (
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-slate-800">{personalActivitiesStats.total || 0}</div>
                        <div className="text-xs text-slate-500">Total Activities</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{personalActivitiesStats.completed || 0}</div>
                        <div className="text-xs text-slate-500">Completed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{personalActivitiesStats.ongoing || 0}</div>
                        <div className="text-xs text-slate-500">Ongoing</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-amber-600">{personalActivitiesStats.pending || 0}</div>
                        <div className="text-xs text-slate-500">Pending</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* View Controls Section */}
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  
                  {/* View Only Mode Badge */}
                  {!isToday && (
                    <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-xl border border-amber-300 shadow-inner">
                      <Eye className="w-4 h-4" />
                      <span className="text-sm font-medium">View Only Mode</span>
                    </div>
                  )}
                  
                  {/* Calendar Dialog Trigger */}
                  <Dialog open={showCalendarModal} onOpenChange={setShowCalendarModal}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-10 px-5 gap-2 bg-white text-red-600 border-red-300 hover:bg-red-50 transition-all duration-200 shadow-md hover:shadow-lg rounded-xl font-semibold"
                      >
                        <BarChart2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Activity Calendar</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md p-0 border-0 shadow-xl rounded-2xl overflow-hidden">
                      <DialogHeader className="p-6 bg-linear-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                        <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-3">
                          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-white" />
                          </div>
                          Activity Calendar
                        </DialogTitle>
                      </DialogHeader>
                      <ActivityCalendar 
                        employeeId={userId}
                        selectedDate={new Date(selectedDate + 'T00:00:00Z')}
                        onDateSelect={(date) => {
                          const newDateString = normalizeDateForComparison(date)
                          const todayNormalized = normalizeDateForComparison(new Date())
                          
                          if (newDateString <= todayNormalized) {
                            setSelectedDate(newDateString)
                            setShowCalendarModal(false)
                            showToast.success(`Switched to ${newDateString}`)
                          } else {
                            showToast.warning("Cannot select future dates")
                          }
                        }}
                        maxDate={new Date(todayNormalized + 'T00:00:00Z')}
                        activityDates={activityDates}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Activity Logger */}
          <div className="lg:col-span-1">
            <Card className="border-slate-200/60 shadow-sm h-full">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <Activity className="w-5 h-5 text-red-600" />
                  Create Daily Activity
                </CardTitle>
                <CardDescription className="text-slate-600">
                  {isToday ? "Log your activities for today" : "View activities for selected date"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isToday ? (
                  <div className="space-y-4">
                    {/* Current Time Display */}
                    <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-md border border-slate-200">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <span className="font-medium">Current Lagos Time:</span>
                      </div>
                      <div className="mt-1 text-center">
                        <span className="text-lg font-semibold text-slate-800">
                          {new Date().toLocaleTimeString('en-NG', { 
                            timeZone: TIMEZONE,
                            hour: '2-digit', 
                            minute: '2-digit',
                            hour12: true 
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Time Slot Dropdown */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Time Interval *
                      </label>
                      <Select 
                        value={selectedTimeSlot} 
                        onValueChange={setSelectedTimeSlot}
                        disabled={personalActivitiesLoading}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select time slot (8:00 AM - 5:30 PM)" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTimeSlots.length > 0 ? (
                            availableTimeSlots.map((slot) => {
                              const slotIndex = timeIntervalToSlotIndex(slot)
                              const isPast = slotIndex < currentSlotIndex
                              const isCurrent = slotIndex === currentSlotIndex
                              
                              return (
                                <SelectItem 
                                  key={slot} 
                                  value={slot}
                                  disabled={isPast && !isCurrent}
                                  className={isCurrent ? "bg-red-50 text-red-700 font-semibold" : ""}
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <span>{slot}</span>
                                    {isCurrent && (
                                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                                        Current
                                      </span>
                                    )}
                                  </div>
                                </SelectItem>
                              )
                            })
                          ) : (
                            <div className="px-2 py-4 text-center text-sm text-slate-500">
                              No more time slots available for today
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                      <p className="mt-1 text-sm text-slate-500">
                        Available slots: {availableTimeSlots.length} of {timeSlots.length}
                      </p>
                    </div>

                    {/* Activity Description */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Description *
                      </label>
                      <Textarea
                        placeholder="What are you working on?"
                        value={activityDescription}
                        onChange={(e) => setActivityDescription(e.target.value)}
                        className="min-h-[100px] resize-none"
                        disabled={personalActivitiesLoading}
                      />
                    </div>

                    {/* Status Dropdown */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Status
                      </label>
                      <Select 
                        value={activityStatus} 
                        onValueChange={(value: "pending" | "ongoing" | "completed") => 
                          setActivityStatus(value)
                        }
                        disabled={personalActivitiesLoading}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="ongoing">Ongoing</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Log Activity Button */}
                    <Button
                      onClick={handleLogActivity}
                      disabled={!selectedTimeSlot || !activityDescription.trim() || personalActivitiesLoading}
                      className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md transition-all duration-200"
                    >
                      {personalActivitiesLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Logging...
                        </>
                      ) : (
                        "Log Activity"
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Eye className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-semibold text-lg">View Only Mode</p>
                    <p className="text-slate-400 text-sm mt-1">
                      You can only create activities for today
                    </p>
                    <div className="mt-6 text-sm text-slate-600 bg-slate-50 p-4 rounded-md border border-slate-200">
                      <p className="font-medium">Current Lagos Time:</p>
                      <p className="text-lg font-semibold mt-1">
                        {new Date().toLocaleTimeString('en-NG', { 
                          timeZone: TIMEZONE,
                          hour: '2-digit', 
                          minute: '2-digit',
                          hour12: true 
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Activity Summary */}
          <div className="lg:col-span-2"> 
            <Card className="border-slate-200/60 shadow-sm h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-slate-800">
                      <Table className="w-5 h-5 text-red-600" />
                      Activity Summary
                    </CardTitle>
                    <CardDescription className="text-slate-600">
                      {isToday ? "Today's activities" : `Activities for ${selectedDate}`}
                    </CardDescription>
                  </div>
                  {isAnyActivityLogged && (
                    <Button 
                      onClick={downloadReport}
                      variant="outline" 
                      size="sm"
                      className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">Export</span>
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isAnyActivityLogged ? (
                  <div className="space-y-6">
                    {/* Activity Timeline - Simplified */}
                    <div className="border border-slate-200 rounded-lg">
                      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
                        <h3 className="text-sm font-semibold text-slate-700">Activity Timeline</h3>
                      </div>
                      
                      <div className="divide-y divide-slate-100">
                        {activityTable.map(entry => {
                          const isCurrentSlot = entry.slotIndex === currentSlotIndex
                          const isPastSlot = entry.slotIndex < currentSlotIndex
                          
                          return (
                            <div key={entry.slotIndex} className={`p-4 ${isCurrentSlot ? 'bg-red-50/30' : ''}`}>
                              <div className="flex items-start gap-3">
                                {/* Time Slot */}
                                <div className="w-20 shrink-0">
                                  <div className="text-sm font-medium text-slate-800">{entry.timeLabel.split('-')[0]}</div>
                                  <div className="text-xs text-slate-500">{entry.timeLabel.split('-')[1]}</div>
                                </div>
                                
                                {/* Activity Content */}
                                <div className="flex-1">
                                  {/* Status Indicator */}
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                      entry.status === "present" ? "bg-green-100 text-green-800" :
                                      entry.status === "absent" ? "bg-red-100 text-red-800" :
                                      entry.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                                      "bg-slate-100 text-slate-800"
                                    }`}>
                                      {entry.status}
                                    </span>
                                    {isCurrentSlot && (
                                      <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-700 font-medium">
                                        Current
                                      </span>
                                    )}
                                  </div>
                                  
                                  {/* Activities List */}
                                  {entry.activities.length > 0 ? (
                                    <div className="space-y-2">
                                      {entry.activities.map(activity => (
                                        <div key={activity.id} className="bg-white rounded border border-slate-200 p-3">
                                          <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                              <p className="text-sm font-medium text-slate-800 mb-1">{activity.description}</p>
                                              <div className="flex items-center gap-2">
                                                <span className={`text-xs px-2 py-1 rounded ${
                                                  activity.status === "completed" ? "bg-green-100 text-green-800" :
                                                  activity.status === "ongoing" ? "bg-blue-100 text-blue-800" :
                                                  "bg-yellow-100 text-yellow-800"
                                                }`}>
                                                  {activity.status}
                                                </span>
                                                {activity.priority && (
                                                  <span className={`text-xs px-2 py-1 rounded ${
                                                    activity.priority === "high" ? "bg-red-100 text-red-800" :
                                                    activity.priority === "medium" ? "bg-yellow-100 text-yellow-800" :
                                                    "bg-green-100 text-green-800"
                                                  }`}>
                                                    {activity.priority}
                                                  </span>
                                                )}
                                                {activity.category && (
                                                  <span className={`text-xs px-2 py-1 rounded bg-gray-100 text-gray-800`}>
                                                    {activity.category}
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                            {isToday && (
                                              <div className="flex gap-1 ml-2">
                                                {/* Edit Button */}
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  onClick={() => handleEditClick(activity)}
                                                  disabled={personalActivitiesLoading}
                                                  className="h-7 w-7 p-0 text-blue-600"
                                                  title="Edit activity"
                                                >
                                                  <Edit className="w-3 h-3" />
                                                </Button>
                                                
                                                {/* Status Update Button */}
                                                {activity.status !== "completed" && (
                                                  <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleActivityUpdate(activity.id, 
                                                      activity.status === "pending" ? "ongoing" : 
                                                      activity.status === "ongoing" ? "completed" : "pending"
                                                    )}
                                                    disabled={personalActivitiesLoading}
                                                    className="h-7 w-7 p-0"
                                                    title={activity.status === "pending" ? "Start activity" : 
                                                           activity.status === "ongoing" ? "Complete activity" : "Mark as pending"}
                                                  >
                                                    {activity.status === "pending" ? "▶" : 
                                                     activity.status === "ongoing" ? "✓" : "↺"}
                                                  </Button>
                                                )}
                                                
                                                {/* Delete Button */}
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  className="h-7 w-7 p-0 text-red-600"
                                                  onClick={() => handleActivityDelete(activity.id)}
                                                  disabled={personalActivitiesLoading}
                                                  title="Delete activity"
                                                >
                                                  <X className="w-3 h-3" />
                                                </Button>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    isPastSlot && isToday && (
                                      <div className="text-sm text-slate-400 italic">
                                        No activity logged
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                      <BarChart2 className="w-6 h-6 text-slate-400" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-700 mb-2">
                      No Activity Data
                    </h3>
                    <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
                      {isToday 
                        ? "Start logging activities to see them here."
                        : "No activities for this date."}
                    </p>
                    
                    {isToday && (
                      <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 text-left max-w-md mx-auto">
                        <h4 className="text-sm font-medium text-slate-700 mb-2">How to start:</h4>
                        <ol className="space-y-1 text-sm text-slate-600">
                          <li>1. Select a time slot</li>
                          <li>2. Enter activity description</li>
                          <li>3. Set status and click "Log Activity"</li>
                        </ol>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Edit Activity Modal */}
{/* Edit Activity Modal */}
<Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
  <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
    {/* Minimalist Header */}
    <DialogHeader className="p-8 pb-0">
      <div className="space-y-1">
        <DialogTitle className="text-2xl font-bold text-slate-900 tracking-tight">
          Edit Activity
        </DialogTitle>
        <p className="text-slate-500 text-sm">Update your progress and task details.</p>
      </div>
    </DialogHeader>
    
    <div className="p-8 space-y-8">
      
      {/* Status Selection - Redesigned as interactive cards/chips */}
      <div className="space-y-3">
        <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1">
          Activity Status
        </Label>
        <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/50">
          {(['pending', 'ongoing', 'completed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setEditStatus(status)}
              className={`
                relative py-2.5 rounded-xl text-xs font-bold capitalize transition-all duration-200
                ${editStatus === status 
                  ? "bg-white text-[#ec3338] shadow-sm ring-1 ring-black/5" 
                  : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                }
              `}
            >
              {editStatus === status && (
                <span className="absolute top-1 right-2 flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ec3338] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#ec3338]"></span>
                </span>
              )}
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Description Field */}
      <div className="space-y-3">
        <Label htmlFor="edit-description" className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1">
          Activity Description
        </Label>
        <div className="relative group">
          <Textarea
            id="edit-description"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            className="min-h-[120px] p-4 resize-none bg-slate-50 border-transparent focus:bg-white focus:border-[#ec3338]/20 focus:ring-4 focus:ring-[#ec3338]/5 rounded-2xl transition-all duration-300 text-slate-700 leading-relaxed"
            placeholder="What's happening?"
          />
          <div className="absolute bottom-3 right-3">
             <Edit className="w-4 h-4 text-slate-300 group-focus-within:text-[#ec3338]/40 transition-colors" />
          </div>
        </div>
      </div>
    </div>

    {/* Floating Footer Action */}
    <div className="p-8 pt-0">
      <div className="flex flex-col gap-3">
        <Button
          onClick={handleSaveEdit}
          disabled={!editDescription.trim() || personalActivitiesLoading}
          className={`
            w-full h-14 rounded-2xl font-bold text-base transition-all duration-300 shadow-xl
            ${personalActivitiesLoading 
              ? "bg-slate-100 text-slate-400" 
              : "bg-[#ec3338] hover:bg-[#d12d32] text-white hover:shadow-[#ec3338]/30 active:scale-[0.98]"
            }
          `}
        >
          {personalActivitiesLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            "Save Changes"
          )}
        </Button>
        <Button
          variant="ghost"
          onClick={handleCancelEdit}
          className="w-full h-10 rounded-xl text-slate-400 hover:text-slate-600 font-medium"
        >
          Go back
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>
    </div>
  )
}