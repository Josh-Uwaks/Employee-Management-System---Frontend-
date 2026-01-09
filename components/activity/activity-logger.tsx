"use client"

import { useState, useEffect } from "react"
import { StorageService, type ActivityLog } from "@/lib/storage"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Send, AlertTriangle, Clock } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ActivityLoggerProps {
  employeeId: string
  selectedDate: string
  onActivityLogged?: (log: ActivityLog) => void
  readOnly?: boolean
}

interface ActivityEntry {
  id: string
  description: string
  status: "ongoing" | "pending" | "completed"
  timestamp: string
  changeCount?: number
}

export default function ActivityLogger({ employeeId, selectedDate, onActivityLogged, readOnly = false }: ActivityLoggerProps) {
  const [currentSlot, setCurrentSlot] = useState(0)
  const [activityDescription, setActivityDescription] = useState("")
  const [activityStatus, setActivityStatus] = useState<"ongoing" | "pending" | "completed">("ongoing")
  const [isLogging, setIsLogging] = useState(false)
  const [todayLogs, setTodayLogs] = useState<ActivityLog[]>([])
  const [timeToNextSlot, setTimeToNextSlot] = useState<number>(0)

  // Define work hours (8am to 5pm in half-hour slots)
  const WORK_SLOT_START = 16 // 8:00 AM
  const WORK_SLOT_END = 34 // 5:00 PM (Last loggable slot is 4:30 PM - 5:00 PM, index 33)

  useEffect(() => {
    updateCurrentSlot()
    updateLogs()
    updateCountdown()
    
    const timer = setInterval(() => {
      updateCurrentSlot()
      updateLogs()
      updateCountdown()
    }, 1000) // Update every second for countdown

    return () => clearInterval(timer)
  }, [employeeId, selectedDate])

  const updateCurrentSlot = () => {
    const now = new Date()
    const currentHalfHourIndex = now.getHours() * 2 + Math.floor(now.getMinutes() / 30)
    setCurrentSlot(currentHalfHourIndex)
  }

  const updateCountdown = () => {
    const now = new Date()
    const currentMinutes = now.getMinutes()
    const currentSeconds = now.getSeconds()
    
    // Calculate seconds until next half-hour mark
    const minutesUntilNextSlot = 30 - (currentMinutes % 30)
    const secondsUntilNextSlot = (minutesUntilNextSlot * 60) - currentSeconds
    
    setTimeToNextSlot(secondsUntilNextSlot)
  }

  const updateLogs = () => {
    const logs = StorageService.getEmployeeActivity(employeeId, selectedDate)
    setTodayLogs(logs)
  }

  const getCurrentSlotLog = () => {
    return todayLogs.find((log) => log.slotIndex === currentSlot)
  }

  const isCurrentSlotLocked = () => {
    return readOnly;
  }

  const getCurrentActivities = (): ActivityEntry[] => {
    const log = getCurrentSlotLog()
    return log?.activities || []
  }

  const formatCountdown = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getCurrentSlotTimeRange = (): string => {
    const hour = Math.floor(currentSlot / 2)
    const minute = (currentSlot % 2) * 30
    const nextHour = Math.floor((currentSlot + 1) / 2) % 24
    const nextMinute = ((currentSlot + 1) % 2) * 30
    
    const start = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    const end = `${String(nextHour).padStart(2, '0')}:${String(nextMinute).padStart(2, '0')}`
    
    return `${start} - ${end}`
  }

  const submitActivityEntry = () => {
    // Prevent submission if outside work hours
    if (!activityDescription.trim() || isCurrentSlotLocked() || !isWithinWorkHours) return

    setIsLogging(true)
    setTimeout(() => {
      const currentLog = getCurrentSlotLog()
      const currentActivities = getCurrentActivities()

      const newActivity: ActivityEntry = {
        id: Date.now().toString(),
        description: activityDescription.trim(),
        status: activityStatus,
        timestamp: new Date().toISOString(),
        changeCount: 0
      }

      const updatedActivities = [...currentActivities, newActivity]

      // Always set slot status to "present" when adding activities
      const log = StorageService.logActivity(
        employeeId,
        selectedDate,
        currentSlot, // hour parameter
        currentSlot, // slotIndex parameter (same as hour for now)
        "present", // Auto-set to present when activity is logged
        updatedActivities
      )

      setActivityDescription("")
      setActivityStatus("ongoing") // Reset to default
      updateLogs()
      if (onActivityLogged) onActivityLogged(log)
      setIsLogging(false)
    }, 300)
  }

  const isWithinWorkHours = currentSlot >= WORK_SLOT_START && currentSlot < WORK_SLOT_END
  const isLocked = isCurrentSlotLocked()

  return (
    <Card className="border-slate-200/60 shadow-sm h-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-slate-800">
          <Send className="w-5 h-5 text-[#EC3338]" />
          Activity Logger
        </CardTitle>
        <CardDescription className="text-slate-600">
          Log your daily activities and tasks
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Slot & Countdown Display */}
        {isWithinWorkHours && !isLocked && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">Current Slot</span>
              </div>
              <div className="text-xs text-slate-500">{getCurrentSlotTimeRange()}</div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">Time until next slot:</span>
              <div className={`text-sm font-bold ${
                timeToNextSlot < 300 ? 'text-red-600' : 
                timeToNextSlot < 600 ? 'text-amber-600' : 'text-green-600'
              }`}>
                {formatCountdown(timeToNextSlot)}
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="mt-2 w-full bg-slate-200 rounded-full h-1.5">
              <div 
                className="bg-red-600 h-1.5 rounded-full transition-all duration-1000"
                style={{ 
                  width: `${((1800 - timeToNextSlot) / 1800) * 100}%` 
                }}
              />
            </div>
          </div>
        )}

        {/* Activity Entry Form */}
        {(!isLocked && isWithinWorkHours) && (
          <div className="space-y-4">
            <div className="space-y-3">
              {/* Description Input */}
              <div>
                <label className="text-sm text-slate-600 mb-2 block">Activity Description</label>
                <Textarea
                  placeholder="Describe your activity... (e.g., I printed papers for the directors)"
                  value={activityDescription}
                  onChange={(e) => setActivityDescription(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
              </div>

              {/* Status Selector */}
              <div>
                <label className="text-sm text-slate-600 mb-2 block">Status</label>
                <Select
                  value={activityStatus}
                  onValueChange={(value: "ongoing" | "pending" | "completed") => setActivityStatus(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ongoing" className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        Ongoing
                      </div>
                    </SelectItem>
                    <SelectItem value="pending" className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                        Pending
                      </div>
                    </SelectItem>
                    <SelectItem value="completed" className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Completed
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Submit Button */}
              <Button 
                onClick={submitActivityEntry} 
                disabled={!activityDescription.trim() || isLogging || !isWithinWorkHours}
                className="w-full gap-2 bg-[#EC3338] hover:bg-[#d42c31]"
                size="lg"
              >
                <Send className="w-4 h-4" />
                {isLogging ? "Submitting..." : "Submit Activity"}
              </Button>
            </div>
          </div>
        )}

        {/* Display message when outside work hours */}
        {(!isWithinWorkHours && !isLocked) && (
            <div className="text-center py-8 border-2 border-dashed border-amber-200 bg-amber-50 rounded-lg">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="text-sm text-amber-700 font-medium">Outside Work Hours</p>
              <p className="text-xs text-amber-600 mt-1">Activity logging is restricted to 8:00 AM to 5:00 PM.</p>
            </div>
        )}

        {isLocked && (
          <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg">
            <Send className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">View Only Mode</p>
            <p className="text-xs text-slate-400 mt-1">You can only view activities for past dates</p>
          </div>
        )}

        {/* Quick Stats */}
        <div className="pt-4 border-t border-slate-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-blue-600">
                {todayLogs.flatMap(log => log.activities || []).filter(activity => activity.status === 'ongoing').length}
              </div>
              <div className="text-xs text-slate-600 font-medium">Ongoing</div>
            </div>
            <div>
              <div className="text-lg font-bold text-amber-600">
                {todayLogs.flatMap(log => log.activities || []).filter(activity => activity.status === 'pending').length}
              </div>
              <div className="text-xs text-slate-600 font-medium">Pending</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">
                {todayLogs.flatMap(log => log.activities || []).filter(activity => activity.status === 'completed').length}
              </div>
              <div className="text-xs text-slate-600 font-medium">Completed</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}