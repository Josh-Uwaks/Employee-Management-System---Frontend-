"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/authContext"
import { StorageService, ActivityService } from "@/lib/storage"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LogOut, Bell, Calendar, Activity, Clock, AlertTriangle, Table, Eye, BarChart2, Download } from "lucide-react"
import ActivityLogger from "@/components/activity/activity-logger"
import ActivityTable from "@/components/activity/activity-table"
import ActivityCalendar from "../activity/activity-calender"
import NotificationCenter from "@/components/notifications/notification-center"
import LoadingScreen from "@/components/loader/loader"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { showToast } from "@/lib/toast"

// 🔑 SHADCN/UI Calendar Dependencies
import { format } from "date-fns"

// --- UTILITY FUNCTIONS ---

// NOTE: Using Africa/Lagos timezone for all time-based logic.
const TIMEZONE = 'Africa/Lagos' 

const getDatesWithActivity = (employeeId: string): Date[] => {
    const mockDates = [
        "2025-11-01", "2025-11-02", "2025-11-04", "2025-11-05", // Example dates
    ].map(d => new Date(d))
    return mockDates
}

// --- EMPLOYEE DASHBOARD INTERFACES AND CONSTANTS ---

interface EmployeeDashboardProps {
  onLogout: () => void
}

interface ActivityTableEntryHalfHour {
  slotIndex: number
  timeLabel: string
  status: "present" | "absent" | "pending" | "empty"
  activities: any[] // Changed from ActivityEntry[] to any[]
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

// --- MAIN DASHBOARD COMPONENT ---

export default function EmployeeDashboard({ onLogout }: EmployeeDashboardProps) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<any[]>([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [isClient, setIsClient] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [missedSlots, setMissedSlots] = useState<number>(0)
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  const [activityTable, setActivityTable] = useState<ActivityTableEntryHalfHour[]>([])
  const [activityDates, setActivityDates] = useState<Date[]>(getDatesWithActivity(user?._id || ""))

  const isToday = selectedDate === new Date().toISOString().split("T")[0]
  const todayDateString = new Date().toISOString().split("T")[0]

  const userName = user ? `${user.first_name} ${user.last_name}` : "Employee"
  const userId = user?._id || ""

  useEffect(() => {
    if (!user) return
    
    setIsClient(true)
    loadData()
    
    // Check for missed activities every minute
    const interval = setInterval(() => {
      try {
        ActivityService.checkMissedActivities()
      } catch (e) {
        console.warn("ActivityService.checkMissedActivities failed", e)
      }
      loadData()
    }, 60000)
    
    return () => clearInterval(interval)
  }, [userId, selectedDate, refreshKey])

  const loadData = () => {
    if (!userId) return
    
    const notifs = StorageService.getNotifications(userId)
    setNotifications(notifs)
    
    const today = new Date().toISOString().split('T')[0]
    const now = new Date()
    
    // 🔑 CALCULATE CURRENT TIME SLOT INDEX IN AFRICA/LAGOS TIMEZONE (WAT)
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

    const currentHalfHourIndex = currentHourInLagos * 2 + Math.floor(currentMinuteInLagos / 30)

    const logs = StorageService.getEmployeeActivity(userId, today)
    
    // With work slot restriction, maxRelevantSlot is the last half-hour that has passed
    const maxRelevantSlot = Math.min(currentHalfHourIndex - 1, WORK_SLOT_END - 1)
    
    let missed = 0;
    
    // Check all slots from 8:00 (slot 16) up to the slot before 'now', and also before WORK_SLOT_END.
    for (let i = WORK_SLOT_START; i <= maxRelevantSlot; i++) {
        if (i >= WORK_SLOT_END) continue; 
        
        const matchingLog = logs.find(log => log.slotIndex === i);
        if (!matchingLog || matchingLog.status === 'empty' || matchingLog.status === 'absent') {
            missed++;
        }
    }
    
    setMissedSlots(Math.max(0, missed))
    updateActivityTable()
    setActivityDates(getDatesWithActivity(userId))
  }

  const updateActivityTable = () => {
    if (!userId) return
    
    const workSlots: ActivityTableEntryHalfHour[] = Array.from({ length: TOTAL_WORK_SLOTS }, (_, index) => {
      const slotIndex = index + WORK_SLOT_START
      return {
        slotIndex: slotIndex,
        timeLabel: slotIndexToTimeLabel(slotIndex),
        status: "empty",
        activities: [],
      }
    })
    
    const logs = StorageService.getEmployeeActivity(userId, selectedDate)

    const tableData = workSlots.map(workSlot => {
      const log = logs.find(l => l.slotIndex === workSlot.slotIndex)
      
      if (log) {
        return {
          ...workSlot,
          status: log.status,
          activities: (log.activities || []).map((activity: any) => ({
            ...activity,
            changeCount: activity.changeCount || 0
          }))
        } as ActivityTableEntryHalfHour
      }
      
      const today = new Date().toISOString().split('T')[0]
      const now = new Date()
      
      // 🔑 RE-CALCULATE CURRENT HALF HOUR INDEX FOR CONSISTENCY (LAGOS TIME)
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
      const currentHalfHourIndex = currentHourInLagos * 2 + Math.floor(currentMinuteInLagos / 30)
      
      // Mark as 'absent' if date has passed or slot index is before current time
      if (selectedDate < today || (selectedDate === today && workSlot.slotIndex < currentHalfHourIndex)) {
          return {
            ...workSlot,
            status: "absent"
          } as ActivityTableEntryHalfHour
      }
      
      return workSlot as ActivityTableEntryHalfHour
    }).filter(slot => slot.slotIndex >= WORK_SLOT_START && slot.slotIndex < WORK_SLOT_END)
    
    setActivityTable(tableData)
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

  if (!isClient) {
    return <LoadingScreen />
  }
  
  const ACTION_BUTTON_CLASS = "bg-red-600 text-white hover:bg-red-700 shadow-sm"
  const ACTION_BUTTON_DEFAULT = "bg-slate-200 text-slate-700 hover:bg-slate-300 border-slate-300"
  
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
                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
                  <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{user.region || "N/A"} / {user.branch || "N/A"}</span>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 border border-green-300 ml-2">
                    {user.role || "Employee"}
                  </span>
                  {user.department && (
                    <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-300 ml-2">
                      {typeof user.department === 'object' ? user.department.name : "Department"}
                    </span>
                  )}
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
                    setSelectedDate(new Date().toISOString().split('T')[0])
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
                    onNotificationsUpdate={loadData}
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
                      <h3 className=" text-slate-800 tracking-tight">
                        {new Date(selectedDate).toLocaleDateString('en-NG', { 
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
                              setSelectedDate(new Date().toISOString().split('T')[0])
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
                        selectedDate={new Date(selectedDate)}
                        onDateSelect={(date) => {
                          const newDateString = format(date, "yyyy-MM-dd")
                          if (newDateString <= todayDateString) {
                            setSelectedDate(newDateString)
                            setShowCalendarModal(false)
                            showToast.success(`Switched to ${newDateString}`)
                          } else {
                            showToast.warning("Cannot select future dates")
                          }
                        }}
                        maxDate={new Date(todayDateString)}
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
            <ActivityLogger 
              employeeId={userId} 
              selectedDate={selectedDate}
              onActivityLogged={() => {
                setRefreshKey((k) => k + 1)
                loadData()
                showToast.success("Activity logged successfully")
              }}
              readOnly={!isToday}
            />
          </div>

          {/* Right Column - Activity Table */}
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
                      Logged activities in 30-minute intervals (8:00 AM - 5:30 PM)
                    </CardDescription>
                  </div>
                  {activityTable.length > 0 && isAnyActivityLogged && (
                    <Button 
                      onClick={downloadReport}
                      variant="outline" 
                      size="sm"
                      className="gap-2 hidden sm:flex text-red-600 border-red-200 hover:bg-red-50/50"
                    >
                      <Download className="w-4 h-4" />
                      Export
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isAnyActivityLogged ? (
                    <ActivityTable 
                        data={activityTable}
                        selectedDate={selectedDate}
                        employeeId={userId}
                        onActivityUpdate={() => {
                            setRefreshKey((k) => k + 1)
                            loadData()
                            showToast.success("Activity updated successfully")
                        }}
                        readOnly={!isToday}
                        ACTION_BUTTON_CLASS={ACTION_BUTTON_CLASS}
                        ACTION_BUTTON_DEFAULT={ACTION_BUTTON_DEFAULT}
                    />
                ) : (
                    <div className="text-center py-12">
                        <BarChart2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 font-semibold text-lg">No Activity Logged</p>
                        <p className="text-slate-400 text-sm mt-1">
                            {isToday 
                                ? "Start logging your activities to populate this report." 
                                : "No activities were logged for this day."}
                        </p>
                    </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}